"""
Viya — WhatsApp Cloud API Webhook
==================================
Vercel Serverless: api/whatsapp.py → /api/whatsapp

Real AI agent powered by Groq LLaMA 3.3 70B.
WhatsApp messages SYNC with the Viya app — actions execute in real Supabase.

Examples:
  "completed workout"  → marks habit checkin (reflects in app instantly)
  "spent 500 on food"  → logs expense (shows in Expenses page)
  "remind me at 10am to call mom" → creates reminder (shows in Reminders page)
"""

import os
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import _rag

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "viya_verify_2026").strip()
WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()

_NOW = datetime.now()
TODAY = _NOW.strftime("%Y-%m-%d")
TOMORROW = (_NOW + timedelta(days=1)).strftime("%Y-%m-%d")

WA_SYSTEM_PROMPT = f"""You are Viya — an AI second brain and personal life assistant for Indian users via WhatsApp.
You're like a warm, brilliant best friend: part CA, part life coach, part therapist.

TODAY: {TODAY} | TOMORROW: {TOMORROW}

╔══ ACTION SYSTEM ══╗
This is real language UNDERSTANDING, not keyword matching. People text
casually — "swiggy took 500 off me", "just finished my run", "300 gone
on chai n snacks" all carry clear intent even though they don't match any
fixed phrase. Understand the MEANING, not the exact words. If genuinely
ambiguous, ask a quick clarifying question instead of guessing.

When user wants you to DO something, output ACTION lines at the start (before message text):

ACTION:LOG_EXPENSE:amount:category:note
ACTION:LOG_INCOME:amount:source
ACTION:CREATE_REMINDER:title:HH:MM:YYYY-MM-DD
ACTION:MARK_HABIT:keyword
ACTION:CREATE_HABIT:name:emoji
ACTION:CREATE_GOAL:name:target:YYYY-MM-DD
ACTION:LOG_HEALTH:steps:water_glasses:weight_kg
ACTION:REMEMBER:key:value

Kinds of intent to recognize (any natural phrasing counts):
Spent money → LOG_EXPENSE | Got paid → LOG_INCOME | Wants a future nudge → CREATE_REMINDER
Did a habit (match against their real habit list in context even if worded differently) → MARK_HABIT
Wants to start a new habit → CREATE_HABIT | Wants to save toward something → CREATE_GOAL
Mentions a fact worth remembering → REMEMBER

EXAMPLES (format only — vary your actual reply wording each time, don't recite these):
User: just finished my run
→ ACTION:MARK_HABIT:run
Nice one 🔥 running's marked done, streak's alive

User: remind tomorrow 10am call mom
→ ACTION:CREATE_REMINDER:Call mom:10:00:{TOMORROW}
Got it — 10am tomorrow, call mom 🔔

User: chai and snacks set me back 300
→ ACTION:LOG_EXPENSE:300:Food:chai and snacks
₹300 logged for chai/snacks. Check the app for the full picture.

LANGUAGE: Reply in the same language/script the user just texted in — Tamil script for Tamil, Tanglish for Tamil-in-Latin-letters, Hindi/Devanagari for Hindi, Hinglish for Hindi-in-Latin-letters, Kannada/Telugu/Malayalam/Bengali/Marathi the same way, English for English. Mirror them, don't default to English. ₹ amounts and category names can stay as-is mid-sentence.

WHATSAPP STYLE:
• Keep it SHORT — 1-2 lines for action confirmations, max 4-5 lines even for info replies. Only go longer if they ask you to explain/elaborate.
• Use WhatsApp bold: *bold text*
• Be warm, not chatty — skip filler and unnecessary closing questions
• Mention "your app" only when it's genuinely useful, not every message
• Indian format: ₹1,50,000

USER CONTEXT:
{{context}}"""


# ── Supabase helpers ──────────────────────────────────────────────────────────

def _hdr(extra=None):
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
    if extra: h.update(extra)
    return h


def sb_get(path):
    if not SUPABASE_URL or not SUPABASE_KEY: return []
    try:
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=_hdr())
        with urllib.request.urlopen(req, timeout=7) as r:
            return json.loads(r.read()) or []
    except Exception as e:
        print(f"[SB GET] {e}"); return []


