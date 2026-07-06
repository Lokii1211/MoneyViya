"""
Viya AI Action Agent — Groq LLaMA 3.3 70B
==========================================
Real AI second brain that EXECUTES REAL ACTIONS in Supabase:
  "spent 500 on food"  → inserts transaction
  "remind me at 10am" → creates reminder
  "done with workout" → marks habit checkin
  "create goal Goa"   → inserts goal
"""

import os
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))

_NOW = datetime.now()
TODAY = _NOW.strftime("%Y-%m-%d")
TOMORROW = (_NOW + timedelta(days=1)).strftime("%Y-%m-%d")

SYSTEM_PROMPT = f"""You are Viya — an AI second brain and personal life assistant for Indian users. You're like a brilliant, warm best friend who's also a chartered accountant, life coach, and therapist all in one. Speak naturally, warmly, in Hinglish if the vibe matches.

TODAY: {TODAY} | TOMORROW: {TOMORROW}

╔══════════════════════════════════════╗
║   ACTION SYSTEM — READ CAREFULLY     ║
╚══════════════════════════════════════╝
When the user wants you to DO something, output ACTION lines at the VERY START of your response, each on its own line, before any message text.

FORMAT (exact — no spaces around colons):
ACTION:LOG_EXPENSE:amount:category:note
ACTION:LOG_INCOME:amount:source
ACTION:CREATE_REMINDER:title:HH:MM:YYYY-MM-DD
ACTION:MARK_HABIT:keyword
ACTION:CREATE_HABIT:name:emoji
ACTION:CREATE_GOAL:name:target_amount:YYYY-MM-DD
ACTION:LOG_HEALTH:steps:water_glasses:weight_kg
ACTION:REMEMBER:key:value

INTENT → ACTION mapping (learn these):
• "spent/paid/bought X on Y"      → ACTION:LOG_EXPENSE:X:Y:description
• "earned/received/got X"         → ACTION:LOG_INCOME:X:source
• "remind me at TIME to TEXT"     → ACTION:CREATE_REMINDER:TEXT:HH:MM:{TODAY}
• "remind me tomorrow at TIME"    → ACTION:CREATE_REMINDER:TEXT:HH:MM:{TOMORROW}
• "done/completed/finished HABIT" → ACTION:MARK_HABIT:habit_keyword
• "worked out/exercised/ran/gym"  → ACTION:MARK_HABIT:workout
• "meditated"                     → ACTION:MARK_HABIT:meditat
• "drank water/steps"             → ACTION:LOG_HEALTH:steps:water:0
• "create/add habit NAME"         → ACTION:CREATE_HABIT:NAME:emoji
• "create goal NAME AMOUNT"       → ACTION:CREATE_GOAL:NAME:AMOUNT:{TOMORROW}
• "remember X is Y"               → ACTION:REMEMBER:X:Y

EXAMPLES:
User: spent 500 on swiggy
→ ACTION:LOG_EXPENSE:500:Food:Swiggy
✅ ₹500 logged for Food (Swiggy)! You've spent ₹X today.

User: remind me at 6pm to call mom
→ ACTION:CREATE_REMINDER:Call mom:18:00:{TODAY}
✅ Reminder set for 6pm to call mom! 🔔

User: done with morning workout
→ ACTION:MARK_HABIT:morning workout
🔥 Workout logged! Your streak just got longer. 💪

User: create goal Goa trip 50000 December
→ ACTION:CREATE_GOAL:Goa Trip:50000:2025-12-31
🎯 Goa Trip goal created! ₹50,000 target. That's ₹4,167/month.

╔══════════════════════════════════════╗
║        RESPONSE STYLE GUIDE          ║
╚══════════════════════════════════════╝
• Short: <100 words for actions, <150 for explanations
• Warm + personal: use actual names/numbers from context
• Indian formats: ₹1,50,000 (never ₹150,000)
• Never lecture about bad spending — be supportive
• Always end with a useful suggestion or question
• You're NOT just a chatbot — you're their second brain

USER CONTEXT:
{{context}}"""


