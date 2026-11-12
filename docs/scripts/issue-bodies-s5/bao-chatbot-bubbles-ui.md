## Mục tiêu
Giao diện **2 bóng chat** (UI-first, chưa gắn RAG/Ollama).

## Phạm vi đã làm
1. **Bot ngoài** — khách trên landing (`IntroLayout`), tư vấn demo
2. **Bot trong** — NV trên `AdminLayout`, trợ lý POS/kho/BH demo
3. Component `ChatBubbleWidget` + `chatbotMock.js`
4. Teleport `body`, ẩn FAB khi panel mở (không đè bảng Thẩm định)

## Việc tiếp theo
- [ ] Bot trong: RAG + Ollama theo `docs/chatbot-internal.md`
- [ ] Bot ngoài: KB sản phẩm / hotline / thu cũ
- [ ] Lưu session chat (DB)

## Commit
`feat(chat): add public and internal floating chat bubbles`

## DoD UI
- [x] Bóng chat góc phải dưới trên `/` và admin
- [x] Gửi tin + gợi ý nhanh + trả lời mock
- [ ] AI thật chưa (đúng scope UI-first)
