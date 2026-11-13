from __future__ import annotations

import io
import json
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .config import PRICING_PATH, WEIGHTS_PATH
from .ocr_engine import extract_battery_ocr, ocr_status
from .pricing import evaluate_appraisal, load_pricing_book
from .schemas import ValuateRequest
from .yolo_engine import infer_images_detailed, yolo_status

app = FastAPI(
    title="Lieng Mobile AutoGrade Service",
    version="0.1.0",
    description="YOLOv8 + PaddleOCR + Valuation Engine (Loại 1-4) — Port 8091",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _read_upload_image(upload: UploadFile | None, slot: str) -> Image.Image | None:
    if upload is None:
        return None
    raw = await upload.read()
    if not raw:
        return None
    try:
        return Image.open(io.BytesIO(raw))
    except UnidentifiedImageError as exc:
        raise HTTPException(422, f"Ảnh '{slot}' không hợp lệ hoặc không đọc được.") from exc


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "autograde-service",
        "port": 8091,
        "yolo": yolo_status(),
        "ocr": ocr_status(),
        "pricing_exists": PRICING_PATH.is_file(),
    }


@app.get("/pricing")
def pricing() -> dict[str, Any]:
    return load_pricing_book()


@app.post("/ocr/battery")
async def ocr_battery_endpoint(
    battery: UploadFile = File(...),
    model: str | None = Form(default=None),
    storage: str | None = Form(default=None),
) -> dict[str, Any]:
    img = await _read_upload_image(battery, "battery")
    if img is None:
        raise HTTPException(422, "Thiếu file ảnh battery.")
    try:
        return extract_battery_ocr(img, fallback_model=model, fallback_rom=storage)
    except Exception as exc:
        raise HTTPException(500, f"PaddleOCR lỗi: {exc}") from exc


@app.post("/valuate")
def valuate_endpoint(body: ValuateRequest) -> dict[str, Any]:
    return evaluate_appraisal(
        brand=body.brand,
        model=body.model,
        storage=body.storage,
        detections=body.detections,
        ocr=body.ocr,
        hardware=body.hardware.model_dump(),
        weights_name=body.weights or WEIGHTS_PATH.name,
    )


@app.post("/appraise")
async def appraise_endpoint(
    front: UploadFile | None = File(default=None),
    back: UploadFile | None = File(default=None),
    corner_tl: UploadFile | None = File(default=None),
    corner_tr: UploadFile | None = File(default=None),
    corner_bl: UploadFile | None = File(default=None),
    corner_br: UploadFile | None = File(default=None),
    side: UploadFile | None = File(default=None),
    battery: UploadFile | None = File(default=None),
    meta: str = Form(default="{}"),
) -> dict[str, Any]:
    try:
        meta_obj = json.loads(meta) if meta else {}
    except json.JSONDecodeError as exc:
        raise HTTPException(422, f"meta JSON không hợp lệ: {exc}") from exc

    brand = str(meta_obj.get("brand") or "Apple")
    model = str(meta_obj.get("model") or "iPhone 15 Pro")
    storage = str(meta_obj.get("storage") or "256GB")
    hardware = meta_obj.get("hardware") if isinstance(meta_obj.get("hardware"), dict) else {}

    exterior_images: dict[str, Image.Image] = {}
    exterior_uploads = (
        ("front", front),
        ("back", back),
        ("corner_tl", corner_tl),
        ("corner_tr", corner_tr),
        ("corner_bl", corner_bl),
        ("corner_br", corner_br),
        ("side", side),
    )
    for slot, upload in exterior_uploads:
        img = await _read_upload_image(upload, slot)
        if img is not None:
            exterior_images[slot] = img

    battery_img = await _read_upload_image(battery, "battery")

    if not exterior_images and battery_img is None:
        raise HTTPException(422, "Cần ít nhất 1 ảnh (mặt trước/sau/4 góc cạnh/pin) để chạy AutoGrade.")

    # 1) YOLOv8 exterior inspection (falls back cleanly if only battery photo was provided)
    try:
        if exterior_images:
            detections, slot_meta = infer_images_detailed(exterior_images)
        else:
            detections, slot_meta = [], {}
    except Exception as exc:
        raise HTTPException(500, f"YOLO inference lỗi: {exc}") from exc

    # 2) PaddleOCR on battery/about slot (non-fatal if OCR fails to initialize)
    ocr_result: dict[str, Any] = {
        "model": None,
        "rom": None,
        "battery_percent": None,
        "unknown_part": False,
        "raw_text": "",
        "confidence": None,
    }
    if battery_img is not None:
        try:
            ocr_result = extract_battery_ocr(
                battery_img,
                fallback_model=None,
                fallback_rom=None,
            )
        except Exception as exc:
            ocr_result["raw_text"] = f"OCR fallback: {exc}"

    return evaluate_appraisal(
        brand=brand,
        model=model,
        storage=storage,
        detections=detections,
        ocr=ocr_result,
        hardware=hardware,
        weights_name=WEIGHTS_PATH.name,
        slot_meta=slot_meta,
    )