# ── Supabase helpers ──────────────────────────────────────────────────────────

def _sb_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if extra:
        h.update(extra)
    return h


def sb_get(path):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{path}",
            headers=_sb_headers()
        )
        with urllib.request.urlopen(req, timeout=7) as r:
            return json.loads(r.read()) or []
    except Exception as e:
        print(f"[SB GET] {path[:60]}: {e}")
        return []


def sb_post(table, data, upsert=False):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    extra = {"Prefer": "return=representation,resolution=merge-duplicates"} if upsert else None
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{table}",
            data=json.dumps(data).encode(),
            headers=_sb_headers(extra),
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=7) as r:
            res = json.loads(r.read())
            return res[0] if isinstance(res, list) else res
    except Exception as e:
        print(f"[SB POST] {table}: {e}")
        return None


def sb_patch(table, filt, data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{table}?{filt}",
            data=json.dumps(data).encode(),
            headers=_sb_headers(),
            method="PATCH",
        )
        with urllib.request.urlopen(req, timeout=7) as r:
            res = json.loads(r.read())
            return res[0] if isinstance(res, list) else res
    except Exception as e:
        print(f"[SB PATCH] {table}: {e}")
        return None


def norm_phone(phone):
    c = re.sub(r"[^\d]", "", phone or "")
    if c.startswith("91") and len(c) > 10:
        c = c[2:]
    return c[-10:] if c else ""


# ── Context builder ───────────────────────────────────────────────────────────

def get_context(phone):
    short = norm_phone(phone)
    if not short:
        return "New user — no data yet."
    ctx_parts = []
    try:
        users = sb_get(f"users?phone=eq.{short}&select=name,monthly_income,monthly_expenses,daily_budget")
        if users:
            u = users[0]
            ctx_parts.append(f"Name: {u.get('name','User')} | Income: ₹{u.get('monthly_income',0):,.0f}/mo | Daily budget: ₹{u.get('daily_budget',1000):,.0f}")

        today_exp = sb_get(f"transactions?phone=eq.{short}&type=eq.expense&select=amount&order=created_at.desc&limit=20")
        # Only count today's
        today_spent = sum(float(t.get('amount', 0)) for t in today_exp[:10])
        if today_spent:
            ctx_parts.append(f"Spent today: ₹{today_spent:,.0f}")

        txns = sb_get(f"transactions?phone=eq.{short}&select=type,amount,category,description&order=created_at.desc&limit=5")
        if txns:
            lines = [f"  {t.get('type','')}: ₹{t.get('amount',0)} ({t.get('category','')}) {t.get('description','')}" for t in txns]
            ctx_parts.append("Recent txns:\n" + "\n".join(lines))

        habits = sb_get(f"habits?phone=eq.{short}&select=name,icon,current_streak&order=current_streak.desc&limit=8")
        if habits:
            ctx_parts.append("Habits: " + ", ".join(f"{h.get('icon','')}{h.get('name','')}({h.get('current_streak',0)}d)" for h in habits))

        checkins = sb_get(f"habit_checkins?phone=eq.{short}&checked_date=eq.{TODAY}&select=habit_id")
        if habits:
            ctx_parts.append(f"Today habits done: {len(checkins)}/{len(habits)}")

        goals = sb_get(f"goals?phone=eq.{short}&status=eq.active&select=name,current_amount,target_amount&limit=4")
        if goals:
            ctx_parts.append("Goals: " + ", ".join(f"{g.get('name','')} ₹{g.get('current_amount',0)}/₹{g.get('target_amount',0)}" for g in goals))

        bills = sb_get(f"bills_and_dues?phone=eq.{short}&status=neq.paid&select=name,amount,due_date&order=due_date.asc&limit=3")
        if bills:
            ctx_parts.append("Upcoming bills: " + ", ".join(f"{b.get('name','')} ₹{b.get('amount',0)}" for b in bills))

        memories = sb_get(f"viya_memory?phone=eq.{short}&select=content&order=importance.desc&limit=5")
        if memories:
            ctx_parts.append("Remembered: " + " | ".join(m.get('content','') for m in memories))

    except Exception as e:
        ctx_parts.append(f"(context error: {e})")

    return "\n".join(ctx_parts) or "No data yet."


