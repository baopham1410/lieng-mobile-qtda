# QA Test Checklist — Lieng Mobile

Tài liệu kiểm thử thủ công (Manual QA) cho Web Admin + POS.  
Dùng khi release, regression sau sửa bug, hoặc UAT nội bộ.

**Phiên bản tài liệu:** 2026-06-27  
**Phạm vi:** `frontend/` (Vue 3) + `backend/` (Laravel API)

> **Excel (đầy đủ theo chức năng):** [`qa-test-checklist-full.xlsx`](qa-test-checklist-full.xlsx) — **22 sheet**, ~220 test cases  
> **Excel (bản cũ gọn):** [`qa-test-checklist.xlsx`](qa-test-checklist.xlsx)  
> **Source data:** [`qa-test-cases.js`](qa-test-cases.js)  
> Tạo lại: `cd docs && npm run qa-sheet`

### Cấu trúc sheet Excel

| Sheet | Chức năng | ~Số case |
|-------|-----------|----------|
| Tong-quan | Index tổng hợp | — |
| Huong dan | Hướng dẫn test | 5 |
| 01-Auth | Đăng nhập & phân quyền | 18 |
| 02-Intro | Trang intro & login UI | 5 |
| 03-Dashboard | Tổng quan | 11 |
| 04-San-pham | Sản phẩm | 20 |
| 05-Danh-muc | Danh mục SP | 7 |
| 06-Nhap-kho | Nhập kho | 20 |
| 07-POS-Chung | POS chung | 20 |
| 08-POS-Tien-mat | POS tiền mặt | 6 |
| 09-POS-CK | POS chuyển khoản | 12 |
| 10-POS-Ket-hop | POS kết hợp | 9 |
| 11-Don-hang | Đơn hàng | 12 |
| 12-Khach-hang | Khách hàng | 10 |
| 13-Tai-chinh | Thu chi | 12 |
| 14-Bao-cao | Báo cáo | 7 |
| 15-Bao-hanh | Bảo hành | 9 |
| 16-Nhan-vien | Nhân viên | 12 |
| 17-Ho-so | Hồ sơ cá nhân | 10 |
| 18-UI-Layout | UI & layout | 7 |
| 19-Format-tien | Format tiền VN | 9 |
| 20-API | API backend | 12 |
| Tai-khoan | Tài khoản test | 3 |
| Sign-off | Duyệt release | 7 |

Mỗi case gồm: **ID | Tên | Điều kiện tiên quyết | Các bước | Dữ liệu test | Kết quả mong đợi | Priority | Kết quả | Người test | Ngày | Ghi chú**

---

## 1. Môi trường & cách chạy

| Hạng mục | Giá trị |
|----------|---------|
| Backend | `cd backend && php artisan serve --host=127.0.0.1 --port=8000` |
| Frontend | `cd frontend && npm run dev` → http://localhost:5173 |
| DB | PostgreSQL (Neon hoặc local), đã `migrate --seed` |
| Trình duyệt khuyến nghị | Chrome / Edge mới nhất |
| PayOS (tuỳ chọn) | Cấu hình `PAYOS_*` trong `backend/.env` để test QR |

### Tiền điều kiện (Preconditions)

- [ ] Backend và frontend đang chạy, không lỗi console/network 5xx
- [ ] Database đã seed (`php artisan db:seed`)
- [ ] Có ít nhất 1 IMEI `in_stock` trong từng nhóm: điện thoại, phụ kiện
- [ ] Ghi nhận **Build / commit** đang test: `________________`

---

## 2. Tài khoản test

| Vai trò | Email | Mật khẩu | Quyền chính |
|---------|-------|----------|-------------|
| Admin | admin@liengmobile.com | password | Toàn hệ thống |
| Bán hàng | banhang@liengmobile.com | password | POS, đơn, khách, bảo hành |
| Kho | kho@liengmobile.com | password | Nhập kho, sản phẩm, IMEI |

---

## 3. Ký hiệu

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **P0** | Blocker — không release nếu fail |
| **P1** | Quan trọng — luồng nghiệp vụ chính |
| **P2** | Nên có — UX / báo cáo / edge case |
| ☐ | Chưa test |
| ✅ | Pass |
| ❌ | Fail |
| ⏭ | Bỏ qua (ghi lý do) |

**Cột ghi kết quả:** Pass/Fail | Người test | Ngày | Ghi chú / Bug ID

---

## 4. Smoke test (15 phút — chạy trước mỗi bản build)

