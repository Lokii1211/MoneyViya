"""
Viya — Hybrid RAG retriever (BM25 + Vector, Reciprocal Rank Fusion)
=====================================================================
Shared helper module for chat.py and whatsapp.py. Not a route itself —
the leading underscore excludes it from Vercel's function routing while
still letting sibling files `import _rag`. See docs/AI_AGENTS_RAG_PRD.md
for the full design (this is Phase 1: retrieval over the user's own
transactions/goals/bills; Phase 2 adds news, Phase 3 adds the knowledge
graph walk).

Degrades gracefully: if OPENAI_API_KEY isn't set, hybrid_search() still
returns lexical (full-text search) matches — it just skips the vector half.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Callable, NamedTuple
from urllib.parse import quote

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536


def _sb_headers():
    return {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}


def _sb_get(path):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=_sb_headers())
        with urllib.request.urlopen(req, timeout=6) as r:
            return json.loads(r.read()) or []
    except Exception as e:
        print(f"[RAG sb_get] {path[:60]}: {e}")
        return []


def _sb_patch(table, filt, data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{table}?{filt}",
            data=json.dumps(data).encode(), headers=_sb_headers(), method="PATCH",
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"[RAG sb_patch] {table}: {e}")
        return None


def _sb_rpc(fn_name, payload):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rpc/{fn_name}",
            data=json.dumps(payload).encode(), headers=_sb_headers(), method="POST",
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            return json.loads(r.read()) or []
    except Exception as e:
        print(f"[RAG rpc] {fn_name}: {e}")
        return []


def embed(text):
    """Returns a 1536-dim embedding for `text`, or None if OPENAI_API_KEY is unset or the call fails."""
    if not OPENAI_API_KEY or not text or not text.strip():
        return None
    try:
        body = json.dumps({"model": EMBED_MODEL, "input": text[:8000]}).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/embeddings", data=body, method="POST",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read())["data"][0]["embedding"]
    except Exception as e:
        print(f"[RAG embed] {e}")
        return None


class _TableConfig(NamedTuple):
    select: str
    text_fn: Callable[[dict], str]
    match_fn: str
    format_fn: Callable[[dict], str]


# Per-table retrieval config: how to build the embeddable text, which columns
# to fetch, and which SQL match function (see migration) to call for vector search.
TABLE_CONFIG = {
    "transactions": _TableConfig(
        select="id,type,amount,category,description,merchant,created_at",
        text_fn=lambda r: f"{r.get('type','')} {r.get('category','')} {r.get('description') or ''} {r.get('merchant') or ''} amount {r.get('amount','')}",
        match_fn="match_transactions",
        format_fn=lambda r: f"{r.get('type','')}: ₹{r.get('amount',0)} ({r.get('category','')}) {r.get('description') or r.get('merchant') or ''}".strip(),
    ),
    "goals": _TableConfig(
        select="id,name,current_amount,target_amount,deadline",
        text_fn=lambda r: f"goal {r.get('name','')}",
        match_fn="match_goals",
        format_fn=lambda r: f"Goal '{r.get('name','')}': ₹{r.get('current_amount',0)}/₹{r.get('target_amount',0)}" + (f" by {r.get('deadline')}" if r.get('deadline') else ""),
    ),
    "bills_and_dues": _TableConfig(
        select="id,name,bill_type,amount,due_date,status",
        text_fn=lambda r: f"bill {r.get('name','')} {r.get('bill_type','')}",
        match_fn="match_bills",
        format_fn=lambda r: f"Bill '{r.get('name','')}' ({r.get('bill_type','')}): ₹{r.get('amount',0)}, due {r.get('due_date','?')}, {r.get('status','')}",
    ),
    "health_logs": _TableConfig(
        select="id,log_date,steps,water_glasses,sleep_hours,mood,notes",
        text_fn=lambda r: f"mood {r.get('mood','')} {r.get('notes') or ''}",
        match_fn="match_health_logs",
        format_fn=lambda r: f"{r.get('log_date','')}: mood {r.get('mood','')}, {r.get('steps',0)} steps, {r.get('sleep_hours',0)}h sleep" + (f" — {r.get('notes')}" if r.get('notes') else ""),
    ),
    "habits": _TableConfig(
        select="id,name,icon,current_streak,frequency",
        text_fn=lambda r: f"habit {r.get('name','')} {r.get('frequency','')}",
        match_fn="match_habits",
        format_fn=lambda r: f"{r.get('icon','')} '{r.get('name','')}' — {r.get('current_streak',0)}-day streak ({r.get('frequency','daily')})",
    ),
}


def backfill_embeddings(phone, table, limit=8):
    """Embeds up to `limit` of this user's rows that don't have one yet. Bounded and cheap enough to call on every chat turn."""
    cfg = TABLE_CONFIG.get(table)
    if not cfg or not OPENAI_API_KEY:
        return
    rows = _sb_get(f"{table}?phone=eq.{phone}&embedding=is.null&select={cfg.select}&order=created_at.desc&limit={limit}")
    for row in rows:
        vec = embed(cfg.text_fn(row))
        if vec:
            _sb_patch(table, f"id=eq.{row['id']}", {"embedding": vec})


def _lexical_search(phone, table, query, limit):
    cfg = TABLE_CONFIG[table]
    return _sb_get(f"{table}?phone=eq.{phone}&fts=plfts.{quote(query)}&select={cfg.select}&limit={limit}")


def _vector_search(phone, table, query_embedding, limit):
    if not query_embedding:
        return []
    cfg = TABLE_CONFIG[table]
    return _sb_rpc(cfg.match_fn, {"query_embedding": query_embedding, "match_phone": phone, "match_count": limit})


def _fuse(lexical, vector, k=60):
    """Reciprocal Rank Fusion — merges two ranked lists into one, deduped by id."""
    scores: dict = {}
    rows_by_id: dict = {}
    for rank, row in enumerate(lexical):
        rid = row.get("id")
        scores[rid] = scores.get(rid, 0) + 1 / (k + rank + 1)
        rows_by_id[rid] = row
    for rank, row in enumerate(vector):
        rid = row.get("id")
        scores[rid] = scores.get(rid, 0) + 1 / (k + rank + 1)
        rows_by_id.setdefault(rid, row)
    ranked_ids = sorted(scores.keys(), key=lambda rid: scores[rid], reverse=True)
    return [rows_by_id[rid] for rid in ranked_ids]


def hybrid_search(phone, query, table, limit=4, exclude_ids=None):
    """
    Hybrid BM25 + vector retrieval for one table, scoped to a single user.
    Returns a list of raw rows (dicts), ranked by fused relevance.
    """
    if not phone or not query or not query.strip() or table not in TABLE_CONFIG:
        return []
    try:
        backfill_embeddings(phone, table)
        query_vec = embed(query)
        lexical = _lexical_search(phone, table, query, limit * 2)
        vector = _vector_search(phone, table, query_vec, limit * 2)
        fused = _fuse(lexical, vector)
        if exclude_ids:
            fused = [r for r in fused if r.get("id") not in exclude_ids]
        return fused[:limit]
    except Exception as e:
        print(f"[RAG hybrid_search] {table}: {e}")
        return []


def format_matches(table, rows):
    """Formats retrieved rows into short human-readable lines for the LLM prompt."""
    cfg = TABLE_CONFIG.get(table)
    if not cfg or not rows:
        return []
    return [cfg.format_fn(r) for r in rows]


# ── News (Phase 2) — global, not scoped to one user, so it's a separate path
# from the per-user hybrid_search() above rather than reusing TABLE_CONFIG. ──

def news_search(query, limit=3):
    """Hybrid BM25 + vector search over news_articles (ingested by cron/market-news.py)."""
    if not query or not query.strip():
        return []
    try:
        query_vec = embed(query)
        lexical = _sb_get(f"news_articles?fts=plfts.{quote(query)}&select=id,title,summary,published_at,tags&order=published_at.desc&limit={limit*2}")
        vector = _vector_search_news(query_vec, limit * 2) if query_vec else []
        return _fuse(lexical, vector)[:limit]
    except Exception as e:
        print(f"[RAG news_search] {e}")
        return []


def _vector_search_news(query_embedding, limit):
    if not query_embedding:
        return []
    return _sb_rpc("match_news", {"query_embedding": query_embedding, "match_count": limit})


def format_news(rows):
    return [f"{r.get('title','')} — {r.get('summary','')}" for r in rows if r.get("title") or r.get("summary")]


# ── Knowledge graph (Phase 3) — 1-hop walk over kg_edges, built nightly by
# cron/knowledge-graph.py from the user's own goals/bills/investments. This
# is what lets the agent explain *why*, not just report numbers — e.g. a
# goal stalling because of a competing EMI. ──

def _kg_label(entity):
    """'bill:3f2c...:Home Loan EMI' -> 'Home Loan EMI' (falls back to the raw entity if unlabeled)."""
    parts = entity.split(":", 2)
    return parts[2] if len(parts) == 3 and parts[2] else entity


def kg_walk(phone, entity_prefix, limit=3):
    """1-hop lookup: edges touching `entity_prefix` (e.g. 'goal:123') as either
    subject or object, ranked by weight. Returns (relation, label, weight) tuples."""
    if not phone or not entity_prefix:
        return []
    try:
        pattern = quote(f"{entity_prefix}:*")
        rows = _sb_get(f"kg_edges?user_phone=eq.{phone}&or=(subject.ilike.{pattern},object.ilike.{pattern})&order=weight.desc&limit={limit}")
        out = []
        for r in rows:
            subj, rel, obj = r.get("subject", ""), r.get("relation", ""), r.get("object", "")
            other = obj if subj.startswith(entity_prefix + ":") else subj
            out.append((rel, _kg_label(other), float(r.get("weight") or 0)))
        return out
    except Exception as e:
        print(f"[RAG kg_walk] {e}")
        return []


def format_kg(edges):
    return [f"{rel.replace('_', ' ')} '{label}' (₹{weight:,.0f}/mo)" for rel, label, weight in edges]
