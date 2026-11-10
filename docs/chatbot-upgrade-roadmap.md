# Bảng nâng cấp Chatbot Lieng Mobile

> Mục tiêu: từ chat text chậm / khó dùng → trợ lý **nhanh, có thẻ hành động, dẫn đúng màn hình**.  
> Trạng thái hiện tại: RAG + Ollama (CPU) → trả lời Markdown thuần, ~20–40s/câu.

---

## 1. Vì sao đang “chậm & chưa tiện”

| Vấn đề | Nguyên nhân | Hướng xử lý |
|--------|-------------|-------------|
| Chậm 20–40s | Qwen 7B chạy **CPU** (CUDA lỗi driver) | Cập nhật NVIDIA driver → GPU; hoặc model nhỏ hơn (`3b`) cho FAQ |
| Chỉ chữ dài | Bubble chỉ render text | **Rich message**: card, bảng, nút deep-link |
| Không dẫn vào app | Bot chưa biết route + không emit action | Trả JSON actions → Vue mở `/products`, `/inventory`… |
| Không biết “hết hàng” | RAG chỉ đọc file md, chưa tool API | Tool `get_inventory` / `list_out_of_stock` |
| Không nhớ ngữ cảnh | Mỗi câu độc lập | Session + history (đã có plan DB) |

---

## 2. Nguyên tắc UX chatbot “chuyên gia” (áp dụng Lieng)

1. **Trả lời ngắn + khối dữ liệu** — 1–2 câu tóm tắt, phần chi tiết là card/bảng.  
2. **Một câu hỏi → một hành động chính** — luôn có CTA rõ (Xem tồn / Mở POS / Gọi hotline).  
3. **Deep-link vào đúng màn** — không chỉ nói “vào menu Kho”, mà nút **Mở Nhập kho**.  
4. **Số liệu chỉ từ tool** — không bịa tồn/doanh thu từ model.  
5. **Phân tách bot ngoài / trong** — khách không thấy tồn nội bộ; NV mới thấy hết hàng + IMEI.  
6. **Loading có ích** — skeleton / “Đang tra kho…” thay vì im lặng 30s.  
7. **Gợi ý tiếp theo** — chips câu hỏi follow-up sau mỗi câu trả lời.

---

## 3. Bảng: Hỏi gì → Hiện gì → Chức năng phục vụ

### A. Bot ngoài (khách trên website)

| Ý định khách (intent) | Hiển thị tốt nhất | Dữ liệu / nguồn | Chức năng / nút |
|----------------------|-------------------|-----------------|-----------------|
| Giờ / địa chỉ / hotline | Card liên hệ + bản đồ ngắn | KB public | **Gọi ngay** (`tel:`), **Zalo**, copy SĐT |
| Bảo hành thế nào | Checklist 3 bước + lưu ý | KB public | **Đến cửa hàng**, **Gọi hotline** |
| Thu cũ đổi mới | Card quy trình + lưu ý giá | KB public | **Xem thẩm định** (intro), **Gọi tư vấn** |
| Máy / giá / còn hàng? | *Không chốt tồn nội bộ* — gợi ý xem SP + gọi NV | Catalog public (nếu có) | **Xem sản phẩm**, **Gọi giữ máy** |
| FAQ chung | Bullet ngắn + chip hỏi tiếp | KB public | Chip: BH / thu cũ / giờ mở cửa |

### B. Bot trong (NV Admin)

| Ý định NV (intent) | Hiển thị tốt nhất | Dữ liệu / nguồn | Chức năng / nút |
|--------------------|-------------------|-----------------|-----------------|
| Cách dùng POS / IMEI / BH | Bước 1–2–3 + path | KB admin (RAG) | **Mở /pos**, **/inventory/imports**, **/warranty** |
| SP nào **hết hàng** / tồn thấp | **Bảng** tên – SKU – tồn – mức | API inventory | **Mở sản phẩm**, **Tạo phiếu nhập** |
| Doanh thu hôm nay / đơn pending | Stat cards số liệu | API reports/orders | **Mở Dashboard**, **Mở Đơn hàng** |
| Tra IMEI / BH | Card máy + hạn BH | API warranty lookup | **Mở Bảo hành**, copy IMEI |
| Thu cũ / thẩm định | Tóm tắt quy trình AutoGrade | KB + link | **Mở /appraisal** |
| Quyền ai làm gì | Bảng role × module | KB phân quyền | — (chỉ đọc) |
| Khách vừa gọi hotline | Gợi ý mở quầy tư vấn | Consult desk | **Mở /consult**, **Tiếp nhận** |

---

## 4. Kiểu tin nhắn (message types) nên có

