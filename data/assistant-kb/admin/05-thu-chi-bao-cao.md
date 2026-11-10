# Thu chi & báo cáo

## Menu
- **Thu chi** → `/finance`
- **Báo cáo** → `/reports`
- **Tổng quan** → `/dashboard`

## Nội dung
- Dashboard: doanh thu nhanh, đơn gần đây.
- Thu chi cửa hàng (phiếu thu/chi).
- Báo cáo doanh thu / tồn kho.

## Quyền quan trọng
- Chỉ **`admin`** xem thu chi chi tiết và báo cáo tài chính đầy đủ.
- `sales_staff`: chủ yếu dashboard / đơn.
- `warehouse_staff`: báo cáo tồn / nhập kho, không finance sâu.

Bot nội bộ khi hỏi số liệu sống sẽ gọi API theo đúng permission user đang đăng nhập.