| ID | Case | Bước ngắn | Kết quả mong đợi | P | KQ |
|----|------|-----------|------------------|---|-----|
| SM-01 | Đăng nhập admin | Login → vào Dashboard | Vào được, sidebar hiện đủ menu | P0 | |
| SM-02 | POS bán tiền mặt | Thêm 1 SP → Tiền mặt → Thanh toán | Đơn hoàn tất, IMEI hết hàng | P0 | |
| SM-03 | Danh sách đơn | Mở `/orders` → xem chi tiết đơn vừa tạo | Mã đơn, tổng tiền, PT thanh toán đúng | P0 | |
| SM-04 | Nhập kho draft | Tạo phiếu nhập → thêm dòng → lưu | Phiếu ở trạng thái nháp | P1 | |
| SM-05 | Format tiền | Xem giá ở POS / Dashboard | Số có dấu chấm (vd. `190.000 ₫`) | P1 | |
| SM-06 | Đăng xuất | Profile → đăng xuất | Về `/login`, không truy cập được `/dashboard` | P1 | |

---

## 5. Authentication & phân quyền

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| AUTH-01 | Login sai mật khẩu | Nhập email đúng, pass sai | Thông báo lỗi, không vào app | P0 | |
| AUTH-02 | Login đúng admin | admin@liengmobile.com / password | Vào Dashboard | P0 | |
| AUTH-03 | NV bán không vào Tài chính | Login banhang → mở `/finance` | 403 / redirect / menu ẩn | P1 | |
| AUTH-04 | NV kho không vào POS | Login kho → mở `/pos` | Không truy cập được | P1 | |
| AUTH-05 | Session hết hạn | Xóa token / đợi hết hạn → gọi API | Thông báo đăng nhập lại | P2 | |

---

## 6. Layout & điều hướng

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| UI-01 | Sidebar thu gọn | Click logo **L** | Sidebar 280px ↔ 88px, trạng thái lưu sau F5 | P2 | |
| UI-02 | Breadcrumb | Vào Sản phẩm, Nhập kho, POS | Breadcrumb đúng trang | P2 | |
| UI-03 | Responsive POS | Thu hẹp cửa sổ < 1024px | Giỏ hàng stack dưới catalog, không vỡ layout | P2 | |

---

## 7. Dashboard

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| DASH-01 | Thống kê hôm nay | Mở Dashboard sau khi bán 1 đơn | Doanh thu / số đơn tăng | P1 | |
| DASH-02 | Format tiền | Xem ô doanh thu | `xxx.xxx ₫` (vi-VN) | P1 | |
| DASH-03 | Đơn gần đây | Click 1 dòng đơn (nếu có link) | Mở đúng chi tiết / danh sách đơn | P2 | |

---

## 8. Sản phẩm

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| PRD-01 | Danh sách SP | `/products` | Bảng: tên, cấu hình, SKU, tình trạng, giá | P1 | |
| PRD-02 | Giá “Chưa set” | SP giá = 0 | Hiển thị “Chưa set”, không crash | P2 | |
| PRD-03 | Sửa slide-over | Click dòng / nút sửa | Panel trượt phải, URL `?edit=id` | P1 | |
| PRD-04 | Form theo danh mục | Sửa SP điện thoại vs phụ kiện | Field đúng profile (IMEI vs SL) | P1 | |
| PRD-05 | Giá nhập read-only | Mở form sửa | Giá nhập khóa, ghi chú “Cập nhật qua Nhập kho” | P1 | |
| PRD-06 | Sửa giá bán | Nhập `28.990.000` → Lưu | Lưu OK, hiển thị lại có dấu chấm | P1 | |
| PRD-07 | Redirect tạo SP | `/products/create` | Chuyển hướng nhập kho (không tạo SP trực tiếp) | P2 | |
| PRD-08 | `/products/:id/edit` | Mở URL cũ | Redirect về `?edit=id` | P2 | |

---

## 9. Nhập kho (Stock Import)

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| STK-01 | Danh sách phiếu | `/inventory/imports` | Table desktop + card mobile, stats đúng ngày | P1 | |
| STK-02 | Tạo phiếu nháp | Tạo mới → thêm NCC, dòng hàng | Lưu draft, mã phiếu sinh tự động | P0 | |
| STK-03 | Form theo danh mục | Thêm DT / laptop / phụ kiện | Field động đúng loại | P1 | |
| STK-04 | Đơn giá nhập format | Nhập `15.500.000` | Hiển thị dấu chấm, tổng phiếu đúng | P1 | |
| STK-05 | Nạp IMEI | SP có IMEI → quét/nhập đủ SL | Counter “Đã nạp” khớp quantity | P0 | |
| STK-06 | IMEI trùng | Nhập IMEI đã tồn tại | Báo lỗi, không ghi đè | P0 | |
| STK-07 | Xác nhận phiếu | Confirm phiếu hợp lệ | status=confirmed, IMEI in_stock, có phiếu chi | P0 | |
| STK-08 | Confirm thiếu IMEI | Confirm khi chưa đủ IMEI | Chặn, thông báo rõ | P1 | |
| STK-09 | Stats “Hôm nay” | Confirm phiếu hôm nay | `totalAmountToday` theo ngày xác nhận | P2 | |

