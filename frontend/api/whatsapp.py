"""
Viya AI WhatsApp Webhook & OTP Service (Meta WhatsApp Cloud API)
================================================================
Vercel Serverless: api/whatsapp.py -> /api/whatsapp

Features:
1. Meta WhatsApp Cloud API Webhook Verification (GET hub.verify_token)
2. Meta WhatsApp Cloud API Inbound Message Handler (POST)
   - Dispatches message to chat.process_message()
   - Returns grounded AI reply with structured actions executed
3. WhatsApp OTP Auth (action=send_otp, action=verify_otp)
   - Generates secure 6-digit OTP
   - Persists to Supabase `users` with 10-minute expiry
   - Sends OTP via WhatsApp Cloud API
   - Verifies OTP and returns user profile for seamless app login
"""

from __future__ import annotations

import os
import sys
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Union, Tuple, Dict, Any
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Ensure api directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import chat
import whatsapp_client
from whatsapp_utils import format_phone

SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "").strip()


def _norm_phone(phone: str) -> str:
    return chat.norm_phone(phone)


def generate_otp() -> str:
    """Generate a random 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def send_otp_handler(phone: str) -> tuple[bool, str]:
    """Generate OTP, persist in DB with 10-min expiry, and send via WhatsApp Cloud API."""
    short = _norm_phone(phone)
    if not short or len(short) < 10:
        return False, "Invalid 10-digit phone number."

    otp = generate_otp()
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat() + "Z"

    # Upsert user record with new OTP code and expiration
    chat.sb_post("users", {"phone": short}, upsert=True)
    update_res = chat.sb_patch("users", f"phone=eq.{short}", {
        "otp_code": otp,
        "otp_expires_at": expires_at
    })

    if update_res is None:
        return False, "Failed to initialize OTP. Please check database connection."

    msg = (
        f"🔐 *Your Viya Verification Code is: {otp}*\n\n"
        f"Valid for 10 minutes. Do not share this OTP with anyone.\n\n"
        f"Welcome to Viya — your AI second brain for wealth & life! 💚"
    )

    sent = whatsapp_client.send_message(phone, msg)
    if not sent:
        return False, "Failed to send WhatsApp message. Ensure WhatsApp Cloud API credentials are configured."

    return True, "OTP sent successfully to your WhatsApp!"


def verify_otp_handler(phone: str, otp: str) -> tuple[bool, str, dict | None]:
    """Verify OTP and expiry from Supabase users table."""
    short = _norm_phone(phone)
    clean_otp = (otp or "").strip()

    if not short or not clean_otp:
        return False, "Phone and OTP are required.", None

    users = chat.sb_get(f"users?phone=eq.{short}&select=*")
    if not users:
        return False, "User not found. Please request a new OTP.", None

    user = users[0]
    db_otp = str(user.get("otp_code") or "").strip()
    expires_at_str = user.get("otp_expires_at")

    if not db_otp or db_otp != clean_otp:
        return False, "Invalid OTP. Please check and try again.", None

    if expires_at_str:
        try:
            exp_clean = expires_at_str.replace("Z", "+00:00")
            if datetime.fromisoformat(exp_clean) < datetime.now(datetime.fromisoformat(exp_clean).tzinfo):
                return False, "OTP has expired. Please request a new code.", None
        except Exception as e:
            print(f"[OTP Verify] Expiry check warning: {e}")

    # Clear OTP once verified to prevent replay attacks
    chat.sb_patch("users", f"phone=eq.{short}", {
        "otp_code": None,
        "otp_expires_at": None
    })

    # Remove sensitive fields before returning user
    user.pop("password_hash", None)
    user.pop("otp_code", None)
    user.pop("gmail_access_token", None)
    user.pop("gmail_refresh_token", None)

    return True, "OTP verified successfully!", user


def handle_incoming_webhook(payload: dict) -> bool:
    """Process incoming Meta WhatsApp Cloud API webhook message."""
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts = value.get("contacts", [])

                contact_name = "Friend"
                if contacts and isinstance(contacts, list):
                    contact_name = contacts[0].get("profile", {}).get("name", "Friend")

                for msg in messages:
                    sender = msg.get("from", "")
                    msg_type = msg.get("type", "text")
                    text_body = ""

                    if msg_type == "text":
                        text_body = msg.get("text", {}).get("body", "").strip()
                    elif msg_type == "button":
                        text_body = msg.get("button", {}).get("text", "").strip()
                    elif msg_type == "interactive":
                        interactive = msg.get("interactive", {})
                        if interactive.get("type") == "button_reply":
                            text_body = interactive.get("button_reply", {}).get("title", "")
                        elif interactive.get("type") == "list_reply":
                            text_body = interactive.get("list_reply", {}).get("title", "")
                    elif msg_type == "image":
                        caption = msg.get("image", {}).get("caption", "")
                        text_body = caption or "Received receipt/bill image on WhatsApp."
                    elif msg_type == "audio":
                        text_body = "Voice note received. (Please type your message in text for fastest assistance!)"

                    if sender and text_body:
                        # Process through Viya conversational agent & actions
                        reply, _ = chat.process_message(sender, text_body)
                        if reply:
                            whatsapp_client.send_message(sender, reply)
        return True
    except Exception as e:
        print(f"[WhatsApp Webhook] Processing error: {e}")
        return False


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            # 1. Meta Webhook Verification
            mode = params.get("hub.mode", [""])[0]
            token = params.get("hub.verify_token", [""])[0]
            challenge = params.get("hub.challenge", [""])[0]

            if mode == "subscribe":
                if token == WHATSAPP_VERIFY_TOKEN or not WHATSAPP_VERIFY_TOKEN:
                    self.send_response(200)
                    self.send_header("Content-Type", "text/plain")
                    self.end_headers()
                    self.wfile.write(challenge.encode())
                    return
                else:
                    self._respond(403, {"error": "Verification token mismatch"})
                    return

            # 2. OTP Operations
            action = params.get("action", [""])[0]
            phone = params.get("phone", [""])[0]
            otp_code = params.get("otp", [""])[0]

            if action == "send_otp":
                ok, msg = send_otp_handler(phone)
                self._respond(200 if ok else 400, {"success": ok, "message": msg})
                return

            if action == "verify_otp":
                ok, msg, user = verify_otp_handler(phone, otp_code)
                resp = {"success": ok, "message": msg}
                if user:
                    resp["user"] = user
                self._respond(200 if ok else 400, resp)
                return

            # Default status response
            self._respond(200, {"status": "ok", "service": "Viya WhatsApp Cloud API & OTP Webhook"})

        except Exception as e:
            print(f"[WhatsApp Handler] GET error: {e}")
            self._respond(500, {"error": str(e), "success": False})

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            action = params.get("action", [""])[0]

            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
            data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}

            action = action or data.get("action", "")
            phone = data.get("phone", "")
            otp_code = data.get("otp", "")

            # OTP Operations via POST
            if action == "send_otp":
                ok, msg = send_otp_handler(phone)
                self._respond(200 if ok else 400, {"success": ok, "message": msg})
                return

            if action == "verify_otp":
                ok, msg, user = verify_otp_handler(phone, otp_code)
                resp = {"success": ok, "message": msg}
                if user:
                    resp["user"] = user
                self._respond(200 if ok else 400, resp)
                return

            # Meta Inbound Message Webhook
            handle_incoming_webhook(data)
            self._respond(200, {"status": "EVENT_RECEIVED", "success": True})

        except Exception as e:
            print(f"[WhatsApp Handler] POST error: {e}")
            self._respond(200, {"status": "error", "message": str(e), "success": False})

    def do_OPTIONS(self):
        self._respond(200, {})

    def _respond(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def log_message(self, fmt, *args):
        print(f"[WHATSAPP] {fmt % args}")
