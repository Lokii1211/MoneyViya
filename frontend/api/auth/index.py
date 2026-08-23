"""
Server-Side Authentication Handler for MoneyViya
Provides secure registration, password verification, and signed session tokens.
"""

import json
import os
import re
import hmac
import hashlib
import base64
import time
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip().rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))).strip()
AUTH_SECRET = os.getenv("AUTH_SECRET", os.getenv("CRON_SECRET", "viya_secure_session_key_2026")).strip()

ALLOWED_ORIGINS = {
    "https://heyviya.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "capacitor://localhost",
}


def _get_cors_origin(origin_header):
    if not origin_header:
        return "https://heyviya.vercel.app"
    if origin_header in ALLOWED_ORIGINS:
        return origin_header
    if origin_header.endswith(".vercel.app"):
        return origin_header
    return "https://heyviya.vercel.app"


def _clean_phone(p):
    digits = re.sub(r"\D", "", str(p or ""))
    return digits[-10:] if len(digits) >= 10 else digits


def _hash_password(password, salt=None):
    if not salt:
        salt = base64.b64encode(os.urandom(16)).decode("utf-8")
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256${salt}${base64.b64encode(key).decode('utf-8')}"


def _verify_password(password, stored_hash):
    if not stored_hash or not password:
        return False
    if stored_hash.startswith("pbkdf2_sha256$"):
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        salt = parts[1]
        expected = _hash_password(password, salt)
        return hmac.compare_digest(stored_hash, expected)
    # Fallback to legacy SHA-256 (phone + password or password)
    legacy_hash1 = hashlib.sha256(password.encode("utf-8")).hexdigest()
    if hmac.compare_digest(stored_hash, legacy_hash1):
        return True
    return False


def _generate_token(phone):
    expiry = int(time.time()) + (86400 * 30)  # 30 days
    data = f"{phone}:{expiry}"
    sig = hmac.new(AUTH_SECRET.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()
    token = base64.b64encode(f"{data}:{sig}".encode("utf-8")).decode("utf-8")
    return token


def _verify_token(token):
    try:
        raw = base64.b64decode(token.encode("utf-8")).decode("utf-8")
        parts = raw.split(":")
        if len(parts) != 3:
            return None
        phone, expiry_str, sig = parts[0], parts[1], parts[2]
        if int(expiry_str) < time.time():
            return None
        data = f"{phone}:{expiry_str}"
        expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected_sig):
            return phone
    except Exception:
        pass
    return None


def _sb_fetch_user(phone):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    url = f"{SUPABASE_URL}/rest/v1/users?phone=eq.{phone}&select=*"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            rows = json.loads(r.read())
            return rows[0] if rows else None
    except Exception as e:
        print(f"[AUTH] fetch user error: {e}")
        return None


def _sb_create_user(data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    url = f"{SUPABASE_URL}/rest/v1/users"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            rows = json.loads(r.read())
            return rows[0] if rows else data
    except Exception as e:
        print(f"[AUTH] create user error: {e}")
        return None


def _sanitize_user(u):
    if not u:
        return None
    safe = dict(u)
    safe.pop("password_hash", None)
    safe.pop("password", None)
    safe.pop("gmail_access_token", None)
    safe.pop("gmail_refresh_token", None)
    safe.pop("otp_code", None)
    safe.pop("otp_expires_at", None)
    return safe


class handler(BaseHTTPRequestHandler):
    def _send_cors(self):
        origin = self.headers.get("Origin", "")
        self.send_header("Access-Control-Allow-Origin", _get_cors_origin(origin))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Credentials", "true")

    def _respond(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._send_cors()
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            payload = {}

        path = self.path
        action = payload.get("action") or ("login" if "login" in path else "register" if "register" in path else "login")

        if action == "login":
            phone = _clean_phone(payload.get("phone"))
            password = payload.get("password", "")
            if len(phone) < 10 or not password:
                self._respond(400, {"ok": False, "error": "Phone and password required"})
                return

            user = _sb_fetch_user(phone)
            if not user:
                self._respond(401, {"ok": False, "error": "Account not found. Please register first."})
                return

            stored_hash = user.get("password_hash") or user.get("password", "")
            # Check legacy hash: sha256(phone + password)
            legacy_combo = hashlib.sha256((phone + password).encode("utf-8")).hexdigest()
            if stored_hash == legacy_combo or _verify_password(password, stored_hash):
                token = _generate_token(phone)
                self._respond(200, {"ok": True, "user": _sanitize_user(user), "token": token})
                return

            self._respond(401, {"ok": False, "error": "Incorrect password"})
            return

        elif action == "register":
            phone = _clean_phone(payload.get("phone"))
            name = payload.get("name", "").strip()
            password = payload.get("password", "")
            if len(phone) < 10 or not name or not password:
                self._respond(400, {"ok": False, "error": "Name, 10-digit phone, and password required"})
                return

            existing = _sb_fetch_user(phone)
            if existing:
                self._respond(409, {"ok": False, "error": "An account with this phone already exists"})
                return

            hashed = _hash_password(password)
            user_data = {
                "phone": phone,
                "name": name,
                "password_hash": hashed,
                "monthly_income": float(payload.get("monthly_income", 0) or 0),
                "monthly_expenses": float(payload.get("monthly_expenses", 0) or 0),
                "preferred_language": payload.get("preferred_language", "en"),
                "currency": "INR",
            }
            created = _sb_create_user(user_data)
            if created:
                token = _generate_token(phone)
                self._respond(200, {"ok": True, "user": _sanitize_user(created), "token": token})
                return
            self._respond(500, {"ok": False, "error": "Could not create user"})
            return

        elif action == "verify_session":
            token = payload.get("token", "")
            phone = _verify_token(token)
            if not phone:
                self._respond(401, {"ok": False, "error": "Invalid or expired session"})
                return
            user = _sb_fetch_user(phone)
            if user:
                self._respond(200, {"ok": True, "user": _sanitize_user(user)})
                return
            self._respond(404, {"ok": False, "error": "User not found"})
            return

        self._respond(400, {"ok": False, "error": "Invalid action"})
