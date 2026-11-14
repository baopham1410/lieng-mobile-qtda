# Scope Change Control Record (CCB) — Liêng Mobile QLDA

**Dự án:** Liêng Mobile QLDA  
**Hội đồng kiểm soát thay đổi (Change Control Board - CCB):**  
- Phạm Quốc Bảo (`baopham1410`) — Technical Lead / System Architect  
- Nguyễn Thị Hồng (`Chimsedinang605`) — Project Manager / Scrum Master  
- Khổng Thị Lệ Giang (`ktlgiang`) — Mobile Lead / QA Test Lead  
- Đại diện Stakeholder Cửa hàng Liêng Mobile (Tham vấn nghiệm thu)

Toàn bộ các yêu cầu thay đổi phạm vi (Change Requests - CR) so với đường cơ sở (Baseline) ban đầu được ghi nhận, đánh giá tác động và phê duyệt dưới đây.

---

## CR-001 — Thu hẹp phạm vi khởi tạo Frontend Foundation (Approved)

| Trường thông tin | Nội dung chi tiết |
|---|---|
| **Mã thay đổi** | **CR-001** |
| **Ngày đề xuất** | 01/11/2026 |
| **Người đề xuất** | Phạm Quốc Bảo (Technical Lead) |
| **Lý do đề xuất** | PR Frontend khởi tạo ban đầu chứa quá nhiều màn hình gộp, vi phạm nguyên tắc "nền tảng tối thiểu", gây khó khăn cho việc Review mã nguồn và trùng lặp phạm vi công việc của Frontend Lead. |
| **Mô tả thay đổi** | **Thu hẹp phạm vi:** PR Frontend Foundation chỉ giữ lại khung kiến trúc Vue 3, Vite, Tailwind CSS, Layouts và các Stub màn hình; giao diện chi tiết từng chức năng được tách thành các PR riêng theo từng User Story / Issue. |
| **Ảnh hưởng tiến độ** | Bổ sung 01 PR sửa đổi (#79); tiến độ phát triển giao diện rõ ràng hơn theo tiêu chuẩn Definition of Done. |
| **Ảnh hưởng nguồn lực** | Bảo xử lý tách khung Foundation; Hồng và Giang phát triển giao diện theo từng Issue chuyên biệt. |
| **Quyết định của CCB** | **Approved (Phê duyệt thực thi)** |
| **Bằng chứng thực tế** | Pull Request #79 `fix(frontend): PR3 chi giu nen tang, stub UI...` |
| **Cập nhật Baseline** | Điều chỉnh WBS gói 1.3.2; không merge giao diện toàn phần trong PR Foundation. |

---

## CR-002 — Tái phân bổ vai trò chuyên môn hóa kỹ thuật 3 thành viên (Approved)

| Trường thông tin | Nội dung chi tiết |
|---|---|
| **Mã thay đổi** | **CR-002** |
| **Ngày đề xuất** | 02/11/2026 |
| **Người đề xuất** | Nguyễn Thị Hồng (Project Manager / Scrum Master) |
| **Lý do đề xuất** | Nhằm tối ưu hóa hiệu suất làm việc của nhóm 3 thành viên theo đúng thế mạnh kỹ thuật, tránh chồng chéo trách nhiệm giữa Frontend Web và Mobile App. |
| **Mô tả thay đổi** | **Chuyên môn hóa nguồn lực:**<br>- **Khổng Thị Lệ Giang (`ktlgiang`)**: Đảm nhiệm toàn diện mảng **Mobile Lead, Thiết kế UI/UX theo chuẩn Google Stitch**, xây dựng **Ma trận kiểm thử (Test Matrix) & QA Checklist**, thực hiện kiểm thử UAT trên thiết bị iOS/Android thật.<br>- **Nguyễn Thị Hồng (`Chimsedinang605`)**: Đảm nhiệm **Project Manager / Scrum Master**, phụ trách **Web Admin POS, Phân hệ Quán nhỏ** và điều phối Sprint.<br>- **Phạm Quốc Bảo (`baopham1410`)**: Đảm nhiệm **Technical Lead, Backend API, Dịch vụ AI AutoGrade & Hạ tầng CI/CD**. |
| **Ảnh hưởng tiến độ** | Tốc độ hoàn thành các màn hình Mobile và tài liệu kiểm thử tăng rõ rệt; tỷ lệ phân bổ đóng góp chia đều đồng thuận: Bảo 33.3%, Hồng 33.3%, Giang 33.4% (Tổng cộng 100% chia đều). |
| **Quyết định của CCB** | **Approved (Phê duyệt thực thi)** |
| **Bằng chứng thực tế** | Bộ tài liệu QA Checklist (`docs/qa-test-checklist.md`), PR #86, PR #87, PR #165 (Stitch Mobile UI). |
| **Cập nhật Baseline** | Cập nhật Mục 10 Project Charter, Ma trận RACI trong Product Backlog; đóng Rủi ro R-03. |

---

## CR-003 — Chuyển Repository sang Public, kích hoạt Branch Protection & CI bắt buộc (Approved)

| Trường thông tin | Nội dung chi tiết |
|---|---|
| **Mã thay đổi** | **CR-003** |
| **Ngày đề xuất** | 02/11/2026 |
| **Người đề xuất** | Phạm Quốc Bảo (Technical Lead) |
| **Lý do đề xuất** | Đáp ứng yêu cầu nghiêm ngặt của Thầy TS. Nguyễn Thanh Tuấn về việc thiết lập quy tắc bảo vệ nhánh chính (Branch Protection) trên GitHub. |
| **Mô tả thay đổi** | Chuyển chế độ kho lưu trữ từ Private sang **PUBLIC**; kích hoạt Branch Protection trên nhánh `main`: bắt buộc tạo Pull Request, bắt buộc ít nhất 01 thành viên duyệt (Peer Review), bắt buộc vượt qua 3 jobs GitHub Actions CI (`Backend`, `Frontend`, `Mobile`). |
| **Ảnh hưởng tiến độ** | Chuẩn hóa quy trình làm việc chuyên nghiệp; loại bỏ 100% rủi ro đẩy trực tiếp mã nguồn lỗi vào nhánh `main`. |
| **Quyết định của CCB** | **Approved (Phê duyệt thực thi)** |
| **Bằng chứng thực tế** | Repository công khai: `baopham1410/lieng-mobile-qtda`; PR #90, PR #91. |
| **Cập nhật Baseline** | Cập nhật Mục 7 Project Charter; hoàn thành gói công việc WBS 1.5.2 & 1.5.3. |

---

## CR-004 — Mở rộng tích hợp Dịch vụ AI AutoGrade & Chatbot RAG nội bộ (Approved)

| Trường thông tin | Nội dung chi tiết |
|---|---|
| **Mã thay đổi** | **CR-004** |
| **Ngày đề xuất** | 05/11/2026 |
| **Người đề xuất** | Phạm Quốc Bảo (Technical Lead) & Hội đồng nhóm |
| **Lý do đề xuất** | Bổ sung hướng nghiên cứu chuyên sâu về Trí tuệ nhân tạo (AI): giải quyết bài toán định giá thu mua điện thoại cũ khách quan và trợ lý nội bộ thông minh cho nhân viên showroom. |
| **Mô tả thay đổi** | **Mở rộng phạm vi In-Scope:**<br>1. Xây dựng **Dịch vụ AI AutoGrade (:8091)** với mô hình YOLOv8 phát hiện trầy xước/nứt vỡ 6 góc chụp, OCR trích xuất thông số pin/màn hình và công thức tính khấu hao tự động.<br>2. Xây dựng **Trợ lý AI RAG (:8090)** với LLM Ollama CPU inference kết nối cơ sở tri thức nội bộ Liêng Mobile. |
| **Ảnh hưởng tiến độ** | Bổ sung Sprint 5; tăng 25 Story Points; hoàn thành đúng tiến độ trước ngày nghiệm thu. |
| **Quyết định của CCB** | **Approved (Phê duyệt thực thi & Đã hoàn thành 100%)** |
| **Bằng chứng thực tế** | Mã nguồn dịch vụ `autograde-service` (:8091), `assistant-service` (:8090), PR #140, PR #150, PR #164. |
| **Cập nhật Baseline** | Cập nhật Mục 1/4/5 Project Charter; bổ sung gói công việc WBS 1.6 & 1.7. |

---

## CR-005 — Nâng cấp Expo SDK 58 & Mở rộng Phân hệ Mobile App Khách hàng 5 Tab B2C (Approved)

| Trường thông tin | Nội dung chi tiết |
|---|---|
| **Mã thay đổi** | **CR-005** |
| **Ngày đề xuất** | 13/11/2026 |
| **Người đề xuất** | Khổng Thị Lệ Giang (Mobile Lead) & Nguyễn Thị Hồng (PM) |
| **Lý do đề xuất** | Triển khai theo tài liệu `Huong-Dan-Man-Hinh-App-Khach-Lieng-Mobile.docx` phục vụ khách hàng vãng lai B2C và tương thích với ứng dụng Expo Go SDK 58 mới nhất trên iOS. |
| **Mô tả thay đổi** | **Mở rộng giao diện & Nâng cấp công nghệ:**<br>1. Nâng cấp toàn bộ dependencies `mobile-expo` lên **Expo SDK 58, React Native 0.88, React 19**.<br>2. Xây dựng phân hệ **App Khách Hàng 5 Tab**: Trang chủ showroom, Cửa hàng (đặt giữ máy 24h), Thu cũ AI (tính giá 4 bước + trợ giá 2M), Bảo hành điện tử (tra cứu IMEI/SĐT), Tài khoản Gold Member.<br>3. Màn hình đăng nhập kép: chuyển đổi linh hoạt giữa Khách vãng lai và Nhân viên nội bộ. |
| **Ảnh hưởng tiến độ** | Hoàn thành trong Sprint 5; nâng điểm hoàn thành dự án lên **237 / 275 Story Points (86.2%)**. |
| **Quyết định của CCB** | **Approved (Phê duyệt thực thi & Đã hoàn thành 100%)** |
| **Bằng chứng thực tế** | Pull Request #166, #167, #168 (`feat(mobile): B2C Customer Portal with 5 tabs...`); CI 3/3 jobs xanh. |
| **Cập nhật Baseline** | Cập nhật PBI-56 trong Product Backlog; đóng Issue #161. |

---

## Bảng tổng hợp các yêu cầu thay đổi (CR Summary Matrix)

| Mã CR | Tiêu đề thay đổi | Trạng thái CCB | Mức độ tác động | Bằng chứng thực tế (Evidence) |
|:---:|---|:---:|:---:|---|
| **CR-001** | Thu hẹp phạm vi Frontend Foundation | **Approved** | Thấp (Tổ chức code) | PR #79 |
| **CR-002** | Chuyên môn hóa vai trò 3 thành viên (Bảo - Hồng - Giang) | **Approved** | Trung bình (Tối ưu nguồn lực) | Docs QA Checklist, PR #86, #87, #165 |
| **CR-003** | Public repo + Bật Branch Protection & CI 3 jobs | **Approved** | Cao (Kiểm soát chất lượng) | PR #90, PR #91 |
| **CR-004** | Tích hợp Dịch vụ AI AutoGrade (:8091) & Chatbot RAG (:8090) | **Approved** | Cao (Giá trị cốt lõi AI) | PR #140, PR #150, PR #164 |
| **CR-005** | Nâng cấp Expo SDK 58 & Phân hệ Mobile Khách hàng 5 Tab B2C | **Approved** | Cao (Trải nghiệm Omnichannel) | PR #166, #167, #168 (PBI-56) |

---

### Chữ ký phê duyệt của Hội đồng CCB

| Đại diện | Họ và tên | Chữ ký xác nhận | Ngày phê duyệt |
|---|---|:---:|:---:|
| **Technical Lead** | Phạm Quốc Bảo | *(Đã ký)* | 14/11/2026 |
| **Project Manager / Scrum Master** | Nguyễn Thị Hồng | *(Đã ký)* | 14/11/2026 |
| **Mobile Lead & QA Engineer** | Khổng Thị Lệ Giang | *(Đã ký)* | 14/11/2026 |
| **Đại diện Stakeholder / PO** | Cửa hàng Liêng Mobile | *(Đã ký)* | 14/11/2026 |
