"""
Viya Database Migration Manager
==================================
PRD Section 5.3 — Alembic-compatible migration system with
zero-downtime patterns, backup strategy, and migration testing.

Principles:
  - Migrations are code: Committed to git, reviewed in PRs
  - Forward-only: Never write rollback migrations
  - Small and frequent: Each migration does one thing
  - Zero-downtime: All changes backward-compatible during deploy

Zero-Downtime Patterns:
  Adding column:     Nullable first → backfill → add NOT NULL
  Renaming column:   Add new → write both → read new → drop old
  Creating index:    CREATE INDEX CONCURRENTLY (non-blocking)
  Dropping table:    Set deprecated_at → wait 30d → verify → drop

Backup Strategy:
  Automated daily, point-in-time WAL, cross-region replication
  Target: RTO <2 hours, RPO <1 hour
"""

import time
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from collections import OrderedDict


# ═══════════════════════════════════════════════════════════════════
# 1. MIGRATION DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

class MigrationStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Migration:
    """
    Represents a single database migration step.
    Each migration does exactly one thing.
    """

    def __init__(self, version: str, description: str, sql: str,
                 is_concurrent: bool = False, estimated_seconds: int = 5):
        self.version = version
        self.description = description
        self.sql = sql
        self.is_concurrent = is_concurrent  # For CREATE INDEX CONCURRENTLY
        self.estimated_seconds = estimated_seconds
        self.checksum = hashlib.sha256(sql.encode()).hexdigest()[:12]

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "description": self.description,
            "checksum": self.checksum,
            "is_concurrent": self.is_concurrent,
            "estimated_seconds": self.estimated_seconds,
        }


# ═══════════════════════════════════════════════════════════════════
# 2. MIGRATION REGISTRY
#    Ordered list of all migrations — append only, never modify
# ═══════════════════════════════════════════════════════════════════

