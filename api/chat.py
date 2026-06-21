"""
Viya AI Chat — Groq LLaMA 3.3 70B
===================================
Vercel Serverless: api/chat.py → /api/chat
Handles AI chat messages from the frontend.
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))

VIYA_SYSTEM_PROMPT = """You are Viya, an AI personal finance and life assistant for Indian users.

IDENTITY:
- Name: Viya
- Personality: Brilliant, warm, proactive, non-judgmental
- Tone: Like a smart friend who's also a CA + life coach
- Language: Match the user's language (English/Hindi/Tamil/Telugu/Kannada)

CAPABILITIES:
- Track expenses: "spent 500 on food" → log it
- Set reminders: "remind me to pay rent on 1st"
- Check balance: "how much left today?"
- Goal tracking: "how's my bike goal?"
- Health advice: general wellness tips
- Financial advice: budgeting, saving, investing basics
- Life coaching: habits, productivity, motivation

RESPONSE RULES:
1. Keep responses SHORT (under 150 words for quick queries)
2. Use Indian Rupee format: ₹1,50,000 (not ₹150,000)
3. Be proactive — suggest next actions
4. Never lecture about spending — be supportive
5. Use emojis sparingly (max 3 per message)
6. For expense logging, confirm with: "✅ ₹X logged as [category]"
7. Always end with a suggestion or question

USER CONTEXT:
{context}
"""


def get_user_context(phone):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return "No user data available."
    try:
        import urllib.request
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        short = phone.replace("+", "").replace(" ", "")[-10:]

        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/users?phone=eq.{short}&select=name,monthly_income,monthly_expenses,daily_budget",
            headers=headers
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            users = json.loads(resp.read())

        if not users:
            return "New user, no data yet."

        user = users[0]
        ctx = f"Name: {user.get('name', 'User')}\n"
        ctx += f"Monthly Income: ₹{user.get('monthly_income', 0)}\n"
        ctx += f"Monthly Expenses: ₹{user.get('monthly_expenses', 0)}\n"
        ctx += f"Daily Budget: ₹{user.get('daily_budget', 1000)}\n"

        req2 = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/transactions?phone=eq.{short}&select=type,amount,category,description&order=created_at.desc&limit=5",
            headers=headers
        )
        with urllib.request.urlopen(req2, timeout=5) as resp2:
            txns = json.loads(resp2.read())

        if txns:
            ctx += "\nRecent transactions:\n"
            for t in txns:
                ctx += f"  {t.get('type','')}: ₹{t.get('amount',0)} - {t.get('category','')} {t.get('description','')}\n"

        return ctx
    except Exception as e:
        return f"Could not load user data: {e}"


def call_groq(message, context):
    if not GROQ_API_KEY:
        return "I need a Groq API key to respond. Please add GROQ_API_KEY to your Vercel environment variables. Get a free key at https://console.groq.com/keys"

    import urllib.request

    system = VIYA_SYSTEM_PROMPT.replace("{context}", context)

    payload = json.dumps({
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": message}
        ],
        "temperature": 0.7,
        "max_tokens": 500,
    }).encode()

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Sorry, I'm having trouble right now. Error: {str(e)[:100]}"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        phone = params.get("phone", [""])[0]
        message = params.get("message", [""])[0]

        if not message:
            self._respond(400, {"error": "No message provided"})
            return

        context = get_user_context(phone) if phone else "No user context."
        reply = call_groq(message, context)

        self._respond(200, {"reply": reply, "success": True})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            phone = body.get("phone", "")
            message = body.get("message", "")

            if not message:
                self._respond(400, {"error": "No message provided"})
                return

            context = get_user_context(phone) if phone else "No user context."
            reply = call_groq(message, context)

            self._respond(200, {"reply": reply, "success": True})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self._respond(200, {})
