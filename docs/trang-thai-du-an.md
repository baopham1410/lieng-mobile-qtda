# Lieng Mobile — Trạng thái dự án & vấn đề còn lại

> Cập nhật: **23/07/2026**  
> Mục đích: tóm tắt monorepo đang ở đâu, bản đồ giao diện, phần còn treo.  
> **Lưu ý:** module **Quán** được coi là **dự án sản phẩm riêng** (cửa hàng nhỏ) — xem [`quan-project.md`](./quan-project.md).

---

## 1. Dự án là gì?

Monorepo chứa **hai hướng sản phẩm** (chung code/API, tách nghiệp vụ):

| Sản phẩm | Dùng để | Điểm vào chính |
|----------|---------|----------------|
| **Quán** (ưu tiên hiện tại) | Quản lý **cửa hàng nhỏ**: bán nhanh, ghi chi, sao kê ngày | `/quan`, app `mobile-expo`, roles `quan_manager` / `quan_staff` |
| **Admin Lieng** | Cửa hàng chuẩn: IMEI, POS, kho, bảo hành, báo cáo máy | Dashboard, `/pos`, `/inventory`, … role `admin` / NV |

| Thành phần kỹ thuật | Công nghệ | Vai trò |
|---------------------|-----------|---------|
| `backend/` | Laravel + Sanctum + PostgreSQL | REST API (chung) |
| `frontend/` | Vue 3 + Vite + Tailwind | Web: Admin + màn Quán |
| `mobile-expo/` | Expo SDK 54 | App — bản đầu phục vụ **Quán** |

Chi tiết định vị Quán: **[`docs/quan-project.md`](./quan-project.md)**.

Kiến trúc kỹ thuật: **Web + App → Laravel API → PostgreSQL** (chưa tách server riêng).

---

## 1bis. Bản đồ giao diện & chức năng

### A. Web Admin (Vue) — menu chính

Sau đăng nhập, layout admin có sidebar (tùy quyền role). Các màn:

| # | Màn hình (menu) | Đường dẫn | Chức năng chính trên giao diện |
|---|-----------------|-----------|--------------------------------|
| 1 | **Trang giới thiệu** | `/` | Landing / intro công khai |
| 2 | **Đăng nhập** | `/login` | Email + mật khẩu → token Sanctum |
| 3 | **Tổng quan** | `/dashboard` | Thẻ số liệu nhanh (doanh thu, đơn, …) |
| 4 | **Sản phẩm** | `/products` | Danh sách SP, tìm kiếm, sửa SP (`/products/:id/edit`) |
| 5 | **Danh mục** | `/products/categories` | CRUD danh mục sản phẩm (+ icon) |
| 6 | **Nhập kho** | `/inventory/imports` | Danh sách phiếu nhập; tạo/xem chi tiết, nạp IMEI |
| 7 | **Quầy bán hàng (POS)** | `/pos` | Bán theo máy/IMEI, chọn KH, thanh toán |
| 8 | **Đơn hàng** | `/orders` | Lịch sử đơn POS |
| 9 | **Khách hàng** | `/customers` | Hồ sơ khách, thêm/sửa |
| 10 | **Thu chi** | `/finance` | Phiếu thu/chi, lọc kỳ, danh mục chi |
| 11 | **Quản lý Quán** | `/quan` | Quầy bán nhanh + ghi chi + tổng kết ngày (chi tiết bên dưới) |
| 12 | **Kho sao kê** | `/quan/statements` | Sao kê đã lưu theo ngày |
| 13 | **Báo cáo** | `/reports` | Doanh thu theo kỳ, biểu đồ line/bar/doughnut |
| 14 | **Bảo hành** | `/warranty` | Tra cứu IMEI / ghi sửa chữa |
| 15 | **Nghe tiếng Lào** | `/tools/lao-listen` | Công cụ nghe/học (phụ) |
| 16 | **Nhân viên** | `/users` | Quản lý user (chỉ admin) |
| 17 | **Hồ sơ** | `/profile` | Đổi thông tin, mật khẩu, avatar, hoạt động |

**Phân quyền nhanh**

| Role | Thường thấy |
|------|-------------|
| `admin` | Full menu |
| `quan_manager` | **Admin Quán** — Quầy + Kho sao kê |
| `quan_staff` | **Nhân viên Quán** — Quầy / ghi chi, không kho sao kê |
| `sales_staff` | POS, đơn, bảo hành, … |
| `warehouse_staff` | Nhập kho, sản phẩm, … |

