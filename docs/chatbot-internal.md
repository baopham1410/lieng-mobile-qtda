# Kế hoạch: Bot chat nội bộ — Admin Lieng Mobile

> Cập nhật: **03/08/2026**  
> **Ưu tiên sản phẩm:** Admin cửa hàng điện thoại (POS / IMEI / kho / thu chi / BH) — **không** làm theo module Quán.  
> Phạm vi: **bot trong** (nhân viên / quản lý đã login). Bot khách (ngoài) làm sau.  
> Kiến trúc: **RAG + Ollama (Qwen2.5) + ChromaDB** + Laravel tool đọc API Admin.

---

## 0. Đổi hướng

| Trước (Quán) | Nay (Admin Lieng) |
|--------------|-------------------|
| Thu/chi quán, sao kê, giá nhập quán | Dashboard, POS, đơn, IMEI, nhập kho, finance, BH |
| Role `quan_manager` / `quan_staff` | Role `admin`, `sales_staff`, `warehouse_staff` |
| API `/quan/*` | API `/reports/*`, `/pos/*`, `/orders`, `/stock-imports`, `/transactions`, `/warranties`… |
| Trang `/quan/assistant` | Trang **`/tools/assistant`** trong admin shell |

Module Quán vẫn còn trong code nhưng **không nằm trong roadmap bot** giai đoạn này.

---

## 1. Mục tiêu MVP

Bot trong admin trả lời tiếng Việt cho user đã đăng nhập:

| Nhóm câu hỏi | Ví dụ | Nguồn |
|--------------|--------|--------|
| **Số liệu sống** | “Hôm nay doanh thu?” “Có bao nhiêu máy tồn?” “Đơn pending?” | Tool → API Laravel |
| **Cách dùng hệ thống** | “Làm sao nhập kho IMEI?” “POS thanh toán mixed thế nào?” | KB nội bộ (RAG) |
| **Nghiệp vụ cửa hàng** | “Quy trình bảo hành?” “Ai được xem thu chi?” | KB + `roles-permissions.md` |

**Không làm trong MVP:** Zalo/Messenger, bot khách, Quán costs/statements, fine-tune, Expo.

---

## 2. Người dùng & quyền

| Role | Dùng bot? | Số liệu được hỏi (MVP) |
|------|-----------|-------------------------|
| `admin` | Có | Dashboard, doanh thu, tồn, thu chi, đơn, nhập kho |
| `sales_staff` | Có | POS / đơn / khách / BH (theo permission); **không** finance chi tiết |
| `warehouse_staff` | Có | Nhập kho / IMEI / tồn; **không** POS checkout sâu / thu chi |
| `quan_*` | Không (phase này) | — |

Permission mới: **`assistant.use`**  
- Gắn: `admin`, `sales_staff`, `warehouse_staff`  
- Tool nào gọi được = giao cắt với permission hiện có (`finance.view`, `finance.reports`, `orders.view`, …)

---

## 3. Kiến trúc (MVP)

```
[Vue Admin] /tools/assistant
        │  POST /api/v1/assistant/chat  (Sanctum)
        ▼
[Laravel] AssistantController
        │  auth + permission:assistant.use + rate limit
        ▼
[assistant-service]  Python FastAPI :8090
        ├─ Ollama: qwen2.5:7b-instruct-q4_K_M + nomic-embed-text
        ├─ ChromaDB: collection `kb_admin`
        └─ Tools (gọi Laravel, forward user token):
              • GET /reports/dashboard
              • GET /reports/revenue   (cần finance.reports)
              • GET /reports/inventory
              • GET /orders?…         (cần orders.view)
              • GET /stock-imports/stats
              • GET /transactions?…   (cần finance.view)
              • GET /warranties/lookup/{imei}  (cần warranty.view)
        ▼
{ answer, sources[], tools_used[], session_id }
```

Máy bạn: **RTX 3060 6GB + ~15GB RAM** — ổn với Qwen 7B Q4. **Ollama chưa cài** → checklist §4.

---

## 4. Việc cần CHUẨN BỊ

### 4.1 Phần mềm & máy

