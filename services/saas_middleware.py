"""
Viya SaaS Middleware Layer
==========================
PRD Section 4.1 — API Response Envelope, Rate Limiting, Plan Access Control
PRD Section 4.5 — Health Checks, Structured Logging

Middleware stack applied to all API requests:
  1. Request ID injection (correlation)
  2. Structured JSON logging
  3. Rate limiting (per user, per endpoint)
  4. Plan-based feature gating
  5. Standard response envelope
"""

import time
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from functools import wraps
from collections import defaultdict


# ═══════════════════════════════════════════════════════════════════
# 1. STRUCTURED LOGGING (PRD Section 4.5 lines 1181-1194)
# ═══════════════════════════════════════════════════════════════════

class StructuredLogger:
    """JSON structured logger with PII masking"""
    
    MASKED_FIELDS = {'phone', 'email', 'password', 'token', 'otp', 'account_number'}
    
    def __init__(self, service: str = "viya-api"):
        self.service = service
        self.logger = logging.getLogger(service)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def _mask_pii(self, data: dict) -> dict:
        """Auto-mask PII fields"""
        masked = {}
        for k, v in data.items():
            if k.lower() in self.MASKED_FIELDS:
                if isinstance(v, str) and len(v) > 4:
                    masked[k] = v[:2] + '*' * (len(v) - 4) + v[-2:]
                else:
                    masked[k] = '***'
            else:
                masked[k] = v
        return masked
    
    def log(self, level: str, event: str, **kwargs):
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "service": self.service,
            "event": event,
            **self._mask_pii(kwargs)
        }
        self.logger.info(json.dumps(entry, default=str))
    
    def info(self, event, **kw): self.log("INFO", event, **kw)
    def warn(self, event, **kw): self.log("WARNING", event, **kw)
    def error(self, event, **kw): self.log("ERROR", event, **kw)
    def debug(self, event, **kw): self.log("DEBUG", event, **kw)


logger = StructuredLogger("viya-api")


# ═══════════════════════════════════════════════════════════════════
# 2. RESPONSE ENVELOPE (PRD Section 4.1 lines 922-938)
# ═══════════════════════════════════════════════════════════════════

def api_response(data: Any = None, success: bool = True, 
                 meta: Optional[Dict] = None, error: Optional[Dict] = None,
                 status_code: int = 200) -> dict:
    """
    Standard response envelope for ALL API responses.
    
    {
        "success": true/false,
        "data": {},
        "meta": { "request_id": "uuid", "took_ms": 45 },
        "error": { "code": "...", "message": "...", "field": "..." }
    }
    """
    envelope = {
        "success": success,
        "data": data,
        "meta": {
            "request_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **(meta or {})
        }
    }
    if error:
        envelope["error"] = error
    return envelope


def api_error(code: str, message: str, field: str = None, 
              status_code: int = 400) -> dict:
    """
    Standard error response.
    Error codes: SCREAMING_SNAKE_CASE, domain-prefixed
    Examples: AUTH_INVALID_TOKEN, FINANCE_BUDGET_EXCEEDED
    """
    return api_response(
        success=False,
        error={
            "code": code,
            "message": message,
            **({"field": field} if field else {})
        },
        status_code=status_code
    )


def paginated_response(items: list, cursor: str = None, 
                       has_more: bool = False, total: int = None,
                       page: int = 1, per_page: int = 20) -> dict:
    """Cursor-based pagination envelope (PRD lines 940-944)"""
    return api_response(
        data=items,
        meta={
            "page": page,
            "per_page": per_page,
            "total": total or len(items),
            "next_cursor": cursor,
            "has_more": has_more
        }
    )


# ═══════════════════════════════════════════════════════════════════
# 3. RATE LIMITING (PRD Section 4.1 lines 952-958)
# ═══════════════════════════════════════════════════════════════════

