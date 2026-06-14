import os
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
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

def _get_groq() -> Groq:
    return Groq(api_key=os.environ["GROQ_API_KEY"])


def _get_qdrant() -> QdrantClient:
    return QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"])


embed_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")


def embed(text: str) -> list[float]:
    return list(embed_model.embed([text]))[0].tolist()


def make_id(url: str) -> int:
    return int(hashlib.md5(url.encode()).hexdigest(), 16) % (2**63)


def ensure_collection(q: QdrantClient) -> None:
    names = [c.name for c in q.get_collections().collections]
    if COLLECTION not in names:
        q.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def index_articles() -> None:
    q = _get_qdrant()
    ensure_collection(q)
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
                points.append(PointStruct(
                    id=make_id(url),
                    vector=embed(text),
                    payload={"title": title, "url": url, "source": src["name"], "description": desc[:500]},
                ))
            if points:
                q.upsert(collection_name=COLLECTION, points=points)
            print(f"[index] {src['name']}: {len(points)} articles indexed")
        except Exception as e:
            print(f"[index] {src['name']} error: {e}")


_executor = ThreadPoolExecutor(max_workers=1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run indexing in background so the server binds the port immediately
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


@app.post("/summarize")
def summarize(req: SummarizeReq):
    prompt = (
        f"以下のAI関連記事を日本語で3文以内に要約してください。\n\n"
        f"タイトル: {req.title}\n概要: {req.description}"
    )
    res = _get_groq().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
    )
    return {"summary": res.choices[0].message.content}


@app.post("/search")
def search(req: SearchReq):
    try:
        vector = embed(req.query)
        hits = _get_qdrant().search(collection_name=COLLECTION, query_vector=vector, limit=10)

        items = [
            {
                "title": h.payload["title"],
                "url": h.payload["url"],
                "source": h.payload["source"],
                "description": h.payload.get("description", ""),
                "score": round(h.score, 3),
            }
            for h in hits
        ]

        context = "\n".join(f"- {i['title']} ({i['source']})" for i in items[:5])
        prompt = (
            f"ユーザーの質問: {req.query}\n\n"
            f"関連記事:\n{context}\n\n"
            f"上記の記事に基づいて、質問に日本語で簡潔に回答してください。"
        )
        res = _get_groq().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        return {"answer": res.choices[0].message.content, "items": items}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
