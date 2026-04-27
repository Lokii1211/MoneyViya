"""
Gmail OAuth Handler — Step 1: Redirect user to Google consent
Vercel Serverless: api/auth/gmail.py → /api/auth/gmail
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlencode

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "https://heyviya.vercel.app/api/auth/gmail/callback")
SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.labels"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Redirect user to Google OAuth consent screen"""
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            phone = params.get("phone", [""])[0]

            # Build Google OAuth URL
            google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
                "client_id": GMAIL_CLIENT_ID,
                "redirect_uri": GMAIL_REDIRECT_URI,
                "response_type": "code",
                "scope": SCOPES,
                "access_type": "offline",
                "prompt": "consent",
                "state": phone,  # Pass phone number in state to link after callback
            })

            # Redirect to Google
            self.send_response(302)
            self.send_header("Location", google_auth_url)
            self.end_headers()

        except Exception as e:
            print(f"[Gmail Auth] Error: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
