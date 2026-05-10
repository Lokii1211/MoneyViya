"""
Viya V3 — Gamification XP API
================================
POST /api/gamification/xp — Award XP to users
GET /api/gamification/xp?phone=xxx — Get user XP
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

LEVEL_THRESHOLDS = [0, 500, 1000, 2000, 4000, 8000, 15000]
LEVEL_NAMES = ["Beginner", "Saver", "Planner", "Investor", "Master", "Legend", "Mythic"]

XP_REWARDS = {
    "log_expense": 5,
    "complete_habit": 10,
    "daily_login": 3,
    "journal_entry": 8,
    "medicine_taken": 5,
    "sleep_logged": 5,
    "meal_logged": 3,
    "budget_under": 50,
    "streak_milestone_7": 25,
    "streak_milestone_30": 100,
    "challenge_complete": 50,
    "first_split": 15,
    "email_connected": 20,
    "whatsapp_expense": 7,
}


def calculate_level(total_xp):
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            level = i + 1
    return min(level, len(LEVEL_NAMES))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get user XP and level"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            phone = params.get("phone", [None])[0]
            
            if not phone:
                self._respond(400, {"error": "phone parameter required"})
                return
            
            xp_data = self._get_xp(phone)
            if xp_data:
                level = calculate_level(xp_data["total_xp"])
                xp_data["level"] = level
                xp_data["level_name"] = LEVEL_NAMES[level - 1]
                xp_data["next_level_xp"] = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
                self._respond(200, xp_data)
            else:
                self._respond(200, {
                    "phone": phone, "total_xp": 0, "level": 1,
                    "level_name": "Beginner", "current_streak": 0,
                    "next_level_xp": 500, "badges": [],
                })
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_POST(self):
        """Award XP to a user"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            phone = data.get("phone", "")
            action = data.get("action", "")
            custom_xp = data.get("xp", None)
            
            if not phone or not action:
                self._respond(400, {"error": "phone and action required"})
                return
            
            xp_amount = custom_xp if custom_xp else XP_REWARDS.get(action, 5)
            
            # Get or create user XP record
            current = self._get_xp(phone)
            if current:
                new_total = current["total_xp"] + xp_amount
                new_level = calculate_level(new_total)
                old_level = calculate_level(current["total_xp"])
                level_up = new_level > old_level
                
                self._update_xp(phone, new_total, new_level)
                
                self._respond(200, {
                    "status": "ok",
                    "xp_awarded": xp_amount,
                    "total_xp": new_total,
                    "level": new_level,
                    "level_name": LEVEL_NAMES[new_level - 1],
                    "level_up": level_up,
                    "action": action,
                })
            else:
                self._create_xp(phone, xp_amount)
                self._respond(200, {
                    "status": "ok",
                    "xp_awarded": xp_amount,
                    "total_xp": xp_amount,
                    "level": 1,
                    "level_name": "Beginner",
                    "level_up": False,
                    "action": action,
                })
        except Exception as e:
            self._respond(500, {"error": str(e)})

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

    def _update_xp(self, phone, total_xp, level):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                client.patch(
                    f"{SUPABASE_URL}/rest/v1/user_xp?phone=eq.{phone}",
                    json={"total_xp": total_xp, "level": level, "last_active": datetime.now().strftime("%Y-%m-%d"), "updated_at": datetime.now().isoformat()},
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
                )
        except:
            pass

    def _create_xp(self, phone, xp):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                client.post(
                    f"{SUPABASE_URL}/rest/v1/user_xp",
                    json={"phone": phone, "total_xp": xp, "level": 1, "current_streak": 0},
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
                )
        except:
            pass

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
