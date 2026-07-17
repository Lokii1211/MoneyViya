"""
Viya AI Action Agent — Groq LLaMA 3.3 70B
==========================================
Real AI second brain that EXECUTES REAL ACTIONS in Supabase:
  "spent 500 on food"  → inserts transaction
  "remind me at 10am" → creates reminder
  "done with workout" → marks habit checkin
  "create goal Goa"   → inserts goal
"""

import sys
import os
import json
import re
import calendar
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Vercel's Python bundler doesn't reliably put this file's own directory on
# sys.path for a plain sibling import — cron/*.py already had to work around
# this the same way. Without this, `import _rag` crashes the whole function
# at import time (confirmed live: this took down every /api/chat request).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _rag

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", "")).strip()

_NOW = datetime.now()
TODAY = _NOW.strftime("%Y-%m-%d")
TOMORROW = (_NOW + timedelta(days=1)).strftime("%Y-%m-%d")

SYSTEM_PROMPT = f"""You are Viya — an AI second brain and personal life assistant for Indian users. You're like a brilliant, warm best friend who's also a chartered accountant, life coach, and therapist all in one.

TODAY: {TODAY} | TOMORROW: {TOMORROW}

╔══════════════════════════════════════╗
║              LANGUAGE                 ║
╚══════════════════════════════════════╝
Reply in the SAME language and style the user just wrote in — mirror them, don't default to English.
• User writes in Tamil (Tamil script) → reply in Tamil script.
• User writes in Tanglish (Tamil in Latin letters, e.g. "eppadi irukka") → reply in Tanglish, not pure Tamil script and not English.
• User writes in Hindi/Devanagari → reply in Hindi.
• Hinglish (Hindi in Latin letters) → reply in Hinglish.
• Kannada, Telugu, Malayalam, Bengali, Marathi, etc. — same rule: match script and style exactly.
• Plain English → reply in English.
• Mixed/code-switched input → mirror that same mix.
Numbers, ₹ amounts, and category names can stay as-is (e.g. "Food", "₹500") even mid-sentence in another language — that's how people actually text.

╔══════════════════════════════════════╗
║   ACTION SYSTEM — READ CAREFULLY     ║
╚══════════════════════════════════════╝
This is a natural-language UNDERSTANDING system, not a keyword matcher.
Understand what the user actually means regardless of exact wording, slang,
typos, or indirect phrasing — don't wait for a message to match a template.
People text like this, and all of these mean the same thing:
  "500 on swiggy" / "just blew 500 bucks on food" / "swiggy order 500rs"
  / "spent five hundred on swiggy today" / "damn swiggy took 500 from me"
If the intent is genuinely ambiguous (e.g. amount or category unclear),
ask a short clarifying question instead of guessing — don't fire an action
on a guess.

When the user wants you to DO something, output ACTION lines at the VERY START of your response, each on its own line, before any message text.

FORMAT (exact — no spaces around colons):
ACTION:LOG_EXPENSE:amount:category:note
ACTION:LOG_INCOME:amount:source
ACTION:CREATE_REMINDER:title:HH:MM:freq:detail
ACTION:MARK_HABIT:keyword
ACTION:CREATE_HABIT:name:emoji
ACTION:CREATE_GOAL:name:target_amount:YYYY-MM-DD
ACTION:LOG_HEALTH:steps:water_glasses:weight_kg
ACTION:LOG_MEAL:name:meal_type:calories
ACTION:LOG_LENDING:given_or_taken:person_name:amount:interest_rate_pct:collect_day_of_month
ACTION:CREATE_BILL:name:amount:due_day_of_month:frequency:bill_type
ACTION:LOG_INVESTMENT:name:type:amount:is_sip
ACTION:ADD_MEDICINE:name:dosage:time:frequency
ACTION:TAKE_MEDICINE:keyword
ACTION:LOG_JOURNAL:entry:mood
ACTION:REMEMBER:key:value

CREATE_REMINDER's freq is once/daily/weekly/monthly, and detail depends on it:
freq=once → detail is YYYY-MM-DD. freq=weekly → detail is a weekday name
("Monday"). freq=monthly → detail is a day number (1-31). freq=daily →
detail can be empty. Recognize recurring phrasing ("every day", "every
Monday", "on the 1st every month") and use the matching freq — don't
default everything to once.

The categories below are the KINDS of intent to recognize — not fixed
phrases to pattern-match. Any natural way of saying these counts:
• Spent/paid money on something          → LOG_EXPENSE
• Earned/received/got paid               → LOG_INCOME
• Wants to be reminded of something later → CREATE_REMINDER (NOT for lending/borrowing money — see LOG_LENDING, which is its own single action and already covers the recurring reminder)
• Says they did/finished a habit          → MARK_HABIT (match against their real habit list in context, even if worded differently — "ran today", "went for a jog", "5k done" should all match a "Running" habit)
• Wants to start tracking a new habit      → CREATE_HABIT
• Wants to save toward something          → CREATE_GOAL
• Mentions steps/water/weight/sleep        → LOG_HEALTH (see INCREMENTAL LOGGING below — these accumulate, they don't overwrite)
• Says they ate/had a meal                → LOG_MEAL. meal_type is breakfast/lunch/dinner/snack — infer it from current time if they don't say, using {TODAY} as today's date for context. If they don't name what they ate, use "Meal" as the name and calories 0 — still log it, don't block on missing detail for something this casual.
• Lent money to someone, or borrowed it   → LOG_LENDING — ALWAYS use this single action for lending/borrowing, even when it also mentions interest or a recurring collection date. Do NOT split it into REMEMBER + CREATE_REMINDER — that loses the amount/interest/person as structured data the app can actually track and settle later. given_or_taken is "given" (they lent it out) or "taken" (they borrowed it). interest_rate_pct is 0 if none mentioned. collect_day_of_month is the day (1-31) they want to be reminded to collect/repay each month — 0 if no recurring collection was mentioned. If they clearly describe lending/borrowing but don't give a person's name, ask for it rather than guessing — everything else can have reasonable defaults, the name can't.
• Has a recurring bill, subscription, or EMI to track → CREATE_BILL. due_day_of_month is 1-31 (0 if not given). frequency is monthly/quarterly/yearly/one_time. bill_type is credit_card/electricity/internet/phone/rent/insurance/emi/subscription/other — pick the closest fit.
• Bought/invested in a stock, mutual fund, SIP, FD, gold, crypto, etc. → LOG_INVESTMENT. type is mutual_fund/stock/fd/ppf/nps/gold/crypto. is_sip is "yes" only if they describe it as a recurring SIP, else "no".
• Wants to track a medicine/prescription   → ADD_MEDICINE (name, dosage if mentioned, time HH:MM if mentioned else default a sensible time, frequency daily/twice_daily/weekly/as_needed)
• Says they took/had their medicine        → TAKE_MEDICINE:keyword (match against their real medicine list in context, same matching style as MARK_HABIT)
• Wants to journal/vent/reflect on their day/mood → LOG_JOURNAL:entry:mood (entry is what they said, mood is a one-word read on it — stressed/happy/anxious/calm/sad/excited/neutral — infer it from tone even if they don't name it)
• Tells you a fact to remember (that ISN'T lending/borrowing — that's always LOG_LENDING) → REMEMBER

INCREMENTAL LOGGING — steps, water, and meals ADD to what's already logged
today, they don't replace it. USER CONTEXT below includes today's latest
health log if one exists. If the user says "had 2 more glasses of water"
and context shows 3 already logged today, output LOG_HEALTH with water=5
(the new total), not 2. Same for steps. If nothing's logged yet today,
their stated number IS the total.

EXAMPLES (illustrating the ACTION format — don't copy the reply wording verbatim every time, vary it naturally like a real person would):
User: swiggy order cost me 500 bucks, ugh
→ ACTION:LOG_EXPENSE:500:Food:Swiggy
Logged — ₹500 for Swiggy. That's the third order this week 👀

User: remind me at 6pm to call mom
→ ACTION:CREATE_REMINDER:Call mom:18:00:once:{TODAY}
Done, I'll ping you at 6pm to call mom 🔔

User: remind me every morning at 7 to take my vitamins
→ ACTION:CREATE_REMINDER:Take vitamins:07:00:daily:
Set — every morning at 7 🔔

User: remind me every Monday at 9am to plan the week
→ ACTION:CREATE_REMINDER:Plan the week:09:00:weekly:Monday
Got it, every Monday at 9am 🔔

User: went for my morning run
→ ACTION:MARK_HABIT:run
Nice, running's marked done 🔥 streak's still alive

User: wanna save up for a goa trip, maybe 50k
→ ACTION:CREATE_GOAL:Goa Trip:50000:2025-12-31
Goa Trip goal is up — ₹50k target. ~₹4,167/month gets you there by December.

User: had 2 glasses of water
→ ACTION:LOG_HEALTH:0:2:0
(or the running total if context shows water already logged today — see INCREMENTAL LOGGING)
Logged — 2 glasses down today 💧

User: i gave 20000 to rahul at 2% interest, need to collect on the 5th every month
→ ACTION:LOG_LENDING:given:Rahul:20000:2:5
Got it — ₹20,000 to Rahul at 2%/month, I'll nudge you every 5th to check in on it.
(WRONG for this: ACTION:REMEMBER:... plus ACTION:CREATE_REMINDER:... — that throws away the amount and interest as structured, settleable data. LOG_LENDING alone is correct and already sets up the recurring nudge.)

User: had my lunch
→ ACTION:LOG_MEAL:Meal:lunch:0
Logged lunch. Want to tell me what you had for a more accurate calorie count?

User: netflix charges me 500 every month on the 3rd
→ ACTION:CREATE_BILL:Netflix:500:3:monthly:subscription
Added — ₹500 Netflix, renews on the 3rd every month.

User: put 5000 into a mutual fund sip this month
→ ACTION:LOG_INVESTMENT:Mutual Fund SIP:mutual_fund:5000:yes
Logged — ₹5,000 SIP tracked.

User: add my bp tablet, one at night
→ ACTION:ADD_MEDICINE:BP Tablet:1 tablet:21:00:daily
Added — BP Tablet, 9pm daily.

User: took my medicine
→ ACTION:TAKE_MEDICINE:medicine
Marked as taken ✅

User: feeling really stressed about the work deadline today
→ ACTION:LOG_JOURNAL:Feeling really stressed about the work deadline today:stressed
Logged that. Deadlines are tough — anything I can help you plan around it?

╔══════════════════════════════════════╗
║      YOU'RE AN AGENT, NOT A BOT       ║
╚══════════════════════════════════════╝
You reason over the user's real data and take initiative — you don't just
answer the literal question and stop there.
• If a goal in context is flagged as blocked_by a bill/EMI and they ask
  about that goal (or money in general), explain the actual reason it's
  stuck, don't just report the progress number.
• If relevant market news is in context and it genuinely bears on their
  holdings or the decision they're asking about, connect it — don't recite
  it if it isn't actually relevant to this message.
• If something in context is clearly actionable and directly relevant to
  what they just said (about to blow budget today, a bill due tomorrow, a
  streak about to break), say so — but only when it's pertinent to the
  current message, never as a bolted-on non-sequitur.
Never invent a number. Every figure you state must come from USER CONTEXT
or the message itself — if you don't have the data, say so plainly instead
of guessing at a plausible-sounding answer.

CONTEXT SOURCE DISCIPLINE — do not mix these up:
• "Portfolio:", "Goals:", "Upcoming bills:", "Money lent/borrowed:", "Active
  medicines:" and similar plain summary lines are the user's OWN real data —
  this is what "my portfolio"/"my investments"/"my bills" means. If a
  "Portfolio:" line exists, THAT is the answer to "how's my portfolio doing"
  — never substitute company/stock names from "Relevant market news" as if
  they were the user's holdings. If there's no Portfolio line, they have no
  investments logged yet — say that plainly, don't invent holdings from
  nearby news.
• "Relevant market news" and "Relevant past X (matched to this question)"
  sections are retrieved for background/context only. Never generate an
  ACTION based on something appearing in these sections — an ACTION line
  only ever comes from what the CURRENT message explicitly says the user
  did or wants, never from a name or number that merely showed up in
  retrieved context.

╔══════════════════════════════════════╗
║        RESPONSE STYLE GUIDE          ║
╚══════════════════════════════════════╝
• DEFAULT TO SHORT. 1-3 sentences for most replies, confirmations, and quick answers — no filler, no restating the question, no "Sure, here's...".
• Only go longer when the user actually asks for it — "explain", "why", "how does this work", "give me details", "elaborate", "tell me more" — then you can properly teach/break it down.
• Action confirmations are one line: what happened + one relevant number. Not a paragraph.
• Warm + personal: use actual names/numbers from context, but don't pad with pleasantries.
• Indian formats: ₹1,50,000 (never ₹150,000)
• Never lecture about bad spending — be supportive, briefly.
• Skip the closing question/suggestion unless it's genuinely useful — don't tack one on out of habit.
• You're NOT just a chatbot — you're their second brain. Second brains are quick, not chatty.
• VARY your phrasing message to message — you're having a conversation, not filling out a template. Two "expense logged" confirmations in a row should not read identically. React to what's actually different this time (the amount, the streak, the pattern you notice).

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

def get_context(phone, message=None):
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

        txns = sb_get(f"transactions?phone=eq.{short}&select=id,type,amount,category,description&order=created_at.desc&limit=5")
        if txns:
            lines = [f"  {t.get('type','')}: ₹{t.get('amount',0)} ({t.get('category','')}) {t.get('description','')}" for t in txns]
            ctx_parts.append("Recent txns:\n" + "\n".join(lines))

        # Hybrid retrieval (BM25 + vector, see docs/AI_AGENTS_RAG_PRD.md) — pulls
        # in older/less-recent rows genuinely relevant to what the user just asked,
        # beyond the "last 5" window above. Degrades to lexical-only without an
        # OPENAI_API_KEY, and no-ops entirely if `message` isn't passed.
        if message:
            # Embed the query ONCE and reuse it across every table below —
            # previously each of these ~11 hybrid_search/news_search calls
            # independently re-embedded the identical message text, meaning
            # a single chat turn fired up to 11 redundant OpenAI calls for
            # the exact same embedding.
            q_vec = _rag.embed_query(message)

            recent_ids = {t.get("id") for t in txns}
            related_txns = _rag.format_matches("transactions", _rag.hybrid_search(short, message, "transactions", limit=3, exclude_ids=recent_ids, query_embedding=q_vec))
            if related_txns:
                ctx_parts.append("Relevant past transactions (matched to this question):\n  " + "\n  ".join(related_txns))
            related_goal_rows = _rag.hybrid_search(short, message, "goals", limit=2, query_embedding=q_vec)
            related_goals = _rag.format_matches("goals", related_goal_rows)
            if related_goals:
                ctx_parts.append("Relevant goals:\n  " + "\n  ".join(related_goals))
                for g in related_goal_rows:
                    kg = _rag.format_kg(_rag.kg_walk(short, f"goal:{g.get('id')}"))
                    if kg:
                        ctx_parts.append(f"Why '{g.get('name','')}' may be stuck: " + "; ".join(kg))
            related_bills = _rag.format_matches("bills_and_dues", _rag.hybrid_search(short, message, "bills_and_dues", limit=2, query_embedding=q_vec))
            if related_bills:
                ctx_parts.append("Relevant bills:\n  " + "\n  ".join(related_bills))
            related_news = _rag.format_news(_rag.news_search(message, limit=2, query_embedding=q_vec))
            if related_news:
                ctx_parts.append("Relevant market news (cite naturally if it's actually useful here, don't force it):\n  " + "\n  ".join(related_news))
            related_habits = _rag.format_matches("habits", _rag.hybrid_search(short, message, "habits", limit=2, query_embedding=q_vec))
            if related_habits:
                ctx_parts.append("Relevant habits:\n  " + "\n  ".join(related_habits))
            related_health = _rag.format_matches("health_logs", _rag.hybrid_search(short, message, "health_logs", limit=2, query_embedding=q_vec))
            if related_health:
                ctx_parts.append("Relevant past health logs (matched to this question):\n  " + "\n  ".join(related_health))
            related_meals = _rag.format_matches("meals", _rag.hybrid_search(short, message, "meals", limit=2, query_embedding=q_vec))
            if related_meals:
                ctx_parts.append("Relevant meals:\n  " + "\n  ".join(related_meals))
            related_lending = _rag.format_matches("lending", _rag.hybrid_search(short, message, "lending", limit=3, query_embedding=q_vec))
            if related_lending:
                ctx_parts.append("Relevant lending/borrowing:\n  " + "\n  ".join(related_lending))
            related_investments = _rag.format_matches("investments", _rag.hybrid_search(short, message, "investments", limit=3, query_embedding=q_vec))
            if related_investments:
                ctx_parts.append("Relevant investments:\n  " + "\n  ".join(related_investments))
            related_medicines = _rag.format_matches("medicines", _rag.hybrid_search(short, message, "medicines", limit=2, query_embedding=q_vec))
            if related_medicines:
                ctx_parts.append("Relevant medicines:\n  " + "\n  ".join(related_medicines))
            related_journal = _rag.format_matches("journal", _rag.hybrid_search(short, message, "journal", limit=2, query_embedding=q_vec))
            if related_journal:
                ctx_parts.append("Relevant journal entries:\n  " + "\n  ".join(related_journal))
            related_emails = _rag.format_matches("emails", _rag.hybrid_search(short, message, "emails", limit=2, query_embedding=q_vec))
            if related_emails:
                ctx_parts.append("Relevant emails (from connected Gmail, if any):\n  " + "\n  ".join(related_emails))

        habits = sb_get(f"habits?phone=eq.{short}&select=name,icon,current_streak&order=current_streak.desc&limit=8")
        if habits:
            ctx_parts.append("Habits: " + ", ".join(f"{h.get('icon','')}{h.get('name','')}({h.get('current_streak',0)}d)" for h in habits))

        checkins = sb_get(f"habit_checkins?phone=eq.{short}&checked_date=eq.{TODAY}&select=habit_id")
        if habits:
            ctx_parts.append(f"Today habits done: {len(checkins)}/{len(habits)}")

        # Real logged vitals — was completely absent before Phase 5, so any
        # health advice was ungrounded. Last log plus a short recent trend.
        recent_health = sb_get(f"health_logs?phone=eq.{short}&select=log_date,steps,water_glasses,sleep_hours,mood,weight&order=log_date.desc&limit=5")
        if recent_health:
            latest = recent_health[0]
            ctx_parts.append(f"Latest health log ({latest.get('log_date','')}): {latest.get('steps',0)} steps, {latest.get('water_glasses',0)} glasses water, {latest.get('sleep_hours',0)}h sleep, mood {latest.get('mood','')}" + (f", weight {latest.get('weight')}kg" if latest.get('weight') else ""))
            if len(recent_health) > 1:
                avg_sleep = sum(float(h.get('sleep_hours') or 0) for h in recent_health) / len(recent_health)
                avg_water = sum(float(h.get('water_glasses') or 0) for h in recent_health) / len(recent_health)
                ctx_parts.append(f"Last {len(recent_health)} days avg: {avg_sleep:.1f}h sleep, {avg_water:.1f} glasses water/day")

        goals = sb_get(f"goals?phone=eq.{short}&status=eq.active&select=name,current_amount,target_amount&limit=4")
        if goals:
            ctx_parts.append("Goals: " + ", ".join(f"{g.get('name','')} ₹{g.get('current_amount',0)}/₹{g.get('target_amount',0)}" for g in goals))

        bills = sb_get(f"bills_and_dues?phone=eq.{short}&status=neq.paid&select=name,amount,due_date&order=due_date.asc&limit=3")
        if bills:
            ctx_parts.append("Upcoming bills: " + ", ".join(f"{b.get('name','')} ₹{b.get('amount',0)}" for b in bills))

        investments = sb_get(f"investments?phone=eq.{short}&select=invested_amount,current_value&limit=50")
        if investments:
            total_invested = sum(float(i.get('invested_amount') or 0) for i in investments)
            total_value = sum(float(i.get('current_value') or i.get('invested_amount') or 0) for i in investments)
            ctx_parts.append(f"Portfolio: ₹{total_invested:,.0f} invested across {len(investments)} holding(s), now worth ₹{total_value:,.0f}")

        medicines = sb_get(f"medicines?phone=eq.{short}&active=eq.true&select=name,time,frequency&order=time.asc&limit=6")
        if medicines:
            ctx_parts.append("Active medicines: " + ", ".join(f"{m.get('name','')} ({m.get('frequency','daily')} at {m.get('time','')})" for m in medicines))

        lending = sb_get(f"lending?user_phone=eq.{short}&status=eq.pending&select=type,person_name,amount,has_interest,interest_rate,due_date&limit=6")
        if lending:
            lent = [l for l in lending if l.get("type") == "given"]
            borrowed = [l for l in lending if l.get("type") == "taken"]
            if lent:
                ctx_parts.append("Money lent out (pending): " + ", ".join(f"₹{l.get('amount',0)} to {l.get('person_name','')}" + (f" ({l.get('interest_rate')}%)" if l.get('has_interest') else "") + (f", collect {l.get('due_date')}" if l.get('due_date') else "") for l in lent))
            if borrowed:
                ctx_parts.append("Money borrowed (pending): " + ", ".join(f"₹{l.get('amount',0)} from {l.get('person_name','')}" for l in borrowed))

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

    # transactions/goals/habits all have FOREIGN KEY (phone) REFERENCES
    # users(phone) — confirmed live: without a users row already existing,
    # a first-time WhatsApp/chat user's very first expense/income/goal/habit
    # silently failed (caught only because of the ok-tracking added above),
    # while newer tables without this FK worked fine. phone is the PK on
    # users, so this upsert only ever touches the phone column on conflict —
    # it can't clobber name/income/etc. on an existing user. Idempotent,
    # cheap, safe to run before every action batch.
    sb_post("users", {"phone": short}, upsert=True)

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
                r = sb_post("transactions", {"phone": short, "type": "expense", "amount": amount, "category": category, "description": note})
                executed.append({"type": "expense", "amount": amount, "category": category, "note": note, "ok": r is not None})

            elif atype == "LOG_INCOME" and len(parts) >= 3:
                amount = float(parts[1])
                source = ":".join(parts[2:])
                r = sb_post("transactions", {"phone": short, "type": "income", "amount": amount, "category": source, "description": source})
                executed.append({"type": "income", "amount": amount, "source": source, "ok": r is not None})

            elif atype == "CREATE_REMINDER" and len(parts) >= 5:
                # user_reminders columns: freq (once/daily/weekly/monthly), time,
                # weekday (for weekly), month_date (for monthly), fire_date (for
                # once), enabled. This used to POST reminder_date/is_active/source
                # — none of which exist on this table — so every chat/WhatsApp
                # reminder was silently failing to save while the AI confidently
                # said "Done!". Fixed to match the real schema and support
                # recurring frequency, not just one-time.
                title = parts[1]
                hour = parts[2].zfill(2)
                minute = parts[3].zfill(2)
                freq = parts[4].lower() if parts[4].lower() in ("once", "daily", "weekly", "monthly") else "once"
                detail = parts[5] if len(parts) > 5 else ""
                data = {"phone": short, "title": title, "time": f"{hour}:{minute}", "freq": freq, "enabled": True}
                if freq == "once":
                    data["fire_date"] = detail if re.match(r"\d{4}-\d{2}-\d{2}", detail) else TODAY
                elif freq == "weekly":
                    data["weekday"] = detail if detail else _NOW.strftime("%A")
                elif freq == "monthly":
                    data["month_date"] = int(detail) if detail.isdigit() else _NOW.day
                r = sb_post("user_reminders", data)
                executed.append({"type": "reminder", "title": title, "time": f"{hour}:{minute}", "freq": freq, "ok": r is not None})

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
                        r = sb_post("habit_checkins", {"habit_id": matched["id"], "phone": short, "checked_date": TODAY, "status": "done"})
                        yest = (_NOW - timedelta(days=1)).strftime("%Y-%m-%d")
                        prev = sb_get(f"habit_checkins?habit_id=eq.{matched['id']}&checked_date=eq.{yest}&select=id")
                        new_streak = (matched.get("current_streak") or 0) + 1 if prev else 1
                        longest = max(new_streak, matched.get("longest_streak") or 0)
                        sb_patch("habits", f"id=eq.{matched['id']}", {"current_streak": new_streak, "longest_streak": longest, "last_completed": TODAY})
                        executed.append({"type": "habit", "name": matched["name"], "streak": new_streak, "ok": r is not None})
                    else:
                        executed.append({"type": "habit_already", "name": matched["name"], "ok": True})
                else:
                    executed.append({"type": "habit_not_found", "keyword": keyword, "ok": False})

            elif atype == "CREATE_GOAL" and len(parts) >= 4:
                name = parts[1]
                target = float(parts[2])
                deadline = parts[3] if re.match(r"\d{4}-\d{2}-\d{2}", parts[3]) else "2025-12-31"
                r = sb_post("goals", {"phone": short, "name": name, "icon": "🎯", "target_amount": target, "current_amount": 0, "deadline": deadline, "status": "active", "priority": "medium"})
                executed.append({"type": "goal", "name": name, "target": target, "ok": r is not None})

            elif atype == "CREATE_HABIT" and len(parts) >= 3:
                name = parts[1]
                icon = parts[2] if len(parts) > 2 else "✅"
                r = sb_post("habits", {"phone": short, "name": name, "icon": icon, "frequency": "daily", "current_streak": 0, "longest_streak": 0})
                executed.append({"type": "new_habit", "name": name, "icon": icon, "ok": r is not None})

            elif atype == "LOG_HEALTH" and len(parts) >= 4:
                data = {"phone": short, "log_date": TODAY}
                steps = int(parts[1]) if parts[1] and parts[1] != "0" else None
                water = int(parts[2]) if parts[2] and parts[2] != "0" else None
                weight = float(parts[3]) if parts[3] and parts[3] not in ("0", "") else None
                if steps: data["steps"] = steps
                if water: data["water_glasses"] = water
                if weight: data["weight"] = weight
                r = sb_post("health_logs", data, upsert=True)
                executed.append({"type": "health", "steps": steps, "water": water, "weight": weight, "ok": r is not None})

            elif atype == "LOG_MEAL" and len(parts) >= 2:
                name = parts[1]
                meal_type = parts[2] if len(parts) > 2 and parts[2] else "snack"
                calories = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0
                r = sb_post("meals", {"phone": short, "meal_date": TODAY, "meal_type": meal_type, "name": name, "calories": calories})
                executed.append({"type": "meal", "name": name, "meal_type": meal_type, "calories": calories, "ok": r is not None})

            elif atype == "LOG_LENDING" and len(parts) >= 3:
                lend_type = parts[1].lower() if parts[1].lower() in ("given", "taken") else "given"
                person = parts[2]
                amount = float(parts[3]) if len(parts) > 3 and parts[3] else 0
                interest_rate = float(parts[4]) if len(parts) > 4 and parts[4] else 0
                collect_day = int(parts[5]) if len(parts) > 5 and parts[5].isdigit() and parts[5] != "0" else None
                due_date = None
                if collect_day:
                    year, month = _NOW.year, _NOW.month
                    last_day = calendar.monthrange(year, month)[1]
                    candidate = datetime(year, month, min(collect_day, last_day))
                    if candidate.date() < _NOW.date():
                        month, year = (month + 1, year) if month < 12 else (1, year + 1)
                        last_day = calendar.monthrange(year, month)[1]
                        candidate = datetime(year, month, min(collect_day, last_day))
                    due_date = candidate.strftime("%Y-%m-%d")
                r = sb_post("lending", {
                    "user_phone": short, "type": lend_type, "person_name": person, "amount": amount,
                    "has_interest": interest_rate > 0, "interest_rate": interest_rate, "interest_type": "monthly",
                    "due_date": due_date, "reminder_enabled": bool(collect_day),
                    "reminder_frequency": "monthly" if collect_day else "weekly", "status": "pending",
                })
                executed.append({"type": "lending", "person": person, "amount": amount, "lend_type": lend_type, "ok": r is not None})

            elif atype == "CREATE_BILL" and len(parts) >= 3:
                name = parts[1]
                amount = float(parts[2]) if len(parts) > 2 and parts[2] else 0
                due_day = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() and parts[3] != "0" else None
                frequency = parts[4] if len(parts) > 4 and parts[4] in ("monthly", "quarterly", "yearly", "one_time") else "monthly"
                bill_type = parts[5] if len(parts) > 5 and parts[5] else "other"
                due_date = None
                if due_day:
                    year, month = _NOW.year, _NOW.month
                    last_day = calendar.monthrange(year, month)[1]
                    candidate = datetime(year, month, min(due_day, last_day))
                    if candidate.date() < _NOW.date():
                        month, year = (month + 1, year) if month < 12 else (1, year + 1)
                        last_day = calendar.monthrange(year, month)[1]
                        candidate = datetime(year, month, min(due_day, last_day))
                    due_date = candidate.strftime("%Y-%m-%d")
                r = sb_post("bills_and_dues", {
                    "phone": short, "name": name, "bill_type": bill_type, "amount": amount,
                    "due_date": due_date, "frequency": frequency, "status": "pending",
                })
                executed.append({"type": "bill", "name": name, "amount": amount, "ok": r is not None})

            elif atype == "LOG_INVESTMENT" and len(parts) >= 3:
                name = parts[1]
                inv_type = parts[2] if parts[2] in ("mutual_fund", "stock", "fd", "ppf", "nps", "gold", "crypto") else "mutual_fund"
                amount = float(parts[3]) if len(parts) > 3 and parts[3] else 0
                is_sip = len(parts) > 4 and parts[4].lower() in ("yes", "true", "1")
                data = {"phone": short, "name": name, "investment_type": inv_type, "invested_amount": amount, "current_value": amount, "is_sip": is_sip}
                if is_sip:
                    data["sip_amount"] = amount
                    data["sip_date"] = _NOW.day
                r = sb_post("investments", data)
                executed.append({"type": "investment", "name": name, "amount": amount, "ok": r is not None})

            elif atype == "ADD_MEDICINE" and len(parts) >= 2:
                name = parts[1]
                dosage = parts[2] if len(parts) > 2 and parts[2] else ""
                time_str = parts[3] if len(parts) > 3 and re.match(r"\d{1,2}:\d{2}", parts[3]) else "09:00"
                frequency = parts[4] if len(parts) > 4 and parts[4] in ("daily", "twice_daily", "weekly", "as_needed") else "daily"
                r = sb_post("medicines", {"phone": short, "name": name, "dosage": dosage, "time": time_str, "frequency": frequency, "active": True})
                executed.append({"type": "new_medicine", "name": name, "ok": r is not None})

            elif atype == "TAKE_MEDICINE" and len(parts) >= 2:
                keyword = ":".join(parts[1:]).lower().strip()
                meds = sb_get(f"medicines?phone=eq.{short}&active=eq.true&select=id,name")
                matched = None
                kwords = [w for w in keyword.split() if len(w) > 2]
                for m in (meds or []):
                    mname = (m.get("name") or "").lower()
                    if keyword in mname or any(w in mname for w in kwords):
                        matched = m
                        break
                # Generic "took my medicine" with no real name given and only
                # one active medicine — no ambiguity to resolve, just log it.
                if not matched and len(meds or []) == 1 and keyword in ("medicine", "meds", "medication", "tablet", "pill"):
                    matched = meds[0]
                if matched:
                    r = sb_post("medicine_checkins", {"medicine_id": matched["id"], "phone": short, "checked_date": TODAY, "taken": True}, upsert=True)
                    executed.append({"type": "medicine_taken", "name": matched["name"], "ok": r is not None})
                else:
                    executed.append({"type": "medicine_not_found", "keyword": keyword, "ok": False})

            elif atype == "LOG_JOURNAL" and len(parts) >= 2:
                entry = ":".join(parts[1:-1]) if len(parts) > 2 else parts[1]
                mood = parts[-1] if len(parts) > 2 and parts[-1] else ""
                r = sb_post("journal", {"phone": short, "entry": entry, "mood": mood})
                executed.append({"type": "journal", "ok": r is not None})

            elif atype == "REMEMBER" and len(parts) >= 3:
                key = parts[1]
                val = ":".join(parts[2:])
                r = sb_post("viya_memory", {"phone": short, "content": f"{key}: {val}", "memory_type": "fact", "category": "personal", "importance": 7})
                executed.append({"type": "memory", "key": key, "value": val, "ok": r is not None})

        except Exception as e:
            print(f"[ACTION] {atype} failed: {e}")
            executed.append({"type": atype.lower(), "ok": False, "error": str(e)})

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
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            # Cloudflare (fronting Groq's API) blocks the default bare
            # "Python-urllib/3.x" User-Agent as bot traffic (403, CF error
            # 1010) — a normal-looking UA clears it.
            "User-Agent": "Mozilla/5.0 (compatible; MoneyViya/1.0; +https://heyviya.vercel.app)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            return data["choices"][0]["message"]["content"], None
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        if e.code == 429:
            return None, "I'm getting a lot of messages right now — give me a few seconds and try again!"
        return None, f"Groq error {e.code}: {body}"
    except urllib.error.URLError as e:
        return None, f"Couldn't reach the AI service: {str(e.reason)[:100]}"
    except Exception as e:
        return None, f"AI unavailable: {str(e)[:120]}"


def call_groq_vision(image_b64):
    """Reads a bill/receipt photo via Groq's vision model, returns
    (parsed_dict_or_None, error_detail_or_None). Used by the OCR bill-scan
    feature in Expenses.jsx, which previously pointed at an endpoint
    (/api/webhook?action=ocr_bill) that no longer exists anywhere in the
    deployed backend — this restores the actual feature rather than just
    removing the marketing claim for it."""
    if not GROQ_API_KEY:
        return None, "GROQ_API_KEY not set"
    try:
        prompt = (
            "This is a photo of a bill or payment receipt. Extract the total amount, "
            "whether it's an expense or income, a short category (Food, Transport, "
            "Shopping, Bills, Health, Entertainment, Groceries, Education, or Other), "
            "and the merchant/description. Reply with ONLY a JSON object, no other text: "
            '{"amount": <number>, "type": "expense", "category": "...", "description": "..."}'
        )
        payload = json.dumps({
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }],
            "temperature": 0.2,
            "max_tokens": 300,
        }).encode()
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; MoneyViya/1.0; +https://heyviya.vercel.app)",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=25) as r:
            content = json.loads(r.read())["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.startswith("json"):
                content = content[4:]
        parsed = json.loads(content)
        if parsed.get("amount"):
            return parsed, None
        return None, f"No amount in model output: {content[:200]}"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"[OCR] HTTP error {e.code}: {body}")
        return None, f"HTTP {e.code}: {body}"
    except Exception as e:
        print(f"[OCR] vision call failed: {e}")
        return None, str(e)


# ── Main processor ────────────────────────────────────────────────────────────

def process_message(phone, message, history=None):
    context = get_context(phone, message)
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

    # The reply text above was written by the LLM before we knew whether the
    # DB write would actually succeed. If it silently failed (bad columns,
    # RLS, network), say so instead of leaving a confident "Done!" standing
    # uncorrected — this exact gap was why chat/WhatsApp reminders looked
    # like they worked while never actually saving.
    failed = [e for e in executed if e.get("ok") is False]
    if failed:
        clean_reply += "\n\n⚠️ Heads up — that didn't actually save (connection issue on my end). Try again in a moment?"

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
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            phone = params.get("phone", [""])[0]
            message = params.get("message", [""])[0]
            if not message:
                self._respond(400, {"error": "No message"}); return
            reply, executed = process_message(phone, message)
            self._respond(200, {"reply": reply, "actions_executed": executed, "success": True})
        except Exception as e:
            print(f"[CHAT] do_GET failed: {e}")
            self._respond(200, {"reply": "Something went wrong on my end — try that again in a moment.", "actions_executed": [], "success": False})

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            action = parse_qs(parsed.query).get("action", [None])[0]
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n)) if n else {}

            if action == "ocr_bill":
                image_b64 = body.get("image", "")
                if not image_b64:
                    self._respond(400, {"error": "No image"}); return
                parsed_bill, ocr_error = call_groq_vision(image_b64)
                if not parsed_bill:
                    resp = {"error": "Could not read the bill — try a clearer photo"}
                    if ocr_error:
                        resp["debug"] = ocr_error
                    self._respond(200, resp); return
                self._respond(200, parsed_bill)
                return

            phone = body.get("phone", "")
            message = body.get("message", "")
            history = body.get("history", [])
            if not message:
                self._respond(400, {"error": "No message"}); return
            reply, executed = process_message(phone, message, history)
            self._respond(200, {"reply": reply, "actions_executed": executed, "success": True})
        except Exception as e:
            print(f"[CHAT] do_POST failed: {e}")
            # Respond 200 with a real message instead of a bare 500 — the
            # frontend treats any non-2xx as "connection issues" and drops
            # the actual error, which made every failure look identical.
            self._respond(200, {"reply": "Something went wrong on my end — try that again in a moment.", "actions_executed": [], "success": False})

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