---

## 10. POS — Bán hàng

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| POS-01 | Chọn danh mục | Mở POS → chọn Điện thoại | Lọc SP đúng, sub-filter brand | P1 | |
| POS-02 | Thêm giỏ | Click SP / IMEI | Giỏ có tên, IMEI, giá format | P0 | |
| POS-03 | Xóa khỏi giỏ | Xóa dòng | IMEI available lại trên catalog | P1 | |
| POS-04 | Phụ kiện không cần KH | Chỉ phụ kiện → thanh toán | Không bắt SĐT, bán được | P1 | |
| POS-05 | Máy cần KH | Giỏ có điện thoại, chưa SĐT | Chặn checkout, báo cần khách | P0 | |
| POS-06 | Khách quen | Gõ SĐT → chọn gợi ý | Gắn khách, hiện badge “Khách quen” | P1 | |
| POS-07 | Khách mới | SĐT chưa có → nhập tên | Tạo/lưu khách khi checkout | P1 | |
| POS-08 | Giảm giá format | Nhập `50.000` | Hiển thị `50.000`, tổng trừ đúng | P1 | |
| POS-09 | Giảm giá label | Chưa nhập giảm giá | Label “Giảm giá” hiện, ô trống (không số 0) | P2 | |

### 10.1 Thanh toán — Tiền mặt

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| POS-CASH-01 | Tiền mặt | Chọn Tiền mặt → Thanh toán | Đơn completed ngay, giỏ xóa, IMEI sold | P0 | |
| POS-CASH-02 | Phiếu BH | Bán máy + khách → tiền mặt | Warranty tạo (nếu có KH) | P1 | |

### 10.2 Thanh toán — Chuyển khoản (PayOS)

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| POS-CK-01 | Tạo QR | Chọn Chuyển khoản → Thanh toán | Modal QR, đơn pending, IMEI reserved | P0 | |
| POS-CK-02 | Poll / Kiểm tra | Bấm “Kiểm tra ngay” | Cập nhật trạng thái, không crash | P1 | |
| POS-CK-03 | Thanh toán OK | Khách chuyển / webhook PayOS | Modal success, đơn completed | P0 | |
| POS-CK-04 | Thu nhỏ modal | “Thu nhỏ” | Banner vàng “Đang chờ…”, mở lại QR được | P2 | |
| POS-CK-05 | Đổi PT thanh toán | “Đổi phương thức” → xác nhận | Hủy đơn, giỏ khôi phục, IMEI về kho | P0 | |
| POS-CK-06 | QR hết hạn | Đợi hết hạn / mock expired | Báo lỗi, giỏ khôi phục | P1 | |
| POS-CK-07 | Không tạo đơn trùng | Đang chờ CK → bấm Thanh toán lại | Nút disabled / báo đang chờ | P1 | |

### 10.3 Thanh toán — Kết hợp

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| POS-MIX-01 | UI chia tiền | Chọn Kết hợp | Dòng Tiền mặt + Chuyển khoản trong khối tổng | P1 | |
| POS-MIX-02 | Toàn tiền mặt | TM = tổng đơn, CK = 0 | Hoàn tất ngay, không QR | P1 | |
| POS-MIX-03 | TM + CK | TM `100.000`, CK phần còn lại | QR chỉ số CK; modal ghi “Đã thu TM” | P0 | |
| POS-MIX-04 | Validate tổng | TM + CK ≠ tổng (sửa tay API) | Backend 422 | P2 | |
| POS-MIX-05 | Chi tiết đơn | Mở đơn kết hợp ở `/orders` | Hiện TM / CK đúng số (không 0 ₫) | P0 | |

---

## 11. Đơn hàng

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| ORD-01 | Lọc trạng thái | Lọc Hoàn tất / Chờ TT / Hủy | Danh sách đúng | P1 | |
| ORD-02 | Lọc PT thanh toán | Lọc Tiền mặt / Kết hợp / CK | Đúng filter | P2 | |
| ORD-03 | Slide-over chi tiết | Click đơn | KH, NV, SP, IMEI, tổng tiền | P1 | |
| ORD-04 | Breakdown kết hợp | Đơn mixed completed | Tiền mặt + Chuyển khoản đúng | P0 | |
| ORD-05 | Hủy đơn draft/pending | Admin hủy đơn chờ CK | status=cancelled, IMEI trả kho | P1 | |
| ORD-06 | Không hủy completed | Hủy đơn đã hoàn tất | Bị chặn | P1 | |

---