def sb_post(table, data, upsert=False):
    if not SUPABASE_URL or not SUPABASE_KEY: return None
    extra = {"Prefer": "return=representation,resolution=merge-duplicates"} if upsert else None
    try:
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{table}", data=json.dumps(data).encode(), headers=_hdr(extra), method="POST")
        with urllib.request.urlopen(req, timeout=7) as r:
            res = json.loads(r.read())
            return res[0] if isinstance(res, list) else res
    except Exception as e:
        print(f"[SB POST] {table}: {e}"); return None


def sb_patch(table, filt, data):
    if not SUPABASE_URL or not SUPABASE_KEY: return None
    try:
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{table}?{filt}", data=json.dumps(data).encode(), headers=_hdr(), method="PATCH")
        with urllib.request.urlopen(req, timeout=7) as r:
            res = json.loads(r.read())
            return res[0] if isinstance(res, list) else res
    except Exception as e:
        print(f"[SB PATCH] {e}"); return None


def norm_phone(phone):
    c = re.sub(r"[^\d]", "", phone or "")
    if c.startswith("91") and len(c) > 10: c = c[2:]
    return c[-10:] if c else ""


# ── Context builder ───────────────────────────────────────────────────────────

def get_context(phone, message=None):
    short = norm_phone(phone)
    if not short: return "New user."
    ctx = []
    try:
        users = sb_get(f"users?phone=eq.{short}&select=name,monthly_income,daily_budget")
        if users:
            u = users[0]
            ctx.append(f"Name: {u.get('name','User')} | Budget: ₹{u.get('daily_budget',1000)}/day")
        habits = sb_get(f"habits?phone=eq.{short}&select=name,icon,current_streak&order=current_streak.desc&limit=6")
        if habits:
            ctx.append("Habits: " + ", ".join(f"{h.get('icon','')}{h.get('name','')}({h.get('current_streak',0)}d)" for h in habits))
        checkins = sb_get(f"habit_checkins?phone=eq.{short}&checked_date=eq.{TODAY}&select=habit_id")
        if habits:
            ctx.append(f"Done today: {len(checkins)}/{len(habits)}")
        recent_health = sb_get(f"health_logs?phone=eq.{short}&select=log_date,steps,water_glasses,sleep_hours,mood&order=log_date.desc&limit=1")
        if recent_health:
            h = recent_health[0]
            ctx.append(f"Latest health: {h.get('steps',0)} steps, {h.get('water_glasses',0)} glasses water, {h.get('sleep_hours',0)}h sleep, mood {h.get('mood','')}")
        txns = sb_get(f"transactions?phone=eq.{short}&select=id,type,amount,category&order=created_at.desc&limit=3")
        if txns:
            ctx.append("Recent: " + ", ".join(f"₹{t.get('amount',0)} {t.get('category','')}" for t in txns))
        goals = sb_get(f"goals?phone=eq.{short}&status=eq.active&select=id,name,current_amount,target_amount&limit=3")
        if goals:
            ctx.append("Goals: " + ", ".join(f"{g.get('name','')} ₹{g.get('current_amount',0)}/₹{g.get('target_amount',0)}" for g in goals))
            kg = _rag.format_kg(_rag.kg_walk(short, f"goal:{goals[0].get('id')}", limit=1))
            if kg:
                ctx.append(f"Why '{goals[0].get('name','')}' may be stuck: " + "; ".join(kg))
        memories = sb_get(f"viya_memory?phone=eq.{short}&select=content&order=importance.desc&limit=3")
        if memories:
            ctx.append("Know: " + " | ".join(m.get('content','') for m in memories))

        # Hybrid retrieval (BM25 + vector) — same retriever chat.py uses, see
        # docs/AI_AGENTS_RAG_PRD.md. Degrades to lexical-only without OPENAI_API_KEY.
        if message:
            recent_ids = {t.get("id") for t in txns}
            related_txns = _rag.format_matches("transactions", _rag.hybrid_search(short, message, "transactions", limit=2, exclude_ids=recent_ids))
            if related_txns:
                ctx.append("Relevant past: " + " | ".join(related_txns))
            related_news = _rag.format_news(_rag.news_search(message, limit=1))
            if related_news:
                ctx.append("News: " + " | ".join(related_news))
    except Exception as e:
        ctx.append(f"(error: {e})")
    return "\n".join(ctx) or "No data."


