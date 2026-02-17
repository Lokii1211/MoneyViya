"""
MoneyViya Dashboard Sync API
=============================
Real-time data bridge between WhatsApp bot and Web Dashboard.
All data stored by the WhatsApp agent is accessible here.
Updates from web sync back to the same data store.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json, os

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Sync"])

DATA_DIR = "data/users"

# ============ HELPERS ============
def get_user_data(phone: str) -> dict:
    """Load user data from the same store WhatsApp agent uses"""
    filepath = os.path.join(DATA_DIR, f"{phone}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_user_data(phone: str, data: dict):
    """Save user data — same store WhatsApp agent reads"""
    os.makedirs(DATA_DIR, exist_ok=True)
    filepath = os.path.join(DATA_DIR, f"{phone}.json")
    data["last_updated"] = datetime.now().isoformat()
    data["updated_from"] = "web_dashboard"
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def calculate_health_score(data: dict) -> int:
    """Calculate financial health score 0-100"""
    score = 50
    txns = data.get("transactions", [])
    goals = data.get("goals", [])
    income = sum(t.get("amount", 0) for t in txns if t.get("type") == "income")
    expense = sum(t.get("amount", 0) for t in txns if t.get("type") == "expense")
    if income > 0:
        savings_rate = (income - expense) / income
        score += int(savings_rate * 30)
    if len(goals) > 0:
        score += 10
    streak = data.get("streak", 0)
    score += min(streak, 10)
    return max(0, min(100, score))

def get_health_label(score: int) -> str:
    if score >= 80: return "Financial Champion 🏆"
    if score >= 60: return "Financial Achiever 💪"
    if score >= 40: return "Growing Saver 🌱"
    return "Just Starting 🌟"

# ============ MODELS ============
class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: str = ""
    type: str = "expense"

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    emoji: str = "🎯"
    deadline_days: int = 365

class GoalUpdate(BaseModel):
    amount_to_add: float

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    monthly_income: Optional[float] = None
    occupation: Optional[str] = None

# ============ ENDPOINTS ============

@router.get("/overview/{phone}")
async def get_overview(phone: str):
    """Full dashboard overview — single API call for all dashboard data"""
    data = get_user_data(phone)
    if not data:
        raise HTTPException(404, "User not found. Start on WhatsApp first!")
    
    txns = data.get("transactions", [])
    goals = data.get("goals", [])
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)
    
    # Monthly calculations
    monthly_txns = [t for t in txns if t.get("date", "") >= month_start.strftime("%Y-%m-%d")]
    monthly_income = sum(t["amount"] for t in monthly_txns if t.get("type") == "income")
    monthly_expense = sum(t["amount"] for t in monthly_txns if t.get("type") == "expense")
    monthly_savings = monthly_income - monthly_expense
    
    # Category breakdown
    categories = {}
    for t in monthly_txns:
        if t.get("type") == "expense":
            cat = t.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + t.get("amount", 0)
    
    # Daily spending (last 30 days)
    daily = {}
    for t in txns:
        d = t.get("date", "")[:10]
        if t.get("type") == "expense":
            daily[d] = daily.get(d, 0) + t.get("amount", 0)
    
    health_score = calculate_health_score(data)
    budget = data.get("monthly_budget", monthly_income * 0.7 if monthly_income else 20000)
    
    return {
        "user": {
            "name": data.get("name", "Friend"),
            "phone": phone,
            "language": data.get("language", "en"),
            "occupation": data.get("occupation", ""),
            "monthly_income": data.get("monthly_income", 0),
            "onboarding_complete": data.get("onboarding_complete", False),
            "streak": data.get("streak", 0),
        },
        "health": {
            "score": health_score,
            "label": get_health_label(health_score),
            "streak": data.get("streak", 0),
        },
        "monthly": {
            "income": monthly_income,
            "expense": monthly_expense,
            "savings": monthly_savings,
            "budget": budget,
            "budget_used_pct": round((monthly_expense / budget * 100) if budget > 0 else 0, 1),
            "days_in_month": now.day,
        },
        "categories": categories,
        "daily_spending": daily,
        "goals": [{
            "id": i,
            "name": g.get("name", "Goal"),
            "emoji": g.get("emoji", "🎯"),
            "target": g.get("target_amount", 0),
            "saved": g.get("saved_amount", 0),
            "progress": round(g.get("saved_amount", 0) / g.get("target_amount", 1) * 100, 1),
            "deadline": g.get("deadline", ""),
            "status": "Achieved 🎉" if g.get("saved_amount", 0) >= g.get("target_amount", 1) else "On Track ✅" if g.get("saved_amount", 0) / g.get("target_amount", 1) > 0.5 else "In Progress"
        } for i, g in enumerate(goals)],
        "recent_transactions": sorted(txns, key=lambda x: x.get("date", ""), reverse=True)[:15],
        "investments": data.get("investments", {}),
        "last_synced": data.get("last_updated", now.isoformat()),
    }

@router.get("/transactions/{phone}")
async def get_transactions(phone: str, limit: int = 50, offset: int = 0):
    data = get_user_data(phone)
    txns = sorted(data.get("transactions", []), key=lambda x: x.get("date", ""), reverse=True)
    return {"transactions": txns[offset:offset+limit], "total": len(txns)}

@router.post("/transactions/{phone}")
async def add_transaction(phone: str, txn: TransactionCreate):
    """Add transaction from web — syncs to WhatsApp data"""
    data = get_user_data(phone)
    if not data:
        raise HTTPException(404, "User not found")
    txns = data.get("transactions", [])
    new_txn = {
        "amount": txn.amount,
        "category": txn.category,
        "description": txn.description,
        "type": txn.type,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source": "web_dashboard"
    }
    txns.append(new_txn)
    data["transactions"] = txns
    save_user_data(phone, data)
    return {"success": True, "transaction": new_txn, "message": "Synced! Will reflect in WhatsApp too."}

@router.get("/goals/{phone}")
async def get_goals(phone: str):
    data = get_user_data(phone)
    return {"goals": data.get("goals", [])}

@router.post("/goals/{phone}")
async def add_goal(phone: str, goal: GoalCreate):
    data = get_user_data(phone)
    if not data:
        raise HTTPException(404, "User not found")
    goals = data.get("goals", [])
    new_goal = {
        "name": goal.name,
        "emoji": goal.emoji,
        "target_amount": goal.target_amount,
        "saved_amount": 0,
        "deadline": (datetime.now() + timedelta(days=goal.deadline_days)).strftime("%Y-%m-%d"),
        "created": datetime.now().isoformat(),
        "source": "web_dashboard"
    }
    goals.append(new_goal)
    data["goals"] = goals
    save_user_data(phone, data)
    return {"success": True, "goal": new_goal}

@router.put("/goals/{phone}/{goal_id}")
async def update_goal(phone: str, goal_id: int, update: GoalUpdate):
    data = get_user_data(phone)
    goals = data.get("goals", [])
    if goal_id >= len(goals):
        raise HTTPException(404, "Goal not found")
    goals[goal_id]["saved_amount"] = goals[goal_id].get("saved_amount", 0) + update.amount_to_add
    data["goals"] = goals
    save_user_data(phone, data)
    return {"success": True, "goal": goals[goal_id]}

@router.put("/profile/{phone}")
async def update_profile(phone: str, profile: ProfileUpdate):
    data = get_user_data(phone)
    if not data:
        raise HTTPException(404, "User not found")
    if profile.name: data["name"] = profile.name
    if profile.language: data["language"] = profile.language
    if profile.monthly_income: data["monthly_income"] = profile.monthly_income
    if profile.occupation: data["occupation"] = profile.occupation
    save_user_data(phone, data)
    return {"success": True, "message": "Profile updated! Changes sync to WhatsApp."}

@router.post("/onboard/{phone}")
async def web_onboard(phone: str, profile: dict):
    """Onboard user from web — creates same data structure as WhatsApp onboarding"""
    data = get_user_data(phone) or {}
    data.update({
        "name": profile.get("name", "Friend"),
        "phone": phone,
        "language": profile.get("language", "en"),
        "occupation": profile.get("occupation", ""),
        "monthly_income": profile.get("monthly_income", 0),
        "primary_goal": profile.get("primary_goal", ""),
        "onboarding_complete": True,
        "onboarding_source": "web",
        "created": datetime.now().isoformat(),
        "transactions": data.get("transactions", []),
        "goals": data.get("goals", []),
        "streak": 0,
    })
    # Create initial goal if provided
    if profile.get("primary_goal") and profile.get("goal_amount"):
        data["goals"].append({
            "name": profile["primary_goal"],
            "emoji": {"Buy a Home": "🏠", "Buy a Vehicle": "🚗", "Education": "🎓",
                      "Travel": "🌴", "Emergency Fund": "🛡️", "Start Investing": "💰",
                      "Clear Debt": "💳"}.get(profile["primary_goal"], "🎯"),
            "target_amount": profile["goal_amount"],
            "saved_amount": 0,
            "deadline": (datetime.now() + timedelta(days=profile.get("goal_timeline", 365))).strftime("%Y-%m-%d"),
            "created": datetime.now().isoformat(),
            "source": "web_onboarding"
        })
    save_user_data(phone, data)
    return {"success": True, "message": "Welcome! Open WhatsApp to chat with Viya."}
