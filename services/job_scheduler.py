"""
Viya Background Job Scheduler
================================
PRD Section 4.3 — Scheduled + Event-Driven Jobs

Production: Celery + Redis (reliable, battle-tested)
Development: In-memory scheduler with APScheduler fallback

Job Categories:
  SCHEDULED: Cron-like recurring tasks (email sync, morning brief, etc.)
  EVENT-DRIVEN: Triggered by user actions (salary received, goal milestone, etc.)

Retry Policy Standard (PRD lines 1112-1118):
  Attempt 1: Immediate
  Attempt 2: 1 minute delay
  Attempt 3: 5 minutes delay
  Attempt 4: 30 minutes delay
  Attempt 5: 2 hours delay
  After 5 failures: Dead letter queue → alert ops team
"""

import time
import uuid
import logging
from datetime import datetime, timedelta
from typing import Callable, Optional, Dict, List, Any
from collections import defaultdict
from enum import Enum


logger = logging.getLogger("viya-jobs")


# ═══════════════════════════════════════════════════════════════════
# 1. JOB DEFINITIONS (PRD lines 1050-1123)
# ═══════════════════════════════════════════════════════════════════

class JobPriority(Enum):
    CRITICAL = "critical"   # reminder_delivery — must not miss
    HIGH = "high"           # morning_brief, salary detection
    MEDIUM = "medium"       # email_sync, weekly_report
    LOW = "low"             # investment_price_update, subscription_audit


class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    DEAD_LETTER = "dead_letter"


# Retry delays in seconds (PRD lines 1112-1118)
RETRY_DELAYS = [0, 60, 300, 1800, 7200]  # immediate, 1m, 5m, 30m, 2h
MAX_RETRIES = 5


# ═══════════════════════════════════════════════════════════════════
# 2. SCHEDULED JOB DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

SCHEDULED_JOBS = {
    "email_sync_job": {
        "description": "Sync emails for connected users",
        "frequency": "*/15 * * * *",  # Every 15 minutes
        "priority": JobPriority.MEDIUM,
        "retry": 3,
        "alert_threshold": 0.05,  # Alert if >5% failure rate
    },
    "morning_brief_job": {
        "description": "Generate and send morning brief at user's local 7:30 AM",
        "frequency": "30 7 * * *",  # Daily at 7:30 AM
        "priority": JobPriority.HIGH,
        "data": ["emails", "bills", "goals", "health", "reminders"],
        "delivery": ["whatsapp", "in_app"],
    },
    "proactive_check_job": {
        "description": "Check trigger conditions for proactive messages",
        "frequency": "0 * * * *",  # Every hour
        "priority": JobPriority.LOW,
        "batch_size": 1000,
        "triggers": 12,
    },
    "investment_price_update": {
        "description": "Update stock prices and MF NAVs after market close",
        "frequency": "35 15 * * 1-5",  # 3:35 PM IST, weekdays
        "priority": JobPriority.LOW,
    },
    "subscription_audit_job": {
        "description": "Check subscription usage vs spend",
        "frequency": "0 10 1-7 * 0",  # First Sunday of month, 10 AM
        "priority": JobPriority.LOW,
    },
    "weekly_report_job": {
        "description": "Generate weekly report PDF + WhatsApp summary",
        "frequency": "0 19 * * 0",  # Every Sunday at 7 PM
        "priority": JobPriority.MEDIUM,
        "output": ["pdf", "whatsapp"],
    },
    "reminder_delivery_job": {
        "description": "Find and deliver due reminders",
        "frequency": "* * * * *",  # Every minute
        "priority": JobPriority.CRITICAL,
        "pattern": "redis_sorted_set",
    },
}


# ═══════════════════════════════════════════════════════════════════
# 3. EVENT-DRIVEN JOB TRIGGERS (PRD lines 1091-1110)
# ═══════════════════════════════════════════════════════════════════

