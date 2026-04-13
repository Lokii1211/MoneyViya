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


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Check and fire due reminders every minute"""
        try:
            import httpx
            
            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            
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
                            if rem.get("month_date", 1) == current_date:
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
                        
                        # Send via WhatsApp
                        msg = f"{icon} *Reminder: {title}*\n"
                        if desc:
                            msg += f"📝 {desc}\n"
                        msg += f"⏰ {current_time} IST"
                        
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
            
            # Also check for morning/evening briefings
            if current_time == "08:00":
                results["briefing"] = "morning"
                self._send_briefings("morning")
            elif current_time == "21:00":
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
            
            SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{SUPABASE_URL}/rest/v1/users?select=phone,name,monthly_income", headers=headers)
                if resp.status_code != 200:
                    return
                
                users = resp.json()
                for user in users:
                    phone = user.get("phone", "")
                    name = user.get("name", "Friend")
                    if not phone:
                        continue
                    
                    if briefing_type == "morning":
                        msg = f"☀️ Good morning {name}!\n\nReady to track your expenses today? Just send me what you spend.\n\n💡 Tip: \"200 chai\" or \"500 lunch\" — I understand!\n\n🔥 Keep your streak alive!"
                    else:
                        msg = f"🌙 Evening check-in, {name}!\n\nHow was your spending today? Send me any expenses you haven't logged.\n\n📊 I'll have your daily summary ready!\n\nGood night 💤"
                    
                    self._send_whatsapp(phone, msg)
        except:
            pass
    
    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
