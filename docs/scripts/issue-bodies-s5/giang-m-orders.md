## Parent
#116

## Màn hình
**Đơn hàng** — `app/(app)/(tabs)/orders.tsx`

## Trong màn gồm gì
- List đơn (mã, giờ, tổng tiền, trạng thái, PTTT)
- Filter: tất cả / hoàn tất / hủy (đơn giản)
- Tap → chi tiết đơn (stack): dòng hàng, khách, tổng
- Pull-to-refresh

## Chuyển từ web
| Web | File | Mang sang |
|-----|------|-----------|
| Đơn hàng | `views/orders/OrderListView.vue` | Bảng → list card mobile |
| Chi tiết | slide-over trên web | Màn stack `orders/[id].tsx` |
| API | `GET /api/v1/orders` | List + detail |

## Giao diện cần làm
- [ ] Card đơn + badge trạng thái
- [ ] Màn chi tiết
- [ ] Empty “Chưa có đơn”

## DoD
- [ ] Screenshot list + detail