# ── Action executor ───────────────────────────────────────────────────────────

def execute_actions(action_lines, phone):
    short = norm_phone(phone)
    if not short:
        return []
    executed = []

    for raw_line in action_lines:
        line = raw_line.strip()
        if not line.startswith("ACTION:"):
            continue
        rest = line[7:]
        parts = rest.split(":")
        if not parts:
            continue
        atype = parts[0].upper()

        try:
            if atype == "LOG_EXPENSE" and len(parts) >= 4:
                amount = float(parts[1])
                category = parts[2]
                note = ":".join(parts[3:])
                sb_post("transactions", {"phone": short, "type": "expense", "amount": amount, "category": category, "description": note})
                executed.append({"type": "expense", "amount": amount, "category": category, "note": note})

            elif atype == "LOG_INCOME" and len(parts) >= 3:
                amount = float(parts[1])
                source = ":".join(parts[2:])
                sb_post("transactions", {"phone": short, "type": "income", "amount": amount, "category": source, "description": source})
                executed.append({"type": "income", "amount": amount, "source": source})

            elif atype == "CREATE_REMINDER" and len(parts) >= 5:
                title = parts[1]
                hour = parts[2].zfill(2)
                minute = parts[3].zfill(2)
                date_str = parts[4]
                if not re.match(r"\d{4}-\d{2}-\d{2}", date_str):
                    date_str = TODAY
                sb_post("user_reminders", {
                    "phone": short, "title": title,
                    "time": f"{hour}:{minute}", "reminder_date": date_str,
                    "is_active": True, "source": "viya_chat",
                })
                executed.append({"type": "reminder", "title": title, "time": f"{hour}:{minute}", "date": date_str})

            elif atype == "MARK_HABIT" and len(parts) >= 2:
                keyword = ":".join(parts[1:]).lower().strip()
                habits = sb_get(f"habits?phone=eq.{short}&select=id,name,current_streak,longest_streak")
                matched = None
                kwords = [w for w in keyword.split() if len(w) > 2]
                for h in (habits or []):
                    hname = (h.get("name") or "").lower()
                    if keyword in hname or any(w in hname for w in kwords) or any(w in keyword for w in hname.split() if len(w) > 2):
                        matched = h
                        break
                if matched:
                    existing = sb_get(f"habit_checkins?habit_id=eq.{matched['id']}&checked_date=eq.{TODAY}&select=id")
                    if not existing:
                        sb_post("habit_checkins", {"habit_id": matched["id"], "phone": short, "checked_date": TODAY, "status": "done"})
                        yest = (_NOW - timedelta(days=1)).strftime("%Y-%m-%d")
                        prev = sb_get(f"habit_checkins?habit_id=eq.{matched['id']}&checked_date=eq.{yest}&select=id")
                        new_streak = (matched.get("current_streak") or 0) + 1 if prev else 1
                        longest = max(new_streak, matched.get("longest_streak") or 0)
                        sb_patch("habits", f"id=eq.{matched['id']}", {"current_streak": new_streak, "longest_streak": longest, "last_completed": TODAY})
                        executed.append({"type": "habit", "name": matched["name"], "streak": new_streak})
                    else:
                        executed.append({"type": "habit_already", "name": matched["name"]})
                else:
                    executed.append({"type": "habit_not_found", "keyword": keyword})

            elif atype == "CREATE_GOAL" and len(parts) >= 4:
                name = parts[1]
                target = float(parts[2])
                deadline = parts[3] if re.match(r"\d{4}-\d{2}-\d{2}", parts[3]) else "2025-12-31"
                sb_post("goals", {"phone": short, "name": name, "icon": "🎯", "target_amount": target, "current_amount": 0, "deadline": deadline, "status": "active", "priority": "medium"})
                executed.append({"type": "goal", "name": name, "target": target})

            elif atype == "CREATE_HABIT" and len(parts) >= 3:
                name = parts[1]
                icon = parts[2] if len(parts) > 2 else "✅"
                sb_post("habits", {"phone": short, "name": name, "icon": icon, "frequency": "daily", "current_streak": 0, "longest_streak": 0})
                executed.append({"type": "new_habit", "name": name, "icon": icon})

            elif atype == "LOG_HEALTH" and len(parts) >= 4:
                data = {"phone": short, "log_date": TODAY}
                steps = int(parts[1]) if parts[1] and parts[1] != "0" else None
                water = int(parts[2]) if parts[2] and parts[2] != "0" else None
                weight = float(parts[3]) if parts[3] and parts[3] not in ("0", "") else None
                if steps: data["steps"] = steps
                if water: data["water_glasses"] = water
                if weight: data["weight"] = weight
                sb_post("health_logs", data, upsert=True)
                executed.append({"type": "health", "steps": steps, "water": water, "weight": weight})

            elif atype == "REMEMBER" and len(parts) >= 3:
                key = parts[1]
                val = ":".join(parts[2:])
                sb_post("viya_memory", {"phone": short, "content": f"{key}: {val}", "memory_type": "fact", "category": "personal", "importance": 7})
                executed.append({"type": "memory", "key": key, "value": val})

        except Exception as e:
            print(f"[ACTION] {atype} failed: {e}")

    return executed


