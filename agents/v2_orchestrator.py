"""
Viya V2 Specialist Agent Orchestrator
=====================================
4-tier intent routing: Instant → Fast → Standard → Deep
Routes messages to specialist agents (Finance, Health, Productivity, Lifestyle)
Integrates long-term memory for personalized responses.
"""

import os
import re
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple, Any
import random

# Supabase REST client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", ""))

def _sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def _sb_fetch(table, query="", method="GET", body=None):
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=_sb_headers(), method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[V2] Supabase error: {e}")
        return None


# ============================================================
# INTENT CLASSIFICATION
# ============================================================

# Tier 1: Instant (no AI needed, pattern-matched)
INSTANT_PATTERNS = {
    "greeting": r"^(hi|hello|hey|namaste|good\s*(morning|evening|night)|sup|yo)\b",
    "thanks": r"^(thanks|thank\s*you|dhanyavaad|shukriya)",
    "help": r"^(help|menu|commands|what\s*can\s*you\s*do)",
}

# Tier 2: Fast (simple DB lookup + template)
FAST_INTENTS = {
    "check_balance": r"(balance|kitna\s*bacha|how\s*much\s*(left|remaining|do\s*i\s*have))",
    "today_summary": r"(today|aaj)\s*(summary|spent|kharcha)",
    "health_status": r"(health\s*score|my\s*health|how\s*am\s*i\s*doing\s*health)",
    "bill_status": r"(bills?|dues?|pending\s*(bills?|payments?))",
    "portfolio_check": r"(portfolio|investments?|wealth|net\s*worth|kitna\s*paisa\s*laga)",
    "next_event": r"(next\s*(meeting|event|appointment)|kya\s*hai\s*schedule|what'?s\s*next)",
    "smart_insights": r"(insights?|analysis|patterns?|spending\s*pattern|where.*money\s*go)",
    "monthly_report": r"(monthly\s*report|month.*summary|report\s*(for|of)?\s*(this|last)?\s*month)",
}

# Specialist routing keywords
SPECIALIST_KEYWORDS = {
    "finance": [
        "spent", "expense", "income", "salary", "emi", "loan", "invest", "sip",
        "mutual fund", "stock", "fd", "ppf", "budget", "save", "credit card",
        "kharcha", "kamaai", "paisa", "rupee", "₹", "payment", "upi", "transfer",
    ],
    "health": [
        "health", "steps", "water", "sleep", "medicine", "pill", "tablet",
        "calories", "meal", "breakfast", "lunch", "dinner", "weight", "gym",
        "workout", "exercise", "doctor", "bmi", "diet", "protein",
    ],
    "productivity": [
        "meeting", "calendar", "schedule", "remind", "reminder", "todo",
        "task", "deadline", "email", "inbox", "event", "appointment",
        "goal", "habit", "streak",
    ],
    "lifestyle": [
        "recharge", "bill", "electricity", "internet", "rent", "subscription",
        "netflix", "spotify", "amazon", "delivery", "order", "track",
    ],
}


