"""
Viya — Setu Account Aggregator Integration
============================================
Vercel Serverless: api/bank-connect.py → /api/bank-connect
Handles bank account connection via Setu AA sandbox.

To enable:
1. Register at https://bridge.setu.co
2. Create an FIU product
3. Get sandbox credentials
4. Add to Vercel env vars:
   SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

SETU_BASE = os.getenv("SETU_BASE_URL", "https://fiu-sandbox.setu.co")
SETU_CLIENT_ID = os.getenv("SETU_CLIENT_ID", "")
SETU_CLIENT_SECRET = os.getenv("SETU_CLIENT_SECRET", "")
SETU_PRODUCT_ID = os.getenv("SETU_PRODUCT_INSTANCE_ID", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()


def setu_request(method, path, body=None):
    import urllib.request
    url = f"{SETU_BASE}{path}"
    headers = {
        "x-client-id": SETU_CLIENT_ID,
        "x-client-secret": SETU_CLIENT_SECRET,
        "x-product-instance-id": SETU_PRODUCT_ID,
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read()), resp.status
    except Exception as e:
        return {"error": str(e)}, 500


def create_consent(phone):
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    body = {
        "Detail": {
            "consentStart": now.isoformat() + "Z",
            "consentExpiry": (now + timedelta(days=365)).isoformat() + "Z",
            "Customer": {"id": f"{phone}@onemoney"},
            "FIDataRange": {
                "from": (now - timedelta(days=365)).strftime("%Y-%m-%dT00:00:00Z"),
                "to": now.strftime("%Y-%m-%dT23:59:59Z"),
            },
            "consentMode": "STORE",
            "consentTypes": ["TRANSACTIONS", "PROFILE", "SUMMARY"],
            "fetchType": "PERIODIC",
            "Frequency": {"unit": "MONTH", "value": 1},
            "DataLife": {"unit": "MONTH", "value": 12},
            "DataConsumer": {"id": "setu-fiu-id"},
            "Purpose": {
                "code": "101",
                "refUri": "https://api.rebit.org.in/aa/purpose/101.xml",
                "text": "Personal Finance Management",
                "Category": {"type": "string"},
            },
            "fiTypes": ["DEPOSIT", "TERM_DEPOSIT", "RECURRING_DEPOSIT", "CREDIT_CARD"],
        },
        "redirectUrl": f"https://heyviya.vercel.app/bank-connect?status=success&phone={phone}",
    }
    return setu_request("POST", "/consents", body)


def check_consent(consent_id):
    return setu_request("GET", f"/consents/{consent_id}")


def fetch_data(consent_id):
    session, status = setu_request("POST", f"/sessions", {"consentId": consent_id, "DataRange": {"from": "2024-01-01T00:00:00Z", "to": "2026-06-22T23:59:59Z"}, "format": "json"})
    if status != 200:
        return session, status
    session_id = session.get("id") or session.get("sessionId")
    if session_id:
        return setu_request("GET", f"/sessions/{session_id}")
    return session, status


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        action = params.get("action", ["status"])[0]

        if not SETU_CLIENT_ID:
            self._respond(200, {
                "configured": False,
                "message": "Setu AA not configured. Add SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID to Vercel env vars.",
                "setup_url": "https://bridge.setu.co",
                "docs_url": "https://docs.setu.co/data/account-aggregator/quickstart",
            })
            return

        if action == "status":
            self._respond(200, {"configured": True, "sandbox": "sandbox" in SETU_BASE})
        elif action == "check":
            consent_id = params.get("consent_id", [""])[0]
            if not consent_id:
                self._respond(400, {"error": "consent_id required"})
                return
            data, status = check_consent(consent_id)
            self._respond(status, data)
        elif action == "fetch":
            consent_id = params.get("consent_id", [""])[0]
            data, status = fetch_data(consent_id)
            self._respond(status, data)
        else:
            self._respond(400, {"error": "Unknown action"})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            action = body.get("action", "create_consent")
            phone = body.get("phone", "")

            if not SETU_CLIENT_ID:
                self._respond(200, {
                    "configured": False,
                    "message": "Setu AA not configured yet. To enable bank connections, register at https://bridge.setu.co and add credentials to Vercel.",
                })
                return

            if action == "create_consent":
                if not phone:
                    self._respond(400, {"error": "phone required"})
                    return
                data, status = create_consent(phone)
                self._respond(status, data)
            else:
                self._respond(400, {"error": "Unknown action"})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self._respond(200, {})
