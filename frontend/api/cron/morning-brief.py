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
        """Build personalized morning brief from real per-user data"""
        name = user.get("name", "Friend")
        today = datetime.now()
        day_name = today.strftime("%A")
        date_str = today.strftime("%d %B %Y")

        brief = f"🌅 *Good Morning, {name}!*\n"
        brief += f"📅 {day_name}, {date_str}\n\n"

        # Today's agenda
        brief += "📋 *Today's Agenda:*\n"

        bills_due = user.get("_bills_due", [])
        if bills_due:
            for bill in bills_due:
                brief += f"  💳 {bill['name']}: ₹{int(bill.get('amount', 0)):,} due today\n"
        else:
            brief += "  ✅ No bills due today\n"

        streak = user.get("_streak", 0)
        if streak > 0:
            brief += f"\n🔥 *Streak: Day {streak}* — Don't break it!\n"

        pending_habits = user.get("_pending_habits", 0)
        if pending_habits > 0:
            brief += f"✅ {pending_habits} habit(s) waiting for you today\n"

        spent_today = user.get("_spent_today", 0)
        budget = user.get("daily_budget", 1000) or 1000
        remaining = budget - spent_today
        if spent_today > 0:
            brief += f"\n💰 Already spent ₹{int(spent_today):,} today — ₹{int(remaining):,} left of your ₹{int(budget):,} budget\n"
        else:
            brief += f"\n💰 ₹{int(budget):,} daily budget, nothing logged yet\n"

        brief += "\n💬 Reply anything to start your day with Viya!"
        return brief

    def _get_active_users(self):
        """Get users, enriched with real bills/streak/spend data for the brief"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            today_str = datetime.now().strftime("%Y-%m-%d")
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/users?select=phone,name,daily_budget&limit=100",
                    headers=headers,
                )
                if resp.status_code != 200:
                    return []
                users = resp.json()

                for user in users:
                    phone = user.get("phone", "")
                    if not phone:
                        continue
                    try:
                        bills = client.get(
                            f"{SUPABASE_URL}/rest/v1/bills_and_dues?phone=eq.{phone}&status=neq.paid&due_date=eq.{today_str}&select=name,amount",
                            headers=headers,
                        )
                        user["_bills_due"] = bills.json() if bills.status_code == 200 else []

                        habits = client.get(
                            f"{SUPABASE_URL}/rest/v1/habits?phone=eq.{phone}&select=id,current_streak",
                            headers=headers,
                        )
                        habit_rows = habits.json() if habits.status_code == 200 else []
                        user["_streak"] = max((h.get("current_streak", 0) or 0) for h in habit_rows) if habit_rows else 0

                        checkins = client.get(
                            f"{SUPABASE_URL}/rest/v1/habit_checkins?phone=eq.{phone}&checked_date=eq.{today_str}&select=habit_id",
                            headers=headers,
                        )
                        done_ids = {c.get("habit_id") for c in (checkins.json() if checkins.status_code == 200 else [])}
                        user["_pending_habits"] = max(len(habit_rows) - len(done_ids), 0)

                        txns = client.get(
                            f"{SUPABASE_URL}/rest/v1/transactions?phone=eq.{phone}&type=eq.expense&created_at=gte.{today_str}&select=amount",
                            headers=headers,
                        )
                        txn_rows = txns.json() if txns.status_code == 200 else []
                        user["_spent_today"] = sum(float(t.get("amount", 0) or 0) for t in txn_rows)
                    except Exception as e:
                        print(f"[Morning Brief] per-user fetch failed for {phone}: {e}")

                return users
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
