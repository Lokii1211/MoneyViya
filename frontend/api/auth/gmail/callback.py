"""
Gmail OAuth Callback — Step 2: Exchange code for tokens, store, sync emails
Vercel Serverless: api/auth/gmail/callback.py → /api/auth/gmail/callback
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "https://heyviya.vercel.app/api/auth/gmail/callback")
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))).strip()
APP_URL = os.getenv("APP_URL", "https://heyviya.vercel.app")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()


def _categorize_emails(emails):
    """Classify a batch of emails in ONE Groq call — the previous sync saved
    every email as category='other'/priority='medium' with no extraction at
    all (a leftover placeholder), so none of the "AI Insights"/action-item
    UI in EmailIntelligence.jsx ever had real data to show. One batched call
    (instead of one per email) keeps this well inside the 30s function
    timeout. On any failure, callers fall back to the old generic values —
    the raw email still saves either way."""
    if not GROQ_API_KEY or not emails:
        return {}
    import urllib.request
    listing = "\n".join(
        f'{i}. from="{e["from_name"] or e["from_address"]}" subject="{e["subject"]}" snippet="{e["snippet"][:200]}"'
        for i, e in enumerate(emails)
    )
    prompt = (
        "Classify each email below. Reply with ONLY a JSON array (no prose), one object per line index, in this exact shape:\n"
        '{"i": <index>, "category": "bill|meeting|delivery|investment|offer|personal|work", '
        '"priority": "critical|high|medium|low", "action_required": true|false, '
        '"action_type": "pay_bill|accept_meeting|track_delivery|none", '
        '"amount": <number or null>, "dueDate": "<YYYY-MM-DD or null>"}\n\n'
        f"Emails:\n{listing}"
    )
    try:
        payload = json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 1500,
        }).encode()
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; MoneyViya/1.0; +https://heyviya.vercel.app)",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            content = json.loads(r.read())["choices"][0]["message"]["content"]
        # Model may wrap the array in prose/markdown fences despite
        # instructions — pull out the first [...] block defensively.
        start, end = content.find("["), content.rfind("]")
        if start == -1 or end == -1:
            return {}
        parsed = json.loads(content[start:end + 1])
        return {item["i"]: item for item in parsed if "i" in item}
    except Exception as e:
        print(f"[Gmail Categorize] Error: {e}")
        return {}


def _sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle Google OAuth callback — exchange code for tokens"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            code = params.get("code", [None])[0]
            phone = params.get("state", [""])[0]
            error = params.get("error", [None])[0]

            if error:
                print(f"[Gmail Callback] User denied: {error}")
                self._redirect(f"{APP_URL}/email?error=denied")
                return

            if not code:
                print("[Gmail Callback] No code received")
                self._redirect(f"{APP_URL}/email?error=no_code")
                return

            print(f"[Gmail Callback] Got code for phone: {phone}")

            # Exchange code for tokens
            import urllib.request
            token_data = json.dumps({
                "code": code,
                "client_id": GMAIL_CLIENT_ID,
                "client_secret": GMAIL_CLIENT_SECRET,
                "redirect_uri": GMAIL_REDIRECT_URI,
                "grant_type": "authorization_code",
            }).encode()

            token_req = urllib.request.Request(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with urllib.request.urlopen(token_req, timeout=15) as resp:
                tokens = json.loads(resp.read().decode())

            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = tokens.get("expires_in", 3600)

            print(f"[Gmail Callback] Got tokens, access={bool(access_token)}, refresh={bool(refresh_token)}")

            if not access_token:
                self._redirect(f"{APP_URL}/email?error=no_token")
                return

            # Get user's email address from Gmail
            profile_req = urllib.request.Request(
                "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            with urllib.request.urlopen(profile_req, timeout=10) as resp:
                profile = json.loads(resp.read().decode())

            gmail_address = profile.get("emailAddress", "")
            print(f"[Gmail Callback] Connected: {gmail_address}")

            # Store encrypted tokens in Supabase (users table)
            if phone and SUPABASE_URL:
                try:
                    import sys
                    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
                    from crypto_utils import encrypt_token
                except Exception:
                    def encrypt_token(t): return t

                update_data = json.dumps({
                    "gmail_address": gmail_address,
                    "gmail_access_token": encrypt_token(access_token),
                    "gmail_refresh_token": encrypt_token(refresh_token) if refresh_token else "",
                    "gmail_connected": True,
                }).encode()

                update_req = urllib.request.Request(
                    f"{SUPABASE_URL}/rest/v1/users?phone=eq.{phone}",
                    data=update_data,
                    headers={**_sb_headers(), "Prefer": "return=minimal"},
                    method="PATCH",
                )
                try:
                    urllib.request.urlopen(update_req, timeout=10)
                    print(f"[Gmail Callback] Encrypted tokens saved for {phone}")
                except Exception as e:
                    print(f"[Gmail Callback] Token save error: {e}")

            # Fetch and process recent emails
            self._sync_emails(access_token, phone)

            # Redirect back to app
            self._redirect(f"{APP_URL}/email?connected=true&email={gmail_address}")

        except Exception as e:
            print(f"[Gmail Callback] Error: {e}")
            import traceback
            traceback.print_exc()
            self._redirect(f"{APP_URL}/email?error=server_error")

    def _sync_emails(self, access_token, phone):
        """Fetch latest 20 emails, classify them in one batched Groq call, save"""
        try:
            import urllib.request
            import re

            # Fetch message list
            list_req = urllib.request.Request(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:inbox",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            with urllib.request.urlopen(list_req, timeout=15) as resp:
                msg_list = json.loads(resp.read().decode())

            messages = msg_list.get("messages", [])
            print(f"[Gmail Sync] Found {len(messages)} messages")

            parsed_emails = []
            for msg_ref in messages[:15]:  # Process max 15
                try:
                    msg_req = urllib.request.Request(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_ref['id']}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date",
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    with urllib.request.urlopen(msg_req, timeout=10) as resp:
                        msg_data = json.loads(resp.read().decode())

                    headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
                    subject = headers.get("Subject", "")
                    from_raw = headers.get("From", "")
                    snippet = msg_data.get("snippet", "")
                    gmail_id = msg_data.get("id", "")

                    from_match = re.match(r'"?([^"<]*)"?\s*<?([^>]*)>?', from_raw)
                    from_name = from_match.group(1).strip() if from_match else from_raw
                    from_address = from_match.group(2).strip() if from_match else from_raw

                    parsed_emails.append({
                        "from_name": from_name, "from_address": from_address,
                        "subject": subject, "snippet": snippet, "gmail_id": gmail_id,
                    })
                except Exception as msg_err:
                    print(f"[Gmail Sync] Message error: {msg_err}")
                    continue

            classifications = _categorize_emails(parsed_emails)
            for i, email in enumerate(parsed_emails):
                self._save_email(phone, email, classifications.get(i, {}))

            print(f"[Gmail Sync] Processed {len(parsed_emails)} emails for {phone}")

        except Exception as e:
            print(f"[Gmail Sync] Error: {e}")

    def _save_email(self, phone, email, classification):
        """Save an email to Supabase with its (best-effort) AI classification"""
        try:
            import urllib.request
            extracted = {}
            if classification.get("amount") is not None:
                extracted["amount"] = classification["amount"]
            if classification.get("dueDate"):
                extracted["dueDate"] = classification["dueDate"]
            data = json.dumps({
                "phone": phone,
                "from_name": email["from_name"],
                "from_address": email["from_address"],
                "subject": email["subject"][:500],
                "snippet": email["snippet"][:500],
                "gmail_id": email["gmail_id"],
                "category": classification.get("category") or "other",
                "priority": classification.get("priority") or "medium",
                "action_required": bool(classification.get("action_required", False)),
                "action_type": classification.get("action_type") if classification.get("action_type") != "none" else None,
                "extracted_data": extracted,
            }).encode()
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/emails",
                data=data,
                headers=_sb_headers(),
                method="POST",
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            print(f"[Gmail Save] Error: {e}")

    def _redirect(self, url):
        self.send_response(302)
        self.send_header("Location", url)
        self.end_headers()
