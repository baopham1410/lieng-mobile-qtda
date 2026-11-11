from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # lieng-mobile-qtda/
KB_ROOT = ROOT / "data" / "assistant-kb"
STORE_DIR = Path(__file__).resolve().parents[1] / "data" / "vectorstore"

OLLAMA_BASE = "http://127.0.0.1:11434"
CHAT_MODEL = "qwen2.5:7b-instruct-q4_K_M"
EMBED_MODEL = "nomic-embed-text"

COLLECTIONS = {
    "kb_admin": KB_ROOT / "admin",
    "kb_public": KB_ROOT / "public",
}

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
TOP_K = 3