# ── Action executor (same logic as chat.py) ───────────────────────────────────

def execute_actions(action_lines, phone):
    short = norm_phone(phone)
    if not short: return []
    executed = []
    for raw_line in action_lines:
        line = raw_line.strip()
        if not line.startswith("ACTION:"): continue
        parts = line[7:].split(":")
        if not parts: continue
        atype = parts[0].upper()
        try:
            if atype == "LOG_EXPENSE" and len(parts) >= 4:
                sb_post("transactions", {"phone": short, "type": "expense", "amount": float(parts[1]), "category": parts[2], "description": ":".join(parts[3:])})
                executed.append({"type": "expense", "amount": float(parts[1])})

            elif atype == "LOG_INCOME" and len(parts) >= 3:
                sb_post("transactions", {"phone": short, "type": "income", "amount": float(parts[1]), "category": ":".join(parts[2:]), "description": ":".join(parts[2:])})
                executed.append({"type": "income", "amount": float(parts[1])})

            elif atype == "CREATE_REMINDER" and len(parts) >= 5:
                date_str = parts[4] if re.match(r"\d{4}-\d{2}-\d{2}", parts[4]) else TODAY
                sb_post("user_reminders", {"phone": short, "title": parts[1], "time": f"{parts[2].zfill(2)}:{parts[3].zfill(2)}", "reminder_date": date_str, "is_active": True, "source": "whatsapp"})
                executed.append({"type": "reminder", "title": parts[1]})

            elif atype == "MARK_HABIT" and len(parts) >= 2:
                keyword = ":".join(parts[1:]).lower().strip()
                habits = sb_get(f"habits?phone=eq.{short}&select=id,name,current_streak,longest_streak")
                kwords = [w for w in keyword.split() if len(w) > 2]
                for h in (habits or []):
                    hname = (h.get("name") or "").lower()
                    if keyword in hname or any(w in hname for w in kwords) or any(w in keyword for w in hname.split() if len(w) > 2):
                        existing = sb_get(f"habit_checkins?habit_id=eq.{h['id']}&checked_date=eq.{TODAY}&select=id")
                        if not existing:
                            sb_post("habit_checkins", {"habit_id": h["id"], "phone": short, "checked_date": TODAY, "status": "done"})
                            yest = (_NOW - timedelta(days=1)).strftime("%Y-%m-%d")
                            prev = sb_get(f"habit_checkins?habit_id=eq.{h['id']}&checked_date=eq.{yest}&select=id")
                            new_streak = (h.get("current_streak") or 0) + 1 if prev else 1
                            longest = max(new_streak, h.get("longest_streak") or 0)
                            sb_patch("habits", f"id=eq.{h['id']}", {"current_streak": new_streak, "longest_streak": longest, "last_completed": TODAY})
                            executed.append({"type": "habit", "name": h["name"], "streak": new_streak})
                        else:
                            executed.append({"type": "habit_already", "name": h["name"]})
                        break

            elif atype == "CREATE_GOAL" and len(parts) >= 4:
                deadline = parts[3] if re.match(r"\d{4}-\d{2}-\d{2}", parts[3]) else "2025-12-31"
                sb_post("goals", {"phone": short, "name": parts[1], "icon": "🎯", "target_amount": float(parts[2]), "current_amount": 0, "deadline": deadline, "status": "active", "priority": "medium"})
                executed.append({"type": "goal", "name": parts[1]})

            elif atype == "CREATE_HABIT" and len(parts) >= 3:
                sb_post("habits", {"phone": short, "name": parts[1], "icon": parts[2] if len(parts) > 2 else "✅", "frequency": "daily", "current_streak": 0, "longest_streak": 0})
                executed.append({"type": "new_habit", "name": parts[1]})

            elif atype == "LOG_HEALTH" and len(parts) >= 4:
                data = {"phone": short, "log_date": TODAY}
                if parts[1] and parts[1] != "0": data["steps"] = int(parts[1])
                if parts[2] and parts[2] != "0": data["water_glasses"] = int(parts[2])
                if parts[3] and parts[3] not in ("0", ""): data["weight"] = float(parts[3])
                sb_post("health_logs", data, upsert=True)
                executed.append({"type": "health"})

            elif atype == "REMEMBER" and len(parts) >= 3:
                sb_post("viya_memory", {"phone": short, "content": f"{parts[1]}: {':'.join(parts[2:])}", "memory_type": "fact", "category": "personal", "importance": 7})
                executed.append({"type": "memory"})

        except Exception as e:
            print(f"[WA ACTION] {atype}: {e}")

    # Save to chat_history for app sync
    try:
        sb_post("chat_history", {"phone": short, "role": "system", "content": f"WhatsApp: {len(executed)} action(s) executed", "source": "whatsapp"})
    except Exception:
        pass

    return executed