class RateLimiter:
    """
    In-memory rate limiter (upgrade to Redis for production).
    
    Default: 200 requests/hour per user
    Chat: 50 messages/hour (AI cost protection)
    Auth: 5/minute (brute force protection)
    """
    
    LIMITS = {
        "default": {"max": 200, "window": 3600},      # 200/hour
        "chat": {"max": 50, "window": 3600},           # 50/hour
        "auth": {"max": 5, "window": 60},              # 5/minute
        "admin": {"max": 1000, "window": 3600},        # 1000/hour
    }
    
    def __init__(self):
        # {user_id: {endpoint_type: [(timestamp, ...)]}}
        self._requests = defaultdict(lambda: defaultdict(list))
    
    def check(self, user_id: str, endpoint_type: str = "default") -> dict:
        """
        Check if request is allowed.
        Returns: { allowed: bool, limit, remaining, reset_at }
        """
        config = self.LIMITS.get(endpoint_type, self.LIMITS["default"])
        now = time.time()
        window = config["window"]
        max_requests = config["max"]
        
        # Clean old entries
        key = self._requests[user_id][endpoint_type]
        self._requests[user_id][endpoint_type] = [
            t for t in key if now - t < window
        ]
        
        current = len(self._requests[user_id][endpoint_type])
        remaining = max(0, max_requests - current)
        reset_at = int(now + window)
        
        if current >= max_requests:
            return {
                "allowed": False,
                "limit": max_requests,
                "remaining": 0,
                "reset_at": reset_at,
                "retry_after": window - int(now - self._requests[user_id][endpoint_type][0])
            }
        
        # Record this request
        self._requests[user_id][endpoint_type].append(now)
        
        return {
            "allowed": True,
            "limit": max_requests,
            "remaining": remaining - 1,
            "reset_at": reset_at
        }
    
    def get_headers(self, result: dict) -> dict:
        """Rate limit response headers (PRD line 957)"""
        return {
            "X-RateLimit-Limit": str(result["limit"]),
            "X-RateLimit-Remaining": str(result["remaining"]),
            "X-RateLimit-Reset": str(result["reset_at"]),
        }


rate_limiter = RateLimiter()


# ═══════════════════════════════════════════════════════════════════
# 4. PLAN-BASED ACCESS CONTROL (PRD Section 4.2 lines 982-1041)
# ═══════════════════════════════════════════════════════════════════

PLAN_LIMITS = {
    "free": {
        "max_goals": 3,
        "ai_messages_per_day": 50,
        "email_accounts": 1,
        "bank_accounts": 2,
        "family_members": 1,
        "ai_model": "haiku",
        "report_export": False,
        "tax_planning": False,
        "investment_ai": False,
    },
    "premium": {
        "max_goals": 999,  # unlimited
        "ai_messages_per_day": 500,
        "email_accounts": 3,
        "bank_accounts": 999,
        "family_members": 4,
        "ai_model": "sonnet",
        "report_export": True,
        "tax_planning": True,
        "investment_ai": True,
        "priority_email_sync": True,
    },
    "enterprise": {
        "max_goals": 999,
        "ai_messages_per_day": 9999,
        "email_accounts": 999,
        "bank_accounts": 999,
        "family_members": 999,
        "ai_model": "opus",
        "report_export": True,
        "tax_planning": True,
        "investment_ai": True,
        "team_sharing": True,
        "custom_agents": True,
        "api_access": True,
    },
}


def check_plan_access(user_plan: str, feature: str) -> dict:
    """
    Check if a user's plan allows access to a feature.
    Returns: { allowed: bool, current_plan, required_plan, limit }
    """
    plan = PLAN_LIMITS.get(user_plan, PLAN_LIMITS["free"])
    feature_value = plan.get(feature)
    
    if feature_value is None:
        return {"allowed": False, "current_plan": user_plan, 
                "required_plan": "premium", "feature": feature}
    
    if isinstance(feature_value, bool):
        if not feature_value:
            # Find which plan has this feature
            for plan_name in ["premium", "enterprise"]:
                if PLAN_LIMITS[plan_name].get(feature):
                    return {"allowed": False, "current_plan": user_plan,
                            "required_plan": plan_name, "feature": feature}
        return {"allowed": True, "current_plan": user_plan}
    
    return {"allowed": True, "current_plan": user_plan, "limit": feature_value}


