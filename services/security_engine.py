"""
Viya Security & Compliance Engine
====================================
PRD Section 6 + Fintech §6.1/§6.2

6.1 Threat Model:     8 risk categories with mitigations
6.2 Audit Trails:     Immutable, append-only audit logging
6.3 High Availability: Circuit breakers, graceful degradation, DR

Fintech §6.1:
  - JWT 15-min access + 7-day refresh + rotation + Redis blacklist
  - TOTP MFA (RFC 6238, Google Authenticator compatible)
  - Per-endpoint rate limiting (auth, dashboard, transaction, etc.)
  - Device trust with SHA-256 fingerprinting
  - Field-level AES-256-GCM encryption

Fintech §6.2:
  - SMS spoofing / transaction injection mitigations
  - Brokerage token theft mitigations
  - AA consent abuse mitigations
"""

import os
import time
import hashlib
import hmac
import base64
import secrets
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
    # ── Fintech §6.2 Threats ──
    "sms_spoofing": {
        "level": ThreatLevel.HIGH,
        "attack_vectors": [
            "fake_bank_sms", "sms_interception", "sender_id_spoofing",
        ],
        "mitigations": {
            "sender_id_validation": "Approved bank sender list only",
            "upi_ref_deduplication": True,
            "amount_anomaly_detection": "Flag >₹50,000 from SMS",
            "user_report_false_txn": True,
            "manual_verification_large_amounts": True,
        },
    },
    "brokerage_token_theft": {
        "level": ThreatLevel.HIGH,
        "attack_vectors": [
            "token_exfiltration", "api_key_leak", "mitm",
        ],
        "mitigations": {
            "aes_256_encrypted_storage": True,
            "tokens_never_returned_to_client": True,
            "read_only_scope_only": True,
            "token_revalidation_per_call": True,
            "zerodha_daily_expiry": "Access tokens expire every 24h",
            "revoke_on_suspicious_activity": True,
        },
    },
    "aa_consent_abuse": {
        "level": ThreatLevel.LOW,
        "attack_vectors": ["over_fetching", "consent_replay"],
        "mitigations": {
            "fiu_regulated_by_rbi": True,
            "consent_artefact_stored": True,
            "setu_enforces_consent": True,
            "user_revoke_any_time": True,
            "data_deletion_on_revocation": "30 days",
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


# ── JWT Manager (Fintech §6.1 Layer 1) ──

class JWTManager:
    """
    Fintech §6.1 Layer 1: JWT Authentication
    Access token: 15-minute HS256, Refresh token: 7-day with rotation.
    Redis blacklist for instant logout.
    """

    ACCESS_TOKEN_EXPIRY_MINUTES = 15
    REFRESH_TOKEN_EXPIRY_DAYS = 7

    def __init__(self):
        self._secret = os.environ.get('JWT_SECRET', 'dev-jwt-secret-change-in-prod')
        self._blacklist: set = set()  # Production: Redis SET
        self._refresh_tokens: Dict[str, dict] = {}  # Production: PostgreSQL hashed

    def create_tokens(self, user_id: str, plan: str = 'free',
                      mfa_verified: bool = False) -> dict:
        """Issue access + refresh token pair."""
        now = datetime.utcnow()
        session_id = secrets.token_hex(16)

        access_payload = {
            'sub': user_id, 'plan': plan,
            'mfa_verified': mfa_verified,
            'session_id': session_id,
            'iat': int(now.timestamp()),
            'exp': int((now + timedelta(minutes=self.ACCESS_TOKEN_EXPIRY_MINUTES)).timestamp()),
        }
        access_token = self._sign(access_payload)

        refresh_token = secrets.token_urlsafe(48)
        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        self._refresh_tokens[refresh_hash] = {
            'user_id': user_id, 'session_id': session_id,
            'expires_at': (now + timedelta(days=self.REFRESH_TOKEN_EXPIRY_DAYS)).isoformat(),
            'used': False,
        }

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': self.ACCESS_TOKEN_EXPIRY_MINUTES * 60,
        }

    def rotate_refresh(self, refresh_token: str) -> dict:
        """Use refresh token → get new pair. Old token invalidated (rotation)."""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        stored = self._refresh_tokens.get(token_hash)

        if not stored:
            return {'error': 'invalid_refresh_token'}
        if stored['used']:
            # Token reuse detected — possible theft, revoke all
            self._revoke_user_sessions(stored['user_id'])
            return {'error': 'refresh_token_reuse_detected', 'action': 'all_sessions_revoked'}
        if datetime.fromisoformat(stored['expires_at']) < datetime.utcnow():
            return {'error': 'refresh_token_expired'}

        stored['used'] = True  # Mark old token as used
        return self.create_tokens(stored['user_id'])

    def blacklist_token(self, access_token: str):
        """Instant logout via Redis blacklist."""
        self._blacklist.add(access_token)

    def is_blacklisted(self, access_token: str) -> bool:
        return access_token in self._blacklist

    def _revoke_user_sessions(self, user_id: str):
        """Revoke all refresh tokens for a user."""
        for h, data in list(self._refresh_tokens.items()):
            if data['user_id'] == user_id:
                data['used'] = True

    def _sign(self, payload: dict) -> str:
        """HS256 sign. Production: use PyJWT."""
        import json as _json
        header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b'=').decode()
        body = base64.urlsafe_b64encode(_json.dumps(payload).encode()).rstrip(b'=').decode()
        sig = hmac.new(self._secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()
        return f"{header}.{body}.{sig_b64}"


jwt_manager = JWTManager()


# ── MFA Manager (Fintech §6.1 Layer 2: TOTP RFC 6238) ──

class MFAManager:
    """
    TOTP-based MFA, Google Authenticator / Authy compatible.
    10 backup codes (single-use, bcrypt hashed in production).
    """

    TOTP_PERIOD = 30  # seconds
    TOTP_DIGITS = 6

    def __init__(self):
        self._secrets: Dict[str, dict] = {}  # user_id -> {secret, backup_codes, enabled}

    def setup(self, user_id: str) -> dict:
        """Generate TOTP secret + QR provisioning URI."""
        secret = base64.b32encode(secrets.token_bytes(20)).decode().rstrip('=')
        backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
        backup_hashes = [hashlib.sha256(c.encode()).hexdigest() for c in backup_codes]

        self._secrets[user_id] = {
            'secret': secret, 'backup_hashes': backup_hashes,
            'enabled': False, 'created_at': datetime.utcnow().isoformat(),
        }

        provisioning_uri = (f"otpauth://totp/Viya:{user_id}"
                            f"?secret={secret}&issuer=Viya&digits={self.TOTP_DIGITS}"
                            f"&period={self.TOTP_PERIOD}")

        return {
            'secret': secret,
            'provisioning_uri': provisioning_uri,
            'backup_codes': backup_codes,
            'message': 'Scan QR code with Google Authenticator or Authy',
        }

    def verify(self, user_id: str, code: str) -> dict:
        """Verify TOTP code or backup code."""
        data = self._secrets.get(user_id)
        if not data:
            return {'verified': False, 'error': 'mfa_not_setup'}

        # Check backup codes
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        if code_hash in data['backup_hashes']:
            data['backup_hashes'].remove(code_hash)
            return {'verified': True, 'method': 'backup_code',
                    'remaining_backup_codes': len(data['backup_hashes'])}

        # Verify TOTP (check current + previous window for clock skew)
        for offset in (0, -1, 1):
            expected = self._generate_totp(data['secret'], offset)
            if code == expected:
                if not data['enabled']:
                    data['enabled'] = True
                return {'verified': True, 'method': 'totp'}

        return {'verified': False, 'error': 'invalid_code'}

    def is_enabled(self, user_id: str) -> bool:
        data = self._secrets.get(user_id)
        return bool(data and data.get('enabled'))

    def _generate_totp(self, secret: str, offset: int = 0) -> str:
        """RFC 6238 TOTP generation."""
        import struct
        key = base64.b32decode(secret + '=' * (-len(secret) % 8), casefold=True)
        counter = int(time.time()) // self.TOTP_PERIOD + offset
        msg = struct.pack('>Q', counter)
        h = hmac.new(key, msg, hashlib.sha1).digest()
        o = h[-1] & 0x0F
        code = struct.unpack('>I', h[o:o+4])[0] & 0x7FFFFFFF
        return str(code % (10 ** self.TOTP_DIGITS)).zfill(self.TOTP_DIGITS)


mfa_manager = MFAManager()


# ── Endpoint Rate Limiter (Fintech §6.1) ──

class EndpointRateLimiter:
    """
    Per-endpoint-category rate limiting per spec §6.1.
    Production: Redis sliding window. Dev: in-memory.
    """

    LIMITS = {
        'auth':              {'max': 5,   'window': 60},       # 5/min/IP
        'otp':               {'max': 3,   'window': 3600},     # 3/hr/phone
        'dashboard':         {'max': 60,  'window': 60},       # 60/min/user
        'transaction_create': {'max': 100, 'window': 3600},    # 100/hr/user
        'portfolio_sync':    {'max': 10,  'window': 86400},    # 10/day/account
        'file_upload':       {'max': 10,  'window': 3600},     # 10/hr/user
        'report_generate':   {'max': 5,   'window': 86400},    # 5/day/user
        'ai_insights_free':  {'max': 50,  'window': 86400},    # 50/day
        'ai_insights_premium': {'max': 500, 'window': 86400},  # 500/day
    }

    def __init__(self):
        self._buckets: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))

    def check(self, category: str, identifier: str) -> dict:
        """Check if request is allowed under rate limit."""
        limit = self.LIMITS.get(category)
        if not limit:
            return {'allowed': True, 'remaining': -1}

        key = f"{category}:{identifier}"
        now = time.time()
        window = now - limit['window']
        bucket = self._buckets[key]

        while bucket and bucket[0] < window:
            bucket.popleft()

        if len(bucket) >= limit['max']:
            retry_after = int(bucket[0] + limit['window'] - now)
            return {'allowed': False, 'remaining': 0,
                    'retry_after_seconds': max(retry_after, 1),
                    'limit': limit['max'], 'category': category}

        bucket.append(now)
        return {'allowed': True, 'remaining': limit['max'] - len(bucket),
                'limit': limit['max'], 'category': category}


