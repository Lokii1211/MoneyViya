"""
MoneyViya Founder Edition — Specialist Agents
================================================
The 10 specialist agents from the Founder Edition document.
These handle the REAL pain points nobody else solves.

Agents:
1. Social Pressure Defense → Help users say no to expensive outings
2. Emotional Spending Detector → Detect stress/impulse purchases
3. Subscription Detective → Find & eliminate wasteful subscriptions
4. Micro-Spending Pattern Alert → Daily ₹20 leaks
5. Emergency Response → Handle financial crises
6. Family Obligation Manager → Indian-specific family money dynamics
7. Purchase Decision Assistant → Big purchase research & advice
8. Financial Educator → Context-aware ELI5 explanations
9. Proactive Messaging Engine → Daily rhythm (morning/evening)
10. Viral Moment Generator → Share-worthy achievement messages
"""

from datetime import datetime, timedelta
import json
import os

# Try to import OpenAI service for LLM calls
try:
    from services.openai_service import openai_service
    LLM_AVAILABLE = True
except:
    LLM_AVAILABLE = False


class FounderAgents:
    """All Founder Edition specialist agents in one class."""

    def __init__(self):
        self.data_dir = "data/founder"
        os.makedirs(self.data_dir, exist_ok=True)

    # ============ AGENT 1: SOCIAL PRESSURE DEFENSE ============
    def social_pressure_defense(self, user_context: dict, trigger: str) -> str:
        """Help user handle social spending pressure."""
        budget_left = user_context.get("budget_remaining", 0)
        name = user_context.get("name", "there")

        # Estimate cost based on trigger
        cost_estimates = {
            "dinner": 1500, "lunch": 800, "movie": 500, "party": 2000,
            "drinks": 1500, "shopping": 3000, "trip": 5000, "cafe": 500,
            "coffee": 400, "concert": 2500, "wedding": 5000
        }

        estimated_cost = 1500  # default
        for keyword, cost in cost_estimates.items():
            if keyword in trigger.lower():
                estimated_cost = cost
                break

        if budget_left >= estimated_cost:
            return (
                f"Hey {name}! That plan sounds fun 😊\n\n"
                f"Estimated cost: ₹{estimated_cost:,}\n"
                f"Your budget left: ₹{budget_left:,}\n\n"
                f"✅ You can totally do this!\nEnjoy guilt-free 💚"
            )
        elif budget_left >= estimated_cost * 0.5:
            deficit = estimated_cost - budget_left
            return (
                f"Hey {name}, about that plan...\n\n"
                f"Estimated cost: ~₹{estimated_cost:,}\n"
                f"Budget left: ₹{budget_left:,}\n"
                f"Short by: ₹{deficit:,}\n\n"
                f"*Options:*\n"
                f"1️⃣ Shift ₹{deficit:,} from next week's budget\n"
                f"2️⃣ Suggest a cheaper alternative\n"
                f"3️⃣ Go but set a spending cap of ₹{budget_left:,}\n\n"
                f"What feels right?"
            )
        else:
            return (
                f"Hey {name}, I know saying no is hard 💚\n\n"
                f"Estimated cost: ~₹{estimated_cost:,}\n"
                f"Budget left: ₹{budget_left:,}\n\n"
                f"Going would hurt your goals.\n\n"
                f"*Here's a message you could send:*\n"
                f"\"Hey! I'm saving for something big right now. "
                f"Can we do [cheaper option] instead? Or I'll catch the next one!\"\n\n"
                f"No shame in protecting your future 💪"
            )

    # ============ AGENT 2: EMOTIONAL SPENDING DETECTOR ============
    def detect_emotional_spending(self, user_context: dict, transaction: dict) -> str | None:
        """Detect if a transaction is emotional/impulse spending."""
        hour = datetime.now().hour
        amount = transaction.get("amount", 0)
        category = transaction.get("category", "").lower()

        signals = []

        # Late night shopping (10PM - 5AM)
        if hour >= 22 or hour < 5:
            signals.append("late_night")

        # High amount vs daily budget
        daily_budget = user_context.get("daily_budget", 1000)
        if amount > daily_budget * 2:
            signals.append("high_amount")

        # Comfort categories
        comfort_cats = ["food delivery", "shopping", "entertainment", "swiggy", "zomato", "amazon"]
        if any(c in category for c in comfort_cats):
            signals.append("comfort_category")

        if len(signals) >= 2:
            name = user_context.get("name", "there")
            if "late_night" in signals:
                return (
                    f"Hey {name}, still up? 🌙\n\n"
                    f"₹{amount:,} purchase at {hour}:00.\n"
                    f"Late-night purchases are regretted 60% of the time.\n\n"
                    f"💡 *The 12-hour rule:*\n"
                    f"Add to cart, sleep on it, decide tomorrow.\n"
                    f"Your ₹{amount:,} will still be there tomorrow.\n\n"
                    f"Set reminder for tomorrow afternoon? 😊"
                )
            else:
                return (
                    f"Hey {name}, noticed a spending spike 📊\n\n"
                    f"₹{amount:,} on {category}\n"
                    f"Your daily budget is ₹{daily_budget:,}\n\n"
                    f"Everything okay? Sometimes we spend when stressed.\n"
                    f"No judgment — just checking in 💚"
                )
        return None  # No emotional spending detected

    # ============ AGENT 3: SUBSCRIPTION DETECTIVE ============
    def subscription_audit(self, user_context: dict) -> str:
        """Audit user's subscriptions and find waste."""
        name = user_context.get("name", "there")
        phone = user_context.get("phone", "")

        # Load tracked subscriptions
        sub_file = os.path.join(self.data_dir, f"subs_{phone}.json")
        if os.path.exists(sub_file):
            with open(sub_file) as f:
                subs = json.load(f)
        else:
            # Default Indian subscriptions to check
            subs = [
                {"name": "Netflix", "amount": 649, "emoji": "📺", "status": "unknown"},
                {"name": "Spotify", "amount": 119, "emoji": "🎵", "status": "unknown"},
                {"name": "Amazon Prime", "amount": 125, "emoji": "📦", "status": "unknown"},
                {"name": "Hotstar", "amount": 299, "emoji": "🏏", "status": "unknown"},
                {"name": "YouTube Premium", "amount": 129, "emoji": "▶️", "status": "unknown"},
                {"name": "Gym", "amount": 2000, "emoji": "🏋️", "status": "unknown"},
            ]

        total = sum(s["amount"] for s in subs)
        yearly = total * 12

        report = f"🔍 *Subscription Audit*\n━━━━━━━━━━━━━━━━\n\n"
        for s in subs:
            report += f"{s['emoji']} {s['name']}: ₹{s['amount']:,}/mo\n"

        report += (
            f"\n━━━━━━━━━━━━━━━━\n"
            f"💰 Total: ₹{total:,}/month = ₹{yearly:,}/year\n\n"
            f"Do you actually use ALL of these?\n\n"
            f"Reply with the ones to *cancel*:\n"
            f"Example: \"cancel spotify, gym\"\n\n"
            f"Even cancelling 1 unused subscription saves you money! 💪"
        )
        return report

    # ============ AGENT 4: MICRO-SPENDING PATTERN ============
    def micro_spending_alert(self, user_context: dict, daily_micro: float) -> str:
        """Alert about daily micro-spending patterns."""
        name = user_context.get("name", "there")
        monthly = daily_micro * 22  # working days
        yearly = monthly * 12

        # Connect to active goal
        goals = user_context.get("goals", [])
        goal_connection = ""
        if goals:
            goal = goals[0]
            goal_name = goal.get("name", "goal")
            goal_pct = round(yearly / goal.get("target", 100000) * 100)
            goal_connection = f"\n₹{yearly:,.0f}/year = {goal_pct}% of your {goal_name} goal! 🎯"

        return (
            f"Hey {name}, I found a pattern 🔍\n\n"
            f"You spend ~₹{daily_micro:,.0f} daily on small purchases\n"
            f"(chai, snacks, auto rides, etc.)\n\n"
            f"That's:\n"
            f"• ₹{monthly:,.0f}/month\n"
            f"• ₹{yearly:,.0f}/year\n"
            f"{goal_connection}\n\n"
            f"*Ideas to cut 50%:*\n"
            f"☕ Bring chai from home (₹20→₹5)\n"
            f"🥪 Pack snacks (₹30→₹10)\n"
            f"🚌 Use bus 2x/week (saves ₹200/week)\n\n"
            f"Even small wins add up! Try one this week? 💪"
        )

    # ============ AGENT 5: EMERGENCY RESPONSE ============
    def emergency_response(self, user_context: dict, emergency_type: str, amount_needed: int) -> str:
        """Handle financial emergencies with actionable options."""
        name = user_context.get("name", "there")
        savings = user_context.get("savings", 0)
        emergency_fund = user_context.get("emergency_fund", 0)

        total_available = savings + emergency_fund

        if total_available >= amount_needed:
            return (
                f"😟 {emergency_type} — I'm here to help.\n\n"
                f"Amount needed: ₹{amount_needed:,}\n"
                f"Your emergency fund: ₹{emergency_fund:,}\n"
                f"Your savings: ₹{savings:,}\n\n"
                f"✅ *You're covered!* Here are options:\n\n"
                f"1️⃣ Use emergency fund (₹{emergency_fund:,}→₹{max(0, emergency_fund - amount_needed):,})\n"
                f"   Rebuild in {max(1, amount_needed // 3000)} months\n\n"
                f"2️⃣ Split: ₹{amount_needed // 2:,} emergency + ₹{amount_needed // 2:,} savings\n"
                f"   Less impact on emergency fund\n\n"
                f"Which option? Reply 1 or 2"
            )
        elif total_available > 0:
            shortfall = amount_needed - total_available
            return (
                f"😟 {emergency_type} — let's figure this out.\n\n"
                f"Amount needed: ₹{amount_needed:,}\n"
                f"Available: ₹{total_available:,}\n"
                f"Short by: ₹{shortfall:,}\n\n"
                f"*Options:*\n"
                f"1️⃣ Use all available (₹{total_available:,}) + borrow ₹{shortfall:,}\n"
                f"2️⃣ Partial payment now, rest next salary\n"
                f"3️⃣ I'll find ₹{shortfall:,} in your budget over 2 months\n\n"
                f"After this: let's build an emergency fund so this doesn't stress you again 💚"
            )
        else:
            return (
                f"😟 {emergency_type} — this is exactly why emergency funds matter.\n\n"
                f"Amount needed: ₹{amount_needed:,}\n"
                f"Your emergency fund: ₹0\n\n"
                f"*Right now:*\n"
                f"1️⃣ Credit card (interest: ~3%/month)\n"
                f"2️⃣ Borrow from family (I can draft a message)\n"
                f"3️⃣ Delay if possible, save up over 2-3 months\n\n"
                f"*After this crisis:*\n"
                f"₹2,000/month × 6 months = ₹12,000 emergency fund\n"
                f"So the NEXT emergency won't stress you.\n\n"
                f"Start auto-saving after this? 💚"
            )

    # ============ AGENT 6: FAMILY OBLIGATION MANAGER ============
    def family_obligation(self, user_context: dict, request_amount: int, who: str) -> str:
        """Handle family financial obligations (India-specific)."""
        name = user_context.get("name", "there")
        savings = user_context.get("savings", 0)
        emergency_fund = user_context.get("emergency_fund", 0)
        total = savings + emergency_fund

        response = f"Of course you'll help {who} 💚\n\nLet's figure out how:\n\n"
        response += f"Amount needed: ₹{request_amount:,}\n"
        response += f"Your savings: ₹{savings:,}\n"
        response += f"Emergency fund: ₹{emergency_fund:,}\n\n"

        if total >= request_amount:
            response += (
                f"*Options:*\n"
                f"1️⃣ Send ₹{request_amount:,} now from savings\n"
                f"2️⃣ Send ₹{request_amount // 2:,} now, rest next month\n"
                f"3️⃣ Use emergency fund (rebuild in {max(1, request_amount // 3000)} months)\n\n"
                f"Which feels right for your situation?"
            )
        else:
            shortfall = request_amount - total
            response += (
                f"You have ₹{total:,} available.\n"
                f"Short by: ₹{shortfall:,}\n\n"
                f"*Options:*\n"
                f"1️⃣ Send ₹{total:,} now, arrange ₹{shortfall:,} by next salary\n"
                f"2️⃣ Send in 2 installments over 2 months\n"
                f"3️⃣ Ask other family members to share the load\n\n"
            )

        # Count this year's family support
        response += (
            f"\n💡 *Consider:* Build a 'Family Buffer' fund\n"
            f"₹3,000/month × 12 months = ₹36,000/year for family needs\n"
            f"So these don't derail your personal goals 🎯"
        )
        return response

    # ============ AGENT 7: PURCHASE DECISION ASSISTANT ============
    def purchase_decision(self, user_context: dict, item: str, price: int) -> str:
        """Help with big purchase decisions."""
        name = user_context.get("name", "there")
        savings = user_context.get("savings", 0)
        monthly_savings = user_context.get("monthly_savings", 5000)

        # Check if affordable
        can_afford = savings >= price
        months_to_save = max(1, (price - savings) // monthly_savings) if not can_afford else 0

        goals = user_context.get("goals", [])
        goal_impact = ""
        if goals:
            goal = goals[0]
            goal_name = goal.get("name", "goal")
            delay_months = max(1, price // monthly_savings)
            goal_impact = f"\n⚠️ *Goal impact:* {goal_name} delayed by ~{delay_months} month(s)\n"

        if can_afford:
            return (
                f"💻 *{item} — ₹{price:,}*\n\n"
                f"Your savings: ₹{savings:,}\n"
                f"✅ You can afford this!\n"
                f"{goal_impact}\n"
                f"*My recommendation:*\n"
                f"{'Buy now ✅ — within budget!' if not goals else f'Wait {delay_months} month(s), buy without hurting {goal_name}'}\n\n"
                f"*Money tip:* Always check for:\n"
                f"• Cashback offers (5-10% saved)\n"
                f"• Festival sales (up to 30% off)\n"
                f"• No-cost EMI (split without interest)\n\n"
                f"[Buy now] [Wait & save] [Show alternatives]"
            )
        else:
            return (
                f"💻 *{item} — ₹{price:,}*\n\n"
                f"Your savings: ₹{savings:,}\n"
                f"Short by: ₹{price - savings:,}\n"
                f"Time to save: ~{months_to_save} months\n"
                f"{goal_impact}\n"
                f"*Options:*\n"
                f"1️⃣ Save ₹{monthly_savings:,}/mo for {months_to_save} months → buy cash\n"
                f"2️⃣ No-cost EMI (₹{price // 6:,}/mo × 6 months)\n"
                f"3️⃣ Find cheaper alternative\n\n"
                f"I recommend option 1 — debt-free is always better 💪\n"
                f"I'll remind you when you've saved enough!"
            )

    # ============ AGENT 8: FINANCIAL EDUCATOR ============
    def explain_concept(self, concept: str) -> str:
        """ELI5 financial concepts."""
        concepts = {
            "sip": (
                "📚 *SIP = Systematic Investment Plan*\n\n"
                "Instead of investing ₹12,000 at once (scary!),\n"
                "you invest ₹1,000 every month for 12 months.\n\n"
                "*Why it's great:*\n"
                "• Small amounts (affordable)\n"
                "• Automatic (set & forget)\n"
                "• Averaging (buy more when cheap)\n\n"
                "*Real example:*\n"
                "₹2,000/month SIP in Nifty 50 index fund\n"
                "In 5 years: ₹1,20,000 → ~₹1,65,000\n"
                "That's ₹45,000 profit for doing nothing! 📈"
            ),
            "mutual fund": (
                "📚 *Mutual Fund = Group Investment*\n\n"
                "Imagine 1,000 people put ₹1,000 each.\n"
                "Total pool: ₹10 lakh.\n"
                "Expert manager invests this money.\n"
                "Profits/losses shared among all 1,000.\n\n"
                "*Why it's great:*\n"
                "• Expert manages your money\n"
                "• Start with just ₹500\n"
                "• Diversified (not all eggs in one basket)\n\n"
                "*Types:*\n"
                "🟢 Equity (stocks) — high return, high risk\n"
                "🟡 Debt (bonds) — medium return, low risk\n"
                "🔵 Hybrid (mix) — balanced"
            ),
            "credit score": (
                "📚 *Credit Score = Your Financial Reputation*\n\n"
                "Banks check this number before lending you money.\n"
                "Range: 300–900 (higher = better)\n\n"
                "*What affects it:*\n"
                "✅ Paying bills on time (+)\n"
                "❌ Missing payments (−−)\n"
                "✅ Low credit usage (+)\n"
                "❌ Too many loan applications (−)\n\n"
                "*Score meaning:*\n"
                "750+ = Excellent (lowest interest rates)\n"
                "650-749 = Good (decent rates)\n"
                "Below 650 = Needs work\n\n"
                "Want me to help improve yours?"
            ),
            "fd": (
                "📚 *FD = Fixed Deposit*\n\n"
                "Give ₹1,00,000 to bank for 1 year.\n"
                "Bank gives you ~7% interest = ₹7,000.\n"
                "After 1 year: ₹1,07,000 back.\n\n"
                "*Pros:* Safe, guaranteed returns\n"
                "*Cons:* Low returns, locked money, tax on interest\n\n"
                "💡 Better alternative: Liquid fund (6-7% returns, withdraw anytime)"
            ),
            "nps": (
                "📚 *NPS = National Pension System*\n\n"
                "Government retirement savings plan.\n"
                "You invest monthly, get tax benefits NOW,\n"
                "and a pension LATER when you retire.\n\n"
                "*Tax benefit:* Extra ₹50,000 deduction under 80CCD(1B)\n"
                "*Returns:* 8-10% historically\n\n"
                "Great if: You're salaried and want to save tax + build retirement fund."
            ),
        }

        key = concept.lower().strip()
        for term, explanation in concepts.items():
            if term in key:
                return explanation

        return (
            f"📚 *{concept}*\n\n"
            f"Great question! Let me explain this in simple terms.\n\n"
            f"Send me the term and I'll break it down in a way that makes sense 💡\n\n"
            f"*Common terms I can explain:*\n"
            f"• SIP, Mutual Fund, FD, NPS\n"
            f"• Credit Score, EMI, CIBIL\n"
            f"• Tax saving, 80C, HRA\n"
            f"• PPF, ELSS, Index Fund"
        )

    # ============ AGENT 9: PROACTIVE MESSAGING ============
    def morning_briefing(self, user_context: dict) -> str:
        """Generate morning briefing message."""
        name = user_context.get("name", "there")
        budget_today = user_context.get("daily_budget", 1000)
        yesterday_spent = user_context.get("yesterday_spent", 0)
        yesterday_budget = user_context.get("daily_budget", 1000)
        streak = user_context.get("logging_streak", 0)

        status = "✅ Under budget" if yesterday_spent <= yesterday_budget else "⚠️ Over budget"

        msg = f"☀️ *Good morning, {name}!*\n━━━━━━━━━━━━━━━━\n\n"

        if yesterday_spent > 0:
            msg += f"Yesterday: ₹{yesterday_spent:,} spent {status}\n"
        msg += f"Today's budget: ₹{budget_today:,}\n"

        if streak > 0:
            msg += f"\n🔥 Tracking streak: {streak} days!"
            if streak % 7 == 0:
                msg += " 🎉"

        # Habits reminder
        habits = user_context.get("habits", [])
        if habits:
            pending = [h["name"] for h in habits if not h.get("completed_today")]
            if pending:
                msg += f"\n\n📋 *Today's habits:*\n"
                for h in pending[:3]:
                    msg += f"⬜ {h}\n"

        msg += f"\n\nWin today 💪"
        return msg

    def evening_checkin(self, user_context: dict) -> str:
        """Generate evening check-in message."""
        name = user_context.get("name", "there")
        today_spent = user_context.get("today_spent", 0)
        budget = user_context.get("daily_budget", 1000)
        remaining = budget - today_spent

        msg = f"🌙 *Evening, {name}!*\n━━━━━━━━━━━━━\n\n"
        msg += f"Today's spending: ₹{today_spent:,}\n"

        if remaining > 0:
            msg += f"Budget remaining: ₹{remaining:,} ✅\n"
        else:
            msg += f"Over budget by: ₹{abs(remaining):,} ⚠️\n"

        msg += (
            f"\nAny expenses I missed?\n"
            f"Reply with amount or say 'all logged ✓'"
        )
        return msg

    # ============ AGENT 10: VIRAL MOMENT GENERATOR ============
    def generate_achievement(self, achievement_type: str, user_context: dict) -> str:
        """Generate share-worthy achievement messages."""
        name = user_context.get("name", "there")

        achievements = {
            "goal_50": (
                f"🎉 *HALFWAY THERE!*\n\n"
                f"{name} just hit 50% of their savings goal!\n\n"
                f"That's real discipline 💪\n\n"
                f"Want to inspire your friends?\n"
                f"Reply 'share' to send them your achievement!"
            ),
            "goal_complete": (
                f"🎉🎉🎉 *GOAL ACHIEVED!!!*\n\n"
                f"You did it, {name}!\n\n"
                f"This is HUGE. You set a goal, stuck with it,\n"
                f"and actually made it happen.\n\n"
                f"You're not just 'trying to save.'\n"
                f"You're someone who *DOES IT*. 💪\n\n"
                f"Share this win? Reply 'share'"
            ),
            "streak_7": f"🔥 *7-DAY STREAK!* Week 1 done, {name}! You're building a real habit 💪",
            "streak_30": (
                f"🔥🔥🔥 *30-DAY STREAK!!!*\n\n"
                f"1 MONTH of daily tracking!\n\n"
                f"Research says: 21 days = habit formed.\n"
                f"You're at 30. This is WHO YOU ARE now.\n\n"
                f"You're a financial champion, {name} 🏆"
            ),
            "streak_100": f"💯 *100-DAY STREAK!* {name}, you're in the top 1% of financial trackers. Legend status 🏅",
            "under_budget_week": f"💚 *Under budget all week!* That's ₹{user_context.get('saved_this_week', 0):,} saved. Compound that over a year = serious money 📈",
            "first_expense": f"🎉 *First expense logged!* Welcome to the journey, {name}! Track daily and watch the magic happen ✨",
        }

        return achievements.get(achievement_type,
            f"🎉 Great job, {name}! Keep going! 💪")

    def generate_share_message(self, user_context: dict) -> str:
        """Generate a shareable message for viral growth."""
        name = user_context.get("name", "there")
        savings = user_context.get("total_saved", 0)
        streak = user_context.get("logging_streak", 0)
        score = user_context.get("financial_health_score", 0)

        return (
            f"💰 *{name}'s Financial Update*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"💵 Saved: ₹{savings:,}\n"
            f"🔥 Streak: {streak} days\n"
            f"📈 Health Score: {score}/100\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"I track my money with MoneyViya 🚀\n"
            f"Free AI financial assistant on WhatsApp\n"
            f"Try it: wa.me/YOUR_NUMBER"
        )


# Singleton instance
founder_agents = FounderAgents()