## 12. Khách hàng

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| CUS-01 | Danh sách | `/customers` | Tên, SĐT, hạng, tổng chi | P1 | |
| CUS-02 | Tìm kiếm | Gõ SĐT / tên | Lọc đúng | P2 | |
| CUS-03 | Chi tiết KH | Mở panel | Lịch sử đơn, tổng chi format tiền | P2 | |

---

## 13. Tài chính

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| FIN-01 | Danh sách giao dịch | `/finance` (admin) | Thu/chi, filter, format tiền | P1 | |
| FIN-02 | Thêm khoản chi | Nhập `3.200.000` → Lưu | Hiển thị có dấu chấm, vào danh sách | P1 | |
| FIN-03 | NV bán | Login banhang | Không vào được module | P1 | |

---

## 14. Báo cáo

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| RPT-01 | Doanh thu | `/reports` — chọn kỳ | Số liệu khớp đơn completed | P1 | |
| RPT-02 | Format | Xem biểu đồ / bảng | Tiền vi-VN | P2 | |

---

## 15. Bảo hành

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| WAR-01 | Tra IMEI | Nhập IMEI đã bán | Hiện SP, KH, hạn BH | P1 | |
| WAR-02 | IMEI không tồn tại | Nhập sai | Thông báo không tìm thấy | P1 | |
| WAR-03 | Tạo phiếu sửa | Nhập chi phí `500.000` | Format input, lưu OK | P2 | |

---

## 16. Người dùng & Hồ sơ

| ID | Case | Các bước | Kết quả mong đợi | P | KQ |
|----|------|----------|------------------|---|-----|
| USR-01 | Danh sách user | `/users` (admin) | Hiện 3 tài khoản seed | P2 | |
| PRF-01 | Profile | `/profile` | Tên, email, thống kê ca | P2 | |

---

## 17. Format tiền (Regression)

| ID | Vị trí | Input | Hiển thị mong đợi | P | KQ |
|----|--------|-------|-------------------|---|-----|
| FMT-01 | POS — giá SP | — | `19.990.000 ₫` | P1 | |
| FMT-02 | POS — giảm giá | gõ `50000` | `50.000` trong ô | P1 | |
| FMT-03 | POS — TM kết hợp | gõ `100000` | `100.000` | P1 | |
| FMT-04 | Sản phẩm — giá bán | gõ `28990000` | `28.990.000` | P1 | |
| FMT-05 | Nhập kho — đơn giá | gõ `15500000` | `15.500.000` | P1 | |
| FMT-06 | Tài chính — chi | gõ `3200000` | `3.200.000` | P1 | |
| FMT-07 | Bảo hành — chi phí | gõ `0` | Ô trống, placeholder hiện | P2 | |

---

## 18. API / Backend (tuỳ chọn — Postman / curl)

| ID | Endpoint | Method | Kết quả mong đợi | P | KQ |
|----|----------|--------|------------------|---|-----|
| API-01 | `/api/login` | POST | Trả token với credential đúng | P0 | |
| API-02 | `/api/pos/checkout` | POST | cash → 200 completed | P0 | |
| API-03 | `/api/pos/checkout` | POST | mixed + transfer_amount | 201 + QR fields | P0 | |
| API-04 | `/api/orders/{id}/cancel` | POST | pending → cancelled, IMEI release | P1 | |
| API-05 | `/api/orders` | GET | `paymentBreakdown` với đơn mixed | P1 | |

---

## 19. Bug report template

Khi **Fail**, tạo ticket kèm:

```
Tiêu đề: [Module] Mô tả ngắn
Môi trường: local / staging | Browser | Build/commit
Tài khoản: admin / banhang / kho
Case ID: (vd. POS-MIX-03)
Các bước tái hiện:
1. ...
2. ...
Kết quả thực tế:
Kết quả mong đợi:
Ảnh / video:
Mức độ: P0 / P1 / P2
```

---

## 20. Sign-off release

| Hạng mục | Tiêu chí | ✓ |
|----------|----------|---|
| Smoke test | 6/6 Pass | |
| P0 modules | POS cash, POS CK, POS mixed, nhập kho confirm, login | |
| P0 bugs | Không còn bug P0 mở | |
| PayOS | Test trên môi trường có key (hoặc ghi ⏭ có lý do) | |
| Regression format tiền | FMT-01 → FMT-06 Pass | |
| Người QA | | |
| Ngày | | |
| Phê duyệt | | |

---

## Phụ lục: Mapping route ↔ module

| Route | Module |
|-------|--------|
| `/login` | Auth |
| `/dashboard` | Dashboard |
| `/products` | Sản phẩm |
| `/inventory/imports` | Nhập kho |
| `/pos` | POS |
| `/orders` | Đơn hàng |
| `/customers` | Khách hàng |
| `/finance` | Tài chính |
| `/reports` | Báo cáo |
| `/warranty` | Bảo hành |
| `/users` | Người dùng |
| `/profile` | Hồ sơ |