def check_plan_limit(user_plan: str, feature: str, current_count: int) -> dict:
    """Check if user has exceeded a numeric plan limit"""
    plan = PLAN_LIMITS.get(user_plan, PLAN_LIMITS["free"])
    limit = plan.get(feature, 0)
    
    if current_count >= limit:
        return {
            "allowed": False,
            "current_plan": user_plan,
            "limit": limit,
            "current": current_count,
            "upgrade_message": f"You've reached the {feature.replace('_', ' ')} limit ({limit}). Upgrade to Premium for unlimited access."
        }
    
    return {"allowed": True, "remaining": limit - current_count}


# ═══════════════════════════════════════════════════════════════════
# 5. HEALTH CHECK ENDPOINTS (PRD Section 4.5 lines 1245-1252)
# ═══════════════════════════════════════════════════════════════════

import os

def health_check_response():
    """
    /health/ready response — checks all downstream deps.
    PRD: Returns { status, checks: { db, redis, claude, whatsapp }, version, uptime }
    """
    start = time.time()
    checks = {}
    all_healthy = True
    
    # Check database
    try:
        from database.user_repository import user_repo
        # Simple test query
        user_repo.get_user("health_check_test")
        checks["db"] = {"status": "healthy", "latency_ms": int((time.time() - start) * 1000)}
    except Exception as e:
        checks["db"] = {"status": "unhealthy", "error": str(e)}
        all_healthy = False
    
    # Check Redis (if available)
    try:
        import redis
        r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        r.ping()
        checks["redis"] = {"status": "healthy"}
    except:
        checks["redis"] = {"status": "not_configured"}
    
    # Check AI API
    ai_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
    checks["ai"] = {"status": "healthy" if ai_key else "not_configured"}
    
    # Check WhatsApp
    wa_token = os.getenv("WHATSAPP_CLOUD_TOKEN")
    checks["whatsapp"] = {"status": "healthy" if wa_token else "not_configured"}
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "version": os.getenv("AGENT_VERSION", "3.6.0"),
        "uptime": "running",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# ═══════════════════════════════════════════════════════════════════
# 6. IDEMPOTENCY (PRD Section 4.1 lines 960-964)
# ═══════════════════════════════════════════════════════════════════

class IdempotencyStore:
    """
    In-memory idempotency key store (upgrade to Redis for production).
    All POST requests accept Idempotency-Key header.
    Store keys with 24hr TTL.
    """
    
    def __init__(self, ttl_seconds: int = 86400):
        self._store = {}  # {key: {response, created_at}}
        self.ttl = ttl_seconds
    
    def get(self, key: str) -> Optional[dict]:
        """Get cached response for idempotency key"""
        if key in self._store:
            entry = self._store[key]
            if time.time() - entry["created_at"] < self.ttl:
                return entry["response"]
            else:
                del self._store[key]
        return None
    
    def set(self, key: str, response: dict):
        """Cache response for idempotency key"""
        self._store[key] = {
            "response": response,
            "created_at": time.time()
        }
        # Cleanup old entries periodically
        self._cleanup()
    
    def _cleanup(self):
        """Remove expired entries"""
        now = time.time()
        expired = [k for k, v in self._store.items() 
                   if now - v["created_at"] > self.ttl]
        for k in expired:
            del self._store[k]


idempotency_store = IdempotencyStore()


# ═══════════════════════════════════════════════════════════════════
# 7. ERROR CODES REGISTRY (PRD Section 4.1 lines 966-976)
# ═══════════════════════════════════════════════════════════════════

