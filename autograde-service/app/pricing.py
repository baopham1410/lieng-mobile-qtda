from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any

from .config import PRICING_PATH

GRADE_META = {
    "A": ("Loại 1 (Like New 99%)", "loai_1_like_new"),
    "B": ("Loại 2 (95% - 98%)", "loai_2_scratch"),
    "C": ("Loại 3 (Cấn / Vỡ kính)", "loai_3_dent_crack"),
    "D": ("Loại 4 (Hỏng nặng)", "loai_4_heavy"),
    "reject": ("Từ chối thu mua", None),
}

MODEL_TO_PARTS_GROUP = {
    "iphone se (gen 2 - 2020)": "iPhone SE 2 / SE 3",
    "iphone se (gen 3 - 2022)": "iPhone SE 2 / SE 3",
    "iphone x": "iPhone X / XR / XS",
    "iphone xr": "iPhone X / XR / XS",
    "iphone xs": "iPhone X / XR / XS",
    "iphone xs max": "iPhone XS Max",
    "iphone 11": "iPhone 11",
    "iphone 11 pro": "iPhone 11 Pro / 11 Pro Max",
    "iphone 11 pro max": "iPhone 11 Pro / 11 Pro Max",
    "iphone 12 mini": "iPhone 12 mini / iPhone 12",
    "iphone 12": "iPhone 12 mini / iPhone 12",
    "iphone 12 pro": "iPhone 12 Pro / 12 Pro Max",
    "iphone 12 pro max": "iPhone 12 Pro / 12 Pro Max",
    "iphone 13 mini": "iPhone 13 mini / iPhone 13",
    "iphone 13": "iPhone 13 mini / iPhone 13",
    "iphone 13 pro": "iPhone 13 Pro",
    "iphone 13 pro max": "iPhone 13 Pro Max",
    "iphone 14": "iPhone 14 / iPhone 14 Plus",
    "iphone 14 plus": "iPhone 14 / iPhone 14 Plus",
    "iphone 14 pro": "iPhone 14 Pro",
    "iphone 14 pro max": "iPhone 14 Pro Max",
    "iphone 15": "iPhone 15 / iPhone 15 Plus",
    "iphone 15 plus": "iPhone 15 / iPhone 15 Plus",
    "iphone 15 pro": "iPhone 15 Pro",
    "iphone 15 pro max": "iPhone 15 Pro Max",
}


def _norm(text: str | None) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


@lru_cache(maxsize=1)
def load_pricing_book() -> dict[str, Any]:
    with PRICING_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_known_models() -> list[str]:
    book = load_pricing_book()
    seen: list[str] = []
    for row in book.get("floor_prices", []):
        model = row.get("model")
        if model and model not in seen:
            seen.append(model)
    return seen


def lookup_floor_row(model: str | None, storage: str | None) -> dict[str, Any] | None:
    book = load_pricing_book()
    rows = book.get("floor_prices", [])
    target_model = _norm(model)
    target_storage = _norm(storage).replace(" ", "")

    if not target_model:
        return None

    model_matches = [r for r in rows if _norm(r.get("model")) == target_model]
    if not model_matches:
        # Loose containment fallback for e.g. "iPhone SE 2"
        model_matches = [
            r
            for r in rows
            if target_model in _norm(r.get("model"))
            or _norm(r.get("model")) in target_model
        ]

    if not model_matches:
        return None

    for row in model_matches:
        if _norm(row.get("storage")).replace(" ", "") == target_storage:
            return row

    return model_matches[0]


def lookup_parts_deduction(model: str | None) -> dict[str, Any] | None:
    book = load_pricing_book()
    parts_rows = book.get("parts_deductions", [])
    target_model = _norm(model)

    group_name = MODEL_TO_PARTS_GROUP.get(target_model)
    if group_name:
        for row in parts_rows:
            if row.get("group") == group_name:
                return row

    # Fallback by series prefix match
    for row in parts_rows:
        grp = _norm(row.get("group"))
        if target_model and target_model in grp:
            return row

    return None


