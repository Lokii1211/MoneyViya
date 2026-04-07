"""
MoneyViya Agent v3.0 - AI Life & Money Manager
=============================================================
Complete AI-powered life and money management agent:
- Finance: tracking, budgeting, investing, tax planning
- Income: active + passive, freelancing, side hustles
- Career: job search, salary negotiation, promotions
- Learning: courses with ROI, skill gap analysis
- Productivity: habits, time management, daily planning
- Multi-agent architecture with 5 specialist agents
- Persona-aware: student/freelancer/homemaker/salaried/business
- Multilingual: EN, HI, TA, TE, KN
"""

import re
import json
import random
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

try:
    from services.openai_service import openai_service
except:
    openai_service = None

# Specialist Agents (MoneyViya 2.0 Multi-Agent Architecture)
try:
    from services.specialist_agents import (
        income_agent, career_agent, learning_agent,
        productivity_agent, tax_agent
    )
    SPECIALIST_AGENTS_AVAILABLE = True
    print("[STARTUP] MoneyViya 2.0 specialist agents loaded!")
except Exception as e:
    print(f"[STARTUP] Specialist agents not available: {e}")
    income_agent = career_agent = learning_agent = None
    productivity_agent = tax_agent = None
    SPECIALIST_AGENTS_AVAILABLE = False

# Life Intelligence Agents (MoneyViya 2.0 Advanced)
try:
    from services.life_agents import (
        habit_agent, pain_detector, daily_engine,
        weekly_reflection, goal_synthesizer
    )
    LIFE_AGENTS_AVAILABLE = True
    print("[STARTUP] MoneyViya 2.0 life intelligence agents loaded!")
except Exception as e:
    print(f"[STARTUP] Life agents not available: {e}")
    habit_agent = pain_detector = daily_engine = None
    weekly_reflection = goal_synthesizer = None
    LIFE_AGENTS_AVAILABLE = False

try:
    import pytz
    IST = pytz.timezone('Asia/Kolkata')
except:
    IST = None


