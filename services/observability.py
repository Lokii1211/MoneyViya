"""
Viya Observability Stack
==========================
PRD Section 4.5 — Three Pillars: Logs + Metrics + Traces

Production: Datadog APM + StatsD + PagerDuty
Development: In-memory metrics + console alerting

SLA Metrics (Alert if breached):
  API p95 latency > 2 seconds
  API error rate > 1%
  Email sync lag > 30 minutes
  Notification delivery rate < 90%
  AI cost > $2,000/day
"""

import time
import os
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict, deque
from enum import Enum


# ═══════════════════════════════════════════════════════════════════
# 1. METRICS COLLECTOR (PRD lines 1196-1211)
# ═══════════════════════════════════════════════════════════════════

class MetricsCollector:
    """
    In-memory time-series metrics (production: Datadog StatsD).
    Tracks infrastructure, application, business, AI, and notification metrics.
    """

    def __init__(self, window_seconds: int = 3600):
        self.window = window_seconds
        # Each metric: deque of (timestamp, value) tuples
        self._counters: Dict[str, int] = defaultdict(int)
        self._gauges: Dict[str, float] = defaultdict(float)
        self._timings: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10000))

    def increment(self, metric: str, value: int = 1):
        """Count events: requests, errors, signups"""
        self._counters[metric] += value

    def gauge(self, metric: str, value: float):
        """Set current value: CPU, memory, queue depth"""
        self._gauges[metric] = value

    def timing(self, metric: str, duration_ms: float):
        """Record latency: API response time, job duration"""
        self._timings[metric].append((time.time(), duration_ms))

    def get_counter(self, metric: str) -> int:
        return self._counters.get(metric, 0)

    def get_gauge(self, metric: str) -> float:
        return self._gauges.get(metric, 0.0)

    def get_percentiles(self, metric: str, window_seconds: int = None) -> dict:
        """Calculate p50/p95/p99 from recent timings"""
        window = window_seconds or self.window
        cutoff = time.time() - window
        values = [v for t, v in self._timings.get(metric, []) if t > cutoff]

        if not values:
            return {"p50": 0, "p95": 0, "p99": 0, "count": 0, "avg": 0}

        values.sort()
        n = len(values)
        return {
            "p50": values[int(n * 0.5)] if n > 0 else 0,
            "p95": values[int(n * 0.95)] if n > 1 else values[-1],
            "p99": values[int(n * 0.99)] if n > 2 else values[-1],
            "count": n,
            "avg": round(statistics.mean(values), 1),
            "min": min(values),
            "max": max(values),
        }

    def snapshot(self) -> dict:
        """Full metrics snapshot for dashboard"""
        return {
            "counters": dict(self._counters),
            "gauges": dict(self._gauges),
            "timings": {
                k: self.get_percentiles(k) for k in self._timings
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }


metrics = MetricsCollector()


# ═══════════════════════════════════════════════════════════════════
# 2. APPLICATION METRICS (PRD lines 1198-1204)
# ═══════════════════════════════════════════════════════════════════

# Pre-defined metric names for consistency
class MetricNames:
    # Infrastructure
    CPU_PERCENT = "infra.cpu_percent"
    MEMORY_MB = "infra.memory_mb"
    DISK_PERCENT = "infra.disk_percent"

    # Application
    API_REQUESTS = "app.api_requests"
    API_ERRORS = "app.api_errors"
    API_LATENCY = "app.api_latency_ms"

    # Business
    SIGNUPS = "biz.signups"
    DAU = "biz.dau"
    UPGRADES = "biz.upgrades"
    CHURN = "biz.churn_events"
    REVENUE = "biz.revenue_inr"

    # AI
    AI_CALLS = "ai.calls"
    AI_TOKENS_IN = "ai.tokens_in"
    AI_TOKENS_OUT = "ai.tokens_out"
    AI_COST_USD = "ai.cost_usd"
    AI_LATENCY = "ai.latency_ms"
    AI_CACHE_HITS = "ai.cache_hits"

    # Email
    EMAIL_SYNCS = "email.syncs"
    EMAIL_SYNC_FAILURES = "email.sync_failures"
    EMAIL_PROCESSED = "email.processed_count"
    EMAIL_LAG_SECONDS = "email.lag_seconds"

    # Notifications
    NOTIF_SENT = "notif.sent"
    NOTIF_DELIVERED = "notif.delivered"
    NOTIF_OPENED = "notif.opened"
    NOTIF_ACTED = "notif.acted"
    NOTIF_FAILED = "notif.failed"


# ═══════════════════════════════════════════════════════════════════
# 3. SLA MONITORING (PRD lines 1206-1211)
# ═══════════════════════════════════════════════════════════════════

class AlertPriority(Enum):
    P1 = "P1"  # PagerDuty immediate
    P2 = "P2"  # PagerDuty, 30min delay
    P3 = "P3"  # Slack only


SLA_THRESHOLDS = {
    "api_p95_latency_ms": {
        "threshold": 2000,
        "operator": ">",
        "priority": AlertPriority.P2,
        "message": "API p95 latency > 2 seconds",
    },
    "api_error_rate_pct": {
        "threshold": 1.0,
        "operator": ">",
        "priority": AlertPriority.P2,
        "message": "API error rate > 1%",
    },
    "api_error_rate_critical_pct": {
        "threshold": 5.0,
        "operator": ">",
        "priority": AlertPriority.P1,
        "message": "API error rate > 5% for 5 minutes",
    },
    "email_sync_lag_minutes": {
        "threshold": 30,
        "operator": ">",
        "priority": AlertPriority.P3,
        "message": "Email sync lag > 30 minutes",
    },
    "notification_delivery_rate_pct": {
        "threshold": 90,
        "operator": "<",
        "priority": AlertPriority.P3,
        "message": "Notification delivery rate < 90%",
    },
    "ai_cost_daily_usd": {
        "threshold": 2000,
        "operator": ">",
        "priority": AlertPriority.P2,
        "message": "AI cost > $2,000/day",
    },
    "service_down": {
        "threshold": 1,
        "operator": "==",
        "priority": AlertPriority.P1,
        "message": "Service down (health check failing > 2 minutes)",
    },
    "db_connection_failure": {
        "threshold": 1,
        "operator": "==",
        "priority": AlertPriority.P1,
        "message": "Database connection failure",
    },
}


class SLAMonitor:
    """
    Checks SLA thresholds and generates alerts.
    Production: Routes to PagerDuty (P1/P2) or Slack (P3).
    Development: Logs to console.
    """

    def __init__(self):
        self._alerts: List[dict] = []
        self._acknowledged: set = set()

    def check_sla(self, metric_name: str, current_value: float) -> Optional[dict]:
        """Check a metric against its SLA threshold"""
        sla = SLA_THRESHOLDS.get(metric_name)
        if not sla:
            return None

        breached = False
        op = sla["operator"]
        threshold = sla["threshold"]

        if op == ">" and current_value > threshold:
            breached = True
        elif op == "<" and current_value < threshold:
            breached = True
        elif op == "==" and current_value == threshold:
            breached = True

        if breached:
            alert = {
                "id": f"alert_{metric_name}_{int(time.time())}",
                "metric": metric_name,
                "value": current_value,
                "threshold": threshold,
                "priority": sla["priority"].value,
                "message": sla["message"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "status": "firing",
            }
            self._alerts.append(alert)
            return alert

        return None

    def check_all(self) -> List[dict]:
        """Run all SLA checks against current metrics"""
        alerts = []

        # API latency check
        api_p95 = metrics.get_percentiles(MetricNames.API_LATENCY).get("p95", 0)
        if api_p95:
            a = self.check_sla("api_p95_latency_ms", api_p95)
            if a:
                alerts.append(a)

        # Error rate check
        total = metrics.get_counter(MetricNames.API_REQUESTS)
        errors = metrics.get_counter(MetricNames.API_ERRORS)
        if total > 0:
            error_rate = (errors / total) * 100
            a = self.check_sla("api_error_rate_pct", error_rate)
            if a:
                alerts.append(a)

        # AI cost check
        ai_cost = metrics.get_counter(MetricNames.AI_COST_USD)
        if ai_cost:
            a = self.check_sla("ai_cost_daily_usd", ai_cost)
            if a:
                alerts.append(a)

        # Email sync lag
        email_lag = metrics.get_gauge(MetricNames.EMAIL_LAG_SECONDS)
        if email_lag:
            a = self.check_sla("email_sync_lag_minutes", email_lag / 60)
            if a:
                alerts.append(a)

        # Notification delivery rate
        sent = metrics.get_counter(MetricNames.NOTIF_SENT)
        delivered = metrics.get_counter(MetricNames.NOTIF_DELIVERED)
        if sent > 0:
            delivery_rate = (delivered / sent) * 100
            a = self.check_sla("notification_delivery_rate_pct", delivery_rate)
            if a:
                alerts.append(a)

        return alerts

    def get_active_alerts(self) -> List[dict]:
        """Get recent unacknowledged alerts"""
        cutoff = time.time() - 3600  # Last hour
        return [
            a for a in self._alerts
            if a["id"] not in self._acknowledged
            and datetime.fromisoformat(a["timestamp"].replace("Z", "")).timestamp() > cutoff
        ]

    def acknowledge(self, alert_id: str):
        """Acknowledge an alert"""
        self._acknowledged.add(alert_id)


sla_monitor = SLAMonitor()


# ═══════════════════════════════════════════════════════════════════
# 4. REQUEST TRACING (PRD lines 1213-1224)
# ═══════════════════════════════════════════════════════════════════

class RequestTracer:
    """
    Distributed tracing for request flows.
    Production: Datadog APM (auto-instrumentation).
    Development: In-memory trace storage.

    Sampling: 100% errors, 10% normal, 100% slow (>2s)
    """

    def __init__(self, sample_rate: float = 0.1):
        self.sample_rate = sample_rate
        self._traces: deque = deque(maxlen=1000)

    def start_trace(self, request_id: str, path: str,
                    user_id: str = None, plan: str = None) -> dict:
        """Start a new trace for a request"""
        trace = {
            "trace_id": request_id,
            "path": path,
            "user_id": user_id,
            "plan": plan,
            "started_at": time.time(),
            "spans": [],
            "status": "in_progress",
        }
        return trace

    def add_span(self, trace: dict, name: str, service: str,
                 duration_ms: float = None, error: str = None):
        """Add a span to an existing trace"""
        span = {
            "name": name,
            "service": service,
            "started_at": time.time(),
            "duration_ms": duration_ms,
            "error": error,
        }
        trace.setdefault("spans", []).append(span)

    def complete_trace(self, trace: dict, status_code: int = 200):
        """Complete and store a trace"""
        trace["completed_at"] = time.time()
        trace["duration_ms"] = round(
            (trace["completed_at"] - trace["started_at"]) * 1000, 1
        )
        trace["status_code"] = status_code
        trace["status"] = "error" if status_code >= 400 else "ok"

        # Sampling: always store errors and slow requests
        should_store = (
            trace["status"] == "error"
            or trace["duration_ms"] > 2000
            or (hash(trace["trace_id"]) % 100) < (self.sample_rate * 100)
        )

        if should_store:
            self._traces.append(trace)

        # Record in metrics
        metrics.increment(MetricNames.API_REQUESTS)
        metrics.timing(MetricNames.API_LATENCY, trace["duration_ms"])
        if status_code >= 400:
            metrics.increment(MetricNames.API_ERRORS)

    def get_slow_traces(self, threshold_ms: float = 2000) -> List[dict]:
        """Get traces slower than threshold"""
        return [t for t in self._traces if t.get("duration_ms", 0) > threshold_ms]

    def get_error_traces(self) -> List[dict]:
        """Get traces with errors"""
        return [t for t in self._traces if t.get("status") == "error"]


tracer = RequestTracer()


# ═══════════════════════════════════════════════════════════════════
# 5. FASTAPI MIDDLEWARE (Auto-instrument all requests)
# ═══════════════════════════════════════════════════════════════════

async def observability_middleware(request, call_next):
    """
    FastAPI middleware that auto-instruments every request.
    Logs: method, path, status, duration, user_id
    Metrics: request count, latency, error rate
    Traces: Full request trace with spans
    """
    import uuid as _uuid
    request_id = request.headers.get("X-Request-ID", str(_uuid.uuid4())[:12])
    start = time.time()

    # Start trace
    user_id = None
    auth = request.headers.get("Authorization", "")
    trace = tracer.start_trace(request_id, request.url.path, user_id)

    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 1)

        # Complete trace
        tracer.complete_trace(trace, response.status_code)

        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        return response

    except Exception as e:
        duration_ms = round((time.time() - start) * 1000, 1)
        tracer.add_span(trace, "error", "api", duration_ms, str(e))
        tracer.complete_trace(trace, 500)
        raise


# ═══════════════════════════════════════════════════════════════════
# 6. OBSERVABILITY DASHBOARD ENDPOINT DATA
# ═══════════════════════════════════════════════════════════════════

def get_observability_summary() -> dict:
    """Summary for admin dashboard"""
    api_stats = metrics.get_percentiles(MetricNames.API_LATENCY)
    total_requests = metrics.get_counter(MetricNames.API_REQUESTS)
    total_errors = metrics.get_counter(MetricNames.API_ERRORS)
    error_rate = round((total_errors / max(total_requests, 1)) * 100, 2)

    return {
        "api": {
            "total_requests": total_requests,
            "error_rate_pct": error_rate,
            "latency": api_stats,
        },
        "ai": {
            "total_calls": metrics.get_counter(MetricNames.AI_CALLS),
            "total_cost_usd": metrics.get_counter(MetricNames.AI_COST_USD),
            "cache_hit_rate": metrics.get_counter(MetricNames.AI_CACHE_HITS),
            "latency": metrics.get_percentiles(MetricNames.AI_LATENCY),
        },
        "notifications": {
            "sent": metrics.get_counter(MetricNames.NOTIF_SENT),
            "delivered": metrics.get_counter(MetricNames.NOTIF_DELIVERED),
            "opened": metrics.get_counter(MetricNames.NOTIF_OPENED),
            "acted": metrics.get_counter(MetricNames.NOTIF_ACTED),
            "failed": metrics.get_counter(MetricNames.NOTIF_FAILED),
        },
        "business": {
            "signups": metrics.get_counter(MetricNames.SIGNUPS),
            "upgrades": metrics.get_counter(MetricNames.UPGRADES),
            "churn_events": metrics.get_counter(MetricNames.CHURN),
            "revenue_inr": metrics.get_counter(MetricNames.REVENUE),
        },
        "alerts": sla_monitor.get_active_alerts(),
        "slow_traces": len(tracer.get_slow_traces()),
        "error_traces": len(tracer.get_error_traces()),
    }


__all__ = [
    'MetricsCollector', 'metrics', 'MetricNames',
    'SLAMonitor', 'sla_monitor', 'SLA_THRESHOLDS', 'AlertPriority',
    'RequestTracer', 'tracer',
    'observability_middleware', 'get_observability_summary',
]