def classify_grade(
    detections: list[dict[str, Any]],
    ocr: dict[str, Any] | None,
    hardware: dict[str, Any] | None,
) -> tuple[str, bool, str | None, dict[str, int]]:
    hw = hardware or {}
    if hw.get("icloudClean") is False:
        return "reject", True, "Máy còn tài khoản iCloud / khóa kích hoạt.", {}
    if hw.get("powerOn") is False:
        return "reject", True, "Máy không lên nguồn / mất hiển thị hoàn toàn.", {}

    counts = {
        "good": 0,
        "scratch": 0,
        "dent": 0,
        "cracked_screen": 0,
        "damaged_screen": 0,
    }

    for det in detections:
        if det.get("confirmed", True) is False:
            continue
        cls = det.get("class") or det.get("class_name")
        if cls in counts:
            counts[cls] += 1
        elif cls == "damaged":
            counts["damaged_screen"] += 1

    battery_pct = None
    unknown_part = False
    if ocr:
        battery_pct = ocr.get("battery_percent")
        if battery_pct is None:
            battery_pct = ocr.get("batteryPercent")
        unknown_part = bool(ocr.get("unknown_part") or ocr.get("unknownPart"))

    # Grading Matrix (flowchart + Excel + counter/mobile diagnostics)
    screen_display = hw.get("screenDisplay") or "good"
    screen_auth = hw.get("screenAuthenticity") or "original"
    glass_cond = hw.get("glassCondition") or "good"
    true_tone = hw.get("trueTone") or "yes"

    if (
        counts["damaged_screen"] > 0
        or hw.get("touch") == "fail"
        or screen_display in ("spots_lines_ink", "partial_dead")
    ):
        grade = "D"
    elif counts["dent"] > 3:
        grade = "D"
    elif (
        counts["cracked_screen"] > 0
        or counts["dent"] > 0
        or counts["scratch"] > 5
        or screen_display == "tint_flicker"
        or glass_cond in ("cracked", "glue_bubbles")
    ):
        grade = "C"
    elif counts["scratch"] > 0:
        grade = "B"
    elif (
        (battery_pct is not None and battery_pct < 90)
        or unknown_part
        or screen_auth in ("history_unknown", "abnormal_bezel", "dynamic_island_issue")
        or true_tone == "no"
    ):
        grade = "B"
    else:
        grade = "A"

    return grade, False, None, counts


