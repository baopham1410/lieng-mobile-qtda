# BÁO CÁO TỔNG KẾT KỸ THUẬT (FINAL TECHNICAL REPORT)
## Dự án: Nền tảng Quản trị Chuỗi Cửa hàng Điện thoại & Phân hệ Tiện ích Liêng Mobile
### Tích hợp AutoGrade AI Thẩm định Máy cũ, Chatbot RAG & Mobile App Khách hàng B2C

**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management)  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Nhóm thực hiện (3 thành viên):**  
- **Phạm Quốc Bảo** (`baopham1410`) — Technical Lead / System Architect & Backend/AI Lead (40%)  
- **Nguyễn Thị Hồng** (`Chimsedinang605`) — Project Manager / Scrum Master & Frontend Lead (35%)  
- **Khổng Thị Lệ Giang** (`ktlgiang`) — Mobile Lead / UI/UX Designer & QA Test Engineer (25%)  
**GitHub Repository:** `https://github.com/baopham1410/lieng-mobile-qtda` (Public)  
**GitHub Projects Board:** `https://github.com/users/baopham1410/projects/1`  
**Sourcing Pathway:** Pathway 1 — Kế thừa & song hành Đồ án chuyên ngành Web, Mobile & Kỹ thuật AI  
**Văn phong báo cáo:** Tuân thủ quy chuẩn học phần — mô tả toàn bộ sự kiện kỹ thuật và quản trị **Ở THÌ QUÁ KHỨ (PAST TENSE)**.

---

# Chương 1. Tổng Quan Dự Án & Bối Cảnh Nghiệp Vụ (Executive Summary & Business Case)

## 1.1. Bối cảnh thực tế
Chuỗi cửa hàng bán lẻ thiết bị di động **Liêng Mobile** kết hợp không gian showroom trải nghiệm tiện ích tại Đà Nẵng vận hành đồng thời hai mảng hoạt động: kinh doanh điện thoại di động chính hãng/lướt và quầy tiện ích F&B phục vụ khách trải nghiệm. Trước khi triển khai dự án, hoạt động của cửa hàng gặp nhiều trở ngại lớn: quản lý số Serial/IMEI bằng bảng tính Excel phân tán, nhân viên thu mua máy cũ định giá hoàn toàn dựa trên cảm tính cá nhân, và chưa có hệ sinh thái số liên thông giữa Web quản trị, quầy POS và ứng dụng di động cho khách hàng.

## 1.2. Vấn đề cốt lõi cần giải quyết
1. **Thất thoát & nhầm lẫn máy theo IMEI:** Quản lý kho thủ công dẫn đến việc bán trùng mã máy hoặc lệch trạng thái bảo hành giữa các ca trực.
2. **Rủi ro thu mua máy cũ bằng cảm tính:** Nhân viên không có tiêu chuẩn kỹ thuật thống nhất để phân loại ngoại quan trầy xước/nứt vỡ, trích xuất chu kỳ pin và khấu trừ linh kiện, dẫn đến nguy cơ thu mua máy lỗi gây thiệt hại tài chính.
3. **Phân mảnh kênh khách hàng B2C:** Khách hàng không có công cụ tự tra cứu bảo hành điện tử 15 số IMEI hoặc tự ước lượng giá trị máy cũ online trước khi tới showroom.
4. **Thiếu hỗ trợ nghiệp vụ cho nhân viên mới:** Nhân viên ca trực mất nhiều thời gian tra cứu chính sách giá và thông số kỹ thuật nếu không có trợ lý nội bộ.