Demo quán: `quan@liengmobile.com` / `password`

---

### B. Chi tiết UI — **Quản lý Quán** (`/quan`)

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb · flash thông báo                               │
├───────────────┬───────────────┬───────────────┐
│ Thẻ thống kê  │ Thu hôm nay   │ Chi / Còn lại │
└───────────────┴───────────────┴───────────────┘
┌──────────────────────────────┬──────────────────────────────┐
│ CỘT TRÁI — Quầy sản phẩm     │ CỘT PHẢI — Tổng kết ngày     │
│                              │                              │
│ [In sao kê] [Kho] [+Thêm]    │ Tổng bán / TM / CK / Chi     │
│ [+Ghi chi]                   │ Còn lại                      │
│                              │ Bán theo mặt hàng            │
│ Nút lọc danh mục:            │ Chi trong ngày (+Sửa/Xóa)    │
│  Điện thoại | Dịch vụ | …    │                              │
│                              │ Lịch sử bán hôm nay          │
│ Ô tìm tên sản phẩm           │  (+Sửa/Xóa từng dòng)        │
│                              │                              │
│ === Điện thoại ===           │                              │
│ [Thẻ SP] [Thẻ SP] …          │                              │
│  tên · giá tham chiếu        │                              │
│  [Sửa] [Bán]                 │                              │
│ === Dịch vụ === …            │                              │
└──────────────────────────────┴──────────────────────────────┘
```

| Thành phần UI | Chức năng |
|---------------|-----------|
| Thẻ thống kê đầu trang | Thu / chi / còn lại (và số liệu liên quan ngày) |
| **Lọc danh mục** | Điện thoại, Dịch vụ, Màn hình, Pin, Phụ kiện, Sim/Card, Đồng hồ, Khác |
| **Thẻ sản phẩm** | Hiện tên chuẩn + giá tham chiếu; **Sửa** (tên/danh mục/giá tham chiếu); **Bán** |
| Nút **+ Thêm sản phẩm** | Tạo SP + (mặc định) bán luôn 1 lần |
| Nút **+ Ghi chi** | Modal: nội dung, số tiền, TM/CK/cả hai |
| Nút **In sao kê** | Modal xem bảng sao kê theo kỳ (Hôm nay / 7 ngày / Tháng) |
| **Lưu vào kho** (trong modal sao kê) | Snapshot ngày hôm nay vào Kho sao kê |
| **Lưu ảnh** | Tải PNG về máy |
| **In báo cáo** | `window.print` → PDF |
| Modal **Bán** | Sửa **giá lần này**, số lượng, hình thức TT (TM / CK / Cả hai) |
| Chuột phải thẻ SP | Ẩn SP khỏi quầy |
| Cột phải | Tổng kết + lịch sử; sửa/xóa từng giao dịch |

---

### C. Chi tiết UI — **Kho sao kê** (`/quan/statements`)

| Vùng | Chức năng |
|------|-----------|
| Lọc theo tháng | Danh sách sao kê đã lưu |
| Nút lưu hôm nay | Chốt snapshot ngày hiện tại |
| Chọn 1 ngày | Xem sheet chi tiết bên phải |
| **Cập nhật từ quầy** | Ghi đè snapshot bằng dữ liệu quầy ngày đó |
| **Lưu ảnh / In lại / Xóa** | Xuất hoặc xóa bản đã lưu |

*(Đã bỏ “Sửa từng dòng” trong kho — sửa trên quầy rồi cập nhật lại.)*

---

### D. App Expo (`mobile-expo`) — màn hình hiện có

| Màn | Route | Chức năng |
|-----|-------|-----------|
| Đăng nhập | `/login` | Email / mật khẩu |
| Quầy Quán | `/quan` | Stats hôm nay, lưới SP, bán (modal), ghi chi, lưu sao kê, đăng xuất |
| Sao kê | `/quan/statement` | Xem kỳ Hôm nay/Tuần/Tháng, lưu kho |
| Kho sao kê | `/quan/statements` | Danh sách tháng hiện tại |
| Chi tiết sao kê | `/quan/statements/:id` | Xem snapshot đã lưu |

**Chưa có trên app (so với web):** danh mục SP chi tiết như web mới, chỉnh giá linh hoạt từng lần bán (web đã có), POS IMEI, kho, bảo hành, báo cáo chart.

---

## 2. Đã làm được gì (ổn định trên web)

### 2.1 Hệ thống chung
- Đăng nhập / phân quyền (admin, nhân viên bán, kho, quản lý quán…)
- Dashboard, sản phẩm, danh mục, khách hàng
- POS bán theo IMEI, nhập kho, thu chi, báo cáo doanh thu (có chart)
- Tra cứu bảo hành

### 2.2 Module **Quản lý Quán** (`/quan`) — dùng thực tế hàng ngày
- Bán nhanh tại quầy (tiền mặt / chuyển khoản / cả hai)
- Ghi chi trong ngày
- Thống kê hôm nay (thu / chi / còn lại)
- **Sao kê**: xem theo kỳ, in, lưu ảnh PNG, **Lưu vào kho** theo ngày
- **Kho sao kê** (`/quan/statements`): xem lại / in / cập nhật từ quầy / xóa
- Sửa / xóa dòng thu–chi trên quầy
- Sản phẩm quầy **theo danh mục** (Điện thoại, Dịch vụ, Màn hình, Pin, Phụ kiện, Sim/Card, Đồng hồ, Khác)
- Khi **Bán**: chỉnh **giá từng lần** + số lượng (giá trên thẻ chỉ là tham chiếu)
- Múi giờ backend: `Asia/Ho_Chi_Minh` (đã sửa lỗi “hôm nay” lấy nhầm ngày hôm qua)
- Đã nhập / lưu sao kê sổ cũ khoảng **11–21/07/2026**

### 2.3 App mobile (Expo)
- Thư mục: `mobile-expo/`
- Bản đầu: đăng nhập Sanctum + quầy bán/chi + xem/lưu sao kê
- Hạ xuống **Expo SDK 54** để khớp Expo Go trên App Store
- Flutter cũ đã **xóa** (không còn thư mục `mobile/`)

---

## 3. Đang dừng ở đâu (điểm hiện tại)

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|---------|
| **Sản phẩm Quán** (web) | **Dùng được** local | Coi là dự án riêng — [`quan-project.md`](./quan-project.md) |
| Sao kê PNG / in | **Cơ bản ổn** | In PDF vẫn ổn định hơn ảnh |
| Catalog quầy theo danh mục | **Đã có** | Có nhóm Điện thoại; giá bán linh hoạt từng lần |
| App Expo (Quán) | **Thử được, chưa ổn mạng** | SDK 54; cần LAN IP / tunnel |
| Thống nhất Quán ↔ Admin POS | **Không làm** (cố ý) | Hai nghiệp vụ tách; tránh gộp sớm |
| UX chỉ-Quán (ẩn menu admin) | **Chưa** | Chủ quán vẫn thấy layout chung → dễ rối |
| Deploy production | **Chưa** | Vẫn local |
| Admin POS / IMEI | Có sẵn trong monorepo | Không phải focus hiện tại của Quán |

**Tóm một câu:**  
**Quán** là sản phẩm đang dùng / ưu tiên hoàn thiện; **Admin** để riêng; bước tiếp theo làm Quán “đứng một mình” về UX + app + (sau) deploy — không gộp số liệu với POS.

---

## 4. Vấn đề cần được giải quyết

### 4.1 Ưu tiên cao (ảnh hưởng dùng thật)

1. **Deploy web lên hosting / VPS**
   - Đổi `APP_ENV=production`, tắt `APP_DEBUG`
   - Cấu hình domain, HTTPS, CORS, `VITE_API_URL`, `FRONTEND_URL`
   - Migration an toàn trên DB production
   - Backup Neon / PostgreSQL

2. **Ổn định kết nối app ↔ API trên điện thoại**
   - Không dùng `localhost` / `127.0.0.1` trên máy thật
   - Document rõ: IP LAN + `REACT_NATIVE_PACKAGER_HOSTNAME` hoặc `expo start --tunnel`
   - Khi có API public (HTTPS), đổi `EXPO_PUBLIC_API_URL` trong `.env` app

3. **Quy trình cuối ngày Quán**
   - Nhắc / bắt buộc **Lưu vào kho** sao kê trước khi sang ngày mới (hiện tự sang ngày theo lịch, không khóa ngày cũ)
   - (Tuỳ chọn) nút “Đóng ngày” nếu muốn không sửa ngày đã chốt

### 4.2 Ưu tiên trung bình (UX / dữ liệu)

4. **Catalog quầy**
   - Thêm / sửa mặt hàng điện thoại cụ thể theo máy bán thực tế (hiện là mẫu: máy mới / cũ / cục gạch)
   - Giá tham chiếu có thể lệch — nhân viên phải nhớ chỉnh khi bán (đã hỗ trợ)

5. **Lưu ảnh sao kê**
   - Theo dõi còn lệch font / layout trên máy khác không
   - Khuyến nghị dự phòng: **In → Lưu PDF**

6. **Đồng bộ app với web**
   - App Expo chưa có: danh mục sản phẩm mới, chỉnh giá linh hoạt như web vừa làm
   - Cập nhật UI app cho khớp web (danh mục + giá lần bán)

### 4.3 Ưu tiên thấp / phase sau

7. App: POS IMEI, nhập kho, bảo hành, quét camera  
8. Tài khoản Apple Developer + build TestFlight / CH Play  
9. PWA / thông báo đẩy / bán offline  
10. Dọn README gốc (vẫn nhắc Flutter ở vài chỗ)

### 4.4 Rủi ro kỹ thuật đã gặp (cần nhớ)

| Vấn đề | Nguyên nhân | Cách xử lý đã làm / cần nhớ |
|--------|-------------|-----------------------------|
| “Hôm nay” lấy đơn hôm qua | Timezone UTC | Đặt `APP_TIMEZONE=Asia/Ho_Chi_Minh` |
| PNG sao kê lỗi chữ / chồng chữ | html2canvas + font | Đổi `modern-screenshot` + CSS thuần |
| Expo Go “incompatible” | SDK 57 vs store SDK 54 | Hạ project xuống SDK 54 |
| QR `exp://127.0.0.1` | Packager hostname | Set `REACT_NATIVE_PACKAGER_HOSTNAME` hoặc `--tunnel` |
| PowerShell chặn `npm` | ExecutionPolicy | Dùng `npm.cmd` hoặc CMD |

