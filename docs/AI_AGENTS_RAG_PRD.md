# Viya AI Agents & Hybrid RAG — PRD

**Status:** Draft for review. Nothing in this doc is built yet except what Phase 0/1 explicitly says is already live.
**Owner:** Kishan (solo founder)
**Last updated:** 2026-07-11

---

## 1. What we're actually building

Viya stops being "an app with a chatbot" and becomes a **virtual financial + life assistant**: something that watches a user's money, health, and commitments continuously and proactively tells them what to do — not just answers when asked.

Four agents, sharing one retrieval brain:

| Agent | Job |
|---|---|
| **Wealth Advisor** | Answers "should I invest in X", explains portfolio health, reacts to market moves relevant to the user's holdings |
| **Budget & Savings Manager** | Sets/adjusts daily-spend targets, flags overspend, recommends savings rate changes as income/goals change |
| **Market Analyst** (feeds the other two) | Ingests financial news, summarizes it, tags which users it's relevant to |
| **Life Ops Agent** | EMI/bill reminders, health tips, habit nudges — the "keeps your life running" layer (largely exists today as cron jobs; this PRD upgrades it to be retrieval-aware instead of template-based) |

All four are **one Groq LLM call each**, differing only in the *context* that gets assembled before the call — that context assembly is the hybrid RAG system below.

---

## 2. Why hybrid RAG, and what it means concretely here

You asked for BM25 + Vector + Knowledge Graph. Here's what each one is actually *for*, mapped to something we can ship on our current stack (Vercel serverless + Supabase Postgres — no new infra provider required):

| Technique | What it's good at | Our implementation |
|---|---|---|
| **BM25 / lexical search** | Exact terms — category names, merchant names, "EMI", specific stock tickers | Postgres full-text search (`tsvector` + `ts_rank`) on transactions, news articles, goals. Native to Supabase, zero new services. |
| **Vector search** | Semantic/meaning matches — "money I wasted on eating out" matching "Zomato", "Swiggy" without exact keyword overlap | `pgvector` extension on Supabase (`CREATE EXTENSION vector`). Store embeddings for: news articles, transaction descriptions, past chat Q&A pairs. |
| **Knowledge Graph** | Relationships — "which goal is this EMI blocking", "what's this user's exposure to a stock that just dropped" | **Not Neo4j** (that's a separate paid service we don't need). A plain Postgres edges table: `kg_edges(subject, relation, object, weight, user_phone)`. Built from data we already have — goals, bills, EMIs, transactions, holdings — no new data source. |

**Fusion**: for a given user query, run BM25 + vector search in parallel, combine with Reciprocal Rank Fusion (a standard, simple formula — no extra library needed), then pull in 1-hop KG neighbors of whatever entities matched. That combined context goes into the Groq prompt.

This is a real, well-established architecture (used in production RAG systems), not a toy — but it's scoped to fit inside a Postgres database and serverless functions with no new infrastructure bill beyond one embeddings API and one news API.

---

## 3. Being straight about "95% accuracy"

There's no single number that means "95% accurate" for open-ended financial advice — that's not how LLM systems are evaluated, and any vendor promising a flat accuracy percentage for subjective advice is not being precise. What we **can** target and measure:

1. **Retrieval precision**: of the context chunks pulled by hybrid search, what fraction are actually relevant to the question (measured against a hand-labeled test set — see Phase 4).
2. **Grounding rate**: does every factual claim in the agent's answer trace back to a real retrieved source (a transaction, a real news article, a real goal) rather than the LLM inventing a number? This is the one that actually matters for a fintech app — hallucinated numbers about someone's own money is the worst failure mode.
3. **Intent/action accuracy**: when the user says "log 5km run" or "I paid the electricity bill", does the agent correctly identify and execute the right action? This is directly testable against a golden set of ~100 real phrasings.

We'll build an eval harness (Phase 4) that tracks these three numbers over time. "95%" becomes a real target on grounding rate and intent accuracy specifically, not a vague blanket claim.

---

## 4. Architecture

```
                     ┌─────────────────────────┐
   News sources ────▶│  Market Analyst cron     │──▶ news_articles (Supabase)
   (Phase 2)         │  (ingest, summarize,     │    + embeddings (pgvector)
                      │   embed, tag relevance)  │    + FTS index
                      └─────────────────────────┘
                                                          │
   User's own data                                        ▼
   (transactions,                                 ┌──────────────────┐
    goals, bills,        ──────────────────────▶  │  Hybrid Retriever │
    EMIs, holdings)                                │  BM25 + Vector    │
                                                    │  + KG 1-hop walk  │
                                                    └──────────────────┘
                                                          │
                                                          ▼
   Chat / WhatsApp query ─────────────────────▶  Assembled context + prompt
                                                          │
                                                          ▼
                                                    Groq LLaMA 3.3 70B
                                                          │
                                                          ▼
                                                    Grounded answer
                                                    + action execution
                                                    (existing ACTION-line system)
```

The existing `frontend/api/chat.py` / `whatsapp.py` ACTION-line execution system (log expense, complete habit, etc.) stays exactly as-is — this PRD only changes what gets stuffed into the prompt *before* the LLM call, and adds the Market Analyst's background ingestion pipeline.

---

## 5. Data model additions (Supabase)

