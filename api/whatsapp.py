"""
Viya V3 — WhatsApp Webhook Handler
====================================
Vercel Serverless: api/whatsapp.py → /api/whatsapp
Meta Callback URL: https://heyviya.vercel.app/api/whatsapp
Upgraded to V3 Agentic Orchestrator
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "heyviya_webhook_2024")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Meta webhook verification"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            mode = params.get("hub.mode", [None])[0]
            token = params.get("hub.verify_token", [None])[0]
            challenge = params.get("hub.challenge", [None])[0]
            
            print(f"[WA Verify] mode={mode}, token={token}, challenge={challenge}")
            
            if mode == "subscribe" and token == VERIFY_TOKEN:
                print("[WA Verify] SUCCESS")
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(challenge).encode())
            else:
                print(f"[WA Verify] FAILED - expected: {VERIFY_TOKEN}")
                self._respond(403, {"error": "Verification failed"})
        except Exception as e:
            print(f"[WA Verify] Error: {e}")
            self._respond(500, {"error": str(e)})

    def do_POST(self):
        """Handle incoming WhatsApp messages — V3 Agentic Processing"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            entry = data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                self._respond(200, {"status": "ok"})
                return
            
            msg = messages[0]
            from_phone = msg.get("from", "")
            msg_type = msg.get("type", "text")
            
            # Extract text based on message type
            if msg_type == "text":
                text = msg.get("text", {}).get("body", "")
            elif msg_type == "interactive":
                interactive = msg.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    text = interactive.get("button_reply", {}).get("title", "")
                elif interactive.get("type") == "list_reply":
                    text = interactive.get("list_reply", {}).get("title", "")
                else:
                    text = "[interactive]"
            elif msg_type == "image":
                text = "[image]"
                caption = msg.get("image", {}).get("caption", "")
                if caption:
                    text = f"[image] {caption}"
            elif msg_type == "audio":
                text = "[voice_note]"
            elif msg_type == "document":
                text = "[document]"
            elif msg_type == "location":
                text = "[location]"
            else:
                text = f"[{msg_type}]"
            
            print(f"[WA V3] From: {from_phone}, Type: {msg_type}, Text: {text[:80]}")
            
            # Process via V3 Orchestrator
            try:
                reply = None
                
                # V3 Orchestrator
                try:
                    from agents.v3_orchestrator import V3Orchestrator
                    orchestrator = V3Orchestrator()
                    
                    import asyncio
                    loop = asyncio.new_event_loop()
                    result = loop.run_until_complete(orchestrator.process(from_phone, text, msg_type))
                    loop.close()
                    
                    reply = result.get("response", "")
                    intent = result.get("intent", "unknown")
                    tier = result.get("tier", "unknown")
                    print(f"[WA V3] Intent={intent}, Tier={tier}")
                except Exception as v3_err:
                    print(f"[WA V3] Orchestrator error: {v3_err}")
                
                # V2 Fallback
                if not reply:
                    try:
                        from agents.v2_orchestrator import V2Orchestrator
                        from agents.advanced_whatsapp_agent import AdvancedWhatsAppAgent
                        
                        base_agent = AdvancedWhatsAppAgent()
                        orchestrator = V2Orchestrator(base_agent=base_agent)
                        
                        import asyncio
                        loop = asyncio.new_event_loop()
                        result = loop.run_until_complete(orchestrator.process(from_phone, text))
                        loop.close()
                        reply = result.get("response", "")
                    except Exception as v2_err:
                        print(f"[WA V2] Fallback error: {v2_err}")
                
                # V1 Fallback
                if not reply:
                    try:
                        import httpx
                        from agents.advanced_whatsapp_agent import AdvancedWhatsAppAgent
                        agent = AdvancedWhatsAppAgent()
                        
                        user_data = {"phone": from_phone, "name": "Friend"}
                        SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
                        SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
                        
                        if SUPABASE_URL and SUPABASE_KEY:
                            with httpx.Client(timeout=10) as client:
                                resp = client.get(
                                    f"{SUPABASE_URL}/rest/v1/users?phone=eq.{from_phone}&select=*",
                                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                                )
                                if resp.status_code == 200 and resp.json():
                                    user_data = resp.json()[0]
                                    user_data["phone"] = from_phone
                        
                        import asyncio
                        loop = asyncio.new_event_loop()
                        reply = loop.run_until_complete(agent.process_message(from_phone, text, user_data))
                        loop.close()
                    except Exception as v1_err:
                        print(f"[WA V1] Fallback error: {v1_err}")
                
                self._send_reply(from_phone, reply or "Hey! Got your message 🙏\nType *help* to see what I can do!")
            except Exception as e:
                print(f"[WA] Agent error: {e}")
                self._send_reply(from_phone, "Hey! Got your message. Try again shortly 🙏")
            
            self._respond(200, {"status": "processed"})
        except Exception as e:
            print(f"[WA POST] Error: {e}")
            self._respond(200, {"status": "ok"})
    
    def _send_reply(self, to_phone, message):
        """Send reply via WhatsApp Cloud API"""
        try:
            import httpx
            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            if not token or not phone_id:
                print("[WA Reply] Missing credentials — skipping send")
                return
            clean = to_phone.replace("+", "").replace(" ", "")
            if not clean.startswith("91"):
                clean = "91" + clean
            
            # Split long messages (WhatsApp limit ~4096 chars)
            if len(message) > 4000:
                parts = [message[i:i+4000] for i in range(0, len(message), 4000)]
            else:
                parts = [message]
            
            with httpx.Client(timeout=10) as client:
                for part in parts:
                    client.post(
                        f"https://graph.facebook.com/v21.0/{phone_id}/messages",
                        json={"messaging_product": "whatsapp", "to": clean, "type": "text", "text": {"body": part}},
                        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                    )
        except Exception as e:
            print(f"[WA Reply] Error: {e}")
    
    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
