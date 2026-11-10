from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import CHAT_MODEL, COLLECTIONS, EMBED_MODEL, KB_ROOT
from .ollama_client import ollama_ok
from .rag import ingest, query

app = FastAPI(
    title="Lieng Mobile Assistant Service",
    version="0.1.0",
    description="RAG local — Ollama + KB admin/public",
)


class IngestBody(BaseModel):
    collection: str = Field(..., examples=["kb_admin", "kb_public"])


class QueryBody(BaseModel):
    collection: str = Field(..., examples=["kb_admin", "kb_public"])
    question: str
    top_k: int = 4


@app.get("/health")
def health():
    return {
        "ok": True,
        "ollama": ollama_ok(),
        "chat_model": CHAT_MODEL,
        "embed_model": EMBED_MODEL,
        "kb_root": str(KB_ROOT),
        "collections": list(COLLECTIONS.keys()),
    }


@app.post("/ingest")
def ingest_endpoint(body: IngestBody):
    try:
        return ingest(body.collection)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e)) from e
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        raise HTTPException(500, f"Ingest failed: {e}") from e


@app.post("/ingest/all")
def ingest_all():
    results = []
    for name in COLLECTIONS:
        results.append(ingest(name))
    return {"results": results}


@app.post("/query")
def query_endpoint(body: QueryBody):
    try:
        return query(body.collection, body.question.strip(), body.top_k)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e)) from e
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        raise HTTPException(500, f"Query failed: {e}") from e