## 1.3. Giải pháp kỹ thuật đã triển khai thực tế
Dự án đã phát triển và đưa vào vận hành thực tế hệ thống hợp nhất bao gồm:
- **Backend API tập trung:** Laravel 9 + Sanctum + Neon PostgreSQL Cloud, phân quyền RBAC 5 vai trò (`admin`, `sales_staff`, `warehouse_staff`, `quan_manager`, `quan_staff`).
- **Web Admin & POS bán hàng:** Vue 3 + Vite + Tailwind CSS, tích hợp thanh toán tự động VietQR qua PayOS Webhook, quản lý kho IMEI và sổ quỹ Quán nhỏ.
- **Dịch vụ AutoGrade AI (:8091):** FastAPI + YOLOv8 phân loại trầy xước/nứt vỡ qua 6 góc chụp, OCR nhận diện thông số pin/màn hình, công thức định giá tự động và biên bản thẩm định.
- **Trợ lý AI RAG nội bộ (:8090):** Vector database + LLM Ollama CPU inference hỗ trợ tra cứu nghiệp vụ bán hàng.
- **Mobile App Expo SDK 58 đa vai trò:** Chế độ nhân viên POS di động và Phân hệ Khách hàng 5 Tab B2C (Trang chủ, Cửa hàng, Thu cũ AI, Bảo hành, Tôi) tích hợp Camera quét mã IMEI.

## 1.4. Đánh giá kết quả theo mục tiêu SMART

| Tiêu chí | Mục tiêu cam kết ban đầu | Kết quả thực tế đạt được |
|:---:|---|---|
| **S** | Xây dựng hệ thống quản trị cửa hàng + AI thẩm định máy cũ + Mobile App. | Hoàn thành trọn vẹn cả 3 phân hệ, tích hợp liên thông qua RESTful API. |
| **M** | 100% CI checks xanh; thẩm định AI < 30 giây; tối thiểu 40 SP/Sprint. | 168 Pull Requests merged; 3/3 CI jobs pass; thẩm định AI đạt 12-15s; vận tốc trung bình 47.4 SP/Sprint. |
| **A** | 3 thành viên hoàn thành khối lượng trong 15 tuần học kỳ. | Phân công chuyên môn hóa 3 vai trò rõ ràng, hoàn thành 237/275 SP (86.2%). |
| **R** | Ứng dụng thực tế tại chuỗi Liêng Mobile, giải quyết bài toán định giá máy cũ. | Đã triển khai live qua Cloudflare Tunnel và được Stakeholder ký biên bản UAT. |
| **T** | Hoàn thành trước buổi bảo vệ đồ án môn học. | Đóng gói Gói bằng chứng 8 hạng mục đúng hạn quy định. |

---

# Chương 2. Phương Pháp Luận & Cơ Cấu Quản Trị (Methodology & Team Governance)

## 2.1. Lựa chọn phương pháp luận Agile / Hybrid Scrum-Kanban
Nhóm đã áp dụng phương pháp luận **Hybrid Scrum-Kanban** phù hợp với bối cảnh đặc thù của đồ án:
- **Khung Scrum:** Tổ chức 5 Sprint có Timebox rõ ràng (Sprint 1 đến Sprint 5), thực hiện Sprint Planning qua User Stories / Story Points, Daily Standup ngắn qua kênh trao đổi nội bộ, và Sprint Retrospective đúc rút bài học cải tiến cuối mỗi đợt.
- **Cơ chế Kanban:** Trực quan hóa dòng chảy công việc trên bảng **GitHub Projects Board** với 5 trạng thái: `Backlog` ➔ `Ready` ➔ `In Progress` ➔ `In Review` ➔ `Done`. Mọi User Story bắt buộc phải có Issue liên kết, di chuyển minh bạch theo thời gian thực.

## 2.2. Cơ cấu phân công 5 vai trò kỹ thuật chuẩn VKU
Nhóm gồm **3 sinh viên**, phân công trách nhiệm theo năng lực chuyên môn:

| Thành viên | Vai trò kỹ thuật chính | Khối lượng phụ trách thực tế | Tỷ lệ đóng góp |
|---|---|---|:---:|
| **Phạm Quốc Bảo** (`baopham1410`) | Technical Lead, System Architect & Backend/AI Lead | Thiết kế cơ sở dữ liệu Neon PostgreSQL, Backend API Laravel, Dịch vụ AI AutoGrade (:8091), Chatbot RAG (:8090) và GitHub Actions CI/CD Pipeline. | **40%** |
| **Nguyễn Thị Hồng** (`Chimsedinang605`) | Project Manager (PM), Scrum Master & Frontend Lead | Điều phối tiến độ Sprint, duy trì Product Backlog, phát triển Web Admin POS, Phân hệ Quán nhỏ, PayOS Webhook và thẩm định chất lượng các PRs. | **35%** |
| **Khổng Thị Lệ Giang** (`ktlgiang`) | Mobile Lead, UI/UX Designer & QA Test Engineer | Thiết kế giao diện Google Stitch Mobile, phát triển các component Mobile App, xây dựng Ma trận kiểm thử QA Matrix, QA Checklist và điều phối kiểm thử UAT trên thiết bị iOS/Android thật. | **25%** |

## 2.3. Quy tắc quản trị mã nguồn & Cổng chất lượng (Quality Gates)
Nhóm đã thiết lập và tuân thủ nghiêm ngặt quy trình phát triển:
1. Mỗi nhiệm vụ WBS hoặc User Story tương ứng với **01 GitHub Issue**.
2. Lập trình trên nhánh tính năng chuyên biệt (`feature/...`).
3. Mọi commit tuân thủ quy chuẩn **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
4. Đẩy mã nguồn qua **Pull Request (PR)**, tự điền Self-test notes.
5. Nhánh `main` được bật **Branch Protection**: bắt buộc ít nhất 01 thành viên khác review và Approve; bắt buộc 3 jobs GitHub Actions CI chạy xanh 100% mới được phép merge.

---

# Chương 3. Đường Cơ Sở Phạm Vi & Phân Rã Công Việc (Scope Baseline, WBS & WBS Dictionary)

## 3.1. Đường cơ sở phạm vi (Scope Baseline)
- **In-Scope hoàn thành:** Xác thực Sanctum; Quản lý kho Serial/IMEI; Điểm bán hàng POS; Thanh toán VietQR tự động PayOS; Quản lý khách hàng CRM; Dịch vụ bảo hành; Sổ quỹ Quán nhỏ & sao kê; Dịch vụ AI AutoGrade chẩn đoán ngoại quan YOLOv8 và OCR; Chatbot RAG nội bộ; Mobile App đa vai trò (B2B ca trực & B2C 5 Tab khách hàng).
- **Out-of-Scope:** Phát hành lên chợ ứng dụng App Store / Google Play thương mại; Kiosk tự động ngoài trời; Cổng thanh toán quốc tế trực tiếp.

## 3.2. Cây phân rã công việc WBS (Tuân thủ Quy tắc 100% Rule)
Hệ thống được phân rã thành 6 gói công việc cấp 1, chia nhỏ thành các gói công việc 1–2 tuần:

```text
1. Hệ thống Liêng Mobile Platform (100%)
├── 1.1 Khởi tạo Nền tảng & Quản trị Dự án (Scaffold, Monorepo, GitHub Ecosystem)
├── 1.2 Phân hệ Dịch vụ Nền tảng Backend API & Neon PostgreSQL (Auth, RBAC, Core API)
├── 1.3 Phân hệ Quản trị Web Admin, Bán lẻ POS & Tiện ích Quán (Frontend Vue 3/Vite)
├── 1.4 Phân hệ AI AutoGrade Thẩm định Máy cũ & Chatbot RAG (:8091 & :8090)
├── 1.5 Phân hệ Mobile App Expo Đa vai trò (B2B POS & B2C Customer Portal)
└── 1.6 Kiểm thử Chất lượng, CI/CD Pipeline & Đóng gói Gói bằng chứng QLDA
```

Chi tiết từ điển WBS (WBS Dictionary), mô tả đầu vào/đầu ra và tiêu chí hoàn thành được đặc tả đầy đủ trong tài liệu [`03_WBS_and_WBS_Dictionary.pdf`](03_WBS_and_WBS_Dictionary.pdf).

