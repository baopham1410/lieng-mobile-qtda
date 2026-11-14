from __future__ import annotations

import json
import threading
from functools import lru_cache
from typing import Any

from PIL import Image, ImageOps
from ultralytics import YOLO

from .config import (
    CLASSES_PATH,
    WEIGHTS_PATH,
    YOLO_CONF_THRESHOLD,
    YOLO_DEVICE,
    YOLO_FULL_IMGSZ,
    YOLO_IOU_THRESHOLD,
    YOLO_TILE_CONF_THRESHOLD,
    YOLO_TILE_IMGSZ,
)

_MODEL_LOCK = threading.Lock()
_YOLO_MODEL: YOLO | None = None


@lru_cache(maxsize=1)
def load_class_config() -> dict[str, Any]:
    if CLASSES_PATH.is_file():
        with CLASSES_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "weights": WEIGHTS_PATH.name,
        "alias_map": {
            "cracked_screenrotation": "cracked_screen",
            "cracked_screen": "cracked_screen",
            "damagedrotation": "damaged_screen",
            "damaged": "damaged_screen",
            "damaged_screen": "damaged_screen",
            "goodrotation": "good",
            "good": "good",
            "scratch": "scratch",
            "dent": "dent",
        },
        "canonical_classes": {},
    }


def get_yolo_model() -> YOLO:
    global _YOLO_MODEL
    if _YOLO_MODEL is not None:
        return _YOLO_MODEL

    with _MODEL_LOCK:
        if _YOLO_MODEL is None:
            if not WEIGHTS_PATH.is_file():
                raise FileNotFoundError(f"YOLO weights not found: {WEIGHTS_PATH}")
            _YOLO_MODEL = YOLO(str(WEIGHTS_PATH))
    return _YOLO_MODEL


def yolo_status() -> dict[str, Any]:
    cfg = load_class_config()
    return {
        "weights": WEIGHTS_PATH.name,
        "weights_exists": WEIGHTS_PATH.is_file(),
        "loaded": _YOLO_MODEL is not None,
        "raw_names": cfg.get("raw_names", {}),
        "alias_map": cfg.get("alias_map", {}),
    }


def map_class_name(raw_name: str) -> tuple[str, str]:
    cfg = load_class_config()
    alias_map: dict[str, str] = cfg.get("alias_map", {})
    canonical = alias_map.get(raw_name, alias_map.get(raw_name.lower(), raw_name))
    meta = cfg.get("canonical_classes", {}).get(canonical, {})
    label = meta.get("label", canonical)
    return canonical, label


