## Mục tiêu
Sidebar/menu ẩn đúng theo role — Quán không thấy cả rừng menu Admin.

## Việc cần làm
- [ ] `AppSidebar`: lọc item theo `canRoleAccessRoute` / permission
- [ ] Nhóm menu gọn: Bán hàng | Kho | Quán | Báo cáo | Hệ thống
- [ ] Mobile drawer (nếu có) cùng rule

## Acceptance Criteria
- [ ] AC1: Role Quán chỉ thấy Quán (+ hồ sơ / tool được phép)
- [ ] AC2: Admin thấy đủ menu nghiệp vụ
- [ ] AC3: Không click vào route bị 403/redirect loop
- [ ] AC4: PR + CI + Bao review

## Người làm
**Hong**
