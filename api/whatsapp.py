"""
Viya V3 — WhatsApp Webhook Handler
====================================
Vercel Serverless: api/whatsapp.py → /api/whatsapp
Meta Callback URL: https://heyviya.vercel.app/api/whatsapp
Upgraded to V3 Agentic Orchestrator
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "heyviya_webhook_2024")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Meta webhook verification"""
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            mode = params.get("hub.mode", [None])[0]
            token = params.get("hub.verify_token", [None])[0]
            challenge = params.get("hub.challenge", [None])[0]
            
            print(f"[WA Verify] mode={mode}, token={token}, challenge={challenge}")
            
            if mode == "subscribe" and token == VERIFY_TOKEN:
                print("[WA Verify] SUCCESS")
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(challenge).encode())
            else:
                print(f"[WA Verify] FAILED - expected: {VERIFY_TOKEN}")
                self._respond(403, {"error": "Verification failed"})
        except Exception as e:
            print(f"[WA Verify] Error: {e}")
            self._respond(500, {"error": str(e)})

    def do_POST(self):
        """Handle incoming WhatsApp messages — V3 Agentic Processing"""
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
            
            # Extract text based on message type
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
                text = "[image]"
                caption = msg.get("image", {}).get("caption", "")
                if caption:
                    text = f"[image] {caption}"
            elif msg_type == "audio":
                text = "[voice_note]"
            elif msg_type == "document":
                text = "[document]"
            elif msg_type == "location":
                text = "[location]"
            else:
                text = f"[{msg_type}]"
            
            print(f"[WA V3] From: {from_phone}, Type: {msg_type}, Text: {text[:80]}")
            
            # Process via V3 Orchestrator
            try:
                reply = None
                
                # ═══ QUICK COMMANDS (instant, no AI needed) ═══
                cmd = text.strip().lower()
                if cmd in ('/help', 'help', '/menu', 'menu'):
                    reply = (
                        "🤖 *Viya Commands:*\n\n"
                        "💰 */bal* — Balance summary\n"
                        "➕ */expense* — Add expense\n"
                        "🎯 */goals* — Goals progress\n"
                        "📋 */brief* — Today's brief\n"
                        "💪 */health* — Health summary\n"
                        "🧾 */bills* — Upcoming bills\n"
                        "💸 */lending* — Lending tracker\n"
                        "📊 */report* — Weekly report\n\n"
                        "_Or just chat naturally — I understand! 🧠_"
                    )
                elif cmd in ('/bal', '/balance', 'bal', 'balance'):
                    reply = self._quick_balance(from_phone)
                elif cmd in ('/goals', 'goals'):
                    reply = self._quick_goals(from_phone)
                elif cmd in ('/bills', 'bills'):
                    reply = self._quick_bills(from_phone)
                elif cmd in ('/lending', 'lending'):
                    reply = self._quick_lending(from_phone)
                elif cmd in ('/brief', 'brief'):
                    reply = "☀️ Opening your daily brief...\n\n_Open the Viya app for full details!_\n\nviya://home"
                elif cmd in ('/health', 'health'):
                    reply = "💪 Opening Health Center...\n\n_Open the Viya app for full details!_\n\nviya://health"
                elif cmd in ('/expense', 'expense'):
                    reply = "➕ *Log an expense:*\n\nJust type naturally:\n• _spent 500 on food_\n• _200 swiggy_\n• _paid 1500 rent_\n\nI'll handle the rest! 🧠"
                elif cmd in ('/report', 'report'):
                    reply = "📊 Opening Weekly Report...\n\n_Open the Viya app for the full report!_\n\nviya://home"
                
                # V3 Orchestrator (if no quick command matched)
                try:
                    from agents.v3_orchestrator import V3Orchestrator
                    orchestrator = V3Orchestrator()
                    
                    import asyncio
                    loop = asyncio.new_event_loop()
                    result = loop.run_until_complete(orchestrator.process(from_phone, text, msg_type))
                    loop.close()
                    
                    reply = result.get("response", "")
                    intent = result.get("intent", "unknown")
                    tier = result.get("tier", "unknown")
                    print(f"[WA V3] Intent={intent}, Tier={tier}")
                except Exception as v3_err:
                    print(f"[WA V3] Orchestrator error: {v3_err}")
                
                # V2 Fallback
                if not reply:
                    try:
                        from agents.v2_orchestrator import V2Orchestrator
                        from agents.advanced_whatsapp_agent import AdvancedWhatsAppAgent
                        
                        base_agent = AdvancedWhatsAppAgent()
                        orchestrator = V2Orchestrator(base_agent=base_agent)
                        
                        import asyncio
                        loop = asyncio.new_event_loop()
                        result = loop.run_until_complete(orchestrator.process(from_phone, text))
                        loop.close()
                        reply = result.get("response", "")
                    except Exception as v2_err:
                        print(f"[WA V2] Fallback error: {v2_err}")
                
                # V1 Fallback
                if not reply:
                    try:
                        import httpx
                        from agents.advanced_whatsapp_agent import AdvancedWhatsAppAgent
                        agent = AdvancedWhatsAppAgent()
                        
                        user_data = {"phone": from_phone, "name": "Friend"}
                        SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
                        SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
                        
                        if SUPABASE_URL and SUPABASE_KEY:
                            with httpx.Client(timeout=10) as client:
                                resp = client.get(
                                    f"{SUPABASE_URL}/rest/v1/users?phone=eq.{from_phone}&select=*",
                                    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                                )
                                if resp.status_code == 200 and resp.json():
                                    user_data = resp.json()[0]
                                    user_data["phone"] = from_phone
                        
                        import asyncio
                        loop = asyncio.new_event_loop()
                        reply = loop.run_until_complete(agent.process_message(from_phone, text, user_data))
                        loop.close()
                    except Exception as v1_err:
                        print(f"[WA V1] Fallback error: {v1_err}")
                
                self._send_reply(from_phone, reply or "Hey! Got your message 🙏\nType *help* to see what I can do!")
            except Exception as e:
                print(f"[WA] Agent error: {e}")
                self._send_reply(from_phone, "Hey! Got your message. Try again shortly 🙏")
            
            self._respond(200, {"status": "processed"})
        except Exception as e:
            print(f"[WA POST] Error: {e}")
            self._respond(200, {"status": "ok"})
    
    def _send_reply(self, to_phone, message):
        """Send reply via WhatsApp Cloud API"""
        try:
            import httpx
            token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            if not token or not phone_id:
                print("[WA Reply] Missing credentials — skipping send")
                return
            clean = to_phone.replace("+", "").replace(" ", "")
            if not clean.startswith("91"):
                clean = "91" + clean
            
            # Split long messages (WhatsApp limit ~4096 chars)
            if len(message) > 4000:
                parts = [message[i:i+4000] for i in range(0, len(message), 4000)]
            else:
                parts = [message]
            
            with httpx.Client(timeout=10) as client:
                for part in parts:
                    client.post(
                        f"https://graph.facebook.com/v21.0/{phone_id}/messages",
                        json={"messaging_product": "whatsapp", "to": clean, "type": "text", "text": {"body": part}},
                        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                    )
        except Exception as e:
            print(f"[WA Reply] Error: {e}")
    
    def _quick_balance(self, phone):
        """Quick balance summary"""
        try:
            import httpx
            url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            key = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            if not url or not key: return "💰 Open the Viya app to see your balance!"
            hdrs = {"apikey": key, "Authorization": f"Bearer {key}"}
            clean = phone.replace("+","").replace(" ","")
            short = clean[-10:]
            with httpx.Client(timeout=8) as c:
                r = c.get(f"{url}/rest/v1/users?phone=eq.{short}&select=monthly_income,monthly_expenses", headers=hdrs)
                if r.status_code == 200 and r.json():
                    u = r.json()[0]
                    inc = int(u.get("monthly_income",0) or 0)
                    exp = int(u.get("monthly_expenses",0) or 0)
                    sav = inc - exp
                    return (f"💰 *Balance Summary*\n\n"
                            f"📥 Income: *₹{inc:,}*\n"
                            f"📤 Spent: *₹{exp:,}*\n"
                            f"💵 Saved: *₹{sav:,}*\n\n"
                            f"{'✅ On track!' if sav > 0 else '⚠️ Overspending!'}")
        except: pass
        return "💰 Open Viya app for your balance details!"

    def _quick_goals(self, phone):
        try:
            import httpx
            url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            key = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            if not url or not key: return "🎯 Open the Viya app to see goals!"
            hdrs = {"apikey": key, "Authorization": f"Bearer {key}"}
            short = phone.replace("+","").replace(" ","")[-10:]
            with httpx.Client(timeout=8) as c:
                r = c.get(f"{url}/rest/v1/goals?phone=eq.{short}&status=eq.active&select=name,icon,current_amount,target_amount&order=created_at.desc&limit=5", headers=hdrs)
                if r.status_code == 200 and r.json():
                    goals = r.json()
                    lines = ["🎯 *Your Goals:*\n"]
                    for g in goals:
                        cur = int(g.get("current_amount",0) or 0)
                        tgt = int(g.get("target_amount",1) or 1)
                        pct = min(round(cur/tgt*100),100)
                        bar = "█" * (pct//10) + "░" * (10-pct//10)
                        lines.append(f"{g.get('icon','🎯')} *{g['name']}*\n   {bar} {pct}%\n   ₹{cur:,} / ₹{tgt:,}")
                    return "\n".join(lines)
        except: pass
        return "🎯 No active goals. Open the app to create one!"

    def _quick_bills(self, phone):
        try:
            import httpx
            url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            key = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            if not url or not key: return "🧾 Open Viya app to see bills!"
            hdrs = {"apikey": key, "Authorization": f"Bearer {key}"}
            short = phone.replace("+","").replace(" ","")[-10:]
            with httpx.Client(timeout=8) as c:
                r = c.get(f"{url}/rest/v1/bills_and_dues?phone=eq.{short}&status=neq.paid&select=name,amount,due_date&order=due_date.asc&limit=5", headers=hdrs)
                if r.status_code == 200 and r.json():
                    bills = r.json()
                    lines = ["🧾 *Upcoming Bills:*\n"]
                    for b in bills:
                        amt = int(b.get("amount",0) or 0)
                        due = b.get("due_date","")[:10] if b.get("due_date") else "No date"
                        lines.append(f"• *{b['name']}* — ₹{amt:,} (due {due})")
                    return "\n".join(lines)
        except: pass
        return "🧾 No pending bills! 🎉"

    def _quick_lending(self, phone):
        try:
            import httpx
            url = os.getenv("VITE_SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
            key = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
            if not url or not key: return "💸 Open Viya app to see lending!"
            hdrs = {"apikey": key, "Authorization": f"Bearer {key}"}
            short = phone.replace("+","").replace(" ","")[-10:]
            with httpx.Client(timeout=8) as c:
                r = c.get(f"{url}/rest/v1/lending?user_phone=eq.{short}&status=eq.pending&select=type,person_name,amount&order=created_at.desc&limit=8", headers=hdrs)
                if r.status_code == 200 and r.json():
                    items = r.json()
                    given = [i for i in items if i["type"]=="given"]
                    taken = [i for i in items if i["type"]=="taken"]
                    given_total = sum(int(i.get("amount",0)) for i in given)
                    taken_total = sum(int(i.get("amount",0)) for i in taken)
                    lines = ["💸 *Lending Summary:*\n"]
                    if given: lines.append(f"📤 *Given:* ₹{given_total:,} ({len(given)} people)")
                    if taken: lines.append(f"📥 *Taken:* ₹{taken_total:,} ({len(taken)} people)")
                    lines.append("")
                    for i in items[:5]:
                        emoji = "📤" if i["type"]=="given" else "📥"
                        lines.append(f"{emoji} {i['person_name']} — ₹{int(i.get('amount',0)):,}")
                    return "\n".join(lines)
        except: pass
        return "💸 No pending lendings! Open the app to add one."

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
