# Lieng Mobile — Tương tác người dùng & Phân quyền

Tài liệu bổ sung cho gói thiết kế: mô tả **từng thao tác UI** (thêm/sửa/xóa/thanh toán…) và **Admin thấy gì / Nhân viên thấy gì**.

Phạm vi chính: Intro + Admin Web (menu hiện tại). Mật khẩu demo: `password`.

---

## 1. Ba vai trò cửa hàng (so sánh nhanh)

### Admin (Chủ cửa hàng) (`admin`)

- **Email demo:** `admin@liengmobile.com`
- **Sau đăng nhập vào:** `/dashboard`
- **Menu sidebar:** Tổng quan, Sản phẩm, Danh mục, Nhập kho, Quầy bán hàng (POS), Đơn hàng, Khách hàng, Thu chi, Báo cáo, Bảo hành, Nhân viên, Hồ sơ
- **Nhìn thấy thêm:**
  - Dashboard: KPI đầy đủ + đơn gần đây + hoạt động nhân viên
  - Thông báo hệ thống trên header
  - Toàn bộ nút Thêm / Sửa / Xóa / Xác nhận
  - Menu Thu chi, Báo cáo, Nhân viên (chỉ Admin)

### Nhân viên bán hàng (`sales_staff`)

- **Email demo:** `banhang@liengmobile.com`
- **Sau đăng nhập vào:** `/pos`
- **Menu sidebar:** Sản phẩm (chỉ xem), Quầy bán hàng (POS), Đơn hàng, Khách hàng, Bảo hành, Hồ sơ
- **Nhìn thấy thêm:**
  - Sau login vào thẳng POS để bán
  - Có thể thêm / sửa khách hàng, bán hàng, hủy đơn, tra BH + tạo phiếu sửa
  - Xem danh sách sản phẩm / tồn / giá (không vào Danh mục, Nhập kho)
- **Không được:**
  - Không thấy: Tổng quan, Danh mục, Nhập kho, Thu chi, Báo cáo, Nhân viên
  - Không tạo / sửa / xóa sản phẩm hay danh mục
  - Không tạo phiếu nhập kho / xác nhận IMEI
  - Không ghi sổ thu chi cửa hàng

### Nhân viên kho (`warehouse_staff`)

- **Email demo:** `kho@liengmobile.com`
- **Sau đăng nhập vào:** `/inventory/imports`
- **Menu sidebar:** Tổng quan (xem), Sản phẩm, Danh mục, Nhập kho, Khách hàng (chỉ xem), Báo cáo (tồn / liên quan kho), Bảo hành (tra cứu), Hồ sơ
- **Nhìn thấy thêm:**
  - Sau login vào Nhập kho
  - Dashboard: cảnh báo phiếu draft + hàng sắp hết (không có bảng hoạt động NV)
  - Tạo phiếu nhập, nạp IMEI, xác nhận nhập kho; quản lý danh mục
- **Không được:**
  - Không thấy: POS, Đơn hàng, Thu chi, Nhân viên
  - Không bán hàng / checkout / hủy đơn
  - Không tạo phiếu sửa chữa bảo hành (chỉ tra cứu)
  - Không tạo / sửa khách hàng

## 2. Ma trận quyền theo hành động

| Module | Hành động | Admin | NV bán | NV kho |
|--------|-----------|:-----:|:------:|:------:|
| Đăng nhập / Hồ sơ | Đăng nhập, đổi mật khẩu, xem quyền | A/S/W | A/S/W | A/S/W |
| Tổng quan | Xem KPI, đơn gần đây | ✓ | — (không vào) | ✓ xem |
| Tổng quan | Xem hoạt động nhân viên | ✓ | — | — |
| Tổng quan | Quick action → POS | ✓ | — (đã ở POS) | — |
| Tổng quan | Quick action → Tạo phiếu nhập | ✓ | — | ✓ |
| Danh mục | Xem danh sách | ✓ | — | ✓ |
| Danh mục | Thêm / Sửa / Xóa danh mục | ✓ | — | ✓ |
| Sản phẩm | Xem danh sách, lọc, xuất | ✓ | ✓ xem | ✓ |
| Sản phẩm | Sửa sản phẩm / biến thể / giá | ✓ | — | ✓ (tạo qua nhập kho) |
| Sản phẩm | Xóa sản phẩm | ✓ | — | — (thường Admin) |
| Nhập kho | Xem phiếu draft / confirmed | ✓ | — | ✓ |
| Nhập kho | Tạo phiếu, thêm dòng, nạp IMEI | ✓ | — | ✓ |
| Nhập kho | Xác nhận phiếu → tăng tồn | ✓ | — | ✓ |
| POS | Chọn SP + IMEI, giỏ hàng | ✓ | ✓ | — |
| POS | Gắn khách, giảm giá, thanh toán | ✓ | ✓ | — |
| POS | Hủy đơn chờ QR / checkout | ✓ | ✓ | — |
| Đơn hàng | Lọc, xem drawer chi tiết | ✓ | ✓ | — |
| Đơn hàng | Hủy đơn / xuất lại | ✓ | ✓ | — |
| Khách hàng | Xem danh sách + lịch sử | ✓ | ✓ | ✓ xem |
| Khách hàng | Thêm / Sửa khách | ✓ | ✓ | — |
| Thu chi | Xem sổ + ghi phiếu thu/chi | ✓ | — | — |
| Báo cáo | Xem / xuất báo cáo | ✓ | — | ✓ (tồn / báo cáo kho) |
| Bảo hành | Tra cứu IMEI | ✓ | ✓ | ✓ |
| Bảo hành | Tạo phiếu sửa chữa | ✓ | ✓ | — |
| Nhân viên | Tạo / sửa / khóa / xóa tài khoản | ✓ | — | — |

