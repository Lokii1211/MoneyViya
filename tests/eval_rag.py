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

# ── Golden set — hand-labeled (message, expected_intent) pairs. None means
# plain conversation; no action should fire. Deliberately varied phrasing,
# slang, and language (Hinglish/Tanglish included) — this is a natural-
# language-understanding system, not a keyword matcher, per the system
# prompt in chat.py, so the eval set has to reflect that. ──
GOLDEN_SET = [
    # LOG_EXPENSE
    ("spent 500 on swiggy", "LOG_EXPENSE"),
    ("just blew 300 bucks on a movie", "LOG_EXPENSE"),
    ("paid 1200 for electricity bill", "LOG_EXPENSE"),
    ("swiggy order cost me 450rs", "LOG_EXPENSE"),
    ("damn uber took 220 from me", "LOG_EXPENSE"),
    ("bought groceries for 800", "LOG_EXPENSE"),
    ("2000 rupees gone on rent today", "LOG_EXPENSE"),
    ("paid the phone bill, 399", "LOG_EXPENSE"),
    ("spent five hundred on food", "LOG_EXPENSE"),
    ("100 rs auto fare", "LOG_EXPENSE"),
    ("dropped 999 on a new shirt from myntra", "LOG_EXPENSE"),
    ("chai pe 20 rupaye kharch kiye", "LOG_EXPENSE"),
    ("paid 5000 towards my credit card bill", "LOG_EXPENSE"),
    ("swiggy pe 350 kharch hue", "LOG_EXPENSE"),
    ("naan food ku 200 rooba selavu pannen", "LOG_EXPENSE"),
    ("gave 150 to the cab guy", "LOG_EXPENSE"),
    ("blew 3000 on a new pair of shoes", "LOG_EXPENSE"),
    ("bill vந்து 600 pay pannen electricity ku", "LOG_EXPENSE"),
    ("recharge ke liye 199 diye", "LOG_EXPENSE"),
    ("ordered zomato, 320 bucks", "LOG_EXPENSE"),

    # LOG_INCOME
    ("got my salary, 45000", "LOG_INCOME"),
    ("received 2000 as a freelance payment", "LOG_INCOME"),
    ("earned 500 bucks doing a side gig", "LOG_INCOME"),
    ("mujhe 10000 mile hai bonus mein", "LOG_INCOME"),
    ("client paid me 15000 today", "LOG_INCOME"),
    ("got a refund of 300 from amazon", "LOG_INCOME"),
    ("credited 5000 rupees today, freelance work", "LOG_INCOME"),
    ("dad sent me 2000", "LOG_INCOME"),
    ("got paid 800 for the tuition class", "LOG_INCOME"),

    # CREATE_REMINDER
    ("remind me at 6pm to call mom", "CREATE_REMINDER"),
    ("set a reminder for tomorrow 9am to pay rent", "CREATE_REMINDER"),
    ("don't let me forget the dentist appointment at 3", "CREATE_REMINDER"),
    ("ping me at 10 to take my medicine", "CREATE_REMINDER"),
    ("nudge me tonight at 8 to log my expenses", "CREATE_REMINDER"),
    ("mujhe 7 baje yaad dilana bill pay karne ke liye", "CREATE_REMINDER"),
    ("wake me up at 6am reminder", "CREATE_REMINDER"),
    ("alert me at 11 to submit the form", "CREATE_REMINDER"),
    ("can you remind me tomorrow morning to call the bank", "CREATE_REMINDER"),

    # MARK_HABIT
    ("went for my morning run", "MARK_HABIT"),
    ("done with workout", "MARK_HABIT"),
    ("finished meditating today", "MARK_HABIT"),
    ("5k done", "MARK_HABIT"),
    ("did my reading for today", "MARK_HABIT"),
    ("completed yoga session", "MARK_HABIT"),
    ("gym done for today", "MARK_HABIT"),
    ("i journaled today", "MARK_HABIT"),

    # CREATE_HABIT
    ("i want to start tracking drinking water daily", "CREATE_HABIT"),
    ("let's add a new habit for journaling", "CREATE_HABIT"),
    ("track my daily pushups from now on", "CREATE_HABIT"),
    ("i want to build a habit of reading every day", "CREATE_HABIT"),
    ("start tracking my sleep habit", "CREATE_HABIT"),

    # CREATE_GOAL
    ("i want to save 50000 for a trip to goa by december", "CREATE_GOAL"),
    ("help me save up for a new laptop, target 60000", "CREATE_GOAL"),
    ("create a goal to save 100000 for emergency fund", "CREATE_GOAL"),
    ("mujhe shaadi ke liye 200000 bachana hai", "CREATE_GOAL"),
    ("set up a savings goal of 25000 for a new phone", "CREATE_GOAL"),
    ("i need to save 15000 for my sister's birthday gift", "CREATE_GOAL"),

    # LOG_HEALTH
    ("walked 8000 steps today", "LOG_HEALTH"),
    ("drank 6 glasses of water", "LOG_HEALTH"),
    ("my weight today is 72 kg", "LOG_HEALTH"),
    ("logged 10000 steps", "LOG_HEALTH"),
    ("weighed myself, 65kg", "LOG_HEALTH"),

    # REMEMBER
    ("remember that my rent is due on the 5th every month", "REMEMBER"),
    ("just so you know, my landlord's name is Suresh", "REMEMBER"),
    ("note that i'm allergic to peanuts", "REMEMBER"),
    ("keep in mind my anniversary is on the 14th", "REMEMBER"),
    ("remember my bank is HDFC", "REMEMBER"),

    # NONE — plain conversation, no action should fire
    ("how am i doing this month financially", None),
    ("what should i invest in", None),
    ("give me some tips to save more", None),
    ("hi", None),
    ("how's the market today", None),
    ("what's my current streak on my habits", None),
    ("thank you", None),
    ("can you explain what a mutual fund is", None),
    ("what's the difference between a mutual fund and a fixed deposit", None),
    ("how much have i spent this week", None),
    ("am i on track with my goals", None),
    ("what's a good savings rate for my age", None),
    ("hello viya", None),
    ("what can you help me with", None),
    ("is now a good time to buy gold", None),

    # NONE — the LOG-vs-ASK trap: these all contain amounts / food / money
    # words but are QUESTIONS or CONFIRMATIONS about existing data, NOT new
    # events. Firing any logging ACTION here is the exact bug this guards.
    ("did you log my 500 for food?", None),
    ("is my lunch saved?", None),
    ("how much did i spend on food today", None),
    ("what did i log today", None),
    ("show me my expenses", None),
    ("did i already add the 500 swiggy expense", None),
    ("so the 2000 rent is logged right?", None),
    ("was that 300 movie expense saved", None),
    ("can you check if i logged my salary this month", None),
    ("how much have i lent to rahul", None),
    ("is my water intake logged for today", None),
    ("what's my total spent on food this week", None),
    ("should i spend 5000 on this phone?", None),
    ("if i invest 10000 in this fund what happens", None),
    ("i'm planning to save 50000 next year", None),
    ("delete my last expense", None),
    ("actually that food expense was 400 not 500", None),
    ("remind me what i spent on groceries", None),
]

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