rate_limiter = EndpointRateLimiter()


# ── Device Fingerprint Detection (Fintech §6.1 Layer 3) ──

class DeviceTracker:
    """
    Track known devices per user for suspicious login detection.
    SHA-256(device_id + screen + os_version). Trusted devices: 30-day expiry.
    """

    TRUST_EXPIRY_DAYS = 30

    def __init__(self):
        self._devices: Dict[str, List[dict]] = defaultdict(list)

    @staticmethod
    def generate_fingerprint(device_id: str, screen: str = '',
                              os_version: str = '') -> str:
        """SHA-256(device_id + screen + os_version)"""
        raw = f"{device_id}:{screen}:{os_version}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def register_device(self, user_id: str, fingerprint: str,
                        device_info: dict = None) -> dict:
        """Register a known device"""
        device = {
            "fingerprint": fingerprint,
            "info": device_info or {},
            "first_seen": datetime.utcnow().isoformat() + "Z",
            "last_seen": datetime.utcnow().isoformat() + "Z",
            "trusted": True,
            "expires_at": (datetime.utcnow() + timedelta(days=self.TRUST_EXPIRY_DAYS)).isoformat() + "Z",
        }
        # Persist to DB in production
        try:
            from database.fintech_repository import supabase as sb
            if sb:
                sb.table('sessions').upsert({
                    'user_id': user_id, 'device_fingerprint': fingerprint,
                    'device_info': device_info or {},
                    'is_trusted': True,
                    'expires_at': device['expires_at'],
                }).execute()
        except Exception:
            pass
        self._devices[user_id].append(device)
        return device

    def is_known_device(self, user_id: str, fingerprint: str) -> dict:
        """Check if device is known — triggers alert if new"""
        known = self._devices.get(user_id, [])
        now = datetime.utcnow()
        for device in known:
            if device["fingerprint"] == fingerprint:
                # Check expiry
                exp = device.get('expires_at', '')
                if exp and datetime.fromisoformat(exp.rstrip('Z')) < now:
                    return {
                        "known": True, "suspicious": True,
                        "action": "re_verify_expired_device",
                        "message": "Device trust expired — please verify again",
                    }
                device["last_seen"] = now.isoformat() + "Z"
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


