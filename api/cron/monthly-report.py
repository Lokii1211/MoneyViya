"""
Viya V3 — Monthly Report Cron
================================
Schedule: 1st of every month at 9 AM IST
Sends AI-generated monthly report card via WhatsApp
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime, timedelta

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
WA_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WA_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")


def grade(pct):
    if pct >= 95: return "A+"
    if pct >= 90: return "A"
    if pct >= 85: return "A-"
    if pct >= 80: return "B+"
    if pct >= 75: return "B"
    if pct >= 70: return "B-"
    if pct >= 60: return "C"
    return "D"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Generate and send monthly reports"""
        try:
            sent = 0
            users = self._get_users()
            last_month = (datetime.now().replace(day=1) - timedelta(days=1))
            month_name = last_month.strftime("%B %Y")
            
            for user in users:
                phone = user.get("phone", "")
                name = user.get("name", "Friend")
                if not phone:
                    continue
                
                report = self._build_report(phone, name, month_name, last_month)
                try:
                    self._send_whatsapp(phone, report)
                    sent += 1
                except:
                    pass
            
            self._respond(200, {"status": "ok", "sent": sent, "month": month_name})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _build_report(self, phone, name, month_name, last_month):
        """Build monthly report card"""
        # Get month's expenses
        month_start = last_month.replace(day=1).strftime("%Y-%m-%d")
        month_end = last_month.strftime("%Y-%m-%d")
        expenses = self._get_expenses(phone, month_start, month_end)
        
        total_spent = sum(e.get("amount", 0) for e in expenses)
        budget = 30000  # default
        budget_pct = min(int((1 - total_spent / budget) * 100), 100) if budget > 0 else 0
        
        # Category breakdown
        cats = {}
        for e in expenses:
            cat = e.get("category", "other")
            cats[cat] = cats.get(cat, 0) + e.get("amount", 0)
        
        top_cats = sorted(cats.items(), key=lambda x: -x[1])[:3]
        
        # Build report
        msg = f"📋 *Monthly Report Card — {month_name}*\n"
        msg += f"_{name}'s Financial Health_\n\n"
        
        msg += f"💰 *Finance*\n"
        msg += f"   Total Spent: ₹{total_spent:,.0f}\n"
        msg += f"   Budget: ₹{budget:,}\n"
        msg += f"   Savings: ₹{max(budget - total_spent, 0):,.0f}\n"
        msg += f"   Grade: *{grade(budget_pct)}* {'✅' if budget_pct >= 70 else '⚠️'}\n\n"
        
        if top_cats:
            msg += f"📊 *Top Categories*\n"
            for cat, amt in top_cats:
                msg += f"   • {cat.title()}: ₹{amt:,.0f}\n"
            msg += "\n"
        
        # XP info
        xp_data = self._get_xp(phone)
        if xp_data:
            msg += f"⚡ *Gamification*\n"
            msg += f"   Level: {xp_data.get('level', 1)}\n"
            msg += f"   Total XP: {xp_data.get('total_xp', 0):,}\n"
            msg += f"   Streak: {xp_data.get('current_streak', 0)} days\n\n"
        
        msg += f"🎯 *Overall Grade: {grade(budget_pct)}*\n\n"
        
        if budget_pct >= 80:
            msg += "🌟 _Excellent month! Keep it up!_"
        elif budget_pct >= 60:
            msg += "💪 _Good effort! Room for improvement._"
        else:
            msg += "📉 _Let's do better this month. Set tighter budgets!_"
        
        return msg

    def _get_expenses(self, phone, start, end):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/expenses?phone=eq.{phone}&date=gte.{start}&date=lte.{end}&select=amount,category",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                return resp.json() if resp.status_code == 200 else []
        except:
            return []

    def _get_xp(self, phone):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return None
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/user_xp?phone=eq.{phone}&select=*",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                if resp.status_code == 200 and resp.json():
                    return resp.json()[0]
        except:
            pass
        return None

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
