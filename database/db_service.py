"""
MoneyViya Database Service
===========================
SQLite for local development, Supabase for production.
Auto-initializes tables on startup.
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta
from contextlib import contextmanager

DATABASE_PATH = os.path.join("data", "moneyviya.db")
SCHEMA_PATH = os.path.join("database", "schema.sql")


class DatabaseService:
    def __init__(self):
        os.makedirs("data", exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize database with schema."""
        with self._get_conn() as conn:
            if os.path.exists(SCHEMA_PATH):
                with open(SCHEMA_PATH) as f:
                    conn.executescript(f.read())
                print("[DB] Schema initialized ✅")
            else:
                print("[DB] Schema file not found, skipping init")

    @contextmanager
    def _get_conn(self):
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    # ==================== USER OPERATIONS ====================

    def get_user(self, phone: str) -> dict | None:
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE phone=?", (phone,)).fetchone()
            return dict(row) if row else None

    def create_user(self, phone: str, name: str = None, password_hash: str = None) -> dict:
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO users (phone, name, password_hash) VALUES (?, ?, ?)",
                (phone, name, password_hash)
            )
            row = conn.execute("SELECT * FROM users WHERE phone=?", (phone,)).fetchone()
            return dict(row) if row else None

    def update_user(self, phone: str, **fields) -> dict:
        if not fields:
            return self.get_user(phone)
        sets = ", ".join(f"{k}=?" for k in fields)
        vals = list(fields.values()) + [phone]
        with self._get_conn() as conn:
            conn.execute(f"UPDATE users SET {sets}, updated_at=CURRENT_TIMESTAMP WHERE phone=?", vals)
        return self.get_user(phone)

    # ==================== TRANSACTION OPERATIONS ====================

    def add_transaction(self, phone: str, txn_type: str, amount: float,
                        category: str = "uncategorized", description: str = "",
                        source: str = "manual", merchant: str = None) -> int:
        with self._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO transactions (phone, type, amount, category, description, source, merchant) VALUES (?,?,?,?,?,?,?)",
                (phone, txn_type, amount, category, description, source, merchant)
            )
            return cursor.lastrowid

    def get_transactions(self, phone: str, limit: int = 50, days: int = 30) -> list:
        since = (datetime.now() - timedelta(days=days)).isoformat()
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM transactions WHERE phone=? AND created_at>=? ORDER BY created_at DESC LIMIT ?",
                (phone, since, limit)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_today_totals(self, phone: str) -> dict:
        today = datetime.now().strftime("%Y-%m-%d")
        with self._get_conn() as conn:
            income = conn.execute(
                "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE phone=? AND type='income' AND date(created_at)=?",
                (phone, today)
            ).fetchone()["total"]
            expense = conn.execute(
                "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE phone=? AND type='expense' AND date(created_at)=?",
                (phone, today)
            ).fetchone()["total"]
        return {"today_income": income, "today_expense": expense}

    def get_monthly_totals(self, phone: str) -> dict:
        month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        with self._get_conn() as conn:
            income = conn.execute(
                "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE phone=? AND type='income' AND date(created_at)>=?",
                (phone, month_start)
            ).fetchone()["total"]
            expense = conn.execute(
                "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE phone=? AND type='expense' AND date(created_at)>=?",
                (phone, month_start)
            ).fetchone()["total"]
            categories = conn.execute(
                "SELECT category, SUM(amount) as total FROM transactions WHERE phone=? AND type='expense' AND date(created_at)>=? GROUP BY category ORDER BY total DESC",
                (phone, month_start)
            ).fetchall()
        return {
            "monthly_income": income,
            "monthly_expenses": expense,
            "category_breakdown": [dict(c) for c in categories]
        }

    # ==================== GOAL OPERATIONS ====================

    def add_goal(self, phone: str, name: str, target: float, icon: str = "🎯", deadline: str = None) -> int:
        with self._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO goals (phone, name, target_amount, icon, deadline) VALUES (?,?,?,?,?)",
                (phone, name, target, icon, deadline)
            )
            return cursor.lastrowid

    def get_goals(self, phone: str) -> list:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM goals WHERE phone=? AND status='active' ORDER BY priority", (phone,)
            ).fetchall()
            return [dict(r) for r in rows]

    def update_goal_progress(self, goal_id: int, amount: float) -> dict:
        with self._get_conn() as conn:
            conn.execute("UPDATE goals SET current_amount=current_amount+? WHERE id=?", (amount, goal_id))
            goal = conn.execute("SELECT * FROM goals WHERE id=?", (goal_id,)).fetchone()
            if goal and goal["current_amount"] >= goal["target_amount"]:
                conn.execute("UPDATE goals SET status='achieved' WHERE id=?", (goal_id,))
            return dict(goal) if goal else {}

    # ==================== HABIT OPERATIONS ====================

    def add_habit(self, phone: str, name: str, icon: str = "✅") -> int:
        with self._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO habits (phone, name, icon) VALUES (?,?,?)",
                (phone, name, icon)
            )
            return cursor.lastrowid

    def get_habits(self, phone: str) -> list:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT * FROM habits WHERE phone=?", (phone,)).fetchall()
            return [dict(r) for r in rows]

    def log_habit(self, phone: str, habit_id: int) -> dict:
        today = datetime.now().strftime("%Y-%m-%d")
        with self._get_conn() as conn:
            # Check if already logged today
            existing = conn.execute(
                "SELECT * FROM habit_logs WHERE phone=? AND habit_id=? AND date(completed_at)=?",
                (phone, habit_id, today)
            ).fetchone()
            if existing:
                return {"already_logged": True}

            conn.execute(
                "INSERT INTO habit_logs (phone, habit_id) VALUES (?,?)",
                (phone, habit_id)
            )

            # Update streak
            habit = conn.execute("SELECT * FROM habits WHERE id=?", (habit_id,)).fetchone()
            if habit:
                last = habit["last_completed"]
                yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
                new_streak = habit["current_streak"] + 1 if last == yesterday else 1
                longest = max(habit["longest_streak"], new_streak)
                conn.execute(
                    "UPDATE habits SET current_streak=?, longest_streak=?, last_completed=? WHERE id=?",
                    (new_streak, longest, today, habit_id)
                )
                return {"streak": new_streak, "longest": longest}
        return {}

    # ==================== NOTIFICATION OPERATIONS ====================

    def add_notification(self, phone: str, title: str, description: str = "",
                         notif_type: str = "info", action_url: str = None) -> int:
        with self._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO notifications (phone, type, title, description, action_url) VALUES (?,?,?,?,?)",
                (phone, notif_type, title, description, action_url)
            )
            return cursor.lastrowid

    def get_notifications(self, phone: str, limit: int = 20) -> list:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM notifications WHERE phone=? ORDER BY created_at DESC LIMIT ?",
                (phone, limit)
            ).fetchall()
            return [dict(r) for r in rows]

    def mark_read(self, phone: str, notif_id: int = None):
        with self._get_conn() as conn:
            if notif_id:
                conn.execute("UPDATE notifications SET is_read=TRUE WHERE id=? AND phone=?", (notif_id, phone))
            else:
                conn.execute("UPDATE notifications SET is_read=TRUE WHERE phone=?", (phone,))

    # ==================== SUBSCRIPTION OPERATIONS ====================

    def add_subscription(self, phone: str, name: str, amount: float,
                         category: str = "entertainment") -> int:
        with self._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO subscriptions (phone, name, amount, category) VALUES (?,?,?,?)",
                (phone, name, amount, category)
            )
            return cursor.lastrowid

    def get_subscriptions(self, phone: str) -> list:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM subscriptions WHERE phone=? AND is_active=TRUE", (phone,)
            ).fetchall()
            return [dict(r) for r in rows]

    def cancel_subscription(self, phone: str, sub_id: int):
        with self._get_conn() as conn:
            conn.execute("UPDATE subscriptions SET is_active=FALSE WHERE id=? AND phone=?", (sub_id, phone))

    # ==================== REVIEW OPERATIONS ====================

    def save_review(self, phone: str, period: str, start: str, end: str,
                    income: float, expenses: float, top_cat: str = None,
                    score: int = 50, insights: str = None) -> int:
        with self._get_conn() as conn:
            savings_rate = ((income - expenses) / income * 100) if income > 0 else 0
            cursor = conn.execute(
                """INSERT INTO reviews (phone, period, start_date, end_date, total_income, 
                   total_expenses, savings_rate, top_category, financial_health_score, ai_insights) 
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (phone, period, start, end, income, expenses, savings_rate, top_cat, score, insights)
            )
            return cursor.lastrowid

    def get_reviews(self, phone: str, limit: int = 10) -> list:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM reviews WHERE phone=? ORDER BY created_at DESC LIMIT ?",
                (phone, limit)
            ).fetchall()
            return [dict(r) for r in rows]


# Singleton
db = DatabaseService()
