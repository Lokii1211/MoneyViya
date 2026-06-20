"""
Viya — WhatsApp Cloud API Webhook
==================================
Vercel Serverless: api/whatsapp.py → /api/whatsapp
Meta Cloud API webhook for receiving and sending messages.
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Meta webhook verification (GET request from Meta)"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            mode = params.get("hub.mode", [None])[0]
            token = params.get("hub.verify_token", [None])[0]
            challenge = params.get("hub.challenge", [None])[0]

            if mode == "subscribe" and token == VERIFY_TOKEN:
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(challenge).encode())
            else:
                self._respond(403, {"error": "Verification failed"})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_POST(self):
        """Handle incoming WhatsApp messages via Meta Cloud API"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}

            entry = data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            if not messages:
                self._respond(200, {"status": "ok"})
                return

            msg = messages[0]
            from_phone = msg.get("from", "")
            msg_type = msg.get("type", "text")

            if msg_type == "text":
                text = msg.get("text", {}).get("body", "")
            elif msg_type == "interactive":
                interactive = msg.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    text = interactive.get("button_reply", {}).get("title", "")
                elif interactive.get("type") == "list_reply":
                    text = interactive.get("list_reply", {}).get("title", "")
                else:
                    text = "[interactive]"
            elif msg_type == "image":
                text = msg.get("image", {}).get("caption", "") or "[image]"
            elif msg_type == "audio":
                text = "[voice_note]"
            else:
                text = f"[{msg_type}]"

            print(f"[WA] From: {from_phone}, Type: {msg_type}, Text: {text[:80]}")

            reply = self._handle_command(from_phone, text)

            if not reply:
                reply = self._process_with_ai(from_phone, text, msg_type)

            self._send_reply(from_phone, reply or "Hey! Got your message. Type *help* to see what I can do!")
            self._respond(200, {"status": "processed"})
        except Exception as e:
            print(f"[WA] Error: {e}")
            self._respond(200, {"status": "ok"})

    def _handle_command(self, phone, text):
        """Handle quick commands that don't need AI"""
        cmd = text.strip().lower()
        if cmd in ('/help', 'help', '/menu', 'menu'):
            return (
                "*Viya Commands:*\n\n"
                "/bal — Balance summary\n"
                "/goals — Goals progress\n"
                "/bills — Upcoming bills\n"
                "/lending — Lending tracker\n"
                "/expense — How to add expense\n\n"
                "_Or just chat naturally — I understand!_"
            )
        elif cmd in ('/bal', '/balance', 'bal', 'balance'):
            return self._quick_balance(phone)
        elif cmd in ('/goals', 'goals'):
            return self._quick_goals(phone)
        elif cmd in ('/bills', 'bills'):
            return self._quick_bills(phone)
        elif cmd in ('/lending', 'lending'):
            return self._quick_lending(phone)
        elif cmd in ('/expense', 'expense'):
            return (
                "*Log an expense:*\n\n"
                "Just type naturally:\n"
                "• _spent 500 on food_\n"
                "• _200 swiggy_\n"
                "• _paid 1500 rent_\n\n"
                "I'll handle the rest!"
            )
        return None

    def _process_with_ai(self, phone, text, msg_type):
        """Process message with AI agent"""
        try:
            from agents.advanced_whatsapp_agent import advanced_agent
            if advanced_agent is not None:
                import httpx
                user_data = {"phone": phone, "name": "Friend"}
                SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
                SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))

                if SUPABASE_URL and SUPABASE_KEY:
                    try:
                        with httpx.Client(timeout=10) as client:
                            short = phone.replace("+", "").replace(" ", "")[-10:]
                            resp = client.get(
                                f"{SUPABASE_URL}/rest/v1/users?phone=eq.{short}&select=*",
                                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                            )
                            if resp.status_code == 200 and resp.json():
                                user_data = resp.json()[0]
                                user_data["phone"] = phone
                    except Exception:
                        pass

                import asyncio
                loop = asyncio.new_event_loop()
                reply = loop.run_until_complete(advanced_agent.process_message(phone, text, user_data))
                loop.close()
                return reply
        except Exception as e:
            print(f"[WA] AI error: {e}")
        return None

    def _send_reply(self, to_phone, message):
        """Send reply via Meta WhatsApp Cloud API"""
        try:
            import httpx
            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            if not token or not phone_id:
                print("[WA] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID")
                return

            clean = to_phone.replace("+", "").replace(" ", "")
            if not clean.startswith("91"):
                clean = "91" + clean

            parts = [message[i:i+4000] for i in range(0, len(message), 4000)]

            with httpx.Client(timeout=10) as client:
                for part in parts:
                    client.post(
                        f"https://graph.facebook.com/v21.0/{phone_id}/messages",
                        json={
                            "messaging_product": "whatsapp",
                            "to": clean,
                            "type": "text",
                            "text": {"body": part}
                        },
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json"
                        }
                    )
        except Exception as e:
            print(f"[WA] Send error: {e}")

    def _supabase_query(self, path):
        """Helper to query Supabase"""
        import httpx
        url = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
        key = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))
        if not url or not key:
            return None
        hdrs = {"apikey": key, "Authorization": f"Bearer {key}"}
        with httpx.Client(timeout=8) as c:
            r = c.get(f"{url}/rest/v1/{path}", headers=hdrs)
            return r.json() if r.status_code == 200 else None

    def _quick_balance(self, phone):
        short = phone.replace("+", "").replace(" ", "")[-10:]
        data = self._supabase_query(f"users?phone=eq.{short}&select=monthly_income,monthly_expenses")
        if data and len(data) > 0:
            u = data[0]
            inc = int(u.get("monthly_income", 0) or 0)
            exp = int(u.get("monthly_expenses", 0) or 0)
            sav = inc - exp
            return (
                f"*Balance Summary*\n\n"
                f"Income: *{inc:,}*\n"
                f"Spent: *{exp:,}*\n"
                f"Saved: *{sav:,}*\n\n"
                f"{'On track!' if sav > 0 else 'Overspending!'}"
            )
        return "Open Viya app for your balance details!"

    def _quick_goals(self, phone):
        short = phone.replace("+", "").replace(" ", "")[-10:]
        goals = self._supabase_query(f"goals?phone=eq.{short}&status=eq.active&select=name,icon,current_amount,target_amount&order=created_at.desc&limit=5")
        if goals and len(goals) > 0:
            lines = ["*Your Goals:*\n"]
            for g in goals:
                cur = int(g.get("current_amount", 0) or 0)
                tgt = int(g.get("target_amount", 1) or 1)
                pct = min(round(cur / tgt * 100), 100)
                bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
                lines.append(f"{g.get('icon', '🎯')} *{g['name']}*\n   {bar} {pct}%\n   {cur:,} / {tgt:,}")
            return "\n".join(lines)
        return "No active goals. Open the app to create one!"

    def _quick_bills(self, phone):
        short = phone.replace("+", "").replace(" ", "")[-10:]
        bills = self._supabase_query(f"bills_and_dues?phone=eq.{short}&status=neq.paid&select=name,amount,due_date&order=due_date.asc&limit=5")
        if bills and len(bills) > 0:
            lines = ["*Upcoming Bills:*\n"]
            for b in bills:
                amt = int(b.get("amount", 0) or 0)
                due = b.get("due_date", "")[:10] if b.get("due_date") else "No date"
                lines.append(f"• *{b['name']}* — {amt:,} (due {due})")
            return "\n".join(lines)
        return "No pending bills!"

    def _quick_lending(self, phone):
        short = phone.replace("+", "").replace(" ", "")[-10:]
        items = self._supabase_query(f"lending?user_phone=eq.{short}&status=eq.pending&select=type,person_name,amount&order=created_at.desc&limit=8")
        if items and len(items) > 0:
            given = [i for i in items if i["type"] == "given"]
            taken = [i for i in items if i["type"] == "taken"]
            lines = ["*Lending Summary:*\n"]
            if given:
                lines.append(f"Given: {sum(int(i.get('amount', 0)) for i in given):,} ({len(given)} people)")
            if taken:
                lines.append(f"Taken: {sum(int(i.get('amount', 0)) for i in taken):,} ({len(taken)} people)")
            lines.append("")
            for i in items[:5]:
                arrow = "→" if i["type"] == "given" else "←"
                lines.append(f"{arrow} {i['person_name']} — {int(i.get('amount', 0)):,}")
            return "\n".join(lines)
        return "No pending lendings! Open the app to add one."

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
