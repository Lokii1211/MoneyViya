"""
Viya MVP Roadmap & Success Tracker
=====================================
PRD Section 8 — Phased roadmap with success criteria,
risk register, and milestone tracking.

PRD Section 9 — API contract registry, tech stack rationale,
and infrastructure cost projections.

Phase 1 (Weeks 1-8):   Premium Foundation
Phase 2 (Weeks 9-16):  Intelligence & Automation
Phase 3 (Weeks 17-24): AI-Powered Personalization
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional


# ═══════════════════════════════════════════════════════════════════
# 1. PHASED ROADMAP (PRD Section 8 — lines 1810-1948)
# ═══════════════════════════════════════════════════════════════════

ROADMAP = {
    "phase_1": {
        "name": "Premium Foundation",
        "weeks": "1-8",
        "goal": "Upgrade MVP to premium quality. Fix all rough edges.",
        "targets": {
            "day_7_retention": 0.40,
            "onboarding_completion": 0.80,
            "premium_conversion": 0.05,
            "app_store_rating": 4.5,
            "api_p95_latency_ms": 500,
        },
        "sprints": {
            "week_1_2": {
                "name": "Core Platform Hardening",
                "deliverables": [
                    "Migrate to production infrastructure (ECS + RDS + ElastiCache)",
                    "Implement proper error handling (every endpoint)",
                    "Add skeleton loaders on all screens",
                    "Set up Datadog monitoring + PagerDuty alerting",
                    "Implement structured logging (JSON, correlation IDs)",
                    "Database: Add missing indexes, analyze slow queries",
                    "Security: OTP rate limiting, JWT refresh rotation, secrets in AWS SM",
                ],
            },
            "week_3_4": {
                "name": "Onboarding Excellence",
                "deliverables": [
                    "Redesign onboarding (4 screens, 90 seconds, <2 taps each)",
                    "SMS auto-read for OTP (Android) / AutoFill (iOS)",
                    "Gmail OAuth + immediate first email insight",
                    "WhatsApp first message within 60 seconds of signup",
                    "First expense log < 3 minutes from signup",
                    "Track every onboarding drop-off point",
                ],
            },
            "week_5_6": {
                "name": "Email Intelligence Launch",
                "deliverables": [
                    "Gmail sync pipeline (15-minute incremental, push webhook)",
                    "Bill email detection + amount/date extraction",
                    "Meeting invite detection + calendar conflict check",
                    "Delivery tracking detection",
                    "Email intelligence feed (tabbed, action-first)",
                    "Google Calendar OAuth + accept meetings from app",
                ],
            },
            "week_7_8": {
                "name": "Premium Tier Launch",
                "deliverables": [
                    "Razorpay integration (subscription, UPI, cards)",
                    "Premium feature gates (plan checking middleware)",
                    "Upgrade flow (premium page + trial + payment)",
                    "Investment portfolio tracking (Zerodha/Kuvera APIs)",
                    "Tax planning module (80C tracking, ITR prep)",
                    "PDF report generation and export",
                ],
            },
        },
    },

    "phase_2": {
        "name": "Intelligence & Automation",
        "weeks": "9-16",
        "goal": "Make Viya proactively intelligent. Users say 'How did you know?'",
        "targets": {
            "day_30_retention": 0.38,
            "proactive_action_rate": 0.40,
            "health_tracking_adoption": 0.50,
            "premium_conversion": 0.12,
            "whatsapp_messages_per_day": 8,
            "nps_score": 55,
        },
        "sprints": {
            "week_9_10": {
                "name": "Proactive Intelligence Engine",
                "deliverables": [
                    "All 12 trigger conditions implemented",
                    "Background scheduler with Celery",
                    "Morning brief generation + delivery",
                    "Spending anomaly detection",
                    "Goal risk alerts",
                    "Subscription waste detection",
                ],
            },
            "week_11_12": {
                "name": "Health Intelligence Upgrade",
                "deliverables": [
                    "Food scanner (Claude Vision + Indian food DB 500K items)",
                    "Google Fit + Apple HealthKit deep integration",
                    "Medicine adherence tracking + smart reminders",
                    "Nutrition analysis + meal suggestions",
                    "Health score algorithm (composite 0-100)",
                    "Sleep analysis integration",
                ],
            },
            "week_13_14": {
                "name": "Wealth Management Depth",
                "deliverables": [
                    "Account Aggregator full integration (10+ banks)",
                    "Investment XIRR calculation",
                    "Portfolio rebalancing insights",
                    "FD maturity alerts",
                    "Tax loss harvesting detection",
                    "EMI prepayment calculator",
                ],
            },
            "week_15_16": {
                "name": "Notification Excellence",
                "deliverables": [
                    "Multi-channel delivery (WhatsApp → Push → SMS fallback)",
                    "Delivery confirmation tracking + retry logic",
                    "User notification preferences (per channel, per category)",
                    "Quiet hours enforcement",
                    "WhatsApp interactive buttons (3-button max, list)",
                    "Notification engagement tracking",
                ],
            },
        },
    },

    "phase_3": {
        "name": "AI-Powered Personalization",
        "weeks": "17-24",
        "goal": "Viya knows each user better than they know themselves.",
        "targets": {
            "day_90_retention": 0.32,
            "memory_feature_usage": 0.70,
            "family_mode_adoption": 0.25,
            "referral_viral_coefficient": 0.4,
            "enterprise_signups": 100,
            "arr_inr_crore": 25,
            "premium_conversion": 0.18,
        },
        "sprints": {
            "week_17_18": {
                "name": "Memory & Personalization",
                "deliverables": [
                    "Long-term memory system (pgvector semantic search)",
                    "Relationship graph",
                    "Behavioral pattern detection",
                    "Personalized morning brief",
                    "Context-aware responses (references history)",
                ],
            },
            "week_19_20": {
                "name": "Advanced AI Agents",
                "deliverables": [
                    "Shopping intelligence (price tracking, deal alerts)",
                    "Travel planning assistant",
                    "Document intelligence (receipt OCR, IDs)",
                    "Career finance planning",
                    "Mental health support (stress detection + protocol)",
                ],
            },
            "week_21_22": {
                "name": "Family & Social Features",
                "deliverables": [
                    "Family mode (4 members, shared goals, privacy)",
                    "Couple finance mode",
                    "Achievement sharing (WhatsApp status card)",
                    "Referral program (₹50 each)",
                    "Social comparison (anonymized)",
                ],
            },
            "week_23_24": {
                "name": "Enterprise Foundation",
                "deliverables": [
                    "Team workspaces (enterprise plan scaffold)",
                    "Admin dashboard (user management, analytics)",
                    "API access (enterprise: programmatic access)",
                    "Custom AI agent builder",
                    "White-label option (bank partnerships)",
                ],
            },
        },
    },
}


# ═══════════════════════════════════════════════════════════════════
# 2. SUCCESS CHECKPOINTS (PRD Section 9.2 — lines 2019-2050)
# ═══════════════════════════════════════════════════════════════════

CHECKPOINTS = {
    "week_4": {
        "name": "Week 4 Checkpoint",
        "criteria": {
            "onboarding_completion": {"target": 0.75, "operator": ">"},
            "day_7_retention": {"target": 0.38, "operator": ">"},
            "api_error_rate": {"target": 0.005, "operator": "<"},
            "api_p95_latency_ms": {"target": 500, "operator": "<"},
            "app_store_rating": {"target": 4.4, "operator": ">"},
        },
    },
    "week_8": {
        "name": "Week 8 Checkpoint",
        "criteria": {
            "gmail_connection_rate": {"target": 0.45, "operator": ">"},
            "email_intelligence_dau": {"target": 0.50, "operator": ">"},
            "premium_conversion": {"target": 0.05, "operator": ">"},
            "p1_incidents": {"target": 0, "operator": "=="},
            "gdpr_audit_passed": {"target": True, "operator": "=="},
        },
    },
    "week_16": {
        "name": "Week 16 Checkpoint",
        "criteria": {
            "day_30_retention": {"target": 0.35, "operator": ">"},
            "proactive_action_rate": {"target": 0.35, "operator": ">"},
            "health_tracker_dau": {"target": 0.40, "operator": ">"},
            "premium_conversion": {"target": 0.10, "operator": ">"},
            "monthly_revenue_lakhs": {"target": 50, "operator": ">"},
            "whatsapp_messages_per_user_day": {"target": 6, "operator": ">"},
        },
    },
    "week_24": {
        "name": "Week 24 Checkpoint",
        "criteria": {
            "day_90_retention": {"target": 0.30, "operator": ">"},
            "active_users": {"target": 500000, "operator": ">"},
            "premium_conversion": {"target": 0.15, "operator": ">"},
            "monthly_revenue_crore": {"target": 2, "operator": ">"},
            "nps_score": {"target": 60, "operator": ">"},
            "app_store_rating": {"target": 4.6, "operator": ">"},
        },
    },
}


def evaluate_checkpoint(checkpoint_name: str, metrics: dict) -> dict:
    """Evaluate a checkpoint against actual metrics"""
    checkpoint = CHECKPOINTS.get(checkpoint_name)
    if not checkpoint:
        return {"error": f"Unknown checkpoint: {checkpoint_name}"}

    results = {}
    passed = 0
    total = len(checkpoint["criteria"])

    for name, rule in checkpoint["criteria"].items():
        actual = metrics.get(name)
        if actual is None:
            results[name] = {"status": "missing", "target": rule["target"]}
            continue

        target = rule["target"]
        op = rule["operator"]
        if op == ">":
            met = actual > target
        elif op == "<":
            met = actual < target
        elif op == "==":
            met = actual == target
        else:
            met = False

        results[name] = {
            "target": target,
            "actual": actual,
            "passed": met,
        }
        if met:
            passed += 1

    return {
        "checkpoint": checkpoint["name"],
        "passed": passed,
        "total": total,
        "pass_rate": round(passed / total * 100, 1) if total > 0 else 0,
        "results": results,
    }


# ═══════════════════════════════════════════════════════════════════
# 3. RISK REGISTER (PRD Section 9.2 — lines 2052-2098)
# ═══════════════════════════════════════════════════════════════════

RISK_REGISTER = [
    {
        "id": "RISK-1",
        "name": "WhatsApp API Rate Limits / Policy Changes",
        "probability": "medium",
        "impact": "critical",
        "mitigation": [
            "Build in-app chat as primary, WhatsApp as secondary",
            "Maintain SMS fallback channel",
            "Multi-provider strategy (360Dialog + Infobip backup)",
        ],
        "contingency": "Push notification fallback + in-app daily brief",
    },
    {
        "id": "RISK-2",
        "name": "Anthropic API Cost Spike",
        "probability": "medium",
        "impact": "high",
        "mitigation": [
            "4-tier routing (40% handled without LLM)",
            "Per-user daily limits enforced",
            "Cost alerts at 150% of projected daily spend",
            "Response caching for common queries",
            "Kill switch: Disable AI for specific users",
        ],
        "contingency": "Activate disable_ai_chat killswitch",
    },
    {
        "id": "RISK-3",
        "name": "Gmail API Quota Limits",
        "probability": "medium",
        "impact": "high",
        "mitigation": [
            "Push webhooks (not polling) to reduce API calls",
            "Incremental sync (only new since last check)",
            "Request quota increase before scaling",
            "Cache all email data server-side",
        ],
        "contingency": "Activate disable_email_sync killswitch",
    },
    {
        "id": "RISK-4",
        "name": "Indian Banking AA Framework Reliability",
        "probability": "low-medium",
        "impact": "medium",
        "mitigation": [
            "SMS parsing as fallback (no AA needed)",
            "Manual transaction entry always available",
            "Clear user messaging when sync fails",
            "Show cached data with timestamp",
        ],
        "contingency": "Activate disable_bank_sync killswitch",
    },
    {
        "id": "RISK-5",
        "name": "Team Capacity / Execution Speed",
        "probability": "high",
        "impact": "medium",
        "mitigation": [
            "Hire 2 senior engineers before Phase 2",
            "Contract AI/ML specialist for food scanner + memory",
            "Phase 3 features can slip 2 weeks without revenue impact",
            "Core retention features (Phases 1-2) take priority",
        ],
        "contingency": "Defer Phase 3 non-critical features",
    },
]


# ═══════════════════════════════════════════════════════════════════
# 4. API CONTRACT REGISTRY (PRD Section 9.1 — lines 1954-2015)
# ═══════════════════════════════════════════════════════════════════

API_CONTRACTS = {
    "auth": [
        {
            "method": "POST",
            "path": "/api/v1/auth/send-otp",
            "request": {"phone": "str", "country_code": "str"},
            "response": {"success": "bool", "expires_in": 600, "request_id": "str"},
            "errors": ["AUTH_RATE_LIMITED", "AUTH_INVALID_PHONE"],
        },
        {
            "method": "POST",
            "path": "/api/v1/auth/verify-otp",
            "request": {"phone": "str", "otp": "str", "device_id?": "str"},
            "response": {"access_token": "str", "refresh_token": "str", "user": "obj", "is_new_user": "bool"},
            "errors": ["AUTH_OTP_EXPIRED", "AUTH_OTP_INVALID"],
        },
    ],
    "chat": [
        {
            "method": "POST",
            "path": "/api/v1/chat/message",
            "request": {"content": "str", "type": "text|voice|image", "session_id": "str"},
            "response": {"message_id": "str", "response": "str", "actions_taken": "list", "quick_replies": "list"},
            "streaming": "SSE (Accept: text/event-stream)",
        },
        {
            "method": "GET",
            "path": "/api/v1/chat/history",
            "query": "?session_id=&before=<cursor>&limit=20",
            "response": {"messages": "list", "next_cursor": "str", "has_more": "bool"},
        },
    ],
    "email": [
        {
            "method": "GET",
            "path": "/api/v1/emails",
            "query": "?tab=action|meetings|finance|orders|all&cursor=&limit=20",
            "response": {"emails": "list", "next_cursor": "str", "counts_by_tab": "dict"},
        },
        {
            "method": "POST",
            "path": "/api/v1/emails/:id/action",
            "request": {"action": "accept_meeting|mark_paid|archive", "data?": "dict"},
            "response": {"success": "bool", "result": "obj"},
        },
    ],
    "finance": [
        {
            "method": "GET",
            "path": "/api/v1/finance/overview",
            "response": {
                "net_worth": "number", "monthly_spent": "number",
                "monthly_income": "number", "goals_summary": "obj",
                "bills_summary": "obj", "investments_summary": "obj",
            },
        },
        {
            "method": "POST",
            "path": "/api/v1/transactions",
            "request": {"amount": "number", "category": "str", "type": "str", "transaction_date": "str"},
            "response": {"transaction": "obj", "budget_impact": "obj", "goal_impact": "obj"},
            "idempotency_key": True,
        },
    ],
    "health": [
        {
            "method": "GET",
            "path": "/api/v1/health/today",
            "response": {"score": "number", "steps": "number", "sleep": "number", "water": "number"},
        },
        {
            "method": "POST",
            "path": "/api/v1/health/diet/scan",
            "request": "FormData(image, meal_type)",
            "response": {"food_items": "list", "total_nutrition": "obj", "confidence": "number"},
        },
    ],
    "notifications": [
        {
            "method": "GET",
            "path": "/api/v1/notifications",
            "query": "?status=unread&limit=20",
            "response": {"notifications": "list", "unread_count": "number"},
        },
        {
            "method": "PUT",
            "path": "/api/v1/notifications/settings",
            "request": {"channels": "dict", "categories": "dict", "quiet_hours": "dict"},
            "response": {"settings": "obj"},
        },
    ],
}


# ═══════════════════════════════════════════════════════════════════
# 5. TECH STACK RATIONALE (PRD Section 9.3 — lines 2101-2168)
# ═══════════════════════════════════════════════════════════════════

TECH_STACK = {
    "frontend": {
        "framework": "React Native + Expo",
        "rationale": [
            "Single codebase → iOS + Android (50% faster dev)",
            "OTA updates (fix bugs without App Store review)",
            "Expo SDK covers 95% of native features",
            "Reanimated 3: true 60fps animations on UI thread",
        ],
        "rejected": "Flutter (Dart ecosystem, smaller community)",
    },
    "backend": {
        "framework": "FastAPI + Python",
        "rationale": [
            "Native async (critical for AI API calls)",
            "Pydantic v2 validation (production-ready type safety)",
            "Auto-generated OpenAPI docs",
            "ML libraries readily available (pandas, numpy, scikit-learn)",
        ],
        "rejected": "Node.js/Express (weaker typing, ML ecosystem)",
    },
    "database": {
        "primary": "PostgreSQL + pgvector",
        "rationale": [
            "ACID compliance (financial data requires this)",
            "pgvector: Semantic search in same DB",
            "Mature at scale (Instagram, Reddit, Discord)",
            "Row-level security for multi-tenant isolation",
        ],
        "rejected": "MongoDB (no ACID for financial data)",
    },
    "queue": {
        "system": "Celery + Redis",
        "rationale": [
            "Proven reliability at massive scale",
            "Redis dual-purpose (cache + queue = one less service)",
            "Priority queues for critical reminders",
        ],
        "rejected": "AWS SQS (harder local dev, less visibility)",
    },
    "compute": {
        "platform": "ECS Fargate",
        "rationale": [
            "No server management",
            "Auto-scaling built-in",
            "Per-second billing (cost-efficient)",
        ],
        "rejected": "Kubernetes (over-complex for current scale)",
    },
}

COST_PROJECTIONS = {
    "100k_mau": {
        "ecs_fargate": 400,
        "rds_postgresql": 400,
        "elasticache": 200,
        "data_transfer": 100,
        "monitoring": 500,
        "other": 200,
        "total_usd": 1800,
        "total_inr_lakh": 1.5,
    },
    "1m_mau": {
        "ecs_scaled": 1500,
        "rds_larger": 1200,
        "elasticache": 600,
        "data_transfer": 500,
        "monitoring": 1000,
        "ai_api_costs": 45000,
        "other": 1200,
        "total_usd": 51000,
        "total_inr_lakh": 42,
        "revenue_at_10pct_premium": {
            "premium_users": 100000,
            "price_inr": 149,
            "monthly_revenue_crore": 1.49,
            "gross_margin_pct": 72,
        },
    },
}


def get_roadmap_summary() -> dict:
    """Get full roadmap status"""
    total_deliverables = 0
    for phase in ROADMAP.values():
        for sprint in phase["sprints"].values():
            total_deliverables += len(sprint["deliverables"])

    return {
        "phases": len(ROADMAP),
        "total_sprints": sum(len(p["sprints"]) for p in ROADMAP.values()),
        "total_deliverables": total_deliverables,
        "checkpoints": len(CHECKPOINTS),
        "risks": len(RISK_REGISTER),
        "api_domains": len(API_CONTRACTS),
        "api_endpoints": sum(len(v) for v in API_CONTRACTS.values()),
        "tech_stack_components": len(TECH_STACK),
    }


__all__ = [
    'ROADMAP', 'CHECKPOINTS', 'evaluate_checkpoint',
    'RISK_REGISTER',
    'API_CONTRACTS', 'TECH_STACK', 'COST_PROJECTIONS',
    'get_roadmap_summary',
]
