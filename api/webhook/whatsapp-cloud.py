"""
Viya — WhatsApp Cloud Webhook Handler (Vercel Serverless)
=========================================================
Standalone handler for Meta webhook verification & incoming messages.
File path: api/webhook/whatsapp-cloud.py → Route: /api/webhook/whatsapp-cloud
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "heyviya_webhook_2024")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Meta webhook verification — returns hub.challenge"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            mode = params.get("hub.mode", [None])[0]
            token = params.get("hub.verify_token", [None])[0]
            challenge = params.get("hub.challenge", [None])[0]
            
            print(f"[WA Verify] mode={mode}, token={token}, challenge={challenge}")
            
            if mode == "subscribe" and token == VERIFY_TOKEN:
                print("[WA Verify] SUCCESS ✅")
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(challenge).encode())
            else:
                print(f"[WA Verify] FAILED — expected: {VERIFY_TOKEN}, got: {token}")
                self.send_response(403)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Verification failed"}).encode())
        except Exception as e:
            print(f"[WA Verify] Error: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_POST(self):
        """Handle incoming WhatsApp messages from Meta"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            print(f"[WA Incoming] Payload: {json.dumps(data)[:500]}")
            
            # Extract message from Meta's webhook format
            entry = data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                # Status update, not a message — acknowledge
                self._respond(200, {"status": "ok"})
                return
            
            msg = messages[0]
            from_phone = msg.get("from", "")
            msg_type = msg.get("type", "text")
            
            if msg_type == "text":
                text = msg.get("text", {}).get("body", "")
            else:
                text = f"[{msg_type} message]"
            
            print(f"[WA] From: {from_phone}, Text: {text}")
            
            # Process via the main agent
            try:
                from agents.advanced_whatsapp_agent import AdvancedWhatsAppAgent
                agent = AdvancedWhatsAppAgent()
                
                # Get user data from Supabase
                import httpx
                SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
                SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
                
                user_data = {"phone": from_phone, "name": "Friend"}
                if SUPABASE_URL and SUPABASE_KEY:
                    headers = {
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                    }
                    with httpx.Client(timeout=10) as client:
                        resp = client.get(
                            f"{SUPABASE_URL}/rest/v1/users?phone=eq.{from_phone}&select=*",
                            headers=headers
                        )
                        if resp.status_code == 200:
                            users = resp.json()
                            if users:
                                user_data = users[0]
                                user_data["phone"] = from_phone
                
                # Process message
                import asyncio
                loop = asyncio.new_event_loop()
                reply = loop.run_until_complete(agent.process_message(from_phone, text, user_data))
                loop.close()
                
                # Send reply via WhatsApp Cloud API
                self._send_reply(from_phone, reply)
                
            except Exception as e:
                print(f"[WA] Agent error: {e}")
                self._send_reply(from_phone, f"Hey! I got your message. Try again in a moment 🙏")
            
            self._respond(200, {"status": "processed"})
            
        except Exception as e:
            print(f"[WA POST] Error: {e}")
            self._respond(200, {"status": "ok"})  # Always return 200 to Meta
    
    def _send_reply(self, to_phone, message):
        """Send WhatsApp message via Cloud API"""
        try:
            import httpx
            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            
            if not token or not phone_id:
                print("[WA] No access token or phone ID configured")
                return
            
            clean = to_phone.replace("+", "").replace(" ", "")
            if not clean.startswith("91"):
                clean = "91" + clean
            
            with httpx.Client(timeout=10) as client:
                client.post(
                    f"https://graph.facebook.com/v18.0/{phone_id}/messages",
                    json={
                        "messaging_product": "whatsapp",
                        "to": clean,
                        "type": "text",
                        "text": {"body": message}
                    },
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                )
        except Exception as e:
            print(f"[WA Reply] Error: {e}")
    
    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
