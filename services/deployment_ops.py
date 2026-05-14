"""
Viya Deployment & Operations Engine
======================================
PRD Section 7 — Infrastructure as Code, Feature Flags,
Scaling Strategy, and Performance/Load Testing.

7.1 Infrastructure: Terraform modules, scaling triggers, cost management
7.2 Feature Flags:  PostHog-compatible flag system with killswitches
7.3 Performance:    k6-compatible load test definitions and SLA targets
"""

import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict


# ═══════════════════════════════════════════════════════════════════
# 1. INFRASTRUCTURE DEFINITION (PRD Section 7.1)
# ═══════════════════════════════════════════════════════════════════

TERRAFORM_MODULES = {
    "vpc": {
        "description": "Network isolation",
        "resources": ["public_subnets", "private_subnets", "nat_gateway", "vpc_endpoints"],
        "config": {
            "public_subnets": ["Load balancers", "NAT gateways"],
            "private_subnets": ["ECS tasks", "RDS", "ElastiCache"],
            "internet_access": "No direct internet to app servers",
            "vpc_endpoints": "AWS services (no internet traversal)",
        },
    },
    "ecs": {
        "description": "Container orchestration (Fargate)",
        "resources": ["api_service", "worker_service", "task_definitions"],
        "config": {
            "api_service": {"vcpu": 2, "memory_gb": 4},
            "worker_service": {"vcpu": 1, "memory_gb": 2},
            "min_tasks": 2,
            "max_tasks": 20,
        },
    },
    "rds": {
        "description": "PostgreSQL cluster",
        "resources": ["primary", "standby", "parameter_group"],
        "config": {
            "instance": "db.r6g.xlarge",
            "vcpu": 4, "memory_gb": 32,
            "storage_gb": 500, "max_storage_gb": 2000,
            "multi_az": True,
            "backup_retention_days": 7,
            "encryption": "AWS KMS at rest",
            "extensions": ["pgvector", "pgcrypto"],
        },
    },
    "elasticache": {
        "description": "Redis cluster",
        "resources": ["cluster", "parameter_group"],
        "config": {
            "engine": "Redis 7.x",
            "node_type": "cache.r6g.large",
            "shards": 3,
            "replicas_per_shard": 2,
            "failover": "automatic",
        },
    },
    "alb": {
        "description": "Load balancer",
        "resources": ["alb", "target_groups", "listener_rules"],
        "config": {
            "health_check": "/health/ready",
            "health_check_interval_seconds": 10,
            "minimum_healthy_pct": 50,
        },
    },
    "cloudfront": {
        "description": "CDN configuration",
        "resources": ["distribution", "cache_behaviors"],
    },
    "waf": {
        "description": "Web Application Firewall",
        "resources": ["web_acl", "rate_rules", "geo_rules"],
    },
    "iam": {
        "description": "Roles and policies",
        "resources": ["ecs_task_role", "ecs_execution_role", "rds_access", "kms_key_access"],
    },
    "monitoring": {
        "description": "Datadog integration",
        "resources": ["agent_config", "dashboards", "monitors"],
    },
}


# ── Scaling Strategy (PRD lines 1690-1706) ──

SCALING_CONFIG = {
    "horizontal": {
        "scale_out": {
            "cpu_threshold_pct": 70,
            "memory_threshold_pct": 75,
            "request_threshold_per_min": 1000,
            "evaluation_period_minutes": 3,
        },
        "scale_in": {
            "cpu_threshold_pct": 30,
            "evaluation_period_minutes": 10,
            "note": "Hysteresis prevents flapping",
        },
    },
    "vertical_phases": [
        {
            "phase": 1, "users": "0-100K",
            "db": "db.r6g.large", "ecs_tasks": "2",
        },
        {
            "phase": 2, "users": "100K-1M",
            "db": "db.r6g.xlarge", "ecs_tasks": "4-8",
        },
        {
            "phase": 3, "users": "1M-5M",
            "db": "db.r6g.2xlarge + read replicas", "ecs_tasks": "8-20",
        },
        {
            "phase": 4, "users": "5M+",
            "db": "Evaluate service extraction", "ecs_tasks": "20+",
            "note": "Extract email_sync + ai_agents to separate services",
        },
    ],
}


# ── Cost Management (PRD lines 1708-1713) ──