EVENT_TRIGGERS = {
    "on_email_received": {
        "description": "Classify email → extract data → create alert",
        "sla_seconds": 120,  # <2 minutes from email to notification
        "priority": JobPriority.HIGH,
    },
    "on_salary_received": {
        "description": "Send salary allocation suggestion",
        "trigger": "large_income_detected",
        "timing": "immediate",
        "priority": JobPriority.HIGH,
    },
    "on_goal_milestone": {
        "description": "Send celebration message + create share moment",
        "trigger": "goal.current >= milestone_threshold",
        "priority": JobPriority.MEDIUM,
    },
    "on_bill_overdue": {
        "description": "Escalate alert (WhatsApp → push)",
        "trigger": "bill.due_date < now AND status == pending",
        "frequency": "every_24h_until_resolved",
        "priority": JobPriority.HIGH,
    },
}


# ═══════════════════════════════════════════════════════════════════
# 4. JOB EXECUTION ENGINE
# ═══════════════════════════════════════════════════════════════════

class JobRecord:
    """Record of a job execution"""
    
    def __init__(self, job_name: str, priority: JobPriority = JobPriority.MEDIUM,
                 payload: dict = None):
        self.id = str(uuid.uuid4())[:12]
        self.job_name = job_name
        self.priority = priority
        self.payload = payload or {}
        self.status = JobStatus.PENDING
        self.attempt = 0
        self.max_retries = MAX_RETRIES
        self.created_at = datetime.utcnow()
        self.started_at = None
        self.completed_at = None
        self.error = None
        self.result = None
        self.duration_ms = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "job_name": self.job_name,
            "priority": self.priority.value,
            "status": self.status.value,
            "attempt": self.attempt,
            "created_at": self.created_at.isoformat() + "Z",
            "started_at": self.started_at.isoformat() + "Z" if self.started_at else None,
            "completed_at": self.completed_at.isoformat() + "Z" if self.completed_at else None,
            "duration_ms": self.duration_ms,
            "error": self.error,
        }


class JobScheduler:
    """
    In-memory job scheduler for development.
    Production upgrade path: Replace with Celery + Redis.
    """
    
    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        self._history: List[JobRecord] = []
        self._dead_letter: List[JobRecord] = []
        self._metrics = defaultdict(lambda: {"enqueued": 0, "completed": 0, 
                                              "failed": 0, "total_ms": 0})
    
    def register(self, job_name: str, handler: Callable):
        """Register a job handler function"""
        self._handlers[job_name] = handler
        logger.info(f"[JobScheduler] Registered handler: {job_name}")
    
    async def enqueue(self, job_name: str, payload: dict = None,
                      priority: JobPriority = JobPriority.MEDIUM) -> JobRecord:
        """Enqueue a job for execution"""
        job_def = SCHEDULED_JOBS.get(job_name) or EVENT_TRIGGERS.get(job_name)
        if job_def:
            priority = job_def.get("priority", priority)
        
        record = JobRecord(job_name, priority, payload)
        self._metrics[job_name]["enqueued"] += 1
        
        # Execute immediately (in-memory mode)
        await self._execute(record)
        return record
    
    async def _execute(self, record: JobRecord):
        """Execute a job with retry logic"""
        handler = self._handlers.get(record.job_name)
        
        if not handler:
            record.status = JobStatus.FAILED
            record.error = f"No handler registered for {record.job_name}"
            self._history.append(record)
            return
        
        while record.attempt < record.max_retries:
            record.attempt += 1
            record.status = JobStatus.RUNNING
            record.started_at = datetime.utcnow()
            
            try:
                # Execute handler
                if callable(handler):
                    result = handler(record.payload)
                    # Handle async handlers
                    if hasattr(result, '__await__'):
                        result = await result
                    record.result = result
                
                # Success
                record.status = JobStatus.COMPLETED
                record.completed_at = datetime.utcnow()
                record.duration_ms = int(
                    (record.completed_at - record.started_at).total_seconds() * 1000
                )
                self._metrics[record.job_name]["completed"] += 1
                self._metrics[record.job_name]["total_ms"] += record.duration_ms
                self._history.append(record)
                return
                
            except Exception as e:
                record.error = str(e)
                record.status = JobStatus.RETRYING
                self._metrics[record.job_name]["failed"] += 1
                
                # Check if we should retry
                if record.attempt < record.max_retries:
                    delay = RETRY_DELAYS[min(record.attempt, len(RETRY_DELAYS) - 1)]
                    logger.warning(
                        f"[Job] {record.job_name} attempt {record.attempt} failed: {e}. "
                        f"Retrying in {delay}s..."
                    )
                    # In production: schedule retry with delay via Celery
                    # In dev: just retry immediately
                    continue
                else:
                    # Dead letter queue
                    record.status = JobStatus.DEAD_LETTER
                    self._dead_letter.append(record)
                    logger.error(
                        f"[Job] {record.job_name} exhausted retries ({record.max_retries}). "
                        f"Moved to dead letter queue. Error: {e}"
                    )
                    self._history.append(record)
                    return
    
    def get_metrics(self) -> dict:
        """
        Job monitoring metrics (PRD lines 1120-1123):
        jobs_enqueued, jobs_completed, jobs_failed, avg_duration
        """
        result = {}
        for job_name, m in self._metrics.items():
            avg_ms = (m["total_ms"] / m["completed"]) if m["completed"] > 0 else 0
            result[job_name] = {
                "enqueued": m["enqueued"],
                "completed": m["completed"],
                "failed": m["failed"],
                "avg_duration_ms": round(avg_ms, 1),
            }
        
        return {
            "jobs": result,
            "dead_letter_count": len(self._dead_letter),
            "total_executed": len(self._history),
            "alert": len(self._dead_letter) > 10 or 
                     any(m["failed"] / max(m["enqueued"], 1) > 0.05 
                         for m in self._metrics.values()),
        }
    
    def get_dead_letter_queue(self) -> List[dict]:
        """Get failed jobs for ops review"""
        return [j.to_dict() for j in self._dead_letter[-50:]]


