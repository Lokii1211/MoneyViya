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
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")))
APP_URL = os.getenv("APP_URL", "https://heyviya.vercel.app")


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

            # Store tokens in Supabase (users table)
            if phone and SUPABASE_URL:
                update_data = json.dumps({
                    "gmail_address": gmail_address,
                    "gmail_access_token": access_token,
                    "gmail_refresh_token": refresh_token,
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
                    print(f"[Gmail Callback] Tokens saved for {phone}")
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
        """Fetch latest 20 emails and process through AEIE"""
        try:
            import urllib.request

            # Fetch message list
            list_req = urllib.request.Request(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:inbox",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            with urllib.request.urlopen(list_req, timeout=15) as resp:
                msg_list = json.loads(resp.read().decode())

            messages = msg_list.get("messages", [])
            print(f"[Gmail Sync] Found {len(messages)} messages")

            for msg_ref in messages[:15]:  # Process max 15
                try:
                    # Fetch full message
                    msg_req = urllib.request.Request(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_ref['id']}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date",
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    with urllib.request.urlopen(msg_req, timeout=10) as resp:
                        msg_data = json.loads(resp.read().decode())

                    # Extract headers
                    headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
                    subject = headers.get("Subject", "")
                    from_raw = headers.get("From", "")
                    snippet = msg_data.get("snippet", "")
                    gmail_id = msg_data.get("id", "")
                    received_at = headers.get("Date", "")

                    # Parse from name/email
                    import re
                    from_match = re.match(r'"?([^"<]*)"?\s*<?([^>]*)>?', from_raw)
                    from_name = from_match.group(1).strip() if from_match else from_raw
                    from_address = from_match.group(2).strip() if from_match else from_raw

                    # Process through AEIE
                    try:
                        import sys
                        from pathlib import Path
                        sys.path.insert(0, str(Path(__file__).parent.parent.parent))
                        from agents.aeie import AIExpenseIntelligenceEngine
                        aeie = AIExpenseIntelligenceEngine()
                        aeie.process_email(phone, {
                            "from": from_address,
                            "from_name": from_name,
                            "subject": subject,
                            "snippet": snippet,
                            "gmail_id": gmail_id,
                        })
                    except Exception as aeie_err:
                        # Fallback: save raw email
                        print(f"[Gmail Sync] AEIE error: {aeie_err}")
                        self._save_email_raw(phone, from_name, from_address, subject, snippet, gmail_id)

                except Exception as msg_err:
                    print(f"[Gmail Sync] Message error: {msg_err}")
                    continue

            print(f"[Gmail Sync] Processed {len(messages)} emails for {phone}")

        except Exception as e:
            print(f"[Gmail Sync] Error: {e}")

    def _save_email_raw(self, phone, from_name, from_address, subject, snippet, gmail_id):
        """Save email directly to Supabase without AEIE"""
        try:
            import urllib.request
            data = json.dumps({
                "phone": phone,
                "from_name": from_name,
                "from_address": from_address,
                "subject": subject[:500],
                "snippet": snippet[:500],
                "gmail_id": gmail_id,
                "category": "other",
                "priority": "medium",
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