def evaluate_appraisal(
    *,
    brand: str,
    model: str,
    storage: str,
    detections: list[dict[str, Any]],
    ocr: dict[str, Any] | None,
    hardware: dict[str, Any] | None,
    weights_name: str | None = None,
    slot_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ocr_data = ocr or {}
    effective_model = (ocr_data.get("model") or model or "").strip()
    effective_storage = (ocr_data.get("rom") or storage or "").strip()

    grade, reject, reject_reason, counts = classify_grade(
        detections=detections,
        ocr=ocr_data,
        hardware=hardware,
    )
    grade_label, floor_col = GRADE_META[grade]

    floor_row = lookup_floor_row(effective_model, effective_storage)
    parts_row = lookup_parts_deduction(effective_model)

    floor_loai_1 = int(floor_row.get("loai_1_like_new", 0)) if floor_row else 0
    floor_applied = (
        int(floor_row.get(floor_col, 0)) if (floor_row and floor_col) else 0
    )

    extras: list[dict[str, Any]] = []
    deductions: list[dict[str, Any]] = []

    if not reject and floor_row and floor_loai_1 > floor_applied:
        deductions.append(
            {
                "source": "grade",
                "code": floor_col,
                "label": f"Chênh lệch Loại 1 → {grade_label}",
                "amount": floor_loai_1 - floor_applied,
            }
        )

    battery_pct = ocr_data.get("battery_percent")
    if battery_pct is None:
        battery_pct = ocr_data.get("batteryPercent")
    unknown_part = bool(ocr_data.get("unknown_part") or ocr_data.get("unknownPart"))

    if not reject:
        if battery_pct is not None and int(battery_pct) < 90:
            bat_fee = int(parts_row.get("battery_below_90", 500000)) if parts_row else 500000
            item = {
                "code": "battery_below_90",
                "source": "ocr",
                "label": f"Pin {int(battery_pct)}% (< 90%)",
                "amount": bat_fee,
            }
            extras.append(item)
            deductions.append(item)

        if unknown_part:
            unk_fee = int(parts_row.get("battery_below_90", 1000000)) if parts_row else 1000000
            item = {
                "code": "unknown_part",
                "source": "ocr",
                "label": "Cảnh báo Unknown Part (linh kiện không xác định)",
                "amount": unk_fee,
            }
            extras.append(item)
            deductions.append(item)

        hw = hardware or {}
        if hw.get("faceId") == "fail":
            face_fee = (
                int(parts_row.get("faceid_touchid_loss", 1200000))
                if parts_row
                else 1200000
            )
            item = {
                "code": "faceid_touchid_loss",
                "source": "hw",
                "label": "Mất Face ID / Touch ID",
                "amount": face_fee,
            }
            extras.append(item)
            deductions.append(item)

        if hw.get("audio") == "fail":
            item = {
                "code": "audio_fail",
                "source": "hw",
                "label": "Lỗi loa / mic (nội vi)",
                "amount": 400000,
            }
            extras.append(item)
            deductions.append(item)

        if hw.get("vibrate") == "fail":
            item = {
                "code": "vibrate_fail",
                "source": "hw",
                "label": "Lỗi động cơ rung (Haptic)",
                "amount": 400000,
            }
            extras.append(item)
            deductions.append(item)

        # Granular mobile diagnostic & counter items
        extra_hw_rules = [
            ("wifi", "fail", "wifi_fail", "Lỗi kết nối Wifi (nội vi)", 500000),
            ("bluetooth", "fail", "bluetooth_fail", "Lỗi Bluetooth (nội vi)", 400000),
            ("backCamera", "fail", "back_camera_fail", "Lỗi Camera sau", 800000),
            ("frontCamera", "fail", "front_camera_fail", "Lỗi Camera trước", 500000),
            ("volumeDown", "fail", "volume_down_fail", "Lỗi nút giảm âm lượng", 300000),
            ("volumeUp", "fail", "volume_up_fail", "Lỗi nút tăng âm lượng", 300000),
            ("earpiece", "fail", "earpiece_fail", "Lỗi loa trong", 350000),
            ("speaker", "fail", "speaker_fail", "Lỗi loa ngoài", 350000),
            ("callMic", "fail", "call_mic_fail", "Lỗi mic thoại", 350000),
            ("videoMic", "fail", "video_mic_fail", "Lỗi mic video", 300000),
            ("simSignal", "fail", "sim_signal_fail", "Lỗi nhận SIM / sóng", 600000),
            ("powerButton", "broken", "power_button_broken", "Phím nguồn lún / không hoạt động", 300000),
            ("trueTone", "no", "truetone_missing", "Mất True Tone màn hình", 300000),
            ("charging", "unstable", "charging_unstable", "Chân sạc lỏng / sạc không ổn định", 400000),
            ("glassCondition", "glue_bubbles", "glass_glue_bubbles", "Mặt kính hở keo / nổi bọt", 400000),
        ]
        for field, bad_val, code, label, amount in extra_hw_rules:
            if hw.get(field) == bad_val:
                # Skip legacy audio_fail double-charge if granular audio/mic checks already deducted
                if field in ("earpiece", "speaker", "callMic", "videoMic") and hw.get("audio") == "fail":
                    continue
                item = {
                    "code": code,
                    "source": "hw",
                    "label": label,
                    "amount": amount,
                }
                extras.append(item)
                deductions.append(item)

        screen_auth = hw.get("screenAuthenticity") or "original"
        if screen_auth == "history_unknown" and not unknown_part:
            unk_fee = int(parts_row.get("battery_below_90", 500000)) if parts_row else 500000
            item = {
                "code": "screen_history_unknown",
                "source": "hw",
                "label": "Lịch sử màn hình ghi nhận Không xác định",
                "amount": unk_fee,
            }
            extras.append(item)
            deductions.append(item)
        elif screen_auth in ("abnormal_bezel", "dynamic_island_issue"):
            item = {
                "code": screen_auth,
                "source": "hw",
                "label": (
                    "Độ dày mép viền màn hình bất thường"
                    if screen_auth == "abnormal_bezel"
                    else "Viền Dynamic Island răng cưa / camera lệch tâm"
                ),
                "amount": 800000,
            }
            extras.append(item)
            deductions.append(item)

        if hw.get("screenDisplay") == "tint_flicker":
            item = {
                "code": "screen_tint_flicker",
                "source": "hw",
                "label": "Màn hình âm ảnh / ám màn / chớp nháy",
                "amount": 600000,
            }
            extras.append(item)
            deductions.append(item)

    extras_total = sum(int(e["amount"]) for e in extras)
    suggested_price = 0 if reject else max(0, floor_applied - extras_total)

    confirmed_confs = [
        float(d.get("confidence", 0))
        for d in detections
        if d.get("confirmed", True) is not False and float(d.get("confidence", 0)) > 0
    ]
    avg_conf = (
        round(sum(confirmed_confs) / len(confirmed_confs), 2)
        if confirmed_confs
        else (round(float(ocr_data["confidence"]), 2) if ocr_data.get("confidence") else 0.9)
    )

    note_parts = []
    if not floor_row:
        note_parts.append(
            f"Chưa có giá sàn Excel cho '{effective_model} {effective_storage}' — nhân viên nhập giá chốt thủ công."
        )
    if reject and reject_reason:
        note_parts.append(reject_reason)
    elif grade == "D" and counts.get("damaged_screen", 0) > 0:
        note_parts.append("Phát hiện lỗi màn hình nặng (damaged) → áp khung giá sàn Loại 4.")

    return {
        "grade": grade,
        "grade_label": grade_label,
        "reject": reject,
        "reject_reason": reject_reason,
        "counts": counts,
        "yolo": {
            "weights": weights_name or "yolov8s_baseline_best.pt",
            "detections": detections,
            "slots": slot_meta or {},
        },
        "ocr": {
            "model": ocr_data.get("model"),
            "rom": ocr_data.get("rom"),
            "battery_percent": battery_pct,
            "unknown_part": unknown_part,
            "raw_text": ocr_data.get("raw_text", ""),
            "confidence": ocr_data.get("confidence"),
        },
        "pricing": {
            "matched_model": floor_row.get("model") if floor_row else effective_model,
            "matched_storage": floor_row.get("storage") if floor_row else effective_storage,
            "parts_group": parts_row.get("group") if parts_row else None,
            "floor_loai_1": floor_loai_1,
            "floor_applied": floor_applied,
            "extras": extras,
            "extras_total": extras_total,
            "suggested_price": suggested_price,
            "currency": "VND",
        },
        "deductions": deductions,
        "formula_note": f"floor({grade_label}) - extras",
        "confidence": avg_conf,
        "note": " ".join(note_parts) if note_parts else "Định giá theo bảng giá sàn Loại 1–4 & khấu hao linh kiện.",
    }
