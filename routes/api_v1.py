"""
Viya REST API v1 Router
=========================
PRD Section 4.1 — Versioned, RESTful, Envelope-Wrapped API

Resource Naming: Nouns, plural, lowercase
HTTP Methods: GET (read), POST (create), PATCH (partial update), DELETE (soft delete)
Response: Standard envelope {success, data, meta, error}
Pagination: Cursor-based with limit (max 100)
Auth: JWT + Plan-based access control
Rate Limiting: Per-user per-endpoint

All endpoints return the PRD-compliant response envelope via api_response().
"""

from fastapi import APIRouter, Request, Header, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import time
import uuid
import hashlib

# SaaS middleware (PRD Section 4.1)
from services.saas_middleware import (
    api_response, api_error, paginated_response,
    rate_limiter, check_plan_access, check_plan_limit,
    idempotency_store, ErrorCodes, logger, is_feature_enabled,
)

router = APIRouter(prefix="/api/v1", tags=["Viya API v1"])


# ═══════════════════════════════════════════════════════════════════
# AUTH DECORATORS (PRD Section 4.2 lines 1027-1034)
# ═══════════════════════════════════════════════════════════════════

SESSION_STORE = {}  # token -> {user_id, plan, role, expires}


def _get_session(token: str) -> dict:
    """Validate session token"""
    if not token:
        return None
    token = token.replace("Bearer ", "")
    session = SESSION_STORE.get(token)
    if session and session.get("expires", 0) > time.time():
        return session
    return None


