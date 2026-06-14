import os
import hashlib
import asyncio
import math
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PointIdsList
from fastembed import TextEmbedding
import feedparser

RSS_SOURCES = [
    {"url": "https://techcrunch.com/category/artificial-intelligence/feed/", "name": "TechCrunch"},
    {"url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", "name": "The Verge"},
    {"url": "https://venturebeat.com/category/ai/feed/", "name": "VentureBeat"},
    {"url": "https://www.wired.com/feed/tag/ai/latest/rss", "name": "Wired"},
]

COLLECTION = "ai_news"
VECTOR_SIZE = 384
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_ARTICLES = 500

embed_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
_executor = ThreadPoolExecutor(max_workers=1)


def embed(text: str) -> list[float]:
    return list(embed_model.embed([text]))[0].tolist()


def make_id(url: str) -> int:
    return int(hashlib.md5(url.encode()).hexdigest(), 16) % (2**63)


def _get_qdrant() -> QdrantClient:
    return QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])


def translate_to_english(query: str) -> str:
    prompt = f"Translate the following to English. Return only the translation, nothing else:\n{query}"
    return call_groq(prompt, max_tokens=100)


def call_groq(prompt: str, max_tokens: int) -> str:
    with httpx.Client(timeout=30) as client:
        res = client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


def ensure_collection(q: QdrantClient) -> None:
    names = [c.name for c in q.get_collections().collections]
    if COLLECTION not in names:
        q.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def get_trending_score(vector: list[float], article_id: int, q: QdrantClient) -> int:
    """Count existing articles on the same topic (cosine similarity > 0.72)."""
    try:
        hits = q.search(
            collection_name=COLLECTION,
            query_vector=vector,
            limit=15,
            score_threshold=0.72,
        )
        return sum(1 for h in hits if h.id != article_id)
    except Exception:
        return 0


def cleanup_articles(q: QdrantClient) -> None:
    """Delete old/low-trending articles; enforce MAX_ARTICLES cap."""
    now = datetime.now(timezone.utc)
    results, _ = q.scroll(
        collection_name=COLLECTION,
        limit=1000,
        with_payload=True,
        with_vectors=False,
    )

    to_delete = []
    for point in results:
        p = point.payload
        days_old = 999
        try:
            dt = datetime.fromisoformat(p.get("indexed_at", ""))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            days_old = (now - dt).days
        except Exception:
            pass

        score = p.get("trending_score", 1)
        if days_old > 90 or (days_old > 30 and score < 2):
            to_delete.append(point.id)

    if to_delete:
        q.delete(collection_name=COLLECTION, points_selector=PointIdsList(points=to_delete))
        print(f"[cleanup] Deleted {len(to_delete)} old/low-trending articles")

    remaining, _ = q.scroll(
        collection_name=COLLECTION,
        limit=MAX_ARTICLES + 100,
        with_payload=True,
        with_vectors=False,
    )
    if len(remaining) > MAX_ARTICLES:
        ranked = sorted(
            remaining,
            key=lambda p: (p.payload.get("trending_score", 1), p.payload.get("indexed_at", "")),
        )
        excess = [p.id for p in ranked[: len(remaining) - MAX_ARTICLES]]
        q.delete(collection_name=COLLECTION, points_selector=PointIdsList(points=excess))
        print(f"[cleanup] Trimmed {len(excess)} excess articles to stay under {MAX_ARTICLES}")


