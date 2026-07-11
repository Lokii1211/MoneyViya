"""
MoneyViya — Minute-Level Reminder Cron
=======================================
Called every 1 minute by cron-job.org
Checks `user_reminders` table for due reminders, sends via WhatsApp.
"""

import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler


def ordinal(n):
    if 11 <= (n % 100) <= 13:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Check and fire due reminders every minute"""
        try:
            import httpx

            # This runs on an external scheduler (cron-job.org, not Vercel's
            # native cron — Hobby plan can't do per-minute), so it's a public
            # URL. Verify the secret if one is configured.
            auth = self.headers.get("Authorization", "")
            cron_secret = os.getenv("CRON_SECRET", "")
            if cron_secret and auth != f"Bearer {cron_secret}":
                self._respond(401, {"error": "Unauthorized"})
                return

            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()
            
            if not SUPABASE_URL or not SUPABASE_KEY:
                self._respond(500, {"error": "Supabase not configured"})
                return
            
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            now = datetime.utcnow()
            # IST is UTC+5:30
            ist_now = now + timedelta(hours=5, minutes=30)
            current_time = ist_now.strftime("%H:%M")
            current_weekday = ist_now.strftime("%A")
            current_date = ist_now.day
            current_date_str = ist_now.strftime("%Y-%m-%d")
            # Last day of the current month (handles 28/29/30/31-day months)
            next_month = ist_now.replace(day=28) + timedelta(days=4)
            last_day_of_month = (next_month - timedelta(days=next_month.day)).day
            
            results = {
                "time_ist": ist_now.isoformat(),
                "current_time": current_time,
                "checked": 0,
                "sent": 0,
                "errors": []
            }
            
            # Fetch all active reminders that match current time
            with httpx.Client(timeout=15.0) as client:
                # Get all enabled reminders where time matches current HH:MM
                url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&time=eq.{current_time}&select=*"
                resp = client.get(url, headers=headers)
                
                if resp.status_code != 200:
                    results["errors"].append(f"Fetch error: {resp.status_code} {resp.text}")
                    self._respond(200, results)
                    return
                
                reminders = resp.json()
                results["checked"] = len(reminders)
                
                for rem in reminders:
                    try:
                        freq = rem.get("freq", "daily")
                        should_fire = False

                        # Check frequency
                        if freq == "daily":
                            should_fire = True
                        elif freq == "weekly":
                            if rem.get("weekday", "") == current_weekday:
                                should_fire = True
                        elif freq == "monthly":
                            target_day = rem.get("month_date", 1) or 1
                            # Clamp to the last real day so 29/30/31 still fire in shorter months
                            effective_day = min(target_day, last_day_of_month)
                            if effective_day == current_date:
                                should_fire = True
                        elif freq == "once":
                            # One-time reminder: check if date matches
                            if rem.get("fire_date", "") == current_date_str:
                                should_fire = True

                        # Check if already sent today (prevent duplicates)
                        last_sent = rem.get("last_sent_at", "")
                        if last_sent and last_sent.startswith(current_date_str):
                            should_fire = False  # Already sent today

                        if not should_fire:
                            continue

                        phone = rem.get("phone", "")
                        title = rem.get("title", "Reminder")
                        desc = rem.get("description", "")
                        icon = rem.get("icon", "⏰")

                        # Send SHORT WhatsApp message
                        msg = f"{icon} *{title}*"
                        if desc:
                            msg += f"\n{desc}"

                        wa_sent = self._send_whatsapp(phone, msg)

                        if wa_sent:
                            results["sent"] += 1

                            # Mark as sent (update last_sent_at)
                            update_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                            update_data = {"last_sent_at": ist_now.isoformat()}

                            # If one-time, disable after sending
                            if freq == "once":
                                update_data["enabled"] = False

                            client.patch(update_url, json=update_data, headers={**headers, "Prefer": "return=minimal"})
                        else:
                            results["errors"].append(f"WhatsApp send failed for {phone}")

                    except Exception as e:
                        results["errors"].append(f"Reminder {rem.get('id')}: {str(e)}")

                # ── 5-minute advance nudge ──
                # Same query shape as the main fire, but for reminders whose
                # time is exactly 5 minutes from now. Runs once/minute via
                # cron-job.org so this can't double-fire within the window;
                # dedup keys off last_advance_sent_at rather than
                # last_sent_at so it doesn't clash with the real fire.
                advance_dt = ist_now + timedelta(minutes=5)
                advance_time = advance_dt.strftime("%H:%M")
                advance_weekday = advance_dt.strftime("%A")
                advance_date = advance_dt.day
                results["advance_checked"] = 0
                results["advance_sent"] = 0
                try:
                    adv_url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&time=eq.{advance_time}&select=*"
                    adv_resp = client.get(adv_url, headers=headers)
                    if adv_resp.status_code == 200:
                        adv_reminders = adv_resp.json()
                        results["advance_checked"] = len(adv_reminders)
                        for rem in adv_reminders:
                            try:
                                freq = rem.get("freq", "daily")
                                due = False
                                if freq == "daily":
                                    due = True
                                elif freq == "weekly" and rem.get("weekday", "") == advance_weekday:
                                    due = True
                                elif freq == "monthly":
                                    target_day = min(rem.get("month_date", 1) or 1, last_day_of_month)
                                    due = target_day == advance_date
                                elif freq == "once" and rem.get("fire_date", "") == advance_dt.strftime("%Y-%m-%d"):
                                    due = True

                                last_adv = rem.get("last_advance_sent_at", "") or ""
                                if last_adv.startswith(current_date_str):
                                    due = False  # already nudged today

                                if not due:
                                    continue

                                title = rem.get("title", "Reminder")
                                icon = rem.get("icon", "⏰")
                                msg = f"⏳ *5 min to go* — {icon} {title}"
                                if self._send_whatsapp(rem.get("phone", ""), msg):
                                    results["advance_sent"] += 1
                                    upd_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                                    client.patch(upd_url, json={"last_advance_sent_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                            except Exception as e:
                                results["errors"].append(f"Advance {rem.get('id')}: {str(e)}")
                except Exception as e:
                    results["errors"].append(f"Advance fetch: {str(e)}")

                # ── Monthly reminders: 3-day advance heads-up ──
                # Fires once, at the reminder's own set time, 3 days before
                # the target day-of-month — so a bill reminder on the 5th
                # gives you a nudge on the 2nd at the same hour.
                results["monthly_advance_sent"] = 0
                try:
                    monthly_url = f"{SUPABASE_URL}/rest/v1/user_reminders?enabled=eq.true&freq=eq.monthly&time=eq.{current_time}&select=*"
                    monthly_resp = client.get(monthly_url, headers=headers)
                    if monthly_resp.status_code == 200:
                        for rem in monthly_resp.json():
                            try:
                                target_day = min(rem.get("month_date", 1) or 1, last_day_of_month)
                                days_until = target_day - current_date
                                if days_until != 3:
                                    continue
                                last_madv = rem.get("last_monthly_advance_at", "") or ""
                                if last_madv.startswith(current_date_str):
                                    continue
                                title = rem.get("title", "Reminder")
                                icon = rem.get("icon", "⏰")
                                msg = f"📅 *In 3 days* — {icon} {title} (due {ordinal(target_day)})"
                                if self._send_whatsapp(rem.get("phone", ""), msg):
                                    results["monthly_advance_sent"] += 1
                                    upd_url = f"{SUPABASE_URL}/rest/v1/user_reminders?id=eq.{rem['id']}"
                                    client.patch(upd_url, json={"last_monthly_advance_at": ist_now.isoformat()}, headers={**headers, "Prefer": "return=minimal"})
                            except Exception as e:
                                results["errors"].append(f"Monthly advance {rem.get('id')}: {str(e)}")
                except Exception as e:
                    results["errors"].append(f"Monthly advance fetch: {str(e)}")

            # Evening log reminder — the morning brief is handled by the
            # separate cron/morning-brief.py Vercel-native cron (scheduled
            # for the same IST time), so only the evening side lives here.
            if current_time == "21:00":
                results["briefing"] = "evening"
                self._send_briefings("evening")

            self._respond(200, results)
            
        except Exception as e:
            self._respond(500, {"error": str(e)})
    
    def _send_whatsapp(self, phone, message):
        """Send WhatsApp message via Cloud API"""
        try:
            import httpx
            
            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            
            if not token or not phone_id:
                return False
            
            clean_phone = phone.replace("+", "").replace(" ", "")
            if not clean_phone.startswith("91"):
                clean_phone = "91" + clean_phone
            
            url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
            
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json={
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message}
                }, headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                })
                
                return resp.status_code == 200
        except:
            return False
    
    def _send_briefings(self, briefing_type):
        """Send morning/evening briefings to all active users"""
        try:
            import httpx
            
            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()
            
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{SUPABASE_URL}/rest/v1/users?select=phone,name,gender,monthly_income", headers=headers)
                if resp.status_code != 200:
                    return
                
                users = resp.json()
                for user in users:
                    phone = user.get("phone", "")
                    name = user.get("name", "Friend")
                    gender = user.get("gender", "")
                    if not phone:
                        continue
                    
                    # Gender-aware short greeting
                    tag = ""
                    if gender == "male":
                        tag = " bro"
                    elif gender == "female":
                        tag = " sis"
                    
                    if briefing_type == "morning":
                        msg = f"☀️ Morning{tag}! Ready to track today?\nJust text: \"200 chai\" 🔥"
                    else:
                        msg = f"🌙 Hey {name}! Log any remaining expenses.\nGood night{tag}! 💤"
                    
                    self._send_whatsapp(phone, msg)
        except:
            pass
    
    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