class ErrorCodes:
    """Domain-prefixed error codes in SCREAMING_SNAKE_CASE"""
    
    # Auth
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_PHONE_RATE_LIMITED = "AUTH_PHONE_RATE_LIMITED"
    AUTH_OTP_EXPIRED = "AUTH_OTP_EXPIRED"
    AUTH_OTP_INVALID = "AUTH_OTP_INVALID"
    AUTH_INVALID_PHONE = "AUTH_INVALID_PHONE"
    
    # Finance
    FINANCE_TRANSACTION_NOT_FOUND = "FINANCE_TRANSACTION_NOT_FOUND"
    FINANCE_BUDGET_EXCEEDED = "FINANCE_BUDGET_EXCEEDED"
    FINANCE_GOAL_LIMIT_REACHED = "FINANCE_GOAL_LIMIT_REACHED"
    
    # Email
    EMAIL_SYNC_FAILED = "EMAIL_SYNC_FAILED"
    EMAIL_ACCOUNT_LIMIT = "EMAIL_ACCOUNT_LIMIT"
    
    # AI
    AI_RATE_LIMIT_EXCEEDED = "AI_RATE_LIMIT_EXCEEDED"
    AI_TIMEOUT = "AI_TIMEOUT"
    
    # Plan
    PLAN_FEATURE_NOT_AVAILABLE = "PLAN_FEATURE_NOT_AVAILABLE"
    PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED"
    
    # General
    RATE_LIMITED = "RATE_LIMITED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NOT_FOUND = "NOT_FOUND"


# ═══════════════════════════════════════════════════════════════════
# 8. FEATURE FLAGS (PRD Section 7.2 lines 1719-1761)
# ═══════════════════════════════════════════════════════════════════

FEATURE_FLAGS = {
    "new_email_intelligence_v2": {
        "rollout_pct": 25,
        "status": "testing",
        "owner": "backend",
    },
    "premium_investment_ai": {
        "rollout_pct": 100,
        "status": "live",
        "condition": lambda user: user.get("plan") == "premium",
    },
    "family_mode_beta": {
        "rollout_pct": 10,
        "status": "testing",
    },
    "voice_first_mode": {
        "rollout_pct": 5,
        "status": "experiment",
    },
    "dark_mode_system_default": {
        "rollout_pct": 100,
        "status": "live",
    },
    # Kill switches (PRD lines 1756-1760)
    "disable_ai_chat": {"rollout_pct": 0, "status": "killswitch"},
    "disable_email_sync": {"rollout_pct": 0, "status": "killswitch"},
    "disable_bank_sync": {"rollout_pct": 0, "status": "killswitch"},
    "enable_maintenance_mode": {"rollout_pct": 0, "status": "killswitch"},
}


def is_feature_enabled(flag_name: str, user: dict = None) -> bool:
    """Check if a feature flag is enabled for a user"""
    flag = FEATURE_FLAGS.get(flag_name)
    if not flag:
        return False
    
    # Kill switches are instant
    if flag.get("status") == "killswitch":
        return flag.get("rollout_pct", 0) > 0
    
    # Check condition (e.g., plan-based)
    condition = flag.get("condition")
    if condition and user and not condition(user):
        return False
    
    # Percentage rollout (hash user_id for consistent bucketing)
    if user and flag.get("rollout_pct", 100) < 100:
        user_id = user.get("phone", user.get("id", ""))
        bucket = hash(user_id + flag_name) % 100
        return bucket < flag["rollout_pct"]
    
    return flag.get("rollout_pct", 0) > 0


# Export all
__all__ = [
    'logger', 'api_response', 'api_error', 'paginated_response',
    'rate_limiter', 'RateLimiter',
    'check_plan_access', 'check_plan_limit', 'PLAN_LIMITS',
    'health_check_response',
    'idempotency_store', 'IdempotencyStore',
    'ErrorCodes',
    'is_feature_enabled', 'FEATURE_FLAGS',
    'StructuredLogger',
]
