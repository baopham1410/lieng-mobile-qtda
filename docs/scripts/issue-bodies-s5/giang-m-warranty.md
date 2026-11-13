## Parent
#116 · vào từ tab Dịch vụ

## Màn hình
**Bảo hành — tra IMEI** — `app/(app)/warranty.tsx` (stack) hoặc `service/warranty`

## Trong màn gồm gì
- Ô nhập IMEI + nút Tra cứu
- Kết quả: tên SP, khách, hạn BH, trạng thái
- (Tuỳ phase 2) list phiếu gần đây
- Empty / không tìm thấy

## Chuyển từ web
| Web | File | Mang sang |
|-----|------|-----------|
| Bảo hành | `views/warranty/WarrantyLookupView.vue` | Khối tra IMEI + card kết quả (bỏ bảng lớn phase 1) |
| API | `GET /api/v1/warranties/lookup?imei=` | Có sẵn web |

## Giao diện cần làm
- [ ] Form IMEI
- [ ] Card kết quả + badge trạng thái
- [ ] Error “IMEI không hợp lệ / không có phiếu”

## DoD
- [ ] Screenshot tra cứu OK + không tìm thấy
