"""
Viya — Offline action-execution + duplicate-guard test
========================================================
The other harness (eval_rag.py) measures whether the LLM picks the right
ACTION — that needs the live Groq endpoint. THIS one tests the half that's
fully deterministic and needs no network or API quota: given an ACTION line,
does chat.py's execute_actions() write the right thing, and does the
recent_duplicate() guard actually stop a second identical log?

It imports chat.py directly and monkeypatches its Supabase layer (sb_get /
sb_post / sb_patch) with an in-memory fake DB that understands the handful of
PostgREST filters the code actually builds (eq./gte.). So it exercises the
REAL parsing and the REAL guard query string — including the quote()/window
logic — not a reimplementation.

Run:  python3 tests/test_actions_offline.py
Exit code is nonzero if anything fails, so it can gate a commit/CI.
"""

import os
import sys
from datetime import datetime, timedelta
from urllib.parse import unquote

API_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "api")
sys.path.insert(0, API_DIR)

import chat  # noqa: E402


class FakeDB:
    """Minimal in-memory PostgREST stand-in. Rows get a synthetic id and a
    created_at (utcnow) on insert unless one is supplied — matching the real
    table defaults the code relies on."""

    def __init__(self):
        self.tables = {}
        self._id = 0

    def post(self, table, data, upsert=False):
        row = dict(data)
        self._id += 1
        row.setdefault("id", self._id)
        row.setdefault("created_at", datetime.utcnow().isoformat())
        self.tables.setdefault(table, []).append(row)
        return row

    def patch(self, table, filt, data):
        return data

    def get(self, path):
        table, _, qs = path.partition("?")
        rows = self.tables.get(table, [])
        conds = []
        for part in qs.split("&"):
            if "=" not in part:
                continue
            k, v = part.split("=", 1)
            if k in ("select", "limit", "order"):
                continue
            if v.startswith("eq."):
                conds.append((k, "eq", unquote(v[3:])))
            elif v.startswith("gte."):
                conds.append((k, "gte", unquote(v[4:])))
        out = [r for r in rows if all(self._match(r, k, op, val) for k, op, val in conds)]
        return out

    @staticmethod
    def _match(row, key, op, val):
        actual = row.get(key)
        if actual is None:
            return False
        if op == "eq":
            return str(actual) == val
        if op == "gte":
            return str(actual) >= val
        return False

    def seed(self, table, row):
        self._id += 1
        row.setdefault("id", self._id)
        self.tables.setdefault(table, []).append(row)

    def count(self, table, **eq):
        return sum(1 for r in self.tables.get(table, []) if all(str(r.get(k)) == str(v) for k, v in eq.items()))


PHONE = "9000000009"
SHORT = "9000000009"
_results = []


def _check(name, cond, detail=""):
    _results.append((name, bool(cond), detail))
    print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f"  — {detail}" if detail and not cond else ""))


def with_fake(fn):
    """Run fn with chat's Supabase layer swapped for a fresh FakeDB."""
    db = FakeDB()
    orig = (chat.sb_get, chat.sb_post, chat.sb_patch)
    chat.sb_get, chat.sb_post, chat.sb_patch = db.get, db.post, db.patch
    try:
        return fn(db)
    finally:
        chat.sb_get, chat.sb_post, chat.sb_patch = orig


