# PROJECT CHARTER — LIÊNG MOBILE (QLDA)

**Mã dự án:** LIENG-MOBILE-QLDA  
**Học phần:** Quản Trị Dự Án Phần Mềm (VKU)  
**Sourcing Pathway:** Pathway 1 — Kế thừa / song hành đồ án chuyên ngành (Web + Mobile + AI)  
**Ngày hiệu lực:** 05/10/2026  
**Trạng thái:** Approved & Đã hoàn thành thực thi

---

## 1. Tên dự án & Mục tiêu

Xây dựng nền tảng quản lý hợp nhất chuỗi cửa hàng điện thoại và không gian trải nghiệm **Liêng Mobile**, tích hợp dịch vụ **AI hỗ trợ thẩm định và định giá thu mua điện thoại cũ (AutoGrade AI)** cùng **Trợ lý AI RAG nội bộ** và **Phân hệ Mobile App Khách hàng B2C**.

**Ba lớp giá trị cốt lõi:**
1. **Quản trị vận hành & POS:** Quản lý kho theo Serial/IMEI, điểm bán hàng POS, dòng tiền Quán nhỏ, báo cáo tài chính trên Web Admin & Mobile Nhân viên.
2. **AI Thẩm định & Định giá thu cũ (AutoGrade AI :8091):** Mô hình YOLOv8 phát hiện trầy xước/nứt vỡ 6 góc chụp, OCR trích xuất chu kỳ pin/màn hình, công thức định giá khấu trừ minh bạch.
3. **Cổng di động khách hàng B2C & Trợ lý RAG (:8090):** Mobile App 5 Tab (Trang chủ, Cửa hàng, Thu cũ AI, Bảo hành, Tôi) kết hợp Chatbot AI RAG tư vấn thông minh.

## 2. Sourcing Pathway & Stakeholders

| Hạng mục | Nội dung chi tiết |
|---|---|
| Sourcing Pathway | Pathway 1 — Kế thừa / song hành đồ án chuyên ngành Web, Mobile & Kỹ thuật AI |
| Giảng viên phụ trách môn | TS. Nguyễn Thanh Tuấn (Khoa KHMT - VKU) |
| Product Owner / Stakeholder nghiệm thu | Đại diện Chủ chuỗi cửa hàng Liêng Mobile (Người thụ hưởng thực tế) |
| Đại diện liên lạc dự án | Phạm Quốc Bảo (Tech Lead) & Nguyễn Thị Hồng (Project Manager) |

## 3. Vấn đề nghiệp vụ cần giải quyết

1. **Thất thoát tồn kho & nhầm lẫn máy:** Quản lý serial/IMEI thủ công bằng sổ sách dẫn đến tình trạng bán trùng máy hoặc tồn kho ảo.
2. **Định giá thu mua máy cũ cảm tính:** Không có tiêu chuẩn thẩm định khách quan, nhân viên định giá lệch nhau giữa các chi nhánh, tiềm ẩn rủi ro nhận máy lỗi linh kiện.
3. **Phân mảnh kênh bán lẻ và chăm sóc khách hàng:** Thiếu kênh tra cứu bảo hành điện tử và công cụ định giá thu cũ trực tuyến cho khách hàng B2C.
4. **Nhân viên mới thiếu hỗ trợ kỹ thuật:** Cần trợ lý AI nội bộ để tra cứu nhanh thông số máy, chính sách bảo hành và quy trình thẩm định.

## 4. Phạm vi dự án (In-Scope & Out-of-Scope)

### In-Scope (Đã hoàn thành 100%):
- **Nền tảng & Phân quyền RBAC:** Backend Laravel + Sanctum + Neon PostgreSQL Cloud, phân quyền 5 vai trò (`admin`, `sales_staff`, `warehouse_staff`, `quan_manager`, `quan_staff`).
- **Web Admin & Quán:** Quản lý kho IMEI, xuất nhập kho, quầy POS, thanh toán VietQR tự động qua PayOS Webhook, sổ quỹ Quán và báo cáo tài chính.
- **Dịch vụ AI AutoGrade (:8091):** FastAPI + YOLOv8 chẩn đoán ngoại quan, OCR đọc thông số, công thức định giá động và phát hành phiếu thẩm định máy cũ.
- **Trợ lý AI RAG nội bộ (:8090):** Vector database + LLM Ollama phục vụ tra cứu chính sách và nghiệp vụ bán hàng.
- **Mobile App Expo Đa vai trò (B2B & B2C):**
  - Chế độ nhân viên: POS di động, quét barcode/IMEI bằng Camera, chốt sổ ca trực.
  - Chế độ khách hàng (5 Tab): Trang chủ showroom, Danh mục sản phẩm (giữ máy 24h), Thu cũ AI (+2M trợ giá), Tra cứu bảo hành điện tử, Hồ sơ Gold Member.
