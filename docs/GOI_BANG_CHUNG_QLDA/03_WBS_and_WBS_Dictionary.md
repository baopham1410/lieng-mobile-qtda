# WBS & WBS DICTIONARY — LIÊNG MOBILE QLDA

Hệ thống phân rã cấu trúc công việc (Work Breakdown Structure - WBS) tuân thủ nghiêm ngặt **Quy tắc 100% (100% Rule)**: tập hợp toàn bộ các gói công việc con đại diện chính xác 100% phạm vi dự án đã cam kết trong Project Charter, không thiếu sót và không dư thừa.

---

## 1. Cây phân rã công việc WBS (100% Rule)

```text
1. Hệ thống Quản trị Liêng Mobile Platform (100%)
├── 1.1 Khởi tạo Nền tảng & Quản trị Dự án (Scaffold & Governance)
│   ├── 1.1.1 Điều lệ dự án (Project Charter) & Xác định Sourcing Pathway 1
│   ├── 1.1.2 Xây dựng Product Backlog, User Stories & Thang điểm Story Points
│   ├── 1.1.3 Thiết lập GitHub Projects Kanban Board (5 cột chuẩn)
│   └── 1.1.4 Quy chuẩn Git, Conventional Commits & Issue/PR Templates
├── 1.2 Phân hệ Dịch vụ Nền tảng Backend API & Database (Core Services)
│   ├── 1.2.1 Khởi tạo Laravel 9 + Sanctum Token Authentication
│   ├── 1.2.2 Thiết kế Database Schema Neon PostgreSQL Serverless
│   ├── 1.2.3 Xây dựng API Quản lý Danh mục, Biến thể & Tồn kho Serial/IMEI
│   ├── 1.2.4 Xây dựng API Điểm bán lẻ POS & Tích hợp PayOS Webhook
│   └── 1.2.5 Xây dựng API Phân hệ Quán nhỏ (Sổ quỹ, Chi phí, Sao kê ngày)
├── 1.3 Phân hệ Quản trị Web Admin & Bán hàng POS (Frontend Web Vue 3/Vite)
│   ├── 1.3.1 Khởi tạo Frontend Foundation Vue 3, Vite & Tailwind CSS (CR-001)
│   ├── 1.3.2 Giao diện Đăng nhập, Profile & Phân quyền giao diện theo 5 Roles
│   ├── 1.3.3 Giao diện Quản lý kho Serial/IMEI 15 số, Nhập xuất kho
│   ├── 1.3.4 Giao diện Bán lẻ POS tốc độ cao, Tạo mã VietQR PayOS động
│   ├── 1.3.5 Giao diện Quản lý Khách hàng CRM, Hạng thành viên & Lịch sử
│   └── 1.3.6 Giao diện Quản lý Quán nhỏ, Chốt ca sổ quỹ & Báo cáo tài chính
├── 1.4 Phân hệ Dịch vụ AI AutoGrade Thẩm định & Chatbot RAG (CR-004)
│   ├── 1.4.1 Xây dựng FastAPI Service AutoGrade (:8091)
│   ├── 1.4.2 Tích hợp Mô hình YOLOv8 phân loại trầy xước/nứt vỡ 6 góc chụp
│   ├── 1.4.3 Tích hợp OCR trích xuất thông số pin/màn hình và số IMEI
│   ├── 1.4.4 Động cơ định giá khấu trừ linh kiện tự động & Sinh biên bản
│   └── 1.4.5 Xây dựng Trợ lý AI RAG (:8090) kết nối LLM Ollama nội bộ
├── 1.5 Phân hệ Mobile App Expo Đa vai trò B2B & B2C (CR-005 / PR #168)
│   ├── 1.5.1 Nâng cấp Expo SDK 58, React Native 0.88 & React 19
│   ├── 1.5.2 Thiết kế Hệ thống UI Component chuẩn Google Stitch Mobile
│   ├── 1.5.3 Chế độ Nhân viên Showroom: POS di động, Quét Barcode/Camera
│   ├── 1.5.4 Phân hệ Khách hàng 5 Tab B2C: Trang chủ, Cửa hàng (Giữ máy 24h)
│   ├── 1.5.5 Phân hệ Khách hàng 5 Tab B2C: Thu cũ AI (+2M trợ giá), Bảo hành, Tôi
│   └── 1.5.6 Cấu hình Cloudflare Tunnel & Expo EAS Tunnel chạy qua Internet
└── 1.6 Kiểm thử Chất lượng, CI/CD Pipeline & Đóng gói Bằng chứng QLDA
    ├── 1.6.1 Xây dựng Ma trận kiểm thử QA Matrix & QA Test Checklist
    ├── 1.6.2 Thiết lập GitHub Actions CI (3 jobs: Backend, Frontend, Mobile)
    ├── 1.6.3 Kích hoạt Branch Protection trên main (Bắt buộc 1 Review + 3 CI)
    ├── 1.6.4 Kiểm thử chấp nhận người dùng UAT thực địa với Stakeholder
    └── 1.6.5 Đóng gói Gói bằng chứng QLDA 8 hạng mục nộp Google Drive
```