MIGRATIONS: List[Migration] = [

    # ── v001: Initial schema ──
    Migration(
        "001", "Create users table",
        """CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL DEFAULT 'Friend',
            language TEXT NOT NULL DEFAULT 'en',
            plan TEXT NOT NULL DEFAULT 'free',
            role TEXT NOT NULL DEFAULT 'user',
            onboarding_complete BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    Migration(
        "002", "Create transactions table (partitioned)",
        """CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            amount NUMERIC(12,2) NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            payment_method TEXT DEFAULT 'cash',
            source TEXT DEFAULT 'manual',
            is_deleted BOOLEAN DEFAULT FALSE,
            transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        ) PARTITION BY RANGE (transaction_date);""",
    ),

    Migration(
        "003", "Create goals table",
        """CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            emoji TEXT DEFAULT '🎯',
            target_amount NUMERIC(14,2) NOT NULL,
            current_amount NUMERIC(14,2) DEFAULT 0,
            progress_pct NUMERIC(5,1) DEFAULT 0,
            status TEXT DEFAULT 'active',
            milestones JSONB DEFAULT '{}',
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    Migration(
        "004", "Create reminders table",
        """CREATE TABLE IF NOT EXISTS reminders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            text TEXT NOT NULL,
            due_at TIMESTAMPTZ NOT NULL,
            recurring TEXT DEFAULT 'none',
            channel TEXT DEFAULT 'whatsapp',
            status TEXT DEFAULT 'pending',
            delivery_attempts INTEGER DEFAULT 0,
            max_delivery_attempts INTEGER DEFAULT 3,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    Migration(
        "005", "Create notifications table",
        """CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            template_key TEXT NOT NULL,
            category TEXT NOT NULL,
            channel TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            delivered_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    # ── v006-008: Indexes ──
    Migration(
        "006", "Index: transactions by user+date (concurrent)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_txn_user_date "
        "ON transactions(user_id, transaction_date DESC);",
        is_concurrent=True,
    ),

    Migration(
        "007", "Index: reminders pending (partial, concurrent)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_pending "
        "ON reminders(user_id, due_at) WHERE status = 'pending';",
        is_concurrent=True,
    ),

    Migration(
        "008", "Index: notifications by user+status (concurrent)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notif_user_status "
        "ON notifications(user_id, status);",
        is_concurrent=True,
    ),

    # ── v009: Add encryption columns (zero-downtime pattern) ──
    Migration(
        "009", "Add encrypted PII columns to users (nullable first)",
        """ALTER TABLE users
            ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
            ADD COLUMN IF NOT EXISTS email TEXT,
            ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
            ADD COLUMN IF NOT EXISTS occupation TEXT,
            ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12,2),
            ADD COLUMN IF NOT EXISTS daily_budget NUMERIC(10,2),
            ADD COLUMN IF NOT EXISTS persona TEXT,
            ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
            ADD COLUMN IF NOT EXISTS organization_id UUID,
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;""",
    ),

    # ── v010: AI tables with pgvector ──
    Migration(
        "010", "Enable pgvector extension + create viya_memory",
        """CREATE EXTENSION IF NOT EXISTS vector;
        CREATE TABLE IF NOT EXISTS viya_memory (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            memory_type TEXT NOT NULL,
            content TEXT NOT NULL,
            confidence REAL DEFAULT 1.0,
            source TEXT,
            embedding vector(1536),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    # ── v011: Health tables ──
    Migration(
        "011", "Create health_logs and medicines tables",
        """CREATE TABLE IF NOT EXISTS health_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            metric TEXT NOT NULL,
            value NUMERIC(10,2) NOT NULL,
            unit TEXT,
            log_date DATE NOT NULL,
            source TEXT DEFAULT 'manual',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS medicines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT DEFAULT 'daily',
            times TEXT[],
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    # ── v012: Audit & compliance ──
    Migration(
        "012", "Create audit_logs table",
        """CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            actor_id UUID,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id UUID,
            old_value JSONB,
            new_value JSONB,
            ip_address TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),

    # ── v013: Billing ──
    Migration(
        "013", "Create plans and subscriptions tables",
        """CREATE TABLE IF NOT EXISTS plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            price_inr NUMERIC(10,2) NOT NULL,
            limits JSONB NOT NULL,
            features JSONB NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            plan_id UUID NOT NULL,
            status TEXT DEFAULT 'active',
            trial_ends_at TIMESTAMPTZ,
            current_period_start TIMESTAMPTZ,
            current_period_end TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );""",
    ),
]


# ═══════════════════════════════════════════════════════════════════
# 3. MIGRATION RUNNER
# ═══════════════════════════════════════════════════════════════════

class MigrationRunner:
    """
    Manages and executes database migrations.
    Production: Wraps Alembic commands.
    Development: In-memory migration tracking.
    """

    def __init__(self):
        self._applied: OrderedDict[str, dict] = OrderedDict()
        self._history: List[dict] = []

    def get_pending(self) -> List[Migration]:
        """Get migrations not yet applied"""
        return [m for m in MIGRATIONS if m.version not in self._applied]

    def get_applied(self) -> List[dict]:
        """Get list of applied migrations"""
        return list(self._applied.values())

    def apply(self, migration: Migration) -> dict:
        """
        Apply a single migration.
        Production: Execute SQL against database.
        Development: Track in memory.
        """
        start = time.time()
        record = {
            "version": migration.version,
            "description": migration.description,
            "checksum": migration.checksum,
            "status": MigrationStatus.RUNNING,
            "started_at": datetime.utcnow().isoformat() + "Z",
            "is_concurrent": migration.is_concurrent,
        }

        try:
            # In production: execute migration.sql against DB
            # In dev: simulate execution
            duration_ms = round((time.time() - start) * 1000, 1)

            record["status"] = MigrationStatus.COMPLETED
            record["completed_at"] = datetime.utcnow().isoformat() + "Z"
            record["duration_ms"] = duration_ms

            # Alert if migration takes >30 seconds
            if duration_ms > 30000:
                record["warning"] = f"Migration took {duration_ms}ms (>30s threshold)"

            self._applied[migration.version] = record
            self._history.append(record)
            return record

        except Exception as e:
            record["status"] = MigrationStatus.FAILED
            record["error"] = str(e)
            self._history.append(record)
            return record

    def apply_all_pending(self) -> dict:
        """Apply all pending migrations in order"""
        pending = self.get_pending()
        results = []
        for m in pending:
            result = self.apply(m)
            results.append(result)
            if result["status"] == MigrationStatus.FAILED:
                break  # Stop on failure

        return {
            "total": len(pending),
            "applied": sum(1 for r in results if r["status"] == MigrationStatus.COMPLETED),
            "failed": sum(1 for r in results if r["status"] == MigrationStatus.FAILED),
            "results": results,
        }

    def validate_checksums(self) -> dict:
        """Verify no previously applied migrations have been modified"""
        mismatches = []
        for m in MIGRATIONS:
            if m.version in self._applied:
                stored = self._applied[m.version].get("checksum")
                if stored and stored != m.checksum:
                    mismatches.append({
                        "version": m.version,
                        "expected": stored,
                        "actual": m.checksum,
                    })

        return {
            "valid": len(mismatches) == 0,
            "mismatches": mismatches,
        }

    def get_status(self) -> dict:
        """Get migration system status"""
        return {
            "total_migrations": len(MIGRATIONS),
            "applied": len(self._applied),
            "pending": len(self.get_pending()),
            "latest_applied": list(self._applied.keys())[-1] if self._applied else None,
            "latest_available": MIGRATIONS[-1].version if MIGRATIONS else None,
            "checksums_valid": self.validate_checksums()["valid"],
        }


migration_runner = MigrationRunner()


# ═══════════════════════════════════════════════════════════════════
# 4. ZERO-DOWNTIME HELPERS
# ═══════════════════════════════════════════════════════════════════

class ZeroDowntimePatterns:
    """
    PRD Section 5.3: Safe migration patterns.
    Generates migration SQL following zero-downtime rules.
    """

    @staticmethod
    def add_column(table: str, column: str, col_type: str,
                   default: str = None) -> List[str]:
        """
        Safe pattern: Add nullable column first.
        PRD: Never add NOT NULL without default in single migration.
        """
        steps = []
        if default:
            steps.append(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "
                f"{column} {col_type} DEFAULT {default};"
            )
        else:
            steps.append(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "
                f"{column} {col_type};"
            )
        return steps

    @staticmethod
    def rename_column(table: str, old_name: str, new_name: str,
                      col_type: str) -> List[str]:
        """
        Safe pattern: 4-step rename.
        Step 1: Add new column
        Step 2: Copy + write both (app change)
        Step 3: Read new (app change)
        Step 4: Drop old
        """
        return [
            f"-- Step 1: Add new column",
            f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {new_name} {col_type};",
            f"-- Step 2: Backfill data",
            f"UPDATE {table} SET {new_name} = {old_name} WHERE {new_name} IS NULL;",
            f"-- Step 3: Update app to read from {new_name} (manual)",
            f"-- Step 4: Drop old column (separate migration after deploy)",
            f"-- ALTER TABLE {table} DROP COLUMN {old_name};",
        ]

    @staticmethod
    def create_index(table: str, columns: List[str], name: str,
                     where: str = None) -> str:
        """
        PRD: Always CREATE INDEX CONCURRENTLY (non-blocking)
        """
        cols = ", ".join(columns)
        sql = f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {name} ON {table}({cols})"
        if where:
            sql += f" WHERE {where}"
        return sql + ";"

    @staticmethod
    def soft_deprecate_table(table: str) -> str:
        """
        PRD: Never drop immediately — deprecate first.
        Set deprecated_at, wait 30d, verify, then drop.
        """
        return (
            f"-- Step 1: Mark deprecated\n"
            f"COMMENT ON TABLE {table} IS 'DEPRECATED: Scheduled for removal. "
            f"Do not add new reads/writes.';\n"
            f"-- Step 2: Wait 30 days, verify no reads/writes\n"
            f"-- Step 3: DROP TABLE {table}; (separate PR after review)"
        )


# ═══════════════════════════════════════════════════════════════════
# 5. BACKUP STRATEGY (PRD lines 1442-1459)
# ═══════════════════════════════════════════════════════════════════

BACKUP_STRATEGY = {
    "automated_daily": {
        "provider": "AWS RDS",
        "type": "full_snapshot",
        "frequency": "daily",
        "retention": {
            "daily": 7,
            "weekly": 4,
            "monthly": 12,
        },
    },
    "point_in_time": {
        "provider": "AWS RDS",
        "type": "continuous_wal",
        "description": "Restore to any second within retention window",
        "retention_days": 7,
    },
    "cross_region": {
        "primary": "ap-south-1",   # Mumbai
        "secondary": "ap-southeast-1",  # Singapore
        "replication": "automatic",
    },
    "recovery_targets": {
        "rto_hours": 2,   # Recovery Time Objective
        "rpo_hours": 1,   # Recovery Point Objective
    },
    "testing": {
        "frequency": "quarterly",
        "steps": [
            "Restore last backup to isolated environment",
            "Verify data integrity (checksums)",
            "Run application smoke tests against restored DB",
            "Document actual RTO/RPO achieved",
        ],
    },
}


def get_backup_status() -> dict:
    """Get current backup configuration status"""
    return {
        "strategy": BACKUP_STRATEGY,
        "migration_status": migration_runner.get_status(),
        "zero_downtime_enabled": True,
        "last_backup_test": "Not yet performed (quarterly schedule)",
    }


__all__ = [
    'Migration', 'MigrationStatus', 'MIGRATIONS',
    'MigrationRunner', 'migration_runner',
    'ZeroDowntimePatterns', 'BACKUP_STRATEGY',
    'get_backup_status',
]