- **Hệ sinh thái GitHub QLDA:** GitHub Projects Kanban, Issues, Pull Requests có Peer Review, GitHub Actions CI 3 jobs xanh (Laravel, Vite, Expo).

### Out-of-Scope (Bản phát hành tương lai):
- Phát hành chính thức lên Apple App Store / Google Play Store (sử dụng Expo Go & Cloudflare Web App PWA).
- Kiosk tự động hóa thu mua không người trực tại điểm công cộng.
- Tích hợp cổng thanh toán quốc tế Visa/Mastercard trực tiếp.

## 5. Mục tiêu SMART

| Tiêu chí | Nội dung thực hiện thực tế |
|:---:|---|
| **S** (Cụ thể) | Xây dựng hoàn chỉnh nền tảng quản trị cửa hàng điện thoại + Dịch vụ AutoGrade AI + Chatbot RAG + Mobile App B2B & B2C. |
| **M** (Đo lường được) | 168 Pull Requests, 100% CI 3 jobs pass; thời gian thẩm định AI < 15 giây/máy; 5 Tab Mobile B2C vận hành mượt mà. |
| **A** (Khả thi) | 3 thành viên (Bảo, Hồng, Giang) phân bổ vai trò chuyên môn hóa theo chuẩn công nghiệp, phối hợp qua GitHub Projects. |
| **R** (Thực tế) | Giải quyết triệt để bài toán định giá máy cũ minh bạch, tối ưu quầy POS và số hóa quy trình bảo hành cho chuỗi Liêng Mobile. |
| **T** (Thời hạn) | Hoàn thành toàn bộ 5 Sprint đúng hạn trước ngày bảo vệ học phần QLDA. |

## 6. Ràng buộc & Giả định

- **Ràng buộc:** 100% mã nguồn quản lý tập trung trên GitHub Repository `baopham1410/lieng-mobile-qtda` (Public); bắt buộc bật Branch Protection trên nhánh `main`; tuân thủ Conventional Commits; mọi PR phải có ít nhất 1 thành viên review và CI pass.
- **Giả định:** Neon PostgreSQL Cloud hoạt động ổn định; Stakeholder tham gia phản hồi và nghiệm thử UAT định kỳ mỗi Sprint.

## 7. Hệ sinh thái Quản trị GitHub (Theo Mục 7 Charter)

- **GitHub Repository:** `https://github.com/baopham1410/lieng-mobile-qtda` (Public, Branch Protection enabled).
- **GitHub Projects Board:** `https://github.com/users/baopham1410/projects/1` (Kanban: Backlog, Ready, In Progress, In Review, Done).
- **GitHub Issues:** Đầy đủ tiêu chí chấp nhận (Acceptance Criteria), người phụ trách, Story Points.
- **GitHub Actions (CI Pipeline):** 3 jobs tự động kiểm tra cú pháp, build test và typecheck trên mỗi PR.

## 8. Các mốc Milestone cốt lõi

1. **Milestone 1:** Kiến trúc Monorepo, Database Schema Neon PostgreSQL & Backend API Authentication.
2. **Milestone 2:** Web Admin POS, Quản lý kho Serial/IMEI, Phân hệ Quán nhỏ & PayOS VietQR.
3. **Milestone 3:** Dịch vụ AI AutoGrade (:8091) & Chatbot Assistant RAG (:8090).
4. **Milestone 4:** Mobile App Expo SDK 58, tích hợp Camera quét IMEI & Phân hệ Khách hàng B2C 5 Tab.
5. **Milestone 5:** Kiểm thử tích hợp, tối ưu hiệu năng, đóng gói Gói bằng chứng QLDA 8 hạng mục.

## 9. Ngân sách & Nguồn lực