# ═══════════════════════════════════════════════════════════════════
# 5. DEFAULT JOB HANDLERS (Stubs for development)
# ═══════════════════════════════════════════════════════════════════

def _stub_email_sync(payload: dict) -> dict:
    """Stub: Sync emails for a user"""
    user_id = payload.get("user_id", "unknown")
    return {"synced": 0, "user_id": user_id, "status": "stub"}

def _stub_morning_brief(payload: dict) -> dict:
    """Stub: Generate morning brief"""
    return {"user_id": payload.get("user_id"), "sections": 5, "status": "stub"}

def _stub_proactive_check(payload: dict) -> dict:
    """Stub: Check proactive trigger conditions"""
    return {"users_checked": 0, "alerts_generated": 0, "status": "stub"}

def _stub_reminder_delivery(payload: dict) -> dict:
    """Stub: Find and deliver due reminders"""
    return {"reminders_due": 0, "delivered": 0, "status": "stub"}

def _stub_weekly_report(payload: dict) -> dict:
    """Stub: Generate weekly report"""
    return {"user_id": payload.get("user_id"), "pdf_generated": False, "status": "stub"}


# ═══════════════════════════════════════════════════════════════════
# 6. SINGLETON + AUTO-REGISTER
# ═══════════════════════════════════════════════════════════════════

job_scheduler = JobScheduler()

# Register stub handlers
job_scheduler.register("email_sync_job", _stub_email_sync)
job_scheduler.register("morning_brief_job", _stub_morning_brief)
job_scheduler.register("proactive_check_job", _stub_proactive_check)
job_scheduler.register("reminder_delivery_job", _stub_reminder_delivery)
job_scheduler.register("weekly_report_job", _stub_weekly_report)


__all__ = [
    'JobScheduler', 'JobRecord', 'JobPriority', 'JobStatus',
    'SCHEDULED_JOBS', 'EVENT_TRIGGERS', 'RETRY_DELAYS',
    'job_scheduler',
]
