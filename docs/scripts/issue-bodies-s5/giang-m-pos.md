## Parent
#116

## Màn hình
**Bán hàng (POS rút gọn)** — `app/(app)/(tabs)/pos.tsx`

## Trong màn gồm gì
- Tìm sản phẩm / danh sách SP (tên, giá, tồn)
- Giỏ hàng (thêm/bớt số lượng)
- Chọn khách (tuỳ — có thể phase 2)
- Nút thanh toán → modal xác nhận (tiền mặt trước; PayOS sau)
- Thông báo tạo đơn thành công (+ ghi chú BH nếu có IMEI)

## Chuyển từ web
| Web | File | Mang sang |
|-----|------|-----------|
| Quầy bán hàng | `views/orders/PosView.vue` | Flow chọn SP → giỏ → checkout |
| API | `api/pos.js` → `/pos/*` | List products, checkout (không dùng `/quan/products`) |

## Không mang
- Toàn bộ UI Quán `quay.tsx` (bán nhanh quán)
- Sao kê / ghi chi quán

## Giao diện cần làm
- [ ] List/grid SP + search
- [ ] Bottom sheet hoặc panel giỏ
- [ ] Nút thanh toán + modal kết quả
- [ ] Empty giỏ / hết hàng

## DoD
- [ ] Screenshot list + giỏ
- [ ] Phase 1: UI hoàn chỉnh; API thật nếu kịp, không thì mock rõ ràng
