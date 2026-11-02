# Lieng Mobile — Phân tích yêu cầu & Nghiên cứu UX

**Môn / Bài:** Tài liệu phân tích thiết kế website quản lý cửa hàng  
**Sản phẩm:** Lieng Mobile — Admin Web (POS, kho IMEI, phân quyền)

---

## PHẦN 1. PHÂN TÍCH YÊU CẦU

### 1.1. Mục tiêu hệ thống / website

| # | Mục tiêu | Mô tả ngắn |
|---|----------|------------|
| G1 | Số hóa vận hành cửa hàng | Thay Excel / sổ tay bằng hệ thống web thống nhất |
| G2 | Bán hàng tại quầy nhanh | POS chọn máy theo IMEI, thanh toán, xuất hóa đơn |
| G3 | Kiểm soát tồn kho theo IMEI | Mỗi máy 1 IMEI từ nhập kho → bán → bảo hành |
| G4 | Phân quyền rõ ràng | Admin / NV bán / NV kho chỉ thấy đúng việc của mình |
| G5 | Chủ cửa hàng nắm số liệu | Dashboard KPI, thu chi, báo cáo theo kỳ |

**Tóm lại:** Website giúp cửa hàng điện thoại **bán đúng máy, kho không lệch, chủ shop kiểm soát được người và tiền**.

### 1.2. Đối tượng sử dụng (người dùng)

| Vai trò | Mã hệ thống | Mục đích chính khi dùng website |
|---------|-------------|-------------------------------|
| Chủ cửa hàng / Quản lý | `admin` | Tổng quan, thu chi, báo cáo, quản lý nhân viên, toàn quyền hàng hóa |
| Nhân viên bán hàng | `sales_staff` | POS, đơn hàng, khách hàng, tra bảo hành |
| Nhân viên kho | `warehouse_staff` | Nhập kho, nạp IMEI, danh mục / tồn |
| Khách hàng (chưa đăng nhập) | — | Xem Intro cửa hàng (sản phẩm, dịch vụ) rồi nhân viên mới đăng nhập |

> Phạm vi thiết kế chính nộp bài: **Admin Web + Intro**. Mobile Quán là phần mở rộng.

### 1.3. Chức năng chính của website

| Nhóm chức năng | Chi tiết | Người dùng chính |
|----------------|----------|------------------|
| Giới thiệu cửa hàng | Trang Intro, xem SP, CTA khu vực nhân viên | Khách / NV |
| Đăng nhập & phân quyền | Auth, redirect theo role, menu theo quyền | Tất cả NV |
| Tổng quan | KPI doanh thu, đơn, tồn IMEI, hoạt động NV | Admin (+ kho xem) |
| Hàng hóa | Danh mục, sản phẩm, sửa giá / biến thể | Admin, NV kho |
| Nhập kho | Phiếu nhập, nạp IMEI, xác nhận tăng tồn | Admin, NV kho |
| Quầy bán (POS) | Chọn SP + IMEI, khách, giảm giá, thanh toán | Admin, NV bán |
| Đơn hàng | Lịch sử, chi tiết, hủy đơn | Admin, NV bán |
| Khách hàng | Thêm / sửa hồ sơ, lịch sử mua | Admin, NV bán |
| Thu chi & Báo cáo | Sổ quỹ, báo cáo kỳ | Admin |
| Bảo hành | Tra IMEI, tạo phiếu sửa | Admin, NV bán (kho: tra cứu) |
| Nhân viên | Tạo / khóa tài khoản, gán role | Admin |
| Hồ sơ cá nhân | Đổi thông tin, mật khẩu | Tất cả |

### 1.4. Vấn đề website giải quyết

| Vấn đề thực tế | Hậu quả nếu không có hệ thống | Cách website giải quyết |
|----------------|-------------------------------|-------------------------|
| Theo dõi máy bằng Excel / ghi tay | Lệch tồn, bán trùng / mất máy | IMEI gắn từ nhập kho → bán → BH |
| NV thấy đủ mọi menu | Sửa nhầm giá, xem số tiền nhạy cảm | Sidebar + API theo role |
| Nhập hàng không kiểm tra serial | Thiếu IMEI, tồn ảo | Phiếu nhập bắt đủ IMEI mới xác nhận |
| Bán hàng chậm, ghi đơn tay | Khách chờ, sai hóa đơn | POS chọn IMEI + thanh toán nhanh |
| Chủ shop không biết ngày hôm nay bán gì | Mù doanh thu | Dashboard + báo cáo + thu chi |
| Tra bảo hành khó | KH phàn nàn | Tra IMEI 15 số → thông tin BH / sửa |

---

## PHẦN 2. NGHIÊN CỨU UX

