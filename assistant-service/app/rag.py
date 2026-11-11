from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

from .config import CHUNK_OVERLAP, CHUNK_SIZE, COLLECTIONS, STORE_DIR, TOP_K
from .intents import build_blocks, detect_intent
from .ollama_client import chat, embed


@dataclass
class Chunk:
    id: str
    collection: str
    source: str
    text: str


SYSTEM_ADMIN = """Trợ lý nội bộ Lieng Mobile Admin.
Chỉ dựa ngữ cảnh KB. Tiếng Việt, tối đa 3–5 câu.
Nêu path menu nếu có. Không bịa số tồn/doanh thu. Không trả lời module Quán."""

SYSTEM_PUBLIC = """Trợ lý khách Lieng Mobile.
Chỉ dựa ngữ cảnh KB. Tiếng Việt, thân thiện, tối đa 3–5 câu.
Không tiết lộ nội bộ. Giá/máy cụ thể: khuyên gọi hotline."""

def _chunk_text(text: str, source: str, collection: str) -> list[Chunk]:
    text = re.sub(r"\r\n?", "\n", text).strip()
    if not text:
        return []
    parts: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + CHUNK_SIZE)
        parts.append(text[start:end])
        if end >= len(text):
            break
        start = max(0, end - CHUNK_OVERLAP)
    chunks = []
    for i, p in enumerate(parts):
        chunks.append(
            Chunk(
                id=f"{collection}:{Path(source).stem}:{i}",
                collection=collection,
                source=source,
                text=p,
            )
        )
    return chunks


def load_markdown_chunks(collection: str) -> list[Chunk]:
    folder = COLLECTIONS[collection]
    if not folder.exists():
        raise FileNotFoundError(f"KB folder missing: {folder}")
    chunks: list[Chunk] = []
    for path in sorted(folder.glob("*.md")):
        chunks.extend(_chunk_text(path.read_text(encoding="utf-8"), path.name, collection))
    return chunks


def _store_path(collection: str) -> Path:
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    return STORE_DIR / f"{collection}.json"


def ingest(collection: str) -> dict:
    if collection not in COLLECTIONS:
        raise ValueError(f"Unknown collection: {collection}")
    chunks = load_markdown_chunks(collection)
    if not chunks:
        raise ValueError(f"No markdown chunks in {COLLECTIONS[collection]}")

    vectors = embed([c.text for c in chunks])
    payload = {
        "collection": collection,
        "chunks": [asdict(c) for c in chunks],
        "embeddings": vectors,
    }
    path = _store_path(collection)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return {
        "collection": collection,
        "files": len({c.source for c in chunks}),
        "chunks": len(chunks),
        "store": str(path),
    }


def _load_store(collection: str) -> dict:
    path = _store_path(collection)
    if not path.exists():
        raise FileNotFoundError(f"Chưa ingest collection '{collection}'. Gọi POST /ingest trước.")
    return json.loads(path.read_text(encoding="utf-8"))


def _cosine_topk(query_vec: list[float], matrix: np.ndarray, k: int) -> list[int]:
    q = np.asarray(query_vec, dtype=np.float32)
    q = q / (np.linalg.norm(q) + 1e-9)
    m = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-9)
    scores = m @ q
    k = min(k, len(scores))
    return np.argsort(-scores)[:k].tolist()


def query(collection: str, question: str, top_k: int = TOP_K) -> dict:
    if collection not in COLLECTIONS:
        raise ValueError(f"Unknown collection: {collection}")
    intent = detect_intent(collection, question)
    blocks = build_blocks(collection, intent)

    store = _load_store(collection)
    chunks = store["chunks"]
    matrix = np.asarray(store["embeddings"], dtype=np.float32)
    qvec = embed([question])[0]
    k = min(top_k, 3)
    idxs = _cosine_topk(qvec, matrix, k)
    sources = []
    context_parts = []
    for i in idxs:
        ch = chunks[i]
        sources.append({"source": ch["source"], "id": ch["id"]})
        context_parts.append(f"[{ch['source']}]\n{ch['text']}")

    context = "\n\n---\n\n".join(context_parts)
    system = SYSTEM_ADMIN if collection == "kb_admin" else SYSTEM_PUBLIC
    user = f"Ngữ cảnh KB:\n{context}\n\nCâu hỏi: {question}\n\nTrả lời ngắn; UI sẽ hiện nút/bảng riêng."
    answer = chat(system, user)
    return {
        "answer": answer.strip(),
        "intent": intent,
        "blocks": blocks,
        "sources": sources,
        "collection": collection,
        "model": "qwen2.5:7b-instruct-q4_K_M",
    }