COST_MANAGEMENT = {
    "reserved_instances": {
        "db": "1-year commitment (40% savings)",
        "cache": "1-year commitment (40% savings)",
    },
    "spot_instances": {
        "workers": "70% savings, acceptable for background jobs",
    },
    "s3_lifecycle": {
        "logs": "Move to Glacier after 90 days",
    },
    "budget_alerts": {
        "threshold_pct": 80,
        "alert_channel": "Slack + Email",
    },
    "target_cost_per_user_usd": 0.08,
}


# ═══════════════════════════════════════════════════════════════════
# 2. FEATURE FLAGS (PRD Section 7.2 — lines 1716-1761)
# ═══════════════════════════════════════════════════════════════════

class FlagType:
    BOOLEAN = "boolean"        # Simple on/off
    PERCENTAGE = "percentage"  # Rollout to X% of users
    COHORT = "cohort"          # Specific user segments
    PLAN_BASED = "plan_based"  # Available to certain plans


class FeatureFlagManager:
    """
    PostHog-compatible feature flag system.
    Production: PostHog SDK.
    Development: In-memory evaluation with Redis cache simulation.
    """

    def __init__(self):
        self._flags: Dict[str, dict] = {}
        self._cache_ttl = 300  # 5 minutes
        self._last_refresh = 0
        self._evaluation_log: List[dict] = []
        self._init_default_flags()

    def _init_default_flags(self):
        """Initialize PRD-defined flags"""
        self._flags = {
            "new_email_intelligence_v2": {
                "type": FlagType.PERCENTAGE,
                "enabled": True,
                "rollout_pct": 5,  # Start at 5%
                "rollout_plan": "5% → 25% → 50% → 100% over 2 weeks",
                "owner": "email_team",
                "cleanup_date": None,
            },
            "premium_investment_ai": {
                "type": FlagType.PLAN_BASED,
                "enabled": True,
                "required_plan": "premium",
                "conditions": ["user.investments_connected"],
                "owner": "finance_team",
            },
            "family_mode_beta": {
                "type": FlagType.COHORT,
                "enabled": True,
                "cohort": "waitlist_users",
                "fallback_plan": "premium",
                "owner": "core_team",
            },
            "voice_first_mode": {
                "type": FlagType.PERCENTAGE,
                "enabled": True,
                "rollout_pct": 10,
                "purpose": "Voice-primary interface experiment",
                "owner": "ux_team",
            },
            "dark_mode_system_default": {
                "type": FlagType.BOOLEAN,
                "enabled": True,
                "rollout_pct": 100,
                "owner": "frontend_team",
            },
        }

        # Killswitches (PRD lines 1755-1760)
        self._killswitches = {
            "disable_ai_chat": {
                "active": False,
                "fallback": "Show cached/static responses",
                "bypass_normal_evaluation": True,
            },
            "disable_email_sync": {
                "active": False,
                "fallback": "Stop Gmail syncing, keep rest working",
                "bypass_normal_evaluation": True,
            },
            "disable_bank_sync": {
                "active": False,
                "fallback": "Stop AA framework, keep rest working",
                "bypass_normal_evaluation": True,
            },
            "enable_maintenance_mode": {
                "active": False,
                "fallback": "Show maintenance screen to all users",
                "bypass_normal_evaluation": True,
            },
        }

    def evaluate(self, flag_name: str, user: dict = None) -> bool:
        """
        Evaluate a feature flag for a user.
        Returns True if feature is enabled for this user.
        """
        # Check killswitches first (bypass normal evaluation)
        if flag_name in self._killswitches:
            return not self._killswitches[flag_name]["active"]

        flag = self._flags.get(flag_name)
        if not flag or not flag.get("enabled"):
            return False

        user = user or {}
        flag_type = flag.get("type")

        if flag_type == FlagType.BOOLEAN:
            return True

        if flag_type == FlagType.PERCENTAGE:
            # Deterministic percentage based on user_id hash
            user_id = user.get("user_id", user.get("phone", ""))
            if not user_id:
                return False
            hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100
            return hash_val < flag.get("rollout_pct", 0)

        if flag_type == FlagType.PLAN_BASED:
            user_plan = user.get("plan", "free")
            required = flag.get("required_plan", "free")
            hierarchy = {"free": 0, "premium": 1, "enterprise": 2}
            return hierarchy.get(user_plan, 0) >= hierarchy.get(required, 0)

        if flag_type == FlagType.COHORT:
            # Check if user is in the target cohort
            user_cohort = user.get("cohort", "")
            return user_cohort == flag.get("cohort", "")

        return False

    def activate_killswitch(self, switch_name: str) -> dict:
        """Instantly activate a killswitch (emergency)"""
        if switch_name in self._killswitches:
            self._killswitches[switch_name]["active"] = True
            return {"activated": True, "switch": switch_name,
                    "fallback": self._killswitches[switch_name]["fallback"]}
        return {"activated": False, "error": "Unknown killswitch"}

    def deactivate_killswitch(self, switch_name: str) -> dict:
        """Deactivate a killswitch (restore normal operation)"""
        if switch_name in self._killswitches:
            self._killswitches[switch_name]["active"] = False
            return {"deactivated": True, "switch": switch_name}
        return {"deactivated": False, "error": "Unknown killswitch"}

    def update_rollout(self, flag_name: str, pct: int) -> dict:
        """Update percentage rollout for a flag"""
        if flag_name in self._flags:
            self._flags[flag_name]["rollout_pct"] = max(0, min(100, pct))
            return {"updated": True, "flag": flag_name, "rollout_pct": pct}
        return {"updated": False, "error": "Unknown flag"}

    def get_all_flags(self, user: dict = None) -> Dict[str, bool]:
        """Get all flag states for a user"""
        result = {}
        for name in self._flags:
            result[name] = self.evaluate(name, user)
        for name in self._killswitches:
            result[name] = not self._killswitches[name]["active"]
        return result

    def get_stale_flags(self, max_age_days: int = 90) -> List[str]:
        """
        PRD: No flags older than 90 days without review.
        Dead flags (100% or 0%): Remove within 2 weeks.
        """
        stale = []
        for name, flag in self._flags.items():
            pct = flag.get("rollout_pct", None)
            if pct == 100 or pct == 0:
                stale.append(f"{name} (rollout={pct}%, remove from codebase)")
        return stale

    def get_status(self) -> dict:
        """Full flag system status"""
        return {
            "total_flags": len(self._flags),
            "killswitches": {k: v["active"] for k, v in self._killswitches.items()},
            "stale_flags": self.get_stale_flags(),
            "flags": {
                name: {
                    "type": f.get("type"), "enabled": f.get("enabled"),
                    "rollout_pct": f.get("rollout_pct"),
                    "owner": f.get("owner"),
                }
                for name, f in self._flags.items()
            },
        }