---

# Chương 4. Ước Lượng, Lịch Trình & Vận Tốc Đội Ngũ (Estimation, Schedule & Velocity)

## 4.1. Kỹ thuật ước lượng Story Points (Planning Poker)
Nhóm đã sử dụng dãy số Fibonacci (1, 2, 3, 5, 8, 13) để ước lượng độ phức tạp, khối lượng công việc và rủi ro:
- **1–2 SP:** Tác vụ cấu hình, sửa giao diện tĩnh hoặc hiệu chỉnh text/icon.
- **3 SP:** Màn hình CRUD cơ bản kết nối API backend.
- **5 SP:** Màn hình nghiệp vụ phức tạp (POS giỏ hàng, form thẩm định nhiều bước, camera scanner).
- **8 SP:** Module tích hợp công nghệ cao (PayOS Webhook, YOLOv8 inference, Expo SDK 58 B2C Shell).

## 4.2. Đường găng dự án (Critical Path Method - CPM)
Đường găng thực tế của dự án đã diễn ra tuần tự qua các nút thắt kỹ thuật trọng yếu:
$$\text{Monorepo Setup} \longrightarrow \text{Backend DB/API Core} \longrightarrow \text{Frontend Foundation} \longrightarrow \text{POS & Quán Web} \longrightarrow \text{AutoGrade AI Engine} \longrightarrow \text{Mobile Expo Shell & B2C Portal} \longrightarrow \text{CI/CD & Evidence Packaging}$$
Bất kỳ sự chậm trễ nào tại Backend API hoặc Foundation đều ảnh hưởng trực tiếp đến tiến độ phát triển giao diện của Frontend và Mobile.

## 4.3. Phân tích vận tốc thực tế (Team Velocity qua 5 Sprint)

| Giai đoạn | Số PBIs | SP dự kiến | SP hoàn thành | Tỷ lệ (%) | Vận tốc Sprint (Velocity) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Sprint 1 (Khởi tạo & Foundation)** | 8 | 42 SP | 42 SP | 100% | 42 SP |
| **Sprint 2 (Web Admin POS & IMEI)** | 12 | 48 SP | 48 SP | 100% | 48 SP |
| **Sprint 3 (Phân hệ Quán & Dòng tiền)** | 7 | 39 SP | 39 SP | 100% | 39 SP |
| **Sprint 4 (Báo cáo, PayOS & CI/CD)** | 4 | 35 SP | 35 SP | 100% | 35 SP |
| **Sprint 5 (AI AutoGrade & Mobile B2C)** | 22 | 73 SP | 73 SP | 100% | 73 SP |
| **TỔNG CỘNG** | **53 PBIs** | **237 SP** | **237 SP** | **100%** | **Trung bình: 47.4 SP/Sprint** |

---

# Chương 5. Thực Thi, Kiểm Thử, CI/CD & Definition of Done (Execution & Quality Control)

## 5.1. Lịch sử thực thi trên GitHub
- **Tổng số Pull Requests:** 168 PRs được tạo và kiểm duyệt thành công.
- **Phân bổ Commit:** Commit trải đều liên tục suốt 15 tuần học kỳ từ cả 3 thành viên, tuyệt đối không có hiện tượng "dump commit".
- **Peer Review:** 100% PRs hợp nhất vào nhánh `main` đều có ít nhất 01 thành viên khác Approve (Bảo ⟷ Hồng ⟷ Giang).

## 5.2. Hoạt động kiểm thử & Đảm bảo chất lượng (QA)
Thành viên Khổng Thị Lệ Giang đã chủ trì xây dựng bộ tài liệu kiểm thử chất lượng toàn diện:
- **Unit & Feature Tests (Backend):** Sử dụng PHPUnit kiểm thử logic xác thực Sanctum, phân quyền RBAC và giao dịch xuất nhập kho IMEI.
- **Frontend Build Test:** Kiểm tra bundle Vite, tối ưu hóa CSS và loại bỏ component lỗi.
- **Mobile TypeScript Check:** Thực thi `tsc --noEmit` đạt 0 lỗi typecheck trên Expo SDK 58.
- **Kiểm thử UAT thực địa:** Kiểm tra quét mã vạch và chụp ảnh ngoại quan trên thiết bị iPhone/Android thực tế qua mạng Cloudflare Tunnel.

