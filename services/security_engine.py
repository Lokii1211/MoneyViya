"""
Viya Security & Compliance Engine
====================================
PRD Section 6 — Threat model, audit trails,
high availability, and circuit breakers.

6.1 Threat Model:     5 risk categories with mitigations
6.2 Audit Trails:     Immutable, append-only audit logging
6.3 High Availability: Circuit breakers, graceful degradation, DR
"""

import time
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from collections import defaultdict, deque
from enum import Enum


# ═══════════════════════════════════════════════════════════════════
# 1. THREAT MODEL (PRD Section 6.1 — lines 1466-1530)
# ═══════════════════════════════════════════════════════════════════

class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


THREAT_MODEL = {
    "account_takeover": {
        "level": ThreatLevel.HIGH,
        "attack_vectors": [
            "credential_stuffing", "sim_swap", "otp_interception",
        ],
        "mitigations": {
            "otp_only_auth": True,
            "otp_rate_limit": "3/hour per phone",
            "device_fingerprinting": True,
            "biometric_app_lock": True,
            "suspicious_login_detection": True,
        },
    },
    "financial_data_exposure": {
        "level": ThreatLevel.CRITICAL,
        "attack_vectors": [
            "sql_injection", "insecure_direct_object_reference",
        ],
        "mitigations": {
            "parameterized_queries": True,
            "row_level_security": True,
            "user_id_validation": True,
            "security_scanning": "Snyk on every PR",
            "pen_testing": "quarterly",
        },
    },
    "ai_prompt_injection": {
        "level": ThreatLevel.HIGH,
        "attack_vectors": [
            "malicious_input", "scope_escalation",
        ],
        "mitigations": {
            "system_prompt_hardening": True,
            "output_validation": True,
            "action_allowlist": True,
            "sandboxed_execution": True,
            "ai_rate_limiting": True,
        },
    },
    "oauth_token_theft": {
        "level": ThreatLevel.HIGH,
        "attack_vectors": [
            "token_exfiltration", "mitm_attack",
        ],
        "mitigations": {
            "encrypted_at_rest": "AES-256-GCM",
            "never_logged": True,
            "never_returned_to_client": True,
            "minimal_scopes": True,
            "token_rotation": "on each use",
            "instant_revocation": True,
        },
    },
    "whatsapp_bot_abuse": {
        "level": ThreatLevel.MEDIUM,
        "attack_vectors": [
            "spam_via_compromised_bot", "impersonation",
        ],
        "mitigations": {
            "message_signing": True,
            "rate_limit": "10 messages/hour per user",
            "user_opt_out": "STOP command",
            "meta_compliance": True,
            "outbound_anomaly_monitoring": True,
        },
    },
}


# ── OTP Rate Limiter (PRD: 3/hour per phone) ──

class OTPRateLimiter:
    """Rate limit OTP requests to prevent abuse"""

    MAX_PER_HOUR = 3

    def __init__(self):
        self._attempts: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=100)
        )

    def can_request(self, phone: str) -> dict:
        """Check if OTP request is allowed"""
        now = time.time()
        window = now - 3600  # 1 hour window
        attempts = self._attempts[phone]

        # Clean old attempts
        while attempts and attempts[0] < window:
            attempts.popleft()

        if len(attempts) >= self.MAX_PER_HOUR:
            return {
                "allowed": False,
                "remaining": 0,
                "retry_after_seconds": int(attempts[0] + 3600 - now),
            }

        attempts.append(now)
        return {
            "allowed": True,
            "remaining": self.MAX_PER_HOUR - len(attempts),
        }

    def get_attempts(self, phone: str) -> int:
        now = time.time()
        return sum(1 for t in self._attempts[phone] if t > now - 3600)


otp_limiter = OTPRateLimiter()


# ── Device Fingerprint Detection ──

