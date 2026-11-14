# BIÊN BẢN NGHIỆM THU UAT / STAKEHOLDER ACCEPTANCE SIGNOFF
## Dự án: Nền tảng Quản trị Chuỗi Cửa hàng Điện thoại & Phân hệ Tiện ích Liêng Mobile

**Mã dự án:** LIENG-MOBILE-QLDA  
**Repository:** `https://github.com/baopham1410/lieng-mobile-qtda`  
**Ngày thực hiện UAT:** 14/11/2026  
**Địa điểm / Hình thức:** Trực tiếp tại Showroom Liêng Mobile & Live Cloud Demo  
**Stakeholder nghiệm thu:** Đại diện Chủ chuỗi cửa hàng Liêng Mobile (Product Owner thực tế)

---

## 1. Thông tin các bên tham gia nghiệm thu

### Đại diện Bên nghiệm thu (Stakeholder / Product Owner):
- **Họ và tên:** Đại diện Chủ cửa hàng Liêng Mobile
- **Đơn vị:** Chuỗi cửa hàng Liêng Mobile Đà Nẵng
- **Vai trò:** Khách hàng thụ hưởng thực tế / Product Owner

### Đại diện Đội ngũ phát triển dự án (VKU Team):
- **Phạm Quốc Bảo** (`baopham1410`) — Technical Lead / System Architect
- **Nguyễn Thị Hồng** (`Chimsedinang605`) — Project Manager / Scrum Master
- **Khổng Thị Lệ Giang** (`ktlgiang`) — Mobile Lead & QA Test Engineer

---

## 2. Tiêu chí kiểm thử chấp nhận người dùng (UAT Test Matrix)

| STT | Kịch bản / Luồng nghiệp vụ kiểm thử | Kết quả thực tế | Trạng thái | Đánh giá của Stakeholder |
|:---:|---|---|:---:|---|
| **1** | **Đăng nhập & Phân quyền RBAC:** Đăng nhập 5 vai trò (`admin`, `sales_staff`, `warehouse_staff`, `quan_manager`, `quan_staff`), kiểm tra điều hướng chính xác. | Điều hướng đúng màn hình theo quyền; chặn 100% truy cập trái phép. | **PASS** | Bảo mật tốt, giao diện phân quyền rõ ràng. |
| **2** | **Quản lý kho IMEI 15 số:** Nhập kho theo lô, cấp phát trạng thái IMEI (`in_stock`, `sold`, `warranty`), tra cứu lịch sử vòng đời thiết bị. | Quản lý chính xác từng cá thể máy, không có hiện tượng trùng IMEI. | **PASS** | Giải quyết triệt để vấn đề thất thoát kho. |
| **3** | **Điểm bán lẻ POS & PayOS VietQR:** Chọn máy theo IMEI, áp voucher, tạo mã VietQR động tự động thanh toán qua PayOS Webhook. | Khách quét mã VietQR ngân hàng, đơn tự động chuyển `completed` < 2s. | **PASS** | Thao tác bán hàng tại quầy cực kỳ nhanh. |
| **4** | **Phân hệ Quán nhỏ & Dòng tiền:** Bán nhanh đồ uống tiện ích, ghi nhận chi phí phát sinh ca trực, chốt sổ sao kê ngày tự động. | Chốt ca chính xác, xuất biên lai sao kê PNG/PDF và lưu kho sao kê. | **PASS** | Phù hợp tuyệt đối với mô hình F&B showroom. |
| **5** | **Thẩm định máy cũ AutoGrade AI (:8091):** Tải 6 ảnh ngoại quan, YOLOv8 phát hiện vết trầy/nứt vỡ, OCR đọc chu kỳ pin, sinh biên bản định giá. | Phân loại chính xác Hạng A/B/C, tự động tính khấu trừ linh kiện trong 12 giây. | **PASS** | Tính năng AI rất ấn tượng, định giá khách quan. |
| **6** | **Chatbot AI RAG nội bộ (:8090):** Nhân viên hỏi đáp chính sách bảo hành, thông số máy và quy trình xử lý khiếu nại. | Phản hồi đúng nội dung từ tài liệu nội bộ, không bị ảo giác (hallucination). | **PASS** | Hỗ trợ đắc lực cho nhân viên mới vào ca. |
| **7** | **Mobile App Khách hàng 5 Tab B2C (PR #168):** Khách vãng lai xem showroom, đặt giữ máy 24h, tính giá thu cũ AI (+2M trợ giá) và tra cứu bảo hành IMEI. | Giao diện chuẩn Google Stitch, chạy mượt mà trên iPhone/Android qua Cloudflare. | **PASS** | Trải nghiệm khách hàng rất chuyên nghiệp. |
| **8** | **Độ ổn định & Zero Crash:** Thao tác liên tục đa tác vụ trên cả Web Admin và Mobile App. | Hệ thống chạy trơn tru, không phát sinh lỗi sập máy chủ hay đơ giao diện. | **PASS** | Đạt tiêu chuẩn bàn giao đưa vào vận hành. |

---

## 3. Kết luận nghiệm thu (Acceptance Verdict)

☑ **ACCEPTED (CHẤP THUẬN NGHIỆM THU TOÀN PHẦN)**  
Sản phẩm phần mềm nền tảng **Liêng Mobile** (bao gồm Web Admin POS, Phân hệ Quán, Dịch vụ AI AutoGrade, Chatbot RAG và Mobile App B2B/B2C) đáp ứng hoàn toàn các yêu cầu chức năng, phi chức năng và mục tiêu kinh doanh đã thống nhất trong Điều lệ dự án (Project Charter).

**Nhận xét chung của Stakeholder:**  
> *"Hệ thống vận hành thực tế rất ổn định, luồng bán lẻ POS kết hợp thanh toán VietQR PayOS xử lý tức thì. Đặc biệt tính năng AI AutoGrade định giá thu cũ máy và cổng tra cứu bảo hành cho khách hàng trên điện thoại giải quyết đúng nỗi đau lớn nhất của cửa hàng từ trước đến nay. Chúng tôi xác nhận chấp thuận nghiệm thu để nhóm hoàn tất đồ án môn học."*

---

## 4. Xác nhận ký tên của các bên

| Đại diện Stakeholder / Product Owner | Technical Lead | Project Manager / Scrum Master | Mobile & QA Lead |
|:---:|:---:|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br>**Đại diện Cửa hàng Liêng Mobile** | <br><br>**Phạm Quốc Bảo** | <br><br>**Nguyễn Thị Hồng** | <br><br>**Khổng Thị Lệ Giang** |
| Ngày: 14/11/2026 | Ngày: 14/11/2026 | Ngày: 14/11/2026 | Ngày: 14/11/2026 |
