"""
MoneyViya 2.0 — Life Intelligence Agents
==========================================
5 Advanced Agents that transform MoneyViya into a complete AI Life Manager.

Agents:
1. HabitAgent — Habit tracking, streaks, gamification, routines
2. PainDetectorAgent — Proactive problem detection from user data
3. DailySuggestionEngine — Morning/evening briefings
4. WeeklyReflectionAgent — Sunday reviews & life analysis
5. GoalSynthesisAgent — Cross-domain goal connections & accountability
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random


# ═══════════════════════════════════════════════════════════════
# HABIT AGENT — Build life-changing habits & streaks
# ═══════════════════════════════════════════════════════════════

class HabitAgent:
    """Helps users build sustainable habits with streaks, 
    gamification, morning/evening routines, and behavioral science."""
    
    MILESTONE_MESSAGES = {
        7: ("🔥", "One week streak!"),
        14: ("⭐", "Two weeks! Habit is forming!"),
        21: ("💎", "21 days — habit solidified!"),
        30: ("🏆", "One month! You're a different person now!"),
        50: ("🎖️", "50 days! Elite discipline!"),
        100: ("👑", "Centurion! This is who you are now."),
        365: ("🌟", "ONE YEAR! Legendary commitment!"),
    }
    
    HABIT_TEMPLATES = {
        "fitness": {"name": "Exercise", "emoji": "🏋️", "duration": "30 min", "frequency": "daily"},
        "reading": {"name": "Read", "emoji": "📚", "duration": "20 pages", "frequency": "daily"},
        "coding": {"name": "Code Practice", "emoji": "💻", "duration": "1 hour", "frequency": "daily"},
        "meditation": {"name": "Meditate", "emoji": "🧘", "duration": "10 min", "frequency": "daily"},
        "expense_log": {"name": "Log Expenses", "emoji": "📝", "duration": "5 min", "frequency": "daily"},
        "journaling": {"name": "Journal", "emoji": "✍️", "duration": "10 min", "frequency": "daily"},
        "water": {"name": "Drink 3L Water", "emoji": "💧", "duration": "all day", "frequency": "daily"},
        "no_sugar": {"name": "No Sugar", "emoji": "🚫🍬", "duration": "all day", "frequency": "daily"},
        "early_wake": {"name": "Wake by 6 AM", "emoji": "⏰", "duration": "wake up", "frequency": "daily"},
        "networking": {"name": "LinkedIn Post", "emoji": "🔗", "duration": "15 min", "frequency": "weekly"},
    }
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        habits = user.get("habits", [])
        
        # Habit creation
        if any(w in msg_lower for w in ["start habit", "new habit", "create habit",
                                         "build habit", "habit start"]):
            return self._create_habit_menu(user)
        
        # Check-in
        if any(w in msg_lower for w in ["habit check", "check in", "daily check",
                                         "did it", "completed", "habit done"]):
            return self._habit_checkin(user)
        
        # Streak check
        if any(w in msg_lower for w in ["streak", "my streak", "habit streak",
                                         "how many days"]):
            return self._show_streaks(user)
        
        # Morning routine
        if any(w in msg_lower for w in ["morning routine", "morning plan",
                                         "wake up routine", "subah"]):
            return self._morning_routine(user)
        
        # Evening routine
        if any(w in msg_lower for w in ["evening routine", "night routine",
                                         "bedtime routine", "raat"]):
            return self._evening_routine(user)
        
        # Habit suggestions
        if any(w in msg_lower for w in ["suggest habit", "which habit",
                                         "best habit", "habit ideas"]):
            return self._suggest_habits(user)
        
        # Habit report
        if any(w in msg_lower for w in ["habit report", "habit progress",
                                         "habit stats", "habit analytics"]):
            return self._habit_report(user)
        
        return self._habit_overview(user)
    
    def _create_habit_menu(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""✨ *{name}, let's build a new habit!*

Choose a habit to start:

1️⃣ 🏋️ *Exercise* — 30 min daily
2️⃣ 📚 *Read* — 20 pages daily
3️⃣ 💻 *Code Practice* — 1 hour daily
4️⃣ 🧘 *Meditate* — 10 min daily
5️⃣ 📝 *Log Expenses* — 5 min daily
6️⃣ ✍️ *Journal* — 10 min daily
7️⃣ 💧 *Drink 3L Water* — daily
8️⃣ ⏰ *Wake by 6 AM* — daily
9️⃣ 🔗 *LinkedIn Post* — weekly
🔟 *Custom* — Create your own!

*Science says:* Start with just 1-2 habits.
More than 3 new habits at once = failure rate 90%.

_Reply with the number or describe your custom habit!_

💡 *Pro tip:* Start tiny — 5 minutes, not 60. 
Build the streak first, increase intensity later."""
    
    def _habit_checkin(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        habits = user.get("habits", [])
        
        if not habits:
            habits = [
                {"name": "Exercise", "emoji": "🏋️", "streak": 0},
                {"name": "Expense Logging", "emoji": "📝", "streak": 0},
                {"name": "Reading", "emoji": "📚", "streak": 0},
            ]
        
        habit_lines = []
        for h in habits[:6]:
            streak = h.get("streak", 0)
            emoji = h.get("emoji", "✅")
            name_h = h.get("name", "Habit")
            streak_text = f" (🔥 {streak} days)" if streak > 0 else ""
            habit_lines.append(f"{emoji} *{name_h}*{streak_text} — [Yes] [No] [Partial]")
        
        habits_text = "\n".join(habit_lines)
        
        return f"""📋 *Evening Habit Check-in*

Hey {name}! Did you complete these today?

{habits_text}

_Reply with Yes/No/Partial for each habit._
_Example: "Yes, No, Yes, Partial"_

💡 *Remember:* Partial still counts! 
20 min gym instead of 30? That's still progress 💪

_Missed one? That's okay — tomorrow is a fresh start!_"""
    
    def _show_streaks(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        habits = user.get("habits", [])
        
        if not habits:
            return f"""📊 *{name}'s Habit Streaks*

No habits tracked yet! 

Start your first habit:
Type \"start habit\" to begin your journey 🚀

*Fun fact:* People who track habits are 40% more likely to achieve their goals!"""
        
        lines = []
        total_streak = 0
        for h in habits:
            streak = h.get("streak", 0)
            longest = h.get("longest_streak", streak)
            emoji = h.get("emoji", "✅")
            name_h = h.get("name", "Habit")
            total_streak += streak
            
            # Check for milestone
            milestone = ""
            for days, (m_emoji, m_text) in self.MILESTONE_MESSAGES.items():
                if streak == days:
                    milestone = f"\n   {m_emoji} *{m_text}*"
                    break
            
            fire = "🔥" * min(streak // 7, 5) if streak > 0 else "💤"
            lines.append(f"{emoji} *{name_h}*\n   Current: {streak} days {fire}\n   Best: {longest} days{milestone}")
        
        streaks_text = "\n\n".join(lines)
        
        return f"""📊 *{name}'s Habit Dashboard*
━━━━━━━━━━━━━━━━━━━━━━━━━

{streaks_text}

━━━━━━━━━━━━━━━━━━━━━━━━━
🏅 *Total Streak Points:* {total_streak}
📈 *Consistency Score:* {min(total_streak * 5, 100)}%

_Keep going! Every day counts! 🚀_"""
    
    def _morning_routine(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        
        routines = {
            "student": f"""☀️ *{name}'s Morning Routine (Student)*

⏰ 6:30 AM — Wake up (no snooze!)
🥤 6:35 AM — Water + stretch (5 min)
🧘 6:40 AM — Meditation (10 min)
📚 6:50 AM — Study/revision (45 min)
🍳 7:35 AM — Breakfast
📱 7:50 AM — Check MoneyViya (log yesterday's expenses)
🚶 8:00 AM — Leave for college

*Why this works:*
• Study in the morning = 42% better retention
• Meditation = less exam anxiety
• Expense logging = financial awareness

_Want me to set daily reminders? Type \"remind me\"_""",
            
            "salaried": f"""☀️ *{name}'s Morning Routine (Professional)*

⏰ 6:00 AM — Wake up (alarm across room!)
💧 6:05 AM — Water + 5 min stretch
🧘 6:10 AM — Meditation (10 min)
🏋️ 6:20 AM — Exercise (30 min)
🚿 6:50 AM — Shower
🍳 7:00 AM — Healthy breakfast
📱 7:15 AM — Check MoneyViya + plan day
📰 7:25 AM — Industry news (10 min)
🚗 7:35 AM — Commute + audiobook/podcast

*The math:*
• 30 min exercise = 2x energy all day
• Morning planning = 35% more productive
• This routine makes you top 5% performer

_Type \"plan my day\" for today's priority list!_""",
            
            "freelancer": f"""☀️ *{name}'s Morning Routine (Freelancer)*

⏰ 7:00 AM — Natural wake (no alarm anxiety!)
💧 7:05 AM — Water + stretch
☕ 7:10 AM — Coffee + journal (10 min)
📱 7:20 AM — Check MoneyViya (income/expenses)
📧 7:30 AM — Client emails (30 min MAX)
💻 8:00 AM — Deep work block (2 hours, no distractions)
☕ 10:00 AM — Break
💻 10:15 AM — Continue work

*Freelancer secret:*
• Deep work BEFORE emails = 3x output
• 2-hour morning block = your most valuable time
• Journal = clarity on priorities

_Track your productive hours with \"focus\" command!_""",
            
            "homemaker": f"""☀️ *{name}'s Morning Routine*

⏰ 6:00 AM — Wake up
🙏 6:05 AM — Prayer/meditation (10 min)
💧 6:15 AM — Water + light exercise (15 min)
🍳 6:30 AM — Breakfast prep for family
☕ 7:30 AM — Your breakfast + check MoneyViya
📱 7:45 AM — Plan day's expenses/tasks
📝 8:00 AM — Household tasks begin

*Your power hour:*
2:00-3:00 PM = Skill building time!
(Online course, tutoring prep, or side income work)

_Type \"skill ideas\" for income-building suggestions!_""",
        }
        
        return routines.get(persona, routines["salaried"])
    
    def _evening_routine(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        
        return f"""🌙 *{name}'s Ideal Evening Routine*

🏠 7:00 PM — Home + unwind (15 min)
🍽️ 7:15 PM — Dinner (preferably home-cooked)
📝 8:00 PM — Habit check-in (MoneyViya)
📊 8:10 PM — Review today's expenses
📅 8:20 PM — Plan tomorrow (top 3 priorities)
📚 8:30 PM — Read / Learn (30 min)
📵 9:00 PM — Screen off (blue light = bad sleep)
🧘 9:05 PM — Stretch + gratitude journal
😴 9:30 PM — Sleep target

*Why screen-off at 9 PM?*
• Blue light delays melatonin by 3 hours
• 7-8 hours sleep = 25% better decisions
• Better sleep = less impulse spending (proven!)

*Evening check-in saves you money:*
People who review expenses daily save 30% more!

_Type \"habit check\" to do your evening check-in now!_"""
    
    def _suggest_habits(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        goals = user.get("goals", [])
        
        suggestions = {
            "student": [
                ("📚 Study 2 hours daily", "Top 10% grades → better placement → higher salary"),
                ("💻 Code 1 hour daily", "6 months = job-ready → ₹6-12L package"),
                ("📝 Log expenses daily", "Financial awareness → save ₹2,000/month"),
                ("🏋️ Exercise 30 min", "2x energy → study more → better results"),
            ],
            "salaried": [
                ("💻 Skill upgrade 1 hour", "6 months → 30% salary hike"),
                ("📝 Log expenses daily", "Awareness → save 20% more"),
                ("📚 Read 20 pages daily", "52 books/year → top 1% knowledge"),
                ("🔗 LinkedIn post weekly", "3x career opportunities"),
            ],
            "freelancer": [
                ("💰 Client outreach daily", "5 msgs/day → 2-3 new clients/month"),
                ("📝 Invoice tracking daily", "Never miss a payment again"),
                ("💻 Portfolio update weekly", "Fresh work → higher rates"),
                ("🧘 Meditation 10 min", "30% less stress → better client work"),
            ],
            "homemaker": [
                ("📝 Track household expenses", "Save ₹3,000-5,000/month"),
                ("📚 Learn 30 min daily", "New skill → income opportunity"),
                ("🏋️ Exercise 20 min", "More energy for family + you"),
                ("🍳 Meal plan weekly", "Save ₹1,500/week on groceries"),
            ],
        }
        
        habit_list = suggestions.get(persona, suggestions["salaried"])
        lines = []
        for i, (habit, impact) in enumerate(habit_list, 1):
            lines.append(f"{i}️⃣ *{habit}*\n   → {impact}")
        
        habits_text = "\n\n".join(lines)
        
        return f"""💡 *Habit Suggestions for {name}*

Based on your profile, these habits will have the BIGGEST impact:

{habits_text}

*The Compound Effect:*
• 1 good habit = small improvement
• 4 good habits = life transformation
• Start with #1, add one every 2 weeks

🧠 *Science:* It takes 21 days to form a habit, 
66 days to make it automatic.

_Type \"start habit\" to begin!_ 🚀"""
    
    def _habit_report(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        habits = user.get("habits", [])
        
        return f"""📊 *{name}'s Weekly Habit Report*
━━━━━━━━━━━━━━━━━━━━━━━━━

🏋️ *Exercise:* 5/7 days (71%) ✅
   → Streak: 12 days 🔥🔥
   → Missed: Saturday, Sunday

📝 *Expense Logging:* 7/7 days (100%) 🎯
   → Perfect streak: 23 days! 💎
   
💻 *Coding Practice:* 4/7 days (57%) ⚠️
   → Streak: 2 days
   → Pattern: Skip after long work days

📚 *Reading:* 6/7 days (86%) ✅
   → 140 pages this week!
   
━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 *AI Insights:*
• You skip exercise on weekends → Try home workouts
• Coding drops when tired → Switch to mornings?
• Reading is strong → You'll finish your book by Friday!

📈 *Overall Score: 78%* (up from 72% last week!)

_Keep it up! You're building the life you want 🚀_"""
    
    def _habit_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🎯 *{name}'s Habit Center*

I can help you with:

1️⃣ *Start New Habit* → Type \"start habit\"
2️⃣ *Daily Check-in* → Type \"habit check\"  
3️⃣ *View Streaks* → Type \"streak\"
4️⃣ *Morning Routine* → Type \"morning routine\"
5️⃣ *Evening Routine* → Type \"evening routine\"
6️⃣ *Habit Suggestions* → Type \"suggest habit\"
7️⃣ *Weekly Report* → Type \"habit report\"

💡 *Why habits matter:*
\"We are what we repeatedly do. 
Excellence is not an act, but a habit.\"
— Aristotle

_Your habits shape your destiny. Let's build great ones!_ 🌟"""


# ═══════════════════════════════════════════════════════════════
# PAIN DETECTOR AGENT — Proactive problem detection
# ═══════════════════════════════════════════════════════════════

class PainDetectorAgent:
    """Identifies user struggles BEFORE they become crises.
    Monitors spending patterns, habit drops, goal stagnation,
    and emotional signals to proactively intervene."""
    
    def analyze(self, user: Dict) -> Optional[str]:
        """Run pain point analysis. Returns intervention message or None."""
        name = user.get("name", "Friend")
        pain_points = []
        
        # 1. Financial pain points
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        savings = user.get("current_savings", 0)
        
        if income > 0 and expenses > 0:
            if expenses > income * 0.9:
                pain_points.append(("finance", "high", 
                    f"You're spending {int(expenses/income*100)}% of income. Emergency!"))
            
            emergency_months = savings / expenses if expenses > 0 else 0
            if emergency_months < 3:
                pain_points.append(("finance", "medium",
                    f"Emergency fund: only {emergency_months:.1f} months. Need 3+."))
        
        # 2. Habit pain points
        habits = user.get("habits", [])
        declining_habits = [h for h in habits if h.get("completion_rate", 100) < 50]
        if declining_habits:
            names = ", ".join([h.get("name", "?") for h in declining_habits[:3]])
            pain_points.append(("habits", "medium",
                f"Struggling with: {names} (<50% completion)"))
        
        # 3. Goal stagnation
        goals = user.get("goals", [])
        stagnant = [g for g in goals if g.get("days_since_progress", 0) > 30]
        if stagnant:
            names = ", ".join([g.get("name", "?") for g in stagnant[:2]])
            pain_points.append(("goals", "medium",
                f"Goals stalled 30+ days: {names}"))
        
        if not pain_points:
            return None
        
        # Build intervention message
        return self._build_intervention(name, pain_points)
    
    def _build_intervention(self, name: str, pain_points: list) -> str:
        critical = [p for p in pain_points if p[1] == "high"]
        medium = [p for p in pain_points if p[1] == "medium"]
        
        msg = f"💙 *{name}, let's talk...*\n\nI noticed a few things:\n\n"
        
        for category, severity, description in pain_points[:3]:
            emoji = "🚨" if severity == "high" else "⚠️"
            msg += f"{emoji} {description}\n\n"
        
        msg += """I'm not judging — I'm here to help.

*Want to tackle one of these?*
Just reply with what's on your mind, or type:
• \"fix budget\" for spending help
• \"motivation\" for a boost
• \"plan\" to make a comeback plan

_You've overcome harder things. Let's do this! 💪_"""
        
        return msg
    
    def detect_from_message(self, message: str, user: Dict) -> Optional[str]:
        """Detect pain points from message sentiment."""
        msg_lower = message.lower()
        name = user.get("name", "Friend")
        
        # Frustration signals
        if any(w in msg_lower for w in ["i can't", "give up", "what's the point",
                                         "tired of", "fed up", "no use"]):
            return f"""💙 *{name}, I hear you.*

It sounds like you're going through a tough time. That's completely normal — everyone hits rough patches.

*Here's what I know about you:*
✅ You started tracking your money (most people never do)
✅ You set goals (that takes courage)
✅ You're still here (that's strength)

*Let's take it one step at a time:*
1. Forget the big goals for today
2. Do ONE small thing that makes you feel good
3. Come back to me tomorrow — we'll figure this out together

_\"Fall seven times, stand up eight.\" — Japanese proverb_

Type \"small win\" for one easy thing you can do right now 🌟"""
        
        # Stress about money
        if any(w in msg_lower for w in ["stressed about money", "no money",
                                         "broke", "can't save", "debt"]):
            return f"""💰 *{name}, money stress is real — let's tackle it.*

First: You're not alone. 73% of Indians feel financial stress.

*Quick Assessment:*
1. Is this a cash flow problem? (spending > income)
2. Is this a debt problem? (EMIs eating your salary)
3. Is this an income problem? (not earning enough)

*Immediate Relief Actions:*
🔍 Type \"show spending\" — let's find ₹2,000 to save
📋 Type \"debt plan\" — I'll create a payoff strategy
💰 Type \"earn more\" — let's boost your income

_Money problems are solvable. Every millionaire started somewhere._ 

What feels like the biggest issue right now?"""
        
        return None


# ═══════════════════════════════════════════════════════════════
# DAILY SUGGESTION ENGINE — Morning & Evening Intelligence
# ═══════════════════════════════════════════════════════════════

class DailySuggestionEngine:
    """Provides personalized morning briefings and evening check-ins
    based on user's complete state."""
    
    def morning_briefing(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        persona = user.get("persona", "salaried")
        income = user.get("monthly_income", 0)
        daily_budget = user.get("daily_budget", 1000)
        today_spent = user.get("today_expenses", 0)
        goals = user.get("goals", [])
        habits = user.get("habits", [])
        
        day = datetime.now().strftime("%A")
        date = datetime.now().strftime("%B %d, %Y")
        
        # Day-specific energy
        day_energy = {
            "Monday": "💪 Fresh start energy! Let's crush this week.",
            "Tuesday": "📈 Momentum Tuesday — keep the pace!",
            "Wednesday": "⚡ Midweek — stay strong, you're halfway!",
            "Thursday": "🎯 Almost there! One more push.",
            "Friday": "🎉 Friday vibes! End the week strong.",
            "Saturday": "🌟 Weekend = growth time! Learn something new.",
            "Sunday": "🧘 Reflection day. Review + recharge.",
        }
        
        # Goal progress
        goal_text = ""
        if goals:
            g = goals[0]
            progress = g.get("progress", 0)
            target = g.get("name", "Goal")
            goal_text = f"\n🎯 *{target}:* {progress}% complete"
        
        # Habit streaks
        habit_text = ""
        if habits:
            top_habit = max(habits, key=lambda h: h.get("streak", 0), default={})
            if top_habit.get("streak", 0) > 0:
                habit_text = f"\n🔥 *Top streak:* {top_habit.get('name', 'Habit')} — {top_habit.get('streak', 0)} days!"
        
        budget_left = daily_budget - today_spent
        
        return f"""☀️ *Good Morning, {name}!*
📅 {day}, {date}

{day_energy.get(day, "🌟 Let's make today count!")}

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Today's Budget:* ₹{int(daily_budget):,}
💸 *Spent so far:* ₹{int(today_spent):,}
✅ *Remaining:* ₹{int(max(budget_left, 0)):,}{goal_text}{habit_text}
━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *Today's Suggestion:*
{self._get_daily_suggestion(user, day)}

_Ready to win today? 🚀_"""
    
    def evening_checkin(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income_today = user.get("today_income", 0)
        expenses_today = user.get("today_expenses", 0)
        daily_budget = user.get("daily_budget", 1000)
        net = income_today - expenses_today
        
        budget_status = "under" if expenses_today < daily_budget else "over"
        budget_emoji = "✅" if budget_status == "under" else "⚠️"
        budget_diff = abs(daily_budget - expenses_today)
        
        return f"""🌙 *Good Evening, {name}!*

📊 *Today's Summary:*
💵 Income: ₹{int(income_today):,}
💸 Spent: ₹{int(expenses_today):,}
{budget_emoji} *₹{int(budget_diff):,} {budget_status} budget*

✅ *Habit Check-in:*
Type \"habit check\" to log your habits for today.

💡 *Missing transactions?*
Any cash spending to add? Type the amount.
Example: \"coffee 50\" or \"auto 120\"

🧘 *Wind Down:*
Great day! Screens off by 10 PM = better sleep = better tomorrow.

_How was your day? Share anything! 💚_"""
    
    def _get_daily_suggestion(self, user: Dict, day: str) -> str:
        persona = user.get("persona", "salaried")
        
        suggestions = {
            "Monday": [
                "🎯 Plan your 3 biggest priorities for the week.",
                "💰 Set a weekly budget target and stick to it.",
                "📚 Start/continue a learning course today.",
            ],
            "Tuesday": [
                "💻 Dedicate 1 hour to skill development.",
                "🔗 Post something valuable on LinkedIn.",
                "📝 Review yesterday's expenses — any surprises?",
            ],
            "Wednesday": [
                "🧘 Midweek stress check. Take 10 min for yourself.",
                "💰 Check if you're on track for weekly budget.",
                "📞 Call someone you've been meaning to connect with.",
            ],
            "Thursday": [
                "📊 Review your habit streaks. Almost weekend!",
                "💡 Research one passive income idea today.",
                "📚 Read 20 pages of something inspiring.",
            ],
            "Friday": [
                "💰 Weekend budget: Set a limit before fun begins!",
                "🎉 Celebrate one win from this week (you deserve it!).",
                "📋 Do your weekly expense review.",
            ],
            "Saturday": [
                "📚 Dedicate 2 hours to learning/side project.",
                "🏋️ Longer workout today — you have time!",
                "💰 Meal prep for next week (saves ₹1,500+).",
            ],
            "Sunday": [
                "📊 Type \"weekly review\" for your full week analysis.",
                "📅 Plan next week's priorities and budget.",
                "🧘 Rest + recharge. Self-care is productive!",
            ],
        }
        
        day_suggestions = suggestions.get(day, suggestions["Monday"])
        return random.choice(day_suggestions)


# ═══════════════════════════════════════════════════════════════
# WEEKLY REFLECTION AGENT — Sunday Reviews
# ═══════════════════════════════════════════════════════════════

class WeeklyReflectionAgent:
    """Facilitates deep reflection on the past week and 
    strategic planning for the next."""
    
    def generate_review(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        
        # Financial data
        weekly_income = user.get("weekly_income", 0)
        weekly_expenses = user.get("weekly_expenses", 0)
        weekly_net = weekly_income - weekly_expenses
        prev_week_expenses = user.get("prev_week_expenses", weekly_expenses)
        expense_change = ((weekly_expenses - prev_week_expenses) / prev_week_expenses * 100) if prev_week_expenses > 0 else 0
        
        # Habit data
        habits = user.get("habits", [])
        
        # Build habit section
        habit_lines = []
        for h in habits[:5]:
            name_h = h.get("name", "Habit")
            completed = h.get("completed_this_week", 0)
            total = h.get("target_this_week", 7)
            pct = int(completed / total * 100) if total > 0 else 0
            emoji = "🎯" if pct == 100 else "✅" if pct >= 70 else "⚠️" if pct >= 50 else "❌"
            streak = h.get("streak", 0)
            habit_lines.append(f"{emoji} *{name_h}:* {completed}/{total} days ({pct}%) — Streak: {streak}d")
        
        habits_text = "\n".join(habit_lines) if habit_lines else "_No habits tracked this week._"
        
        # Goals
        goals = user.get("goals", [])
        goal_lines = []
        for g in goals[:3]:
            g_name = g.get("name", "Goal")
            progress = g.get("progress", 0)
            added = g.get("added_this_week", 0)
            goal_lines.append(f"🎯 *{g_name}:* {progress}% (+{added}% this week)")
        
        goals_text = "\n".join(goal_lines) if goal_lines else "_No active goals._"
        
        net_emoji = "🟢" if weekly_net > 0 else "🔴"
        change_emoji = "📈" if expense_change < 0 else "📉" if expense_change > 0 else "➡️"
        
        return f"""📊 *{name}'s WEEKLY REVIEW*
━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *MONEY*
💵 Income: ₹{int(weekly_income):,}
💸 Expenses: ₹{int(weekly_expenses):,}
{net_emoji} Net: ₹{int(weekly_net):,}
{change_emoji} vs Last Week: {expense_change:+.1f}%

━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *HABITS*
{habits_text}

━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *GOALS*
{goals_text}

━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 *AI INSIGHTS*
{self._generate_insights(user)}

━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *NEXT WEEK PLAN*
{self._next_week_plan(user)}

━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *REFLECTION QUESTION*
{self._reflection_question()}

_Reply with your answer — self-awareness is the first step to growth! 🌱_"""
    
    def _generate_insights(self, user: Dict) -> str:
        insights = []
        
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        
        if income > 0 and expenses > income * 0.8:
            insights.append("💡 Spending is tight. Focus on reducing top category.")
        
        habits = user.get("habits", [])
        low_habits = [h for h in habits if h.get("completion_rate", 100) < 60]
        if low_habits:
            h = low_habits[0]
            insights.append(f"💡 {h.get('name', 'Habit')} is struggling. Try making it smaller/easier.")
        
        if not insights:
            insights.append("💡 You're doing well! Look for opportunities to level up.")
            insights.append("💡 Consider adding a new habit or increasing an existing one.")
        
        return "\n".join(insights[:3])
    
    def _next_week_plan(self, user: Dict) -> str:
        persona = user.get("persona", "salaried")
        plans = {
            "student": "1. Complete 2 course modules\n2. Stay under budget\n3. Exercise 5/7 days",
            "salaried": "1. One career development action\n2. Stay on budget\n3. Don't miss gym 3+ days",
            "freelancer": "1. Reach out to 3 potential clients\n2. Complete pending invoices\n3. Skill upgrade 5 hours",
            "homemaker": "1. Try one new money-saving hack\n2. 30 min daily skill building\n3. Track every expense",
        }
        return plans.get(persona, plans["salaried"])
    
    def _reflection_question(self) -> str:
        questions = [
            "What was your best financial decision this week?",
            "If you could redo one purchase, what would it be?",
            "What made you happiest this week?",
            "Which habit was hardest? What made it hard?",
            "What's one thing you learned about yourself?",
            "Who made your week better? (Thank them!)",
            "What will you do differently next week?",
            "What are you most grateful for this week?",
        ]
        return random.choice(questions)


# ═══════════════════════════════════════════════════════════════
# GOAL SYNTHESIS AGENT — Cross-domain connections
# ═══════════════════════════════════════════════════════════════

class GoalSynthesisAgent:
    """Connects goals across domains, shows compound effects,
    decomposes big goals, and provides accountability."""
    
    def process(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        if any(w in msg_lower for w in ["set goal", "new goal", "create goal",
                                         "i want to", "my goal"]):
            return self._create_goal(message, user)
        
        if any(w in msg_lower for w in ["goal progress", "goal status", "my goals",
                                         "check goals"]):
            return self._goal_status(user)
        
        if any(w in msg_lower for w in ["goal plan", "how to achieve", "goal roadmap",
                                         "break down"]):
            return self._decompose_goal(user)
        
        if any(w in msg_lower for w in ["connect goals", "goal connections", 
                                         "how goals relate"]):
            return self._show_connections(user)
        
        return self._goal_overview(user)
    
    def _create_goal(self, message: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        
        return f"""🎯 *Let's set a powerful goal, {name}!*

What type of goal?

💰 *Financial Goals:*
1️⃣ Emergency fund (3 months expenses)
2️⃣ Buy something specific (bike, laptop, phone)
3️⃣ Pay off debt
4️⃣ Save ₹X by date

💼 *Career Goals:*
5️⃣ Get promoted / salary hike
6️⃣ Switch to better job
7️⃣ Learn new skill / certification

🎓 *Learning Goals:*
8️⃣ Complete a course
9️⃣ Build portfolio projects

💪 *Life Goals:*
🔟 Build consistent habits
1️⃣1️⃣ Improve health & fitness

_Reply with the number or describe your goal!_

💡 *SMART Goals work best:*
❌ \"I want to save money\"
✅ \"Save ₹50,000 by December for a laptop\"

_Be specific — I'll create the complete plan!_"""
    
    def _goal_status(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        goals = user.get("goals", [])
        
        if not goals:
            return f"""🎯 *{name}'s Goals*

No active goals yet! 

Setting goals makes you 42% more likely to achieve them.
Type \"set goal\" to create your first goal! 🚀"""
        
        lines = []
        for g in goals:
            g_name = g.get("name", "Goal")
            progress = g.get("progress", 0)
            target = g.get("target_amount", 0)
            current = g.get("current_amount", 0)
            deadline = g.get("deadline", "No deadline")
            
            # Progress bar
            filled = int(progress / 10)
            bar = "█" * filled + "░" * (10 - filled)
            
            status_emoji = "🟢" if progress >= 70 else "🟡" if progress >= 40 else "🔴"
            
            lines.append(f"""{status_emoji} *{g_name}*
   [{bar}] {progress}%
   💰 ₹{int(current):,} / ₹{int(target):,}
   📅 Deadline: {deadline}""")
        
        goals_text = "\n\n".join(lines)
        
        return f"""🎯 *{name}'s Goal Dashboard*
━━━━━━━━━━━━━━━━━━━━━━━━━

{goals_text}

━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *How goals connect:*
Learning → Better skills → Higher income → Goals faster!

_Type \"goal plan\" for breakdown of any goal_"""
    
    def _decompose_goal(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        
        if not income:
            income = 30000
        
        savings_rate = income * 0.2
        
        return f"""📋 *{name}'s Goal Breakdown*

Let's decompose your goal into weekly actions:

*Example: Save ₹1,00,000 in 6 months*
━━━━━━━━━━━━━━━━━━━━━━━━━

📅 *Monthly target:* ₹16,667
📅 *Weekly target:* ₹4,167
📅 *Daily savings:* ₹595

*How to find ₹595/day:*
🍕 Skip 1 food delivery → Save ₹200
☕ Home coffee instead of cafe → Save ₹100
🚗 Share ride / public transport → Save ₹150
🛍️ Delay 1 impulse purchase → Save ₹145

*The Compound Plan:*

📌 *Month 1-2:* Cut expenses by ₹8,000/month
   → Find 3 expenses to reduce
   → Set up auto-transfer to savings

📌 *Month 3-4:* Add income layer
   → Start freelancing (even ₹5,000 helps)
   → Sell unused items (₹3,000-10,000 one-time)

📌 *Month 5-6:* Accelerate
   → Increase freelance to ₹10,000/month
   → Redirect bonuses/extras to goal

*Connected habits that help:*
✅ Log expenses daily (awareness)
✅ Cook 5x/week (saves ₹3,000/month)
✅ Weekly budget review (stay on track)

_This is totally achievable! Start today? 🚀_"""
    
    def _show_connections(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        
        return f"""🔗 *{name}, here's how your life goals connect:*

```
📚 Learning
 ↓ (new skills)
💼 Career Growth
 ↓ (higher income)
💰 Financial Goals
 ↓ (security)  
😌 Peace of Mind
 ↓ (energy)
🏋️ Health & Habits
 ↓ (productivity)
📚 More Learning
```

*The Virtuous Cycle:*
Every domain feeds every other domain!

*Real example:*
📚 You learn React (2 months)
→ 💼 Get freelance projects (₹15K/month extra)
→ 💰 Bike goal achieved 3 months faster
→ 😌 Less stress about money
→ 🏋️ More energy for gym
→ ⚡ Better work output
→ 📚 Learn more advanced skills
→ 💼 Even better career opportunities

*Key insight:* Focus on LEARNING first.
It's the catalyst that accelerates everything else.

_Which domain do you want to focus on? Type it!_ 🎯"""
    
    def _goal_overview(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🎯 *{name}'s Goal Center*

What would you like to do?

1️⃣ *Set New Goal* → Type \"set goal\"
2️⃣ *Check Progress* → Type \"goal progress\"
3️⃣ *Goal Breakdown* → Type \"goal plan\"
4️⃣ *See Connections* → Type \"connect goals\"

💡 *Goal Hierarchy:*
🥉 Small win → Build confidence
🥈 Medium goal → Build discipline  
🥇 Big dream → Build legacy

_Start with a small win — momentum is everything! 🚀_"""
    
    def celebrate_goal(self, goal_name: str, user: Dict) -> str:
        name = user.get("name", "Friend")
        return f"""🎉🎊 *GOAL ACHIEVED!* 🎊🎉

*{name}, you did it!*
✅ *{goal_name}* — COMPLETED! 🏆

*What this proves about you:*
✅ You set goals (takes courage)
✅ You followed through (takes discipline)
✅ You achieved it (takes persistence)

You're not the same person who started.
You're someone who *finishes what they start*.

🎯 *Ready for the next challenge?*
Type \"set goal\" to level up!

_\"The only limit to our realization of tomorrow 
is our doubts of today.\" — FDR_ 🌟"""


# ═══════════════════════════════════════════════════════════════
# SINGLETON INSTANCES
# ═══════════════════════════════════════════════════════════════

habit_agent = HabitAgent()
pain_detector = PainDetectorAgent()
daily_engine = DailySuggestionEngine()
weekly_reflection = WeeklyReflectionAgent()
goal_synthesizer = GoalSynthesisAgent()
"""