> Ký hiệu: `✓` = làm được · `—` = không có menu / bị chặn · ghi chú trong ô = quyền hạn chế.

---

## 3. Tương tác chi tiết theo màn hình

### 1. F01 — Intro (khách chưa đăng nhập)

- **Actor:** Khách hàng
- **Route:** `/`
- **Bước tương tác:**
  1. Vào trang Intro: xem hero, danh mục, sản phẩm nổi bật, dịch vụ, chi nhánh.
  2. Lọc theo danh mục / thương hiệu trên lưới sản phẩm.
  3. Bấm 1 sản phẩm → mở modal chi tiết (ảnh, giá, mô tả ngắn).
  4. Đóng modal hoặc tiếp tục duyệt.
  5. Bấm «Khu vực nhân viên» / «Đăng nhập» → chuyển `/login`.
- **Thành phần UI:** Hero CTA, Filter danh mục, Modal sản phẩm, Link Login

### 2. F02 — Đăng nhập theo vai trò

- **Actor:** Admin / NV bán / NV kho
- **Route:** `/login`
- **Bước tương tác:**
  1. Nhập email + mật khẩu (có thể dùng nút đăng nhập nhanh demo).
  2. Bấm Đăng nhập → API auth, lưu token/session.
  3. Redirect mặc định: Admin → `/dashboard` · NV bán → `/pos` · NV kho → `/inventory/imports`.
  4. Sidebar chỉ hiện mục thuộc role; vào URL không quyền → bị chặn / đẩy về trang mặc định.
  5. Header hiện tên + badge role; Admin thấy chuông thông báo.
- **Thành phần UI:** Form email/password, Hiện/ẩn mật khẩu, Quick login demo, Sidebar theo role

### 3. F03 — Tổng quan cửa hàng

- **Actor:** Admin (+ NV kho xem một phần)
- **Route:** `/dashboard`
- **Bước tương tác:**
  1. Xem banner chào theo role + giờ mở cửa.
  2. Đọc 4 KPI: doanh thu hôm nay, số đơn, IMEI tồn, doanh thu tháng.
  3. Xem bảng đơn gần đây → «Xem tất cả» sang `/orders` (Admin).
  4. Khối Việc cần làm: Mở quầy bán / Tạo phiếu nhập / Tra IMEI (lọc theo role).
  5. Admin + NV kho: khối cảnh báo phiếu draft + hàng sắp hết → sang Nhập kho.
  6. Chỉ Admin: bảng «Hoạt động nhân viên» (ai vừa bán / nhập…).
- **Thành phần UI:** Stat cards, Bảng đơn, Quick actions, Cảnh báo kho, Staff activity
- **Khác nhau theo role:**
  - **Admin:** Đủ KPI + staff activity + mọi quick action.
  - **NV bán:** Không vào Dashboard (menu ẩn); làm việc từ POS.
  - **NV kho:** Có Dashboard + cảnh báo kho; không có staff activity; quick action nhập kho / BH.

### 4. F04a — Danh mục sản phẩm

- **Actor:** Admin, NV kho
- **Route:** `/products/categories`
- **Bước tương tác:**
  1. Vào Danh mục — xem lưới / danh sách nhóm hàng (icon, tên, số SP).
  2. Bấm «+ Thêm danh mục» → modal: tên, icon → Lưu.
  3. Bấm 1 dòng → drawer/chi tiết; từ đó Sửa hoặc Xóa.
  4. Sửa: đổi tên/icon → Lưu; Xóa: confirm dialog.
  5. NV bán: không thấy menu Danh mục.
- **Thành phần UI:** Nút + Thêm, Modal thêm/sửa, Drawer chi tiết, Nút Sửa / Xóa, Confirm xóa

