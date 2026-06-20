"""
Viya V3 — Morning Brief Cron
==============================
Vercel Cron: api/cron/morning-brief.py → /api/cron/morning-brief
Schedule: Every day at 7:00 AM IST
Sends personalized daily brief to all active users via WhatsApp
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
        """Trigger morning brief for all active users"""
        try:
            # Verify cron secret (optional security)
            auth = self.headers.get("Authorization", "")
            cron_secret = os.getenv("CRON_SECRET", "")
            
            if cron_secret and auth != f"Bearer {cron_secret}":
                self._respond(401, {"error": "Unauthorized"})
                return
            
            sent_count = 0
            errors = []
            
            # Get all active users
            users = self._get_active_users()
            
            for user in users:
                phone = user.get("phone", "")
                name = user.get("name", "Friend")
                
                if not phone:
                    continue
                
                try:
                    brief = self._build_brief(user)
                    self._send_whatsapp(phone, brief)
                    sent_count += 1
                except Exception as e:
                    errors.append(f"{phone}: {str(e)}")
            
            self._respond(200, {
                "status": "ok",
                "sent": sent_count,
                "total_users": len(users),
                "errors": errors[:5],  # Limit error output
                "timestamp": datetime.now().isoformat(),
            })
        except Exception as e:
            print(f"[Morning Brief] Error: {e}")
            self._respond(500, {"error": str(e)})

    def _build_brief(self, user):
        """Build personalized morning brief"""
        name = user.get("name", "Friend")
        today = datetime.now()
        day_name = today.strftime("%A")
        date_str = today.strftime("%d %B %Y")
        
        brief = f"🌅 *Good Morning, {name}!*\n"
        brief += f"📅 {day_name}, {date_str}\n\n"
        
        # Today's agenda
        brief += "📋 *Today's Agenda:*\n"
        
        # Check bills due today
        bills_due = user.get("_bills_due", [])
        if bills_due:
            for bill in bills_due:
                brief += f"  💳 {bill['name']}: ₹{bill['amount']:,} due today\n"
        else:
            brief += "  ✅ No bills due today\n"
        
        # Streak info
        streak = user.get("_streak", 0)
        if streak > 0:
            brief += f"\n🔥 *Streak: Day {streak}* — Don't break it!\n"
        
        # Budget status
        spent = user.get("_month_spent", 0)
        budget = user.get("monthly_budget", 30000)
        if budget > 0:
            remaining = budget - spent
            pct = int((spent / budget) * 100)
            brief += f"\n💰 Budget: ₹{remaining:,} left ({pct}% used)\n"
        
        brief += "\n💬 Reply anything to start your day with Viya!"
        return brief

    def _get_active_users(self):
        """Get users who have WhatsApp notifications enabled"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/users?select=*&limit=100",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            print(f"[Morning Brief] DB error: {e}")
        return []

    def _send_whatsapp(self, phone, message):
        """Send WhatsApp message"""
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