feature_flags = FeatureFlagManager()


# ═══════════════════════════════════════════════════════════════════
# 3. PERFORMANCE TESTING (PRD Section 7.3 — lines 1763-1806)
# ═══════════════════════════════════════════════════════════════════

LOAD_TEST_PROFILES = {
    "smoke": {
        "description": "Does the system work at all?",
        "frequency": "Every deployment",
        "virtual_users": 1,
        "duration_minutes": 1,
        "failure_criteria": "Any error = block deployment",
        "sla": {"error_rate_pct": 0, "p95_ms": 2000},
    },
    "load": {
        "description": "Standard load test",
        "frequency": "Weekly",
        "stages": [
            {"action": "ramp_up", "users": 100, "duration_minutes": 5},
            {"action": "hold", "users": 100, "duration_minutes": 10},
            {"action": "ramp_down", "users": 0, "duration_minutes": 2},
        ],
        "sla": {"p95_ms": 500, "error_rate_pct": 0.1},
    },
    "stress": {
        "description": "Find breaking point and failure mode",
        "frequency": "Monthly",
        "stages": [
            {"action": "ramp_up", "users": 500, "duration_minutes": 10},
            {"action": "hold", "users": 500, "duration_minutes": 20},
        ],
        "sla": {"graceful_degradation": True, "no_catastrophic_failure": True},
    },
    "spike": {
        "description": "Diwali/salary-day simulation",
        "frequency": "Quarterly",
        "stages": [
            {"action": "instant", "users": 1000, "duration_minutes": 0},
            {"action": "hold", "users": 1000, "duration_minutes": 5},
            {"action": "drop", "users": 10, "duration_minutes": 0},
        ],
        "sla": {"error_rate_pct": 5, "recovery_minutes": 2},
    },
    "soak": {
        "description": "Memory leaks, connection pool exhaustion",
        "frequency": "Pre-major release",
        "stages": [
            {"action": "hold", "users": 100, "duration_hours": 8},
        ],
        "sla": {
            "memory_growth_mb_per_hour": 20,
            "note": ">20MB/hour = leak",
        },
    },
}

