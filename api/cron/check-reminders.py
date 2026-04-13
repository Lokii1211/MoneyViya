"""
MoneyViya Cron — Check user reminders and send WhatsApp messages
================================================================
This runs as a Vercel Cron job every hour to check for due reminders.
"""

import sys
import os
import json
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Check and send due reminders via WhatsApp"""
        try:
            # Verify cron secret (Vercel sends this header)
            auth = self.headers.get('Authorization', '')
            cron_secret = os.getenv('CRON_SECRET', '')
            
            # Allow if no secret set (dev) or if it matches
            if cron_secret and auth != f'Bearer {cron_secret}':
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b'Unauthorized')
                return
            
            now = datetime.now()
            current_hour = now.hour
            results = {"time": now.isoformat(), "sent": 0, "errors": []}
            
            # Import WhatsApp service
            try:
                from app import whatsapp_cloud_service, user_repo, advanced_agent
                
                if not whatsapp_cloud_service.is_available():
                    results["errors"].append("WhatsApp not configured")
                else:
                    users = user_repo.get_all_users()
                    
                    for user in users:
                        if not user.get("onboarding_complete"):
                            continue
                        
                        phone = user.get("phone", "").replace("+", "")
                        name = user.get("name", "Friend")
                        
                        try:
                            # Morning briefing at 8 AM IST
                            if current_hour == 8:
                                if advanced_agent:
                                    msg = advanced_agent.generate_morning_reminder(user)
                                else:
                                    msg = f"☀️ Good morning {name}! Ready to track your expenses today? Reply with your first expense."
                                whatsapp_cloud_service.send_text_message(phone, msg)
                                results["sent"] += 1
                            
                            # Evening check-in at 9 PM IST
                            elif current_hour == 21:
                                if advanced_agent:
                                    msg = advanced_agent.generate_evening_checkout(user)
                                else:
                                    msg = f"🌙 Good evening {name}! How was your spending today? Send me your expenses to stay on track."
                                whatsapp_cloud_service.send_text_message(phone, msg)
                                results["sent"] += 1
                        
                        except Exception as e:
                            results["errors"].append(f"{phone}: {str(e)}")
                
            except ImportError as e:
                results["errors"].append(f"Import error: {str(e)}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