# ── Parser / column-mapping: the right ACTION line writes the right row ──
def test_parser():
    print("\n=== Parser → correct table + columns ===")

    def one(action_line, table, checks, seed=None):
        def run(db):
            if seed:
                for t, row in seed:
                    db.seed(t, row)
            chat.execute_actions([action_line], PHONE)
            rows = [r for r in db.tables.get(table, []) if r.get("phone") == SHORT or r.get("user_phone") == SHORT or table in ("habit_checkins",)]
            match = any(all(str(r.get(k)) == str(v) for k, v in checks.items()) for r in rows)
            _check(f"{action_line.split(':')[1]} → {table}", match,
                   f"looked for {checks} in {rows}")
        with_fake(run)

    one("ACTION:LOG_EXPENSE:500:Food:swiggy", "transactions",
        {"type": "expense", "amount": 500.0, "category": "Food", "description": "swiggy"})
    one("ACTION:LOG_INCOME:45000:Salary", "transactions",
        {"type": "income", "amount": 45000.0, "category": "Salary"})
    one("ACTION:CREATE_GOAL:Goa Trip:50000:2025-12-31", "goals",
        {"name": "Goa Trip", "target_amount": 50000.0})
    one("ACTION:CREATE_HABIT:Read daily:📖", "habits", {"name": "Read daily", "icon": "📖"})
    one("ACTION:LOG_HEALTH:8000:6:0", "health_logs", {"steps": 8000, "water_glasses": 6})
    one("ACTION:LOG_MEAL:Dosa:breakfast:250", "meals",
        {"name": "Dosa", "meal_type": "breakfast", "calories": 250})
    one("ACTION:LOG_LENDING:given:Rahul:20000:2:5", "lending",
        {"type": "given", "person_name": "Rahul", "amount": 20000.0, "interest_rate": 2.0})
    one("ACTION:CREATE_BILL:Netflix:500:3:monthly:subscription", "bills_and_dues",
        {"name": "Netflix", "bill_type": "subscription", "amount": 500.0})
    one("ACTION:LOG_INVESTMENT:Axis Bluechip:mutual_fund:5000:yes", "investments",
        {"name": "Axis Bluechip", "investment_type": "mutual_fund", "invested_amount": 5000.0, "is_sip": True})
    one("ACTION:ADD_MEDICINE:BP Tablet:1 tab:21:00:daily", "medicines",
        {"name": "BP Tablet", "frequency": "daily"})
    one("ACTION:LOG_JOURNAL:Rough day at work:stressed", "journal", {"mood": "stressed"})
    one("ACTION:REMEMBER:landlord:Suresh", "viya_memory", {"content": "landlord: Suresh"})
    # CREATE_REMINDER writes the schema-correct columns (regression guard for
    # the reminder_date/is_active bug that silently dropped every reminder).
    one("ACTION:CREATE_REMINDER:Call mom:18:00:daily:", "user_reminders",
        {"title": "Call mom", "time": "18:00", "freq": "daily", "enabled": True})
    # MARK_HABIT needs an existing habit to match against.
    one("ACTION:MARK_HABIT:run", "habit_checkins", {"phone": SHORT, "status": "done"},
        seed=[("habits", {"phone": SHORT, "name": "Morning run", "current_streak": 3, "longest_streak": 5})])


# ── Duplicate guard: identical log within the window must be skipped ──
def test_duplicate_guard():
    print("\n=== Duplicate guard (recent_duplicate) ===")

    def repeat_expense(db):
        for _ in range(3):
            chat.execute_actions(["ACTION:LOG_EXPENSE:500:Food:swiggy"], PHONE)
        _check("expense logged 3x → 1 row", db.count("transactions", type="expense", amount=500.0, category="Food") == 1,
               f"rows={db.count('transactions', type='expense', amount=500.0, category='Food')}")
    with_fake(repeat_expense)

    def different_amount(db):
        chat.execute_actions(["ACTION:LOG_EXPENSE:500:Food:swiggy"], PHONE)
        chat.execute_actions(["ACTION:LOG_EXPENSE:300:Food:zomato"], PHONE)
        _check("different amounts → 2 rows", db.count("transactions", type="expense", category="Food") == 2)
    with_fake(different_amount)

    def income_dup(db):
        for _ in range(2):
            chat.execute_actions(["ACTION:LOG_INCOME:45000:Salary"], PHONE)
        _check("income logged 2x → 1 row", db.count("transactions", type="income", amount=45000.0) == 1)
    with_fake(income_dup)

    def meal_dup(db):
        for _ in range(2):
            chat.execute_actions(["ACTION:LOG_MEAL:Dosa:breakfast:250"], PHONE)
        _check("meal logged 2x → 1 row", db.count("meals", name="Dosa", meal_type="breakfast") == 1)
    with_fake(meal_dup)

    def outside_window(db):
        old = (datetime.utcnow() - timedelta(minutes=10)).isoformat()
        db.seed("transactions", {"phone": SHORT, "type": "expense", "amount": 500.0, "category": "Food", "created_at": old})
        chat.execute_actions(["ACTION:LOG_EXPENSE:500:Food:swiggy"], PHONE)
        _check("identical but >3min apart → 2 rows (not a dup)",
               db.count("transactions", type="expense", amount=500.0, category="Food") == 2,
               f"rows={db.count('transactions', type='expense', amount=500.0, category='Food')}")
    with_fake(outside_window)

    def dup_flag_surfaced(db):
        chat.execute_actions(["ACTION:LOG_EXPENSE:500:Food:swiggy"], PHONE)
        ex = chat.execute_actions(["ACTION:LOG_EXPENSE:500:Food:swiggy"], PHONE)
        _check("2nd identical returns duplicate:true", any(e.get("duplicate") for e in ex), f"executed={ex}")
    with_fake(dup_flag_surfaced)


def main():
    print(f"Offline action test — importing chat.py from {API_DIR}")
    test_parser()
    test_duplicate_guard()
    passed = sum(1 for _, ok, _ in _results if ok)
    total = len(_results)
    print(f"\n=== {passed}/{total} passed ({100 * passed / total:.0f}%) ===")
    if passed != total:
        print("Failures:")
        for name, ok, detail in _results:
            if not ok:
                print(f"  - {name}: {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
