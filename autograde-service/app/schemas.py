from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class HardwareInput(BaseModel):
    # Legacy / core fields
    touch: str = "pass"
    audio: str = "pass"
    vibrate: str = "pass"
    faceId: str = "pass"
    icloudClean: bool = True
    powerOn: bool = True

    # Mobile auto-test diagnostics (14 items)
    wifi: str = "pass"
    bluetooth: str = "pass"
    backCamera: str = "pass"
    frontCamera: str = "pass"
    volumeDown: str = "pass"
    volumeUp: str = "pass"
    earpiece: str = "pass"
    speaker: str = "pass"
    callMic: str = "pass"
    videoMic: str = "pass"
    simSignal: str = "pass"

    # Counter visual & part authenticity checks
    screenDisplay: str = "good"
    screenAuthenticity: str = "original"
    glassCondition: str = "good"
    powerButton: str = "good"
    trueTone: str = "yes"
    charging: str = "good"

    model_config = {"extra": "allow"}


class DetectionItem(BaseModel):
    id: str
    class_name: str = Field(..., alias="class")
    raw_class: str = ""
    label: str = ""
    confidence: float = 0.0
    bbox: list[float] = Field(default_factory=list)
    bbox_norm: list[float] = Field(default_factory=list)
    image: str = "front"
    confirmed: bool = True

    model_config = {"populate_by_name": True}


class OcrResult(BaseModel):
    model: str | None = None
    rom: str | None = None
    battery_percent: int | None = None
    unknown_part: bool = False
    raw_text: str = ""
    confidence: float | None = None


class ValuateRequest(BaseModel):
    brand: str = "Apple"
    model: str
    storage: str = "256GB"
    hardware: HardwareInput = Field(default_factory=HardwareInput)
    detections: list[dict[str, Any]] = Field(default_factory=list)
    ocr: dict[str, Any] | None = None
    weights: str | None = None