---

## 5. Cách chạy lại (local)

### Web

```cmd
cd /d D:\DU_AN_WEB\Lieng_mobile\backend
php artisan serve --host=0.0.0.0 --port=8080
```

```cmd
cd /d D:\DU_AN_WEB\Lieng_mobile\frontend
npm run dev
```

→ http://localhost:5173  

Demo quán: `quan@liengmobile.com` / `password`

### App Expo (iPhone)

```cmd
cd /d D:\DU_AN_WEB\Lieng_mobile\mobile-expo
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.xxx
npm start
```

(iPhone cùng Wi‑Fi; backend phải `--host=0.0.0.0`)

Chi tiết: [`mobile-expo/README.md`](../mobile-expo/README.md)

---

## 6. Gợi ý thứ tự làm tiếp

*(Ưu tiên theo sản phẩm **Quán** — xem thêm [`quan-project.md`](./quan-project.md))*

1. UX Chủ quán: login → chỉ Quán (+ hồ sơ), giảm lẫn menu Admin  
2. Ổn định dùng thật: catalog, sao kê cuối ngày, timezone  
3. App Expo khớp web + kết nối API ổn trên điện thoại  
4. Deploy Quán (hosting / subdomain)  
5. **Bot trợ lý nội bộ Admin** (RAG + Ollama, POS/kho/báo cáo) — [`chatbot-internal.md`](./chatbot-internal.md)  
   *(Không làm theo module Quán trong phase bot này.)*  
6. Admin POS/IMEI: bảo trì & phát triển chính; Quán tạm dừng ưu tiên  
7. Deploy Admin / Quán (khi cần)  

---

## 7. Liên kết tài liệu khác

- [**Dự án Quán (cửa hàng nhỏ)**](./quan-project.md)
- [**Bot chat nội bộ (kế hoạch)**](./chatbot-internal.md)
- [README tổng](../README.md)
- [Kiến trúc](./architecture.md)
- [API](./api-design.md)
- [DB schema](./database-schema.md)
- [Workflows](./workflows.md)
- [QA checklist](./qa-test-checklist.md)