class DeviceTracker:
    """Track known devices per user for suspicious login detection"""

    def __init__(self):
        self._devices: Dict[str, List[dict]] = defaultdict(list)

    def register_device(self, user_id: str, fingerprint: str,
                        device_info: dict = None) -> dict:
        """Register a known device"""
        device = {
            "fingerprint": fingerprint,
            "info": device_info or {},
            "first_seen": datetime.utcnow().isoformat() + "Z",
            "last_seen": datetime.utcnow().isoformat() + "Z",
            "trusted": True,
        }
        self._devices[user_id].append(device)
        return device

    def is_known_device(self, user_id: str, fingerprint: str) -> dict:
        """Check if device is known — triggers alert if new"""
        known = self._devices.get(user_id, [])
        for device in known:
            if device["fingerprint"] == fingerprint:
                device["last_seen"] = datetime.utcnow().isoformat() + "Z"
                return {"known": True, "suspicious": False, "device": device}

        return {
            "known": False,
            "suspicious": True,
            "action": "send_verification_alert",
            "message": "New device login detected — verify your identity",
        }


device_tracker = DeviceTracker()


# ═══════════════════════════════════════════════════════════════════
# 2. AUDIT TRAILS (PRD Section 6.2 — lines 1534-1566)
# ═══════════════════════════════════════════════════════════════════

class AuditActorType(Enum):
    USER = "user"
    ADMIN = "admin"
    SYSTEM = "system"
    AI_AGENT = "ai_agent"


# Actions that ALWAYS get audited (PRD lines 1550-1558)
MANDATORY_AUDIT_ACTIONS = frozenset([
    "account_created",
    "account_deleted",
    "oauth_token_created",
    "oauth_token_revoked",
    "payment_upgrade",
    "payment_downgrade",
    "payment_refund",
    "data_export_requested",
    "admin_data_access",
    "auth_failed",
    "permission_changed",
    "super_admin_action",
])


class AuditLogger:
    """
    Immutable, append-only audit log.
    PRD 6.2 Properties:
      - Once written, never updated or deleted
      - No UPDATE statements ever touch audit_logs
      - Separate storage, different access controls
      - 2-year retention (compliance)
      - Read-only access for compliance/security team
    """

    def __init__(self):
        self._logs: List[dict] = []

    def log(self, action: str, actor_id: str,
            actor_type: str = "user",
            resource_type: str = None,
            resource_id: str = None,
            changes: dict = None,
            ip_address: str = None,
            user_agent: str = None) -> dict:
        """
        Create an immutable audit log entry.
        Returns the created entry (read-only copy).
        """
        entry = {
            "id": f"audit_{len(self._logs) + 1}_{int(time.time())}",
            "actor_id": actor_id,
            "actor_type": actor_type,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "changes": changes,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            # Integrity hash — tamper-evident
            "integrity_hash": None,
        }

        # Compute integrity hash (chain to previous entry)
        prev_hash = self._logs[-1]["integrity_hash"] if self._logs else "genesis"
        entry_data = f"{prev_hash}:{action}:{actor_id}:{entry['timestamp']}"
        entry["integrity_hash"] = hashlib.sha256(entry_data.encode()).hexdigest()[:24]

        self._logs.append(entry)
        return dict(entry)  # Return copy (immutable principle)

    def query(self, actor_id: str = None, action: str = None,
              resource_type: str = None, limit: int = 50) -> List[dict]:
        """Query audit logs (read-only)"""
        results = self._logs
        if actor_id:
            results = [r for r in results if r["actor_id"] == actor_id]
        if action:
            results = [r for r in results if r["action"] == action]
        if resource_type:
            results = [r for r in results if r["resource_type"] == resource_type]
        return results[-limit:]

    def verify_integrity(self) -> dict:
        """Verify the audit log chain has not been tampered with"""
        if not self._logs:
            return {"valid": True, "entries": 0}

        prev_hash = "genesis"
        for i, entry in enumerate(self._logs):
            expected_data = f"{prev_hash}:{entry['action']}:{entry['actor_id']}:{entry['timestamp']}"
            expected_hash = hashlib.sha256(expected_data.encode()).hexdigest()[:24]
            if entry["integrity_hash"] != expected_hash:
                return {
                    "valid": False,
                    "tampered_at": i,
                    "entry_id": entry["id"],
                }
            prev_hash = entry["integrity_hash"]

        return {"valid": True, "entries": len(self._logs)}

    def get_stats(self) -> dict:
        """Get audit log statistics"""
        if not self._logs:
            return {"total": 0}
        action_counts = defaultdict(int)
        for entry in self._logs:
            action_counts[entry["action"]] += 1
        return {
            "total": len(self._logs),
            "by_action": dict(action_counts),
            "integrity_valid": self.verify_integrity()["valid"],
        }


