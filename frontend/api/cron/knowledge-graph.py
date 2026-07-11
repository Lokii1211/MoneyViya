"""
Viya — Knowledge Graph Builder Cron (RAG Phase 3)
====================================================
Nightly job: rebuilds each user's kg_edges from data that already exists —
no invented relationships, just what's genuinely in their goals/bills/
investments. Runs on Vercel's native daily cron (see vercel.json); once/day
is exactly the right cadence for this, no external scheduler needed.

Edges built per user:
  goal:<id>:<name>   --blocked_by--> bill:<id>:<name>        (weight = bill's
                                                                monthly-equivalent ₹ amount)
  user:<phone>       --holds-->      investment:<id>:<name>  (weight = invested_amount)

_rag.py's kg_walk() does the 1-hop lookup at query time — this is what lets
chat/WhatsApp explain *why* a goal is stuck (an EMI competing for the same
cash flow), not just report its progress number. See docs/AI_AGENTS_RAG_PRD.md.
"""

import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()

# Converts a bill's billing frequency into a monthly-equivalent cash-flow
# weight, so a yearly insurance premium doesn't outweigh a monthly EMI 12x
# over just because of its raw sticker amount.
FREQ_TO_MONTHLY = {"monthly": 1.0, "quarterly": 1 / 3, "yearly": 1 / 12, "one_time": 0.0}


def _sb_get(path):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{path}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read()) or []
    except Exception as e:
        print(f"[KG] get error {path[:60]}: {e}")
        return []


def _sb_delete_edges(phone):
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/kg_edges?user_phone=eq.{phone}", method="DELETE",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        )
        urllib.request.urlopen(req, timeout=8)
    except Exception as e:
        print(f"[KG] delete error for {phone}: {e}")


def _sb_insert_edges(rows):
    if not rows:
        return 0
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/kg_edges", data=json.dumps(rows).encode(), method="POST",
            headers={
                "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return len(rows) if r.status in (200, 201, 204) else 0
    except Exception as e:
        print(f"[KG] insert error: {e}")
        return 0


def build_edges_for_user(phone):
    goals = _sb_get(f"goals?phone=eq.{phone}&status=eq.active&select=id,name")
    bills = _sb_get(f"bills_and_dues?phone=eq.{phone}&frequency=neq.one_time&select=id,name,amount,frequency")
    investments = _sb_get(f"investments?phone=eq.{phone}&select=id,name,invested_amount")

    edges = []
    for goal in goals:
        goal_id = goal.get("id")
        if goal_id is None:
            continue
        goal_subj = f"goal:{goal_id}:{goal.get('name','')}"
        for bill in bills:
            monthly_amt = float(bill.get("amount") or 0) * FREQ_TO_MONTHLY.get(bill.get("frequency", "monthly"), 1.0)
            if monthly_amt <= 0:
                continue
            edges.append({
                "user_phone": phone, "subject": goal_subj, "relation": "blocked_by",
                "object": f"bill:{bill.get('id')}:{bill.get('name','')}", "weight": round(monthly_amt, 2),
            })

    for inv in investments:
        edges.append({
            "user_phone": phone, "subject": f"user:{phone}", "relation": "holds",
            "object": f"investment:{inv.get('id')}:{inv.get('name','')}",
            "weight": round(float(inv.get("invested_amount") or 0), 2),
        })

    return edges


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            auth = self.headers.get("Authorization", "")
            cron_secret = os.getenv("CRON_SECRET", "")
            if cron_secret and auth != f"Bearer {cron_secret}":
                self._respond(401, {"error": "Unauthorized"})
                return
            if not SUPABASE_URL or not SUPABASE_KEY:
                self._respond(500, {"error": "Supabase not configured"})
                return

            # Bounded to 500 users — fine at current scale; if the user base
            # grows well past this, this loop needs pagination/batching.
            users = _sb_get("users?select=phone&limit=500")
            users_processed, edges_built = 0, 0
            debug_counts = {"goals": 0, "bills": 0, "investments": 0}
            for u in users:
                phone = u.get("phone", "")
                if not phone:
                    continue
                _sb_delete_edges(phone)
                goals = _sb_get(f"goals?phone=eq.{phone}&status=eq.active&select=id,name")
                bills = _sb_get(f"bills_and_dues?phone=eq.{phone}&frequency=neq.one_time&select=id,name,amount,frequency")
                investments = _sb_get(f"investments?phone=eq.{phone}&select=id,name,invested_amount")
                debug_counts["goals"] += len(goals)
                debug_counts["bills"] += len(bills)
                debug_counts["investments"] += len(investments)
                edges = build_edges_for_user(phone)
                edges_built += _sb_insert_edges(edges)
                users_processed += 1

            self._respond(200, {"status": "ok", "users_processed": users_processed, "edges_built": edges_built, "debug_counts": debug_counts})
        except Exception as e:
            print(f"[KG] {e}")
            self._respond(200, {"status": "error", "error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