# ── Groq AI call ──────────────────────────────────────────────────────────────

def call_groq_wa(phone, text, wa_history=None):
    if not GROQ_API_KEY:
        return "Hi! I'm Viya. I need my AI key to respond fully. Please ask your admin to add GROQ_API_KEY. Meanwhile, try /bal /goals /bills /help"

    context = get_context(phone, text)
    system = WA_SYSTEM_PROMPT.replace("{context}", context)

    msgs = [{"role": "system", "content": system}]
    for h in (wa_history or [])[-4:]:
        msgs.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    msgs.append({"role": "user", "content": text})

    payload = json.dumps({"model": "llama-3.3-70b-versatile", "messages": msgs, "temperature": 0.8, "max_tokens": 400}).encode()
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            # Cloudflare (fronting Groq's API) blocks the bare
            # "Python-urllib/3.x" default User-Agent as bot traffic.
            "User-Agent": "Mozilla/5.0 (compatible; MoneyViya/1.0; +https://heyviya.vercel.app)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read())
            raw = data["choices"][0]["message"]["content"]
            # Parse and execute actions
            lines = raw.split("\n")
            action_lines = [l.strip() for l in lines if l.strip().startswith("ACTION:")]
            clean_lines = [l for l in lines if not l.strip().startswith("ACTION:")]
            if action_lines:
                execute_actions(action_lines, phone)
            return "\n".join(clean_lines).strip()
    except Exception as e:
        print(f"[WA GROQ] {e}")
        return "Oops! Technical issue. Try again in a bit. Type *help* for quick commands."


# ── Quick commands (no AI needed) ─────────────────────────────────────────────

def quick_balance(phone):
    short = norm_phone(phone)
    data = sb_get(f"users?phone=eq.{short}&select=monthly_income,monthly_expenses,daily_budget")
    if data:
        u = data[0]
        inc = int(u.get("monthly_income", 0) or 0)
        exp = int(u.get("monthly_expenses", 0) or 0)
        budget = int(u.get("daily_budget", 1000) or 1000)
        sav = inc - exp
        return f"*💰 Balance Summary*\n\nMonthly Income: *₹{inc:,}*\nSpent: *₹{exp:,}*\nSaved: *₹{sav:,}*\nDaily Budget: *₹{budget:,}*\n\n{'✅ On track!' if sav > 0 else '⚠️ Overspending!'}\n\n_Open Viya app for full details →_"
    return "Open the Viya app for your balance! 📱"


def quick_goals(phone):
    short = norm_phone(phone)
    goals = sb_get(f"goals?phone=eq.{short}&status=eq.active&select=name,icon,current_amount,target_amount&order=created_at.desc&limit=5")
    if goals:
        lines = ["*🎯 Your Goals:*\n"]
        for g in goals:
            cur, tgt = int(g.get("current_amount", 0) or 0), int(g.get("target_amount", 1) or 1)
            pct = min(round(cur / tgt * 100), 100)
            bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
            lines.append(f"{g.get('icon','🎯')} *{g['name']}*\n{bar} {pct}%\n₹{cur:,} / ₹{tgt:,}\n")
        return "\n".join(lines)
    return "No active goals yet! Tell me to create one:\n_\"create goal Goa trip 50000\"_"


def quick_bills(phone):
    short = norm_phone(phone)
    bills = sb_get(f"bills_and_dues?phone=eq.{short}&status=neq.paid&select=name,amount,due_date&order=due_date.asc&limit=5")
    if bills:
        lines = ["*🧾 Upcoming Bills:*\n"]
        for b in bills:
            due = b.get("due_date", "")[:10] if b.get("due_date") else "No date"
            lines.append(f"• *{b['name']}* — ₹{int(b.get('amount', 0) or 0):,} (due {due})")
        return "\n".join(lines)
    return "No pending bills! 🎉"


