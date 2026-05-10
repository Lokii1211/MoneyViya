"""
Viya V3 — Weekly Summary Cron
================================
Schedule: Every Sunday at 8:00 PM IST
Sends visual weekly summary to all active users
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime, timedelta

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
WA_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WA_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Send weekly summary to all active users"""
        try:
            sent = 0
            users = self._get_users()
            
            for user in users:
                phone = user.get("phone", "")
                name = user.get("name", "Friend")
                if not phone:
                    continue
                
                summary = self._build_weekly(user)
                try:
                    self._send_whatsapp(phone, summary)
                    sent += 1
                except:
                    pass
            
            self._respond(200, {"status": "ok", "sent": sent, "timestamp": datetime.now().isoformat()})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _build_weekly(self, user):
        name = user.get("name", "Friend")
        week_end = datetime.now()
        week_start = week_end - timedelta(days=7)
        
        # Get weekly expenses
        expenses = self._get_weekly_expenses(user.get("phone", ""))
        total_spent = sum(e.get("amount", 0) for e in expenses) if expenses else 0
        
        # Category breakdown
        cats = {}
        for e in (expenses or []):
            cat = e.get("category", "other")
            cats[cat] = cats.get(cat, 0) + e.get("amount", 0)
        
        top_cat = max(cats, key=cats.get) if cats else "N/A"
        top_amount = cats.get(top_cat, 0)
        
        msg = f"📊 *Weekly Summary — {name}*\n"
        msg += f"_{week_start.strftime('%d %b')} - {week_end.strftime('%d %b %Y')}_\n\n"
        msg += f"💰 *Total Spent:* ₹{total_spent:,}\n"
        msg += f"🏆 *Top Category:* {top_cat.title()} (₹{top_amount:,})\n\n"
        
        if cats:
            msg += "*Breakdown:*\n"
            for cat, amt in sorted(cats.items(), key=lambda x: -x[1])[:5]:
                msg += f"  • {cat.title()}: ₹{amt:,}\n"
        
        msg += f"\n🔥 *Streak:* Active\n"
        msg += f"⚡ *XP Earned:* +{len(expenses or []) * 5}\n\n"
        msg += "_Open Viya app for detailed insights! →_"
        return msg

    def _get_weekly_expenses(self, phone):
        if not SUPABASE_URL or not SUPABASE_KEY or not phone:
            return []
        try:
            import httpx
            week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/expenses?phone=eq.{phone}&date=gte.{week_ago}&select=amount,category",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.json() if resp.status_code == 200 else []
        except:
            return []

    def _get_users(self):
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
