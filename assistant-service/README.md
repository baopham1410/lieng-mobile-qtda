# Assistant Service — RAG Lieng Mobile

FastAPI local: ingest KB Markdown → embed (`nomic-embed-text`) → query + Qwen (Ollama).

## Chạy

```powershell
cd assistant-service
.\.venv\Scripts\Activate.ps1

# Bắt buộc Ollama đang chạy + 2 model đã pull
# Nếu GPU CUDA lỗi: set OLLAMA_LLM_LIBRARY=cpu_avx2 rồi restart ollama serve

uvicorn app.main:app --host 127.0.0.1 --port 8090
```

## API

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/health` | Kiểm tra service + Ollama |
| POST | `/ingest` | `{"collection":"kb_admin"}` hoặc `kb_public` |
| POST | `/ingest/all` | Nạp cả 2 KB |
| POST | `/query` | `{"collection":"kb_admin","question":"..."}` |

## KB nguồn

- `../data/assistant-kb/admin/` → collection `kb_admin`
- `../data/assistant-kb/public/` → collection `kb_public`

Vector store: `assistant-service/data/vectorstore/*.json`
