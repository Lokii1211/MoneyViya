"""
Viya V3 — Medicine Alert Cron
================================
Schedule: Every hour (checks which medicines are due)
Sends WhatsApp reminder for medicines due in the current hour
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
        """Check and send medicine reminders for current hour"""
        try:
            # IST = UTC + 5:30
            now_utc = datetime.utcnow()
            ist_hour = (now_utc.hour + 5) % 24
            ist_minute = now_utc.minute + 30
            if ist_minute >= 60:
                ist_hour = (ist_hour + 1) % 24
            
            current_hour = f"{ist_hour:02d}"
            sent = 0
            
            # Get medicines due at current hour
            medicines = self._get_due_medicines(current_hour)
            
            for med in medicines:
                phone = med.get("phone", "")
                name = med.get("name", "")
                dosage = med.get("dosage", "")
                time = med.get("time", "")
                
                if not phone:
                    continue
                
                # Check if already taken today
                already_taken = self._check_taken(phone, med.get("id", ""))
                if already_taken:
                    continue
                
                msg = (f"💊 *Medicine Reminder*\n\n"
                       f"Time to take: *{name}*\n"
                       f"Dosage: {dosage}\n"
                       f"Scheduled: {time}\n\n"
                       f"Reply *taken {name.lower()}* to log it ✅")
                
                try:
                    self._send_whatsapp(phone, msg)
                    sent += 1
                except:
                    pass
            
            self._respond(200, {
                "status": "ok",
                "hour_checked": current_hour,
                "medicines_due": len(medicines),
                "sent": sent,
                "timestamp": datetime.now().isoformat(),
            })
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _get_due_medicines(self, hour):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/medicines?is_active=eq.true&time=like.{hour}%25&select=*",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.json() if resp.status_code == 200 else []
        except:
            return []

    def _check_taken(self, phone, medicine_id):
        if not SUPABASE_URL or not SUPABASE_KEY or not medicine_id:
            return False
        try:
            import httpx
            today = datetime.now().strftime("%Y-%m-%d")
            with httpx.Client(timeout=5) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/medicine_logs?phone=eq.{phone}&medicine_id=eq.{medicine_id}&date=eq.{today}&select=id",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.status_code == 200 and len(resp.json()) > 0
        except:
            return False

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