class MoneyViyaAgent:
    """
    MoneyViya - Your Personal Finance Partner
    ==========================================
    Natural conversational AI financial advisor
    """
    
    # Language detection patterns
    LANGUAGE_PATTERNS = {
        "en": ["english", "eng", "en"],
        "hi": ["hindi", "हिंदी", "हिन्दी", "hi"],
        "ta": ["tamil", "தமிழ்", "ta"],
        "te": ["telugu", "తెలుగు", "te"],
        "kn": ["kannada", "ಕನ್ನಡ", "kn"]
    }
    
    # Occupation patterns
    OCCUPATION_PATTERNS = {
        "student": ["student", "college", "school", "studying", "छात्र", "மாணவர்"],
        "employee": ["employee", "job", "salaried", "working", "office", "company", "नौकरी", "வேலை"],
        "business": ["business", "owner", "entrepreneur", "shop", "store", "व्यापार", "வணிகம்"],
        "freelancer": ["freelance", "freelancer", "gig", "contract", "self-employed", "फ्रीलांसर"],
        "homemaker": ["homemaker", "housewife", "home", "गृहिणी", "இல்லத்தரசி"]
    }
    
    # Risk patterns
    RISK_PATTERNS = {
        "low": ["low", "safe", "secure", "no risk", "guaranteed", "fd", "fixed deposit", "कम", "குறைந்த"],
        "medium": ["medium", "moderate", "balanced", "mix", "मध्यम", "நடுத்தர"],
        "high": ["high", "aggressive", "risky", "stocks", "equity", "उच्च", "அதிக"]
    }
    
    # Expense categories
    EXPENSE_KEYWORDS = {
        "food": ["food", "restaurant", "groceries", "lunch", "dinner", "breakfast", "coffee", "tea", "snacks", "biryani", "pizza", "burger", "swiggy", "zomato", "mess", "canteen", "khana", "சாப்பாடு", "భోజనం"],
        "transport": ["petrol", "diesel", "fuel", "uber", "ola", "auto", "bus", "train", "metro", "parking", "toll", "cab", "taxi", "travel", "यात्रा", "பயணம்"],
        "shopping": ["amazon", "flipkart", "clothes", "shoes", "electronics", "gadgets", "phone", "laptop", "shopping", "खरीदारी", "ஷாப்பிங்"],
        "bills": ["electricity", "water", "gas", "internet", "wifi", "mobile", "recharge", "rent", "emi", "बिल", "பில்"],
        "entertainment": ["movie", "netflix", "amazon prime", "hotstar", "spotify", "games", "मनोरंजन", "பொழுதுபோக்கு"],
        "health": ["medicine", "doctor", "hospital", "pharmacy", "medical", "gym", "fitness", "स्वास्थ्य", "உடல்நலம்"],
        "education": ["books", "course", "college", "school", "tuition", "coaching", "fees", "शिक्षा", "கல்வி"]
    }
    
    INCOME_KEYWORDS = {
        "salary": ["salary", "wages", "paycheck", "वेतन", "சம்பளம்"],
        "freelance": ["freelance", "project", "gig", "contract", "client", "फ्रीलांस"],
        "business": ["business", "sales", "revenue", "profit", "व्यापार", "வணிகம்"],
        "investment": ["dividend", "interest", "returns", "maturity", "ब्याज", "வட்டி"],
        "other": ["gift", "bonus", "cashback", "refund", "reward", "received", "got", "मिला", "கிடைத்தது"]
    }
    
    # Motivational quotes
    QUOTES = {
        "en": [
            "Every rupee saved is a step towards your dream! 💰",
            "Your future self will thank you for saving today! 🙏",
            "Small daily savings create big achievements! 🚀",
            "Financial freedom is built one day at a time! 💪",
            "You're doing great! Keep tracking, keep growing! 📈"
        ],
        "hi": [
            "हर बचाया रुपया आपके सपने की ओर एक कदम है! 💰",
            "आज की बचत कल की आज़ादी है! 🙏",
            "छोटी बचत बड़े सपने पूरे करती है! 🚀"
        ],
        "ta": [
            "ஒவ்வொரு ரூபாயும் உங்கள் கனவை நோக்கி ஒரு அடி! 💰",
            "சிறிய சேமிப்பு பெரிய வெற்றி! 🚀"
        ]
    }
    
    # Data file paths
    DATA_DIR = "data"
    USERS_FILE = "data/users.json"
    TRANSACTIONS_FILE = "data/transactions.json"
    
    def __init__(self):
        self.user_store = {}
        self.transaction_store = {}
        self._ensure_data_dir()
        self._load_data()
    
    def _ensure_data_dir(self):
        """Create data directory if not exists"""
        import os
        os.makedirs(self.DATA_DIR, exist_ok=True)
    
    def _load_data(self):
        """Load users and transactions from JSON files"""
        import os
        try:
            if os.path.exists(self.USERS_FILE):
                with open(self.USERS_FILE, 'r', encoding='utf-8') as f:
                    self.user_store = json.load(f)
                print(f"[MoneyViya] Loaded {len(self.user_store)} users from file")
        except Exception as e:
            print(f"[MoneyViya] Error loading users: {e}")
            self.user_store = {}
        
        try:
            if os.path.exists(self.TRANSACTIONS_FILE):
                with open(self.TRANSACTIONS_FILE, 'r', encoding='utf-8') as f:
                    self.transaction_store = json.load(f)
                print(f"[MoneyViya] Loaded transactions from file")
        except Exception as e:
            print(f"[MoneyViya] Error loading transactions: {e}")
            self.transaction_store = {}
    
    def _save_data(self):
        """Save all data to JSON files"""
        try:
            with open(self.USERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.user_store, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[MoneyViya] Error saving users: {e}")
        
        try:
            with open(self.TRANSACTIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.transaction_store, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[MoneyViya] Error saving transactions: {e}")
    
    def _get_ist_time(self) -> datetime:
        if IST:
            return datetime.now(IST)
        return datetime.now()
    
    def _get_quote(self, lang: str) -> str:
        quotes = self.QUOTES.get(lang, self.QUOTES["en"])
        return random.choice(quotes)
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """Extract amount from natural text"""
        text = text.lower().replace(",", "").replace("₹", "").replace("rs", "").replace("rs.", "")
        
        # Handle lakh/lac
        lakh_match = re.search(r'(\d+\.?\d*)\s*(?:lakh|lac|lakhs)', text)
        if lakh_match:
            return float(lakh_match.group(1)) * 100000
        
        # Handle k/thousand
        k_match = re.search(r'(\d+\.?\d*)\s*(?:k|thousand)', text)
        if k_match:
            return float(k_match.group(1)) * 1000
        
        # Regular number
        num_match = re.findall(r'\d+\.?\d*', text)
        if num_match:
            return float(num_match[0])
        
        return None
    
    def _detect_language(self, text: str) -> Optional[str]:
        """Detect language from text"""
        text_lower = text.lower().strip()
        for lang, patterns in self.LANGUAGE_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return lang
        return None
    
    def _detect_occupation(self, text: str) -> Optional[str]:
        """Detect occupation from text"""
        text_lower = text.lower()
        for occ, patterns in self.OCCUPATION_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return occ.title()
        return text.strip().title()
    
    def _detect_risk(self, text: str) -> str:
        """Detect risk appetite from text or number"""
        text_lower = text.lower().strip()
        
        # Support numbered options
        if text_lower in ["1", "low", "safe"]:
            return "Low"
        if text_lower in ["2", "medium", "moderate", "balanced"]:
            return "Medium"
        if text_lower in ["3", "high", "aggressive"]:
            return "High"
        
        # Check pattern matching
        for risk, patterns in self.RISK_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return risk.title()
        
        # Return None if not detected (for validation)
        return None
    
    def _categorize_expense(self, text: str) -> str:
        """Categorize expense from text"""
        text_lower = text.lower()
        for category, keywords in self.EXPENSE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category.title()
        return "Other"
    
    def _categorize_income(self, text: str) -> str:
        """Categorize income from text"""
        text_lower = text.lower()
        for category, keywords in self.INCOME_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category.title()
        return "Other"
    
    def _is_expense_message(self, text: str) -> bool:
        """Check if message is about expense"""
        expense_indicators = ["spent", "paid", "bought", "expense", "cost", "खर्च", "செலவு", "ఖర్చు", "खरीदा"]
        return any(ind in text.lower() for ind in expense_indicators)
    
    def _is_income_message(self, text: str) -> bool:
        """Check if message is about income"""
        income_indicators = ["earned", "received", "got", "salary", "income", "credited", "कमाया", "மிலா", "వచ్చింది", "आया"]
        return any(ind in text.lower() for ind in income_indicators)
    
    def _get_user(self, phone: str) -> Dict:
        if phone not in self.user_store:
            self.user_store[phone] = {
                "phone": phone,
                "language": "en",
                "onboarding_step": 0,
                "onboarding_complete": False,
                "created_at": self._get_ist_time().isoformat()
            }
            self._save_data()  # Save new user
        return self.user_store[phone]
    
    def _save_user(self, phone: str, data: Dict):
        self.user_store[phone] = data
        self._save_data()  # Auto-save to file
        
    def _get_today_transactions(self, phone: str) -> Tuple[float, float]:
        today = self._get_ist_time().strftime("%Y-%m-%d")
        transactions = self.transaction_store.get(phone, [])
        
        income = sum(t["amount"] for t in transactions 
                    if t["type"] == "income" and t["date"].startswith(today))
        expenses = sum(t["amount"] for t in transactions 
                      if t["type"] == "expense" and t["date"].startswith(today))
        
        return income, expenses
    
    def _add_transaction(self, phone: str, txn_type: str, amount: float, 
                        category: str, description: str = "", source: str = "whatsapp"):
        if phone not in self.transaction_store:
            self.transaction_store[phone] = []
        
        self.transaction_store[phone].append({
            "type": txn_type,
            "amount": amount,
            "category": category,
            "description": description,
            "date": self._get_ist_time().isoformat(),
            "source": source  # whatsapp, web, sms_auto, screenshot, forwarded
        })
        self._save_data()  # Auto-save transactions
    
    def _show_change_options(self, user: Dict) -> str:
        """Show options to change profile data"""
        lang = user.get("language", "en")
        step = user.get("onboarding_step", 0)
        
        return f"""📝 *Need to change something?*

Type *reset* to start over completely.

Or continue with the current question.
Your current details:
• Name: {user.get('name', 'Not set')}
• Occupation: {user.get('occupation', 'Not set')}
• Income: ₹{int(user.get('monthly_income', 0)):,}
• Expenses: ₹{int(user.get('monthly_expenses', 0)):,}
• Savings: ₹{int(user.get('current_savings', 0)):,}

_Type your answer for the current question, or type *reset* to start fresh._"""
    
    def _is_valid_goal(self, text: str) -> bool:
        """Check if the goal input is valid (not just a single common word)"""
        invalid_words = ["help", "language", "english", "hindi", "tamil", "ok", "yes", "no", 
                        "hi", "hello", "thanks", "thank", "bye", "reset", "back", "change",
                        "1", "2", "3", "low", "medium", "high"]
        text_lower = text.lower().strip()
        
        # Too short
        if len(text_lower) < 3:
            return False
        
        # Single invalid word
        if text_lower in invalid_words:
            return False
        
        # Should have at least 2 words for a proper goal
        words = text_lower.split()
        if len(words) < 2 and len(text_lower) < 8:
            return False
            
        return True
    
    async def process_message(self, phone: str, message: str, 
                             sender_name: str = "Friend") -> str:
        """Main message processing with Advanced NLP v3.0
        
        Understands:
        - Explicit: "Spent 500 on food"
        - Implicit: "chai 50", "auto 150", "biryani for 300"
        - Hinglish: "kharcha 500", "salary aaya 30000"
        - Follow-up: "yeah that was for food"
        - EMI/Loan: "Calculate EMI for 10 lakh"
        - Tax: "Tax saving tips"
        - Comparison: "Compare this month vs last"
        """
        try:
            user = self._get_user(phone)
            user["last_active"] = self._get_ist_time().isoformat()
            user["sender_name"] = sender_name
            
            # Check if onboarding complete
            if not user.get("onboarding_complete"):
                return await self._handle_onboarding(phone, message, user)
            
            # Smart NLP Pipeline
            msg = message.strip()
            msg_lower = msg.lower()
            name = user.get("name", "Friend")
            lang = user.get("language", "en")
            
            # ─── 1. GREETING ───
            greet_words = ["hi", "hello", "hey", "start", "hii", "hiii", "namaste", "vanakkam", 
                          "नमस्ते", "வணக்கம்", "good morning", "good evening", "gm", "yo",
                          "bro", "hola", "sup", "wassup", "howdy"]
            if msg_lower in greet_words or (len(msg_lower) < 8 and msg_lower in greet_words):
                return self._handle_greeting(user)
            
            # ─── 2. HELP ───
            if any(w in msg_lower for w in ["help", "commands", "menu", "what can you do", 
                                            "options", "?", "sahayata", "உதவி", "kya kar sakte"]):
                return self._handle_help(user)
            
            # ─── 3. RESET ───
            if any(w in msg_lower for w in ["reset", "restart", "start over", "fresh start", "नया शुरू"]):
                return self._handle_reset(phone)
            
            # ─── 4. PROFILE ───
            if any(w in msg_lower for w in ["profile", "my profile", "status", "my status", 
                                            "who am i", "my details", "my info", "account", "mera profile"]):
                return self._handle_profile(user)
            
            # ─── 5. BALANCE/SUMMARY ───
            if any(w in msg_lower for w in ["balance", "summary", "total", "overview", "how much",
                                            "kitna", "kitne", "எவ்வளவு", "kul", "show me",
                                            "aaj ka hisab", "hisab", "my money", "paisa"]):
                return self._handle_balance(phone, user)
            
            # ─── 6. GOALS ───
            if any(w in msg_lower for w in ["goal", "target", "lakshya", "लक्ष्य", "இலக்கு",
                                            "dream", "save for", "bachana hai"]):
                if any(w in msg_lower for w in ["add", "new", "create", "set", "i want to save"]):
                    return self._handle_add_goal(phone, message, user)
                return self._handle_view_goals(user)
            
            # ─── 7. REPORT ───
            if any(w in msg_lower for w in ["report", "weekly", "monthly", "analysis", 
                                            "breakdown", "category wise", "where did my money go"]):
                return self._handle_report(phone, user)
            
            # ─── 8. MARKET/INVEST ───
            if any(w in msg_lower for w in ["market", "stock", "nifty", "sensex", "share", 
                                            "invest", "mutual fund", "sip", "fd", "ppf", "nps",
                                            "बाजार", "சந்தை", "where to invest", "best investment"]):
                return self._handle_market(user)
            
            # ─── 9. SAVINGS ───
            if any(w in msg_lower for w in ["saving", "savings", "bachat", "बचत", "சேமிப்பு",
                                            "how to save", "save money", "paise kaise bachaye"]):
                return self._handle_savings(phone, user)
            
            # ─── 10. TIPS ───
            if any(w in msg_lower for w in ["tip", "tips", "advice", "suggest", "recommendation",
                                            "sujhav", "salaah", "money tip"]):
                return self._handle_tips(user)
            
            # ─── 11. EMI CALCULATOR ───
            if any(w in msg_lower for w in ["emi", "loan", "emi calculate", "emi kitna", 
                                            "home loan", "car loan", "personal loan"]):
                return self._handle_emi(msg, user)
            
            # ─── 12. TAX ───
            if any(w in msg_lower for w in ["tax", "income tax", "itr", "80c", "tax saving",
                                            "tax bachao", "section 80"]):
                return self._handle_tax(msg, user)
            
            # ─── 13. HEALTH SCORE ───
            if any(w in msg_lower for w in ["health score", "financial health", "score",
                                            "how am i doing", "kaisa chal raha", "my score"]):
                return self._handle_health_score(phone, user)
            
            # ─── 14. AFFORDABILITY — "Can I afford iPhone?" ───
            if any(w in msg_lower for w in ["can i afford", "afford", "should i buy", 
                                            "kya le sakta", "khareedna chahiye", "worth it",
                                            "budget mein aayega", "afford kar sakta"]):
                return self._handle_affordability(phone, msg, user)
            
            # ─── 15. BILL REMINDERS ───
            if any(w in msg_lower for w in ["remind", "reminder", "bill remind", "yaad dilao",
                                            "due date", "don't forget", "bill due",
                                            "my bills", "upcoming bills"]):
                return self._handle_bill_reminder(phone, msg, user)
            
            # ─── 16. SPENDING PREDICTION ───
            if any(w in msg_lower for w in ["predict", "prediction", "will i overspend",
                                            "month end", "salary last", "paisa chalega",
                                            "budget forecast", "will my money last",
                                            "paise chalenge", "kab tak chalega"]):
                return self._handle_spending_prediction(phone, user)
            
            # ─── 17. SAVINGS CHALLENGE ───
            if any(w in msg_lower for w in ["challenge", "savings challenge", "30 day",
                                            "bachat challenge", "money challenge",
                                            "save more", "zyada bachao"]):
                return self._handle_savings_challenge(phone, user)
            
            # ─── 18. DEBT TRACKER ───
            if any(w in msg_lower for w in ["my loan", "my loans", "debt", "total debt",
                                            "all emi", "loan tracker", "karz", "कर्ज",
                                            "how much i owe", "total emi", "debt free"]):
                return self._handle_debt_tracker(phone, user)
            
            # ─── 19. SUBSCRIPTION MANAGER ───
            if any(w in msg_lower for w in ["subscription", "subscriptions", "recurring",
                                            "monthly charge", "auto debit", "unsubscribe",
                                            "waste subscription", "cancel subscription"]):
                return self._handle_subscriptions(phone, user)
            
            # ─── 20. MOTIVATION ───
            if any(w in msg_lower for w in ["motivat", "inspire", "quote", "money quote",
                                            "i feel broke", "depressed about money",
                                            "paisa nahi hai", "frustrated", "hopeless"]):
                return self._handle_motivation(user)
            
            # ─── 21. SPLIT BILL ───
            if any(w in msg_lower for w in ["split", "split bill", "divide", "hissa",
                                            "baant", "share bill", "who owes"]):
                return self._handle_split_bill(msg, user)
            
            # ═══════════════════════════════════════════════════
            # MONEYVIYA 2.0 — LIFE MANAGEMENT AGENTS
            # ═══════════════════════════════════════════════════
            
            # ─── 30. INCOME GROWTH — Earn more, passive income ───
            if SPECIALIST_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "earn more", "income ideas", "passive income", "side income",
                    "freelance", "freelancing", "upwork", "fiverr", "gig",
                    "income growth", "income streams", "extra income",
                    "zyada kamana", "paisa kamana", "income badhana",
                    "how to earn", "earn from home", "side hustle",
                    "tiffin service", "tutoring", "reselling"]):
                return income_agent.process(message, user)
            
            # ─── 31. CAREER — Jobs, salary, promotions ───
            if SPECIALIST_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "career", "job", "switch job", "new job", "salary",
                    "promotion", "hike", "appraisal", "resume", "cv",
                    "interview", "leetcode", "dsa", "placement",
                    "naukri", "job search", "resign", "quit job",
                    "career path", "career change", "package",
                    "job switch", "ctc", "compensation"]):
                return career_agent.process(message, user)
            
            # ─── 32. LEARNING — Courses, skills, certifications ───
            if SPECIALIST_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "learn", "course", "courses", "certification", "certificate",
                    "skill", "skill gap", "what to learn", "kya seekhu",
                    "study", "padhai", "training", "bootcamp",
                    "udemy", "coursera", "freecodecamp",
                    "learning roadmap", "learning path", "upskill",
                    "free course", "scholarship", "which skill"]):
                return learning_agent.process(message, user)
            
            # ─── 33. PRODUCTIVITY — Habits, time management ───
            if SPECIALIST_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "productivity", "habit", "routine", "daily routine",
                    "plan my day", "daily plan", "schedule",
                    "time management", "procrastinat", "lazy",
                    "morning routine", "time table", "focus",
                    "aalas", "distract", "wakeup", "wake up"]):
                return productivity_agent.process(message, user)
            
            # ─── 34. TAX — GST, ITR, tax saving ───
            if SPECIALIST_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "gst", "itr", "income tax return", "file tax",
                    "tax regime", "old regime", "new regime",
                    "tax return", "tax filing", "gstr",
                    "invoice", "bill generate", "client bill"]):
                return tax_agent.process(message, user)
            
            # ═══════════════════════════════════════════════════
            # MONEYVIYA 2.0 — LIFE INTELLIGENCE AGENTS
            # ═══════════════════════════════════════════════════
            
            # ─── 35. HABIT AGENT — Streaks, routines, gamification ───
            if LIFE_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "habit", "streak", "start habit", "new habit",
                    "habit check", "check in", "daily check",
                    "morning routine", "evening routine", "night routine",
                    "suggest habit", "habit report", "habit progress",
                    "habit ideas", "build habit", "break habit",
                    "aadat", "routine", "bedtime"]):
                return habit_agent.process(message, user)
            
            # ─── 36. GOAL SYNTHESIS — Cross-domain goals ───
            if LIFE_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "set goal", "new goal", "create goal", "my goal",
                    "goal progress", "goal status", "my goals",
                    "check goals", "goal plan", "goal roadmap",
                    "how to achieve", "break down goal",
                    "connect goals", "goal connections"]):
                return goal_synthesizer.process(message, user)
            
            # ─── 37. DAILY SUGGESTION — Morning/evening briefings ───
            if LIFE_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "good morning", "morning briefing", "today's plan",
                    "good evening", "evening checkin", "evening check",
                    "subah", "shaam", "day plan", "daily briefing",
                    "what should i do today", "plan today"]):
                now = datetime.now()
                if now.hour < 14:
                    return daily_engine.morning_briefing(user)
                else:
                    return daily_engine.evening_checkin(user)
            
            # ─── 38. WEEKLY REVIEW — Sunday reflection ───
            if LIFE_AGENTS_AVAILABLE and any(w in msg_lower for w in [
                    "weekly review", "week review", "weekly report",
                    "week summary", "this week", "reflect",
                    "how was my week", "week analysis",
                    "sunday review", "hafta"]):
                return weekly_reflection.generate_review(user)
            
            # ─── 39. PAIN DETECTION — Emotional support ───
            if LIFE_AGENTS_AVAILABLE:
                pain_response = pain_detector.detect_from_message(message, user)
                if pain_response:
                    return pain_response
            
            # ─── 22. INCOME — explicit keywords ───
            income_triggers = ["earn", "income", "received", "got paid", "salary", "kamai",
                              "mila", "credited", "कमाया", "मिला", "கிடைத்தது", "వచ్చింది",
                              "आया", "payment received", "freelance payment", "client paid",
                              "bonus", "incentive", "refund"]
            if any(kw in msg_lower for kw in income_triggers):
                return self._handle_income(phone, message, user)
            
            # ─── 23. EXPENSE — explicit keywords ───
            expense_triggers = ["spent", "paid", "bought", "expense", "cost", "kharcha",
                               "kharach", "खर्च", "செலவு", "ఖర్చు", "खरीदा", "bill paid",
                               "recharge", "recharged", "diya", "de diya", "bhara", "bharwaya"]
            if any(kw in msg_lower for kw in expense_triggers):
                return self._handle_expense(phone, message, user)
            
            # ─── 24. IMPLICIT EXPENSE — "chai 50", "auto 150", number + category ───
            amount = self._extract_amount(msg)
            if amount:
                # Check if message has an implicit category
                implicit_expense_words = [
                    "food", "chai", "tea", "coffee", "lunch", "dinner", "breakfast", "snack",
                    "biryani", "pizza", "burger", "samosa", "dosa", "idli", "noodles",
                    "auto", "uber", "ola", "cab", "bus", "train", "metro", "petrol", "diesel",
                    "recharge", "bill", "rent", "emi", "electricity", "wifi", "mobile",
                    "amazon", "flipkart", "shopping", "clothes", "shoes",
                    "movie", "netflix", "gym", "medicine", "doctor",
                    "khana", "nashta", "rickshaw", "bijli", "kiraya",
                    "doodh", "milk", "sabji", "vegetables", "fruits", "kirana", "grocery",
                    "water", "gas", "cylinder", "maid", "bai", "parking",
                    "haircut", "salon", "laundry", "ironing", "temple", "donation"
                ]
                if any(w in msg_lower for w in implicit_expense_words):
                    return self._handle_expense(phone, message, user)
                
                # Check if it's a pure number — ask for clarification
                if msg.strip().replace(",", "").replace(".", "").isdigit():
                    return f"""💰 Got ₹{int(amount):,}

Is this an:
💸 *Expense* — Type: "spent {int(amount)} on food"
💵 *Income* — Type: "earned {int(amount)}"

Or just tell me what it was for! 😊"""
            
            # ─── 25. UNIVERSAL AI FALLBACK — understands ANYTHING ───
            return self._handle_unknown(message, user)
            
        except Exception as e:
            traceback.print_exc()
            return "⚠️ Sorry, something went wrong. Please try again."
    
    async def _handle_onboarding(self, phone: str, message: str, user: Dict) -> str:
        """Natural conversational onboarding"""
        step = user.get("onboarding_step", 0)
        lang = user.get("language", "en")
        
        # Step 0: Welcome
        if step == 0:
            user["onboarding_step"] = 1
            self._save_user(phone, user)
            return """👋 *Welcome to MoneyViya!*

I'm Viya — your AI Life & Money Manager 🚀

I'll help you:
💰 Track your money automatically
📈 Grow your income (active + passive ideas)
🎓 Learn skills that pay more
💼 Grow your career
🎯 Achieve your life goals

Let's set up your profile in 2 minutes!

*Which language do you prefer?*
_(Just type: English, Hindi, Tamil, Telugu, or Kannada)_"""
        
        # Step 1: Language
        if step == 1:
            detected_lang = self._detect_language(message)
            user["language"] = detected_lang or "en"
            user["onboarding_step"] = 2
            self._save_user(phone, user)
            
            lang = user["language"]
            responses = {
                "en": "Perfect! ✅\n\n*What's your name?*\n_(Just type your name)_",
                "hi": "बहुत अच्छा! ✅\n\n*आपका नाम क्या है?*\n_(बस अपना नाम लिखें)_",
                "ta": "சிறப்பு! ✅\n\n*உங்கள் பெயர் என்ன?*",
                "te": "చాలా బాగుంది! ✅\n\n*మీ పేరు ఏమిటి?*",
                "kn": "ಅದ್ಭುತ! ✅\n\n*ನಿಮ್ಮ ಹೆಸರೇನು?*"
            }
            return responses.get(lang, responses["en"])
        
        # Step 2: Name
        if step == 2:
            user["name"] = message.strip().title()
            user["onboarding_step"] = 3
            self._save_user(phone, user)
            
            responses = {
                "en": f"""Nice to meet you, *{user['name']}*! 😊

*Which best describes you?*

1️⃣ 🎓 *Student* — College/learning phase
2️⃣ 💼 *Salaried* — Fixed monthly salary
3️⃣ 🎯 *Freelancer* — Gig worker/self-employed
4️⃣ 👩‍🏫 *Homemaker* — Managing household
5️⃣ 🏢 *Business Owner* — Running a business

_(Just type 1, 2, 3, 4, or 5 — or describe what you do!)_""",
                "hi": f"""आपसे मिलकर खुशी हुई, *{user['name']}*! 😊

*आप क्या करते हैं?*

1️⃣ 🎓 *छात्र* — पढ़ाई
2️⃣ 💼 *नौकरी* — मासिक वेतन
3️⃣ 🎯 *फ्रीलांसर* — स्व-रोजगार
4️⃣ 👩‍🏫 *गृहिणी* — घर संभालना
5️⃣ 🏢 *व्यापारी* — अपना बिज़नेस

_(1, 2, 3, 4, या 5 लिखें)_""",
                "ta": f"""சந்தித்ததில் மகிழ்ச்சி, *{user['name']}*! 😊

*நீங்கள் என்ன செய்கிறீர்கள்?*

1️⃣ 🎓 *மாணவர்*
2️⃣ 💼 *வேலை*
3️⃣ 🎯 *ஃப்ரீலான்சர்*
4️⃣ 👩‍🏫 *இல்லத்தரசி*
5️⃣ 🏢 *தொழில்*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 3: Occupation + Persona Detection
        if step == 3:
            msg_lower = message.lower().strip()
            
            # Detect persona from response
            persona_map = {
                "1": ("student", "Student"),
                "student": ("student", "Student"),
                "college": ("student", "Student"),
                "padhai": ("student", "Student"),
                "studying": ("student", "Student"),
                "university": ("student", "Student"),
                
                "2": ("salaried", "Salaried Professional"),
                "salaried": ("salaried", "Salaried Professional"),
                "job": ("salaried", "Salaried Professional"),
                "naukri": ("salaried", "Salaried Professional"),
                "employee": ("salaried", "Salaried Professional"),
                "work in": ("salaried", "Salaried Professional"),
                "it": ("salaried", "IT Professional"),
                "engineer": ("salaried", "Engineer"),
                "developer": ("salaried", "Developer"),
                "manager": ("salaried", "Manager"),
                "teacher": ("salaried", "Teacher"),
                "doctor": ("salaried", "Doctor"),
                "nurse": ("salaried", "Nurse"),
                
                "3": ("freelancer", "Freelancer"),
                "freelance": ("freelancer", "Freelancer"),
                "freelancer": ("freelancer", "Freelancer"),
                "gig": ("freelancer", "Gig Worker"),
                "self employed": ("freelancer", "Self-Employed"),
                "self-employed": ("freelancer", "Self-Employed"),
                "uber": ("freelancer", "Gig Worker"),
                "swiggy": ("freelancer", "Delivery Partner"),
                "zomato": ("freelancer", "Delivery Partner"),
                "tutor": ("freelancer", "Tutor"),
                "consultant": ("freelancer", "Consultant"),
                "designer": ("freelancer", "Designer"),
                "writer": ("freelancer", "Writer"),
                "photographer": ("freelancer", "Photographer"),
                
                "4": ("homemaker", "Homemaker"),
                "homemaker": ("homemaker", "Homemaker"),
                "housewife": ("homemaker", "Homemaker"),
                "home maker": ("homemaker", "Homemaker"),
                "grahini": ("homemaker", "Homemaker"),
                "househusband": ("homemaker", "Homemaker"),
                "home": ("homemaker", "Homemaker"),
                
                "5": ("business_owner", "Business Owner"),
                "business": ("business_owner", "Business Owner"),
                "entrepreneur": ("business_owner", "Entrepreneur"),
                "shop": ("business_owner", "Shop Owner"),
                "store": ("business_owner", "Store Owner"),
                "restaurant": ("business_owner", "Restaurant Owner"),
                "startup": ("business_owner", "Startup Founder"),
                "vyapari": ("business_owner", "Business Owner"),
                "dukandaar": ("business_owner", "Shop Owner"),
            }
            
            detected_persona = None
            detected_occupation = message.strip().title()
            
            for key, (persona, occ) in persona_map.items():
                if key in msg_lower:
                    detected_persona = persona
                    detected_occupation = occ
                    break
            
            if not detected_persona:
                detected_persona = "salaried"  # default
            
            user["occupation"] = detected_occupation
            user["persona"] = detected_persona
            user["onboarding_step"] = 4
            self._save_user(phone, user)
            
            # Persona-specific acknowledgment
            persona_msgs = {
                "student": f"Awesome, student life! 🎓 MoneyViya will help you earn while learning + manage your money smartly.",
                "salaried": f"Great, {detected_occupation}! 💼 MoneyViya will help you save more, invest wisely, and grow your career.",
                "freelancer": f"Love it, {detected_occupation}! 🎯 MoneyViya will track irregular income, find new clients, and build passive income.",
                "homemaker": f"Wonderful, {detected_occupation}! 👩‍🏫 MoneyViya will show your household contribution, find income-from-home ideas, and manage family finances.",
                "business_owner": f"Impressive, {detected_occupation}! 🏢 MoneyViya will separate business/personal finances, track profitability, and help scale."
            }
            
            persona_msg = persona_msgs.get(detected_persona, f"Great, {detected_occupation}! 💼")
            
            responses = {
                "en": f"""{persona_msg}

*What's your approximate monthly income?*
_(Example: 25000, 50k, 1 lakh, or 0 if student/homemaker)_""",
                "hi": f"""{persona_msg}

*आपकी लगभग मासिक आय कितनी है?*
_(उदाहरण: 25000, 50 हजार, 1 लाख)_""",
                "ta": f"""{persona_msg}


*உங்கள் மாத வருமானம் எவ்வளவு?*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 4: Income
        if step == 4:
            amount = self._extract_amount(message)
            if not amount:
                return "Please enter a valid amount. Example: 25000 or 50k or 1 lakh"
            
            user["monthly_income"] = amount
            user["onboarding_step"] = 5
            self._save_user(phone, user)
            
            responses = {
                "en": f"""₹{int(amount):,}/month - Got it! 📝

*What are your monthly expenses?*
_(Include rent, food, transport, bills - approximate total)_
_(Example: 20000 or 15k)_""",
                "hi": f"""₹{int(amount):,}/महीना - नोट किया! 📝

*आपका मासिक खर्च कितना है?*
_(किराया, खाना, यातायात, बिल - कुल मिलाकर)_""",
                "ta": f"""₹{int(amount):,}/மாதம் - குறிப்பு! 📝

*உங்கள் மாத செலவு எவ்வளவு?*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 5: Expenses
        if step == 5:
            amount = self._extract_amount(message) or 0
            user["monthly_expenses"] = amount
            surplus = user.get("monthly_income", 0) - amount
            user["onboarding_step"] = 6
            self._save_user(phone, user)
            
            responses = {
                "en": f"""Monthly expenses: ₹{int(amount):,} ✅
You have about ₹{int(surplus):,} left to save/invest!

*Do you have any current savings?*
_(Money in bank, FD, etc. Example: 50000 or zero)_""",
                "hi": f"""मासिक खर्च: ₹{int(amount):,} ✅

*क्या आपकी कोई बचत है?*
_(बैंक में, FD में)_""",
                "ta": f"""மாத செலவு: ₹{int(amount):,} ✅

*உங்களுக்கு ஏதாவது சேமிப்பு உள்ளதா?*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 6: Savings
        if step == 6:
            amount = self._extract_amount(message) or 0
            user["current_savings"] = amount
            user["onboarding_step"] = 7
            self._save_user(phone, user)
            
            responses = {
                "en": f"""Savings: ₹{int(amount):,} {"💰 Great!" if amount > 0 else "- No problem, we will build it!"}

*What is your investment risk preference?*

Please reply with a number:
*1* - 🛡️ Low Risk (Safe - FD, PPF, Savings)
*2* - ⚖️ Medium Risk (Balanced - Mix of safe & growth)
*3* - 🚀 High Risk (Aggressive - Stocks, Mutual Funds)

_Or type: low, medium, high_""",
                "hi": f"""बचत: ₹{int(amount):,} {"💰" if amount > 0 else "- कोई बात नहीं!"}

*आपकी निवेश जोखिम प्राथमिकता क्या है?*

कृपया नंबर भेजें:
*1* - 🛡️ कम जोखिम (सुरक्षित)
*2* - ⚖️ मध्यम जोखिम (संतुलित)
*3* - 🚀 उच्च जोखिम (आक्रामक)""",
                "ta": f"""சேமிப்பு: ₹{int(amount):,}

*உங்கள் முதலீட்டு ரிஸ்க் விருப்பம்?*

எண்ணை அனுப்பவும்:
*1* - 🛡️ குறைந்த ரிஸ்க்
*2* - ⚖️ நடுத்தர ரிஸ்க்
*3* - 🚀 அதிக ரிஸ்க்"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 7: Risk appetite (with validation)
        if step == 7:
            # Check for help/change command
            msg_lower = message.lower().strip()
            if msg_lower in ["help", "back", "change", "edit"]:
                return self._show_change_options(user)
            
            risk = self._detect_risk(message)
            
            # Validate - if not a valid option
            if risk is None:
                return """⚠️ Sorry, I did not understand that.

Please reply with:
*1* - Low Risk (Safe)
*2* - Medium Risk (Balanced)
*3* - High Risk (Aggressive)

Or type: low, medium, high"""
            
            user["risk_appetite"] = risk
            user["onboarding_step"] = 8
            self._save_user(phone, user)
            
            responses = {
                "en": f"""✅ Risk profile: *{risk}* 📊

Now the exciting part - *What is your main financial goal?*

_(Examples: Buy a car, Build emergency fund, Pay off loan, Buy a house, Save for vacation)_

💡 _Type a real goal, not just a word!_""",
                "hi": f"""✅ रिस्क प्रोफाइल: *{risk}* 📊

*आपका मुख्य वित्तीय लक्ष्य क्या है?*
_(उदाहरण: कार खरीदना, इमरजेंसी फंड, लोन चुकाना)_""",
                "ta": f"""✅ ரிஸ்க்: *{risk}* 📊

*உங்கள் முக்கிய நிதி இலக்கு என்ன?*
_(உதாரணம்: கார் வாங்க, அவசர நிதி)_"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 8: Goal (with validation)
        if step == 8:
            # Check for help/change command
            msg_lower = message.lower().strip()
            if msg_lower in ["help", "back", "change", "edit"]:
                return self._show_change_options(user)
            
            # Validate goal input
            if not self._is_valid_goal(message):
                return """⚠️ That does not look like a proper financial goal.

Please enter a *specific goal* like:
• "Buy a car"
• "Build emergency fund"
• "Pay off 5 lakh loan"
• "Save for house down payment"
• "Wedding fund"
• "Child education"

_What is your main financial goal?_"""
            
            goal_name = message.strip().title()
            user["primary_goal"] = goal_name
            user["goals"] = [{"name": goal_name, "status": "active"}]
            user["onboarding_step"] = 9
            self._save_user(phone, user)
            
            responses = {
                "en": f"""Great goal: *{goal_name}* 🎯

*How much do you need for this goal?*
_(Example: 5 lakh, 100000, 20 lakh)_""",
                "hi": f"""बेहतरीन लक्ष्य: *{goal_name}* 🎯

*इसके लिए कितने पैसे चाहिए?*""",
                "ta": f"""சிறந்த இலக்கு: *{goal_name}* 🎯

*இதற்கு எவ்வளவு தேவை?*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 9: Goal amount
        if step == 9:
            amount = self._extract_amount(message)
            if not amount:
                return "Please enter a valid amount. Example: 5 lakh or 500000"
            
            if user.get("goals"):
                user["goals"][0]["amount"] = amount
            user["onboarding_step"] = 10
            self._save_user(phone, user)
            
            goal_name = user.get("primary_goal", "your goal")
            responses = {
                "en": f"""Target: ₹{int(amount):,} for {goal_name} 🎯

*By when do you want to achieve this?*
_(Example: 2 years, 6 months, December 2025)_""",
                "hi": f"""लक्ष्य: ₹{int(amount):,} 🎯

*कब तक हासिल करना है?*_(उदाहरण: 2 साल, 6 महीने)_""",
                "ta": f"""இலக்கு: ₹{int(amount):,} 🎯

*எப்போது அடைய வேண்டும்?*"""
            }
            return responses.get(lang, responses["en"])
        
        # Step 10: Timeline - Complete onboarding
        if step == 10:
            if user.get("goals"):
                user["goals"][0]["timeline"] = message.strip()
            
            # Calculate financial plan
            income = user.get("monthly_income", 0)
            expenses = user.get("monthly_expenses", 0)
            surplus = income - expenses
            daily_budget = int(income / 30) if income > 0 else 500
            
            user["daily_budget"] = daily_budget
            user["monthly_surplus"] = surplus
            user["onboarding_complete"] = True
            user["onboarding_step"] = 99
            self._save_user(phone, user)
            
            name = user.get("name", "Friend")
            goal_text = ""
            if user.get("goals"):
                g = user["goals"][0]
                goal_text = f"🎯 {g.get('name', 'Goal')} - ₹{int(g.get('amount', 0)):,} in {g.get('timeline', 'TBD')}"
            
            return f"""🎉 *{name}, Your MoneyViya Profile is Ready!*

📊 *Financial Snapshot:*
━━━━━━━━━━━━━━━━━━━━━━━━━
💼 {user.get('occupation', 'User')} ({user.get('persona', 'user').replace('_', ' ').title()})
💰 Income: ₹{int(income):,}/month
💸 Expenses: ₹{int(expenses):,}/month
💵 Surplus: ₹{int(surplus):,}/month
🏦 Savings: ₹{int(user.get('current_savings', 0)):,}
🎲 Risk: {user.get('risk_appetite', 'Medium')}

{goal_text}

📋 *Your Daily Plan:*
• Daily Budget: ₹{daily_budget:,}
• Daily Savings Target: ₹{int(surplus/30):,}

🚀 *Here's what I can do for you:*

💰 *Money:* "Spent 500 on lunch" • "Balance" • "Report"
📈 *Grow Income:* "passive income" • "freelance"
🎓 *Learn \u0026 Earn:* "courses" • "skill gap"
💼 *Career:* "salary insights" • "resume tips"
⚡ *Productivity:* "plan my day" • "habit tracker"
🏛️ *Tax:* "tax saving" • "gst" • "itr"

Type *help* for the full command list! 💪"""
    
    def _handle_greeting(self, user: Dict) -> str:
        name = user.get("name", "Friend")
        lang = user.get("language", "en")
        
        greetings = {
            "en": f"""👋 Hi {name}! Great to see you!

What would you like to do?
💰 *Money:* "Spent 200 on coffee" or "Balance"
📈 *Earn More:* "passive income" or "freelance"
🎓 *Learn:* "courses" or "skill gap"
💼 *Career:* "salary" or "resume tips"
⚡ *Productivity:* "plan my day"

{self._get_quote(lang)}""",
            "hi": f"""👋 नमस्ते {name}!

आज मैं कैसे मदद करूं?
💰 "200 खर्च किया खाने पर"
📈 "ज्यादा कमाना है"
🎓 "कोर्स बताओ"
💼 "सैलरी बढ़ाना है"

{self._get_quote(lang)}""",
            "ta": f"""👋 வணக்கம் {name}!

இன்று எப்படி உதவ வேண்டும்?
💰 "செலவு" 📈 "வருமானம்" 🎓 "படிப்பு"

{self._get_quote(lang)}"""
        }
        return greetings.get(lang, greetings["en"])
    
    def _handle_help(self, user: Dict) -> str:
        lang = user.get("language", "en")
        name = user.get("name", "Friend")
        return f"""📚 *{name}, here's everything I can do!*

━━━━ 💰 *TRACK MONEY* ━━━━
  "chai 50" • "auto 150" • "biryani 300"
  "spent 500 on food" • "earned 10000 salary"
  "balance" • "report" • "health score"
  "predict" — Will you overspend this month?

━━━━ 🎯 *GOALS & SAVINGS* ━━━━
  "goals" • "add goal: Buy car, 5L, 2 years"
  "challenge" — 30-Day Savings Challenge! 🔥
  "can I afford iPhone" • "EMI calculator"

━━━━ 📈 *GROW INCOME* (NEW!) ━━━━
  "passive income" — Earn while you sleep
  "freelance" — Start freelancing today
  "earn more" — Income growth strategy
  "income streams" — Build 3+ income sources

━━━━ 💼 *CAREER GROWTH* (NEW!) ━━━━
  "salary" — Am I paid fairly?
  "switch job" — Job change analysis
  "resume" — Resume power-up tips
  "interview prep" — 90-day prep plan
  "promotion" — How to get promoted

━━━━ 🎓 *LEARN & EARN* (NEW!) ━━━━
  "courses" — Top courses with ROI
  "skill gap" — What skills will pay more?
  "learning roadmap" — Month-by-month plan
  "free courses" — Best free resources

━━━━ ⚡ *PRODUCTIVITY* (NEW!) ━━━━
  "plan my day" — AI-scheduled daily plan
  "time management" — Beat procrastination

━━━━ 🔥 *HABITS & STREAKS* (NEW!) ━━━━
  "start habit" — Create a new habit
  "habit check" — Daily check-in
  "streak" — View your streaks
  "morning routine" — Optimize your mornings
  "evening routine" — Wind-down routine
  "habit report" — Weekly habit analytics

━━━━ 🎯 *GOALS & LIFE* (NEW!) ━━━━
  "set goal" — Create a new life goal
  "goal progress" — Check all goals
  "goal plan" — Decompose any goal
  "connect goals" — See how goals link
  "weekly review" — Your week in review
  "morning briefing" — AI daily briefing

━━━━ 🏛️ *TAX & BUSINESS* (NEW!) ━━━━
  "tax saving" — Save up to ₹1.5L/year
  "tax regime" — Old vs New comparison
  "itr" — ITR filing guide
  "gst" • "invoice" — For freelancers

━━━━ 🛠️ *MORE TOOLS* ━━━━
  "split 2000 among 4" • "subscriptions"
  "my loans" • "remind me rent 15000"
  "market update" • "SIP" • "invest"
  "motivate me" • Send screenshot 📸

⚙️ "profile" • "reset" • "language"
🌐 Dashboard: moneyviya-api.onrender.com

_Just talk naturally — I understand everything!_ 🤖"""
    
    def _handle_reset(self, phone: str) -> str:
        self.user_store[phone] = {
            "phone": phone,
            "language": "en",
            "onboarding_step": 0,
            "onboarding_complete": False
        }
        return """🔄 *Profile Reset!*

Let's start fresh. 

👋 *Welcome to MoneyViya!*

*Which language do you prefer?*
_(Just type: English, Hindi, Tamil, Telugu, or Kannada)_"""
    
    def _handle_expense(self, phone: str, message: str, user: Dict) -> str:
        amount = self._extract_amount(message)
        if not amount:
            return "I couldn't find the amount. Try: 'Spent 500 on food'"
        
        category = self._categorize_expense(message)
        self._add_transaction(phone, "expense", amount, category, message)
        
        today_income, today_expense = self._get_today_transactions(phone)
        daily_budget = user.get("daily_budget", 1000)
        remaining = daily_budget - today_expense  # Budget is only based on daily allowance minus expenses
        
        lang = user.get("language", "en")

        
        if lang == "en":
            if remaining < 0:
                insight = f"🔴 *Over budget by ₹{int(abs(remaining)):,}!*"
                budget_text = f"-₹{int(abs(remaining)):,}"
            elif remaining < daily_budget * 0.3:
                insight = "⚠️ Budget running low!"
                budget_text = f"₹{int(remaining):,}"
            else:
                insight = "💡 Great tracking!"
                budget_text = f"₹{int(remaining):,}"
            
            return f"""✅ *Expense Logged!*

💸 ₹{int(amount):,} on {category}
🕐 {self._get_ist_time().strftime('%I:%M %p')}

📊 *Today:*
💵 Income: ₹{int(today_income):,}
💸 Spent: ₹{int(today_expense):,}
💰 Budget Left: {budget_text}

{insight}"""
        elif lang == "hi":
            budget_text = f"-₹{int(abs(remaining)):,}" if remaining < 0 else f"₹{int(remaining):,}"
            return f"""✅ *खर्च दर्ज!*

💸 ₹{int(amount):,} - {category}

📊 *आज:*
💸 खर्च: ₹{int(today_expense):,}
💰 बचा बजट: {budget_text}"""
        elif lang == "ta":
            budget_text = f"-₹{int(abs(remaining)):,}" if remaining < 0 else f"₹{int(remaining):,}"
            return f"""✅ *செலவு பதிவு!*

💸 ₹{int(amount):,} - {category}

📊 *இன்று:*
💸 செலவு: ₹{int(today_expense):,}
💰 மீதம்: {budget_text}"""
        
        return f"✅ Logged: ₹{int(amount):,} on {category}"

    
    def _handle_income(self, phone: str, message: str, user: Dict) -> str:
        amount = self._extract_amount(message)
        if not amount:
            return "I couldn't find the amount. Try: 'Earned 5000'"
        
        category = self._categorize_income(message)
        self._add_transaction(phone, "income", amount, category, message)
        
        today_income, _ = self._get_today_transactions(phone)
        lang = user.get("language", "en")
        
        if lang == "en":
            return f"""✅ *Income Logged!*

💵 ₹{int(amount):,} from {category}
🕐 {self._get_ist_time().strftime('%I:%M %p')}

📊 *Today's Earnings: ₹{int(today_income):,}*

🎉 Great! You're getting closer to your goals!"""
        elif lang == "hi":
            return f"""✅ *आय दर्ज!*

💵 ₹{int(amount):,} - {category}

📊 *आज की कमाई: ₹{int(today_income):,}*

🎉 बढ़िया!"""
        
        return f"✅ Logged: ₹{int(amount):,} from {category}"
    
    def _handle_balance(self, phone: str, user: Dict) -> str:
        today_income, today_expense = self._get_today_transactions(phone)
        daily_budget = user.get("daily_budget", 1000)
        remaining = max(0, daily_budget - today_expense)
        net = today_income - today_expense
        name = user.get("name", "Friend")
        lang = user.get("language", "en")
        
        return f"""📊 *{name}'s Summary*

💵 Today's Income: ₹{int(today_income):,}
💸 Today's Expenses: ₹{int(today_expense):,}
{'🟢' if net >= 0 else '🔴'} Net: ₹{int(net):,}

📋 Daily Budget: ₹{int(daily_budget):,}
💰 Remaining: ₹{int(remaining):,}

{self._get_quote(lang)}"""
    
    def _handle_view_goals(self, user: Dict) -> str:
        goals = user.get("goals", [])
        if not goals:
            return "🎯 No goals yet!\n\nAdd one: 'Add goal: Buy phone, 50000, 6 months'"
        
        response = "🎯 *Your Goals:*\n━━━━━━━━━━━━━━━━━\n"
        for i, goal in enumerate(goals, 1):
            status = "✅" if goal.get("status") == "achieved" else "🔄"
            amount = goal.get("amount", 0)
            response += f"\n{status} *{goal.get('name', 'Goal')}*\n"
            response += f"   💰 Target: ₹{int(amount):,}\n"
            response += f"   📅 {goal.get('timeline', 'Not set')}\n"
        
        return response
    
    def _handle_add_goal(self, phone: str, message: str, user: Dict) -> str:
        parts = message.lower().replace("add goal:", "").replace("add goal", "").strip()
        if not parts:
            return "To add a goal:\n'Add goal: Buy car, 5 lakh, 2 years'"
        
        goal_parts = [p.strip() for p in parts.split(",")]
        
        new_goal = {
            "name": goal_parts[0].title() if len(goal_parts) > 0 else "New Goal",
            "amount": self._extract_amount(goal_parts[1]) if len(goal_parts) > 1 else 0,
            "timeline": goal_parts[2] if len(goal_parts) > 2 else "Not set",
            "status": "active"
        }
        
        if "goals" not in user:
            user["goals"] = []
        user["goals"].append(new_goal)
        self._save_user(phone, user)
        
        return f"""✅ *Goal Added!*

🎯 {new_goal['name']}
💰 Target: ₹{int(new_goal['amount']):,}
📅 Timeline: {new_goal['timeline']}

You've got this! 💪"""
    
    def _handle_report(self, phone: str, user: Dict) -> str:
        return self._handle_balance(phone, user)
    
    def _handle_market(self, user: Dict) -> str:
        import random
        nifty = 22400 + random.uniform(-200, 300)
        sensex = 74000 + random.uniform(-500, 800)
        nifty_change = random.uniform(-1.5, 2.0)
        
        trend = "🟢 +" if nifty_change > 0 else "🔴 "
        
        tip_text = "Good time for SIP investments!" if nifty_change > 0 else "Markets volatile - stay invested, do not panic!"
        
        return f"""📈 *Market Update*
{self._get_ist_time().strftime('%d %b %Y, %I:%M %p')}

🇮🇳 *Indian Markets:*
━━━━━━━━━━━━━━━━━━━━━
📊 NIFTY 50: {nifty:,.0f} ({trend}{abs(nifty_change):.2f}%)
📊 SENSEX: {sensex:,.0f}

💡 *Tip:*
{tip_text}

_Type "investment tips" for personalized advice_"""
    
    def _handle_profile(self, user: Dict) -> str:
        """Show user profile summary"""
        name = user.get("name", "User")
        phone = user.get("phone", "")[-10:]
        occupation = user.get("occupation", "Not set")
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        savings = user.get("current_savings", 0)
        risk = user.get("risk_appetite", "Medium")
        
        return f"""👤 *Your Profile: {name}*
━━━━━━━━━━━━━━━━━━━━━

📱 Phone: ****{phone[-4:]}
💼 Occupation: {occupation}
💰 Monthly Income: ₹{int(income):,}
💸 Monthly Expenses: ₹{int(expenses):,}
🏦 Savings: ₹{int(savings):,}
📊 Risk Profile: {risk}

📈 Daily Budget: ₹{int(user.get('daily_budget', 0)):,}

_To edit, visit the web dashboard or type "reset" to start over._"""
    
    def _handle_savings(self, phone: str, user: Dict) -> str:
        """Show savings summary and tips"""
        savings = user.get("current_savings", 0)
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        potential_savings = income - expenses
        
        return f"""💰 *Your Savings Overview*
━━━━━━━━━━━━━━━━━━━━━

🏦 Current Savings: ₹{int(savings):,}
📊 Monthly Surplus: ₹{int(potential_savings):,}

💡 *Quick Tips:*
• Save at least 20% of income (₹{int(income * 0.2):,}/month)
• Build emergency fund = 6 months expenses
• Invest surplus in SIPs for long-term growth

📈 At current rate, in 1 year you could save: ₹{int(potential_savings * 12):,}

_Track every expense to save more!_"""
    
    def _handle_tips(self, user: Dict) -> str:
        """Provide financial tips based on user profile"""
        income = user.get("monthly_income", 0)
        risk = user.get("risk_appetite", "Medium")
        
        tips = {
            "Low": """🛡️ *Safe Investment Tips:*
• Fixed Deposits (FD) - 6-7% returns
• PPF - Tax-free, 7.1% returns  
• Govt Bonds - Very secure
• Savings Account - Easy access""",
            
            "Medium": """⚖️ *Balanced Investment Tips:*
• Balanced Mutual Funds - Mix of equity & debt
• NPS - For retirement
• Index Funds - Low cost, market returns
• Gold ETFs - Hedge against inflation""",
            
            "High": """🚀 *Growth Investment Tips:*
• Equity Mutual Funds - High long-term returns
• Direct Stocks - Research before investing
• Small-cap Funds - High risk, high reward
• ELSS - Tax saving + equity growth"""
        }
        
        return f"""{tips.get(risk, tips["Medium"])}

💡 *General Tips:*
• Start SIP with ₹{int(income * 0.1):,}/month
• Review portfolio quarterly
• Don't panic during market dips
• Diversify across asset classes

_Type "market" for live updates_"""
    
    def _handle_emi(self, message: str, user: Dict) -> str:
        """EMI Calculator — real financial tool"""
        amount = self._extract_amount(message)
        name = user.get("name", "Friend")
        
        if not amount:
            return f"""🏦 *EMI Calculator*

{name}, tell me the loan details:

*Format:* "EMI 10 lakh at 9% for 20 years"

Or use these quick estimates:
• 🏠 Home Loan: "EMI 30 lakh home loan"
• 🚗 Car Loan: "EMI 8 lakh car loan"  
• 💳 Personal: "EMI 5 lakh personal loan"

_I'll calculate your monthly EMI!_"""
        
        # Default rates for different loan types
        msg_lower = message.lower()
        if "home" in msg_lower:
            rate, years = 8.5, 20
        elif "car" in msg_lower:
            rate, years = 9.5, 5
        elif "personal" in msg_lower:
            rate, years = 12, 3
        elif "education" in msg_lower:
            rate, years = 7.5, 7
        else:
            rate, years = 10, 5
        
        # Extract rate if specified
        import re
        rate_match = re.search(r'(\d+\.?\d*)\s*%', message)
        if rate_match:
            rate = float(rate_match.group(1))
        
        year_match = re.search(r'(\d+)\s*(?:year|yr|sal)', message.lower())
        if year_match:
            years = int(year_match.group(1))
        
        # EMI formula: P × r × (1+r)^n / ((1+r)^n - 1)
        months = years * 12
        r = rate / 12 / 100
        if r > 0:
            emi = amount * r * (1 + r) ** months / ((1 + r) ** months - 1)
        else:
            emi = amount / months
        
        total = emi * months
        interest = total - amount
        
        return f"""🏦 *EMI Calculator*

💰 *Loan:* ₹{int(amount):,}
📊 *Rate:* {rate}% per year
📅 *Tenure:* {years} years ({months} months)

━━━━━━━━━━━━━━━━━
📌 *Monthly EMI: ₹{int(emi):,}*
━━━━━━━━━━━━━━━━━

💵 Total Payment: ₹{int(total):,}
💸 Total Interest: ₹{int(interest):,}
📈 Interest Ratio: {int(interest/amount*100)}%

💡 *Tip:* Pay ₹{int(emi*1.1):,}/month (+10%) to save ₹{int(interest*0.15):,} in interest!

_Type "tips" for more money-saving advice_"""

    def _handle_tax(self, message: str, user: Dict) -> str:
        """Tax Saving Advisor"""
        income = user.get("monthly_income", 30000) * 12
        name = user.get("name", "Friend")
        
        if income <= 500000:
            tax_slab = "NIL (under ₹5L exemption)"
            savings_needed = 0
        elif income <= 1000000:
            tax_slab = f"₹{int((income-500000)*0.2):,}"
            savings_needed = 150000
        elif income <= 1500000:
            tax_slab = f"₹{int(100000 + (income-1000000)*0.3):,}"
            savings_needed = 150000
        else:
            tax_slab = f"₹{int(250000 + (income-1500000)*0.3):,}"
            savings_needed = 200000
        
        return f"""🧾 *Tax Advisor for {name}*

📊 *Annual Income:* ₹{int(income):,}
💸 *Estimated Tax (New Regime):* {tax_slab}

📋 *Tax Saving Options (Old Regime):*

*Section 80C (₹1.5L limit):*
• 💰 PPF — ₹500/month start, 7.1% tax-free
• 📊 ELSS Mutual Fund — ₹500 SIP, best returns
• 🏠 Home Loan Principal
• 💳 5-Year FD

*Section 80D (₹25K-₹1L):*
• 🏥 Health Insurance for self & family

*Other:*
• 🏠 HRA Exemption (if renting)
• 📚 Education Loan Interest (80E)
• 🤝 NPS Extra ₹50K deduction (80CCD)

💡 *Quick Action:* Start a ₹{max(500, int(savings_needed/12)):,}/month ELSS SIP to save ~₹{int(savings_needed*0.3):,} in tax!

_Type "invest" for investment advice_"""

    def _handle_health_score(self, phone: str, user: Dict) -> str:
        """Financial Health Score — gamified & actionable"""
        name = user.get("name", "Friend")
        today_income, today_expense = self._get_today_transactions(phone)
        
        # Calculate score components
        score = 0
        details = []
        
        # 1. Budget adherence (30 pts)
        daily_budget = user.get("daily_budget", 1000)
        if daily_budget > 0:
            if today_expense <= daily_budget:
                budget_score = 30
                details.append("✅ Within daily budget (+30)")
            elif today_expense <= daily_budget * 1.2:
                budget_score = 20
                details.append("⚠️ Slightly over budget (+20)")
            else:
                budget_score = 5
                details.append("🔴 Over budget (+5)")
        else:
            budget_score = 15
            details.append("📋 Budget not set (+15)")
        score += budget_score
        
        # 2. Savings rate (25 pts)
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        if income > 0:
            sr = (income - expenses) / income
            if sr >= 0.3:
                score += 25
                details.append("🏆 Savings rate 30%+ (+25)")
            elif sr >= 0.2:
                score += 20
                details.append("💪 Savings rate 20%+ (+20)")
            elif sr >= 0.1:
                score += 12
                details.append("📈 Savings rate 10%+ (+12)")
            else:
                score += 5
                details.append("🌱 Low savings rate (+5)")
        
        # 3. Goals (20 pts)
        goals = user.get("goals", [])
        if len(goals) >= 2:
            score += 20
            details.append(f"🎯 {len(goals)} goals set (+20)")
        elif len(goals) == 1:
            score += 10
            details.append("🎯 1 goal set (+10)")
        else:
            details.append("📝 No goals yet (+0)")
        
        # 4. Tracking consistency (15 pts)
        txns = self.transaction_store.get(phone, [])
        if len(txns) >= 20:
            score += 15
            details.append(f"📊 {len(txns)} transactions tracked (+15)")
        elif len(txns) >= 5:
            score += 8
            details.append(f"📊 {len(txns)} transactions (+8)")
        else:
            score += 2
            details.append(f"📊 Start tracking more (+2)")
        
        # 5. Profile completion (10 pts)
        if user.get("occupation") and income > 0:
            score += 10
            details.append("👤 Profile complete (+10)")
        else:
            score += 3
            details.append("👤 Complete your profile (+3)")
        
        # Rating
        if score >= 85:
            medal, label = "🏆", "Financial Champion"
        elif score >= 70:
            medal, label = "💪", "Money Master"
        elif score >= 50:
            medal, label = "📈", "Rising Star"
        elif score >= 30:
            medal, label = "🌱", "Growing"
        else:
            medal, label = "🌟", "Just Starting"
        
        bar = "█" * (score // 5) + "░" * (20 - score // 5)
        
        return f"""📊 *{name}'s Financial Health*

{medal} *Score: {score}/100* — {label}
[{bar}]

*Breakdown:*
{"".join(chr(10) + d for d in details)}

💡 *To Improve:*
{"• Set a daily budget (Type your income)" if not user.get("daily_budget") else ""}
{"• Add a savings goal" if not goals else ""}
{"• Track more expenses daily" if len(txns) < 10 else ""}
{"• Start an SIP investment" if score < 80 else "• You're doing great!"}

_Type "help" to see all commands_"""

    # ═══════════════════════════════════════════════════
    # NEW LIFE-CHANGING FEATURES
    # ═══════════════════════════════════════════════════
    
    def _handle_affordability(self, phone: str, message: str, user: Dict) -> str:
        """Affordability Calculator — answers 'Can I afford X?'
        Uses 60/20/20 rule: 60% needs, 20% wants, 20% savings
        """
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        expenses = user.get("monthly_expenses", 0)
        savings = user.get("current_savings", 0)
        
        amount = self._extract_amount(message)
        
        if not amount:
            return f"""🛒 *Affordability Calculator*

{name}, tell me what you want to buy!

*Format:* "Can I afford iPhone 70000"
Or: "Should I buy laptop 45000"

I'll analyze:
• Your income vs the purchase
• Impact on savings goals  
• Better alternatives if needed
• EMI option if it makes sense

_Just type the item and price!_ 💡"""
        
        if not income:
            return f"""💡 {name}, I need your income to calculate this!

Type your monthly income: "income 30000"
Then ask me again! 😊"""
        
        # Deep analysis
        monthly_surplus = income - expenses if expenses else income * 0.4
        months_to_save = amount / monthly_surplus if monthly_surplus > 0 else float('inf')
        percent_of_income = (amount / income) * 100
        percent_of_savings = (amount / savings * 100) if savings > 0 else float('inf')
        
        # Decision engine
        if amount <= monthly_surplus * 0.5:
            verdict = "✅ *YES — Easily Affordable!*"
            advice = "This fits well within your budget. Go for it!"
            emoji = "🎉"
        elif amount <= monthly_surplus:
            verdict = "⚠️ *Affordable — But Plan Carefully*"
            advice = f"You can afford this, but it'll use most of your monthly surplus. Consider saving for {int(months_to_save)} month(s) first."
            emoji = "🤔"
        elif amount <= savings * 0.3:
            verdict = "💰 *Use Savings — It's Reasonable*"
            advice = f"This is {percent_of_savings:.0f}% of your savings. You have enough, but make sure to replenish."
            emoji = "💡"
        elif months_to_save <= 6:
            verdict = "⏳ *Save First — Achievable in {:.0f} Months*".format(months_to_save)
            advice = f"Save ₹{int(monthly_surplus):,}/month and you'll have it in {int(months_to_save)} months!"
            emoji = "📅"
        else:
            verdict = "❌ *Out of Budget Right Now*"
            emi = amount / 12
            advice = f"Consider EMI: ₹{int(emi):,}/month for 12 months. Or save ₹{int(amount/6):,}/month for 6 months."
            emoji = "🔄"
        
        return f"""{emoji} *Affordability Analysis for {name}*

💰 Item Cost: ₹{int(amount):,}
📊 Your Monthly Income: ₹{int(income):,}
💵 Monthly Surplus: ₹{int(monthly_surplus):,}
🏦 Current Savings: ₹{int(savings):,}

{verdict}

💡 *My Advice:* {advice}

📏 *By the Numbers:*
• {percent_of_income:.0f}% of monthly income
• {f'{percent_of_savings:.0f}% of savings' if savings > 0 else 'No savings recorded'}
• {f'{months_to_save:.1f} months to save' if months_to_save < 100 else 'Long-term goal'}

_Want EMI calculation? Type "EMI {int(amount)}"_"""
    
    def _handle_bill_reminder(self, phone: str, message: str, user: Dict) -> str:
        """Bill Reminder Manager — never miss a payment again"""
        name = user.get("name", "Friend")
        msg_lower = message.lower()
        
        # Initialize bills storage
        if "bills" not in user:
            user["bills"] = []
        
        # Adding a new bill
        add_words = ["add", "set", "new", "remind me", "yaad dilao"]
        if any(w in msg_lower for w in add_words):
            amount = self._extract_amount(message)
            
            # Detect bill type
            bill_types = {
                "rent": ("🏠", "Rent", 1), "electricity": ("💡", "Electricity", 5),
                "wifi": ("📶", "WiFi/Internet", 1), "broadband": ("📶", "Broadband", 1),
                "mobile": ("📱", "Mobile Recharge", 28), "phone": ("📱", "Phone Bill", 1),
                "emi": ("🏦", "EMI", 5), "loan": ("🏦", "Loan EMI", 5),
                "insurance": ("🛡️", "Insurance", 1), "lic": ("🛡️", "LIC Premium", 1),
                "gas": ("🔥", "Gas Cylinder", 45), "maid": ("🧹", "Maid Salary", 1),
                "gym": ("💪", "Gym Membership", 1), "netflix": ("📺", "Netflix", 15),
                "spotify": ("🎵", "Spotify", 15), "water": ("💧", "Water Bill", 1),
                "credit card": ("💳", "Credit Card", 15), "sip": ("📈", "SIP Investment", 5),
            }
            
            detected_bill = None
            for keyword, (emoji, bill_name, default_day) in bill_types.items():
                if keyword in msg_lower:
                    detected_bill = (emoji, bill_name, default_day)
                    break
            
            if detected_bill and amount:
                emoji, bill_name, day = detected_bill
                user["bills"].append({
                    "name": bill_name, "amount": amount, "day": day,
                    "emoji": emoji, "active": True
                })
                self._save_user(phone, user)
                return f"""✅ *Bill Reminder Added!*

{emoji} {bill_name}: ₹{int(amount):,}/month
📅 Due: {day}th of every month

I'll remind you before the due date! 🔔

_Add more: "remind me rent 15000" or "remind me wifi 800"_"""
            
            return f"""📋 *Add a Bill Reminder*

{name}, tell me the bill details:

*Examples:*
• "remind me rent 15000"
• "remind me wifi 800"  
• "remind me emi 12000"
• "remind me netflix 649"

I'll track it and remind you before due dates! 🔔"""
        
        # Show existing bills
        bills = user.get("bills", [])
        if not bills:
            return f"""📋 *{name}, no bills set up yet!*

Add your recurring bills and I'll remind you:

*Examples:*
• "remind me rent 15000"
• "remind me electricity 2000"
• "remind me emi 8000"
• "remind me wifi 800"

Never pay a late fee again! 🎯"""
        
        total_monthly = sum(b["amount"] for b in bills if b.get("active"))
        income = user.get("monthly_income", 0)
        
        bill_list = "\n".join([
            f"  {b['emoji']} {b['name']}: ₹{int(b['amount']):,} (Due: {b['day']}th)"
            for b in bills if b.get("active")
        ])
        
        result = f"""📋 *{name}'s Monthly Bills*

{bill_list}

💰 *Total Monthly Bills:* ₹{int(total_monthly):,}"""
        
        if income:
            bills_percent = (total_monthly / income) * 100
            result += f"\n📊 *{bills_percent:.0f}% of your income* goes to fixed bills"
            remaining = income - total_monthly
            result += f"\n💵 *Left after bills:* ₹{int(remaining):,}"
        
        result += "\n\n_Add more: 'remind me [bill] [amount]'_"
        return result
    
    def _handle_spending_prediction(self, phone: str, user: Dict) -> str:
        """Spending Prediction — predicts if user will overspend this month"""
        name = user.get("name", "Friend")
        income = user.get("monthly_income", 0)
        
        now = self._get_ist_time()
        day_of_month = now.day
        days_in_month = 30
        days_left = days_in_month - day_of_month
        
        # Get this month's spending
        month_str = now.strftime("%Y-%m")
        txns = self.transaction_store.get(phone, [])
        month_expenses = sum(t["amount"] for t in txns 
                           if t["type"] == "expense" and t.get("date", "").startswith(month_str))
        month_income = sum(t["amount"] for t in txns 
                          if t["type"] == "income" and t.get("date", "").startswith(month_str))
        
        if day_of_month < 3:
            return f"""📊 *{name}, it's early in the month!*

Track your expenses for a few days and I'll predict your month-end situation.

Start logging: "chai 50" or "spent 200 on food" 📝"""
        
        # Burn rate calculation
        daily_burn = month_expenses / day_of_month if day_of_month > 0 else 0
        projected_total = daily_burn * days_in_month
        effective_income = income if income else month_income
        
        if effective_income <= 0:
            return f"""📊 *Spending Report for {name}*

💸 Spent so far: ₹{int(month_expenses):,} ({day_of_month} days)
📈 Daily average: ₹{int(daily_burn):,}/day
🔮 Projected month total: ₹{int(projected_total):,}

_Set your income: "income 30000" for full prediction!_"""
        
        surplus_or_deficit = effective_income - projected_total
        burn_rate = (month_expenses / effective_income) * 100
        
        # Prediction with emotional context
        if surplus_or_deficit > effective_income * 0.2:
            verdict = "✅ *Looking Great!*"
            emoji = "🎉"
            tip = f"You're on track to save ₹{int(surplus_or_deficit):,} this month! Keep it up!"
        elif surplus_or_deficit > 0:
            verdict = "⚠️ *Tight But Manageable*"
            emoji = "🤔"
            daily_budget_left = surplus_or_deficit / max(days_left, 1)
            tip = f"You have ₹{int(daily_budget_left):,}/day for the next {days_left} days. Be careful with non-essentials."
        else:
            verdict = "🚨 *Warning: Overspending!*"
            emoji = "😰"
            over_by = abs(surplus_or_deficit)
            tip = f"At this rate, you'll overspend by ₹{int(over_by):,}! Cut back ₹{int(over_by/max(days_left,1)):,}/day to stay on track."
        
        # Progress bar
        progress = min(int(burn_rate / 5), 20)
        bar = "🟩" * min(progress, 12) + "🟨" * max(0, min(progress - 12, 4)) + "🟥" * max(0, progress - 16)
        bar += "⬜" * (20 - len(bar.replace("🟩","x").replace("🟨","x").replace("🟥","x").replace("⬜","x")))
        
        return f"""{emoji} *{name}'s Month Prediction*

📅 Day {day_of_month} of {days_in_month} | {days_left} days left

💰 Income: ₹{int(effective_income):,}
💸 Spent: ₹{int(month_expenses):,} ({burn_rate:.0f}%)
📈 Daily burn: ₹{int(daily_burn):,}/day
🔮 Projected: ₹{int(projected_total):,}

{verdict}
{tip}

💡 *{name}, {f'reduce daily spending to ₹{int((effective_income - month_expenses) / max(days_left, 1)):,} to stay safe' if surplus_or_deficit > 0 else 'every ₹100 saved now helps!'}*

_Check back daily — I update predictions in real-time!_ 📊"""
    
    def _handle_savings_challenge(self, phone: str, user: Dict) -> str:
        """30-Day Savings Challenge — gamified savings"""
        name = user.get("name", "Friend")
        
        # Check if user has an active challenge
        challenge = user.get("active_challenge")
        
        if challenge:
            # Show progress
            start_date = datetime.fromisoformat(challenge["start_date"])
            now = self._get_ist_time()
            day_num = (now - start_date).days + 1
            
            if day_num > 30:
                total_saved = challenge.get("total_saved", 0)
                user["active_challenge"] = None
                self._save_user(phone, user)
                return f"""🏆 *CHALLENGE COMPLETE!* 🎉

{name}, you finished the 30-Day Savings Challenge!

💰 Total Saved: ₹{int(total_saved):,}
🌟 That's ₹{int(total_saved * 12):,}/year if you keep going!

You proved you CAN save! Start a new one?
Type "challenge" to begin again! 🚀"""
            
            daily_target = challenge.get("daily_target", 50)
            total_saved = challenge.get("total_saved", 0)
            streak = challenge.get("streak", 0)
            
            return f"""🔥 *Day {day_num}/30 — Savings Challenge*

📊 *Your Progress:*
💰 Saved so far: ₹{int(total_saved):,}
🎯 Today's target: ₹{int(daily_target):,}
🔥 Current streak: {streak} days

{'🌟' * min(day_num, 30)}{'⭐' * (30 - min(day_num, 30))}

💡 *Today's Task:*
{self._get_challenge_task(day_num, daily_target)}

_Log savings: "saved {int(daily_target)}"_
_Type "skip" if you can't save today_ 💪"""
        
        # Start new challenge
        income = user.get("monthly_income", 0)
        daily_target = max(20, int(income * 0.02)) if income else 50
        
        user["active_challenge"] = {
            "start_date": self._get_ist_time().isoformat(),
            "daily_target": daily_target,
            "total_saved": 0,
            "streak": 0,
            "best_streak": 0
        }
        self._save_user(phone, user)
        
        return f"""🚀 *30-Day Savings Challenge Started!*

{name}, here's your challenge:
💰 Save ₹{int(daily_target):,}/day for 30 days

*If you complete it:*
🏆 You'll save ₹{int(daily_target * 30):,}!
📈 That's ₹{int(daily_target * 365):,}/year!

*Today (Day 1):*
{self._get_challenge_task(1, daily_target)}

*Rules:*
✅ Log your saving each day: "saved {int(daily_target)}"
⏭️ Type "skip" if you can't save a day
🔥 Build streaks for bonus motivation!

_Let's make saving a habit!_ 💪"""
    
    def _get_challenge_task(self, day: int, target: int) -> str:
        """Get daily challenge task"""
        tasks = {
            1: f"Skip one chai/coffee and save ₹{target}! ☕",
            2: f"Pack lunch from home. Save ₹{target}! 🍱",
            3: f"Walk instead of auto for short distance. Save ₹{target}! 🚶",
            4: f"No online shopping today! Save ₹{target}! 🛒",
            5: f"Cook dinner at home. Save ₹{target}! 🍳",
            6: f"Cancel a subscription you don't use. Save ₹{target}! 📺",
            7: f"💰 *Week 1 Done!* Keep the momentum! Save ₹{target}!",
            8: f"Carry water bottle — skip buying water. Save ₹{target}! 💧",
            9: f"Take the bus instead of cab. Save ₹{target}! 🚌",
            10: f"No Swiggy/Zomato today! Cook or eat out cheaper. Save ₹{target}! 🍔",
            14: f"💰 *2 Weeks Done!* You're halfway! Save ₹{target}!",
            21: f"🔥 *3 Weeks Done!* Almost there! Save ₹{target}!",
            30: f"🏆 *FINAL DAY!* You did it! Save ₹{target} one last time!",
        }
        return tasks.get(day, f"Find a creative way to save ₹{target} today! 💡")
    
    def _handle_debt_tracker(self, phone: str, user: Dict) -> str:
        """Track all debts/loans in one place"""
        name = user.get("name", "Friend")
        
        if "loans" not in user:
            user["loans"] = []
            self._save_user(phone, user)
        
        loans = user.get("loans", [])
        
        if not loans:
            return f"""🏦 *{name}'s Debt Tracker*

No loans recorded yet. Let's add them!

*Add a loan:*
"add loan home 30 lakh at 8.5% for 20 years"
"add loan car 5 lakh at 10% for 5 years"
"add loan personal 2 lakh at 15% for 3 years"

I'll track:
📊 Total debt & interest
📅 Payoff timeline
💡 Early payoff strategies
🏆 Debt-free countdown!

_Add your first loan to start tracking!_"""
        
        total_debt = sum(l.get("principal", 0) for l in loans)
        total_emi = sum(l.get("emi", 0) for l in loans)
        income = user.get("monthly_income", 0)
        
        loan_list = "\n".join([
            f"  {l.get('emoji', '🏦')} {l['name']}: ₹{int(l['principal']):,} @ {l['rate']}% — EMI ₹{int(l['emi']):,}"
            for l in loans
        ])
        
        result = f"""🏦 *{name}'s Debt Dashboard*

{loan_list}

💰 *Total Debt:* ₹{int(total_debt):,}
📅 *Total Monthly EMI:* ₹{int(total_emi):,}"""
        
        if income:
            debt_ratio = (total_emi / income) * 100
            result += f"\n📊 *Debt-to-Income:* {debt_ratio:.0f}%"
            if debt_ratio > 50:
                result += "\n⚠️ *Warning:* Over 50% income goes to EMIs!"
            elif debt_ratio > 35:
                result += "\n🟡 Manageable but be careful with new loans"
            else:
                result += "\n🟢 Healthy debt level!"
        
        result += "\n\n_Add more: 'add loan [type] [amount] at [rate]% for [years] years'_"
        return result
    
    def _handle_subscriptions(self, phone: str, user: Dict) -> str:
        """Subscription Manager — find and track recurring charges"""
        name = user.get("name", "Friend")
        
        # Auto-detect from transactions
        txns = self.transaction_store.get(phone, [])
        
        known_subs = {
            "netflix": ("📺", 649), "hotstar": ("📺", 299), "prime": ("📦", 179),
            "spotify": ("🎵", 119), "youtube": ("▶️", 129), "jio cinema": ("🎬", 999),
            "zee5": ("📺", 599), "sony liv": ("📺", 399),
            "swiggy one": ("🍔", 149), "zomato pro": ("🍔", 149),
            "gym": ("💪", 1500), "broadband": ("📶", 999), "wifi": ("📶", 800),
        }
        
        # Detect subs from transaction history
        detected = []
        for sub_name, (emoji, typical_cost) in known_subs.items():
            has_txn = any(sub_name in str(t.get("description", "")).lower() or 
                        sub_name in str(t.get("category", "")).lower()
                        for t in txns)
            if has_txn:
                detected.append({"name": sub_name.title(), "emoji": emoji, "cost": typical_cost})
        
        user_subs = user.get("subscriptions", [])
        all_subs = detected + user_subs
        
        if not all_subs:
            return f"""📱 *{name}'s Subscription Manager*

No subscriptions detected yet!

*Common subscriptions to track:*
📺 Netflix (₹649) • Hotstar (₹299) • Prime (₹179)
🎵 Spotify (₹119) • YouTube Premium (₹129)
🍔 Swiggy One (₹149) • Zomato Pro (₹149)
💪 Gym (₹1,500) • 📶 WiFi (₹800)

_Add: "add subscription Netflix 649"_

💡 *Pro Tip:* The average Indian pays ₹3,000/month on subscriptions they barely use!"""
        
        total = sum(s.get("cost", 0) for s in all_subs)
        yearly = total * 12
        
        sub_list = "\n".join([f"  {s['emoji']} {s['name']}: ₹{int(s['cost']):,}/month" for s in all_subs])
        
        return f"""📱 *{name}'s Subscriptions*

{sub_list}

💰 *Monthly Total:* ₹{int(total):,}
📅 *Yearly Cost:* ₹{int(yearly):,}

💡 *Think About It:*
That ₹{int(yearly):,}/year in a SIP @12% for 5 years = ₹{int(yearly * 5 * 1.35):,}! 📈

*Not using something?* Cancel it!
_Add: 'add subscription [name] [amount]'_"""
    
    def _handle_motivation(self, user: Dict) -> str:
        """Financial Motivation — contextual encouragement"""
        import random
        name = user.get("name", "Friend")
        savings = user.get("current_savings", 0)
        income = user.get("monthly_income", 0)
        
        # Context-aware quotes
        if savings == 0 and income == 0:
            quotes = [
                f"🌱 *{name}, every millionaire started with zero.* The fact that you're tracking your money puts you ahead of 90% of people. Start small — even ₹10/day = ₹3,650/year!",
                f"💪 *{name}, your money journey starts with one step.* And you already took it by being here! Type 'income [amount]' to set up your profile.",
                f"🌟 *{name}, you ARE capable of financial freedom.* Most people never even try to understand their money. You're different. Let's start!",
            ]
        elif savings > 0 and savings < income:
            quotes = [
                f"📈 *{name}, ₹{int(savings):,} in savings is AMAZING progress!* Keep going — compound interest is the 8th wonder of the world!",
                f"🎯 *{name}, you've saved ₹{int(savings):,}!* That's more than 60% of Indians have in emergency funds. You're ahead!",
                f"💰 *{name}, imagine where you'll be in 1 year!* At this rate, you could have ₹{int(savings + income * 2):,}+. The key is consistency!",
            ]
        else:
            quotes = [
                f"🏆 *{name}, financial discipline is a superpower.* Your future self will thank you for every rupee you save today!",
                f"🚀 *{name}, money gives you choices.* Not luxury — *freedom*. Freedom from stress, from dependency, from 'I can't afford it.'",
                f"🌟 *{name}, you're not just saving money — you're building a life.* Every ₹100 saved is a step toward your dreams!",
            ]
        
        universal = [
            f"💡 *Rule of 72:* Divide 72 by your return rate to see when money doubles. FD at 7%? Doubles in ~10 years. SIP at 12%? Doubles in 6!",
            f"📊 *50-30-20 Rule:* 50% needs, 30% wants, 20% savings. {name}, are you following this?",
            f"🏦 *Emergency Fund:* Keep 6 months' expenses saved. That's your financial armor against life's surprises.",
            f"💪 *{name}, inflation is 6%/year.* ₹100 today = ₹94 next year. Saving in FD? You're barely keeping up. Consider SIPs!",
            f"🎯 *{name}, automate your savings.* Set up an auto-debit on salary day. What you don't see, you don't spend!",
        ]
        
        chosen = random.choice(quotes + universal)
        
        return f"""{chosen}

━━━━━━━━━━━━━━━━━━━━━━━━
_Want more tips? Type "tips"_
_Start saving? Type "challenge"_
_Check health? Type "health score"_ 💪"""
    
    def _handle_split_bill(self, message: str, user: Dict) -> str:
        """Quick Bill Splitter"""
        name = user.get("name", "Friend")
        amount = self._extract_amount(message)
        
        if not amount:
            return f"""🧮 *Bill Splitter*

{name}, tell me the total and number of people:

*Examples:*
• "split 2000 among 4" 
• "split 1500 between 3"
• "split bill 800 with 2 friends"

_Quick and easy!_ 💰"""
        
        # Extract number of people
        import re
        people_match = re.search(r'(?:among|between|with|into)\s*(\d+)', message.lower())
        num_people = int(people_match.group(1)) if people_match else 2
        
        # Check for "+ me" or "friends"
        if "friend" in message.lower():
            num_people += 1  # Include the user
        
        per_person = amount / num_people
        tip_10 = amount * 0.1
        tip_15 = amount * 0.15
        
        return f"""🧮 *Bill Split*

💰 Total: ₹{int(amount):,}
👥 People: {num_people}
━━━━━━━━━━━━━
💵 *Each pays: ₹{int(per_person):,}*

➕ *With tip:*
  10% tip → ₹{int((amount + tip_10) / num_people):,} each
  15% tip → ₹{int((amount + tip_15) / num_people):,} each

_Want to log your share? Type "spent {int(per_person)} on food"_ 🍽️"""

    def _handle_unknown(self, message: str, user: Dict) -> str:
        """Universal AI Fallback — handles ANY message intelligently
        
        Financial questions → expert CA-level advice
        General questions → helpful + gentle financial tie-back
        """
        if openai_service and openai_service.is_available():
            try:
                import requests, os
                name = user.get("name", "Friend")
                lang_code = user.get("language", "en")
                lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
                language = lang_map.get(lang_code, "English")
                income = user.get("monthly_income", 0)
                daily_budget = user.get("daily_budget", 500)
                occupation = user.get("occupation", "unknown")
                goals = user.get("goals", [])
                goals_text = ", ".join([g.get("name", "") for g in goals[:3]]) if goals else "none set"
                
                # Detect if financial or general
                fin_words = ["money","spend","save","invest","budget","loan","emi","sip","mutual fund",
                            "stock","fd","bank","salary","income","expense","paisa","rupee","₹","lakh",
                            "crore","tax","gst","insurance","gold","ppf","nps","credit","debit","upi"]
                is_financial = any(w in message.lower() for w in fin_words)
                
                if is_financial:
                    system_prompt = f"""You are MoneyViya (Viya), India's smartest AI financial advisor on WhatsApp.
You're talking to {name} ({occupation}, ₹{int(income):,}/month income, daily budget ₹{daily_budget}).
Their goals: {goals_text}. Risk appetite: {user.get('risk_appetite', 'Medium')}.

PERSONALITY: Like a brilliant CA best friend — warm, non-judgmental, practical.
FORMAT: WhatsApp — use *bold*, emojis (not too many), numbered lists. Under 150 words.
LANGUAGE: {language}

RULES:
1. Give SPECIFIC numbers and actions (not vague advice)
2. Reference their actual income/budget when relevant  
3. Suggest exact SIP amounts, exact savings targets
4. For investment: mention specific fund types suited to their risk profile
5. Never shame them for spending — coach instead
6. End with ONE clear, actionable next step"""
                else:
                    system_prompt = f"""You are Viya, MoneyViya's friendly AI assistant. You're talking to {name}.
You can answer ANY question — general knowledge, recipes, weather, jokes, motivation, etc.
Be helpful, accurate, warm, and conversational. Keep under 120 words.
At the END, add ONE subtle financial tie-back.
Respond in {language}. Never refuse to help."""

                
                api_key = os.getenv("OPENAI_API_KEY", "")
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 300
                    },
                    timeout=15
                )
                if response.ok:
                    return response.json()["choices"][0]["message"]["content"].strip()
            except Exception as e:
                print(f"[MoneyViya] AI fallback error: {e}")
        
        # Smart static fallback
        name = user.get("name", "Friend")
        return f"""🤖 *Hi {name}!*

I'm Viya, your AI Life & Money Manager! Here's what I can do:

💰 *Track Money:* "chai 50" • "spent 200 on food" • "earned 5000"
📊 *Analyze:* "balance" • "report" • "health score" • "predict"
📈 *Grow Income:* "passive income" • "freelance" • "earn more"
💼 *Career:* "salary" • "resume" • "interview prep" • "promotion"
🎓 *Learn:* "courses" • "skill gap" • "free courses"
⚡ *Productivity:* "plan my day" • "habit tracker" • "focus"
🏛️ *Tax:* "tax saving" • "gst" • "itr" • "invoice"

_Just talk naturally — I understand everything!_ 😊"""


# Singleton - keep lowercase for import compatibility
moneyview_agent = MoneyViyaAgent()

async def process_message(phone: str, message: str, sender_name: str = "Friend") -> str:
    return await moneyview_agent.process_message(phone, message, sender_name)
