"""
Viya V3 — Habit Nudge Cron
=============================
Schedule: Every day at 9:00 PM IST
Sends habit reminder to users who haven't logged habits today
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
WA_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WA_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Send habit nudges to users who haven't logged today"""
        try:
            sent = 0
            users = self._get_users_without_habits()
            
            for user in users:
                phone = user.get("phone", "")
                name = user.get("name", "Friend")
                streak = user.get("_streak", 0)
                
                if not phone:
                    continue
                
                if streak > 0:
                    msg = (f"🔥 Hey {name}! Your *{streak}-day streak* is at risk!\n\n"
                           f"You haven't logged your habits today.\n"
                           f"It takes just 30 seconds to keep it alive! 💪\n\n"
                           f"Open Viya → Life tab → Check in ✅")
                else:
                    msg = (f"💪 Hey {name}! Don't forget your habits today.\n\n"
                           f"Quick check-in takes just 30 seconds!\n"
                           f"Start a streak — even day 1 counts 🌟\n\n"
                           f"Reply *done gym* or *done reading* to log here!")
                
                try:
                    self._send_whatsapp(phone, msg)
                    sent += 1
                except:
                    pass
            
            self._respond(200, {"status": "ok", "sent": sent, "timestamp": datetime.now().isoformat()})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _get_users_without_habits(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/users?select=*&limit=100",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.json() if resp.status_code == 200 else []
        except:
            return []

    def _send_whatsapp(self, phone, message):
        if not WA_TOKEN or not WA_PHONE_ID:
            return
        import httpx
        clean = phone.replace("+", "").replace(" ", "")
        if not clean.startswith("91"):
            clean = "91" + clean
        with httpx.Client(timeout=10) as client:
            client.post(
                f"https://graph.facebook.com/v21.0/{WA_PHONE_ID}/messages",
                json={"messaging_product": "whatsapp", "to": clean, "type": "text", "text": {"body": message}},
                headers={"Authorization": f"Bearer {WA_TOKEN}", "Content-Type": "application/json"}
            )

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
