from __future__ import annotations

import os
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = SERVICE_DIR.parent

DATA_AUTOGRADE_DIR = Path(
    os.getenv("AUTOGRADE_DATA_DIR", str(REPO_ROOT / "data" / "autograde"))
)
WEIGHTS_PATH = Path(
    os.getenv(
        "AUTOGRADE_WEIGHTS_PATH",
        str(DATA_AUTOGRADE_DIR / "weights" / "yolov8s_baseline_best.pt"),
    )
)
CLASSES_PATH = Path(
    os.getenv(
        "AUTOGRADE_CLASSES_PATH",
        str(DATA_AUTOGRADE_DIR / "weights" / "classes.json"),
    )
)
PRICING_PATH = Path(
    os.getenv(
        "AUTOGRADE_PRICING_PATH",
        str(DATA_AUTOGRADE_DIR / "pricing" / "iphone_tradein_pricing.json"),
    )
)

YOLO_CONF_THRESHOLD = float(os.getenv("AUTOGRADE_YOLO_CONF", "0.16"))
YOLO_TILE_CONF_THRESHOLD = float(os.getenv("AUTOGRADE_YOLO_TILE_CONF", "0.20"))
YOLO_IOU_THRESHOLD = float(os.getenv("AUTOGRADE_YOLO_IOU", "0.45"))
YOLO_FULL_IMGSZ = int(os.getenv("AUTOGRADE_YOLO_FULL_IMGSZ", "960"))
YOLO_TILE_IMGSZ = int(os.getenv("AUTOGRADE_YOLO_TILE_IMGSZ", "640"))
YOLO_DEVICE = os.getenv("AUTOGRADE_YOLO_DEVICE", "cpu")
