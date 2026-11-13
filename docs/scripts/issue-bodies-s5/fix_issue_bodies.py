# -*- coding: utf-8 -*-
from pathlib import Path

out = Path(__file__).resolve().parent

bodies = {
    93: """## Mục tiêu
Role Quán / Admin / NV sau login vào đúng trang mặc định, không lạc menu.

## Việc cần làm
- [ ] Rà `roleRedirect` + `routeAccess`: Quán → `/quan`, Admin → `/dashboard`, sales → `/pos` (hoặc mặc định hợp lý)
- [ ] LoginView: thông báo lỗi rõ, loading state, không flash sai route
- [ ] Sau login redirect đúng role (test 2–3 account)

## Acceptance Criteria
- [ ] AC1: `quan_*` login xong vào Quán (không vào Dashboard Admin đầy menu)
- [ ] AC2: `admin` vào Dashboard
- [ ] AC3: Sai mật khẩu hiện lỗi tiếng Việt rõ
- [ ] AC4: PR + CI xanh + request Bao review

## Người làm
**Hong**
""",
    94: """## Mục tiêu
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
""",
    95: """## Mục tiêu
Dashboard nhìn "vào là hiểu" — số liệu / empty / error rõ cho demo UAT.

## Việc cần làm
- [ ] Empty state khi API lỗi / không có data
- [ ] Loading skeleton hoặc spinner nhất quán
- [ ] Ưu tiên card: doanh thu / đơn / tồn (nếu API có)
- [ ] Bỏ/ẩn block gây rối nếu mock lệch

## Acceptance Criteria
- [ ] AC1: Không trắng trang khi API fail — có message + nút thử lại
- [ ] AC2: Desktop + mobile width đọc được
- [ ] AC3: PR + CI + Bao review

## Người làm
**Hong**
""",
    96: """## Mục tiêu
POS là luồng demo tiền cửa hàng — gọn, ít lệch tay, rõ tổng tiền.

## Việc cần làm
- [ ] Làm rõ: chọn SP → giỏ → thanh toán → xong
- [ ] Tổng tiền / thiếu tiền / nút thanh toán nổi bật
- [ ] Empty giỏ + lỗi API rõ
- [ ] Giảm clutter (nút/secondary ít hơn)

## Acceptance Criteria
- [ ] AC1: Hoàn tất 1 đơn demo < 1 phút (máy có sẵn)
- [ ] AC2: Không crash khi giỏ rỗng / API lỗi
- [ ] AC3: Screenshot trước/sau trong PR
- [ ] AC4: PR + CI + request Hong review

## Người làm
**Bao**
""",
    97: """## Mục tiêu
Quán board bớt rối: ghi thu/chi nhanh, list hôm nay đọc được.

## Việc cần làm
- [ ] Tách vùng: form ghi nhanh | list hôm nay | (phụ) quản lý SP Quán
- [ ] Nhãn tiếng Việt rõ (TM / CK / mixed)
- [ ] Confirm trước khi xóa entry
- [ ] Responsive: điện thoại vẫn ghi được

## Acceptance Criteria
- [ ] AC1: Thêm 1 phiếu thu trong < 30s
- [ ] AC2: List hôm nay không vỡ layout
- [ ] AC3: Screenshot PR
- [ ] AC4: PR + CI + Hong review

## Người làm
**Bao**
""",
    98: """## Mục tiêu
Sao kê + chi phí Quán khớp board, xuất ảnh/PDF không lệch.

## Việc cần làm
- [ ] `QuanStatementsView`: filter kỳ rõ, empty state
- [ ] `QuanCostsView`: form/list gọn
- [ ] Export PNG/PDF (nếu có) không cắt chữ
- [ ] Link điều hướng Board ↔ Sao kê ↔ Chi phí rõ

## Acceptance Criteria
- [ ] AC1: Xem sao kê theo kỳ không lỗi
- [ ] AC2: Thêm/xem chi phí cơ bản OK
- [ ] AC3: PR + CI + Hong review

## Người làm
**Bao**
""",
}

for num, body in bodies.items():
    path = out / f"issue-{num}.md"
    path.write_text(body.strip() + "\n", encoding="utf-8")
    print(f"wrote {path.name}")