- [ ] Cài [Ollama](https://ollama.com/download) (Windows)
- [ ] `ollama pull qwen2.5:7b-instruct-q4_K_M` *(máy yếu: `qwen2.5:3b`)*
- [ ] `ollama pull nomic-embed-text`
- [ ] Thử: `ollama run qwen2.5:7b-instruct-q4_K_M` trả lời tiếng Việt
- [ ] Python 3.11+ + venv cho `assistant-service/`

### 4.2 Knowledge base Admin (`data/assistant-kb/admin/`)

| File | Nội dung |
|------|----------|
| `01-pos-ban-hang.md` | POS, chọn máy/IMEI, TM/CK/mixed, PayOS |
| `02-nhap-kho-imei.md` | Phiếu nhập, xác nhận, quản lý IMEI |
| `03-san-pham-danh-muc.md` | Products, categories, giá nhập/bán |
| `04-don-hang-khach.md` | Orders, khách hàng |
| `05-thu-chi-bao-cao.md` | Finance, dashboard, báo cáo doanh thu/tồn |
| `06-bao-hanh.md` | Tra IMEI, phiếu sửa |
| `07-phan-quyen.md` | Role admin / sales / kho (rút `roles-permissions.md`) |
| `08-chay-he-thong.md` | Chạy backend + frontend local |

Quy tắc: bước 1–2–3, ghi path UI thật (`/pos`, `/inventory/imports`, `/finance`, `/reports`…).

### 4.3 Chốt trước khi code

- [ ] URL: **`/tools/assistant`** (đề xuất)
- [ ] MVP ngôn ngữ: **chỉ VI**
- [ ] Ai dùng: **admin + sales + kho** (tool theo permission)
- [ ] Lưu lịch sử: **DB** (`assistant_sessions` / `assistant_messages`)

---

## 5. Milestone code

### A — RAG local (1–2 ngày)

1. Ollama + models  
2. `assistant-service/`: `/health`, `/ingest`, `/query` (RAG, chưa tool)  
3. Ingest `data/assistant-kb/admin/`

**Done:** hỏi “Nhập kho IMEI ở đâu?” → đúng theo KB.

### B — Laravel + UI Admin (2–3 ngày)

1. Migration sessions/messages  
2. Permission `assistant.use` + seeder  
3. `AssistantController` proxy FastAPI  
4. Vue chat + nav “Trợ lý”  
5. Rate limit

**Done:** login `admin@…` chat trong web.

### C — Tool số liệu Admin (2–4 ngày)

Tools tối thiểu:

| Tool | API | Ai được |
|------|-----|---------|
| `get_dashboard` | `/reports/dashboard` | admin (+ sales view nhẹ nếu API cho) |
| `get_revenue` | `/reports/revenue` | `finance.reports` |
| `get_inventory_report` | `/reports/inventory` | warehouse / admin |
| `get_orders_summary` | `/orders` | `orders.view` |
| `get_stock_import_stats` | `/stock-imports/stats` | kho / admin |
| `lookup_warranty` | `/warranties/lookup/{imei}` | `warranty.view` |

**Done:** “Doanh thu hôm nay?” khớp dashboard/reports.

### D — Cứng hoá

- Audit log, nút đồng bộ KB, chặn vượt quyền, (sau) bot khách / Quán nếu cần lại  

---

## 6. API & schema (giữ nguyên ý)

```
POST /api/v1/assistant/chat
GET  /api/v1/assistant/sessions
GET  /api/v1/assistant/sessions/{id}
```

Bảng: `assistant_sessions`, `assistant_messages` (sources_json, tools_json).

FastAPI: `POST /ingest`, `POST /query` với `collection: kb_admin` + `context.permissions`.

---

## 7. Prompt hệ thống (Admin)

- Trợ lý nội bộ **Lieng Mobile Admin** (cửa hàng điện thoại).  
- Số tiền / tồn / đơn: **chỉ từ tool**, không bịa.  
- Tôn trọng permission user.  
- Không trả lời nghiệp vụ **Quán** trong phase này (nếu hỏi → “module Quán chưa hỗ trợ trên trợ lý này”).  
- Hướng dẫn UI: nêu đúng route admin.

---

## 8. Rủi ro

| Rủi ro | Giảm |
|--------|------|
| Bịa doanh thu | Bắt buộc tool; không suy diễn số |
| Staff xem finance | Check `finance.view` / `finance.reports` trước tool |
| VRAM 6GB | Q4; một model chat tại một thời điểm |
| Service down | Message rõ: bật Ollama + assistant-service |

---

## 9. Checklist làm ngay

1. Cài Ollama + 2 model  
2. Soạn KB trong `data/assistant-kb/admin/` (bắt đầu 01, 02, 05, 07)  
3. Chốt quyền/URL như §4.3  

→ Báo lại để bắt **Milestone A** (Admin, không Quán).

---

## 10. Tái dùng API sẵn có

| API | Tool bot |
|-----|----------|
| `GET /reports/dashboard` | Tổng quan ngày |
| `GET /reports/revenue` | Doanh thu kỳ |
| `GET /reports/inventory` | Tồn kho |
| `GET /orders` | Đơn hàng |
| `GET /stock-imports`, `/stock-imports/stats` | Nhập kho |
| `GET /transactions` | Thu chi |
| `GET /warranties/lookup/{imei}` | BH theo IMEI |
| Docs architecture / roles / README | Seed KB |

---

## 11. Ngoài phạm vi phase này

- Toàn bộ roadmap **Quán** / Expo Quán / giá nhập quán  
- Bot khách, Zalo OA  
- FAISS / fine-tune  

---

Khi xong chuẩn bị §4, bắt đầu **Milestone A** cho **Admin Lieng**.
