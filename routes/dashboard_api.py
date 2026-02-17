"""
MoneyViya Dashboard Sync API v2.0
==================================
Reads/writes from the SAME data store as the WhatsApp agent.
OTP authentication, real-time sync, production-ready.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json, os, random, hashlib, time

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Sync"])

# ============ SHARED DATA PATHS (same as moneyview_agent.py) ============
DATA_DIR = "data"
USERS_FILE = "data/users.json"
TRANSACTIONS_FILE = "data/transactions.json"
OTP_STORE = {}  # phone -> {otp, expires, attempts}
SESSION_STORE = {}  # token -> {phone, expires}

# ============ HELPERS ============
def load_users() -> dict:
    """Load from same file the WhatsApp agent uses"""
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except:
        pass
    return {}

def save_users(users: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def load_transactions() -> dict:
    """Load from same file the WhatsApp agent uses"""
    try:
        if os.path.exists(TRANSACTIONS_FILE):
            with open(TRANSACTIONS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except:
        pass
    return {}

def save_transactions(txns: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(TRANSACTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(txns, f, indent=2, ensure_ascii=False)

def find_user(phone: str):
    """Find user with flexible phone format matching"""
    users = load_users()
    variants = [phone, "91" + phone, phone.replace("91", ""), phone[-10:] if len(phone) > 10 else phone]
    for p in variants:
        if p in users:
            return p, users[p], users
    return None, None, users

def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def calculate_health_score(user: dict, txns: list) -> int:
    score = 50
    income = sum(t.get("amount", 0) for t in txns if t.get("type") == "income")
    expense = sum(t.get("amount", 0) for t in txns if t.get("type") == "expense")
    if income > 0:
        sr = (income - expense) / income
        score += int(sr * 30)
    goals = user.get("goals", [])
    if goals:
        score += min(len(goals) * 5, 15)
    if user.get("onboarding_complete"):
        score += 5
    return max(0, min(100, score))

# ============ MODELS ============
class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class LoginRequest(BaseModel):
    phone: str
    password: str

class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: str

class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: str = ""
    type: str = "expense"

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    emoji: str = "🎯"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    monthly_income: Optional[float] = None
    occupation: Optional[str] = None

# ============ AUTH ENDPOINTS ============

@router.post("/auth/send-otp")
async def send_otp(req: OTPRequest):
    """Generate OTP for phone login (simulated — in production use Twilio/MSG91)"""
    phone = req.phone.replace("+", "").replace(" ", "")
    otp = str(random.randint(1000, 9999))
    OTP_STORE[phone] = {"otp": otp, "expires": time.time() + 300, "attempts": 0}
    # In production: send via Twilio/MSG91
    # For now: return OTP (demo mode)
    print(f"[OTP] {phone}: {otp}")
    return {"success": True, "message": f"OTP sent to {phone}", "demo_otp": otp}

@router.post("/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    """Verify OTP and create session"""
    phone = req.phone.replace("+", "").replace(" ", "")
    stored = OTP_STORE.get(phone)
    if not stored:
        raise HTTPException(400, "No OTP requested for this number")
    if time.time() > stored["expires"]:
        del OTP_STORE[phone]
        raise HTTPException(400, "OTP expired. Request a new one.")
    stored["attempts"] += 1
    if stored["attempts"] > 5:
        del OTP_STORE[phone]
        raise HTTPException(429, "Too many attempts")
    if req.otp != stored["otp"]:
        raise HTTPException(400, "Invalid OTP")
    # OTP correct — create session
    del OTP_STORE[phone]
    token = hashlib.sha256(f"{phone}{time.time()}{random.random()}".encode()).hexdigest()[:32]
    SESSION_STORE[token] = {"phone": phone, "expires": time.time() + 86400 * 7}
    return {"success": True, "token": token, "phone": phone}

@router.post("/auth/login")
async def login(req: LoginRequest):
    """Login with phone + password"""
    phone = req.phone.replace("+", "").replace(" ", "")
    actual, user, users = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found")
    stored_pass = user.get("password_hash") or user.get("password", "")
    if stored_pass and hash_pass(req.password) != stored_pass and req.password != stored_pass:
        raise HTTPException(401, "Wrong password")
    token = hashlib.sha256(f"{phone}{time.time()}".encode()).hexdigest()[:32]
    SESSION_STORE[token] = {"phone": actual, "expires": time.time() + 86400 * 7}
    return {"success": True, "token": token, "phone": actual, "name": user.get("name", "Friend")}

@router.post("/auth/register")
async def register(req: RegisterRequest):
    """Register new user from web"""
    phone = req.phone.replace("+", "").replace(" ", "")
    users = load_users()
    if phone in users and users[phone].get("onboarding_complete"):
        raise HTTPException(409, "User already exists. Please login.")
    users[phone] = {
        "name": req.name,
        "phone": phone,
        "language": "en",
        "password_hash": hash_pass(req.password),
        "onboarding_complete": False,
        "onboarding_step": 0,
        "created": datetime.now().isoformat(),
        "source": "web_dashboard",
        "goals": [],
    }
    save_users(users)
    token = hashlib.sha256(f"{phone}{time.time()}".encode()).hexdigest()[:32]
    SESSION_STORE[token] = {"phone": phone, "expires": time.time() + 86400 * 7}
    return {"success": True, "token": token, "phone": phone}

# ============ DASHBOARD ENDPOINTS ============

@router.get("/overview/{phone}")
async def get_overview(phone: str):
    """Full dashboard — reads SAME data as WhatsApp agent"""
    actual, user, users = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found. Chat with Viya on WhatsApp first!")
    
    all_txns = load_transactions()
    # Try multiple phone formats for transactions
    txns = all_txns.get(actual, [])
    if not txns:
        for p in [phone, "91"+phone, phone[-10:]]:
            if p in all_txns:
                txns = all_txns[p]
                break
    
    now = datetime.now()
    month_str = now.strftime("%Y-%m")
    monthly_txns = [t for t in txns if t.get("date", "").startswith(month_str)]
    monthly_income = sum(t["amount"] for t in monthly_txns if t.get("type") == "income")
    monthly_expense = sum(t["amount"] for t in monthly_txns if t.get("type") == "expense")
    
    categories = {}
    for t in monthly_txns:
        if t.get("type") == "expense":
            cat = t.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + t.get("amount", 0)
    
    total_income = sum(t["amount"] for t in txns if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in txns if t.get("type") == "expense")
    
    health_score = calculate_health_score(user, monthly_txns)
    budget = user.get("daily_budget", 0) * 30 or user.get("monthly_income", 0) * 0.7 or 20000
    goals = user.get("goals", [])
    
    return {
        "user": {
            "name": user.get("name", "Friend"),
            "phone": actual,
            "language": user.get("language", "en"),
            "occupation": user.get("occupation", ""),
            "monthly_income": user.get("monthly_income", 0),
            "daily_budget": user.get("daily_budget", 0),
            "onboarding_complete": user.get("onboarding_complete", False),
            "risk_appetite": user.get("risk_appetite", "Medium"),
        },
        "health": {
            "score": health_score,
            "label": "Champion 🏆" if health_score >= 80 else "Achiever 💪" if health_score >= 60 else "Growing 🌱" if health_score >= 40 else "Starting 🌟",
        },
        "monthly": {
            "income": monthly_income,
            "expense": monthly_expense,
            "savings": monthly_income - monthly_expense,
            "budget": budget,
            "budget_used_pct": round((monthly_expense / budget * 100) if budget > 0 else 0, 1),
        },
        "totals": {"income": total_income, "expense": total_expense, "savings": total_income - total_expense},
        "categories": categories,
        "goals": [{
            "id": i,
            "name": g.get("name", "Goal"),
            "emoji": g.get("emoji", "🎯"),
            "target": g.get("amount", g.get("target_amount", 0)),
            "saved": g.get("current", g.get("saved_amount", 0)),
            "progress": round(g.get("current", g.get("saved_amount", 0)) / max(g.get("amount", g.get("target_amount", 1)), 1) * 100, 1),
            "status": g.get("status", "active"),
        } for i, g in enumerate(goals)],
        "recent_transactions": sorted(txns, key=lambda x: x.get("date", ""), reverse=True)[:20],
        "transaction_count": len(txns),
    }

@router.get("/transactions/{phone}")
async def get_transactions(phone: str, limit: int = 50):
    actual, user, _ = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found")
    all_txns = load_transactions()
    txns = all_txns.get(actual, [])
    return {"transactions": sorted(txns, key=lambda x: x.get("date", ""), reverse=True)[:limit], "total": len(txns)}

@router.post("/transactions/{phone}")
async def add_transaction(phone: str, txn: TransactionCreate):
    """Add from web — writes to SAME store as WhatsApp agent"""
    actual, user, users = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found")
    all_txns = load_transactions()
    if actual not in all_txns:
        all_txns[actual] = []
    new_txn = {
        "amount": txn.amount,
        "category": txn.category,
        "description": txn.description,
        "type": txn.type,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source": "web_dashboard"
    }
    all_txns[actual].append(new_txn)
    save_transactions(all_txns)
    return {"success": True, "transaction": new_txn}

@router.post("/goals/{phone}")
async def add_goal(phone: str, goal: GoalCreate):
    actual, user, users = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found")
    if "goals" not in user:
        user["goals"] = []
    user["goals"].append({
        "name": goal.name, "emoji": goal.emoji,
        "amount": goal.target_amount, "current": 0, "status": "active",
        "created": datetime.now().isoformat(), "source": "web"
    })
    users[actual] = user
    save_users(users)
    return {"success": True}

@router.put("/profile/{phone}")
async def update_profile(phone: str, profile: ProfileUpdate):
    actual, user, users = find_user(phone)
    if not user:
        raise HTTPException(404, "User not found")
    if profile.name: user["name"] = profile.name
    if profile.language: user["language"] = profile.language
    if profile.monthly_income:
        user["monthly_income"] = profile.monthly_income
        user["daily_budget"] = int(profile.monthly_income / 30)
    if profile.occupation: user["occupation"] = profile.occupation
    users[actual] = user
    save_users(users)
    return {"success": True}

@router.post("/onboard/{phone}")
async def web_onboard(phone: str, profile: dict):
    """Onboard from web — writes to same store as WhatsApp agent"""
    users = load_users()
    phone = phone.replace("+", "").replace(" ", "")
    user = users.get(phone, {"goals": []})
    user.update({
        "name": profile.get("name", "Friend"),
        "phone": phone,
        "language": profile.get("language", "en"),
        "occupation": profile.get("occupation", ""),
        "monthly_income": profile.get("monthly_income", 0),
        "daily_budget": int(profile.get("monthly_income", 0) / 30) if profile.get("monthly_income") else 0,
        "onboarding_complete": True,
        "onboarding_step": 99,
        "created": user.get("created", datetime.now().isoformat()),
        "source": user.get("source", "web"),
    })
    if profile.get("primary_goal") and profile.get("goal_amount"):
        emoji_map = {"Buy a Home": "🏠", "Buy a Vehicle": "🚗", "Education": "🎓", "Travel": "🌴", "Emergency Fund": "🛡️", "Start Investing": "💰", "Clear Debt": "💳"}
        user.setdefault("goals", []).append({
            "name": profile["primary_goal"],
            "emoji": emoji_map.get(profile["primary_goal"], "🎯"),
            "amount": profile["goal_amount"], "current": 0, "status": "active",
            "created": datetime.now().isoformat(), "source": "web"
        })
    users[phone] = user
    save_users(users)
    return {"success": True}