### 2.1. Nhu cầu chủ cửa hàng (Admin)

| Nhu cầu | Mong muốn trên giao diện | Flow liên quan |
|---------|--------------------------|----------------|
| Nhìn nhanh tình hình ngày | Banner chào + 4 KPI + đơn gần đây | F03 Dashboard |
| Biết NV đang làm gì | Bảng hoạt động nhân viên | F03 |
| Kiểm soát tiền | Sổ thu chi, lọc kỳ, xuất | F09 |
| Quản lý người | Tạo / khóa tài khoản, gán role | F10 Users |
| Đảm bảo kho đúng | Cảnh báo phiếu draft, hàng sắp hết | F03, F05 |
| Vẫn bán được khi cần | Vào POS như NV bán | F06 |

**Pain points chủ shop:**
- Không tin số liệu Excel của từng người
- Sợ NV xóa / sửa dữ liệu nhạy cảm
- Muốn 1 màn hình là biết “hôm nay ổn không”

### 2.2. Nhu cầu nhân viên bán hàng

| Nhu cầu | Mong muốn trên giao diện | Flow liên quan |
|---------|--------------------------|----------------|
| Vào là bán ngay | Sau login → `/pos` | F02, F06 |
| Chọn đúng máy | Chọn danh mục → SP → IMEI còn tồn | F06 |
| Gắn khách nhanh | Gõ SĐT → gợi ý KH | F06, F08 |
| Thanh toán linh hoạt | Tiền mặt / CK / QR / kết hợp | F06 |
| Tra bảo hành tại quầy | Ô IMEI → kết quả + phiếu sửa | F10 |
| Không bị rối menu | Chỉ thấy POS, Đơn, KH, BH, SP (xem) | Phân quyền |

**Pain points NV bán:**
- Menu quá nhiều làm chậm thao tác
- Sợ chọn nhầm IMEI / máy đã bán
- Không cần (và không nên) vào Thu chi hay Nhân viên

### 2.3. Nhu cầu nhân viên kho (bổ sung)

| Nhu cầu | Mong muốn | Flow |
|---------|-----------|------|
| Nhập hàng là việc chính | Login → danh sách phiếu nhập | F02, F05 |
| Nạp IMEI dễ | Dán / quét nhiều dòng, thanh tiến độ | F05 |
| Quản lý nhóm hàng | Thêm / sửa danh mục | F04 |

### 2.4. Khó khăn khi quản lý (trước khi có website)

1. **Tồn kho không realtime** — máy đã bán vẫn còn trên sổ.
2. **Không phân tách việc** — ai cũng mở được file chung, khó quy trách nhiệm.
3. **Bảo hành phụ thuộc trí nhớ / giấy** — mất thời gian tìm IMEI.
4. **Báo cáo cuối ngày thủ công** — cộng Excel, dễ sai.
5. **Đào tạo NV mới lâu** — quy trình bán / nhập không thống nhất trên UI.

### 2.5. Insight UX → quyết định thiết kế

| Insight | Quyết định thiết kế |
|---------|---------------------|
| Chủ shop cần “nhìn một phát” | Dashboard KPI + staff activity (chỉ Admin) |
| NV bán cần tốc độ | Redirect `/pos`, sidebar tối giản |
| IMEI là trái tim nghiệp vụ | Bắt buộc nạp đủ IMEI khi xác nhận nhập; POS chọn IMEI `in_stock` |
| Quyền sai = rủi ro tiền/hàng | Menu + route + permission theo role |
| Học nhanh | 10 flow F01–F10, UI thống nhất (đỏ brand, Admin shell) |

### 2.6. Persona tóm tắt (UX)

**Persona A — Chị Lan (Chủ cửa hàng)**  
- Goal: nắm doanh thu, kiểm soát NV & tồn IMEI  
- Pain: Excel rời, không biết máy nào đã bán  
- Needs: Dashboard, Thu chi, Users  

**Persona B — Anh Minh (NV bán)**  
- Goal: bán nhanh, đúng IMEI, hóa đơn rõ  
- Pain: menu rối, sợ sửa nhầm giá/kho  
- Needs: POS sạch, tra BH, thêm KH tại quầy  

---

## PHẦN 3. KẾT LUẬN NGẮN (dùng khi thuyết trình)

Website Lieng Mobile giải quyết bài toán **vận hành cửa hàng điện thoại**: bán theo IMEI, nhập kho có kiểm soát, phân quyền Admin / NV bán / NV kho, và giúp chủ cửa hàng theo dõi doanh thu – nhân sự trên một hệ thống web thống nhất.

**Tài liệu liên quan:** `design-flows` · `tuong-tac-va-phan-quyen` · `roles-permissions` · portfolio SVG  
