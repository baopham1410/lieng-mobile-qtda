from __future__ import annotations

import os
import re
import threading
import unicodedata
from typing import Any

import numpy as np
from PIL import Image

from .pricing import list_known_models

_OCR_LOCK = threading.Lock()
_OCR_INSTANCE: Any = None
_OCR_BACKEND: str | None = None
_OCR_INIT_ERROR: str | None = None


def _strip_accents(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch))


def get_ocr_engine() -> tuple[str, Any]:
    global _OCR_INSTANCE, _OCR_BACKEND, _OCR_INIT_ERROR
    if _OCR_INSTANCE is not None and _OCR_BACKEND is not None:
        return _OCR_BACKEND, _OCR_INSTANCE

    with _OCR_LOCK:
        if _OCR_INSTANCE is not None and _OCR_BACKEND is not None:
            return _OCR_BACKEND, _OCR_INSTANCE

        errors: list[str] = []

        # 1) Try native PaddleOCR first (check pandas first to avoid loading paddle DLLs if OS blocks pandas)
        try:
            os.environ.setdefault("DISABLE_MODEL_SOURCE_CHECK", "True")
            import pandas  # noqa: F401
            from paddleocr import PaddleOCR

            try:
                _OCR_INSTANCE = PaddleOCR(
                    lang="vi",
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False,
                )
            except TypeError:
                _OCR_INSTANCE = PaddleOCR(
                    lang="vi",
                    use_angle_cls=False,
                    show_log=False,
                )
            _OCR_BACKEND = "paddleocr"
            _OCR_INIT_ERROR = None
            return _OCR_BACKEND, _OCR_INSTANCE
        except Exception as exc:
            errors.append(f"PaddleOCR: {exc}")

        # 2) Fallback: RapidOCR (PaddleOCR PP-OCRv4 models via ONNX Runtime)
        try:
            from rapidocr_onnxruntime import RapidOCR

            _OCR_INSTANCE = RapidOCR()
            _OCR_BACKEND = "rapidocr-ppocrv4"
            _OCR_INIT_ERROR = None
            return _OCR_BACKEND, _OCR_INSTANCE
        except Exception as exc:
            errors.append(f"RapidOCR: {exc}")

        _OCR_INIT_ERROR = " | ".join(errors)
        raise RuntimeError(_OCR_INIT_ERROR)


def ocr_status() -> dict[str, Any]:
    return {
        "initialized": _OCR_INSTANCE is not None,
        "backend": _OCR_BACKEND,
        "error": _OCR_INIT_ERROR,
    }


def _extract_lines_from_paddle(raw_output: Any) -> list[tuple[str, float]]:
    lines: list[tuple[str, float]] = []
    if not raw_output:
        return lines

    # PaddleOCR 3.x predict() returns list of dict/OCRResult objects with rec_texts / rec_scores
    for item in raw_output:
        if isinstance(item, dict) or (hasattr(item, "keys") and "rec_texts" in item):
            texts = item.get("rec_texts") or []
            scores = item.get("rec_scores") or []
            for idx, txt in enumerate(texts):
                s = str(txt).strip()
                if not s:
                    continue
                conf = float(scores[idx]) if idx < len(scores) else 0.85
                lines.append((s, conf))
            continue

        if hasattr(item, "rec_texts"):
            texts = getattr(item, "rec_texts", []) or []
            scores = getattr(item, "rec_scores", []) or []
            for idx, txt in enumerate(texts):
                s = str(txt).strip()
                if not s:
                    continue
                conf = float(scores[idx]) if idx < len(scores) else 0.85
                lines.append((s, conf))
            continue

        # PaddleOCR 2.x ocr() returns [[ [box, (text, conf)], ... ]]
        if isinstance(item, list):
            for entry in item:
                if (
                    isinstance(entry, (list, tuple))
                    and len(entry) >= 2
                    and isinstance(entry[1], (list, tuple))
                    and len(entry[1]) >= 2
                ):
                    s = str(entry[1][0]).strip()
                    conf = float(entry[1][1])
                    if s:
                        lines.append((s, conf))

    return lines


