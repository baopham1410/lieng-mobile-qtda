# BỘ SLIDE THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN QLDA (8–10 SLIDES)
## Đề tài: Nền tảng Quản trị Chuỗi Cửa hàng Điện thoại & Phân hệ Tiện ích Liêng Mobile
### Tích hợp AutoGrade AI Thẩm định Máy cũ, Chatbot RAG & Mobile App Khách hàng B2C

**Học phần:** Quản Trị Dự Án Phần Mềm (VKU)  
**Thời lượng bảo vệ:** 16 phút = 6 phút Thuyết trình Slide + 5 phút Live Demo thực tế + 5 phút Hỏi - Đáp (Q&A)  
**Quy chuẩn nộp:** Chuyển nội dung sang PowerPoint / Google Slides và xuất file `08_Presentation_Slide_Deck.pdf`

---

## Slide 1 — Trang bìa & Đội ngũ thực hiện
- **Tên đề tài:** Nền tảng Quản trị Chuỗi Cửa hàng Điện thoại & Phân hệ Tiện ích Liêng Mobile
- **Sourcing Pathway:** Pathway 1 — Kế thừa & song hành Đồ án chuyên ngành Web, Mobile & Kỹ thuật AI
- **Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn — Khoa Khoa học Máy tính (VKU)
- **Đội ngũ thực hiện (3 thành viên):**
  - **Phạm Quốc Bảo** (`baopham1410`) — Technical Lead / System Architect & Backend/AI Lead (40%)
  - **Nguyễn Thị Hồng** (`Chimsedinang605`) — Project Manager / Scrum Master & Frontend Lead (35%)
  - **Khổng Thị Lệ Giang** (`ktlgiang`) — Mobile Lead / UI/UX Designer & QA Test Engineer (25%)
- **GitHub Repository:** `github.com/baopham1410/lieng-mobile-qtda` (Public, Branch Protection enabled)

---

## Slide 2 — Vấn đề thực tế & Cơ sở kinh doanh (Business Case)
- **Nỗi đau 1 (Quản lý kho):** Quản lý Serial/IMEI thủ công bằng Excel rời rạc dẫn đến nhầm máy, bán trùng mã hoặc tồn ảo giữa các chi nhánh.
- **Nỗi đau 2 (Thu cũ đổi mới):** Nhân viên thẩm định máy cũ hoàn toàn bằng cảm tính, không có công cụ phát hiện trầy xước/nứt vỡ và kiểm tra linh kiện khách quan, gây rủi ro thất thoát vốn lớn.
- **Nỗi đau 3 (Kênh khách hàng B2C):** Khách hàng thiếu cổng tra cứu bảo hành điện tử và công cụ tự định giá máy cũ online trước khi đến cửa hàng.
- **Giải pháp:** Hệ sinh thái quản trị hợp nhất (Web Admin + POS VietQR PayOS + AutoGrade AI :8091 + Assistant RAG :8090 + Mobile App B2C 5 Tab).

---

## Slide 3 — Kiến trúc hệ thống & Cơ cấu phân rã WBS (100% Rule)
- **Kiến trúc công nghệ Monorepo:**
  - *Backend Core:* Laravel 9 + Sanctum Token Auth + PostgreSQL Serverless Cloud (Neon DB).
  - *Frontend Web:* Vue 3 + Vite + Tailwind CSS (Admin Hub, POS, Quán nhỏ).
  - *AI Services:* FastAPI + YOLOv8 chẩn đoán ngoại quan 6 góc chụp + OCR đọc pin/màn hình (:8091) & Chatbot RAG Ollama (:8090).
  - *Mobile App:* React Native + Expo SDK 58 (Giao diện Google Stitch đa vai trò B2B & B2C).
- **Phân rã WBS (6 gói công việc cấp 1):** Khởi tạo nền tảng (1.1) ➔ Backend API (1.2) ➔ Frontend Web POS (1.3) ➔ Dịch vụ AI AutoGrade & RAG (1.4) ➔ Mobile App Expo B2B/B2C (1.5) ➔ QA Testing & CI/CD (1.6).

---

## Slide 4 — Chỉ số thực thi Agile & Vận tốc nhóm (Agile Metrics)
- **Khối lượng thực thi:** 168 Pull Requests được kiểm duyệt và hợp nhất vào nhánh `main`.
- **Tổng điểm Story Points:** Đạt **237 / 275 Story Points (86.2%)** trên toàn bộ Product Backlog.
- **Vận tốc nhóm qua 5 Sprint:** Sprint 1 (42 SP) ➔ Sprint 2 (48 SP) ➔ Sprint 3 (39 SP) ➔ Sprint 4 (35 SP) ➔ Sprint 5 (73 SP).
- **Vận tốc trung bình:** **47.4 Story Points / Sprint**.
- **Kỷ luật Git:** 100% PRs có Issue liên kết, Conventional Commits và nhãn gắn rõ ràng.

---

