"""
Viya V3 — Leaderboard API
============================
GET /api/gamification/leaderboard — Global + friend leaderboard
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

LEVEL_NAMES = ["Beginner", "Saver", "Planner", "Investor", "Master", "Legend", "Mythic"]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get leaderboard"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            phone = params.get("phone", [None])[0]
            limit = int(params.get("limit", [20])[0])
            
            leaderboard = self._get_leaderboard(limit)
            
            # Find user's rank
            user_rank = None
            if phone:
                for i, entry in enumerate(leaderboard):
                    if entry.get("phone") == phone:
                        user_rank = i + 1
                        break
            
            self._respond(200, {
                "leaderboard": leaderboard,
                "user_rank": user_rank,
                "total_users": len(leaderboard),
            })
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _get_leaderboard(self, limit=20):
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{SUPABASE_URL}/rest/v1/user_xp?select=phone,total_xp,level,current_streak,badges&order=total_xp.desc&limit={limit}",
                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                )
                if resp.status_code == 200:
                    entries = resp.json()
                    # Enrich with user names
                    for i, entry in enumerate(entries):
                        entry["rank"] = i + 1
                        entry["level_name"] = LEVEL_NAMES[min(entry.get("level", 1), len(LEVEL_NAMES)) - 1]
                        # Get user name
                        try:
                            name_resp = client.get(
                                f"{SUPABASE_URL}/rest/v1/users?phone=eq.{entry['phone']}&select=name",
                                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                            )
                            if name_resp.status_code == 200 and name_resp.json():
                                entry["name"] = name_resp.json()[0].get("name", "User")
                            else:
                                entry["name"] = f"User #{i+1}"
                        except:
                            entry["name"] = f"User #{i+1}"
                    return entries
        except:
            pass
        return []

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
