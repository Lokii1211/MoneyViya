"""
Viya — RAG / Intent Accuracy Eval Harness (RAG Phase 4)
==========================================================
Standalone script, not a Vercel function — doesn't touch the 11/12
serverless function budget. Run manually against the LIVE deployed
/api/chat endpoint to track two of the three metrics defined in
docs/AI_AGENTS_RAG_PRD.md section 3:

  1. Intent accuracy — for each hand-labeled message below, does the agent
     fire the right ACTION (or correctly fire none for plain conversation)?
     Includes the LOG-vs-ASK trap set: questions/confirmations that mention
     amounts or food but must NOT log ("did you log my 500?", "is my lunch
     saved?") — the mis-logging bug this suite exists to catch.
  2. Grounding rate  — for a few retrieval-dependent questions seeded with
     known fixture data, does the reply quote the REAL number, not an
     invented one? This is the failure mode that actually matters for a
     fintech app.
  3. Duplicate guard  — log a thing, then repeat/ask about it, and assert the
     DB still has exactly one row (the recent_duplicate() safety net).

Retrieval precision (the third metric from the PRD) needs labeled relevance
judgments over real production data, and there isn't enough of that yet
(Phase 3 found 0 bills/investments logged anywhere) — deferred until there
is.

Usage:
    python3 tests/eval_rag.py
    VIYA_API_BASE=http://localhost:5173 python3 tests/eval_rag.py

Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ANON_KEY (or
VITE_SUPABASE_ANON_KEY) in the environment — same values the frontend
already uses. Everything this script creates (a dedicated eval user, its
transactions/goals/etc.) is deleted again at the end of the run; it never
touches real user data.

This makes real Groq calls through the live chat endpoint (rate-limited on
the free tier), so it's meant to be run on demand when you want to check
quality after a prompt/retrieval change — not wired into every git push.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error

API_BASE = os.getenv("VIYA_API_BASE", "https://heyviya.vercel.app").rstrip("/")
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()
EVAL_PHONE = os.getenv("VIYA_EVAL_PHONE", "9000000001")
REQUEST_DELAY = float(os.getenv("VIYA_EVAL_DELAY", "1.5"))  # be gentle with Groq's free-tier rate limit

# Maps chat.py's execute_actions() "type" field back to the ACTION name that produced it.
TYPE_TO_INTENT = {
    "expense": "LOG_EXPENSE", "income": "LOG_INCOME", "reminder": "CREATE_REMINDER",
    "habit": "MARK_HABIT", "habit_already": "MARK_HABIT", "habit_not_found": "MARK_HABIT",
    "goal": "CREATE_GOAL", "new_habit": "CREATE_HABIT", "health": "LOG_HEALTH",
    "memory": "REMEMBER", "meal": "LOG_MEAL", "lending": "LOG_LENDING", "bill": "CREATE_BILL",
    "investment": "LOG_INVESTMENT", "new_medicine": "ADD_MEDICINE",
    "medicine_taken": "TAKE_MEDICINE", "medicine_not_found": "TAKE_MEDICINE", "journal": "LOG_JOURNAL",
}

# ── Golden set — hand-labeled (message, expected_intent) pairs, loaded from
# tests/data/intent_dataset.jsonl (intent null = plain conversation, no action
# should fire). Kept as an external dataset file so it's easy to grow without
# touching this harness. Deliberately varied phrasing, slang, and language
# (Hinglish/Tanglish included) — this is a natural-language-understanding
# system, not a keyword matcher. ──
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "intent_dataset.jsonl")


def load_golden_set():
    pairs = []
    with open(DATASET_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            pairs.append((row["message"], row.get("intent")))
    return pairs


GOLDEN_SET = load_golden_set()

# ── Grounding cases — seed known fixture rows, ask a question that should
# require quoting them back, check the reply contains the real number. ──
GROUNDING_SET = [
    {
        "setup": {"table": "transactions", "row": {"type": "expense", "amount": 777, "category": "Food", "description": "Zomato eval fixture", "merchant": "Zomato"}},
        "query": "how much did I spend on Zomato",
        "expect_substrings": ["777"],
    },
    {
        "setup": {"table": "goals", "row": {"name": "Eval Fixture Goal", "target_amount": 50000, "current_amount": 12345, "icon": "🎯", "status": "active"}},
        "query": "how much have I saved for my Eval Fixture Goal",
        "expect_substrings": ["12345", "12,345"],
    },
]


def _sb_headers():
    return {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}


def sb_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=_sb_headers())
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read()) or []


def sb_post(table, data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}", data=json.dumps(data).encode(), method="POST",
        headers={**_sb_headers(), "Prefer": "return=representation"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        res = json.loads(r.read())
        return res[0] if isinstance(res, list) and res else res


def sb_delete(table, filt):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{table}?{filt}", method="DELETE", headers=_sb_headers())
    urllib.request.urlopen(req, timeout=10)


def ensure_eval_user():
    users = sb_get(f"users?phone=eq.{EVAL_PHONE}&select=phone")
    if not users:
        sb_post("users", {"phone": EVAL_PHONE, "name": "Eval Test User"})


def cleanup_eval_data():
    for table in ("transactions", "goals", "habits", "habit_checkins", "user_reminders", "health_logs", "viya_memory"):
        try:
            sb_delete(table, f"phone=eq.{EVAL_PHONE}")
        except Exception as e:
            print(f"  (cleanup warning: {table}: {e})")


def call_chat(message):
    qs = urllib.parse.urlencode({"phone": EVAL_PHONE, "message": message})
    url = f"{API_BASE}/api/chat?{qs}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"reply": "", "actions_executed": [], "success": False, "_error": str(e)}


def run_intent_accuracy():
    print(f"\n=== Intent accuracy — {len(GOLDEN_SET)} cases ===")
    results = []
    for message, expected in GOLDEN_SET:
        resp = call_chat(message)
        executed = resp.get("actions_executed") or []
        actual_intents = {TYPE_TO_INTENT.get(a.get("type")) for a in executed if a.get("type")}
        actual_intents.discard(None)
        if expected is None:
            ok = len(actual_intents) == 0
            actual_label = "none" if ok else ",".join(sorted(actual_intents))
        else:
            ok = expected in actual_intents
            actual_label = ",".join(sorted(actual_intents)) if actual_intents else "none"
        results.append({"message": message, "expected": expected or "none", "actual": actual_label, "ok": ok})
        print(f"  {'PASS' if ok else 'FAIL'}  [{expected or 'none':16}] -> [{actual_label:16}]  {message[:60]}")
        time.sleep(REQUEST_DELAY)

    passed = sum(1 for r in results if r["ok"])
    total = len(results)
    print(f"\nIntent accuracy: {passed}/{total} = {100*passed/total:.1f}%")

    by_intent = {}
    for r in results:
        by_intent.setdefault(r["expected"], [0, 0])
        by_intent[r["expected"]][1] += 1
        if r["ok"]:
            by_intent[r["expected"]][0] += 1
    print("\nPer-intent breakdown:")
    for intent, (ok_count, total_count) in sorted(by_intent.items()):
        print(f"  {intent:16} {ok_count}/{total_count} = {100*ok_count/total_count:.0f}%")

    failures = [r for r in results if not r["ok"]]
    if failures:
        print(f"\n{len(failures)} failure(s):")
        for f in failures:
            print(f"  expected={f['expected']:16} actual={f['actual']:16} \"{f['message']}\"")

    return passed, total


def run_grounding():
    print(f"\n=== Grounding rate — {len(GROUNDING_SET)} cases ===")
    passed = 0
    for case in GROUNDING_SET:
        table = case["setup"]["table"]
        row = dict(case["setup"]["row"])
        row["phone"] = EVAL_PHONE
        sb_post(table, row)
        time.sleep(0.5)

        resp = call_chat(case["query"])
        reply = (resp.get("reply") or "").replace(",", "")
        ok = any(sub.replace(",", "") in reply for sub in case["expect_substrings"])
        print(f"  {'PASS' if ok else 'FAIL'}  \"{case['query']}\" -> {resp.get('reply','')[:120]!r}")
        if ok:
            passed += 1
        time.sleep(REQUEST_DELAY)

    total = len(GROUNDING_SET)
    print(f"\nGrounding rate: {passed}/{total} = {100*passed/total:.1f}%" if total else "No grounding cases defined.")
    return passed, total


def _count_expense_rows(amount, category):
    rows = sb_get(f"transactions?phone=eq.{EVAL_PHONE}&type=eq.expense&amount=eq.{amount}&category=eq.{urllib.parse.quote(category)}&select=id")
    return len(rows)


def run_duplicate_guard():
    """The exact scenario the user called out: a thing is logged, then the
    user restates or ASKS about it — the system must NOT create a second row.
    Verified against the real DB, not just the reply text: exactly one row
    must exist after all three sends. Cleans up before it starts so a prior
    run can't skew the count."""
    print("\n=== Duplicate-logging guard — 3 sends, must end with exactly 1 row ===")
    sb_delete("transactions", f"phone=eq.{EVAL_PHONE}&category=eq.{urllib.parse.quote('Food')}")
    time.sleep(0.5)

    steps = [
        ("spent 500 on food", "first log — should create the row"),
        ("spent 500 on food", "immediate repeat — guard should skip"),
        ("did you log my 500 for food?", "question about it — must not log"),
    ]
    for msg, note in steps:
        resp = call_chat(msg)
        executed = resp.get("actions_executed") or []
        dup = any(a.get("duplicate") for a in executed)
        print(f"  sent: {msg!r:40} actions={[a.get('type') for a in executed]} duplicate={dup}  ({note})")
        time.sleep(REQUEST_DELAY)

    final = _count_expense_rows(500, "Food")
    ok = final == 1
    print(f"\n  Rows in DB after 3 sends: {final} (expected 1)  ->  {'PASS' if ok else 'FAIL'}")
    return (1 if ok else 0), 1


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ variants) must be set in the environment.")
        sys.exit(1)

    print(f"Eval target: {API_BASE}  |  eval phone: {EVAL_PHONE}")
    ensure_eval_user()
    try:
        intent_passed, intent_total = run_intent_accuracy()
        ground_passed, ground_total = run_grounding()
        dup_passed, dup_total = run_duplicate_guard()
    finally:
        print("\nCleaning up eval data...")
        cleanup_eval_data()

    print("\n=== Summary ===")
    print(f"Intent accuracy:  {intent_passed}/{intent_total} = {100*intent_passed/intent_total:.1f}%")
    if ground_total:
        print(f"Grounding rate:   {ground_passed}/{ground_total} = {100*ground_passed/ground_total:.1f}%")
    print(f"Duplicate guard:  {dup_passed}/{dup_total} = {100*dup_passed/dup_total:.0f}%")
    print("\nTarget from docs/AI_AGENTS_RAG_PRD.md: track all three over time as prompt/retrieval changes ship.")


if __name__ == "__main__":
    main()