---

## 2. Từ điển WBS chi tiết (WBS Dictionary cho các gói công việc 1–2 tuần)

| Mã WBS | Tên gói công việc | Mô tả kỹ thuật chi tiết | Tiêu chí hoàn thành (Definition of Done) | Điểm SP | Người phụ trách (Owner) | Minh chứng thực tế (Evidence) |
|:---:|---|---|---|:---:|:---:|---|
| **1.1.2** | Backlog & Stories | Xây dựng 59 PBIs, gán Story Points, viết Acceptance Criteria | 100% PBIs có AC, gán Milestone và đưa lên Board | 5 SP | Hồng (`Chimsedinang605`) | `docs/product-backlog.md` |
| **1.2.1–1.2.4** | Core Backend API | Xây dựng API Auth, RBAC, IMEI Hub, POS & PayOS | Pass PHPUnit tests, API trả mã HTTP 200/201 | 8 SP | Bảo (`baopham1410`) | PR #77 |
| **1.3.1–1.3.2** | FE Foundation | Thiết lập kiến trúc Vue 3/Vite/Tailwind, xử lý CR-001 | Build thành công, layouts chuẩn, stub màn hình | 5 SP | Bảo (`baopham1410`) | PR #78, #79 |
| **1.3.3–1.3.5** | Admin POS & CRM | Giao diện bán hàng POS, Quản lý kho IMEI và CRM | Hoàn tất giỏ hàng, quét IMEI, tích hợp VietQR | 8 SP | Hồng (`Chimsedinang605`) | PR #80, #82, #83 |
| **1.3.6** | Quán & Sổ quỹ | Phân hệ bán nhanh tiện ích F&B, chốt sổ sao kê ngày | Chốt sổ ca trực, xuất biên lai sao kê PNG/PDF | 5 SP | Hồng (`Chimsedinang605`) | PR #84, #87 |
| **1.4.1–1.4.4** | AutoGrade AI (:8091) | YOLOv8 nhận diện ngoại quan 6 góc, OCR pin, tính giá | Thẩm định máy < 15s, xuất phiếu thẩm định | 8 SP | Bảo (`baopham1410`) | Task-455, PR #140, #150 |
| **1.4.5** | Assistant RAG (:8090) | Chatbot RAG Ollama kết nối tài liệu chính sách nội bộ | Trả lời chính xác 10/10 câu hỏi mẫu không ảo giác | 5 SP | Bảo (`baopham1410`) | Task-1670, PR #164 |
| **1.5.1–1.5.2** | Mobile Stitch UI | Nâng cấp Expo SDK 58, dựng Stitch UI components | Chạy mượt mà trên iOS Expo Go, typecheck pass | 5 SP | Giang (`ktlgiang`) | PR #165, #166 |
| **1.5.3** | Mobile POS & Scanner | Chế độ nhân viên, camera quét mã IMEI trực tiếp | Quét thành công IMEI qua Camera Native | 5 SP | Giang (`ktlgiang`) | PR #167 |
| **1.5.4–1.5.5** | Mobile B2C 5 Tab | App khách hàng: Shop, Thu cũ AI (+2M), Tra cứu BH | Đủ 5 tab, tính giá 4 bước, dual login mượt mà | 8 SP | Giang + Bảo + Hồng | PR #168 (PBI-56) |
| **1.6.1** | QA Matrix & Checklist | Xây dựng bộ kịch bản kiểm thử, QA Checklist | Tài liệu QA chi tiết, 100% test cases verified | 5 SP | Giang (`ktlgiang`) | `docs/qa-test-checklist.md` |
| **1.6.2–1.6.3** | CI/CD & Protection | GitHub Actions 3 jobs, bắt buộc review và branch protect | 3 jobs CI xanh, chặn 100% push trái phép | 5 SP | Bảo (`baopham1410`) | PR #90, #91 |
| **1.6.4** | UAT Stakeholder | Thực địa kiểm thử cùng Chủ cửa hàng Liêng Mobile | Biên bản nghiệm thu Accepted có đủ chữ ký | 3 SP | Hồng + Bảo + Giang | `07_Stakeholder_Acceptance_Signoff.md` |
| **1.6.5** | Gói bằng chứng QLDA | Soạn thảo trọn bộ 8 Deliverables nộp Google Drive | 8 file đúng chuẩn, mở quyền Anyone with link | 5 SP | Cả nhóm 3 thành viên | Thư mục `GOI_BANG_CHUNG_QLDA/` |