def _box_iou(a: list[float], b: list[float]) -> float:
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if inter <= 0:
        return 0.0
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def _containment_ratio(inner: list[float], outer: list[float]) -> float:
    ix1, iy1 = max(inner[0], outer[0]), max(inner[1], outer[1])
    ix2, iy2 = min(inner[2], outer[2]), min(inner[3], outer[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    inner_area = max(0.0, inner[2] - inner[0]) * max(0.0, inner[3] - inner[1])
    return inter / inner_area if inner_area > 0 else 0.0


def _merge_multiscale_detections(
    raw_boxes: list[dict[str, Any]],
    img_width: int,
    img_height: int,
    iou_thr: float = 0.40,
) -> list[dict[str, Any]]:
    img_area = float(max(1, img_width * img_height))
    ordered = sorted(raw_boxes, key=lambda d: d["conf"], reverse=True)
    kept: list[dict[str, Any]] = []

    for cand in ordered:
        duplicate = False
        for prev in kept:
            if cand["canonical"] == prev["canonical"] and _box_iou(cand["xyxy"], prev["xyxy"]) > iou_thr:
                duplicate = True
                break
        if not duplicate:
            kept.append(cand)

    # Drop giant >55% macro box if tighter localized boxes of the same class sit inside it
    final: list[dict[str, Any]] = []
    for cand in kept:
        x1, y1, x2, y2 = cand["xyxy"]
        area_frac = ((x2 - x1) * (y2 - y1)) / img_area
        if area_frac > 0.55 and cand["canonical"] != "good":
            has_tighter_child = any(
                other is not cand
                and other["canonical"] == cand["canonical"]
                and (((other["xyxy"][2] - other["xyxy"][0]) * (other["xyxy"][3] - other["xyxy"][1])) / img_area) < 0.45
                and _containment_ratio(other["xyxy"], cand["xyxy"]) >= 0.70
                for other in kept
            )
            if has_tighter_child:
                continue
        final.append(cand)

    return final


def infer_images_detailed(
    slot_images: dict[str, Image.Image],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    if not slot_images:
        return [], {}

    model = get_yolo_model()
    detections: list[dict[str, Any]] = []
    slot_meta: dict[str, dict[str, Any]] = {}
    idx = 0

    for slot, img in slot_images.items():
        rgb = ImageOps.exif_transpose(img).convert("RGB")
        width, height = rgb.size
        slot_defects = 0
        slot_good = 0
        raw_candidates: list[dict[str, Any]] = []

        # Pass 1: High-res full frame (960px) to capture cracks & screen damage
        full_results = model.predict(
            source=rgb,
            conf=YOLO_CONF_THRESHOLD,
            iou=YOLO_IOU_THRESHOLD,
            imgsz=YOLO_FULL_IMGSZ,
            device=YOLO_DEVICE,
            verbose=False,
        )
        if full_results and full_results[0].boxes is not None:
            names = full_results[0].names or getattr(model, "names", {}) or {}
            for box in full_results[0].boxes:
                cls_id = int(box.cls[0].item())
                raw_name = str(names.get(cls_id, cls_id))
                canonical, label = map_class_name(raw_name)
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                raw_candidates.append(
                    {
                        "canonical": canonical,
                        "raw_name": raw_name,
                        "label": label,
                        "conf": float(box.conf[0].item()),
                        "xyxy": [
                            max(0.0, x1),
                            max(0.0, y1),
                            min(float(width), x2),
                            min(float(height), y2),
                        ],
                    }
                )

        # Pass 2: 2x2 overlapping tiles batch (60%x60%, 20% overlap) for fine scratches/cracks
        if width >= 128 and height >= 128:
            crops: list[Image.Image] = []
            offsets: list[tuple[int, int]] = []
            for row in range(2):
                for col in range(2):
                    x0 = int(col * width * 0.4)
                    y0 = int(row * height * 0.4)
                    x1 = min(width, int(x0 + width * 0.6))
                    y1 = min(height, int(y0 + height * 0.6))
                    if (x1 - x0) >= 64 and (y1 - y0) >= 64:
                        crops.append(rgb.crop((x0, y0, x1, y1)))
                        offsets.append((x0, y0))

            if crops:
                tile_results = model.predict(
                    source=crops,
                    conf=YOLO_TILE_CONF_THRESHOLD,
                    iou=YOLO_IOU_THRESHOLD,
                    imgsz=YOLO_TILE_IMGSZ,
                    device=YOLO_DEVICE,
                    verbose=False,
                )
                for tr, (ox, oy) in zip(tile_results, offsets):
                    if tr.boxes is None:
                        continue
                    names = tr.names or getattr(model, "names", {}) or {}
                    for box in tr.boxes:
                        cls_id = int(box.cls[0].item())
                        raw_name = str(names.get(cls_id, cls_id))
                        canonical, label = map_class_name(raw_name)
                        bx1, by1, bx2, by2 = [float(v) for v in box.xyxy[0].tolist()]
                        raw_candidates.append(
                            {
                                "canonical": canonical,
                                "raw_name": raw_name,
                                "label": label,
                                "conf": float(box.conf[0].item()),
                                "xyxy": [
                                    max(0.0, ox + bx1),
                                    max(0.0, oy + by1),
                                    min(float(width), ox + bx2),
                                    min(float(height), oy + by2),
                                ],
                            }
                        )

        merged = _merge_multiscale_detections(raw_candidates, width, height)
        for item in merged:
            x1, y1, x2, y2 = item["xyxy"]
            w = max(0.0, x2 - x1)
            h = max(0.0, y2 - y1)
            canonical = item["canonical"]
            is_defect = canonical != "good"
            if is_defect:
                slot_defects += 1
            else:
                slot_good += 1

            idx += 1
            detections.append(
                {
                    "id": f"det-{slot}-{idx}",
                    "class": canonical,
                    "raw_class": item["raw_name"],
                    "label": item["label"],
                    "confidence": round(item["conf"], 4),
                    "is_defect": is_defect,
                    "bbox": [round(x1, 1), round(y1, 1), round(w, 1), round(h, 1)],
                    "bbox_norm": [
                        round((x1 / width) * 100, 2) if width else 0.0,
                        round((y1 / height) * 100, 2) if height else 0.0,
                        round((w / width) * 100, 2) if width else 0.0,
                        round((h / height) * 100, 2) if height else 0.0,
                    ],
                    "image_width": width,
                    "image_height": height,
                    "image": slot,
                    "confirmed": True,
                }
            )

        slot_meta[slot] = {
            "width": width,
            "height": height,
            "defect_count": slot_defects,
            "good_count": slot_good,
            "inspected": True,
        }

    return detections, slot_meta


def infer_images(slot_images: dict[str, Image.Image]) -> list[dict[str, Any]]:
    detections, _ = infer_images_detailed(slot_images)
    return detections