### 5. F04b — Danh sách & sửa sản phẩm

- **Actor:** Admin, NV kho (sửa/tạo); NV bán (chỉ xem)
- **Route:** `/products → /products/:id/edit`
- **Bước tương tác:**
  1. Vào Sản phẩm: tìm kiếm, lọc danh mục/thương hiệu, xem tồn & giá.
  2. Xuất danh sách (nếu có nút Xuất).
  3. Bấm dòng / nút Sửa → `/products/:id/edit`.
  4. Trên form sửa: cập nhật tên, mô tả, ảnh, biến thể (màu/dung lượng), giá bán, trạng thái.
  5. Lưu thay đổi → quay lại list hoặc ở lại form với toast thành công.
  6. Admin có thể Xóa sản phẩm (confirm). NV bán chỉ xem list, không vào edit / không xóa.
  7. Sản phẩm mới thường được tạo khi xác nhận phiếu Nhập kho (không bắt buộc form «Tạo SP» riêng).
- **Thành phần UI:** Search / filter, Bảng sản phẩm, Trang sửa (scroll), Lưu / Xóa, Toast
- **Khác nhau theo role:**
  - **Admin:** Xem + sửa + xóa.
  - **NV bán:** Chỉ xem list (giá, tồn) để tư vấn khi bán.
  - **NV kho:** Xem + tạo qua nhập kho; chỉnh thông tin khi cần.

### 6. F05 — Nhập kho & IMEI

- **Actor:** Admin, NV kho
- **Route:** `/inventory/imports → create → confirm`
- **Bước tương tác:**
  1. Vào Nhập kho: xem thống kê draft / đã xác nhận; mở phiếu cũ.
  2. Bấm tạo phiếu mới → `/inventory/imports/create` (hoặc chi tiết draft).
  3. Thêm dòng hàng: chọn từ catalog HOẶC nhập sản phẩm mới (tên, biến thể, SL, giá nhập).
  4. Với máy cần IMEI: dán/quét IMEI (mỗi dòng hoặc cách nhau dấu phẩy) đủ số lượng.
  5. Hệ thống validate: trùng IMEI, thiếu số lượng, format 15 số.
  6. Lưu draft bất cứ lúc nào; khi đủ IMEI → «Xác nhận phiếu nhập».
  7. Sau confirm: IMEI = in_stock, tồn tăng, có thể ghi chi phí nhập; phiếu chuyển readonly.
- **Thành phần UI:** List phiếu + badge draft/confirmed, Form thêm từ catalog / sản phẩm mới, Ô dán/quét IMEI, Thanh tiến độ IMEI đã nạp, Nút Xác nhận phiếu nhập
- **Khác nhau theo role:**
  - **Admin:** Toàn quyền.
  - **NV bán:** Không thấy module.
  - **NV kho:** Đây là màn chính sau login.

### 7. F06 — Quầy bán hàng (POS)

- **Actor:** Admin, NV bán hàng
- **Route:** `/pos`
- **Bước tương tác:**
  1. Mở POS (layout riêng / full quầy).
  2. Chọn danh mục (Điện thoại, Tablet…) → chọn sản phẩm còn tồn.
  3. Chọn IMEI cụ thể còn `in_stock` → thêm vào giỏ.
  4. Tuỳ chọn: nhập SĐT khách → gợi ý / chọn khách (hoặc khách lẻ).
  5. Tuỳ chọn: giảm giá dòng hoặc tổng; chọn PT thanh toán (tiền mặt / CK / kết hợp).
  6. Bấm Thanh toán → nếu CK: hiện QR, poll trạng thái; có thể hủy QR giữ giỏ.
  7. Thành công: order completed, IMEI → sold, ghi thu; hiện mã đơn; có thể bán tiếp.
- **Thành phần UI:** Lưới danh mục / sản phẩm, Chọn IMEI, Giỏ hàng + giảm giá, Lookup khách theo SĐT, Modal thanh toán / QR, Toast đơn thành công
- **Khác nhau theo role:**
  - **Admin:** Bán được như NV bán.
  - **NV bán:** Màn hình mặc định sau login.
  - **NV kho:** Không thấy POS.

### 8. F07 — Đơn hàng

- **Actor:** Admin, NV bán hàng
- **Route:** `/orders`
- **Bước tương tác:**
  1. Lọc kỳ: Hôm nay / Hôm qua / Tất cả; tìm mã đơn.
  2. Bấm 1 đơn → drawer chi tiết: dòng hàng, IMEI, khách, PT thanh toán, trạng thái.
  3. Hủy đơn (nếu còn cho phép) → confirm → trạng thái cancelled.
  4. Xuất danh sách đơn (Excel) nếu cần.
- **Thành phần UI:** Filter kỳ, Bảng đơn, Drawer chi tiết, Hủy đơn, Xuất

