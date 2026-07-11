"""
Viya — Market Analyst Cron (RAG Phase 2)
==========================================
Ingests financial news via Alpha Vantage, rewrites each into one tight,
quotable sentence via Groq, embeds it, and stores it in news_articles for
the hybrid retriever (_rag.py) to surface in chat/WhatsApp answers.

Runs on an external scheduler (cron-job.org — Vercel Hobby's native cron
is once/day only, this needs 2-3x/day), protected by CRON_SECRET same as
cron/check-reminders.py. See docs/AI_AGENTS_RAG_PRD.md.

No-ops safely if ALPHA_VANTAGE_API_KEY isn't set yet.
"""

import sys
import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import _rag

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

# General personal-finance topics — not US-earnings/tech noise, relevant to
# an Indian retail user's savings/investment decisions.
TOPICS = "financial_markets,economy_macro,finance"


def fetch_news():
    if not ALPHA_VANTAGE_API_KEY:
        return []
    url = (
        "https://www.alphavantage.co/query"
        f"?function=NEWS_SENTIMENT&topics={TOPICS}&sort=LATEST&limit=20"
        f"&apikey={ALPHA_VANTAGE_API_KEY}"
    )
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read())
            return data.get("feed", []) or []
    except Exception as e:
        print(f"[MarketNews] fetch error: {e}")
        return []


def summarize_batch(articles):
    """One Groq call rewrites every article's blurb into a tight, quotable
    sentence, in order — cheaper and faster than one call per article.
    Falls back to Alpha Vantage's own summary if Groq is unavailable or
    returns something we can't parse."""
    fallback = [(a.get("summary") or "")[:280] for a in articles]
    if not GROQ_API_KEY or not articles:
        return fallback
    listing = "\n".join(f"{i+1}. {a.get('title','')} — {(a.get('summary') or '')[:300]}" for i, a in enumerate(articles))
    prompt = (
        "Rewrite each numbered financial news item below into ONE tight, plain-English "
        "sentence a friendly financial advisor could quote directly to a client, focused "
        "on why it matters to someone's money. Return ONLY a JSON array of strings, same "
        "order, same count as the input, no other text.\n\n" + listing
    )
    try:
        body = json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1200,
        }).encode()
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions", data=body, method="POST",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; MoneyViya/1.0; +https://heyviya.vercel.app)",
            },
        )
        with urllib.request.urlopen(req, timeout=25) as r:
            content = json.loads(r.read())["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.startswith("json"):
                content = content[4:]
        summaries = json.loads(content)
        if isinstance(summaries, list) and len(summaries) == len(articles):
            return [str(s)[:280] for s in summaries]
    except Exception as e:
        print(f"[MarketNews] summarize error: {e}")
    return fallback


def parse_av_time(t):
    try:
        return datetime.strptime(t, "%Y%m%dT%H%M%S").isoformat()
    except Exception:
        return None


def upsert_news(row):
    """Returns (ok: bool, error_detail: str|None) — error_detail is the raw
    PostgREST response body on failure, useful for live diagnosis."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False, "Supabase env vars not set"
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/news_articles?on_conflict=url",
            data=json.dumps(row).encode(), method="POST",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status in (200, 201, 204), None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[MarketNews] upsert HTTP error {e.code}: {body}")
        return False, f"HTTP {e.code}: {body}"
    except Exception as e:
        print(f"[MarketNews] upsert error: {e}")
        return False, str(e)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            auth = self.headers.get("Authorization", "")
            cron_secret = os.getenv("CRON_SECRET", "")
            if cron_secret and auth != f"Bearer {cron_secret}":
                self._respond(401, {"error": "Unauthorized"})
                return

            if not ALPHA_VANTAGE_API_KEY:
                self._respond(200, {"status": "skipped", "reason": "ALPHA_VANTAGE_API_KEY not set"})
                return
            if not SUPABASE_URL or not SUPABASE_KEY:
                self._respond(500, {"error": "Supabase not configured"})
                return

            raw_articles = fetch_news()
            summaries = summarize_batch(raw_articles)

            saved, skipped = 0, 0
            first_error = None
            for article, summary in zip(raw_articles, summaries):
                url = article.get("url", "")
                if not url or not summary:
                    skipped += 1
                    continue
                title = (article.get("title") or "")[:300]
                tags = [t.get("topic") for t in article.get("topics", []) if t.get("topic")]
                row = {
                    "source": article.get("source", "unknown"),
                    "url": url,
                    "title": title,
                    "summary": summary,
                    "published_at": parse_av_time(article.get("time_published", "")),
                    "tags": tags,
                }
                embedding = _rag.embed(f"{title} {summary}")
                if embedding:
                    row["embedding"] = embedding
                ok, err = upsert_news(row)
                if ok:
                    saved += 1
                else:
                    skipped += 1
                    if first_error is None:
                        first_error = err

            self._respond(200, {"status": "ok", "fetched": len(raw_articles), "saved": saved, "skipped": skipped, "first_error": first_error})
        except Exception as e:
            print(f"[MarketNews] {e}")
            self._respond(200, {"status": "error", "error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
