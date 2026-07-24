# Viya — agent test & iterate loop

There is no model being trained here in the ML sense. Viya's chat/WhatsApp
agent is Groq-hosted LLaMA 3.3 70B (an API — not fine-tunable by us) plus our
own hybrid RAG retrieval (BM25 + pgvector + reciprocal-rank fusion + a
knowledge-graph walk) over your Supabase data. For an agent built this way,
"training" is a **dataset → measure → fix the prompt/guards → re-measure**
loop. These three tools run that loop.

## The dataset
`data/intent_dataset.jsonl` — 151 labelled `{message, intent}` rows (intent
`null` = plain talk, no action should fire). Covers all 15 action types, heavy
slang, Hindi/Tamil/Hinglish/Tanglish, and a big block of **trap cases**:
questions/confirmations that mention amounts or food but must NOT log
("did you log my 500?", "how much did I spend?", "should I buy this?"). Grow
it by appending lines — no code change needed.

## 1. Offline action + duplicate-guard test — runs now, no network/quota
```
python3 tests/test_actions_offline.py
```
Imports `chat.py` and swaps its Supabase layer for an in-memory fake, then
drives the REAL `execute_actions()` / `recent_duplicate()`:
- every ACTION line writes the right table + columns (parser regression gate),
- a repeated/identical log within 3 min is skipped (duplicate guard), while a
  different amount or one >3 min later still logs.

Deterministic — exits nonzero on any failure, so it can gate a commit/CI.
Current: **20/20 pass.**

## 2. Live intent accuracy + grounding + duplicate — needs the deployed API
```
python3 tests/eval_rag.py
# or against a branch/local build:
VIYA_API_BASE=http://localhost:5173 python3 tests/eval_rag.py
```
Sends every dataset message to the live `/api/chat` and scores:
- **Intent accuracy** — right ACTION fired (or correctly none) per message,
- **Grounding rate** — replies quote the REAL seeded number, never invented,
- **Duplicate guard** — log → repeat → ask ends with exactly one DB row.

Makes real Groq calls (free-tier rate-limited), so run it on demand after a
prompt/retrieval change, not on every push. It creates and then deletes its
own eval user — never touches real data. Needs `SUPABASE_URL` +
`SUPABASE_ANON_KEY` (or the `VITE_` variants) in the environment.

## The loop (how you actually hit and hold 95%+)
1. Run #2, read the per-intent breakdown + the failure list it prints.
2. For each failure, decide: prompt wording, a new trap example, or a guard.
3. Edit `chat.py` / `whatsapp.py` (and add the failing message to the dataset
   so it can't silently regress).
4. Re-run #1 (instant) and #2 (live). Repeat until the number holds.
