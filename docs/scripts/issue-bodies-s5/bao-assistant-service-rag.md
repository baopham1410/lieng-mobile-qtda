## Mục tiêu
Scaffold **assistant-service** (FastAPI): ingest KB → embed Ollama → query Qwen (RAG local).

## Phạm vi
1. `assistant-service/` FastAPI `:8090`
2. API: `/health`, `/ingest`, `/ingest/all`, `/query`
3. Collections: `kb_admin`, `kb_public`
4. Vector store JSON (không bắt buộc Chroma trên Windows)

## DoD
- [x] Ingest 2 KB
- [x] Query thử “Nhập kho IMEI?” / “Hotline?” đúng KB