def index_articles() -> None:
    q = _get_qdrant()
    ensure_collection(q)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Pass 1: upsert all articles with score=0 so they're searchable
    all_points: list[tuple[int, list[float]]] = []
    for src in RSS_SOURCES:
        try:
            feed = feedparser.parse(src["url"])
            points = []
            for entry in feed.entries[:25]:
                url = getattr(entry, "link", "")
                title = getattr(entry, "title", "")
                desc = getattr(entry, "summary", getattr(entry, "description", ""))
                if not url or not title:
                    continue
                text = f"{title}. {desc}"[:512]
                vec = embed(text)
                article_id = make_id(url)
                points.append(
                    PointStruct(
                        id=article_id,
                        vector=vec,
                        payload={
                            "title": title,
                            "url": url,
                            "source": src["name"],
                            "description": desc[:500],
                            "indexed_at": now_iso,
                            "trending_score": 0,
                        },
                    )
                )
                all_points.append((article_id, vec))
            if points:
                q.upsert(collection_name=COLLECTION, points=points)
            print(f"[index] {src['name']}: {len(points)} articles inserted")
        except Exception as e:
            print(f"[index] {src['name']} error: {e}")

    # Pass 2: now that all articles are in DB, recalculate trending scores
    for article_id, vec in all_points:
        score = get_trending_score(vec, article_id, q)
        if score > 0:
            q.set_payload(
                collection_name=COLLECTION,
                payload={"trending_score": score},
                points=[article_id],
            )

    print(f"[index] Trending scores updated for {len(all_points)} articles")
    cleanup_articles(q)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.get_event_loop().run_in_executor(_executor, index_articles)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SummarizeReq(BaseModel):
    title: str
    description: str


class SearchReq(BaseModel):
    query: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/reindex")
def reindex():
    index_articles()
    return {"status": "ok"}


@app.get("/trending")
def trending(limit: int = 3):
    try:
        q = _get_qdrant()
        results, _ = q.scroll(
            collection_name=COLLECTION,
            limit=1000,
            with_payload=True,
            with_vectors=False,
        )

        now = datetime.now(timezone.utc)
        scored = []
        for point in results:
            p = point.payload
            days_old = 7
            try:
                dt = datetime.fromisoformat(p.get("indexed_at", ""))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                days_old = (now - dt).days
            except Exception:
                pass

            raw = p.get("trending_score", 0)
            # Base score of 1 ensures recent articles always appear even with no cross-coverage
            effective = (1 + raw) * math.exp(-days_old * 0.1)
            scored.append({
                "title": p.get("title", ""),
                "url": p.get("url", ""),
                "source": p.get("source", ""),
                "description": p.get("description", ""),
                "trending_score": raw,
                "effective_score": round(effective, 3),
            })

        scored.sort(key=lambda x: x["effective_score"], reverse=True)
        top = scored[:limit]

        # Generate Japanese summaries for top articles
        for item in top:
            try:
                prompt = (
                    f"以下のAI関連記事を日本語で2文以内に要約してください。\n\n"
                    f"タイトル: {item['title']}\n概要: {item['description']}"
                )
                item["summary"] = call_groq(prompt, max_tokens=150)
            except Exception:
                item["summary"] = ""

        return {"items": top}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@app.post("/summarize")
def summarize(req: SummarizeReq):
    try:
        prompt = (
            f"以下のAI関連記事を日本語で3文以内に要約してください。\n\n"
            f"タイトル: {req.title}\n概要: {req.description}"
        )
        return {"summary": call_groq(prompt, max_tokens=200)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@app.post("/search")
def search(req: SearchReq):
    try:
        english_query = translate_to_english(req.query)
        print(f"[search] original='{req.query}' → translated='{english_query}'")
        vector = embed(english_query)
        hits = _get_qdrant().search(collection_name=COLLECTION, query_vector=vector, limit=10)

        items = [
            {
                "title": h.payload["title"],
                "url": h.payload["url"],
                "source": h.payload["source"],
                "description": h.payload.get("description", ""),
                "score": round(h.score, 3),
                "trending_score": h.payload.get("trending_score", 0),
            }
            for h in hits
        ]

        context = "\n".join(f"- {i['title']} ({i['source']})" for i in items[:5])
        prompt = (
            f"ユーザーの質問: {req.query}\n\n"
            f"関連記事:\n{context}\n\n"
            f"上記の記事に基づいて、質問に日本語で簡潔に回答してください。"
        )
        return {"answer": call_groq(prompt, max_tokens=300), "items": items}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
