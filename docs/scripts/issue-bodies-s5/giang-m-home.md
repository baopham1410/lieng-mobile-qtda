## Parent
#116

## Màn hình
**Trang chủ / Tổng quan** — `app/(app)/(tabs)/home.tsx` (mới; thay vai trò `quay` làm landing)

## Trong màn gồm gì
- Header chào + tên cửa hàng Lieng Mobile
- 3–4 thẻ số liệu: doanh thu hôm nay, đơn hôm nay, tồn / cảnh báo (có thể mock nếu API chưa sẵn)
- Lối tắt (chips): Bán hàng · Đơn · Bảo hành · Thẩm định
- Empty/loading/error state

## Chuyển từ web
| Web | File | Mang sang mobile (rút gọn) |
|-----|------|----------------------------|
| Dashboard | `views/dashboard/DashboardView.vue` | Stat cards + quick actions (không chart nặng phase 1) |
| API | `GET /api/v1/dashboard` (nếu có) | Gọi thật hoặc mock UI |

## Giao diện cần làm
- [ ] Layout scroll + stat cards đỏ/trắng
- [ ] Hàng shortcut mở tab/stack tương ứng
- [ ] Không dùng UI “bán món quán”

## DoD
- [ ] Tab Trang chủ mở được, screenshot
- [ ] Shortcut điều hướng đúng
