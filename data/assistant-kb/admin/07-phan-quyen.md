# Phân quyền vai trò

## Vai trò cửa hàng điện thoại
| Role | Mã | Làm chính |
|------|-----|-----------|
| Admin | `admin` | User, finance, báo cáo, toàn hệ thống |
| NV bán hàng | `sales_staff` | POS, đơn, khách, bảo hành |
| NV kho | `warehouse_staff` | Nhập kho, IMEI, sản phẩm |

## Tóm tắt ma trận
- Users/Roles: chỉ admin.
- POS/Orders: admin + sales.
- Stock Import / IMEI manage: admin + warehouse.
- Finance: chỉ admin.
- Warranty: admin + sales (kho view).

## Bot trợ lý
Permission dự kiến: `assistant.use` cho admin / sales / warehouse. Tool đọc số liệu tôn trọng quyền hiện có (vd. không trả finance cho sales).