### 9. F08 — Khách hàng

- **Actor:** Admin, NV bán (full); NV kho (xem)
- **Route:** `/customers`
- **Bước tương tác:**
  1. Tìm theo tên / SĐT.
  2. «+ Thêm khách» → modal: tên, SĐT, ghi chú → Lưu.
  3. Mở chi tiết / drawer: hạng thành viên, điểm, lịch sử đơn.
  4. Sửa hồ sơ từ chi tiết → lưu.
  5. NV kho chỉ xem danh sách (không thêm/sửa).
- **Thành phần UI:** Search, Modal thêm, Drawer/chi tiết, Sửa hồ sơ, Lịch sử mua

### 10. F09a — Thu chi cửa hàng

- **Actor:** Chỉ Admin
- **Route:** `/finance`
- **Bước tương tác:**
  1. Xem sổ quỹ theo kỳ; lọc thu / chi.
  2. «Phiếu thu» / «Phiếu chi» → modal: số tiền, danh mục, hình thức TT, ghi chú → Lưu.
  3. Bấm dòng → drawer chi tiết.
  4. Xuất giao dịch nếu cần.
- **Thành phần UI:** Filter kỳ, Nút phiếu thu/chi, Modal ghi sổ, Drawer, Xuất

### 11. F09b — Báo cáo

- **Actor:** Admin (+ NV kho báo cáo tồn)
- **Route:** `/reports`
- **Bước tương tác:**
  1. Chọn kỳ: 7 ngày / tháng / quý.
  2. Xem KPI + biểu đồ xu hướng doanh thu / tồn.
  3. Xuất Excel khi cần.
- **Thành phần UI:** Chọn kỳ, KPI + chart, Xuất báo cáo

### 12. F10a — Bảo hành

- **Actor:** Admin, NV bán (full); NV kho (tra cứu)
- **Route:** `/warranty`
- **Bước tương tác:**
  1. Nhập IMEI 15 số → Tra cứu.
  2. Xem kết quả: SP, biến thể, KH, trạng thái BH, hạn.
  3. Mở chi tiết phiếu; Admin/NV bán: tạo phiếu sửa chữa (mô tả + chi phí) → Lưu.
  4. NV kho: chỉ tra cứu, không tạo phiếu sửa.
- **Thành phần UI:** Ô IMEI, Kết quả tra, Drawer chi tiết, Form phiếu sửa

### 13. F10b — Nhân viên (Users)

- **Actor:** Chỉ Admin
- **Route:** `/users`
- **Bước tương tác:**
  1. Xem danh sách tài khoản + badge role; lọc theo role.
  2. «+ Thêm nhân viên» → modal: tên, email, SĐT, role (không tạo thêm Admin), mật khẩu → Lưu.
  3. Mở chi tiết → sửa role / thông tin; khóa hoặc xóa tài khoản (confirm).
  4. NV bán / NV kho: không thấy menu Nhân viên.
- **Thành phần UI:** Filter role, Modal tạo NV, Form sửa, Khóa / Xóa

### 14. F10c — Hồ sơ cá nhân

- **Actor:** Mọi role đã đăng nhập
- **Route:** `/profile`
- **Bước tương tác:**
  1. Xem tên, email, badge role, danh sách quyền được cấp.
  2. Đổi thông tin cá nhân / mật khẩu → Lưu.
  3. Xem thống kê / hoạt động gần đây theo role (bán vs kho).
- **Thành phần UI:** Card hồ sơ, Danh sách permissions, Form đổi MK

---

## 4. Tài khoản demo để trình bày

| Vai trò | Email | Mật khẩu | Trang vào |
|---------|-------|----------|-----------|
| Admin | `admin@liengmobile.com` | `password` | `/dashboard` |
| NV bán hàng | `banhang@liengmobile.com` | `password` | `/pos` |
| NV kho | `kho@liengmobile.com` | `password` | `/inventory/imports` |

## 5. Gợi ý demo khi bảo vệ / nộp bài

1. **Đăng nhập Admin** → đi tuần tự: Dashboard → Danh mục (thêm) → Sản phẩm (sửa) → Nhập kho (tạo phiếu + IMEI) → POS (bán) → Đơn hàng → Khách → Thu chi → Báo cáo → Bảo hành → Nhân viên.
2. **Đăng xuất → NV bán** → chỉ thấy POS / Đơn / KH / BH / SP xem; thử vào `/finance` hoặc `/users` bị chặn.
3. **Đăng xuất → NV kho** → Nhập kho + Danh mục; không thấy POS / Thu chi / Nhân viên.

Tham chiếu kỹ thuật: `docs/roles-permissions.md`, `frontend/src/data/adminNav.js`, `backend/database/seeders/RolePermissionSeeder.php`.
