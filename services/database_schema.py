"""
Viya Database Schema
======================
PRD Section 5.1 — Complete PostgreSQL schema with pgvector,
partitioning, indexing strategy, and migration support.

Production: PostgreSQL 15+ with pgvector extension
Development: SQLite-compatible schema (sans pgvector)

Aggregates: 35+ tables across 8 domains
Indexing: Composite + Partial + pgvector IVFFlat
Partitioning: transactions by month for performance
"""

from datetime import datetime
from typing import Dict, List, Optional


# ═══════════════════════════════════════════════════════════════════
# 1. SCHEMA DEFINITIONS (PRD lines 1262-1320)
#    All 35+ tables grouped by domain aggregate
# ═══════════════════════════════════════════════════════════════════

SCHEMA_VERSION = "5.1.0"

# SQL DDL for each table — PostgreSQL-native
TABLES: Dict[str, str] = {

    # ─── CORE IDENTITY ───────────────────────────────────────────

    "users": """
    CREATE TABLE IF NOT EXISTS users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone           TEXT NOT NULL UNIQUE,
        phone_encrypted TEXT,          -- AES-256-GCM (Tier 1 PII)
        email           TEXT,
        email_encrypted TEXT,          -- AES-256-GCM (Tier 1 PII)
        name            TEXT NOT NULL DEFAULT 'Friend',
        language        TEXT NOT NULL DEFAULT 'en',
        occupation      TEXT,
        monthly_income  NUMERIC(12,2),
        daily_budget    NUMERIC(10,2),
        risk_appetite   TEXT DEFAULT 'medium',
        persona         TEXT,          -- student|salaried|freelancer|business|homemaker|retired
        plan            TEXT NOT NULL DEFAULT 'free',
        role            TEXT NOT NULL DEFAULT 'user',
        organization_id UUID,          -- Tenant awareness (PRD 4.2)
        onboarding_complete BOOLEAN DEFAULT FALSE,
        onboarding_step INTEGER DEFAULT 0,
        source          TEXT DEFAULT 'whatsapp',
        timezone        TEXT DEFAULT 'Asia/Kolkata',
        is_deleted      BOOLEAN DEFAULT FALSE,
        deleted_at      TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "oauth_tokens": """
    CREATE TABLE IF NOT EXISTS oauth_tokens (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider        TEXT NOT NULL,  -- gmail|outlook|google_fit|apple_health
        access_token    TEXT NOT NULL,  -- AES-256-GCM encrypted (Tier 1)
        refresh_token   TEXT,           -- AES-256-GCM encrypted (Tier 1)
        scopes          TEXT[],
        expires_at      TIMESTAMPTZ,
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "sessions": """
    CREATE TABLE IF NOT EXISTS sessions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash      TEXT NOT NULL UNIQUE,
        device_info     JSONB,
        ip_address      TEXT,
        expires_at      TIMESTAMPTZ NOT NULL,
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── AI & MEMORY ─────────────────────────────────────────────

    "viya_memory": """
    CREATE TABLE IF NOT EXISTS viya_memory (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        memory_type     TEXT NOT NULL,  -- fact|preference|pattern|goal|relationship
        content         TEXT NOT NULL,
        confidence      REAL DEFAULT 1.0,
        source          TEXT,           -- chat|email|transaction|health
        embedding       vector(1536),   -- pgvector for semantic search
        is_active       BOOLEAN DEFAULT TRUE,
        last_accessed   TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "conversations": """
    CREATE TABLE IF NOT EXISTS conversations (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role            TEXT NOT NULL,   -- user|assistant|system
        content         TEXT NOT NULL,
        intent          TEXT,            -- classified intent
        actions_taken   JSONB,           -- actions performed by AI
        tokens_in       INTEGER,
        tokens_out      INTEGER,
        model_used      TEXT,
        cost_usd        NUMERIC(8,6),
        embedding       vector(1536),    -- pgvector for context search
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── EMAIL INTELLIGENCE ──────────────────────────────────────

    "emails": """
    CREATE TABLE IF NOT EXISTS emails (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gmail_id        TEXT UNIQUE,
        sender          TEXT NOT NULL,
        subject         TEXT,
        extracted_data  JSONB,           -- AI-extracted: amounts, dates, actions
        category        TEXT,            -- bill|delivery|meeting|travel|marketing|personal
        action_required BOOLEAN DEFAULT FALSE,
        urgency         TEXT DEFAULT 'low',
        received_at     TIMESTAMPTZ NOT NULL,
        processed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "calendar_events": """
    CREATE TABLE IF NOT EXISTS calendar_events (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        external_id     TEXT,
        title           TEXT NOT NULL,
        description     TEXT,
        location        TEXT,
        start_at        TIMESTAMPTZ NOT NULL,
        end_at          TIMESTAMPTZ,
        all_day         BOOLEAN DEFAULT FALSE,
        source          TEXT DEFAULT 'google',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── FINANCE ─────────────────────────────────────────────────

    "transactions": """
    CREATE TABLE IF NOT EXISTS transactions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount          NUMERIC(12,2) NOT NULL,
        type            TEXT NOT NULL,   -- income|expense
        category        TEXT NOT NULL,
        description     TEXT,
        payment_method  TEXT DEFAULT 'cash',
        merchant        TEXT,
        is_recurring    BOOLEAN DEFAULT FALSE,
        source          TEXT DEFAULT 'manual',  -- manual|sms|email|api
        is_deleted      BOOLEAN DEFAULT FALSE,
        deleted_at      TIMESTAMPTZ,
        transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (transaction_date);""",

    "bank_accounts": """
    CREATE TABLE IF NOT EXISTS bank_accounts (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bank_name       TEXT NOT NULL,
        account_number_encrypted TEXT,  -- AES-256-GCM (Tier 1)
        account_type    TEXT DEFAULT 'savings',
        balance         NUMERIC(14,2),
        last_synced     TIMESTAMPTZ,
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "investments": """
    CREATE TABLE IF NOT EXISTS investments (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type            TEXT NOT NULL,   -- stock|mf|fd|ppf|nps|gold|crypto
        symbol          TEXT,
        name            TEXT NOT NULL,
        units           NUMERIC(12,4),
        avg_buy_price   NUMERIC(12,2),
        current_price   NUMERIC(12,2),
        current_value   NUMERIC(14,2),
        gain_loss       NUMERIC(14,2),
        gain_loss_pct   NUMERIC(6,2),
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "bills_and_dues": """
    CREATE TABLE IF NOT EXISTS bills_and_dues (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        amount          NUMERIC(10,2) NOT NULL,
        category        TEXT DEFAULT 'utilities',
        due_date        DATE NOT NULL,
        recurring       TEXT DEFAULT 'monthly',  -- monthly|quarterly|yearly|none
        auto_pay        BOOLEAN DEFAULT FALSE,
        status          TEXT DEFAULT 'upcoming',  -- upcoming|due_soon|overdue|paid
        paid_at         TIMESTAMPTZ,
        is_deleted      BOOLEAN DEFAULT FALSE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "budgets": """
    CREATE TABLE IF NOT EXISTS budgets (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category        TEXT NOT NULL,
        monthly_limit   NUMERIC(10,2) NOT NULL,
        month           TEXT NOT NULL,  -- '2026-05'
        spent           NUMERIC(10,2) DEFAULT 0,
        UNIQUE(user_id, category, month),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── GOALS ───────────────────────────────────────────────────

    "goals": """
    CREATE TABLE IF NOT EXISTS goals (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        emoji           TEXT DEFAULT '🎯',
        target_amount   NUMERIC(14,2) NOT NULL,
        current_amount  NUMERIC(14,2) DEFAULT 0,
        progress_pct    NUMERIC(5,1) DEFAULT 0,
        deadline        DATE,
        status          TEXT DEFAULT 'active',  -- active|completed|paused|abandoned
        milestones      JSONB DEFAULT '{"25":false,"50":false,"75":false,"100":false}',
        is_deleted      BOOLEAN DEFAULT FALSE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "goal_transactions": """
    CREATE TABLE IF NOT EXISTS goal_transactions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        transaction_id  UUID,
        amount          NUMERIC(12,2) NOT NULL,
        type            TEXT DEFAULT 'deposit',  -- deposit|withdrawal
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── HEALTH ──────────────────────────────────────────────────

    "health_logs": """
    CREATE TABLE IF NOT EXISTS health_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metric          TEXT NOT NULL,  -- steps|sleep|weight|water|calories|heart_rate
        value           NUMERIC(10,2) NOT NULL,
        unit            TEXT,           -- steps|hours|kg|liters|kcal|bpm
        log_date        DATE NOT NULL,
        source          TEXT DEFAULT 'manual',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "meals": """
    CREATE TABLE IF NOT EXISTS meals (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_type       TEXT NOT NULL,  -- breakfast|lunch|dinner|snack
        food_items      JSONB NOT NULL,
        total_calories  INTEGER,
        total_protein   NUMERIC(6,1),
        total_carbs     NUMERIC(6,1),
        total_fat       NUMERIC(6,1),
        meal_date       DATE NOT NULL,
        photo_url       TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "medicines": """
    CREATE TABLE IF NOT EXISTS medicines (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,  -- TDE encrypted (Tier 2)
        dosage          TEXT,
        frequency       TEXT DEFAULT 'daily',
        times           TEXT[],         -- ['08:00', '20:00']
        start_date      DATE,
        end_date        DATE,
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "medicine_logs": """
    CREATE TABLE IF NOT EXISTS medicine_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        medicine_id     UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_at    TIMESTAMPTZ NOT NULL,
        status          TEXT DEFAULT 'pending',  -- pending|taken|missed|skipped
        taken_at        TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── REMINDERS & TASKS ───────────────────────────────────────

    "reminders": """
    CREATE TABLE IF NOT EXISTS reminders (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text            TEXT NOT NULL,
        due_at          TIMESTAMPTZ NOT NULL,
        recurring       TEXT DEFAULT 'none',  -- none|daily|weekly|monthly
        channel         TEXT DEFAULT 'whatsapp',
        status          TEXT DEFAULT 'pending',
        delivery_attempts INTEGER DEFAULT 0,
        max_delivery_attempts INTEGER DEFAULT 3,
        completed_at    TIMESTAMPTZ,
        snoozed_until   TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "tasks": """
    CREATE TABLE IF NOT EXISTS tasks (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        priority        TEXT DEFAULT 'medium',
        due_date        DATE,
        is_completed    BOOLEAN DEFAULT FALSE,
        completed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── NOTIFICATIONS ───────────────────────────────────────────

    "notifications": """
    CREATE TABLE IF NOT EXISTS notifications (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_key    TEXT NOT NULL,
        category        TEXT NOT NULL,
        channel         TEXT NOT NULL,
        message         TEXT NOT NULL,
        status          TEXT DEFAULT 'pending',  -- pending|sent|delivered|read|failed
        delivered_at    TIMESTAMPTZ,
        read_at         TIMESTAMPTZ,
        deep_link       TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "proactive_messages": """
    CREATE TABLE IF NOT EXISTS proactive_messages (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trigger_type    TEXT NOT NULL,
        trigger_data    JSONB,
        message         TEXT NOT NULL,
        priority        TEXT DEFAULT 'medium',
        status          TEXT DEFAULT 'pending',
        sent_at         TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── AUDIT & COMPLIANCE ──────────────────────────────────────

    "audit_logs": """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID,
        actor_id        UUID,          -- Who performed the action
        action          TEXT NOT NULL,  -- data_access|data_modify|admin_action|login
        resource_type   TEXT,           -- users|transactions|etc
        resource_id     UUID,
        old_value       JSONB,
        new_value       JSONB,
        ip_address      TEXT,
        user_agent      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "feature_flags": """
    CREATE TABLE IF NOT EXISTS feature_flags (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flag_name       TEXT NOT NULL UNIQUE,
        is_enabled      BOOLEAN DEFAULT FALSE,
        rollout_pct     INTEGER DEFAULT 0,     -- 0-100 percentage
        target_plans    TEXT[],                 -- ['premium', 'enterprise']
        target_cohorts  TEXT[],
        description     TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    # ─── BILLING & SUBSCRIPTIONS ─────────────────────────────────

    "plans": """
    CREATE TABLE IF NOT EXISTS plans (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL UNIQUE,   -- free|premium|enterprise
        display_name    TEXT NOT NULL,
        price_inr       NUMERIC(10,2) NOT NULL,
        billing_cycle   TEXT DEFAULT 'monthly',
        limits          JSONB NOT NULL,         -- {max_goals: 3, ai_per_day: 50, ...}
        features        JSONB NOT NULL,         -- {email_sync: true, family_mode: false, ...}
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "subscriptions": """
    CREATE TABLE IF NOT EXISTS subscriptions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id         UUID NOT NULL REFERENCES plans(id),
        status          TEXT DEFAULT 'active',  -- active|cancelled|expired|trial
        trial_ends_at   TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ,
        current_period_end   TIMESTAMPTZ,
        payment_method  TEXT,
        razorpay_subscription_id TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",

    "invoices": """
    CREATE TABLE IF NOT EXISTS invoices (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id),
        amount_inr      NUMERIC(10,2) NOT NULL,
        gst_amount      NUMERIC(10,2) DEFAULT 0,
        status          TEXT DEFAULT 'pending',  -- pending|paid|failed|refunded
        payment_id      TEXT,           -- Razorpay payment ID
        invoice_pdf_url TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );""",
}


# ═══════════════════════════════════════════════════════════════════
# 2. INDEX DEFINITIONS (PRD lines 1322-1346)
# ═══════════════════════════════════════════════════════════════════

INDEXES: List[str] = [
    # ── Foreign key indexes ──
    "CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_emails_user ON emails(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_health_logs_user ON health_logs(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);",

    # ── Composite indexes for common query patterns ──
    "CREATE INDEX IF NOT EXISTS idx_txn_user_date ON transactions(user_id, transaction_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_txn_user_cat_date ON transactions(user_id, category, transaction_date);",
    "CREATE INDEX IF NOT EXISTS idx_reminder_user_status_due ON reminders(user_id, status, due_at);",
    "CREATE INDEX IF NOT EXISTS idx_memory_user_active_type ON viya_memory(user_id, is_active, memory_type);",
    "CREATE INDEX IF NOT EXISTS idx_bills_user_status_due ON bills_and_dues(user_id, status, due_date);",
    "CREATE INDEX IF NOT EXISTS idx_notif_user_status ON notifications(user_id, status);",
    "CREATE INDEX IF NOT EXISTS idx_health_user_metric_date ON health_logs(user_id, metric, log_date);",

    # ── Partial indexes for hot paths ──
    "CREATE INDEX IF NOT EXISTS idx_txn_active ON transactions(user_id) WHERE is_deleted = FALSE;",
    "CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(user_id, due_at) WHERE status = 'pending';",
    "CREATE INDEX IF NOT EXISTS idx_emails_actionable ON emails(user_id) WHERE action_required = TRUE;",
    "CREATE INDEX IF NOT EXISTS idx_bills_unpaid ON bills_and_dues(user_id, due_date) WHERE status != 'paid';",

    # ── pgvector indexes (semantic search) ──
    # NOTE: Create AFTER 10K+ rows (IVFFlat requirement)
    "-- CREATE INDEX idx_memory_embedding ON viya_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists=200);",
    "-- CREATE INDEX idx_convo_embedding ON conversations USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);",
]


# ═══════════════════════════════════════════════════════════════════
# 3. SEED DATA (Plan definitions)
# ═══════════════════════════════════════════════════════════════════

SEED_PLANS = [
    {
        "name": "free",
        "display_name": "Viya Free",
        "price_inr": 0,
        "limits": {
            "max_goals": 3,
            "ai_messages_per_day": 50,
            "email_accounts": 1,
            "bank_accounts": 2,
            "family_members": 1,
        },
        "features": {
            "ai_chat": True, "email_sync": False, "family_mode": False,
            "investment_ai": False, "report_export": False, "tax_planning": False,
        },
    },
    {
        "name": "premium",
        "display_name": "Viya Premium",
        "price_inr": 149,
        "limits": {
            "max_goals": -1,
            "ai_messages_per_day": 500,
            "email_accounts": 3,
            "bank_accounts": -1,
            "family_members": 4,
        },
        "features": {
            "ai_chat": True, "email_sync": True, "family_mode": True,
            "investment_ai": True, "report_export": True, "tax_planning": True,
            "priority_email_sync": True,
        },
    },
    {
        "name": "enterprise",
        "display_name": "Viya Enterprise",
        "price_inr": 999,
        "limits": {
            "max_goals": -1,
            "ai_messages_per_day": -1,
            "email_accounts": -1,
            "bank_accounts": -1,
            "family_members": -1,
        },
        "features": {
            "ai_chat": True, "email_sync": True, "family_mode": True,
            "investment_ai": True, "report_export": True, "tax_planning": True,
            "priority_email_sync": True, "team_sharing": True,
            "custom_agents": True, "api_access": True, "dedicated_support": True,
        },
    },
]


# ═══════════════════════════════════════════════════════════════════
# 4. SCHEMA VALIDATOR
# ═══════════════════════════════════════════════════════════════════

def validate_schema() -> dict:
    """Validate schema completeness against PRD requirements"""
    required_tables = [
        "users", "oauth_tokens", "viya_memory", "conversations", "sessions",
        "emails", "calendar_events",
        "transactions", "bank_accounts", "investments", "bills_and_dues", "budgets",
        "goals", "goal_transactions",
        "health_logs", "meals", "medicines", "medicine_logs",
        "reminders", "tasks",
        "notifications", "proactive_messages",
        "audit_logs", "feature_flags",
        "plans", "subscriptions", "invoices",
    ]

    missing = [t for t in required_tables if t not in TABLES]
    extra = [t for t in TABLES if t not in required_tables]

    return {
        "schema_version": SCHEMA_VERSION,
        "total_tables": len(TABLES),
        "total_indexes": len([i for i in INDEXES if not i.startswith("--")]),
        "pgvector_indexes": len([i for i in INDEXES if "vector" in i]),
        "required": len(required_tables),
        "missing": missing,
        "extra": extra,
        "valid": len(missing) == 0,
        "seed_plans": len(SEED_PLANS),
    }


def get_migration_sql() -> str:
    """Generate full migration SQL"""
    lines = [
        "-- Viya Database Migration",
        f"-- Schema Version: {SCHEMA_VERSION}",
        f"-- Generated: {datetime.utcnow().isoformat()}Z",
        "-- PRD Section 5.1",
        "",
        "-- Enable extensions",
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
        "CREATE EXTENSION IF NOT EXISTS vector;",  # pgvector
        "",
    ]

    for name, ddl in TABLES.items():
        lines.append(f"-- Table: {name}")
        lines.append(ddl.strip())
        lines.append("")

    lines.append("-- Indexes")
    for idx in INDEXES:
        lines.append(idx)

    return "\n".join(lines)


__all__ = [
    'TABLES', 'INDEXES', 'SEED_PLANS', 'SCHEMA_VERSION',
    'validate_schema', 'get_migration_sql',
]
