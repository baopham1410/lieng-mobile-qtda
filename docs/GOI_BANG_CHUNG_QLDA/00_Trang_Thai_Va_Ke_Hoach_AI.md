# BÁO CÁO TỔNG KẾT TRẠNG THÁI HỆ THỐNG & DỊCH VỤ AI — LIÊNG MOBILE

**Đề tài chuyên ngành song hành:** Hệ thống AI hỗ trợ thẩm định và định giá thu mua điện thoại cũ kết hợp Nền tảng Quản trị Chuỗi Cửa hàng Liêng Mobile  
**Nhóm thực hiện (Tỷ lệ đóng góp chia đều 100%):**  
- **Phạm Quốc Bảo** (`baopham1410`) — Technical Lead / System Architect & Backend/AI Lead (33.3%)  
- **Nguyễn Thị Hồng** (`Chimsedinang605`) — Project Manager / Scrum Master & Frontend Lead (33.3%)  
- **Khổng Thị Lệ Giang** (`ktlgiang`) — Mobile Lead / UI/UX Designer & QA Test Engineer (33.4%)  

---

## 1. Bảng đối chiếu hiện trạng hoàn thành 100% các phân hệ

| STT | Phân hệ / Hạng mục kỹ thuật | Trạng thái | Bằng chứng thực tế (Evidence) |
|:---:|---|:---:|---|
| **1** | **Monorepo & Backend API (Laravel 9 + Sanctum + Neon PostgreSQL):** Quản lý danh mục, biến thể, tồn kho IMEI 15 số, phân quyền RBAC 5 vai trò. | **ĐÃ HOÀN THÀNH** | API endpoints chuẩn RESTful, test PHPUnit pass trên CI (PR #77). |
| **2** | **Frontend Web Admin & POS (Vue 3 + Vite + Tailwind CSS):** Quầy POS bán hàng, quản lý đơn, tích hợp VietQR PayOS Webhook tự động và sổ quỹ Quán nhỏ. | **ĐÃ HOÀN THÀNH** | Giao diện chạy mượt mà, kiểm thử UAT thành công (PR #80–#85). |
| **3** | **Dịch vụ AutoGrade AI Thẩm định máy cũ (:8091):** Mô hình YOLOv8 phân loại trầy xước/nứt vỡ 6 góc chụp, OCR nhận diện pin/màn hình, công thức định giá tự động. | **ĐÃ HOÀN THÀNH** | Dịch vụ FastAPI chạy cổng 8091, thời gian thẩm định < 15 giây (Task-455, PR #140, #150). |
| **4** | **Trợ lý AI RAG nội bộ (:8090):** Vector database kết nối LLM Ollama CPU inference, hỗ trợ tra cứu chính sách bảo hành và hướng dẫn kỹ thuật. | **ĐÃ HOÀN THÀNH** | Dịch vụ Assistant chạy cổng 8090, trả lời chính xác theo tài liệu nội bộ (Task-1670, PR #164). |
| **5** | **Mobile App Expo SDK 58 Đa vai trò (B2B Showroom & B2C Khách hàng):** Chế độ nhân viên POS di động, Camera quét IMEI và Cổng Khách hàng 5 Tab B2C. | **ĐÃ HOÀN THÀNH** | Nâng cấp SDK 58, 5 Tab B2C hoàn chỉnh (Shop, Thu cũ AI +2M trợ giá, Bảo hành) (PR #166, #167, #168). |
| **6** | **Hệ sinh thái Quản trị GitHub QLDA:** GitHub Projects Kanban, 168 PRs, 3/3 jobs CI Actions xanh, Branch Protection. | **ĐÃ HOÀN THÀNH** | Bảng Projects hoàn thành 237/275 SP (86.2%), 100% PR có Peer Review. |

---

## 2. Kiến trúc giải pháp thực tế đã triển khai

```text
[Mobile App B2C / Safari]  <───>  [Cloudflare Tunnel :8085 / EAS]
         │
         ▼
[Laravel Backend API :8080] <───> [Neon PostgreSQL Serverless Cloud]
         │                              ▲
         ├───> [AutoGrade AI :8091] ────┘ (YOLOv8 + OCR + Dynamic Valuation Formula)
         │
         ├───> [Assistant RAG :8090] ───> [Ollama LLM Vector DB]
         │
         └───> [PayOS VietQR Webhook] ──> [Cổng thanh toán tự động]
```

**Công thức định giá thu cũ động (Dynamic Valuation Formula):**  
$$P_{\text{thu mua}} = P_{\text{gốc (Model, ROM)}} - C_{\text{khấu hao ngoại quan (YOLO)}} - C_{\text{linh kiện lỗi (OCR)}} + \text{Trợ giá lên đời (2.000.000 VNĐ)}$$

---

## 3. Kết luận báo cáo với Hội đồng chuyên môn
Nhóm đã hiện thực hóa trọn vẹn cả **Quy trình Quản trị Dự án Phần mềm chuẩn mực** (GitHub Ecosystem, CI/CD, Risk, Scope Change Control) lẫn **Sản phẩm phần mềm thực tế quy mô hoàn chỉnh** tích hợp công nghệ Trí tuệ nhân tạo (AI) và Ứng dụng di động đa nền tảng.