```sql
-- enable once
create extension if not exists vector;

-- news ingested by Market Analyst agent
create table news_articles (
  id uuid primary key default gen_random_uuid(),
  source text,                    -- e.g. 'moneycontrol', 'economic_times'
  url text unique,
  title text,
  summary text,                   -- LLM-summarized, not raw scrape
  published_at timestamptz,
  tags text[],                    -- e.g. ['mutual_funds','fd_rates','sensex']
  embedding vector(1536),
  fts tsvector generated always as (to_tsvector('english', title || ' ' || summary)) stored,
  created_at timestamptz default now()
);
create index on news_articles using ivfflat (embedding vector_cosine_ops);
create index on news_articles using gin (fts);

-- personal knowledge graph edges (built from existing tables, refreshed nightly)
create table kg_edges (
  id uuid primary key default gen_random_uuid(),
  user_phone text not null,
  subject text not null,          -- e.g. 'goal:emergency_fund'
  relation text not null,         -- e.g. 'blocked_by'
  object text not null,           -- e.g. 'bill:home_loan_emi'
  weight real default 1.0,
  created_at timestamptz default now()
);
create index on kg_edges (user_phone, subject);

-- embeddings for transactions, so "money wasted eating out" finds Zomato/Swiggy semantically
alter table transactions add column if not exists embedding vector(1536);
```

RLS on both new tables follows the exact same `anon` policy pattern already used everywhere else in the schema (with the `DROP POLICY IF EXISTS` idempotency guard we standardized on this session).

---

## 6. What you need to set up manually (exact links)

| # | What | Why | Link | Cost |
|---|---|---|---|---|
| 1 | **OpenAI API key** (or alternative embeddings provider) | Groq has no embeddings endpoint — we need one for vector search | https://platform.openai.com/api-keys → "Create new secret key" | `text-embedding-3-small`: ~$0.02 per 1M tokens — for this app's scale, a few dollars/month at most |
| 2 | **Alpha Vantage API key** (free tier) | Financial news + sentiment feed for the Market Analyst agent, has an India-relevant global news endpoint | https://www.alphavantage.co/support/#api-key → enter email, key emailed instantly | Free tier: 25 requests/day — enough for 2-3x/day ingestion batches |
| 3 | **Enable pgvector on Supabase** | Needed for vector search | Supabase Dashboard → your project → Database → Extensions → search "vector" → Enable. (Or just run `create extension if not exists vector;` in SQL Editor — I'll include this in the migration file when we build Phase 1) | Free, included in Supabase |
| 4 | Add both new keys to Vercel | So `frontend/api/*.py` can read them via env vars | Vercel Dashboard → your project → Settings → Environment Variables → add `OPENAI_API_KEY` and `ALPHA_VANTAGE_API_KEY` | — |

Everything else (Groq, Supabase, WhatsApp) you already have configured from earlier work.

---

## 7. Phased roadmap — build order

**I will implement these one phase at a time, not all at once, and check in with you before starting each new phase.**

### Phase 0 — Foundation (no new external cost, ships first)
- Add the `news_articles`, `kg_edges`, transaction `embedding` column to the schema (migration file).
- Enable pgvector on Supabase.
- Build the Postgres FTS indexes (BM25-equivalent) on existing tables — this alone improves chat's ability to find "that Swiggy order last week" type queries, no embeddings needed yet.

### Phase 1 — Hybrid retrieval MVP (needs OpenAI key)
- Embed existing transactions, goals, bills on write (small addition to existing `addExpense`/`addGoal` etc. calls).
- Build the Hybrid Retriever function (BM25 + vector + RRF fusion) as a shared Python module used by `chat.py` and `whatsapp.py`.
- Wire it into the existing chat prompt as additional context. **No Market Analyst / news yet** — this phase proves the retrieval works on the user's own data first.

### Phase 2 — Market Analyst agent (needs Alpha Vantage key)
- Cron job (reuses existing Vercel cron pattern) ingests news 2-3x/day, summarizes via Groq, embeds, tags relevance.
- Wealth Advisor agent starts citing real news in answers ("Nifty banking index dropped 2% today, relevant since you hold HDFC Bank via your mutual fund").

### Phase 3 — Personal Knowledge Graph
- Nightly job builds `kg_edges` from goals/bills/EMIs/holdings relationships.
- Retriever does a 1-hop KG walk on top of BM25+vector results — this is what lets the agent answer "why can't I hit my emergency fund goal" by tracing EMI → blocks → goal edges.

### Phase 4 — Eval harness
- ~100-150 hand-labeled test queries (intent + expected retrieved sources).
- Automated script scoring retrieval precision, grounding rate, intent accuracy on every deploy.
- This is where "95%" becomes a real, tracked number instead of an aspiration.

### Phase 5 — Full life-OS coverage
- Extend the same retrieval pattern to Health (medicine adherence, health tips grounded in logged vitals) and Habits, so the "virtual assistant" framing covers the whole app, not just money.

---

## 8. What does NOT change

- Groq stays the LLM (no reason to add a second model provider).
- The existing ACTION-line execution system in `chat.py`/`whatsapp.py` (log expense, complete habit, etc.) is untouched — RAG only changes the *context*, not the action-execution mechanism.
- No new hosting/infra provider — everything lives in Supabase Postgres + existing Vercel serverless functions, to stay within Hobby-plan constraints already discovered this session (12-function cap, no long-running processes).

---

## 9. Immediate next step

Confirm Phase 0 + Phase 1 scope above, and get the OpenAI key added to Vercel — that unblocks everything else. Phase 2 needs the Alpha Vantage key. I'll build strictly one phase at a time and check results with you before moving to the next.