# Pre-configured circuit breakers for external services (PRD 6.3 + Fintech §6.1)
CIRCUIT_BREAKERS = {
    "claude_api": CircuitBreaker("claude_api", failure_threshold=5, cooldown_seconds=30, timeout_seconds=20),
    "gmail_api": CircuitBreaker("gmail_api", failure_threshold=5, cooldown_seconds=30),
    "whatsapp_api": CircuitBreaker("whatsapp_api", failure_threshold=5, cooldown_seconds=30),
    "razorpay_api": CircuitBreaker("razorpay_api", failure_threshold=3, cooldown_seconds=60),
    "database": CircuitBreaker("database", failure_threshold=3, cooldown_seconds=10, timeout_seconds=30),
    # Fintech services
    "setu_aa": CircuitBreaker("setu_aa", failure_threshold=5, cooldown_seconds=60, timeout_seconds=30),
    "kite_connect": CircuitBreaker("kite_connect", failure_threshold=3, cooldown_seconds=60, timeout_seconds=20),
    "groww_api": CircuitBreaker("groww_api", failure_threshold=5, cooldown_seconds=60),
    "upstox_api": CircuitBreaker("upstox_api", failure_threshold=5, cooldown_seconds=60),
    "nse_bse_prices": CircuitBreaker("nse_bse_prices", failure_threshold=3, cooldown_seconds=30),
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
    'JWTManager', 'jwt_manager',
    'MFAManager', 'mfa_manager',
    'EndpointRateLimiter', 'rate_limiter',
    'DeviceTracker', 'device_tracker',
    'AuditActorType', 'MANDATORY_AUDIT_ACTIONS',
    'AuditLogger', 'audit_logger',
    'CircuitState', 'CircuitBreaker', 'CIRCUIT_BREAKERS',
    'DEGRADATION_RULES', 'get_degradation_status',
    'DISASTER_RECOVERY_PLAN', 'VULN_MANAGEMENT',
    'get_security_posture',
]
