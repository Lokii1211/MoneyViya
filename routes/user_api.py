"""
User & transaction routes — dashboard CRUD endpoints
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from urllib.parse import unquote
from datetime import datetime

from database.user_repository import user_repo
from database.transaction_repository import transaction_repo
from database.goal_repository import goal_repo
from database.budget_repository import budget_repo

router = APIRouter(tags=["user"])


# ---------- Pydantic models ----------

class TransactionPayload(BaseModel):
    phone: str
    amount: int
    type: str
    category: Optional[str] = None
    description: Optional[str] = ""

class GoalPayload(BaseModel):
    phone: str
    goal_type: str
    target_amount: int
    target_date: str
    name: Optional[str] = None


# ---------- Helpers ----------

def _clean_phone(phone: str) -> str:
    """Decode and normalise phone from URL path."""
    phone = unquote(phone)
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone


# ---------- User ----------

@router.get("/user/{phone}")
def get_user(phone: str):
    """Get user with recent transactions."""
    phone = _clean_phone(phone)
    user = user_repo.get_user(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = transaction_repo.get_transactions(phone) or []
    user["recent_transactions"] = transactions[-10:]
    return user


# ---------- Transactions ----------

@router.post("/transaction")
async def add_transaction(txn: TransactionPayload):
    """Add a transaction from the dashboard."""
    user = user_repo.get_user(txn.phone)
    if not user:
        user = user_repo.create_user(txn.phone)

    transaction_repo.add_transaction(
        txn.phone,
        txn.amount,
        txn.type,
        txn.category or "other",
        description=txn.description or "Added from dashboard",
        source="DASHBOARD",
    )

    return {"success": True, "message": f"{txn.type.capitalize()} of ₹{txn.amount:,} recorded!"}


# ---------- Summary ----------

@router.get("/summary/{phone}")
async def get_summary(phone: str, period: str = "week"):
    """Financial summary for the dashboard."""
    phone = _clean_phone(phone)
    user = user_repo.get_user(phone)
    empty = {
        "income": 0, "expense": 0, "name": "User",
        "daily_budget": 0,
        "chart_data": {"labels": [], "income": [], "expense": []},
        "categories": {},
    }
    if not user:
        return empty

    transactions = transaction_repo.get_transactions(phone) or []
    total_income = sum(t.get("amount", 0) for t in transactions if t.get("type") == "income")
    total_expense = sum(t.get("amount", 0) for t in transactions if t.get("type") == "expense")

    categories = {}
    for t in transactions:
        if t.get("type") == "expense":
            cat = t.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + t.get("amount", 0)

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return {
        "income": total_income,
        "expense": total_expense,
        "name": user.get("name", "User"),
        "daily_budget": max(0, (total_income - total_expense) // 30),
        "chart_data": {"labels": days, "income": [0]*7, "expense": [0]*7},
        "categories": categories,
    }


# ---------- Goals ----------

@router.post("/goal")
async def create_goal(goal: GoalPayload):
    """Create a financial goal."""
    user = user_repo.get_user(goal.phone)
    if not user:
        user = user_repo.create_user(goal.phone)

    goal_repo.add_goal(
        goal.phone,
        goal.goal_type,
        goal.target_amount,
        goal.target_date,
        name=goal.name or goal.goal_type,
    )

    return {"success": True, "message": f"Goal '{goal.name or goal.goal_type}' created!"}


@router.get("/goals/{phone}")
async def get_goals(phone: str):
    """List all goals for a user."""
    phone = _clean_phone(phone)
    goals = goal_repo.get_goals(phone) or []
    return {"goals": goals}