# Key scenarios to test (PRD lines 1800-1805)
LOAD_TEST_SCENARIOS = [
    {
        "endpoint": "POST /chat/message",
        "description": "Most expensive — AI call",
        "weight": 30,
        "sla_p95_ms": 3000,
    },
    {
        "endpoint": "GET /email/inbox",
        "description": "Complex query + cache",
        "weight": 25,
        "sla_p95_ms": 500,
    },
    {
        "endpoint": "POST /auth/verify-otp",
        "description": "Critical auth path",
        "weight": 15,
        "sla_p95_ms": 200,
    },
    {
        "endpoint": "GET /finance/overview",
        "description": "Multi-table join",
        "weight": 20,
        "sla_p95_ms": 800,
    },
    {
        "endpoint": "background:email_sync_job",
        "description": "Concurrent many-user simulation",
        "weight": 10,
        "sla_p95_ms": 5000,
    },
]


def generate_k6_script(profile_name: str) -> str:
    """Generate k6 load test script from profile"""
    profile = LOAD_TEST_PROFILES.get(profile_name)
    if not profile:
        return f"// Unknown profile: {profile_name}"

    script = f"""// Viya k6 Load Test: {profile_name}
// {profile['description']}
// Frequency: {profile['frequency']}

import http from 'k6/http';
import {{ check, sleep }} from 'k6';

export const options = {{
"""

    if "stages" in profile:
        script += "  stages: [\n"
        for stage in profile["stages"]:
            users = stage.get("users", 0)
            dur = stage.get("duration_minutes", 0)
            if dur:
                script += f"    {{ duration: '{dur}m', target: {users} }},\n"
        script += "  ],\n"
    else:
        script += f"  vus: {profile.get('virtual_users', 1)},\n"
        script += f"  duration: '{profile.get('duration_minutes', 1)}m',\n"

    sla = profile.get("sla", {})
    if "p95_ms" in sla:
        script += f"""  thresholds: {{
    'http_req_duration': ['p(95)<{sla["p95_ms"]}'],
"""
        if "error_rate_pct" in sla:
            rate = sla["error_rate_pct"] / 100
            script += f"    'http_req_failed': ['rate<{rate}'],\n"
        script += "  },\n"

    script += "};\n\n"

    script += """export default function () {
  const BASE_URL = __ENV.BASE_URL || 'https://api.viya.ai';
"""

    for scenario in LOAD_TEST_SCENARIOS:
        ep = scenario["endpoint"]
        if ep.startswith("POST"):
            path = ep.split(" ")[1]
            script += f"""
  // {scenario['description']} (weight: {scenario['weight']}%)
  const r_{path.replace('/', '_').strip('_')} = http.post(
    `${{BASE_URL}}{path}`,
    JSON.stringify({{ message: 'test' }}),
    {{ headers: {{ 'Content-Type': 'application/json' }} }}
  );
  check(r_{path.replace('/', '_').strip('_')}, {{ '{path} OK': (r) => r.status < 400 }});
"""
        elif ep.startswith("GET"):
            path = ep.split(" ")[1]
            script += f"""
  // {scenario['description']} (weight: {scenario['weight']}%)
  const r_{path.replace('/', '_').strip('_')} = http.get(`${{BASE_URL}}{path}`);
  check(r_{path.replace('/', '_').strip('_')}, {{ '{path} OK': (r) => r.status < 400 }});
"""

    script += "\n  sleep(1);\n}\n"
    return script


def get_deployment_status() -> dict:
    """Full deployment and operations status"""
    return {
        "infrastructure": {
            "modules": list(TERRAFORM_MODULES.keys()),
            "total_modules": len(TERRAFORM_MODULES),
        },
        "scaling": SCALING_CONFIG,
        "cost_management": COST_MANAGEMENT,
        "feature_flags": feature_flags.get_status(),
        "load_test_profiles": list(LOAD_TEST_PROFILES.keys()),
        "load_test_scenarios": len(LOAD_TEST_SCENARIOS),
    }


__all__ = [
    'TERRAFORM_MODULES', 'SCALING_CONFIG', 'COST_MANAGEMENT',
    'FlagType', 'FeatureFlagManager', 'feature_flags',
    'LOAD_TEST_PROFILES', 'LOAD_TEST_SCENARIOS',
    'generate_k6_script', 'get_deployment_status',
]