def quick_habits(phone):
    short = norm_phone(phone)
    habits = sb_get(f"habits?phone=eq.{short}&select=name,icon,current_streak&order=current_streak.desc&limit=8")
    checkins = sb_get(f"habit_checkins?phone=eq.{short}&checked_date=eq.{TODAY}&select=habit_id")
    done_ids = {c["habit_id"] for c in checkins}
    if habits:
        lines = [f"*✅ Habits — {len(done_ids)}/{len(habits)} done today*\n"]
        for h in habits:
            done = "✅" if h.get("id") in done_ids else "⬜"
            lines.append(f"{done} {h.get('icon','')}{h.get('name','')} — 🔥{h.get('current_streak',0)} days")
        return "\n".join(lines)
    return "No habits yet! Tell me:\n_\"add habit morning run\"_"


def quick_lending(phone):
    short = norm_phone(phone)
    items = sb_get(f"lending?user_phone=eq.{short}&status=eq.pending&select=type,person_name,amount&order=created_at.desc&limit=8")
    if items:
        given = [i for i in items if i.get("type") == "given"]
        taken = [i for i in items if i.get("type") == "taken"]
        lines = ["*💸 Lending Summary:*\n"]
        if given: lines.append(f"You gave: *₹{sum(int(i.get('amount',0)) for i in given):,}* to {len(given)} people")
        if taken: lines.append(f"You took: *₹{sum(int(i.get('amount',0)) for i in taken):,}* from {len(taken)} people")
        lines.append("")
        for i in items[:5]:
            arrow = "→" if i.get("type") == "given" else "←"
            lines.append(f"{arrow} {i['person_name']} — ₹{int(i.get('amount',0)):,}")
        return "\n".join(lines)
    return "No pending lendings! 🎉"


def get_wa_history(phone):
    short = norm_phone(phone)
    if not short: return []
    rows = sb_get(f"chat_history?phone=eq.{short}&source=eq.whatsapp&select=role,content&order=created_at.desc&limit=6")
    return list(reversed(rows or []))


def save_wa_message(phone, role, content):
    short = norm_phone(phone)
    if short:
        sb_post("chat_history", {"phone": short, "role": role, "content": content, "source": "whatsapp"})


# ── OTP login (WhatsApp-delivered) ─────────────────────────────────────────────
# Reuses this function's existing WhatsApp send capability instead of adding
# a new serverless function — Vercel Hobby caps deployments at 12 functions.

import random


def _generate_otp():
    return f"{random.randint(0, 999999):06d}"