## 5.3. Đường ống tự động hóa CI/CD (GitHub Actions)
Tệp cấu hình `.github/workflows/ci.yml` được kích hoạt tự động trên mỗi Pull Request và mỗi lần push vào nhánh `main`:
- **Job 1 (Backend - Laravel):** Cài đặt dependencies, chạy migrations trong bộ nhớ và thực thi PHPUnit tests.
- **Job 2 (Frontend - Vue/Vite):** Kiểm tra cú pháp, linting và chạy `npm run build`.
- **Job 3 (Mobile - Expo/TypeScript):** Cài đặt package và chạy kiểm tra kiểu dữ liệu TypeScript.
Toàn bộ 3 jobs đều phải hiển thị trạng thái xanh (Pass) thì GitHub mới cho phép kích hoạt nút Merge.

## 5.4. Định nghĩa hoàn thành (Definition of Done - DoD)
Một User Story chỉ được chuyển sang cột `Done` khi thỏa mãn 5 tiêu chí:
1. Mã nguồn nằm trên nhánh `feature/...` và tạo PR đầy đủ mô tả.
2. Có ghi chú tự kiểm thử (Self-test notes) đính kèm minh chứng.
3. Vượt qua 3/3 jobs kiểm tra tự động của GitHub Actions CI.
4. Được ít nhất 01 thành viên khác trong nhóm review và Approve.
5. Cập nhật trạng thái tương ứng trên GitHub Projects Board và Product Backlog.

---

# Chương 6. Quản Trị Rủi Ro & Kiểm Soát Thay Đổi Phạm Vi (Risk Evolution & Change Control)

## 6.1. Sự tiến hóa của bảng theo dõi rủi ro (Risk Register Evolution)
Nhóm đã duy trì và cập nhật bảng rủi ro qua 2 đợt đánh giá lớn (Sprint 1 và Sprint 5):
- **Rủi ro R-01 (Lệch cấu hình DB Cloud):** Neon PostgreSQL yêu cầu kết nối SSL; nhóm đã khắc phục bằng cách cấu hình chuẩn chứng chỉ CA trong `.env`.
- **Rủi ro R-02 (Scope Creep Frontend ban đầu):** Đã giải quyết triệt để thông qua phiếu thay đổi **CR-001** (chỉ giữ lại Foundation).
- **Rủi ro R-03 (Chồng chéo trách nhiệm nhân sự):** Đã tái cơ cấu thông qua phiếu **CR-002**, phân định rõ mảng Mobile/QA cho Giang, Web/PM cho Hồng và Backend/AI cho Bảo.
- **Rủi ro R-04 (Mạng Wi-Fi chặn kết nối nội bộ khi demo Mobile):** Tính năng AP Isolation tại quán cafe chặn IP LAN; nhóm đã xử lý bằng cách tích hợp **Cloudflare Tunnel** và **Expo EAS Tunnel** chạy công khai qua Internet.

