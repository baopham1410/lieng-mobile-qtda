# Chạy hệ thống local

## Backend (Laravel)
1. Vào thư mục `backend/`.
2. `php artisan serve` (hoặc Docker Compose nếu dùng stack Docker).
3. API mặc định: Sanctum auth.

## Frontend (Vue)
1. Vào `frontend/`.
2. `npm install` (lần đầu) → `npm run dev`.
3. Đăng nhập admin → dùng POS / kho / BH.

## Mobile (Expo)
Thư mục `mobile-expo/` — app NV; LAN dev theo máy trong mạng nội bộ.

## Chatbot (kế hoạch)
- Ollama local + model Qwen + nomic-embed-text.
- `assistant-service` (FastAPI) ingest KB tại `data/assistant-kb/`.
- Bóng chat Admin gọi API thay mock.
