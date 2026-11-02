# Lieng Mobile — Trình bày Flow thiết kế

**Số flow thiết kế chính: 10**

Phạm vi: Intro + Admin Web (menu chính). Không gồm Quán / Nghe tiếng Lào.
Figma: https://www.figma.com/design/4dtLtRxARI9g6cInNbCXAQ/Lieng-Mobile?node-id=3-2

## Bản đồ flow

| # | Mã | Flow | Actor | Route chính |
|---|-----|------|-------|-------------|
| 1 | F01 | Khách truy cập cửa hàng (Intro) | Khách hàng (chưa đăng nhập) | `/ → /login` |
| 2 | F02 | Đăng nhập & vào Admin theo vai trò | Admin / NV bán / NV kho | `/login → /dashboard | /pos | /inventory/imports` |
| 3 | F03 | Tổng quan cửa hàng | Admin, NV kho (xem) | `/dashboard` |
| 4 | F04 | Quản lý hàng hóa (Danh mục + Sản phẩm) | Admin, NV kho | `/products/categories ↔ /products → /products/:id/edit` |
| 5 | F05 | Nhập kho & IMEI | Admin, NV kho | `/inventory/imports → /inventory/imports/create → confirm` |
| 6 | F06 | Quầy bán hàng (POS) | Admin, NV bán hàng | `/pos → checkout → /orders (tuỳ chọn)` |
| 7 | F07 | Đơn hàng | Admin, NV bán hàng | `/orders` |
| 8 | F08 | Khách hàng | Admin, NV bán hàng | `/customers` |
| 9 | F09 | Kế toán — Thu chi & Báo cáo | Admin | `/finance ↔ /reports` |
| 10 | F10 | Dịch vụ & Hệ thống | Admin (+ NV bán/kho với Bảo hành) | `/warranty · /users · /profile` |

## F01 — Khách truy cập cửa hàng (Intro)

- **Actor:** Khách hàng (chưa đăng nhập)
- **Mục tiêu:** Xem thông tin cửa hàng, sản phẩm, khuyến mãi; chuyển sang khu vực nhân viên khi cần.
- **Màn hình:** Intro / Trang chủ, Modal chi tiết sản phẩm, CTA → Login
- **Route:** `/ → /login`
- **Figma:** Intro, Login (prototype)

**Các bước:**

1. Vào `/` — hero, danh mục, sản phẩm, dịch vụ, chi nhánh
2. Lọc theo danh mục / thương hiệu, mở modal sản phẩm
3. Bấm khu vực nhân viên / Đăng nhập → `/login`

## F02 — Đăng nhập & vào Admin theo vai trò

- **Actor:** Admin / NV bán / NV kho
- **Mục tiêu:** Xác thực, redirect đúng trang mặc định theo role, chặn route không có quyền.
- **Màn hình:** Login, Dashboard (hoặc POS / Nhập kho theo role)
- **Route:** `/login → /dashboard | /pos | /inventory/imports`
- **Figma:** Login, Tổng quan (Dashboard)

**Các bước:**

1. Nhập email + mật khẩu trên `/login`
2. API auth → lưu session
3. Redirect: admin→Dashboard, sales→POS, warehouse→Nhập kho
4. Sidebar chỉ hiện mục được phép (roles-permissions)

## F03 — Tổng quan cửa hàng

- **Actor:** Admin, NV kho (xem)
- **Mục tiêu:** Nhìn nhanh doanh thu, đơn, tồn IMEI; nhảy tới POS / nhập kho.
- **Màn hình:** Dashboard, Quick action → POS / Nhập kho
- **Route:** `/dashboard`
- **Figma:** Tổng quan (Dashboard) — AdminSidebar Expanded

**Các bước:**

1. Vào `/dashboard` — banner chào + giờ mở cửa
2. Xem KPI, biểu đồ, đơn gần đây
3. Bấm “Mở quầy bán” hoặc “Tạo phiếu nhập”

## F04 — Quản lý hàng hóa (Danh mục + Sản phẩm)

- **Actor:** Admin, NV kho
- **Mục tiêu:** Tạo/sửa danh mục; xem danh sách sản phẩm & biến thể; chỉnh sửa dòng máy.
- **Màn hình:** Danh mục — list / modal thêm, Sản phẩm — list, Sửa sản phẩm (edit scroll)
- **Route:** `/products/categories ↔ /products → /products/:id/edit`
- **Figma:** Danh mục sản phẩm, Danh sách sản phẩm, Chỉnh sửa sản phẩm

**Các bước:**

1. Danh mục: `/products/categories` → Thêm / sửa nhóm hàng
2. Sản phẩm: `/products` — lọc, tìm, xem tồn & giá
3. Mở `/products/:id/edit` — cập nhật thông tin & bảng giá

## F05 — Nhập kho & IMEI

