# AutoGrade Service — Lieng Mobile AI Thẩm định

FastAPI microservice riêng biệt (port **8091**) cho quy trình thẩm định & định giá thu cũ iPhone:
- **YOLOv8** (`data/autograde/weights/yolov8s_baseline_best.pt`) + alias map (`data/autograde/weights/classes.json`)
- **PaddleOCR** đọc % pin, model, dung lượng ROM, cảnh báo `Unknown Part` từ ảnh slot `battery`
- **Valuation Engine** theo `data/autograde/pricing/iphone_tradein_pricing.json` (giá sàn Loại 1–4 + khấu hao linh kiện)

## Chạy local

```powershell
cd autograde-service
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8091
```

## API

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/health` | Trạng thái service, YOLO weights, PaddleOCR, pricing |
| GET | `/pricing` | Bảng giá sàn Loại 1–4 & khấu hao linh kiện |
| POST | `/appraise` | Multipart: `front`, `back`, `side`, `battery` + `meta` JSON |
| POST | `/valuate` | Tính lại hạng & giá sau khi nhân viên xác nhận/bỏ chọn detection boxes |
| POST | `/ocr/battery` | Debug PaddleOCR riêng cho slot `battery` |
