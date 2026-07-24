# Viya 💚 — your AI second brain for money, health & life

Viya (MoneyViya) is an AI life assistant for Indian users. Talk to it in the
**app** or on **WhatsApp** in plain language — "spent 500 on food", "had lunch",
"gave 20000 to Rahul at 2% collect on the 5th", "should I do ELSS or PPF?" — and
it logs the right thing to the right place, reminds you on time, and gives
advice grounded in your **real data** and a **curated financial knowledge base**,
not generic filler.

**Live:** https://heyviya.vercel.app

> This README describes the current architecture. An older version described a
> Baileys + n8n + Railway + FastAPI stack — that's long gone; none of it is used.

---

## What it does

- **Conversational logging** — expenses, income, meals, health (steps/water/
  weight), habits, lending/borrowing, bills & EMIs, investments, medicines,
  journal — all from natural language, in the app chat or over WhatsApp, in
  English / Hindi / Tamil / Telugu / Kannada / Malayalam (and Hinglish/Tanglish).
- **Reminders that actually fire** — one-time, daily, weekly, monthly, with
  advance nudges, delivered on WhatsApp even when the app is closed, plus
  automatic reminders for bill/EMI due dates and lending collection days.
- **Daily brief & evening check-in** — a morning WhatsApp brief (yesterday's
  recap + today's agenda) and an evening check-in that knows what you did/didn't
  log today.
- **Grounded AI advice** — answers come from a hybrid retrieval system over
  *your own* transactions/goals/bills/etc. **and** a curated knowledge base of
  vetted Indian personal-finance knowledge — see [The RAG](#the-rag-our-own-not-just-api-answers).
- **Dashboards** — expenses, budget, wealth (portfolio + lending + splits with a
  signed net-worth view), goals, habits, health, and more.
- **Media understanding** — bill/receipt photos and (on WhatsApp) images are
  read via a vision model and turned into logged transactions.

---

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite (SPA), deployed on Vercel — root dir `frontend/` |
| Backend | Python serverless functions on Vercel (`frontend/api/*.py`, `http.server` handlers) |
| Database | Supabase Postgres + **pgvector** |
| Chat LLM | Groq — LLaMA 3.3 70B (`llama-3.3-70b-versatile`) |
| Vision/OCR | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` |
| Embeddings | OpenAI `text-embedding-3-small` (1536-dim) |
| WhatsApp | Meta WhatsApp Cloud API (webhook at `frontend/api/whatsapp.py`) |
| Reminder cron | GitHub Actions every 15 min → `/api/cron/check-reminders` |
| Daily/weekly cron | Vercel Cron → `/api/cron/morning-brief`, `/api/cron/weekly-summary` |

The frontend talks to Supabase directly (anon key + RLS) for CRUD, and to the
Python functions for anything needing the LLM/RAG (chat, OCR) or server secrets.

```
frontend/
├── src/                     # React app (pages/, components/, lib/)
├── api/                     # Python serverless functions
│   ├── chat.py              #   app chat: RAG context + Groq + ACTION execution
│   ├── whatsapp.py          #   WhatsApp Cloud API webhook (same agent, mirrored)
│   ├── _rag.py              #   hybrid retriever (BM25 + vector + RRF + KG + KB)
│   ├── bank-connect.py, sms/, auth/gmail/
│   └── cron/                #   check-reminders, morning-brief, weekly-summary, …
├── public/                  # PWA manifest, icons, robots.txt, sitemap.xml, og-image
└── index.html
database/
└── 00_consolidated_migration.sql   # one idempotent file — the whole schema
tests/
├── data/intent_dataset.jsonl       # 151 labelled agent test cases
├── test_actions_offline.py         # deterministic action/dup-guard test (no quota)
└── eval_rag.py                     # live intent + grounding + dup accuracy
```

---

## The RAG (our own, not just API answers)

A common misconception: "we're just getting answers from an API." We're not.
Groq is only the final text-generation step. The **grounding** — the part that
makes an answer *about you and correct* — is our own retrieval layer in
`frontend/api/_rag.py`:

- **Hybrid retrieval** per source: BM25/full-text (`plfts`) **+** vector search
  (pgvector, cosine) fused with **Reciprocal Rank Fusion**. A similarity floor
  discards weak "nearest but unrelated" matches.
- **Over your own data** — transactions, goals, bills, habits, health logs,
  meals, lending, investments, medicines, journal, emails — each with its own
  `match_*` SQL function and lazy embedding backfill.
- **Knowledge graph** — a nightly 1-hop walk over `kg_edges` so the agent can
  explain *why* (e.g. a goal stalling because of a competing EMI), not just
  report numbers.
- **Curated knowledge base** (`knowledge_base` table) — vetted Indian
  personal-finance knowledge we author (emergency fund, SIP, ELSS vs PPF, 80C,
  term vs endowment, credit-card interest trap, tax regimes, …), retrieved via
  the same hybrid path and injected into the prompt so **advice is grounded in
  our own corpus**, prefer-over-generic. Grow it by `INSERT`ing rows — no code
  change. It works on BM25 alone immediately; vector search activates once
  embeddings backfill (needs `OPENAI_API_KEY`, degrades to lexical-only without).

The whole thing degrades gracefully: no `OPENAI_API_KEY` → lexical-only retrieval
still works; the agent just loses the vector half.

### On "train our own model"
The chat model is Groq-hosted LLaMA — an API, not something we fine-tune — and
the embeddings are OpenAI's. Fine-tuning a model wouldn't fix accuracy here (the
failure modes are prompt + retrieval + guard logic) and would cost a lot for no
gain. For an agent built this way, "training" is the **dataset → measure → fix
the prompt/guards/KB → re-measure** loop below. That's what actually moves and
holds accuracy.

---

## The agent action system

The LLM emits `ACTION:TYPE:params` lines at the start of its reply; the server
parses them, writes to Supabase, then strips them from the visible text. Every
handler records whether the DB write actually succeeded, and the reply is
corrected if it didn't.

Three independent guardrails against phantom logs:
- **LOG vs ASK (prompt)** — a logging action only fires when the message reports
  a NEW event. Questions/confirmations ("did you log my 500?", "how much did I
  spend?") never log — enforced in the prompt.
- **Intent gate (our own trained model)** — a linear classifier we train on
  `tests/data/intent_dataset.jsonl` (see `ml/`) gives a second opinion: if it's
  high-confidence the message is a question but the LLM emitted a logging action,
  the write is suppressed. sklearn is used offline only; production runs the
  exported weights in **pure Python, no dependency, no API call**.
- **Duplicate guard** — `recent_duplicate()` skips a near-identical
  expense/income/meal written in the last 3 minutes, so a repeat or a mis-read
  question can't create a phantom second row.

---

## Setup & deploy

### 1. Database
Run `database/00_consolidated_migration.sql` in the Supabase SQL editor. It's
idempotent — safe to re-run whenever you pull new schema (it ends with a series
of `Phase N … ready ✅` notices).

### 2. Environment variables (Vercel project)
```
# Supabase (frontend + functions)
VITE_SUPABASE_URL / SUPABASE_URL
VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY

# AI
GROQ_API_KEY            # chat + vision — free at console.groq.com/keys
OPENAI_API_KEY          # embeddings for vector search (optional; lexical works without)

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN

# Cron auth
CRON_SECRET             # shared secret for the reminder cron endpoints
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev          # local
npm run build        # production build (Vercel runs this)
```

### 4. Reminder cron
`/api/cron/check-reminders` is triggered every 15 min by
`.github/workflows/reminders.yml` (Vercel Hobby can't run native cron more than
once/day). For per-minute precision instead, point an external scheduler
(cron-job.org, free) at the same URL. `morning-brief` and `weekly-summary` run
via Vercel Cron (`frontend/vercel.json`).

---

## Testing & the accuracy loop

```bash
# Deterministic — runs now, no network/Groq quota. 20/20 currently.
python3 tests/test_actions_offline.py

# Live intent + grounding + duplicate accuracy against the deployed API.
python3 tests/eval_rag.py
VIYA_API_BASE=http://localhost:5173 python3 tests/eval_rag.py   # or a local build
```

The loop to hit and hold 95%+: run the live eval → read its per-intent
breakdown + failure list → fix the prompt/guard/KB and add the failing message
to `tests/data/intent_dataset.jsonl` → re-run the offline test (instant) and the
live eval. See `tests/README.md`.

---

*Viya — your money, health, and habits, on autopilot.* 💚