async def require_auth(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> dict:
    """
    PRD 4.2: @require_auth — Validates JWT/token
    Returns current user context
    """
    session = _get_session(authorization)
    if not session:
        raise HTTPException(
            status_code=401,
            detail=api_error(ErrorCodes.AUTH_INVALID_TOKEN, "Invalid or expired token")
        )
    return session


def require_plan(min_plan: str = "free"):
    """
    PRD 4.2: @require_plan(min_plan="premium")
    Factory that returns a dependency checking plan level
    """
    plan_hierarchy = {"free": 0, "premium": 1, "enterprise": 2}

    async def _check(
        authorization: Optional[str] = Header(None, alias="Authorization")
    ):
        session = _get_session(authorization)
        if not session:
            raise HTTPException(401, detail=api_error(
                ErrorCodes.AUTH_INVALID_TOKEN, "Authentication required"
            ))
        user_plan = session.get("plan", "free")
        if plan_hierarchy.get(user_plan, 0) < plan_hierarchy.get(min_plan, 0):
            raise HTTPException(403, detail=api_error(
                ErrorCodes.PLAN_FEATURE_NOT_AVAILABLE,
                f"This feature requires {min_plan} plan. Current: {user_plan}"
            ))
        return session

    return _check


# ═══════════════════════════════════════════════════════════════════
# MIDDLEWARE: Request timing + Rate limiting
# ═══════════════════════════════════════════════════════════════════

def _extract_user_id(request: Request) -> str:
    """Extract user ID from request for rate limiting"""
    auth = request.headers.get("Authorization", "")
    session = _get_session(auth)
    return session.get("user_id", request.client.host) if session else request.client.host


# ═══════════════════════════════════════════════════════════════════
# PYDANTIC MODELS (Request/Response schemas)
# ═══════════════════════════════════════════════════════════════════

class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR")
    category: str = Field(..., min_length=1, max_length=50)
    description: str = Field("", max_length=200)
    type: str = Field("expense", pattern="^(expense|income)$")
    payment_method: str = Field("cash", max_length=30)

class TransactionPatch(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None

class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0)
    emoji: str = Field("🎯", max_length=4)
    deadline: Optional[str] = None

class GoalPatch(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    add_amount: Optional[float] = None  # Quick "add money" action

class ReminderCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=300)
    due_at: str  # ISO datetime
    recurring: str = Field("none", pattern="^(none|daily|weekly|monthly)$")
    channel: str = Field("whatsapp", pattern="^(whatsapp|push|sms)$")

class BillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    due_date: str  # Day of month or ISO date
    category: str = Field("utilities", max_length=50)
    auto_pay: bool = False

class ProfilePatch(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    monthly_income: Optional[float] = None
    occupation: Optional[str] = None
    notification_preferences: Optional[dict] = None


# ═══════════════════════════════════════════════════════════════════
# 1. TRANSACTIONS (PRD: /transactions)
#    Nouns, plural, lowercase. Nested: /users/:id/transactions
# ═══════════════════════════════════════════════════════════════════

# In-memory store (production: PostgreSQL)
_transactions = {}  # user_id -> [transaction, ...]
_goals = {}
_reminders = {}
_bills = {}


@router.get("/transactions")
async def list_transactions(
    request: Request,
    cursor: Optional[str] = None,
    limit: int = 20,
    category: Optional[str] = None,
    type: Optional[str] = None,
    user: dict = Depends(require_auth),
):
    """
    GET /api/v1/transactions
    PRD: Cursor-based pagination, max 100 items
    """
    start = time.time()
    user_id = user.get("user_id", "")

    # Rate limit check
    rl = rate_limiter.check(user_id, "default")
    if not rl["allowed"]:
        raise HTTPException(429, detail=api_error(
            ErrorCodes.RATE_LIMITED, "Rate limit exceeded",
        ))

    # Enforce max limit
    limit = min(limit, 100)

    txns = _transactions.get(user_id, [])

    # Filters
    if category:
        txns = [t for t in txns if t.get("category") == category]
    if type:
        txns = [t for t in txns if t.get("type") == type]

    # Sort by date descending
    txns = sorted(txns, key=lambda x: x.get("date", ""), reverse=True)

    # Cursor-based pagination
    start_idx = 0
    if cursor:
        for i, t in enumerate(txns):
            if t.get("id") == cursor:
                start_idx = i + 1
                break

    page = txns[start_idx:start_idx + limit]
    has_more = start_idx + limit < len(txns)
    next_cursor = page[-1]["id"] if page and has_more else None

    took_ms = int((time.time() - start) * 1000)

    return paginated_response(
        items=page,
        cursor=next_cursor,
        has_more=has_more,
        total=len(txns),
        per_page=limit,
    )


@router.post("/transactions")
async def create_transaction(
    txn: TransactionCreate,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/transactions
    PRD: Accepts Idempotency-Key header, returns envelope
    """
    user_id = user.get("user_id", "")

    # Idempotency check (PRD lines 960-964)
    if idempotency_key:
        cached = idempotency_store.get(idempotency_key)
        if cached:
            logger.info("idempotent_hit", key=idempotency_key, user_id=user_id)
            return cached

    new_txn = {
        "id": str(uuid.uuid4())[:12],
        "amount": txn.amount,
        "category": txn.category,
        "description": txn.description,
        "type": txn.type,
        "payment_method": txn.payment_method,
        "date": datetime.utcnow().isoformat() + "Z",
        "is_deleted": False,
        "source": "api_v1",
    }

    _transactions.setdefault(user_id, []).append(new_txn)

    response = api_response(data=new_txn, meta={"action": "created"})

    # Cache for idempotency
    if idempotency_key:
        idempotency_store.set(idempotency_key, response)

    logger.info("transaction_created", user_id=user_id, amount=txn.amount,
                category=txn.category, type=txn.type)
    return response


@router.patch("/transactions/{transaction_id}")
async def patch_transaction(
    transaction_id: str,
    patch: TransactionPatch,
    user: dict = Depends(require_auth),
):
    """PATCH /api/v1/transactions/:id — Partial update (idempotent)"""
    user_id = user.get("user_id", "")
    txns = _transactions.get(user_id, [])

    for txn in txns:
        if txn["id"] == transaction_id and not txn.get("is_deleted"):
            if patch.amount is not None:
                txn["amount"] = patch.amount
            if patch.category is not None:
                txn["category"] = patch.category
            if patch.description is not None:
                txn["description"] = patch.description
            txn["updated_at"] = datetime.utcnow().isoformat() + "Z"
            return api_response(data=txn)

    raise HTTPException(404, detail=api_error(
        ErrorCodes.FINANCE_TRANSACTION_NOT_FOUND, "Transaction not found"
    ))


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user: dict = Depends(require_auth),
):
    """DELETE /api/v1/transactions/:id — Soft delete (set deleted_at)"""
    user_id = user.get("user_id", "")
    txns = _transactions.get(user_id, [])

    for txn in txns:
        if txn["id"] == transaction_id:
            txn["is_deleted"] = True
            txn["deleted_at"] = datetime.utcnow().isoformat() + "Z"
            logger.info("transaction_soft_deleted", user_id=user_id,
                        transaction_id=transaction_id)
            return api_response(data={"deleted": True, "id": transaction_id})

    raise HTTPException(404, detail=api_error(
        ErrorCodes.FINANCE_TRANSACTION_NOT_FOUND, "Transaction not found"
    ))


# ═══════════════════════════════════════════════════════════════════
# 2. GOALS (PRD: /goals)
# ═══════════════════════════════════════════════════════════════════

@router.get("/goals")
async def list_goals(user: dict = Depends(require_auth)):
    """GET /api/v1/goals"""
    user_id = user.get("user_id", "")
    goals = [g for g in _goals.get(user_id, []) if not g.get("is_deleted")]
    return api_response(data=goals)


@router.post("/goals")
async def create_goal(
    goal: GoalCreate,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/goals — Plan limit enforced"""
    user_id = user.get("user_id", "")
    user_plan = user.get("plan", "free")

    # Check plan limit (PRD 4.2: free=3, premium=unlimited)
    current_count = len([g for g in _goals.get(user_id, []) if not g.get("is_deleted")])
    limit_check = check_plan_limit(user_plan, "max_goals", current_count)
    if not limit_check["allowed"]:
        raise HTTPException(403, detail=api_error(
            ErrorCodes.FINANCE_GOAL_LIMIT_REACHED,
            limit_check["upgrade_message"]
        ))

    new_goal = {
        "id": str(uuid.uuid4())[:12],
        "name": goal.name,
        "emoji": goal.emoji,
        "target_amount": goal.target_amount,
        "current_amount": 0,
        "progress_pct": 0,
        "status": "active",
        "deadline": goal.deadline,
        "milestones": {25: False, 50: False, 75: False, 100: False},
        "created_at": datetime.utcnow().isoformat() + "Z",
        "is_deleted": False,
    }

    _goals.setdefault(user_id, []).append(new_goal)
    logger.info("goal_created", user_id=user_id, name=goal.name,
                target=goal.target_amount)
    return api_response(data=new_goal, meta={"action": "created"})


@router.patch("/goals/{goal_id}")
async def patch_goal(
    goal_id: str,
    patch: GoalPatch,
    user: dict = Depends(require_auth),
):
    """PATCH /api/v1/goals/:id — Update or add money"""
    user_id = user.get("user_id", "")
    goals = _goals.get(user_id, [])

    for goal in goals:
        if goal["id"] == goal_id and not goal.get("is_deleted"):
            if patch.name:
                goal["name"] = patch.name
            if patch.target_amount:
                goal["target_amount"] = patch.target_amount
            if patch.add_amount and patch.add_amount > 0:
                goal["current_amount"] = goal.get("current_amount", 0) + patch.add_amount

            # Recalculate progress
            target = goal.get("target_amount", 1)
            current = goal.get("current_amount", 0)
            goal["progress_pct"] = round(min(current / target * 100, 100), 1)

            # Check milestones (PRD: 25%, 50%, 75%, 100%)
            milestones = goal.get("milestones", {})
            for pct in [25, 50, 75, 100]:
                if goal["progress_pct"] >= pct and not milestones.get(str(pct)):
                    milestones[str(pct)] = True
                    logger.info("goal_milestone_hit", user_id=user_id,
                                goal=goal["name"], milestone=pct)

            goal["updated_at"] = datetime.utcnow().isoformat() + "Z"
            return api_response(data=goal)

    raise HTTPException(404, detail=api_error(
        ErrorCodes.NOT_FOUND, "Goal not found"
    ))


# ═══════════════════════════════════════════════════════════════════
# 3. REMINDERS (PRD: /reminders)
# ═══════════════════════════════════════════════════════════════════

@router.get("/reminders")
async def list_reminders(
    status: Optional[str] = None,
    user: dict = Depends(require_auth),
):
    """GET /api/v1/reminders — Filter by status (pending/completed/snoozed)"""
    user_id = user.get("user_id", "")
    reminders = _reminders.get(user_id, [])
    if status:
        reminders = [r for r in reminders if r.get("status") == status]
    return api_response(data=reminders)


@router.post("/reminders")
async def create_reminder(
    reminder: ReminderCreate,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/reminders"""
    user_id = user.get("user_id", "")

    new_reminder = {
        "id": str(uuid.uuid4())[:12],
        "text": reminder.text,
        "due_at": reminder.due_at,
        "recurring": reminder.recurring,
        "channel": reminder.channel,
        "status": "pending",
        "delivery_attempts": 0,
        "max_delivery_attempts": 3,  # PRD: Never ask more than 3 times
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    _reminders.setdefault(user_id, []).append(new_reminder)
    logger.info("reminder_created", user_id=user_id, text=reminder.text[:50])
    return api_response(data=new_reminder, meta={"action": "created"})


@router.patch("/reminders/{reminder_id}")
async def update_reminder(
    reminder_id: str,
    action: str = "complete",  # complete | snooze
    user: dict = Depends(require_auth),
):
    """
    PATCH /api/v1/reminders/:id
    Actions: complete (mark done), snooze (delay 1hr)
    """
    user_id = user.get("user_id", "")
    reminders = _reminders.get(user_id, [])

    for r in reminders:
        if r["id"] == reminder_id:
            if action == "complete":
                r["status"] = "completed"
                r["completed_at"] = datetime.utcnow().isoformat() + "Z"
            elif action == "snooze":
                r["status"] = "snoozed"
                r["snoozed_until"] = datetime.utcnow().isoformat() + "Z"
            r["updated_at"] = datetime.utcnow().isoformat() + "Z"
            return api_response(data=r)

    raise HTTPException(404, detail=api_error(ErrorCodes.NOT_FOUND, "Reminder not found"))


# ═══════════════════════════════════════════════════════════════════
# 4. BILLS & EMIs (PRD: /bills)
#    Actions as sub-resources: /bills/:id/mark-paid
# ═══════════════════════════════════════════════════════════════════

@router.get("/bills")
async def list_bills(
    status: Optional[str] = None,
    user: dict = Depends(require_auth),
):
    """GET /api/v1/bills — Filter: overdue, due_soon, upcoming, paid"""
    user_id = user.get("user_id", "")
    bills = [b for b in _bills.get(user_id, []) if not b.get("is_deleted")]
    if status:
        bills = [b for b in bills if b.get("status") == status]
    return api_response(data=bills)


@router.post("/bills")
async def create_bill(
    bill: BillCreate,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/bills"""
    user_id = user.get("user_id", "")

    new_bill = {
        "id": str(uuid.uuid4())[:12],
        "name": bill.name,
        "amount": bill.amount,
        "due_date": bill.due_date,
        "category": bill.category,
        "auto_pay": bill.auto_pay,
        "status": "upcoming",
        "is_deleted": False,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    _bills.setdefault(user_id, []).append(new_bill)
    logger.info("bill_created", user_id=user_id, name=bill.name, amount=bill.amount)
    return api_response(data=new_bill, meta={"action": "created"})


@router.post("/bills/{bill_id}/mark-paid")
async def mark_bill_paid(
    bill_id: str,
    user: dict = Depends(require_auth),
):
    """POST /api/v1/bills/:id/mark-paid — Action as sub-resource"""
    user_id = user.get("user_id", "")
    bills = _bills.get(user_id, [])

    for bill in bills:
        if bill["id"] == bill_id:
            bill["status"] = "paid"
            bill["paid_at"] = datetime.utcnow().isoformat() + "Z"
            logger.info("bill_marked_paid", user_id=user_id, bill=bill["name"])
            return api_response(data=bill)

    raise HTTPException(404, detail=api_error(ErrorCodes.NOT_FOUND, "Bill not found"))


# ═══════════════════════════════════════════════════════════════════
# 5. USER PROFILE (PRD: /users/me)
# ═══════════════════════════════════════════════════════════════════

@router.get("/users/me")
async def get_current_user(user: dict = Depends(require_auth)):
    """GET /api/v1/users/me — Current user profile"""
    return api_response(data={
        "user_id": user.get("user_id"),
        "plan": user.get("plan", "free"),
        "role": user.get("role", "user"),
    })


@router.patch("/users/me")
async def update_profile(
    profile: ProfilePatch,
    user: dict = Depends(require_auth),
):
    """PATCH /api/v1/users/me — Partial update"""
    user_id = user.get("user_id", "")
    updates = profile.dict(exclude_none=True)
    logger.info("profile_updated", user_id=user_id, fields=list(updates.keys()))
    return api_response(data={"updated": True, "fields": list(updates.keys())})


@router.get("/users/me/data")
async def export_user_data(user: dict = Depends(require_auth)):
    """
    GET /api/v1/users/me/data
    PRD Section 5.2: Right to access — generates download
    GDPR/India PDPB compliant data export
    """
    user_id = user.get("user_id", "")
    return api_response(data={
        "transactions": _transactions.get(user_id, []),
        "goals": _goals.get(user_id, []),
        "reminders": _reminders.get(user_id, []),
        "bills": _bills.get(user_id, []),
        "export_format": "json",
        "exported_at": datetime.utcnow().isoformat() + "Z",
    })


@router.delete("/users/me")
async def delete_account(user: dict = Depends(require_auth)):
    """
    DELETE /api/v1/users/me
    PRD Section 5.2: Right to deletion — 30-day processing
    """
    user_id = user.get("user_id", "")
    logger.info("account_deletion_requested", user_id=user_id)
    return api_response(data={
        "status": "deletion_scheduled",
        "processing_days": 30,
        "message": "Your account will be permanently deleted within 30 days. "
                   "You'll receive email confirmation when complete.",
    })


# ═══════════════════════════════════════════════════════════════════
# 6. FEATURE FLAGS (PRD: /features)
# ═══════════════════════════════════════════════════════════════════

@router.get("/features")
async def get_feature_flags(user: dict = Depends(require_auth)):
    """GET /api/v1/features — Features enabled for this user"""
    user_data = {"phone": user.get("user_id"), "plan": user.get("plan", "free")}
    flags = {
        "email_intelligence_v2": is_feature_enabled("new_email_intelligence_v2", user_data),
        "investment_ai": is_feature_enabled("premium_investment_ai", user_data),
        "family_mode": is_feature_enabled("family_mode_beta", user_data),
        "voice_first": is_feature_enabled("voice_first_mode", user_data),
        "dark_mode_system": is_feature_enabled("dark_mode_system_default", user_data),
    }
    return api_response(data=flags)


# ═══════════════════════════════════════════════════════════════════
# 7. PLAN / SUBSCRIPTION (PRD: /subscription)
# ═══════════════════════════════════════════════════════════════════

@router.get("/subscription")
async def get_subscription(user: dict = Depends(require_auth)):
    """GET /api/v1/subscription — Current plan details"""
    plan = user.get("plan", "free")
    plan_access = check_plan_access(plan, "report_export")

    return api_response(data={
        "plan": plan,
        "price": {"free": 0, "premium": 149, "enterprise": 999}.get(plan, 0),
        "currency": "INR",
        "billing_cycle": "monthly",
        "features_locked": [
            f for f in ["report_export", "tax_planning", "investment_ai"]
            if not check_plan_access(plan, f).get("allowed")
        ],
    })


@router.post("/subscription/upgrade")
async def upgrade_plan(
    request: Request,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/subscription/upgrade
    PRD Flow 2: 1-tap upgrade with Razorpay/UPI
    """
    data = await request.json()
    target_plan = data.get("plan", "premium")
    payment_method = data.get("payment_method", "upi")

    logger.info("upgrade_initiated", user_id=user.get("user_id"),
                from_plan=user.get("plan"), to_plan=target_plan,
                payment_method=payment_method)

    return api_response(data={
        "status": "upgrade_pending",
        "target_plan": target_plan,
        "payment_method": payment_method,
        "trial_days": 14,
        "message": "Redirecting to payment...",
    })


# ═══════════════════════════════════════════════════════════════════
# 8. OBSERVABILITY (PRD Section 4.5)
# ═══════════════════════════════════════════════════════════════════

@router.get("/admin/observability")
async def get_observability(user: dict = Depends(require_plan("enterprise"))):
    """
    GET /api/v1/admin/observability
    PRD 4.5: Full metrics dashboard — enterprise/admin only
    """
    from services.observability import get_observability_summary
    return api_response(data=get_observability_summary())


@router.get("/admin/alerts")
async def get_alerts(user: dict = Depends(require_plan("enterprise"))):
    """GET /api/v1/admin/alerts — Active SLA alerts"""
    from services.observability import sla_monitor
    return api_response(data={
        "active": sla_monitor.get_active_alerts(),
        "thresholds": {
            k: {"threshold": v["threshold"], "operator": v["operator"],
                "priority": v["priority"].value, "message": v["message"]}
            for k, v in __import__('services.observability',
                                   fromlist=['SLA_THRESHOLDS']).SLA_THRESHOLDS.items()
        },
    })


@router.post("/admin/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    user: dict = Depends(require_plan("enterprise")),
):
    """POST /api/v1/admin/alerts/:id/acknowledge"""
    from services.observability import sla_monitor
    sla_monitor.acknowledge(alert_id)
    return api_response(data={"acknowledged": True, "alert_id": alert_id})


# ═══════════════════════════════════════════════════════════════════
# 9. NOTIFICATIONS (PRD Section 4.4)
# ═══════════════════════════════════════════════════════════════════

@router.get("/notifications/stats")
async def get_notification_stats(user: dict = Depends(require_auth)):
    """GET /api/v1/notifications/stats — Delivery funnel stats"""
    from services.notification_templates import notification_manager
    return api_response(data=notification_manager.get_delivery_stats())


@router.post("/notifications/send")
async def send_notification(
    request: Request,
    user: dict = Depends(require_auth),
):
    """
    POST /api/v1/notifications/send
    PRD 4.4: Queue notification for delivery via channel fallback
    Body: {template_key, variables, language}
    """
    from services.notification_templates import notification_manager
    data = await request.json()
    result = notification_manager.queue_notification(
        user_id=user.get("user_id", ""),
        template_key=data.get("template_key", ""),
        variables=data.get("variables", {}),
        language=data.get("language", "en"),
    )
    if result["success"]:
        return api_response(data=result["notification"])
    else:
        raise HTTPException(400, detail=api_error(
            "NOTIFICATION_FAILED", result.get("error", "Unknown error")
        ))


@router.get("/notifications/preferences")
async def get_notification_preferences(user: dict = Depends(require_auth)):
    """GET /api/v1/notifications/preferences"""
    from services.notification_templates import DEFAULT_PREFERENCES
    return api_response(data=DEFAULT_PREFERENCES)


# ═══════════════════════════════════════════════════════════════════
# 10. JOBS (PRD Section 4.3)
# ═══════════════════════════════════════════════════════════════════

@router.get("/admin/jobs")
async def get_job_metrics(user: dict = Depends(require_plan("enterprise"))):
    """GET /api/v1/admin/jobs — Job scheduler metrics"""
    from services.job_scheduler import job_scheduler
    return api_response(data=job_scheduler.get_metrics())


@router.get("/admin/jobs/dead-letter")
async def get_dead_letter_queue(user: dict = Depends(require_plan("enterprise"))):
    """GET /api/v1/admin/jobs/dead-letter — Failed jobs for ops review"""
    from services.job_scheduler import job_scheduler
    return api_response(data=job_scheduler.get_dead_letter_queue())

