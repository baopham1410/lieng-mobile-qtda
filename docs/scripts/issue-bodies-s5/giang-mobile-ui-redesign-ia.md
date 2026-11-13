## Bối cảnh (đã xác nhận)
App Expo hiện **đang theo module Quán web cũ**, không phải shell Admin Lieng Mobile (điện thoại / POS / kho / BH).

Bằng chứng trong `mobile-expo`:
- Tabs: **Quầy · Sao kê · Ghi chi · Kho · Tôi** (`QuanTabBar`)
- API chỉ `/quan/products`, `/quan/entries`, `/quan/statements`
- Copy/i18n: “Quán Lieng”, “Admin Quán”, login mặc định `quan@…`
- Theme màu đỏ Lieng đã chỉnh một phần, nhưng **IA + nghiệp vụ vẫn là Quán**

## Mục tiêu issue này
Chốt **IA mới** cho mobile Lieng (không clone Quán web) + checklist màn cần redesign.

## Việc cần làm
- [ ] Chốt tab IA đề xuất (vd. Trang chủ / Bán hàng / Kho hoặc Đơn / Bảo hành·Thẩm định / Tôi) — thống nhất với Bao/Hong
- [ ] Phân biệt rõ: module **Quán** (nếu còn) là tab phụ hoặc role `quan_*`, không phải toàn app
- [ ] Wireframe ngắn hoặc list màn trong issue comment
- [ ] Đồng bộ với kế hoạch Giang (placeholder Thẩm định AutoGrade)

## Ngoài phạm vi
- Train AI / FastAPI
- Viết lại toàn bộ API Laravel

## DoD
- [ ] Doc IA (comment hoặc `docs/`) được team approve
- [ ] Issue con theo từng tab/màn đã tạo (link dưới)
