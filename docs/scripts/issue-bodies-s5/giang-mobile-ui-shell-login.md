## Phụ thuộc
Chờ chốt IA ở issue redesign (parent).

## Mục tiêu
Sửa **Login + shell tab bar + theme** cho đúng thương hiệu Lieng Mobile (cửa hàng điện thoại), bỏ cảm giác “app Quán”.

## Việc cần làm
- [ ] Login: brand Lieng Mobile, bỏ default `quan@…` trên UI demo (hoặc đổi account gợi ý theo role)
- [ ] Đổi `APP_NAME` / i18n “Quán Lieng” → Lieng Mobile (giữ bản Lào)
- [ ] Tab bar mới theo IA đã chốt (đổi `QuanTabBar` → `AppTabBar` hoặc rename)
- [ ] Spacing/typography/card đồng bộ web Admin (#fdf2f2, đỏ #7A0C10 / #DC2626) — tránh layout “amber quán”
- [ ] Safe area, empty/loading states thống nhất `ui.tsx`

## DoD
- [ ] Mở app: login + tabs trông như Lieng Mobile, không còn copy “Quán” chiếm toàn app
- [ ] Chụp 2–3 ảnh (login, tab bar, 1 màn) comment vào issue
