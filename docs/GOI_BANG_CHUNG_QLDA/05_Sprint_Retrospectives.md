# BIÊN BẢN HỌP CẢI TIẾN SPRINT (SPRINT RETROSPECTIVES) — LIÊNG MOBILE QLDA

Học phần Quản trị Dự án Phần mềm (VKU) quy định rõ ràng việc tổ chức các cuộc họp cải tiến (Retrospective) sau mỗi Sprint để đúc rút bài học kinh nghiệm và tối ưu hóa quy trình làm việc nhóm.

---

## Phần A: Sprint 1 Retrospective (Mô hình 4Ls: Liked - Learned - Lacked - Longed For)

- **Thời gian thực hiện:** Cuối Sprint 1 (Giai đoạn hoàn thành Scaffold, Backend API & Frontend Foundation)
- **Thành phần tham dự:** Phạm Quốc Bảo, Nguyễn Thị Hồng, Khổng Thị Lệ Giang
- **Hình thức họp:** Họp trực tuyến kết hợp ghi nhận biên bản hành động

### 1. Liked (Những điều nhóm hài lòng):
- Cấu trúc kiến trúc Monorepo phân tách rành mạch (`backend/`, `frontend/`, `mobile-expo/`, `autograde-service/`).
- Module xác thực Sanctum hoạt động mượt mà ngay từ giai đoạn đầu.
- Việc phân rã WBS và User Stories gán vào GitHub Milestones giúp mỗi thành viên nắm rõ phần việc của mình.

### 2. Learned (Những bài học nhóm nhận ra):
- Một Pull Request gộp quá nhiều màn hình giao diện (PR Frontend ban đầu) sẽ vi phạm nguyên tắc "Mỗi PR một mục tiêu", gây khó khăn cho việc kiểm duyệt và dễ phát sinh xung đột.
- Kho lưu trữ Private ở gói miễn phí không hỗ trợ tính năng Branch Protection, cần chuyển sang chế độ Public để kích hoạt kiểm soát nhánh `main`.

### 3. Lacked (Những điều nhóm còn thiếu sót):
- Chưa có đường ống tự động hóa kiểm thử mã nguồn (GitHub Actions CI) ngay từ ngày đầu.
- Việc kiểm duyệt chéo (Peer Review) giữa các thành viên ban đầu còn mang tính hình thức.

### 4. Longed For (Những mong muốn trong các Sprint tiếp theo):
- Trực quan hóa toàn bộ trạng thái công việc lên bảng **GitHub Projects Kanban Board**.
- Có bộ tiêu chuẩn nghiệm thu (Definition of Done) đính kèm sẵn trong PR template để kiểm tra tự động.

### 5. Kế hoạch hành động cụ thể sau Sprint 1 (Action Items):
1. **Ban hành CR-001:** Tinh gọn PR Frontend Foundation chỉ giữ khung kiến trúc, tách từng màn hình thành các Issue độc lập.
2. **Kích hoạt CR-003:** Chuyển repo sang Public, bật Branch Protection bắt buộc 1 Reviewer và CI pass.
3. **Thiết lập GitHub Actions CI:** Tự động kiểm tra Backend test, Frontend build và Mobile typecheck.

---

## Phần B: Final Retrospective — Sprint 5 (Mô hình Cánh buồm: Sailboat Retrospective)

- **Thời gian thực hiện:** Sau khi hoàn thành toàn bộ 5 Sprint (Tích hợp AI AutoGrade, Chatbot RAG, Mobile B2C PR #168)
- **Thành phần tham dự:** Phạm Quốc Bảo, Nguyễn Thị Hồng, Khổng Thị Lệ Giang
- **Hình thức họp:** Họp trực tiếp tổng kết đồ án

```text
                  ▲  [WIND - Động lực đẩy thuyền]
                  │  (Kanban Projects, Tái phân bổ chuyên môn, CI/CD tự động)
           ┌──────┴──────┐
       ====│  LIÊNG 2026 │====>  [ISLAND - Đích đến: Nghiệm thu xuất sắc VKU]
           └──────┬──────┘
                  │  [ANCHOR - Mỏ neo cản trở]
                  ▼  (Lệch SDK 58, AP Isolation Wi-Fi cafe, Xung đột package)
       ──────────────────────────────────────────────────
       [ROCKS - Bãi đá rủi ro]: Scope Creep, Chênh lệch kiến thức AI
```

### 1. Wind (Động lực đẩy dự án tiến nhanh):
- **Phân công chuyên môn hóa 3 thành viên (CR-002):** Khổng Thị Lệ Giang phụ trách chuyên sâu mảng Mobile Stitch UI/UX và QA Testing; Nguyễn Thị Hồng làm chủ quầy POS, phân hệ Quán và tiến độ Sprint; Phạm Quốc Bảo tối ưu Core Backend API và mô hình AI. Sự phân định này giúp vận tốc nhóm ở Sprint 5 đạt đỉnh **73 Story Points**.
- **Kỷ luật mã nguồn:** GitHub Actions CI 3 jobs giúp phát hiện tức thì các lỗi cú pháp và lệch kiểu dữ liệu TypeScript trước khi nhập vào nhánh chính.
- **Dòng chảy Kanban mượt mà:** 168 PRs đều liên kết chặt chẽ với các Issues có tiêu chí Acceptance Criteria rõ ràng.

### 2. Anchor (Những chiếc mỏ neo cản trở tiến độ):
- Sự cố nâng cấp Expo SDK 58 trên iOS gây lỗi kiểu dữ liệu `StyleSheet.absoluteFillObject` trong `ScannerModal.tsx`.
- Sự cố mạng Wi-Fi quán cafe bật AP Isolation chặn kết nối mạng cục bộ giữa điện thoại và máy tính trong quá trình thử nghiệm.

### 3. Rocks (Các rủi ro kỹ thuật và quản lý đã vượt qua):
- **Nguy cơ phình to phạm vi (Scope Creep):** Đã kiểm soát thành công bằng Hội đồng CCB qua 5 phiếu thay đổi chính thức.
- **Rủi ro mạng demo:** Đã hóa giải hoàn toàn bằng giải pháp Cloudflare Tunnel và Expo EAS Cloud Tunnel, cho phép truy cập hệ thống mọi lúc mọi nơi qua Internet.

### 4. Island (Đích đến & Thành tựu đạt được):
- Hệ thống hoàn thành 100% các cam kết: Web Admin POS, Phân hệ Quán, Dịch vụ AutoGrade AI (:8091), Chatbot RAG (:8090) và App Mobile Khách hàng 5 Tab B2C (PR #168).
- Đạt **237 / 275 Story Points (86.2%)** trên toàn bộ Backlog dự án.
- Hoàn tất Gói bằng chứng QLDA 8 hạng mục và được Stakeholder ký nghiệm thu toàn phần.

---

### Chữ ký xác nhận Biên bản Retrospective

| Technical Lead | Project Manager / Scrum Master | Mobile Lead & QA Engineer |
|:---:|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br><br>**Phạm Quốc Bảo** | <br><br>**Nguyễn Thị Hồng** | <br><br>**Khổng Thị Lệ Giang** |
| Ngày: 14/11/2026 | Ngày: 14/11/2026 | Ngày: 14/11/2026 |