| Loại | Khi nào dùng | Ví dụ UI |
|------|--------------|----------|
| `text` | Giải thích ngắn | Đoạn 1–3 câu |
| `steps` | Hướng dẫn thao tác | 1. 2. 3. có số thứ tự |
| `table` | Danh sách SP hết / đơn | Cột: Tên, Tồn, Trạng thái |
| `product_cards` | Gợi ý máy / hết hàng | Ảnh nhỏ + tên + badge Hết |
| `stats` | Doanh thu / tồn tổng | 2–4 ô số |
| `actions` | Deep-link | Nút primary/secondary |
| `chips` | Follow-up | “Xem tồn thấp?”, “Mở POS?” |
| `contact` | Bot ngoài | tel / Zalo |
| `error` / `loading` | Service chậm / lỗi | “Đang tra kho… (GPU/CPU)” |

**Payload gợi ý (JSON từ service):**

```json
{
  "answer": "Có 3 mẫu tồn = 0 trong kho.",
  "blocks": [
    { "type": "table", "columns": ["Sản phẩm", "Tồn"], "rows": [["iPhone 15 128GB", "0"], ["S24 Ultra", "0"]] },
    { "type": "actions", "items": [
      { "label": "Mở Sản phẩm", "to": "/products?stock=0" },
      { "label": "Tạo nhập kho", "to": "/inventory/imports" }
    ]},
    { "type": "chips", "items": ["Tồn dưới 5 máy?", "Nhập kho IMEI thế nào?"] }
  ],
  "sources": [{ "source": "tool:inventory" }]
}
```

---

## 5. Roadmap nâng cấp (ưu tiên)

### Phase 1 — UX nhanh (1–2 ngày) — **nên làm sớm**
- [ ] Cập nhật driver NVIDIA / ép GPU; hoặc thêm model `qwen2.5:3b` cho FAQ nhanh  
- [x] Loading state rõ: “Đang tìm trong KB…”, “Đang hỏi model…” / “Đang tra kho…”  
- [x] Nút deep-link cứng từ intent đơn giản (regex/keyword → `/pos`, `/warranty`…)  
- [x] Chip follow-up sau mỗi câu trả lời  
- [x] Rút ngắn system prompt + `top_k=3` để giảm latency  

### Phase 2 — Rich UI (2–4 ngày)
- [x] Parser `blocks` trong `ChatBubbleWidget` (table, actions, chips)  
- [x] Service trả structured JSON ngoài `answer` text  
- [x] Bot ngoài: card hotline / Gọi ngay / Zalo  
- [ ] Copy SĐT / IMEI một chạm  

### Phase 3 — Tool số liệu (3–5 ngày) — đúng nhu cầu “SP hết hàng”
- [x] Tool `list_low_stock` / `list_out_of_stock` → Laravel inventory (fast-path, bỏ Ollama)  
- [ ] Tool `get_dashboard` / `get_orders_summary` (theo permission)  
- [ ] Tool `lookup_warranty(imei)`  
- [x] Intent classifier nhẹ (keyword) chọn RAG vs Tool  

### Phase 4 — Trải nghiệm “pro”
- [ ] Lưu session/history DB  
- [ ] Streaming token (SSE) — chữ hiện dần, cảm giác nhanh hơn  
- [ ] Voice input (tuỳ chọn) cho quầy  
- [ ] Analytics: câu hỏi hay gặp → bổ sung KB  
- [ ] Guardrail: chặn bot ngoài hỏi doanh thu/tồn nội bộ  

---

## 6. Ví dụ kịch bản “SP đã hết” (mục tiêu sau Phase 3)

**NV hỏi:** “Sản phẩm nào hết hàng?”

**Bot hiển thị:**
1. Text: “Hiện có **3** biến thể tồn = 0.”  
2. **Bảng** danh sách (tên, mã, tồn).  
3. Nút: **Mở danh sách SP** | **Tạo phiếu nhập**.  
4. Chip: “Tồn dưới 5?”, “Cách nhập IMEI?”.

Không chỉ một đoạn văn dài.

---

## 7. Tiêu chí Done khi “tiện cho người dùng”

| Tiêu chí | Mục tiêu |
|----------|----------|
| Latency FAQ | &lt; 5s (GPU) hoặc &lt; 8s (3B CPU) |
| Mọi câu hướng dẫn | ≥ 1 nút deep-link hữu ích |
| Câu số liệu | Có bảng/stat, không chỉ chữ |
| Bot ngoài | Luôn có Gọi/Zalo khi liên hệ |
| Lỗi service | Message rõ + fallback, không treo |

---

## 8. Liên quan code hiện có

- UI bubbles: `frontend/src/components/chat/ChatBubbleWidget.vue`  
- API: `frontend/src/api/assistant.js` → Laravel → `assistant-service`  
- KB: `data/assistant-kb/{admin,public}/`  
- Kế hoạch gốc: `docs/chatbot-internal.md`  

---

*Tài liệu dùng để trình bày GV / backlog sprint chatbot.*
