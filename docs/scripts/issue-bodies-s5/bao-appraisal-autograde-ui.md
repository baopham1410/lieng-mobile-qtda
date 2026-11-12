## Mục tiêu
Giao diện Admin **Thẩm định máy (AutoGrade)** — UI trước, gắn FastAPI/YOLO/OCR sau.

## Phạm vi đã làm (UI)
- Menu **Dịch vụ → Thẩm định** (`/appraisal`)
- Form 4 bước: Thông tin → Ảnh (3 góc + màn Pin) → Checklist nội vi → Định giá
- Mock pipeline: hạng A–D, YOLO defects, OCR pin%, breakdown khấu hao, FinalPrice, mã QR phiếu
- Lưu demo localStorage

## Việc tiếp theo
- [ ] Nối FastAPI (YOLOv8 + PaddleOCR + Valuation)
- [ ] Persist phiếu qua Laravel API
- [ ] Expo: test nội vi thật + chụp ảnh O2O

## Commit
`feat(appraisal): add AutoGrade UI for phone trade-in appraisal`

## DoD UI
- [x] Tạo/sửa/xem phiếu trên web Admin
- [x] Upload ảnh + chạy AutoGrade mock
- [ ] AI thật chưa (đúng scope UI-first)