class V2Orchestrator:
    """
    Master orchestrator that classifies intent, routes to specialists,
    and manages memory for personalized responses.
    """

    def __init__(self, base_agent=None):
        self.base_agent = base_agent  # Existing AdvancedWhatsAppAgent
        self.memory_cache = {}  # phone -> recent memories
        # Initialize AEIE
        try:
            from agents.aeie import AIExpenseIntelligenceEngine
            self.aeie = AIExpenseIntelligenceEngine()
        except Exception:
            self.aeie = None

    # ============================================================
    # MAIN ENTRY POINT
    # ============================================================

    async def process(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Main entry point for V2 message processing.
        Returns: { response, specialist, tier, metadata }
        """
        start = time.time()
        message_lower = message.lower().strip()

        # Load user memories for context
        memories = self._get_memories(phone)

        # Tier 1: Instant (pattern match, no AI)
        tier1_result = self._try_instant(phone, message_lower)
        if tier1_result:
            self._log_agent_call(phone, message, "greeting", "master", "instant", time.time() - start)
            return {"response": tier1_result, "specialist": "master", "tier": "instant"}

        # Tier 2: Fast (DB lookup + template)
        tier2_result = self._try_fast(phone, message_lower)
        if tier2_result:
            specialist = tier2_result.get("specialist", "master")
            self._log_agent_call(phone, message, tier2_result.get("intent"), specialist, "fast", time.time() - start)
            return {"response": tier2_result["response"], "specialist": specialist, "tier": "fast"}

        # Classify specialist
        specialist = self._classify_specialist(message_lower)

        # Tier 3: Standard (specialist agent handles)
        result = self._route_to_specialist(phone, message, specialist, memories)

        # Extract and store new memories
        self._extract_memories(phone, message, specialist)

        elapsed = time.time() - start
        self._log_agent_call(phone, message, result.get("intent"), specialist, "standard", elapsed)

        return {
            "response": result.get("response", "I couldn't process that. Try again?"),
            "specialist": specialist,
            "tier": "standard",
            "metadata": result.get("metadata", {}),
        }

    # ============================================================
    # TIER 1: INSTANT RESPONSES
    # ============================================================

    def _try_instant(self, phone: str, msg: str) -> Optional[str]:
        for intent, pattern in INSTANT_PATTERNS.items():
            if re.search(pattern, msg, re.IGNORECASE):
                if intent == "greeting":
                    return self._greeting_response(phone)
                elif intent == "thanks":
                    return random.choice([
                        "Always here for you! 💚",
                        "Anytime, boss! Need anything else? 😊",
                        "That's what friends are for! 🤗",
                    ])
                elif intent == "help":
                    return self._help_response()
        return None

    def _greeting_response(self, phone: str) -> str:
        hour = datetime.now().hour
        if hour < 12: greeting = "Good morning"
        elif hour < 17: greeting = "Good afternoon"
        else: greeting = "Good evening"

        # Fetch user name
        user = _sb_fetch("users", f"?phone=eq.{phone}&select=name")
        name = user[0]["name"] if user and len(user) > 0 else "there"

        return f"{greeting}, {name}! 👋\n\nHow can I help you today?\n\n💰 Finance · ❤️ Health · 📅 Calendar · 📧 Email\n\nJust tell me naturally — I understand everything! 🧠"

    def _help_response(self) -> str:
        return """🧠 *Viya — Your Life OS*

*I can help with:*
━━━━━━━━━━━━━━━━━
💰 *Money:* "Spent 200 on food" · "Show my portfolio"
❤️ *Health:* "Log 8 glasses water" · "Track my sleep"
📅 *Schedule:* "What's next?" · "Schedule meeting tomorrow"
📧 *Email:* "Any pending bills in email?"
📋 *Bills:* "When's my credit card due?"
📈 *Invest:* "Best SIP for ₹5000/month?"

*Or just chat naturally!*
I remember your preferences & learn over time 🤗"""

    # ============================================================
    # TIER 2: FAST DB LOOKUPS
    # ============================================================

    def _try_fast(self, phone: str, msg: str) -> Optional[Dict]:
        for intent, pattern in FAST_INTENTS.items():
            if re.search(pattern, msg, re.IGNORECASE):
                handler = getattr(self, f"_fast_{intent}", None)
                if handler:
                    return handler(phone)
        return None

    def _fast_health_status(self, phone: str) -> Dict:
        today = datetime.now().strftime("%Y-%m-%d")
        log = _sb_fetch("health_logs", f"?phone=eq.{phone}&log_date=eq.{today}&select=*")
        if log and len(log) > 0:
            h = log[0]
            score = h.get("health_score", 50)
            emoji = "🌟" if score >= 80 else "👍" if score >= 60 else "💪"
            return {
                "response": f"""❤️ *Health Score: {score}/100* {emoji}

🏃 Steps: {h.get('steps', 0):,}
💧 Water: {h.get('water_glasses', 0)} glasses
😴 Sleep: {h.get('sleep_hours', 0)}h
🔥 Calories: {h.get('calories', 0)} kcal
😊 Mood: {h.get('mood', 'neutral')}

Keep it up! Track more at heyviya.vercel.app/health""",
                "specialist": "health",
                "intent": "health_status",
            }
        return {
            "response": "No health data logged today yet! Tell me:\n• How many steps you walked\n• How many glasses of water\n• How you slept last night\n\nI'll track it all! 💪",
            "specialist": "health",
            "intent": "health_status",
        }

    def _fast_bill_status(self, phone: str) -> Dict:
        bills = _sb_fetch("bills_and_dues", f"?phone=eq.{phone}&status=neq.paid&select=*&order=due_date.asc&limit=5")
        if bills and len(bills) > 0:
            lines = ["📋 *Pending Bills:*\n"]
            total = 0
            for b in bills:
                amt = float(b.get("amount", 0))
                total += amt
                due = b.get("due_date", "N/A")
                status_emoji = "🔴" if b.get("status") == "overdue" else "🟡"
                lines.append(f"{status_emoji} {b['name']} — ₹{amt:,.0f} (due {due})")
            lines.append(f"\n💰 Total pending: ₹{total:,.0f}")
            return {"response": "\n".join(lines), "specialist": "lifestyle", "intent": "bill_status"}
        return {"response": "✅ No pending bills! You're all clear 🎉", "specialist": "lifestyle", "intent": "bill_status"}

    def _fast_portfolio_check(self, phone: str) -> Dict:
        invs = _sb_fetch("investments", f"?phone=eq.{phone}&select=*")
        if invs and len(invs) > 0:
            total_inv = sum(float(i.get("invested_amount", 0)) for i in invs)
            current = sum(float(i.get("current_value", i.get("invested_amount", 0))) for i in invs)
            ret = current - total_inv
            pct = (ret / total_inv * 100) if total_inv > 0 else 0
            sips = [i for i in invs if i.get("is_sip")]
            return {
                "response": f"""📈 *Portfolio Summary*

💰 Invested: ₹{total_inv:,.0f}
📊 Current: ₹{current:,.0f}
{'🟢' if ret >= 0 else '🔴'} Returns: {'+'if ret>=0 else ''}₹{ret:,.0f} ({pct:+.1f}%)
📋 Holdings: {len(invs)}
🔄 Active SIPs: {len(sips)}

View details: heyviya.vercel.app/wealth""",
                "specialist": "finance", "intent": "portfolio_check",
            }
        return {"response": "No investments tracked yet! Tell me about your SIPs or stocks and I'll track them 📈", "specialist": "finance", "intent": "portfolio_check"}

    def _fast_next_event(self, phone: str) -> Dict:
        today = datetime.now().strftime("%Y-%m-%d")
        events = _sb_fetch("calendar_events", f"?phone=eq.{phone}&event_date=eq.{today}&select=*&order=start_time.asc&limit=3")
        if events and len(events) > 0:
            lines = ["📅 *Today's Events:*\n"]
            for e in events:
                time_str = e.get("start_time", "All day")
                lines.append(f"• {time_str} — {e['title']}")
                if e.get("location"): lines.append(f"  📍 {e['location']}")
            return {"response": "\n".join(lines), "specialist": "productivity", "intent": "next_event"}
        return {"response": "📅 No events today! Your day is free 🎉", "specialist": "productivity", "intent": "next_event"}

    def _fast_smart_insights(self, phone: str) -> Dict:
        """AEIE-powered spending insights"""
        if not self.aeie:
            return {"response": "📊 Insights coming soon! Keep tracking expenses.", "specialist": "finance", "intent": "smart_insights"}
        insights = self.aeie.get_smart_insights(phone)
        if not insights:
            return {"response": "Not enough data for insights yet. Keep tracking! 📊", "specialist": "finance", "intent": "smart_insights"}
        lines = ["🧠 *Smart Insights*\n"]
        for ins in insights:
            lines.append(f"{ins.get('icon', '📊')} *{ins['title']}*")
            lines.append(f"   {ins['desc']}\n")
        lines.append("View full report: heyviya.vercel.app/report")
        return {"response": "\n".join(lines), "specialist": "finance", "intent": "smart_insights"}

    def _fast_monthly_report(self, phone: str) -> Dict:
        """AEIE-powered monthly report"""
        if not self.aeie:
            return {"response": "📋 Reports coming soon!", "specialist": "finance", "intent": "monthly_report"}
        report = self.aeie.generate_monthly_report(phone)
        cats = "\n".join([f"  {c['emoji']} {c['category'].title()}: ₹{c['amount']:,.0f} ({c['pct']}%)" for c in report.get('top_categories', [])])
        return {
            "response": f"""📊 *Monthly Report — {report['month']}*\n\n💰 Income: ₹{report['total_income']:,.0f}\n💸 Expenses: ₹{report['total_expenses']:,.0f}\n💵 Savings: ₹{report['savings']:,.0f} ({report['savings_rate']}%)\n📝 Transactions: {report['transaction_count']}\n\n*Top Categories:*\n{cats}\n\n📈 Grade: *{report['grade']}*\n\nFull report: heyviya.vercel.app/report""",
            "specialist": "finance", "intent": "monthly_report",
        }

    # ============================================================
    # SPECIALIST CLASSIFICATION
    # ============================================================

    def _classify_specialist(self, msg: str) -> str:
        scores = {s: 0 for s in SPECIALIST_KEYWORDS}
        words = msg.lower().split()
        for specialist, keywords in SPECIALIST_KEYWORDS.items():
            for kw in keywords:
                if kw in msg:
                    scores[specialist] += 2 if len(kw) > 4 else 1
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "finance"  # Default to finance

    # ============================================================
    # TIER 3: SPECIALIST ROUTING
    # ============================================================

    def _route_to_specialist(self, phone: str, message: str, specialist: str, memories: List) -> Dict:
        """Route to appropriate specialist handler"""
        handlers = {
            "finance": self._handle_finance,
            "health": self._handle_health,
            "productivity": self._handle_productivity,
            "lifestyle": self._handle_lifestyle,
        }
        handler = handlers.get(specialist, self._handle_finance)
        return handler(phone, message, memories)

    def _handle_finance(self, phone: str, message: str, memories: List) -> Dict:
        """Finance specialist — delegates to base agent for expense/income/investment"""
        if self.base_agent:
            try:
                response = self.base_agent.process_message(phone, message)
                return {"response": response, "intent": "finance_general"}
            except Exception as e:
                print(f"[V2] Base agent error: {e}")
        return {"response": "I'll help with that! Could you tell me the amount and category? 💰", "intent": "finance_general"}

    def _handle_health(self, phone: str, message: str, memories: List) -> Dict:
        """Health specialist — log steps, water, sleep, meals, medicines"""
        msg = message.lower()

        # Water logging
        water_match = re.search(r"(\d+)\s*(glass|cup|bottle)s?\s*(of\s*)?(water|paani)", msg)
        if water_match or "drank water" in msg or "log water" in msg:
            glasses = int(water_match.group(1)) if water_match else 1
            today = datetime.now().strftime("%Y-%m-%d")
            existing = _sb_fetch("health_logs", f"?phone=eq.{phone}&log_date=eq.{today}&select=*")
            current = existing[0].get("water_glasses", 0) if existing and len(existing) > 0 else 0
            new_total = current + glasses
            _sb_fetch("health_logs", "", "POST", {"phone": phone, "log_date": today, "water_glasses": new_total})
            return {"response": f"💧 Logged {glasses} glass{'es' if glasses > 1 else ''}! Total today: {new_total}/8\n\n{'🎉 Hydration goal reached!' if new_total >= 8 else f'💪 {8 - new_total} more to go!'}", "intent": "log_water"}

        # Steps logging
        steps_match = re.search(r"(\d[\d,]+)\s*steps?", msg)
        if steps_match or "walked" in msg:
            steps = int(steps_match.group(1).replace(",", "")) if steps_match else 1000
            today = datetime.now().strftime("%Y-%m-%d")
            _sb_fetch("health_logs", "", "POST", {"phone": phone, "log_date": today, "steps": steps})
            pct = min(100, int(steps / 100))
            return {"response": f"🏃 Logged {steps:,} steps! ({pct}% of 10K goal)\n\n{'🌟 Amazing! Goal crushed!' if steps >= 10000 else f'Keep moving! {10000-steps:,} to go 💪'}", "intent": "log_steps"}

        # Sleep logging
        sleep_match = re.search(r"slept?\s*(\d+\.?\d*)\s*(hours?|hrs?|h)", msg)
        if sleep_match:
            hours = float(sleep_match.group(1))
            today = datetime.now().strftime("%Y-%m-%d")
            _sb_fetch("health_logs", "", "POST", {"phone": phone, "log_date": today, "sleep_hours": hours})
            quality = "Excellent! 🌟" if hours >= 8 else "Good 👍" if hours >= 7 else "Try to sleep more 😴"
            return {"response": f"😴 Logged {hours}h sleep — {quality}", "intent": "log_sleep"}

        return {"response": "I can track your:\n💧 Water · 🏃 Steps · 😴 Sleep · 🍎 Meals · 💊 Medicines\n\nJust tell me naturally!", "intent": "health_general"}

    def _handle_productivity(self, phone: str, message: str, memories: List) -> Dict:
        """Productivity specialist — calendar, reminders, tasks"""
        msg = message.lower()

        # Check schedule
        if any(w in msg for w in ["schedule", "calendar", "events", "meetings"]):
            return self._fast_next_event(phone)

        # Set reminder
        remind_match = re.search(r"remind\s*(?:me\s*)?(?:to\s+)?(.+?)(?:\s+(?:at|by|on)\s+(.+))?$", msg)
        if remind_match:
            task = remind_match.group(1).strip()
            when = remind_match.group(2) or "tomorrow"
            _sb_fetch("calendar_events", "", "POST", {
                "phone": phone, "title": task,
                "event_type": "reminder", "event_date": datetime.now().strftime("%Y-%m-%d"),
                "source": "chat",
            })
            return {"response": f"⏰ Reminder set: *{task}*\n📅 When: {when}\n\nI'll ping you! 🔔", "intent": "set_reminder"}

        return {"response": "I can help with:\n📅 Schedule · ⏰ Reminders · ✅ Tasks\n\nWhat do you need?", "intent": "productivity_general"}

    def _handle_lifestyle(self, phone: str, message: str, memories: List) -> Dict:
        """Lifestyle specialist — bills, subscriptions, deliveries"""
        msg = message.lower()

        # Bill related
        if any(w in msg for w in ["bill", "due", "payment", "electricity", "rent"]):
            return self._fast_bill_status(phone)

        return {"response": "I can track your:\n📋 Bills · 📺 Subscriptions · 📦 Deliveries\n\nTell me what you need!", "intent": "lifestyle_general"}

    # ============================================================
    # MEMORY SYSTEM
    # ============================================================

    def _get_memories(self, phone: str) -> List:
        if phone in self.memory_cache:
            return self.memory_cache[phone]
        memories = _sb_fetch("viya_memory", f"?phone=eq.{phone}&select=*&order=importance.desc&limit=20") or []
        self.memory_cache[phone] = memories
        return memories

    def _extract_memories(self, phone: str, message: str, specialist: str):
        """Extract memorable facts from user messages"""
        msg = message.lower()
        memories_to_add = []

        # Preference patterns
        if re.search(r"i\s*(like|love|prefer|enjoy|hate|dislike)\s+", msg):
            memories_to_add.append({"content": message.strip(), "memory_type": "preference", "category": specialist, "importance": 6})

        # Life events
        if re.search(r"(married|wedding|baby|pregnant|new\s*job|promotion|moved|shifting)", msg):
            memories_to_add.append({"content": message.strip(), "memory_type": "event", "category": "personal", "importance": 8})

        # Financial goals
        if re.search(r"(want\s*to\s*(save|invest|buy)|planning\s*to|goal\s*is)", msg):
            memories_to_add.append({"content": message.strip(), "memory_type": "goal", "category": "finance", "importance": 7})

        for mem in memories_to_add:
            _sb_fetch("viya_memory", "", "POST", {"phone": phone, **mem})

    # ============================================================
    # LOGGING
    # ============================================================

    def _log_agent_call(self, phone, message, intent, specialist, tier, elapsed):
        try:
            _sb_fetch("agent_logs", "", "POST", {
                "phone": phone, "message": message[:500],
                "detected_intent": intent, "specialist": specialist,
                "tier": tier, "response_time_ms": int(elapsed * 1000),
            })
        except: pass


# Singleton
v2_orchestrator = V2Orchestrator()