## Slide 5 — Thách thức quản trị lớn nhất đã giải quyết (Scope & Risk)
- **Kiểm soát thay đổi phạm vi qua 5 phiếu CR chính thức:**
  - *CR-001:* Tinh giản PR Frontend Foundation, tránh phình to mã nguồn ngoài ý muốn (PR #79).
  - *CR-002:* Chuyên môn hóa năng lực 3 thành viên (Bảo - Hồng - Giang) giúp vận tốc Sprint 5 bùng nổ lên 73 SP.
  - *CR-003:* Chuyển repo sang Public, thiết lập Branch Protection và CI bắt buộc (PR #90, #91).
  - *CR-004:* Tích hợp Dịch vụ AutoGrade AI và Chatbot RAG nội bộ (PR #140, #150, #164).
  - *CR-005:* Nâng cấp Expo SDK 58 và xây dựng Cổng Mobile Khách hàng 5 Tab B2C (PR #168).
- **Xử lý rủi ro thực địa:** Hóa giải sự cố mạng Wi-Fi AP Isolation chặn IP LAN bằng hệ thống **Cloudflare Tunnel** và **Expo EAS Cloud Tunnel** công khai qua HTTPS.

---

## Slide 6 — Kiểm soát chất lượng, CI/CD Pipeline & Definition of Done
- **Đường ống tự động hóa GitHub Actions (3 jobs song song):**
  - `Backend (Laravel)`: Tự động chạy PHPUnit test logic phân quyền và giao dịch kho.
  - `Frontend (Vue/Vite)`: Tự động linting và build test bundle.
  - `Mobile (Expo)`: Tự động kiểm tra kiểu dữ liệu TypeScript (`tsc --noEmit`).
- **Definition of Done nghiêm ngặt:** Branch feature ➔ Self-test notes ➔ 3/3 jobs CI xanh ➔ Tối thiểu 1 thành viên Approve ➔ Merge main ➔ Cập nhật Kanban Done.
- **Chất lượng kiểm thử:** Xây dựng trọn bộ Ma trận kiểm thử (Test Matrix) và QA Checklist trên thiết bị thật do thành viên Khổng Thị Lệ Giang chủ trì.

---

## Slide 7 — Thành tựu nổi bật: AI AutoGrade & Mobile App Khách hàng B2C
- **AutoGrade AI (:8091):**
  - Mô hình YOLOv8 phân loại chính xác vết trầy xước/nứt vỡ theo Hạng S, A, B, C trong 12 giây.
  - OCR nhận diện chu kỳ sạc pin và đời máy, tự động áp dụng công thức khấu hao linh kiện minh bạch.
- **Mobile App Khách hàng 5 Tab B2C (PR #168):**
  - Giao diện chuẩn Google Stitch: Trang chủ showroom ➔ Cửa hàng (đặt giữ máy 24h) ➔ Thu cũ AI (tính giá 4 bước + trợ giá 2 triệu) ➔ Tra cứu bảo hành điện tử IMEI ➔ Tài khoản Gold Member.
  - Màn hình đăng nhập kép: chuyển đổi tức thì giữa Khách vãng lai và Nhân viên nội bộ.

---

## Slide 8 — Nghiệm thu Stakeholder & Bài học kinh nghiệm (Lessons Learned)
- **Nghiệm thu thực tế (UAT Sign-off):** Đại diện Chủ chuỗi Liêng Mobile đã trải nghiệm trực tiếp hệ thống và ký biên bản nghiệm thu chấp thuận toàn phần (Accepted).
- **Top 4 Bài học xương máu về Quản trị dự án:**
  1. *Kỷ luật quy trình:* Branch Protection và CI tự động là yếu tố sống còn để bảo vệ nhánh chính không bao giờ bị lỗi.
  2. *Tối ưu hóa nguồn lực:* Phân chia chuyên môn hóa theo thế mạnh từng thành viên mang lại năng suất cao gấp đôi cách làm việc tự do.
  3. *Kiểm soát phạm vi:* Mọi yêu cầu phát sinh bắt buộc phải đi qua quy trình Change Request (CR) để đánh giá tác động lịch trình.
  4. *Chuẩn bị phương án dự phòng:* Luôn có giải pháp Tunnel và Docker local để đối phó với rủi ro mạng chập chờn khi demo trước Hội đồng.

---

## Slide 9 — Kịch bản Live Demo 5 phút (Zero Crash Protocol)
1. **Phút 1:** Đăng nhập Web Admin, quản trị kho IMEI 15 số và bán hàng POS tạo mã VietQR PayOS tự động.
2. **Phút 2:** Chốt ca sổ quỹ Quán nhỏ tiện ích F&B, xuất biên lai sao kê ngày.
3. **Phút 3:** Thẩm định máy cũ bằng **AutoGrade AI (:8091)**: tải ảnh 6 góc ➔ YOLOv8 phát hiện lỗi ➔ sinh phiếu định giá tức thì.
4. **Phút 4:** Mở **App Mobile Khách hàng B2C (PR #168)** trên điện thoại: tra cứu bảo hành điện tử IMEI và tính giá thu cũ + trợ giá 2 triệu.
5. **Phút 5:** Trực tiếp đối chiếu bảng **GitHub Projects Kanban** và chứng minh **3/3 jobs CI Actions xanh** trên các PRs.

---

## Slide 10 — Lời cảm ơn & Sẵn sàng bảo vệ trước Hội đồng
- **Nhóm đồ án Liêng Mobile xin chân thành cảm ơn:**
  - Thầy **TS. Nguyễn Thanh Tuấn** đã tận tình hướng dẫn và định hướng tư duy quản trị chuyên nghiệp suốt học kỳ.
  - Đại diện Cửa hàng Liêng Mobile đã đồng hành hỗ trợ thử nghiệm thực tế.
- **Liên kết mã nguồn & Bảng quản trị:** `github.com/baopham1410/lieng-mobile-qtda`
- **Nhóm sẵn sàng lắng nghe câu hỏi phản biện từ Hội đồng chuyên môn!**