# ── HTTP handler ──────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        action = params.get("action", [None])[0]

        if action == "send_otp":
            self._handle_send_otp(params.get("phone", [""])[0])
            return
        if action == "verify_otp":
            self._handle_verify_otp(params.get("phone", [""])[0], params.get("otp", [""])[0])
            return

        # Meta webhook verification handshake
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

    def _handle_send_otp(self, phone):
        short = norm_phone(phone)
        if not short:
            self._respond(200, {"success": False, "message": "Enter a valid 10-digit number"})
            return
        if not WHATSAPP_TOKEN or not PHONE_ID:
            self._respond(200, {"success": False, "message": "WhatsApp isn't configured yet — use password login instead"})
            return
        code = _generate_otp()
        expires = (datetime.now() + timedelta(minutes=5)).isoformat()
        # Upsert: OTP can be requested by a brand-new phone that has no user row yet
        existing = sb_get(f"users?phone=eq.{short}&select=phone")
        if existing:
            sb_patch("users", f"phone=eq.{short}", {"otp_code": code, "otp_expires_at": expires})
        else:
            sb_post("users", {"phone": short, "otp_code": code, "otp_expires_at": expires})
        sent = self._send_wa_message(short, f"🔐 Your Viya login code: *{code}*\n\nExpires in 5 minutes. Don't share this with anyone.")
        if sent:
            self._respond(200, {"success": True})
        else:
            self._respond(200, {"success": False, "message": "Couldn't send WhatsApp message — message us on WhatsApp first, then retry"})

    def _handle_verify_otp(self, phone, otp):
        short = norm_phone(phone)
        if not short or not otp:
            self._respond(200, {"success": False, "message": "Missing phone or code"})
            return
        rows = sb_get(f"users?phone=eq.{short}&select=otp_code,otp_expires_at")
        if not rows:
            self._respond(200, {"success": False, "message": "No OTP requested for this number"})
            return
        user = rows[0]
        stored_code = user.get("otp_code") or ""
        expires_at = user.get("otp_expires_at") or ""
        if not stored_code or stored_code != otp.strip():
            self._respond(200, {"success": False, "message": "Invalid code"})
            return
        try:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00")) if expires_at else None
            now = datetime.now(expiry.tzinfo) if expiry and expiry.tzinfo else datetime.now()
            if expiry and now > expiry:
                self._respond(200, {"success": False, "message": "Code expired — request a new one"})
                return
        except Exception:
            pass  # if the timestamp is unparseable, don't block on it
        # Single-use — clear it once verified
        sb_patch("users", f"phone=eq.{short}", {"otp_code": None, "otp_expires_at": None})
        self._respond(200, {"success": True})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n)) if n else {}

            entry = body.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            if not messages:
                self._respond(200, {"status": "ok"}); return

            msg = messages[0]
            from_phone = msg.get("from", "")
            msg_type = msg.get("type", "text")

            if msg_type == "text":
                text = msg.get("text", {}).get("body", "")
            elif msg_type == "interactive":
                iv = msg.get("interactive", {})
                text = iv.get("button_reply", {}).get("title") or iv.get("list_reply", {}).get("title") or "[interactive]"
            elif msg_type == "image":
                text = msg.get("image", {}).get("caption", "") or "[image]"
            elif msg_type == "audio":
                text = "[voice_note]"
            else:
                text = f"[{msg_type}]"

            print(f"[WA] {from_phone}: {text[:80]}")

            # Save user message
            save_wa_message(from_phone, "user", text)

            # Quick commands
            cmd = text.strip().lower()
            reply = None
            if cmd in ("/help", "help", "/menu", "menu", "hi", "hello"):
                reply = (
                    "*👋 Hi! I'm Viya — your AI second brain.*\n\n"
                    "*Quick commands:*\n"
                    "/bal — Balance\n"
                    "/habits — Habit tracker\n"
                    "/goals — Goals\n"
                    "/bills — Upcoming bills\n"
                    "/lending — Money tracker\n\n"
                    "*Or just chat naturally:*\n"
                    "• _\"spent 500 on food\"_\n"
                    "• _\"done with workout\"_\n"
                    "• _\"remind me at 9pm to study\"_\n"
                    "• _\"create goal Goa trip 50000\"_\n\n"
                    "_Everything syncs with your Viya app! 📱_"
                )
            elif cmd in ("/bal", "/balance", "bal", "balance"):
                reply = quick_balance(from_phone)
            elif cmd in ("/goals", "goals"):
                reply = quick_goals(from_phone)
            elif cmd in ("/bills", "bills"):
                reply = quick_bills(from_phone)
            elif cmd in ("/habits", "habits"):
                reply = quick_habits(from_phone)
            elif cmd in ("/lending", "lending"):
                reply = quick_lending(from_phone)
            else:
                # Full AI with action execution
                history = get_wa_history(from_phone)
                reply = call_groq_wa(from_phone, text, history)

            if reply:
                save_wa_message(from_phone, "assistant", reply)
                self._send_wa_message(from_phone, reply)

            self._respond(200, {"status": "processed"})
        except Exception as e:
            print(f"[WA] Error: {e}")
            self._respond(200, {"status": "ok"})

    def _send_wa_message(self, to_phone, message):
        if not WHATSAPP_TOKEN or not PHONE_ID:
            print("[WA] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID")
            return
        clean = re.sub(r"[^\d]", "", to_phone)
        if not clean.startswith("91"):
            clean = "91" + clean
        # Split long messages
        parts = [message[i:i+4000] for i in range(0, len(message), 4000)]
        for part in parts:
            try:
                req = urllib.request.Request(
                    f"https://graph.facebook.com/v21.0/{PHONE_ID}/messages",
                    data=json.dumps({"messaging_product": "whatsapp", "to": clean, "type": "text", "text": {"body": part}}).encode(),
                    headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=10) as r:
                    r.read()
            except Exception as e:
                print(f"[WA SEND] {e}")

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, fmt, *args):
        print(f"[WA] {fmt % args}")