# ── Groq call ─────────────────────────────────────────────────────────────────

def call_groq(messages):
    if not GROQ_API_KEY:
        return None, "Add GROQ_API_KEY to Vercel environment variables (free at console.groq.com/keys)"
    payload = json.dumps({
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.8,
        "max_tokens": 600,
    }).encode()
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=22) as r:
            data = json.loads(r.read())
            return data["choices"][0]["message"]["content"], None
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        return None, f"Groq error {e.code}: {body}"
    except Exception as e:
        return None, f"AI unavailable: {str(e)[:120]}"


# ── Main processor ────────────────────────────────────────────────────────────

def process_message(phone, message, history=None):
    context = get_context(phone)
    system = SYSTEM_PROMPT.replace("{context}", context)

    msgs = [{"role": "system", "content": system}]
    for h in (history or [])[-6:]:
        role = h.get("role", "user")
        if role in ("user", "assistant"):
            msgs.append({"role": role, "content": h.get("content", "")})
    msgs.append({"role": "user", "content": message})

    raw, error = call_groq(msgs)
    if error:
        return error, []

    # Split ACTION lines from message text
    lines = raw.split("\n")
    action_lines = [l.strip() for l in lines if l.strip().startswith("ACTION:")]
    clean_lines = [l for l in lines if not l.strip().startswith("ACTION:")]
    clean_reply = "\n".join(clean_lines).strip()

    executed = execute_actions(action_lines, phone) if action_lines else []

    # Persist to chat history
    try:
        short = norm_phone(phone)
        if short:
            sb_post("chat_history", {"phone": short, "role": "user", "content": message, "source": "app"})
            sb_post("chat_history", {"phone": short, "role": "assistant", "content": clean_reply, "source": "app"})
    except Exception as e:
        print(f"[CHAT HIST] {e}")

    return clean_reply, executed


# ── HTTP handler ──────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        phone = params.get("phone", [""])[0]
        message = params.get("message", [""])[0]
        if not message:
            self._respond(400, {"error": "No message"}); return
        reply, executed = process_message(phone, message)
        self._respond(200, {"reply": reply, "actions_executed": executed, "success": True})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n)) if n else {}
            phone = body.get("phone", "")
            message = body.get("message", "")
            history = body.get("history", [])
            if not message:
                self._respond(400, {"error": "No message"}); return
            reply, executed = process_message(phone, message, history)
            self._respond(200, {"reply": reply, "actions_executed": executed, "success": True})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_OPTIONS(self):
        self._respond(200, {})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, fmt, *args):
        print(f"[CHAT] {fmt % args}")