def parse_battery_screen_text(
    lines: list[str],
    fallback_model: str | None = None,
    fallback_rom: str | None = None,
    avg_confidence: float | None = None,
) -> dict[str, Any]:
    raw_text = "\n".join(lines).strip()
    norm_full = _strip_accents(raw_text).lower()

    # 1) Battery percentage
    battery_percent: int | None = None
    # Prefer line containing Maximum Capacity / Dung luong toi da
    cap_patterns = [
        r"(?:maximum\s*capacity|dung\s*luong\s*toi\s*da|battery\s*health|tinh\s*trang\s*pin)[^0-9]{0,25}(\d{2,3})\s*%",
    ]
    for pat in cap_patterns:
        m = re.search(pat, norm_full, flags=re.IGNORECASE | re.DOTALL)
        if m:
            val = int(m.group(1))
            if 40 <= val <= 100:
                battery_percent = val
                break

    if battery_percent is None:
        # Check line by line (next line after Maximum Capacity / Dung luong toi da)
        for idx, line in enumerate(lines):
            ln = _strip_accents(line).lower()
            if any(k in ln for k in ("maximum capacity", "dung luong toi da", "toi da")):
                window = " ".join(lines[idx : idx + 3])
                m = re.search(r"\b(\d{2,3})\s*%", window)
                if m:
                    val = int(m.group(1))
                    if 40 <= val <= 100:
                        battery_percent = val
                        break

    if battery_percent is None:
        # Generic percentage candidates excluding obvious time/status bar percentages if possible
        candidates = [int(x) for x in re.findall(r"\b(\d{2,3})\s*%", norm_full) if 45 <= int(x) <= 100]
        if candidates:
            battery_percent = candidates[0]

    # 2) iPhone Model match (longest match first)
    detected_model: str | None = None
    if "iphone se" in norm_full:
        if any(k in norm_full for k in ("3rd", "2022", "gen 3")):
            detected_model = "iPhone SE (Gen 3 - 2022)"
        elif any(k in norm_full for k in ("2nd", "2020", "gen 2")):
            detected_model = "iPhone SE (Gen 2 - 2020)"

    if detected_model is None:
        norm_compact = re.sub(r"[^a-z0-9]", "", norm_full)
        known_models = sorted(list_known_models(), key=len, reverse=True)
        for km in known_models:
            km_norm = _strip_accents(km).lower()
            if re.search(rf"(?<![a-z0-9]){re.escape(km_norm)}(?![a-z0-9])", norm_full):
                detected_model = km
                break
            km_compact = re.sub(r"[^a-z0-9]", "", km_norm)
            if km_compact and km_compact in norm_compact:
                detected_model = km
                break

    # 3) ROM storage (64GB, 128GB, 256GB, 512GB, 1TB)
    detected_rom: str | None = None
    # Prioritize lines near Capacity / Dung luong (excluding "Available" / "Kha dung" and "Maximum Capacity")
    for idx, line in enumerate(lines):
        ln = _strip_accents(line).lower()
        if any(k in ln for k in ("capacity", "dung luong")) and not any(
            bad in ln for bad in ("maximum", "toi da", "available", "kha dung")
        ):
            window = " ".join(lines[idx : idx + 2])
            m = re.search(r"\b(64|128|256|512)\s*GB\b|\b(1)\s*TB\b", window, flags=re.IGNORECASE)
            if m:
                detected_rom = f"{m.group(1)}GB" if m.group(1) else "1TB"
                break

    if detected_rom is None:
        m = re.search(r"\b(64|128|256|512)\s*GB\b|\b(1)\s*TB\b", norm_full, flags=re.IGNORECASE)
        if m:
            detected_rom = f"{m.group(1)}GB" if m.group(1) else "1TB"

    # 4) Unknown Part detection
    unknown_keywords = (
        "unknown part",
        "linh kien khong xac dinh",
        "important battery message",
        "important display message",
        "important camera message",
        "unable to verify",
        "khong the xac minh",
        "non-genuine",
        "khong chinh hang",
    )
    unknown_part = any(k in norm_full for k in unknown_keywords)

    return {
        "model": detected_model or fallback_model,
        "rom": detected_rom or fallback_rom,
        "battery_percent": battery_percent,
        "unknown_part": unknown_part,
        "raw_text": raw_text,
        "confidence": round(avg_confidence, 3) if avg_confidence is not None else None,
    }


def extract_battery_ocr(
    image: Image.Image,
    fallback_model: str | None = None,
    fallback_rom: str | None = None,
) -> dict[str, Any]:
    backend, engine = get_ocr_engine()
    rgb = np.array(image.convert("RGB"))

    if backend == "rapidocr-ppocrv4":
        result, _ = engine(rgb)
        line_pairs: list[tuple[str, float]] = []
        for entry in result or []:
            if isinstance(entry, (list, tuple)) and len(entry) >= 3:
                txt = str(entry[1]).strip()
                conf = float(entry[2])
                if txt:
                    line_pairs.append((txt, conf))
    else:
        if hasattr(engine, "predict"):
            raw = engine.predict(rgb)
        else:
            raw = engine.ocr(rgb, cls=False)
        line_pairs = _extract_lines_from_paddle(raw)

    texts = [t for t, _ in line_pairs]
    confs = [c for _, c in line_pairs]
    avg_conf = (sum(confs) / len(confs)) if confs else None

    return parse_battery_screen_text(
        lines=texts,
        fallback_model=fallback_model,
        fallback_rom=fallback_rom,
        avg_confidence=avg_conf,
    )
