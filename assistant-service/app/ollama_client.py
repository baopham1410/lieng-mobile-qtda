from __future__ import annotations

import os

import httpx

from .config import CHAT_MODEL, EMBED_MODEL, OLLAMA_BASE


def _client() -> httpx.Client:
    return httpx.Client(base_url=OLLAMA_BASE, timeout=180.0)


def ollama_ok() -> bool:
    try:
        with _client() as c:
            r = c.get("/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def embed(texts: list[str]) -> list[list[float]]:
    """Embed via Ollama /api/embeddings (one text at a time for compatibility)."""
    vectors: list[list[float]] = []
    with _client() as c:
        for text in texts:
            r = c.post(
                "/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": text},
            )
            r.raise_for_status()
            vectors.append(r.json()["embedding"])
    return vectors


def chat(system: str, user: str) -> str:
    """Non-stream chat completion."""
    # Prefer CPU if GPU CUDA broken on this machine
    headers = {}
    if os.environ.get("OLLAMA_LLM_LIBRARY"):
        headers["X-Unused"] = "1"  # env already on server process

    with _client() as c:
        r = c.post(
            "/api/chat",
            json={
                "model": CHAT_MODEL,
                "stream": False,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "options": {"temperature": 0.2},
            },
        )
        r.raise_for_status()
        data = r.json()
        return (data.get("message") or {}).get("content") or data.get("response") or ""
