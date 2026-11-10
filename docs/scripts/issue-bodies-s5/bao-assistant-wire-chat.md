## Mục tiêu
Nối 2 bóng chat Vue → Laravel → assistant-service (thay mock khi AI sẵn sàng).

## Phạm vi
1. Laravel `AssistantController` + routes public/internal
2. `ASSISTANT_SERVICE_URL` config
3. Frontend `api/assistant.js` + `ChatBubbleWidget` timeout 120s, fallback mock

## DoD
- [x] `POST /api/v1/assistant/public-chat`
- [x] `POST /api/v1/assistant/chat` (auth)
- [x] Bóng chat gọi RAG khi :8090 + Ollama chạy