- **Actor:** Admin, NV kho
- **Mục tiêu:** Tạo phiếu nhập, gắn sản phẩm + IMEI, xác nhận → tồn kho tăng, ghi chi.
- **Màn hình:** Danh sách phiếu nhập, Tạo / chi tiết phiếu nhập
- **Route:** `/inventory/imports → /inventory/imports/create → confirm`
- **Figma:** Nhập kho — Danh sách, Nhập kho — Tạo phiếu

**Các bước:**

1. `/inventory/imports` — xem phiếu draft / confirmed
2. Tạo phiếu → thêm dòng hàng + số lượng
3. Nhập / quét IMEI (đủ số lượng)
4. Xác nhận phiếu → IMEI `in_stock` + transaction chi

## F06 — Quầy bán hàng (POS)

- **Actor:** Admin, NV bán hàng
- **Mục tiêu:** Chọn danh mục → sản phẩm → IMEI → thanh toán; xuất hóa đơn.
- **Màn hình:** POS — chọn danh mục, Giỏ / thanh toán, Hoàn tất
- **Route:** `/pos → checkout → /orders (tuỳ chọn)`
- **Figma:** Quầy bán hàng (POS)

**Các bước:**

1. `/pos` — chọn danh mục (Điện thoại, Tablet…)
2. Chọn SP + IMEI còn tồn
3. Chọn KH (tuỳ chọn), giảm giá, PT thanh toán
4. Thanh toán → order completed + IMEI `sold` + thu

## F07 — Đơn hàng

- **Actor:** Admin, NV bán hàng
- **Mục tiêu:** Tra cứu hóa đơn trong ngày / lịch sử; xem chi tiết drawer.
- **Màn hình:** Danh sách đơn hàng, Drawer chi tiết đơn
- **Route:** `/orders`
- **Figma:** Đơn hàng — Chi tiết (Drawer)

**Các bước:**

1. `/orders` — lọc theo ngày, trạng thái, tìm mã
2. Mở drawer chi tiết: dòng hàng, IMEI, thanh toán
3. In / xuất lại nếu cần

## F08 — Khách hàng

- **Actor:** Admin, NV bán hàng
- **Mục tiêu:** Thêm / sửa hồ sơ KH; xem lịch sử mua & điểm.
- **Màn hình:** Danh sách khách hàng, Modal thêm KH, Chi tiết / drawer hồ sơ
- **Route:** `/customers`
- **Figma:** Danh sách khách hàng, Thêm khách hàng, Chi tiết khách hàng

**Các bước:**

1. `/customers` — tìm theo tên / SĐT
2. Thêm khách hàng (modal)
3. Mở chi tiết — hạng thành viên, đơn, điểm
4. Chỉnh sửa hồ sơ

## F09 — Kế toán — Thu chi & Báo cáo

- **Actor:** Admin
- **Mục tiêu:** Ghi phiếu thu/chi; xem báo cáo doanh thu & tồn theo kỳ.
- **Màn hình:** Thu chi — Sổ quỹ, Báo cáo doanh thu
- **Route:** `/finance ↔ /reports`
- **Figma:** Thu chi — Sổ quỹ, Báo cáo doanh thu

**Các bước:**

1. `/finance` — lọc kỳ, ghi phiếu thu / chi
2. `/reports` — chọn 7 ngày / tháng / quý
3. Xem KPI + xu hướng; xuất Excel nếu cần

## F10 — Dịch vụ & Hệ thống

- **Actor:** Admin (+ NV bán/kho với Bảo hành)
- **Mục tiêu:** Tra cứu bảo hành theo IMEI; quản lý nhân viên; chỉnh hồ sơ cá nhân.
- **Màn hình:** Bảo hành — tra IMEI, Nhân viên, Hồ sơ cá nhân
- **Route:** `/warranty · /users · /profile`
- **Figma:** Bảo hành, Nhân viên, Hồ sơ cá nhân

**Các bước:**

1. `/warranty` — nhập IMEI 15 số → thông tin BH / sửa chữa
2. `/users` (admin) — tạo / khóa tài khoản đăng nhập
3. `/profile` — đổi thông tin / mật khẩu

## Ghi chú triển khai trên Figma

1. Mỗi flow gắn prototype `NAVIGATE` giữa các frame tương ứng.
2. Dashboard dùng AdminSidebar **Expanded**; các trang khác **Collapsed**.
3. Active icon menu phải khớp trang hiện tại.
4. Khi demo bài: đi tuần tự F01 → F10 (hoặc chọn 1 role: Admin đi đủ; Sales: F02→F06→F07→F08→F10).

## Tài liệu bổ sung — tương tác & phân quyền

Chi tiết từng thao tác UI (thêm/sửa/xóa/thanh toán…) và **Admin thấy gì / NV bán thấy gì / NV kho thấy gì**:

- `docs/tuong-tac-va-phan-quyen.docx` (và bản trong `NOP_BAI_THIET_KE/08_Tuong_tac_va_phan_quyen/`)
- `docs/roles-permissions.md` (ma trận kỹ thuật)