- **Chi phí hạ tầng:** 0 VNĐ (Khai thác tối đa gói sinh viên GitHub Student Developer Pack, Cloudflare Tunnel, Neon PostgreSQL Serverless Cloud, Expo EAS và Ollama CPU inference).
- **Thời lượng làm việc:** Trung bình 15–20 giờ/tuần/thành viên trong suốt 15 tuần học kỳ.

## 10. Cơ cấu tổ chức & 5 Vai trò Kỹ thuật chuẩn VKU

Nhóm gồm **3 thành viên** phân công chuyên trách 5 vai trò kỹ thuật theo quy định môn học:

| Thành viên | Vai trò kỹ thuật đảm nhiệm | Trách nhiệm chính trong dự án | % Đóng góp |
|---|---|---|:---:|
| **Phạm Quốc Bảo** (`baopham1410`) | **Technical Lead / System Architect & Backend/AI Lead** | Quyết định kiến trúc hệ thống, thiết kế DB, xây dựng Backend API Laravel, Dịch vụ AI AutoGrade (:8091), Chatbot RAG (:8090) và CI/CD GitHub Actions. | **33.3%** |
| **Nguyễn Thị Hồng** (`Chimsedinang605`) | **Project Manager (PM) / Scrum Master & Frontend Lead** | Điều phối tiến độ, quản trị GitHub Projects Board, duy trì Sprint Backlog, phát triển Web Admin POS, module Quán và kiểm soát Definition of Done. | **33.3%** |
| **Khổng Thị Lệ Giang** (`ktlgiang`) | **Mobile Lead / UI/UX Designer & QA Test Engineer** | Thiết kế giao diện Mobile Stitch UI/UX, phát triển các component Mobile App, xây dựng Ma trận kiểm thử QA Matrix, QA Checklist và điều phối UAT với khách hàng. | **33.4%** |

> **Tổng tỷ lệ đóng góp:** **100% (Chia đều cả 3 thành viên: ~33.3% / người)**. Nhóm thống nhất đánh giá cả 3 thành viên đều tham gia tích cực, trách nhiệm và hoàn thành trọn vẹn khối lượng công việc được giao.

## 11. Quản trị Rủi ro ban đầu (Tóm tắt)

1. Rủi ro lệch tiến độ do mở rộng phạm vi AI: Giảm thiểu bằng cách phân rã thành các Sprint nhỏ và chốt MVP rule-based trước khi nâng cấp YOLOv8.
2. Rủi ro mạng Wi-Fi AP Isolation khi demo Mobile: Xử lý bằng Cloudflare Tunnel và Expo EAS Tunnel công khai qua Internet.
3. Rủi ro xung đột mã nguồn: Kiểm soát nghiêm ngặt qua Pull Request, Peer Review chéo giữa các thành viên và GitHub Actions CI.

## 12. Tiêu chí Hoàn thành Dự án (Definition of Done - DoD)

1. 100% User Stories cam kết được chuyển sang cột `Done` trên GitHub Projects.
2. Mã nguồn vượt qua kiểm tra tự động của GitHub Actions (0 lỗi lint, 0 lỗi TypeScript, tests pass).
3. Hệ thống chạy live thực tế trên Cloudflare Tunnel qua giao thức HTTPS.
4. Có đầy đủ Gói bằng chứng QLDA 8 hạng mục nộp đúng quy cách thư mục Google Drive.
5. Có biên bản nghiệm thu chấp thuận người dùng (UAT Sign-off) từ đại diện Stakeholder.

## 13. Phê duyệt & Ký nhận Điều lệ Dự án

| Vai trò | Họ và tên | Chữ ký xác nhận | Ngày ký |
|---|---|:---:|:---:|
| **Technical Lead** | Phạm Quốc Bảo | *(Đã ký)* | 05/10/2026 |
| **Project Manager / Scrum Master** | Nguyễn Thị Hồng | *(Đã ký)* | 05/10/2026 |
| **Mobile Lead & QA Engineer** | Khổng Thị Lệ Giang | *(Đã ký)* | 05/10/2026 |
| **Đại diện Stakeholder / PO** | Cửa hàng Liêng Mobile | *(Đã ký)* | 05/10/2026 |
| **Giảng viên hướng dẫn QLDA** | TS. Nguyễn Thanh Tuấn | *(Phê duyệt)* | __/__/2026 |