## 6.2. Kiểm soát thay đổi phạm vi thực tế (Hồ sơ 5 Change Requests - CR)
Nhóm đã thành lập Hội đồng kiểm soát thay đổi (CCB) và phê duyệt 5 yêu cầu thay đổi chính thức:
1. **CR-001:** Thu hẹp phạm vi khởi tạo Frontend Foundation (PR #79).
2. **CR-002:** Tái phân bổ vai trò chuyên môn hóa kỹ thuật 3 thành viên (Bảo - Hồng - Giang).
3. **CR-003:** Chuyển Repository sang Public, kích hoạt Branch Protection và CI bắt buộc (PR #90, PR #91).
4. **CR-004:** Mở rộng tích hợp Dịch vụ AI AutoGrade (:8091) và Chatbot RAG nội bộ (:8090) (PR #140, PR #150, PR #164).
5. **CR-005:** Nâng cấp Expo SDK 58 và phát triển Cổng Mobile Khách hàng 5 Tab B2C (PR #166, PR #167, PR #168).

---

# Chương 7. Nghiệm Thu, Đóng Dự Án & Bài Học Kinh Nghiệm (Closure, UAT & Lessons Learned)

## 7.1. Kết quả kiểm thử chấp nhận người dùng (UAT Sign-off)
Đại diện chủ chuỗi cửa hàng Liêng Mobile (Product Owner / Stakeholder thực tế) đã tham gia đợt nghiệm thu tổng thể hệ thống:
- Luồng bán hàng POS quét IMEI và nhận tiền tự động qua VietQR PayOS đạt độ trễ < 2 giây.
- Luồng thẩm định máy cũ AutoGrade AI nhận diện chính xác vết trầy xước và trích xuất thông số pin trong 12 giây, xuất biên bản định giá rõ ràng.
- Ứng dụng di động khách hàng 5 Tab B2C hoạt động ổn định trên cả Safari iOS và Android.
Đại diện Stakeholder đã chính thức ký nhận **Biên bản nghiệm thu UAT Sign-off** không có điểm khiếm khuyết chặn vận hành.

## 7.2. Bài học kinh nghiệm xương máu (Top Lessons Learned)
1. **Quản trị phạm vi (Scope Control):** Việc kiên quyết tách biệt giữa khung kiến trúc ban đầu và giao diện chi tiết (CR-001) đã cứu dự án khỏi tình trạng mã nguồn phình to và xung đột không thể kiểm soát.
2. **Phân bổ nguồn lực chuyên môn hóa (Agile Resource Management):** Tối ưu hóa vai trò của 3 thành viên theo đúng thế mạnh (CR-002) giúp gia tăng vận tốc làm việc của nhóm lên gấp đôi trong giai đoạn nước rút.
3. **Kỷ luật kỹ thuật (Engineering Discipline):** Quy tắc Branch Protection và CI bắt buộc là tấm lá chắn quan trọng nhất giúp nhánh `main` luôn ở trạng thái sẵn sàng triển khai (Production-ready).
4. **Chuẩn bị kịch bản dự phòng (Contingency Planning):** Thiết lập sẵn đường hầm Cloudflare Tunnel công khai giúp nhóm hoàn toàn chủ động trước sự cố mạng chập chờn tại các địa điểm demo thực địa.

## 7.3. Đóng dự án kỹ thuật (Technical Project Closure)
Hệ thống Liêng Mobile đã hoàn thành 100% các mục tiêu cốt lõi đã cam kết. Toàn bộ mã nguồn, dữ liệu di chuyển, đường ống CI/CD và bộ hồ sơ Gói bằng chứng QLDA 8 hạng mục đã được hoàn thiện, lưu trữ và sẵn sàng phục vụ buổi bảo vệ chính thức trước Hội đồng chuyên môn VKU.

---

### Phụ lục tài liệu tham chiếu
- **Phụ lục A:** [Repository GitHub & Lịch sử Pull Requests](https://github.com/baopham1410/lieng-mobile-qtda/pulls)
- **Phụ lục B:** [GitHub Projects Kanban Board](https://github.com/users/baopham1410/projects/1)
- **Phụ lục C:** Bộ Gói bằng chứng 8 Deliverables chuẩn Thư mục Google Drive.

**Đại diện nhóm lập báo cáo:**  
- **Phạm Quốc Bảo** (Technical Lead) — *(Ký tên)*  
- **Nguyễn Thị Hồng** (Project Manager / Scrum Master) — *(Ký tên)*  
- **Khổng Thị Lệ Giang** (Mobile Lead & QA Lead) — *(Ký tên)*  
**Đà Nẵng, ngày 14 tháng 11 năm 2026**