audit_logger = AuditLogger()


# ═══════════════════════════════════════════════════════════════════
# 3. CIRCUIT BREAKERS (PRD Section 6.3 — lines 1587-1597)
# ═══════════════════════════════════════════════════════════════════

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failures exceeded threshold — blocking calls
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    PRD 6.3: CircuitBreaker pattern
    5 failures → open, 30s cooldown, then half-open test
    """

    def __init__(self, name: str, failure_threshold: int = 5,
                 cooldown_seconds: int = 30, timeout_seconds: int = 30):
        self.name = name
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.timeout_seconds = timeout_seconds
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0
        self.success_count = 0

    def can_execute(self) -> bool:
        """Check if the circuit allows execution"""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if cooldown period has passed
            if time.time() - self.last_failure_time > self.cooldown_seconds:
                self.state = CircuitState.HALF_OPEN
                return True
            return False

        if self.state == CircuitState.HALF_OPEN:
            return True  # Allow one test request

        return False

    def record_success(self):
        """Record a successful call"""
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
        self.success_count += 1

    def record_failure(self):
        """Record a failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def get_status(self) -> dict:
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "failure_threshold": self.failure_threshold,
            "cooldown_seconds": self.cooldown_seconds,
        }


# Pre-configured circuit breakers for external services (PRD 6.3)
CIRCUIT_BREAKERS = {
    "claude_api": CircuitBreaker("claude_api", failure_threshold=5, cooldown_seconds=30, timeout_seconds=20),
    "gmail_api": CircuitBreaker("gmail_api", failure_threshold=5, cooldown_seconds=30),
    "whatsapp_api": CircuitBreaker("whatsapp_api", failure_threshold=5, cooldown_seconds=30),
    "razorpay_api": CircuitBreaker("razorpay_api", failure_threshold=3, cooldown_seconds=60),
    "database": CircuitBreaker("database", failure_threshold=3, cooldown_seconds=10, timeout_seconds=30),
}


# ═══════════════════════════════════════════════════════════════════
# 4. GRACEFUL DEGRADATION (PRD lines 1593-1597)
# ═══════════════════════════════════════════════════════════════════

DEGRADATION_RULES = {
    "claude_api": {
        "fallback": "cached_rule_based_responses",
        "user_message": "AI is temporarily using simplified responses. Full AI will be back shortly.",
        "features_affected": ["ai_chat", "email_intelligence", "proactive_insights"],
    },
    "gmail_api": {
        "fallback": "show_last_known_data",
        "user_message": "Email sync is paused. Your other features work normally.",
        "features_affected": ["email_sync"],
    },
    "bank_sync": {
        "fallback": "show_last_known_data",
        "user_message": "Bank sync is paused. Showing last known balances.",
        "features_affected": ["bank_balance", "auto_categorize"],
    },
    "whatsapp_api": {
        "fallback": "queue_messages",
        "user_message": "Messages queued — will be sent when WhatsApp is restored.",
        "features_affected": ["whatsapp_notifications"],
    },
}


def get_degradation_status() -> dict:
    """Check which services are degraded"""
    degraded = []
    healthy = []
    for name, cb in CIRCUIT_BREAKERS.items():
        if cb.state != CircuitState.CLOSED:
            degraded.append({
                "service": name,
                "state": cb.state.value,
                "rule": DEGRADATION_RULES.get(name, {}),
            })
        else:
            healthy.append(name)

    return {
        "overall_status": "degraded" if degraded else "healthy",
        "degraded_services": degraded,
        "healthy_services": healthy,
    }


