# SƠ ĐỒ KIẾN TRÚC THÔNG TIN (IA) MOBILE LIENG — SPRINT S5
> Tài liệu kỹ thuật giải quyết Issue #115 & #116: **Chốt IA Mobile Lieng — Thay thế module Quán web cũ thành Shell Cửa hàng Điện thoại Lieng Mobile**.

---

## 1. Bối cảnh & Vấn đề giải quyết

- **Hiện trạng cũ**: Mobile app Expo đang clone toàn bộ theo module Quán cũ (`/quan`: Quầy, Sao kê, Ghi chi, Kho sao kê, API `/api/v1/quan/*`).
- **Thực tế hệ thống Lieng Mobile**: Cửa hàng bán lẻ điện thoại thông minh, máy tính bảng, phụ kiện, có quản lý số IMEI, đơn hàng bán lẻ (POS), bảo hành và thẩm định thu cũ đổi mới.
- **Quyết định kiến trúc**: 
  - Chuyển đổi toàn bộ Shell app thành **Lieng Mobile Store App**.
  - Module Quán cũ (nếu dùng) chỉ còn là 1 sub-flow phụ hoặc dành riêng cho role `quan_*`.
  - Hệ thống Tab chính phản ánh đầy đủ hoạt động của một cửa hàng điện thoại.

---

## 2. Hệ thống Tab Bar mới (Bottom Tabs)

Thanh điều hướng dưới đáy (Bottom Tab Bar) gồm **5 Tab chính**:

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  Trang chủ   │   Bán hàng   │   Đơn hàng   │   Dịch vụ    │     Tôi      │
│   (Home)     │    (POS)     │   (Orders)   │  (Services)  │  (Account)   │
│   #120       │    #121      │    #122      │  #123,#124,#125│    #126      │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Chi tiết 5 Tabs:

### Tab 1: Trang chủ (`/home`) — Issue #120
- **Mục đích**: Bảng điều khiển (Dashboard) đầu ngày cho nhân viên và quản lý cửa hàng.
- **Thành phần UI**:
  - Header: Lời chào nhân viên, ca làm việc, trạng thái kết nối mạng.
  - Thẻ chỉ số nhanh: Doanh số hôm nay, Số đơn hoàn thành, Máy đang thẩm định, Máy đang bảo hành.
  - Phím tắt tác vụ nhanh (Quick Actions): 
    - `+ Tạo đơn POS mới`
    - `+ Thẩm định máy cũ`
    - `Tra cứu IMEI / Bảo hành`
    - `Mở Quầy nhỏ (Module Quán cũ)`
  - Hoạt động gần đây: Danh sách 5 đơn hàng mới nhất trong ca.

### Tab 2: Bán hàng POS (`/pos`) — Issue #121
- **Mục đích**: Trực tiếp tạo đơn bán điện thoại, máy tính bảng, phụ kiện tại quầy.
- **Thành phần UI**:
  - Ô tìm kiếm sản phẩm theo tên / mã SKU / quét Barcode.
  - Bộ lọc danh mục: iPhone, iPad, Samsung, Phụ kiện, v.v.
  - Chọn máy & chọn số IMEI tương ứng.
  - Giỏ hàng (Cart Sheet): Số lượng, giảm giá, thông tin khách hàng (SĐT/Tên).
  - Thanh toán: Tiền mặt, Chuyển khoản, Kết hợp, Quét mã VietQR.

### Tab 3: Đơn hàng (`/orders`) — Issue #122
- **Mục đích**: Theo dõi, tra cứu và xử lý đơn hàng bán ra.
- **Thành phần UI**:
  - Bộ lọc trạng thái: Tất cả, Hoàn thành, Chờ thanh toán, Đã hủy.
  - Bộ lọc theo ngày / ca làm việc.
  - Thẻ đơn hàng: Mã đơn, Thời gian, Tên khách hàng, Tổng tiền, Phương thức thanh toán, Danh sách IMEI máy đã xuất.
  - Xem chi tiết đơn / In hóa đơn / Chia sẻ hóa đơn.

### Tab 4: Hub Dịch vụ (`/services`) — Issue #123, #124, #125
- **Mục đích**: Trung tâm dịch vụ kỹ thuật và hậu mãi của cửa hàng điện thoại.
- **2 Phân hệ cốt lõi**:
  1. **Thẩm định máy cũ (AutoGrade / Appraisal — #125)**:
     - Danh sách phiếu thẩm định thu cũ đổi mới.
     - Tạo phiếu thẩm định: Hãng, Model, Dung lượng, Ngoại quan (99%, 98%, cấn móp), Tình trạng pin, Màn hình, Tính năng.
     - Đề xuất giá thu mua từ hệ thống / người duyệt.
  2. **Bảo hành & Sửa chữa (Warranty — #124)**:
     - Tra cứu thông tin bảo hành theo số IMEI hoặc SĐT khách.
     - Tiếp nhận bảo hành, ghi nhận tình trạng lỗi, hẹn ngày trả máy.

### Tab 5: Tài khoản / Tôi (`/account`) — Issue #126
- **Mục đích**: Quản lý thông tin cá nhân, phân quyền, cấu hình kết nối.
- **Thành phần UI**:
  - Profile nhân viên: Avatar, Tên, Email, SĐT, Chức vụ (Admin, Nhân viên bán hàng, Kỹ thuật, Quán).
  - Đổi ngôn ngữ (Tiếng Việt / Tiếng Lào).
  - Cấu hình máy chủ API (chuyển đổi LAN IP / Cloud URL).
  - Lối vào Module Quán cũ (dành riêng cho tài khoản quản lý Quán).
  - Đăng xuất an toàn.

---

## 3. Bản đồ Route & Migration Plan (Expo Router)

```
app/
├── index.tsx                  # Splash / Role redirect
├── login.tsx                  # Login Shell Lieng Mobile (#118)
├── (app)/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx        # LiengTabBar mới (#119)
│   │   ├── home.tsx           # Tab 1: Trang chủ (#120)
│   │   ├── pos.tsx            # Tab 2: Bán hàng POS (#121)
│   │   ├── orders.tsx         # Tab 3: Đơn hàng (#122)
│   │   ├── services.tsx       # Tab 4: Hub Dịch vụ (#123)
│   │   └── account.tsx        # Tab 5: Tài khoản (#126)
│   ├── appraisal/             # Phân hệ Thẩm định (#125)
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── warranty/              # Phân hệ Bảo hành (#124)
│   │   ├── index.tsx
│   │   └── lookup.tsx
│   └── quan/                  # Module Quán cũ chuyển về đây làm sub-flow
│       ├── quay.tsx
│       ├── statement.tsx
│       └── archive.tsx
```

---

## 4. Định nghĩa hoàn thành (DoD)
- [x] Tài liệu IA được lưu tại `docs/mobile-ia-lieng.md`.
- [x] Danh sách 5 Tabs mới tương ứng với các issue con #118 – #126.
- [x] Thống nhất màu sắc thương hiệu `#7A0C10` (Đỏ Lieng), không dùng tone tím/indigo.
- [x] Phân biệt rõ: Module Quán chỉ là sub-module phụ.