# ═══════════════════════════════════════════════════════════════════
# 5. DISASTER RECOVERY (PRD lines 1599-1630)
# ═══════════════════════════════════════════════════════════════════

DISASTER_RECOVERY_PLAN = {
    "availability_target": "99.9%",
    "max_downtime_hours_year": 8.7,
    "rto_hours": 2,
    "rpo_hours": 1,

    "scenarios": {
        "db_primary_fails": {
            "detection": "CloudWatch alarm within 2 minutes",
            "response": "RDS automated failover to standby",
            "recovery_seconds": 60,
        },
        "az_failure": {
            "detection": "AWS health dashboard + monitoring",
            "response": "Traffic shifted to remaining AZs",
            "recovery_minutes": 5,
        },
        "region_failure": {
            "detection": "Cannot reach Mumbai region",
            "response": "Manual DNS failover to secondary region",
            "recovery_hours": "2-4",
            "data_loss": "Up to 1 hour",
        },
        "ransomware": {
            "detection": "Data integrity monitoring alerts",
            "response": "Isolate + incident response + point-in-time recovery",
            "recovery_hours": "2-6",
        },
    },

    "infrastructure": {
        "postgresql": "Primary ap-south-1a + hot standby ap-south-1b",
        "redis": "Cluster mode, 3 shards × 2 replicas",
        "ecs_fargate": "Tasks across 3 availability zones",
        "failover": "Auto <60s DB, <30s app",
    },

    "drills": "Full DR drill every 6 months",
    "on_call": "PagerDuty rotation, 2-minute response SLA",
    "runbooks": "All scenarios have documented step-by-step runbooks",
}


# ═══════════════════════════════════════════════════════════════════
# 6. VULNERABILITY MANAGEMENT (PRD lines 1524-1529)
# ═══════════════════════════════════════════════════════════════════

VULN_MANAGEMENT = {
    "dependency_scanning": {"tool": "Snyk", "frequency": "every PR"},
    "container_scanning": {"tool": "AWS ECR", "frequency": "every build"},
    "sast": {"tool": "Bandit (Python) + ESLint security (JS)", "frequency": "every PR"},
    "dast": {"tool": "OWASP ZAP", "frequency": "quarterly against staging"},
    "bug_bounty": {"platform": "HackerOne", "status": "post-Series A"},
}


def get_security_posture() -> dict:
    """Full security posture summary for admin dashboard"""
    return {
        "threat_model": {
            k: {"level": v["level"].value, "mitigations": len(v["mitigations"])}
            for k, v in THREAT_MODEL.items()
        },
        "circuit_breakers": {
            k: v.get_status() for k, v in CIRCUIT_BREAKERS.items()
        },
        "degradation": get_degradation_status(),
        "audit_stats": audit_logger.get_stats(),
        "dr_plan": {
            "availability_target": DISASTER_RECOVERY_PLAN["availability_target"],
            "rto_hours": DISASTER_RECOVERY_PLAN["rto_hours"],
            "rpo_hours": DISASTER_RECOVERY_PLAN["rpo_hours"],
        },
        "vulnerability_scanning": VULN_MANAGEMENT,
    }


__all__ = [
    'ThreatLevel', 'THREAT_MODEL',
    'OTPRateLimiter', 'otp_limiter',
    'DeviceTracker', 'device_tracker',
    'AuditActorType', 'MANDATORY_AUDIT_ACTIONS',
    'AuditLogger', 'audit_logger',
    'CircuitState', 'CircuitBreaker', 'CIRCUIT_BREAKERS',
    'DEGRADATION_RULES', 'get_degradation_status',
    'DISASTER_RECOVERY_PLAN', 'VULN_MANAGEMENT',
    'get_security_posture',
]
