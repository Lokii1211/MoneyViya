"""
Advanced WhatsApp Financial Agent v4.0
======================================
Senior-Level AI Agent that serves as the PRIMARY interface for financial management.
Web Dashboard is SECONDARY - only for visualization.

Features:
---------
1. Natural Language Understanding (Multi-language)
2. Context-Aware Conversations
3. Proactive Financial Insights
4. Daily Reminders System
5. OTP Authentication Support
6. Investment Advisory
7. Budget Tracking & Alerts
8. Goal Progress Monitoring
9. Fraud Detection Alerts
10. Family Finance Support

Author: Senior AI Agentic Engineer
"""

import os
import re
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple, Any
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))

# Import core services
try:
    from services.nlp_service import nlp_service
    from services.financial_advisor import financial_advisor
    from services.investment_service import investment_service
    from services.openai_service import openai_service
    from database.user_repository import user_repo
    from database.transaction_repository import transaction_repo
    from database.goal_repository import goal_repo
except ImportError as e:
    print(f"Import warning: {e}")


class AdvancedWhatsAppAgent:
    """
    Senior-Level WhatsApp Financial Agent v5.0
    Primary interface for all financial operations.
    
    Powered by MoneyViya Product Strategy:
    - Money Personality System (The "Money Mirror")
    - Viya Voice Emotional Tone Engine
    - Smart Nudge Engine
    - Achievement & Celebration System
    - Budget Crisis Manager
    """
    
    # ===== Money Personality Types =====
    MONEY_PERSONALITIES = {
        "warrior": {"emoji": "🦁", "name": "The Warrior", "desc": "Aggressive, goal-driven, wants to dominate debt",
                    "tone": "challenge", "motivation": "Give them a challenge to overcome"},
        "protector": {"emoji": "🐢", "name": "The Protector", "desc": "Risk-averse, safety-first, emergency fund obsessed",
                      "tone": "reassure", "motivation": "Reassure safety, give risk-free path"},
        "dreamer": {"emoji": "🦋", "name": "The Dreamer", "desc": "Big goals, poor execution, needs structure",
                    "tone": "inspire", "motivation": "Connect to their big goal, why this matters"},
        "builder": {"emoji": "🐝", "name": "The Builder", "desc": "Consistent, methodical, compound interest type",
                    "tone": "compound", "motivation": "Show them the compound effect"},
        "achiever": {"emoji": "🎯", "name": "The Achiever", "desc": "Competitive, loves progress bars and streaks",
                     "tone": "compete", "motivation": "Frame as a comeback story, leaderboard recovery"},
    }
    
    # ===== Achievement Badges =====
    ACHIEVEMENT_BADGES = {
        "first_expense": {"badge": "📝", "name": "First Step", "desc": "Logged your first expense"},
        "week_streak": {"badge": "🥉", "name": "Week Warrior", "desc": "7-day tracking streak"},
        "month_streak": {"badge": "🥈", "name": "Budget Master", "desc": "30-day tracking streak"},
        "first_goal": {"badge": "🥇", "name": "Goal Crusher", "desc": "First goal achieved"},
        "first_investment": {"badge": "💎", "name": "Wealth Builder", "desc": "First investment started"},
        "emergency_fund": {"badge": "🛡️", "name": "Emergency Shield", "desc": "Emergency fund complete"},
        "savings_10k": {"badge": "⭐", "name": "Star Saver", "desc": "Crossed ₹10,000 savings"},
        "savings_1l": {"badge": "🏆", "name": "Lakh Legend", "desc": "Crossed ₹1,00,000 savings"},
        "100_streak": {"badge": "💯", "name": "Centurion", "desc": "100-day tracking streak"},
    }
    
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        
        # Conversation context storage
        self.conversation_context = {}
        
        # Intent handlers mapping
        self.intent_handlers = {
            "log_expense": self._handle_expense,
            "log_income": self._handle_income,
            "check_balance": self._handle_balance,
            "view_report": self._handle_report,
            "set_goal": self._handle_budget,
            "investment_advice": self._handle_investment,
            "budget_query": self._handle_budget,
            "help": self._handle_help,
            "greeting": self._handle_greeting,
            "otp_request": self._handle_otp_request,
            "confirmation": self._handle_confirmation,
            "market_update": self._handle_market_update,
            "health_check": self._handle_health_check,
        }
        
        # Response templates (Multi-language)
        self.templates = self._load_templates()
        
        # Smart patterns for NLP
        self.smart_patterns = self._load_smart_patterns()
        
    def _load_templates(self) -> Dict:
        """Load response templates for multiple languages"""
        return {
            "en": {
                "welcome": """👋 *Welcome to MoneyViya!*
Your AI Financial Advisor on WhatsApp.

I can help you:
💰 Track expenses & income
📊 Get financial insights
🎯 Set & monitor goals
📈 Investment advice
📋 Generate reports

*Just chat naturally!*
Example: "Spent 500 on groceries" or "How much did I spend this week?"
""",
                "expense_logged": """✅ *Expense Recorded!*

💸 Amount: ₹{amount}
📁 Category: {category}
📅 {date}

💰 Today's Total Spending: ₹{today_total}
📊 Remaining Budget: ₹{remaining}

{tip}""",
                "income_logged": """✅ *Income Recorded!*

💵 Amount: ₹{amount}
📁 Source: {category}
📅 {date}

💰 *Today's Earnings:* ₹{today_income}
🎯 *Goal Progress:* +₹{amount} closer!

{motivation}""",
                "balance_summary": """📊 *Your Financial Summary*

💰 *Current Balance:* ₹{balance}
━━━━━━━━━━━━━━━━━
📈 Income: ₹{income}
📉 Expenses: ₹{expenses}
💵 Savings: ₹{savings}
━━━━━━━━━━━━━━━━━

🎯 Goal: {goal_name}
📊 Progress: {goal_progress}%
📅 Days Left: {days_left}

{insight}""",
                "help_menu": """📱 *MoneyViya Help*

*Quick Commands:*
━━━━━━━━━━━━━━━━━
💸 *Log Expense:* "Spent 200 on food"
💵 *Log Income:* "Earned 5000 from delivery"
📊 *See Balance:* "What's my balance?"
📋 *Report:* "Show weekly report"
🎯 *Goals:* "How's my goal?"
📈 *Invest:* "Investment ideas"
🔐 *Login:* "Send OTP"

*Or just chat naturally!*
I understand context and can help with:
• Budgeting advice
• Savings tips
• Market updates
• Financial planning

Type anything to get started! 💪""",
                "morning_reminder": """☀️ *Good Morning, {name}!*

📅 *Today's Financial Plan:*
━━━━━━━━━━━━━━━━━
💰 Daily Budget: ₹{daily_budget}
🎯 Savings Target: ₹{daily_target}
📊 Yesterday: ₹{yesterday_saved} saved
━━━━━━━━━━━━━━━━━

{motivation}

💡 *Tip:* {daily_tip}

*Track expenses by just texting!*
Example: "Spent 50 on tea" """,
                "evening_checkout": """🌙 *Daily Closing - {date}*

📊 *Today's Summary:*
━━━━━━━━━━━━━━━━━
💵 Income: ₹{income}
💸 Expenses: ₹{expenses}
💰 Net: ₹{net}
━━━━━━━━━━━━━━━━━

{comparison}

🎯 *Goal Progress:*
{progress_bar}
₹{saved}/₹{target} ({progress}%)

{advice}

*Is this complete?* Reply Yes/No
Or add: "Also spent 100 on..."
""",
                "otp_sent": """🔐 *Your MoneyViya Login Code:*

*{otp}*

⏰ Valid for 5 minutes
Do NOT share this with anyone!

Enter this code on the website to access your dashboard.""",
            },
            "hi": {
                "welcome": """👋 *मनीविया में आपका स्वागत है!*
आपका वित्तीय सलाहकार व्हाट्सएप पर।

मैं मदद कर सकता हूं:
💰 खर्च और आय ट्रैक करें
📊 वित्तीय जानकारी पाएं
🎯 लक्ष्य निर्धारित करें

*बस प्राकृतिक रूप से चैट करें!*
उदाहरण: "किराने पर 500 खर्च किए" या "इस हफ्ते कितना खर्च हुआ?"
""",
                "expense_logged": """✅ *खर्च दर्ज!*

💸 राशि: ₹{amount}
📁 श्रेणी: {category}
📅 {date}

💰 आज का कुल खर्च: ₹{today_total}""",
                "income_logged": """✅ *आय दर्ज!*

💵 राशि: ₹{amount}
📁 स्रोत: {category}
📅 {date}

💰 *आज की कमाई:* ₹{today_income}
🎯 *लक्ष्य प्रगति:* +₹{amount} और करीब!

{motivation}""",
            },
            "ta": {
                "welcome": """👋 *மணிவியாவுக்கு வரவேற்கிறோம்!*
உங்கள் நிதி ஆலோசகர் வாட்ஸ்அப்பில்.

நான் உதவ முடியும்:
💰 செலவு மற்றும் வருமானம் கண்காணிக்க
📊 நிதி நுண்ணறிவு பெற
🎯 இலக்குகளை அமைக்க

*இயல்பாக அரட்டை அடிக்கவும்!*
""",
                "expense_logged": """✅ *செலவு பதிவு செய்யப்பட்டது!*

💸 தொகை: ₹{amount}
📁 வகை: {category}
📅 {date}

💰 இன்றைய மொத்த செலவு: ₹{today_total}
📊 மீதமுள்ள பட்ஜெட்: ₹{remaining}

{tip}""",
                "income_logged": """✅ *வருமானம் பதிவு செய்யப்பட்டது!*

💵 தொகை: ₹{amount}
📁 ஆதாரம்: {category}
📅 {date}

💰 *இன்றைய வருமானம்:* ₹{today_income}
🎯 *இலக்கு முன்னேற்றம்:* +₹{amount} நெருக்கமாக!

{motivation}""",
                "balance_summary": """📊 *உங்கள் நிதி சுருக்கம்*

💰 *தற்போதைய இருப்பு:* ₹{balance}
━━━━━━━━━━━━━━━━━
📈 வருமானம்: ₹{income}
📉 செலவுகள்: ₹{expenses}
💵 சேமிப்பு: ₹{savings}

{insight}""",
                "help_menu": """📱 *மணிவியா உதவி*

*விரைவான கட்டளைகள்:*
━━━━━━━━━━━━━━━━━
💸 *செலவு:* "உணவில் 200 செலவழித்தேன்"
💵 *வருமானம்:* "டெலிவரியில் 5000 சம்பாதித்தேன்"
📊 *இருப்பு:* "என் இருப்பு என்ன?"
📋 *அறிக்கை:* "வாராந்திர அறிக்கை காட்டு"

*அல்லது இயல்பாக அரட்டை அடிக்கவும்!* 💪""",
            }
        }

    def _load_smart_patterns(self) -> Dict:
        """Load smart NLP patterns for intent detection"""
        return {
            "expense": {
                "patterns": [
                    r"spent|paid|खर्च|செலவு|ఖర్చు|buy|bought|पैसे दिए",
                    r"(\d+)\s*(rs|rupees|₹|रुपये)?",
                ],
                "categories": {
                    "food": ["food", "खाना", "சாப்பாடு", "tea", "chai", "lunch", "dinner", "breakfast", "snack", "biryani", "pizza"],
                    "transport": ["auto", "bus", "uber", "ola", "petrol", "diesel", "यात्रा", "பயணம்", "train", "metro"],
                    "bills": ["bill", "recharge", "electricity", "बिजली", "phone", "internet", "rent", "किराया"],
                    "shopping": ["amazon", "flipkart", "clothes", "kapde", "shopping", "mall"],
                    "medical": ["medicine", "doctor", "hospital", "दवाई", "மருந்து"],
                    "entertainment": ["movie", "netflix", "game", "मनोरंजन"],
                }
            },
            "income": {
                "patterns": [
                    r"earned|received|got|मिला|கிடைத்தது|salary|income|kamai|வருமானம்",
                ],
                "categories": {
                    "salary": ["salary", "तनख्वाह", "சம்பளம்"],
                    "gig": ["delivery", "uber", "ola", "swiggy", "zomato", "dunzo"],
                    "business": ["business", "shop", "दुकान", "கடை", "sale"],
                    "freelance": ["freelance", "project", "client"],
                    "other": ["gift", "refund", "bonus", "cashback"],
                }
            },
            "query": {
                "balance": [r"balance|बैलेंस|இருப்பு|how much|kitna|எவ்வளவு"],
                "report": [r"report|summary|रिपोर्ट|அறிக்கை|weekly|monthly"],
                "goal": [r"goal|target|लक्ष्य|இலக்கு|progress"],
            },
            "investment": [r"invest|stock|mutual fund|gold|sip|fd|market|share|शेयर"],
            "greeting": [r"^(hi|hello|hey|hola|नमस्ते|வணக்கம்|హాయ్)$"],
            "help": [r"help|menu|मदद|உதவி|సహాయం|what can you do"],
            "health_check": [r"health|score|financial health|money score|checkup|diagnostic|स्वास्थ्य|ஆரோக்கியம்"],
            "confirmation": {
                "positive": [r"^(yes|yeah|yep|हां|ஆம்|అవును|ok|okay|done|confirm|correct|sahi)$"],
                "negative": [r"^(no|nope|नहीं|இல்லை|కాదు|wait|add more|wrong|galat)$"],
            },
            "otp": [r"otp|login|code|verification|वेरिफिकेशन|உறுதிப்படுத்தல்"],
        }

    async def process_message(self, phone: str, message: str, user_data: Dict = None) -> str:
        """
        Main entry point for processing WhatsApp messages
        """
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        
        print(f"[AdvancedAgent] Processing message from {phone}: {message[:50]}...")
        
        # Load user data if not provided
        if user_data is None:
            user_data = user_repo.get_user(phone) or {}
        
        # Ensure user exists
        if not user_data.get("phone"):
            user_repo.ensure_user(phone)
            user_data = user_repo.get_user(phone) or {"phone": phone}
            user_data["onboarding_step"] = 0
            user_repo.update_user(phone, user_data)
        
        # Store phone in user_data for handlers
        user_data["phone"] = phone
        
        # SMART COMMAND HANDLING
        msg_lower = message.strip().lower()
        current_lang = user_data.get("language")
        valid_langs = ["en", "hi", "ta", "te"]
        
        # Reset/Start Fresh commands
        if msg_lower in ["reset", "start fresh", "start over", "restart", "नया शुरू", "மீண்டும் தொடங்கு"]:
            user_data["onboarding_step"] = 0
            user_data["onboarding_complete"] = False
            user_data["language"] = None
            user_repo.update_user(phone, user_data)
            return """🔄 *Starting Fresh!*

Let's begin again...

👋 *Welcome to VittaSaathi!*
Your Personal AI Financial Advisor 💰

🌐 *Please select your language:*

1️⃣ English
2️⃣ हिंदी (Hindi)
3️⃣ தமிழ் (Tamil)
4️⃣ తెలుగు (Telugu)

_(Reply with 1, 2, 3, or 4)_"""
        
        # Language change command
        if msg_lower in ["language", "change language", "lang", "भाषा", "மொழி"]:
            user_data["onboarding_step"] = 0
            user_data["language"] = None
            user_repo.update_user(phone, user_data)
            return """🌐 *Change Language*

Please select your preferred language:

1️⃣ English
2️⃣ हिंदी (Hindi)
3️⃣ தமிழ் (Tamil)
4️⃣ తెలుగు (Telugu)

_(Reply with 1, 2, 3, or 4)_"""
        
        # Quick language selection (direct)
        if msg_lower in ["english", "hindi", "tamil", "telugu"]:
            lang_map = {"english": "en", "hindi": "hi", "tamil": "ta", "telugu": "te"}
            user_data["language"] = lang_map.get(msg_lower, "en")
            user_repo.update_user(phone, user_data)
            confirms = {"en": "Language set to English! ✅", "hi": "भाषा हिंदी में सेट है! ✅", 
                       "ta": "மொழி தமிழில் அமைக்கப்பட்டது! ✅", "te": "భాష తెలుగులో సెట్ చేయబడింది! ✅"}
            return confirms.get(user_data["language"], "Language updated! ✅") + "\n\nHow can I help you today?"
        
        # Force language selection if not set or invalid
        if not current_lang or current_lang not in valid_langs:
            # Check if user is selecting language (1, 2, 3, 4)
            if msg_lower in ["1", "2", "3", "4"]:
                lang_map = {"1": "en", "2": "hi", "3": "ta", "4": "te"}
                user_data["language"] = lang_map.get(msg_lower, "en")
                user_data["onboarding_step"] = 2  # Move to name step
                user_repo.update_user(phone, user_data)
                greetings = {"en": "Great!", "hi": "बहुत अच्छा!", "ta": "நல்லது!", "te": "చాలా బాగుంది!"}
                return f"""{greetings.get(user_data["language"], "Great!")} ✅

*What should I call you?*
_(Just type your name)_"""
            else:
                # Show language selection
                return """👋 *Welcome to VittaSaathi!*
Your Personal AI Financial Advisor 💰

🌐 *Please select your language:*

1️⃣ English
2️⃣ हिंदी (Hindi)
3️⃣ தமிழ் (Tamil)
4️⃣ తెలుగు (Telugu)

_(Reply with 1, 2, 3, or 4)_"""
        
        # Get conversation context
        context = self._get_context(phone)
        context["language"] = user_data.get("language", "en")
        context["timestamp"] = datetime.now(ist).isoformat()
        
        # Check if onboarding is needed
        if not user_data.get("onboarding_complete"):
            return self._handle_onboarding(phone, message, user_data, context)
        
        # Detect intent using smart NLP
        intent, entities = self._detect_intent(message, context)
        
        print(f"[AdvancedAgent] Intent: {intent}, Entities: {entities}")
        
        # Update context
        context["last_message"] = message
        context["last_intent"] = intent
        context["last_entities"] = entities
        
        # Route to handler
        handler = self.intent_handlers.get(intent, self._handle_fallback)
        response = handler(message, user_data, entities, context)
        
        # Save context
        context["last_response"] = response
        self._save_context(phone, context)
        
        return response
    
    def _detect_language(self, text: str, default: str = "en") -> str:
        """Detect language from text"""
        # Hindi detection
        if re.search(r'[\u0900-\u097F]', text):
            return "hi"
        # Tamil detection
        if re.search(r'[\u0B80-\u0BFF]', text):
            return "ta"
        # Telugu detection
        if re.search(r'[\u0C00-\u0C7F]', text):
            return "te"
        return default
    
    def _detect_intent(self, message: str, context: Dict) -> Tuple[str, Dict]:
        """
        Advanced intent detection with context awareness
        
        Returns:
            Tuple of (intent_name, extracted_entities)
        """
        text = message.lower().strip()
        entities = {}
        
        # Check for OTP request first (high priority)
        if any(re.search(p, text) for p in self.smart_patterns["otp"]):
            return "otp_request", entities
        
        # Check for greeting
        if any(re.search(p, text) for p in self.smart_patterns["greeting"]):
            return "greeting", entities
            
        # Check for help
        if any(re.search(p, text) for p in self.smart_patterns["help"]):
            return "help", entities
        
        # Check for confirmation (context-dependent)
        if context.get("awaiting_confirmation"):
            if any(re.search(p, text) for p in self.smart_patterns["confirmation"]["positive"]):
                return "confirmation", {"type": "positive"}
            if any(re.search(p, text) for p in self.smart_patterns["confirmation"]["negative"]):
                return "confirmation", {"type": "negative"}
        
        # Check for investment queries
        if any(re.search(p, text) for p in self.smart_patterns["investment"]):
            return "investment_advice", entities
        
        # Check for health check
        if any(re.search(p, text) for p in self.smart_patterns["health_check"]):
            return "health_check", entities
        
        # Check for INCOME logging FIRST (important: before expense!)
        # Income keywords: earned, received, got, income, salary, etc.
        income_keywords = ["earn", "income", "received", "got paid", "salary", "kamai", "mila", "मिला", "கிடைத்தது", "వచ్చింది"]
        if any(kw in text for kw in income_keywords):
            entities["amount"] = self._extract_amount(text)
            entities["category"] = self._extract_category(text, "income")
            if entities["amount"]:
                return "log_income", entities
        
        # Then check income patterns
        income_patterns = self.smart_patterns["income"]["patterns"]
        if any(re.search(p, text) for p in income_patterns):
            entities["amount"] = self._extract_amount(text)
            entities["category"] = self._extract_category(text, "income")
            if entities["amount"]:
                return "log_income", entities
        
        # Check for expense logging (after income check)
        expense_keywords = ["spent", "paid", "bought", "खर्च", "செலவு", "ఖర్చు", "kharcha", "kharach"]
        if any(kw in text for kw in expense_keywords):
            entities["amount"] = self._extract_amount(text)
            entities["category"] = self._extract_category(text, "expense")
            if entities["amount"]:
                return "log_expense", entities
        
        # Then check expense patterns
        expense_patterns = self.smart_patterns["expense"]["patterns"]
        if any(re.search(p, text) for p in expense_patterns):
            # But NOT if it matches income keywords
            if not any(kw in text for kw in income_keywords):
                entities["amount"] = self._extract_amount(text)
                entities["category"] = self._extract_category(text, "expense")
                if entities["amount"]:
                    return "log_expense", entities
        
        # Check for balance/report queries
        for query_type, patterns in self.smart_patterns["query"].items():
            if any(re.search(p, text) for p in patterns):
                if query_type == "balance":
                    return "check_balance", entities
                elif query_type == "report":
                    return "view_report", entities
                elif query_type == "goal":
                    return "budget_query", entities
        
        # Try AI-based intent detection as fallback
        return self._ai_detect_intent(text, context)
    
    def _extract_amount(self, text: str) -> Optional[int]:
        """Extract monetary amount from text"""
        text = text.lower().replace(",", "").replace("₹", "").replace("rs", "").replace("rupees", "")
        
        # Handle 'k' and 'lakh' shortcuts
        if match := re.search(r'(\d+(?:\.\d+)?)\s*k\b', text):
            return int(float(match.group(1)) * 1000)
        if match := re.search(r'(\d+(?:\.\d+)?)\s*(?:l|lakh)\b', text):
            return int(float(match.group(1)) * 100000)
        
        # Standard number extraction
        numbers = re.findall(r'\b(\d+)\b', text)
        if numbers:
            return int(numbers[0])
        return None
    
    def _extract_category(self, text: str, tx_type: str = "expense") -> str:
        """Extract category from text"""
        text = text.lower()
        categories = self.smart_patterns[tx_type]["categories"]
        
        for category, keywords in categories.items():
            if any(kw in text for kw in keywords):
                return category
        return "other"
    
    def _ai_detect_intent(self, text: str, context: Dict) -> Tuple[str, Dict]:
        """Use AI/LLM for complex intent detection"""
        
        # Use OpenAI Service if available
        if openai_service.is_available():
            result = openai_service.understand_message(text, context.get("language", "english"))
            intent = result.get("intent", "").lower()
            
            # Map OpenAI intents to internal intents
            intent_map = {
                "expense_entry": "log_expense",
                "income_entry": "log_income",
                "balance_query": "check_balance",
                "report_query": "view_report",
                "greeting": "greeting",
                "investment_query": "investment_advice"
            }
            
            if mapped_intent := intent_map.get(intent):
                entities = {
                    "amount": result.get("amount"),
                    "category": result.get("category", "other"),
                    "description": result.get("description", text)
                }
                return mapped_intent, entities
        
        # Fallback to smart heuristics
        if amount := self._extract_amount(text):
            # Check context for hints
            last_intent = context.get("last_intent", "")
            last_response = context.get("last_response", "").lower()
            
            if "expense" in last_intent or "spent" in last_response:
                return "log_expense", {"amount": amount, "category": "other"}
            elif "income" in last_intent or "earned" in last_response:
                return "log_income", {"amount": amount, "category": "other"}
        
        return "fallback", {}
    
    def _get_context(self, phone: str) -> Dict:
        """Get conversation context for user"""
        if phone not in self.conversation_context:
            self.conversation_context[phone] = {
                "messages": [],
                "last_intent": None,
                "awaiting_confirmation": False,
            }
        return self.conversation_context[phone]
    
    def _save_context(self, phone: str, context: Dict):
        """Save conversation context"""
        self.conversation_context[phone] = context
    
    # =================== INTENT HANDLERS ===================
    
    def _handle_expense(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle expense logging with Budget Crisis Detection & Achievements"""
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        
        amount = entities.get("amount", 0)
        category = entities.get("category", "other")
        
        if not amount:
            return "💸 I couldn't find the amount. Please say like: 'Spent 200 on food'"
        
        # Log the expense with IST time
        phone = user_data.get("phone")
        ist_now = datetime.now(ist)
        try:
            transaction_repo.add_transaction(
                user_id=phone,
                amount=amount,
                txn_type="expense",
                category=category,
                description=message
            )
        except Exception as e:
            print(f"Error logging expense: {e}")
            import traceback
            traceback.print_exc()
        
        # Get today's total (accumulated)
        today_total = self._get_today_expenses(phone)
        daily_budget = user_data.get("daily_budget", 500)
        remaining = max(0, daily_budget - today_total)
        
        # ===== Budget Crisis Detection (Strategy Prompt 9) =====
        budget_alert = ""
        if daily_budget > 0:
            overage_pct = ((today_total - daily_budget) / daily_budget) * 100 if today_total > daily_budget else 0
            if overage_pct > 40:
                budget_alert = "\n\n🔴 *Budget Alert — Reset Mode*\nLife happens, this is fixable. Tomorrow is a fresh start 💪"
            elif overage_pct > 20:
                budget_alert = "\n\n🟡 *Budget Alert — Recovery Mode*\nTry to keep the rest of the day low-spend."
            elif overage_pct > 10:
                budget_alert = f"\n\n🟠 *Budget Watch:* You've used most of today's budget."
        
        # ===== Streak Tracking =====
        streak = user_data.get("tracking_streak", 0) + 1
        user_data["tracking_streak"] = streak
        user_data["last_tracked"] = ist_now.isoformat()
        user_repo.update_user(phone, user_data)
        
        # ===== Achievement Check =====
        achievement_msg = self._check_achievements(user_data, phone)
        
        # Personality-aware spending tip
        personality = user_data.get("money_personality", "builder")
        tips = self._get_personality_tip(personality)
        
        lang = user_data.get("language", "en")
        template = self.templates.get(lang, self.templates["en"])["expense_logged"]
        
        response = template.format(
            amount=amount,
            category=category.title(),
            date=ist_now.strftime("%d %b, %I:%M %p"),
            today_total=today_total,
            remaining=remaining,
            tip=random.choice(tips)
        )
        
        return response + budget_alert + achievement_msg
    
    def _get_personality_tip(self, personality: str) -> list:
        """Return tips calibrated to user's money personality"""
        tips = {
            "warrior": [
                "💡 Challenge: Can you beat yesterday's spending?",
                "💡 Attack that debt — every rupee counts in the war!",
                "💡 Warriors track every battle. Keep it up!",
            ],
            "protector": [
                "💡 You're building your safety net. Well done!",
                "💡 Every tracked expense = more control = more safety.",
                "💡 Your emergency fund is growing because of habits like this.",
            ],
            "dreamer": [
                "💡 This expense is ₹{amount} away from your dream. Worth it?",
                "💡 Big goals need small daily discipline. You're doing it!",
                "💡 Imagine your goal achieved — keep that picture in mind!",
            ],
            "builder": [
                "💡 Compound effect: small savings daily = massive wealth.",
                "💡 Consistency is your superpower. Keep building!",
                "💡 ₹100 saved daily = ₹36,500/year. Math is on your side.",
            ],
            "achiever": [
                "💡 You're on a streak! Don't break it!",
                "💡 Track → Analyze → Optimize. You're at step 1!",
                "💡 Top savers track every single expense. You're one of them now.",
            ],
        }
        return tips.get(personality, tips["builder"])
    
    def _check_achievements(self, user_data: Dict, phone: str) -> str:
        """Check and award achievements (Strategy Prompt 10: Achievement Engine)"""
        achievements = user_data.get("achievements", [])
        streak = user_data.get("tracking_streak", 0)
        new_badge = ""
        
        # First expense
        if "first_expense" not in achievements:
            achievements.append("first_expense")
            badge = self.ACHIEVEMENT_BADGES["first_expense"]
            new_badge = f"\n\n🎉 *Achievement Unlocked!*\n{badge['badge']} *{badge['name']}* — {badge['desc']}"
        
        # 7-day streak
        if streak >= 7 and "week_streak" not in achievements:
            achievements.append("week_streak")
            badge = self.ACHIEVEMENT_BADGES["week_streak"]
            new_badge = f"\n\n🎉 *Achievement Unlocked!*\n{badge['badge']} *{badge['name']}* — {badge['desc']}\n🔥 {streak}-day streak!"
        
        # 30-day streak
        if streak >= 30 and "month_streak" not in achievements:
            achievements.append("month_streak")
            badge = self.ACHIEVEMENT_BADGES["month_streak"]
            new_badge = f"\n\n🏆 *EPIC Achievement!*\n{badge['badge']} *{badge['name']}* — {badge['desc']}\n🔥 {streak}-day streak! You're in the top 5% of users!"
        
        # 100-day streak
        if streak >= 100 and "100_streak" not in achievements:
            achievements.append("100_streak")
            badge = self.ACHIEVEMENT_BADGES["100_streak"]
            new_badge = f"\n\n🏆🏆 *LEGENDARY Achievement!*\n{badge['badge']} *{badge['name']}* — {badge['desc']}\n🔥🔥🔥 {streak} DAYS! You're a financial legend!"
        
        user_data["achievements"] = achievements
        return new_badge
    
    def _handle_income(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle income logging"""
        amount = entities.get("amount", 0)
        category = entities.get("category", "other")
        
        if not amount:
            return "💵 I couldn't find the amount. Please say like: 'Earned 5000 from delivery'"
        
        # Use IST for everything
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        ist_now = datetime.now(ist)
        
        # Log the income WITH IST timestamp
        phone = user_data.get("phone")
        try:
            transaction_repo.add_transaction(
                user_id=phone,
                amount=amount,
                txn_type="income",
                category=category,
                description=message
            )
            print(f"[Income] Logged ₹{amount} for {phone} at {ist_now.strftime('%I:%M %p IST')}")
        except Exception as e:
            print(f"Error logging income: {e}")
            import traceback
            traceback.print_exc()
        
        # Get today's total income (accumulated) - INCLUDING this transaction
        today_income = self._get_today_income(phone)
        
        motivations = [
            "🔥 Great work! Keep earning!",
            "💪 Every rupee counts towards your goal!",
            "🌟 You're making progress!",
            "🎯 Stay focused on your target!",
        ]
        
        lang = user_data.get("language", "en")
        template = self.templates.get(lang, self.templates["en"])["income_logged"]
        
        return template.format(
            amount=amount,
            category=category.title(),
            date=ist_now.strftime("%d %b, %I:%M %p"),
            today_income=today_income,
            motivation=random.choice(motivations)
        )
    
    def _handle_balance(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle balance/summary query"""
        phone = user_data.get("phone")
        
        # Get financial data
        income = self._get_month_income(phone)
        expenses = self._get_month_expenses(phone)
        balance = income - expenses
        savings = max(0, balance)
        
        # Goal info
        goal = self._get_active_goal(phone)
        goal_name = goal.get("name", "Financial Freedom") if goal else "No Goal Set"
        goal_progress = self._get_goal_progress(phone)
        days_left = goal.get("days_left", 365) if goal else 0
        
        # Generate insight
        insights = [
            "💡 You're doing well! Consider increasing SIP by ₹500.",
            "💡 Food expenses are high. Try meal prepping!",
            "💡 Great savings rate! Keep it up!",
            "💡 Review subscriptions to find savings.",
        ]
        
        lang = user_data.get("language", "en")
        template = self.templates.get(lang, self.templates["en"]).get("balance_summary", self.templates["en"]["balance_summary"])
        
        return template.format(
            balance=balance,
            income=income,
            expenses=expenses,
            savings=savings,
            goal_name=goal_name,
            goal_progress=goal_progress,
            days_left=days_left,
            insight=random.choice(insights)
        )
    
    def _handle_report(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Weekly Report Narrator (Strategy Prompt 6)
        
        Not just data — a STORY of their financial week.
        """
        phone = user_data.get("phone")
        name = user_data.get("name", "Friend")
        lang = user_data.get("language", "en")
        personality = user_data.get("money_personality", "builder")
        streak = user_data.get("tracking_streak", 0)
        
        # Get data
        income = self._get_month_income(phone)
        expenses = self._get_month_expenses(phone)
        savings = income - expenses
        daily_budget = user_data.get("daily_budget", 500)
        weekly_budget = daily_budget * 7
        
        # Category breakdown
        categories = self._get_category_breakdown(phone)
        cat_text = ", ".join([f"{k}: ₹{v:,}" for k, v in (categories or {}).items()])
        
        # Find biggest category
        biggest_cat = max(categories, key=categories.get) if categories else "none"
        
        # Goal info
        goal = self._get_active_goal(phone)
        goal_name = goal.get("name", "your goal") if goal else "your goal"
        goal_progress = self._get_goal_progress(phone)
        
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
        language = lang_map.get(lang, "English")
        
        # Try AI-narrated report
        try:
            import os
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                prompt = f"""Generate MoneyViya's weekly financial narrative report.

USER: {name} | Personality: {personality}
Income: ₹{income:,} | Spending: ₹{expenses:,} | Net: ₹{savings:,}
Weekly Budget: ₹{weekly_budget:,}
Categories: {cat_text or 'No expenses recorded'}
Biggest Category: {biggest_cat}
Goal: {goal_name} — {goal_progress}% complete
Streak: {streak} days

STRUCTURE (Strategy Prompt 6):
1. Week headline (newspaper-style, fun: "The Swiggy Week" or "Investment Month Begins!")
2. The numbers (clean, visual)
3. Win of the week (ALWAYS find something to celebrate)
4. Challenge (honest but constructive — never "you failed")
5. Key insight (one pattern)
6. Goal progress update
7. Next week target (one specific action)
8. Motivation line (calibrated to {personality} personality)

Rules: Max 200 words. WhatsApp format. In {language}."""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": f"You are Viya, MoneyViya's weekly report narrator. Tell a STORY of their financial week. Always find a win. Never shame. Max 200 words in {language}."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 350
                    },
                    timeout=15
                )
                if response.ok:
                    result = response.json()["choices"][0]["message"]["content"].strip()
                    result += f"\n\n📄 _Type \"PDF report\" for detailed analysis._"
                    return result
        except Exception as e:
            print(f"[Report AI] Error: {e}")
        
        # Static fallback
        titles = {
            "en": f"📊 *Weekly Report for {name}*",
            "ta": f"📊 *{name} வாராந்திர அறிக்கை*",
            "hi": f"📊 *{name} साप्ताहिक रिपोर्ट*",
            "te": f"📊 *{name} వారపు నివేదిక*"
        }
        
        report = f"""{titles.get(lang, titles["en"])}
━━━━━━━━━━━━━━━━━━━━

💵 *Income:* ₹{income:,}
💸 *Expenses:* ₹{expenses:,}
💰 *Savings:* ₹{savings:,}

📈 *Breakdown:*
"""
        if not categories:
            report += "No expenses recorded this period.\n"
        else:
            cat_emojis = {"food": "🍽️", "transport": "🚗", "bills": "📱", "shopping": "🛍️",
                         "entertainment": "🎬", "health": "🏥", "investment": "📈", 
                         "rent": "🏠", "groceries": "🛒", "other": "📦"}
            for cat, amount in categories.items():
                emoji = cat_emojis.get(cat.lower(), "📦")
                report += f"{emoji} {cat.title()}: ₹{amount:,}\n"
        
        report += f"""
🎯 *Goal:* {goal_name} — {goal_progress}% complete
🔥 *Streak:* {streak} days

📄 _Type \"PDF report\" for detailed analysis._"""
        return report


    def _get_ist_time(self):
        """Get current time in IST"""
        import pytz
        return datetime.now(pytz.timezone('Asia/Kolkata'))

    
    def _handle_investment(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle investment advice request"""
        try:
            # Check if amount mentioned
            amount = self._extract_amount(message)
            
            if amount and ("invest" in message.lower() or "plan" in message.lower()):
                return investment_service.get_portfolio_plan(amount)
            
            return investment_service.get_market_analysis()
        except Exception as e:
            print(f"Investment error: {e}")
            return """📈 *Investment Ideas*

Based on your profile, consider:

1️⃣ *SIP in Index Funds* - ₹500/month minimum
   Low risk, good for beginners

2️⃣ *Digital Gold* - Start with ₹100
   Safe, easy to liquidate

3️⃣ *PPF/EPF* - Tax saving
   Long term, guaranteed returns

💡 *Tip:* Start small, stay consistent!

Type "Invest 10000" for a detailed portfolio plan."""
    
    def _handle_budget(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Goal Intelligence Advisor (Strategy Prompt 7)"""
        phone = user_data.get("phone")
        name = user_data.get("name", "Friend")
        lang = user_data.get("language", "en")
        personality = user_data.get("money_personality", "builder")
        goal = self._get_active_goal(phone)
        
        if not goal:
            return """🎯 *No Goal Set Yet!*

Let's set a financial goal. What do you want to achieve?

Examples:
• "Save 1 lakh for bike"
• "Build emergency fund of 50000"
• "Clear 20000 loan in 6 months"

Just tell me your goal!"""
        
        goal_name = goal.get("name", "Savings Goal")
        target = goal.get("target_amount", 100000)
        progress = self._get_goal_progress(phone)
        saved = int(target * progress / 100)
        remaining = target - saved
        days_left = goal.get("days_left", 365)
        daily_target = int(remaining / max(1, days_left))
        monthly_savings = daily_target * 30
        
        # Progress bar
        filled = int(progress / 10)
        progress_bar = "█" * filled + "░" * (10 - filled)
        
        # Try AI Goal Intelligence
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
        language = lang_map.get(lang, "English")
        
        try:
            import os
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                prompt = f"""MoneyViya Goal Intelligence Advisor.

USER: {name} | Personality: {personality}
USER MESSAGE: {message}
GOAL: {goal_name} | Target: ₹{target:,} | Saved: ₹{saved:,} ({progress}%)
Remaining: ₹{remaining:,} | Days Left: {days_left} | Daily Need: ₹{daily_target}

GOAL PRIORITIZATION FRAMEWORK:
1. Emergency Fund (3 months expenses) — ALWAYS priority 1 if not done
2. High-interest debt repayment
3. Short-term goals (<1 year)
4. Medium-term goals (1-3 years)
5. Long-term goals (3+ years)

Provide:
1. Current progress visual
2. Projected timeline at current rate
3. ONE specific adjustment to speed up
4. Milestone breakdown (next 25% checkpoint)
5. Personality-calibrated motivation ({personality})

Max 150 words in {language}. WhatsApp format."""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": f"You are Viya, MoneyViya's goal intelligence advisor. Give actionable, empathetic goal advice. Non-judgmental. Max 150 words in {language}."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 250
                    },
                    timeout=12
                )
                if response.ok:
                    return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Goal AI] Error: {e}")
        
        # Static fallback
        return f"""🎯 *Goal: {goal_name}*

📊 *Progress:*
{progress_bar} {progress}%

💰 Saved: ₹{saved:,} / ₹{target:,}
📅 Days Left: {days_left}
📈 Daily Target: ₹{daily_target}

💡 *To stay on track:*
• Save ₹{daily_target} daily
• Reduce non-essential spending
• Find extra income opportunities

Keep going! You got this! 💪"""
    
    def _handle_help(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle help request"""
        lang = user_data.get("language", "en")
        return self.templates.get(lang, self.templates["en"]).get("help_menu", """📱 *VittaSaathi Help*

*Quick Commands:*
━━━━━━━━━━━━━━━━━
💸 *Log Expense:* "Spent 200 on food"
💵 *Log Income:* "Earned 5000 from delivery"
📊 *See Balance:* "What's my balance?"
📋 *Report:* "Show report"
🎯 *Goals:* "How's my goal?"
📈 *Invest:* "Investment ideas"
📊 *Market:* "Today's market"
🔐 *Login:* "Send OTP"
🌐 *Language:* "Change language"

*Just type naturally, I understand!* 🤖""")
    
    def _handle_greeting(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle greeting"""
        name = user_data.get("name", "Friend")
        hour = datetime.now().hour
        
        if hour < 12:
            greeting = "Good Morning"
        elif hour < 17:
            greeting = "Good Afternoon"
        else:
            greeting = "Good Evening"
        
        return f"""👋 *{greeting}, {name}!*

How can I help you today?

Quick options:
💰 Check balance
📊 See report
💸 Log expense
📈 Investment ideas

Or just tell me what you need!"""
    
    def _handle_otp_request(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle OTP generation for web login"""
        import random
        import time
        
        otp = str(random.randint(100000, 999999))
        phone = user_data.get("phone")
        
        # Store OTP in user data
        user_data["temp_otp"] = otp
        user_data["otp_expiry"] = time.time() + 300  # 5 minutes
        
        try:
            user_repo.update_user(phone, user_data)
            print(f"[OTP] Generated {otp} for {phone}, stored in user_repo")
        except Exception as e:
            print(f"Error storing OTP: {e}")
        
        lang = user_data.get("language", "en")
        template = self.templates.get(lang, self.templates["en"]).get("otp_sent", """🔐 *Your Login Code:*

*{otp}*

⏰ Valid for 5 minutes
Do NOT share this with anyone!

Enter this code on the website to access your dashboard.""")
        
        return template.format(otp=otp)
    
    def _handle_confirmation(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle yes/no confirmations"""
        confirm_type = entities.get("type", "positive")
        
        if confirm_type == "positive":
            context["awaiting_confirmation"] = False
            return """✅ *Great!* I've updated your records.

Your day is complete! 🌙

📊 Tomorrow I'll send your morning summary.
💤 Good night!"""
        else:
            context["awaiting_confirmation"] = False
            return """📝 *No problem!*

What else would you like to add?

Just tell me:
• "Spent 100 on snacks"
• "Earned 500 from work"

Or type "done" when finished."""
    
    def _handle_market_update(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Handle market update request — routes to Market Intelligence Engine (Prompt 8)"""
        try:
            # Try AI-powered market intelligence first
            return self.generate_market_intelligence(user_data)
        except Exception as e:
            print(f"Market intelligence error: {e}")
            try:
                return investment_service.get_market_analysis()
            except:
                return """📈 *Market Update*

🟢 *Nifty 50:* Stable
🟡 *Sensex:* Slight dip
🟢 *Gold:* Rising trend

💡 *Today's Tip:*
"In volatile markets, SIP is your best friend!"

Type "invest" for personalized advice."""
    
    def _build_master_system_prompt(self, user_data: Dict) -> str:
        """Build the Master System Prompt from Product Strategy (Prompt 1)"""
        name = user_data.get("name", "Friend")
        lang_code = user_data.get("language", "en")
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu"}
        language = lang_map.get(lang_code, "English")
        phone = user_data.get("phone", "")
        
        # Gather financial context
        income = user_data.get("monthly_income", 0)
        daily_budget = user_data.get("daily_budget", 500)
        today_spending = self._get_today_expenses(phone)
        personality = user_data.get("money_personality", "builder")
        personality_info = self.MONEY_PERSONALITIES.get(personality, self.MONEY_PERSONALITIES["builder"])
        
        goal = self._get_active_goal(phone)
        goal_name = goal.get("name", "Financial Freedom") if goal else "Not set"
        goal_progress = self._get_goal_progress(phone)
        days_left = goal.get("days_left", 0) if goal else 0
        
        return f"""You are MoneyViya (Viya for short), a personal AI financial advisor and manager for Indian users.
You operate exclusively through WhatsApp and are the user's most trusted financial companion.

YOUR IDENTITY:
- Name: Viya (short for MoneyViya)
- Personality: Warm, brilliant, non-judgmental, like a CA best friend
- Tone: Friendly but professional. Celebratory when wins happen. Gentle when mistakes occur. Never preachy.
- Voice: Speak in {language}. When responding in regional languages, be fluent and NATIVE — not translated English.

YOUR CORE BELIEFS:
1. Every person deserves great financial guidance regardless of income level
2. Small consistent actions beat big occasional efforts
3. Financial health is emotional health — never shame users for spending
4. Data is only valuable if it changes behavior — always connect numbers to actions
5. One clear recommendation beats ten good options

YOUR CONSTRAINTS:
1. You are NOT a SEBI-registered advisor. Provide general financial education.
2. Never promise specific returns on investments
3. Never collect bank passwords or OTPs
4. All advice must be appropriate for the user's risk profile

CURRENT USER CONTEXT:
Name: {name}
Language: {language}
Monthly Income: ₹{income:,}
Money Personality: {personality_info['emoji']} {personality_info['name']} — {personality_info['desc']}
Active Goal: {goal_name}
Goal Progress: {goal_progress}%
Days to Goal: {days_left}
Today's Spending: ₹{today_spending}
Daily Budget: ₹{daily_budget}

RESPONSE FORMAT:
- Under 150 words unless user asked a detailed question
- Use emojis sparingly but meaningfully (max 3 per message)
- Always end with ONE clear next action or question
- For numbers above 1,000, use Indian numbering (₹1,50,000 not ₹150,000)
- WhatsApp formatting: *bold* for emphasis, _italic_ for context, no markdown headers
- If user asks something off-topic, gently guide back to finance

TONE CALIBRATION (based on {personality_info['name']}):
{personality_info['motivation']}"""
    
    def _handle_fallback(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Universal AI Fallback — Handles ANY message (financial or general)
        
        Strategy: Financial → Master System Prompt
                  General → Research via OpenAI + subtle MoneyViya connection
        """
        name = user_data.get("name", "Friend")
        lang = user_data.get("language", "en")
        msg_lower = message.lower()
        
        # Detect emotional tone for response calibration
        tone = self.detect_emotional_tone(message, user_data)
        
        # Check if it's a financial question or general question
        financial_keywords = [
            "money", "spend", "save", "invest", "budget", "loan", "emi", "sip",
            "mutual fund", "stocks", "fd", "bank", "salary", "income", "expense",
            "paisa", "rupee", "₹", "lakh", "crore", "tax", "gst", "insurance",
            "gold", "ppf", "nps", "credit", "debit", "upi", "payment",
            "paise", "kharcha", "bachat", "nivesh", "kamaai"
        ]
        is_financial = any(kw in msg_lower for kw in financial_keywords)
        
        if openai_service.is_available():
            try:
                import requests
                
                if is_financial:
                    # FINANCIAL — Use Master System Prompt
                    system_prompt = self._build_master_system_prompt(user_data)
                else:
                    # GENERAL — Universal AI with MoneyViya personality
                    lang_name = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}.get(lang, "English")
                    system_prompt = f"""You are Viya, MoneyViya's AI assistant. You're talking to {name}.

You can answer ANY question — you're not limited to finance. Be helpful, knowledgeable, and friendly.

RULES:
1. Answer the user's question accurately and helpfully
2. Keep response under 150 words (WhatsApp format)
3. Use emojis naturally
4. At the END, add ONE subtle connection back to MoneyViya if relevant
   Examples: "By the way, want to track today's expenses? 💰" or 
   "Speaking of that, let me know if you need any financial help! 📊"
5. If it's a greeting, be warm and ask how their finances are going
6. If they're upset/frustrated, lead with empathy
7. Write in {lang_name}
8. Never say "I can't help with that" — always engage"""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
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
                    reply = response.json()["choices"][0]["message"]["content"].strip()
                    # Apply multilingual adaptation if non-English
                    if lang != "en":
                        reply = openai_service.adapt_multilingual_response(
                            message, reply, lang, tone
                        )
                    return reply
            except Exception as e:
                print(f"[Fallback AI] Error: {e}")

        # Check if it might be a number (for expense/income)
        if amount := self._extract_amount(message):
            context["pending_amount"] = amount
            return f"""💰 Got ₹{amount}

Is this an:
1️⃣ Expense (spent)
2️⃣ Income (earned)

Just reply with 1 or 2, or say "spent on food" / "earned from work\""""
        
        # Static fallback (no AI available)
        return f"""🤔 *Hi {name}!*

I can help you with anything! Try:
💸 "Spent 200 on food"
💵 "Earned 5000"
📊 "Show balance"
📈 "Investment advice"
🎯 "How's my goal?"
❓ "Help"

Or ask me any question — I'm here for you! 😊"""
    
    def _handle_health_check(self, message: str, user_data: Dict, entities: Dict, context: Dict) -> str:
        """Financial Health Diagnostic (Strategy Prompt 11)"""
        phone = user_data.get("phone", "")
        name = user_data.get("name", "Friend")
        income = user_data.get("monthly_income", 0)
        
        month_income = self._get_month_income(phone)
        month_expenses = self._get_month_expenses(phone)
        savings = max(0, month_income - month_expenses)
        
        # Calculate Health Score (out of 100)
        score = 0
        
        # Emergency Fund (25 pts) - 3 months expenses target
        if income > 0:
            emergency_ratio = savings / max(1, month_expenses) if month_expenses > 0 else 3
            emergency_score = min(25, int(emergency_ratio / 3 * 25))
            score += emergency_score
        
        # Savings Rate (20 pts) - Target 20%
        if month_income > 0:
            savings_rate = (savings / month_income) * 100
            savings_score = min(20, int(savings_rate / 20 * 20))
            score += savings_score
        else:
            savings_rate = 0
            savings_score = 0
        
        # Tracking Consistency (15 pts)
        streak = user_data.get("tracking_streak", 0)
        tracking_score = min(15, streak // 2)
        score += tracking_score
        
        # Goal Progress (20 pts)
        goal_progress = self._get_goal_progress(phone)
        goal_score = min(20, goal_progress // 5)
        score += goal_score
        
        # Investment (20 pts) - placeholder
        score += 10  # Base
        
        # Score Labels
        if score >= 91:
            label = "🏆 Financial Champion"
        elif score >= 76:
            label = "🎯 Financial Pro"
        elif score >= 61:
            label = "💪 Financial Achiever"
        elif score >= 41:
            label = "🌿 Financial Grower"
        else:
            label = "🌱 Financial Seedling"
        
        return f"""📊 *{name}'s Financial Health Report*

{label}
*Score: {score}/100*
━━━━━━━━━━━━━━━━━

✅ *Strongest:* {'Savings Rate' if savings_score >= tracking_score else 'Tracking Consistency'}

📈 *Key Metrics:*
💰 Savings Rate: {savings_rate:.0f}% {'✅' if savings_rate >= 20 else '⚠️'}
🛡️ Emergency Fund: {'Building' if emergency_score < 15 else 'Good'}
🔥 Tracking Streak: {streak} days
🎯 Goal Progress: {goal_progress}%

💡 *To improve by 5 points:*
{'Track every expense for a week straight!' if tracking_score < 10 else 'Try to save ₹500 more this month!'}

_Type "balance" for detailed summary_"""
    
    # =================== ONBOARDING ===================
    
    def _handle_onboarding(self, phone: str, message: str, user_data: Dict, context: Dict) -> str:
        """Handle user onboarding flow"""
        step = user_data.get("onboarding_step", 0)
        
        # Normalize step
        if isinstance(step, str):
            step = 0
            user_data["onboarding_step"] = 0
        
        if step == 0:  # Language selection
            user_data["onboarding_step"] = 1
            user_repo.update_user(phone, user_data)
            return """👋 *Welcome to VittaSaathi!*
Your Personal AI Financial Advisor 💰

🌐 *Please select your language:*

1️⃣ English
2️⃣ हिंदी (Hindi)
3️⃣ தமிழ் (Tamil)
4️⃣ తెలుగు (Telugu)

_(Reply with 1, 2, 3, or 4)_"""
        
        elif step == 1:  # Got language
            lang_map = {"1": "en", "2": "hi", "3": "ta", "4": "te", 
                       "english": "en", "hindi": "hi", "tamil": "ta", "telugu": "te"}
            lang = lang_map.get(message.strip().lower(), "en")
            user_data["language"] = lang
            user_data["onboarding_step"] = 2
            user_repo.update_user(phone, user_data)
            
            # Multilingual confirmation and name prompt
            responses = {
                "en": """Great! ✅

*What should I call you?*
_(Just type your name)_""",
                "hi": """बहुत अच्छा! ✅

*मैं आपको क्या बुलाऊं?*
_(अपना नाम टाइप करें)_""",
                "ta": """நல்லது! ✅

*உங்களை நான் என்ன அழைக்கட்டும்?*
_(உங்கள் பெயரை டைப் செய்யுங்கள்)_""",
                "te": """చాలా బాగుంది! ✅

*నేను మిమ్మల్ని ఏమని పిలవాలి?*
_(మీ పేరు టైప్ చేయండి)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 2:  # Got name
            user_data["name"] = message.strip().title()
            user_data["onboarding_step"] = 3
            user_repo.update_user(phone, user_data)
            lang = user_data.get("language", "en")
            name = user_data["name"]
            
            responses = {
                "en": f"""Nice to meet you, *{name}*! 😊

*What do you do for work?*
_(e.g., Student, Delivery Partner, Business Owner, Homemaker)_""",
                "hi": f"""आपसे मिलकर अच्छा लगा, *{name}*! 😊

*आप क्या काम करते हैं?*
_(जैसे: छात्र, डिलीवरी पार्टनर, व्यापारी, गृहिणी)_""",
                "ta": f"""சந்திப்பதில் மகிழ்ச்சி, *{name}*! 😊

*நீங்கள் என்ன வேலை செய்கிறீர்கள்?*
_(உ.ம், மாணவர், டெலிவரி பார்ட்னர், வணிக உரிமையாளர், இல்லத்தரசி)_""",
                "te": f"""కలవడం ఆనందం, *{name}*! 😊

*మీరు ఏ పని చేస్తారు?*
_(ఉ.దా., విద్యార్థి, డెలివరీ పార్ట్నర్, వ్యాపార యజమాని, గృహిణి)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 3:  # Got occupation
            user_data["occupation"] = message.strip().title()
            user_data["onboarding_step"] = 4
            user_repo.update_user(phone, user_data)
            lang = user_data.get("language", "en")
            
            responses = {
                "en": """Got it! 👍

*What's your approximate monthly income?*
_(Just type amount, e.g., 25000 or 25k)_""",
                "hi": """समझ गया! 👍

*आपकी अनुमानित मासिक आय कितनी है?*
_(राशि टाइप करें, जैसे 25000 या 25k)_""",
                "ta": """புரிந்தது! 👍

*உங்கள் தோராயமான மாத வருமானம் என்ன?*
_(தொகையை டைப் செய்யுங்கள், உ.ம்., 25000 அல்லது 25k)_""",
                "te": """అర్థమైంది! 👍

*మీ సుమారు నెలవారీ ఆదాయం ఎంత?*
_(మొత్తం టైప్ చేయండి, ఉ.దా., 25000 లేదా 25k)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 4:  # Got income
            amount = self._extract_amount(message)
            lang = user_data.get("language", "en")
            if amount:
                user_data["monthly_income"] = amount
                user_data["onboarding_step"] = 5
                user_repo.update_user(phone, user_data)
                
                responses = {
                    "en": """💰 *Now let's set your financial goal!*

What would you like to achieve?
(e.g., Save for a bike, Build emergency fund, Clear debt)""",
                    "hi": """💰 *अब अपना वित्तीय लक्ष्य निर्धारित करें!*

आप क्या हासिल करना चाहते हैं?
(जैसे: बाइक के लिए बचत, आपातकालीन फंड, कर्ज चुकाना)""",
                    "ta": """💰 *இப்போது உங்கள் நிதி இலக்கை அமைப்போம்!*

நீங்கள் என்ன சாதிக்க விரும்புகிறீர்கள்?
(உ.ம்., பைக் வாங்க சேமிப்பு, அவசரகால நிதி, கடன் தீர்க்க)""",
                    "te": """💰 *ఇప్పుడు మీ ఆర్థిక లక్ష్యాన్ని సెట్ చేద్దాం!*

మీరు ఏమి సాధించాలనుకుంటున్నారు?
(ఉ.దా., బైక్ కోసం సేవ్, అత్యవసర నిధి, అప్పు తీర్చడం)"""
                }
                return responses.get(lang, responses["en"])
            else:
                errors = {
                    "en": "🔢 Please type your monthly income (e.g., 25000 or 25k)",
                    "hi": "🔢 कृपया अपनी मासिक आय टाइप करें (जैसे 25000 या 25k)",
                    "ta": "🔢 உங்கள் மாத வருமானத்தை டைப் செய்யுங்கள் (உ.ம்., 25000 அல்லது 25k)",
                    "te": "🔢 దయచేసి మీ నెలవారీ ఆదాయాన్ని టైప్ చేయండి (ఉ.దా., 25000 లేదా 25k)"
                }
                return errors.get(lang, errors["en"])
        
        elif step == 5:  # Got goal
            user_data["goal_type"] = message.strip().title()
            user_data["onboarding_step"] = 6
            user_repo.update_user(phone, user_data)
            lang = user_data.get("language", "en")
            goal = user_data["goal_type"]
            
            responses = {
                "en": f"""Great goal: *{goal}*! 🎯

*How much do you want to save/achieve?*
(Type amount, e.g., 100000 or 1 lakh)""",
                "hi": f"""बढ़िया लक्ष्य: *{goal}*! 🎯

*आप कितना बचाना/हासिल करना चाहते हैं?*
(राशि टाइप करें, जैसे 100000 या 1 लाख)""",
                "ta": f"""அருமையான இலக்கு: *{goal}*! 🎯

*நீங்கள் எவ்வளவு சேமிக்க/சாதிக்க விரும்புகிறீர்கள்?*
(தொகையை டைப் செய்யுங்கள், உ.ம்., 100000 அல்லது 1 லட்சம்)""",
                "te": f"""గొప్ప లక్ష్యం: *{goal}*! 🎯

*మీరు ఎంత సేవ్ చేయాలనుకుంటున్నారు/సాధించాలనుకుంటున్నారు?*
(మొత్తం టైప్ చేయండి, ఉ.దా., 100000 లేదా 1 లక్ష)"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 6:  # Got target
            amount = self._extract_amount(message)
            lang = user_data.get("language", "en")
            if amount:
                user_data["target_amount"] = amount
                user_data["onboarding_step"] = 7
                user_repo.update_user(phone, user_data)
                
                responses = {
                    "en": """📅 *And by when do you want to achieve this?*
(e.g., 6 months, 1 year, December 2024)""",
                    "hi": """📅 *और आप इसे कब तक हासिल करना चाहते हैं?*
(जैसे 6 महीने, 1 साल, दिसंबर 2024)""",
                    "ta": """📅 *இதை எப்போது சாதிக்க விரும்புகிறீர்கள்?*
(உ.ம்., 6 மாதங்கள், 1 வருடம், டிசம்பர் 2024)""",
                    "te": """📅 *దీన్ని ఎప్పటికి సాధించాలనుకుంటున్నారు?*
(ఉ.దా., 6 నెలలు, 1 సంవత్సరం, డిసెంబర్ 2024)"""
                }
                return responses.get(lang, responses["en"])
            else:
                errors = {
                    "en": "🔢 Please type the target amount (e.g., 100000 or 1 lakh)",
                    "hi": "🔢 कृपया लक्ष्य राशि टाइप करें (जैसे 100000 या 1 लाख)",
                    "ta": "🔢 இலக்கு தொகையை டைப் செய்யுங்கள் (உ.ம்., 100000 அல்லது 1 லட்சம்)",
                    "te": "🔢 దయచేసి లక్ష్య మొత్తాన్ని టైప్ చేయండి (ఉ.దా., 100000 లేదా 1 లక్ష)"
                }
                return errors.get(lang, errors["en"])
        
        elif step == 7:  # Got timeline → Now start Money Personality Quiz
            months = self._parse_timeline(message)
            days = months * 30
            lang = user_data.get("language", "en")
            
            # Timeline string based on language
            if lang == "ta":
                timeline_str = f"{months} மாதங்கள்" if months < 24 else f"{months/12:.1f} வருடங்கள்"
            elif lang == "hi":
                timeline_str = f"{months} महीने" if months < 24 else f"{months/12:.1f} साल"
            elif lang == "te":
                timeline_str = f"{months} నెలలు" if months < 24 else f"{months/12:.1f} సంవత్సరాలు"
            else:
                timeline_str = f"{months} Months" if months < 24 else f"{months/12:.1f} Years"
            
            user_data["timeline"] = timeline_str
            user_data["timeline_days"] = days
            user_data["onboarding_step"] = 8  # Move to personality quiz
            user_data["start_date"] = datetime.now().isoformat()
            
            # Calculate targets
            target = user_data.get("target_amount", 100000)
            monthly_income = user_data.get("monthly_income", 30000)
            daily_target = round(target / max(1, days))
            monthly_target = round(target / max(1, months))
            daily_budget = max(500, (monthly_income // 30) - daily_target)
            
            user_data["daily_target"] = daily_target
            user_data["daily_budget"] = daily_budget
            user_data["monthly_target"] = monthly_target
            user_data["personality_answers"] = []
            
            user_repo.update_user(phone, user_data)
            
            # Start Money Personality Quiz ("Money Mirror" from Strategy)
            responses = {
                "en": """✅ Got it!

🪞 *Before we begin — let's discover your Money Personality!*
_(Just 3 quick questions)_

*Q1: If you got an unexpected ₹10,000 bonus, what would you do?*

A) Save it all 🐢
B) Invest most, treat yourself a little 🐝
C) Split between fun and savings 🦋
D) Use it toward a specific goal 🎯
E) Invest aggressively 🦁

_(Reply A, B, C, D, or E)_""",
                "hi": """✅ समझ गया!

🪞 *शुरू करने से पहले — अपनी पैसों की शख्सियत जानें!*
_(सिर्फ 3 तेज सवाल)_

*Q1: अगर आपको अचानक ₹10,000 बोनस मिले, तो क्या करेंगे?*

A) पूरा बचाऊंगा 🐢
B) ज्यादातर निवेश, थोड़ा मज़ा 🐝
C) आधा मज़े में, आधा बचत में 🦋
D) किसी लक्ष्य में लगाऊंगा 🎯
E) आक्रामक निवेश 🦁

_(A, B, C, D, या E में जवाब दें)_""",
                "ta": """✅ புரிந்தது!

🪞 *தொடங்கும் முன் — உங்கள் பண ஆளுமையை கண்டறிவோம்!*
_(வெறும் 3 கேள்விகள்)_

*Q1: எதிர்பாராமல் ₹10,000 போனஸ் கிடைத்தால் என்ன செய்வீர்கள்?*

A) முழுவதும் சேமிப்பேன் 🐢
B) பெரும்பாலும் முதலீடு, சிறிது மகிழ்ச்சி 🐝
C) மகிழ்ச்சிக்கும் சேமிப்புக்கும் பிரிப்பேன் 🦋
D) ஒரு இலக்கில் பயன்படுத்துவேன் 🎯
E) தீவிரமாக முதலீடு செய்வேன் 🦁

_(A, B, C, D, அல்லது E பதிலளிக்கவும்)_""",
                "te": """✅ అర్థమైంది!

🪞 *ప్రారంభించే ముందు — మీ మనీ వ్యక్తిత్వాన్ని కనుగొందాం!*
_(కేవలం 3 ప్రశ్నలు)_

*Q1: అనుకోకుండా ₹10,000 బోనస్ వస్తే ఏం చేస్తారు?*

A) మొత్తం సేవ్ చేస్తాను 🐢
B) చాలా వరకు ఇన్వెస్ట్, కొంచెం ఆనందం 🐝
C) ఆనందం మరియు పొదుపు మధ్య విభజిస్తాను 🦋
D) ఒక లక్ష్యం కోసం ఉపయోగిస్తాను 🎯
E) దూకుడుగా ఇన్వెస్ట్ చేస్తాను 🦁

_(A, B, C, D, లేదా E లో సమాధానం ఇవ్వండి)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 8:  # Money Personality Q1 answer
            answer = message.strip().upper()
            lang = user_data.get("language", "en")
            answers = user_data.get("personality_answers", [])
            if answer in ["A", "B", "C", "D", "E"]:
                answers.append(answer)
            else:
                answers.append("B")  # Default
            user_data["personality_answers"] = answers
            user_data["onboarding_step"] = 9
            user_repo.update_user(phone, user_data)
            
            responses = {
                "en": """*Q2: When you hear 'investment', you feel:*

A) Worried — what if I lose it? 😟
B) Curious — tell me more 🤔
C) Excited — let's do it! 🚀
D) Overwhelmed — too many options 😵

_(Reply A, B, C, or D)_""",
                "hi": """*Q2: 'निवेश' सुनकर आपको क्या लगता है:*

A) चिंता — अगर पैसा डूब गया तो? 😟
B) उत्सुकता — और बताओ 🤔
C) उत्साह — चलो करते हैं! 🚀
D) भ्रम — बहुत सारे विकल्प 😵

_(A, B, C, या D में जवाब दें)_""",
                "ta": """*Q2: 'முதலீடு' என்ற வார்த்தை உங்களுக்கு:*

A) கவலை — இழந்தால் என்ன செய்வது? 😟
B) ஆர்வம் — மேலும் சொல்லுங்கள் 🤔
C) உற்சாகம் — செய்வோம்! 🚀
D) குழப்பம் — நிறைய வழிகள் 😵

_(A, B, C, அல்லது D பதிலளிக்கவும்)_""",
                "te": """*Q2: 'ఇన్వెస్ట్‌మెంట్' అంటే మీకు:*

A) ఆందోళన — పోతే ఏంటి? 😟
B) ఆసక్తి — ఇంకా చెప్పండి 🤔
C) ఉత్సాహం — చేద్దాం! 🚀
D) గందరగోళం — చాలా ఆప్షన్లు 😵

_(A, B, C, లేదా D లో సమాధానం ఇవ్వండి)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 9:  # Money Personality Q2 answer
            answer = message.strip().upper()
            lang = user_data.get("language", "en")
            answers = user_data.get("personality_answers", [])
            if answer in ["A", "B", "C", "D"]:
                answers.append(answer)
            else:
                answers.append("B")
            user_data["personality_answers"] = answers
            user_data["onboarding_step"] = 10
            user_repo.update_user(phone, user_data)
            
            responses = {
                "en": """*Q3: Your biggest money challenge is usually:*

A) Spending too much on small things 🍕
B) Not knowing where to start investing 📊
C) Irregular income makes planning hard 🎢
D) Too many goals, don't know which first 🎯
E) I save well but don't grow money 🌱

_(Reply A, B, C, D, or E)_""",
                "hi": """*Q3: पैसों की सबसे बड़ी चुनौती:*

A) छोटी चीज़ों पर ज़्यादा खर्च 🍕
B) निवेश कहां करें, पता नहीं 📊
C) अनियमित आय से योजना मुश्किल 🎢
D) बहुत सारे लक्ष्य, पहले कौन 🎯
E) बचत अच्छी, पर पैसा बढ़ाना नहीं आता 🌱

_(A, B, C, D, या E में जवाब दें)_""",
                "ta": """*Q3: உங்கள் மிகப்பெரிய பண சவால்:*

A) சிறிய விஷயங்களில் அதிகம் செலவழிப்பது 🍕
B) முதலீடு எங்கு தொடங்குவது தெரியாது 📊
C) ஒழுங்கற்ற வருமானம் திட்டமிடலை கடினமாக்குகிறது 🎢
D) பல இலக்குகள், எது முதலில் தெரியாது 🎯
E) சேமிப்பது நல்லது, ஆனால் பணம் வளர்ப்பது இல்லை 🌱

_(A, B, C, D, அல்லது E பதிலளிக்கவும்)_""",
                "te": """*Q3: మీ అతిపెద్ద డబ్బు సవాలు:*

A) చిన్న విషయాలపై ఎక్కువ ఖర్చు 🍕
B) ఇన్వెస్ట్ ఎక్కడ మొదలుపెట్టాలో తెలియదు 📊
C) అస్థిర ఆదాయం ప్లానింగ్‌ను కష్టతరం చేస్తుంది 🎢
D) చాలా లక్ష్యాలు, ఏది ముందు తెలియదు 🎯
E) సేవ్ బాగా చేస్తాను కానీ డబ్బు పెరగదు 🌱

_(A, B, C, D, లేదా E లో సమాధానం ఇవ్వండి)_"""
            }
            return responses.get(lang, responses["en"])
        
        elif step == 10:  # Money Personality Q3 answer → Complete onboarding!
            answer = message.strip().upper()
            lang = user_data.get("language", "en")
            answers = user_data.get("personality_answers", [])
            if answer in ["A", "B", "C", "D", "E"]:
                answers.append(answer)
            else:
                answers.append("B")
            user_data["personality_answers"] = answers
            
            # ===== Determine Money Personality =====
            personality = self._calculate_money_personality(answers)
            personality_info = self.MONEY_PERSONALITIES.get(personality, self.MONEY_PERSONALITIES["builder"])
            user_data["money_personality"] = personality
            
            # Mark onboarding complete
            user_data["onboarding_complete"] = True
            user_data["onboarding_step"] = 11
            user_data["tracking_streak"] = 0
            user_data["achievements"] = []
            
            user_repo.update_user(phone, user_data)
            
            name = user_data.get('name', 'Friend')
            work = user_data.get('occupation', 'User')
            goal = user_data.get('goal_type', 'Savings')
            monthly_income = user_data.get("monthly_income", 30000)
            target = user_data.get("target_amount", 100000)
            timeline_str = user_data.get("timeline", "12 Months")
            daily_target = user_data.get("daily_target", 200)
            monthly_target = user_data.get("monthly_target", 6000)
            daily_budget = user_data.get("daily_budget", 500)
            
            responses = {
                "en": f"""🎉 *Your MoneyViya profile is ready!*

🪞 *Your Money Personality:*
{personality_info['emoji']} *{personality_info['name']}*
_{personality_info['desc']}_

📊 *Your Financial Plan:*
━━━━━━━━━━━━━━━━━
👤 Name: {name}
💼 Work: {work}
💰 Income: ₹{monthly_income:,}/month
🎯 Goal: {goal}
💵 Target: ₹{target:,}
📅 Timeline: {timeline_str}
━━━━━━━━━━━━━━━━━

📈 *Daily Target:* ₹{daily_target:,}
📅 *Monthly Target:* ₹{monthly_target:,}
💸 *Daily Budget:* ₹{daily_budget:,}

I'll send you:
⏰ Morning briefing at 6 AM
📊 Evening check-in at 8 PM
📈 Weekly progress report

*Start tracking: "Spent 50 on tea"* ☕""",

                "hi": f"""🎉 *आपकी MoneyViya प्रोफ़ाइल तैयार!*

🪞 *आपकी पैसों की शख्सियत:*
{personality_info['emoji']} *{personality_info['name']}*
_{personality_info['desc']}_

📊 *आपकी वित्तीय योजना:*
━━━━━━━━━━━━━━━━━
👤 नाम: {name}
💼 काम: {work}
💰 आय: ₹{monthly_income:,}/महीना
🎯 लक्ष्य: {goal}
💵 लक्ष्य राशि: ₹{target:,}
📅 समय: {timeline_str}
━━━━━━━━━━━━━━━━━

📈 *दैनिक लक्ष्य:* ₹{daily_target:,}
💸 *दैनिक बजट:* ₹{daily_budget:,}

*शुरू करें: "चाय पर 50 खर्च किए"* ☕""",

                "ta": f"""🎉 *உங்கள் MoneyViya சுயவிவரம் தயார்!*

🪞 *உங்கள் பண ஆளுமை:*
{personality_info['emoji']} *{personality_info['name']}*
_{personality_info['desc']}_

📊 *உங்கள் நிதி திட்டம்:*
━━━━━━━━━━━━━━━━━
👤 பெயர்: {name}
💼 வேலை: {work}
💰 வருமானம்: ₹{monthly_income:,}/மாதம்
🎯 இலக்கு: {goal}
💵 இலக்கு தொகை: ₹{target:,}
📅 காலம்: {timeline_str}
━━━━━━━━━━━━━━━━━

📈 *தினசரி இலக்கு:* ₹{daily_target:,}
💸 *தினசரி பட்ஜெட்:* ₹{daily_budget:,}

*தொடங்குங்கள்: "டீக்கு 50 செலவழித்தேன்"* ☕""",

                "te": f"""🎉 *మీ MoneyViya ప్రొఫైల్ సిద్ధం!*

🪞 *మీ మనీ వ్యక్తిత్వం:*
{personality_info['emoji']} *{personality_info['name']}*
_{personality_info['desc']}_

📊 *మీ ఆర్థిక ప్రణాళిక:*
━━━━━━━━━━━━━━━━━
👤 పేరు: {name}
💼 పని: {work}
💰 ఆదాయం: ₹{monthly_income:,}/నెల
🎯 లక్ష్యం: {goal}
💵 లక్ష్య మొత్తం: ₹{target:,}
📅 సమయం: {timeline_str}
━━━━━━━━━━━━━━━━━

📈 *రోజువారీ లక్ష్యం:* ₹{daily_target:,}
💸 *రోజువారీ బడ్జెట్:* ₹{daily_budget:,}

*ప్రారంభించండి: "టీకి 50 ఖర్చు"* ☕"""
            }
            
            return responses.get(lang, responses["en"])
        
        return self._handle_help(message, user_data, {}, context)
    
    def _calculate_money_personality(self, answers: list) -> str:
        """Calculate money personality from quiz answers (Strategy: Money Mirror)"""
        # Scoring: Q1 (A-E), Q2 (A-D), Q3 (A-E)
        scores = {"warrior": 0, "protector": 0, "dreamer": 0, "builder": 0, "achiever": 0}
        
        # Q1: Bonus question
        if len(answers) >= 1:
            q1_map = {"A": "protector", "B": "builder", "C": "dreamer", "D": "achiever", "E": "warrior"}
            scores[q1_map.get(answers[0], "builder")] += 2
        
        # Q2: Investment feeling
        if len(answers) >= 2:
            q2_map = {"A": "protector", "B": "builder", "C": "warrior", "D": "dreamer"}
            scores[q2_map.get(answers[1], "builder")] += 2
        
        # Q3: Biggest challenge
        if len(answers) >= 3:
            q3_map = {"A": "dreamer", "B": "protector", "C": "warrior", "D": "achiever", "E": "builder"}
            scores[q3_map.get(answers[2], "builder")] += 2
        
        # Return highest scoring personality
        return max(scores, key=scores.get)
    
    def _parse_timeline(self, text: str) -> int:
        """Parse timeline from text, returns months"""
        text = text.lower()
        months = 12  # default
        
        if "month" in text:
            nums = re.findall(r'\d+', text)
            if nums:
                months = int(nums[0])
        elif "year" in text:
            nums = re.findall(r'\d+', text)
            if nums:
                months = int(nums[0]) * 12
        elif text.strip().isdigit():
            num = int(text.strip())
            if num <= 5:
                months = num * 12
            else:
                months = num
        
        return months
    
    # =================== STRATEGY ENGINES (Prompts 8, 12, 14 + Features 3, 4) ===================
    
    def generate_market_intelligence(self, user_data: Dict) -> str:
        """Market Intelligence Messenger (Strategy Prompt 8)
        
        Risk-profile and knowledge-level aware market updates.
        """
        name = user_data.get("name", "Friend")
        risk = user_data.get("risk_appetite", "Medium")
        lang = user_data.get("language", "en")
        income = user_data.get("monthly_income", 0)
        personality = user_data.get("money_personality", "builder")
        
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
        language = lang_map.get(lang, "English")
        
        # Risk-profile response rules
        risk_rules = {
            "Low": "Focus on FD rates, debt funds, RD options. Never recommend direct stocks.",
            "Medium": "Index funds, balanced funds, blue-chip SIPs. Occasional large-cap mention.",
            "High": "Can discuss mid-cap, specific stocks, sectoral trends. Always with caveats."
        }
        
        try:
            import os
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                prompt = f"""Generate MoneyViya's market intelligence for user.

USER: {name} | Risk: {risk} | Income: ₹{income:,} | Personality: {personality}
RISK RULES: {risk_rules.get(risk, risk_rules["Medium"])}

PHILOSOPHY:
- Market data is only useful if it changes what the user does TODAY
- Never create FOMO or panic
- End with ONE action the user can take
- For non-investors: gentle education, not pressure

Generate a market update in {language}. Max 150 words. WhatsApp format."""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": f"You are Viya's market intelligence engine. Give personalized, actionable market updates. Risk: {risk}. Max 150 words in {language}."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.6,
                        "max_tokens": 250
                    },
                    timeout=12
                )
                if response.ok:
                    return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Market AI] Error: {e}")
        
        # Static fallback
        return f"""📈 *Market Update for {name}*
━━━━━━━━━━━━━━━━━━━━
🇮🇳 Markets are active today.

💡 *For you ({risk} risk):*
{"• Consider FDs/PPF for safe returns" if risk == "Low" else "• SIP in index funds — steady wealth builder" if risk == "Medium" else "• Watch for dip-buying opportunities in quality stocks"}

🎯 *One action:* {"Start a ₹500 RD today" if risk == "Low" else "Set up a ₹1,000 SIP" if risk == "Medium" else "Research one blue-chip stock"}

_Type \"invest\" for personalized advice._"""
    
    def generate_smart_nudge(self, user_data: Dict) -> str:
        """Smart Nudge Engine (Feature 3)
        
        Contextual behavioral coaching — not generic reminders.
        Pattern-aware, calendar-aware, salary-day aware.
        """
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        day = now.strftime("%A")
        hour = now.hour
        day_of_month = now.day
        
        name = user_data.get("name", "Friend")
        phone = user_data.get("phone")
        daily_budget = user_data.get("daily_budget", 500)
        personality = user_data.get("money_personality", "builder")
        
        today_expenses = self._get_today_expenses(phone)
        budget_used_pct = (today_expenses / daily_budget * 100) if daily_budget > 0 else 0
        
        # Smart nudge logic
        
        # Salary day nudge (1st, 5th, or last day)
        if day_of_month in [1, 5, 28, 29, 30, 31]:
            return f"""💰 *Salary Day Alert, {name}!*

Your paycheck is here (or coming)! 🎉

Before you start spending, let's allocate:
• 50% → Essentials (₹{int(daily_budget * 15):,})
• 30% → Wants (₹{int(daily_budget * 9):,})
• 20% → Savings/Goals (₹{int(daily_budget * 6):,})

Want me to auto-set your savings target? 💪"""
        
        # Budget checkpoint: >70% used before 6 PM
        if budget_used_pct > 70 and hour < 18:
            remaining = max(0, daily_budget - today_expenses)
            return f"""⚡ *Gentle Heads-up, {name}*

You've used {int(budget_used_pct)}% of today's budget and it's only {now.strftime('%I %p')}.

Remaining: ₹{remaining}

💡 Consider skipping that evening snack/coffee and cooking dinner at home.

You've got this! 💪"""
        
        # Friday spending pattern nudge
        if day == "Friday":
            return f"""🎉 *Happy Friday, {name}!*

Weekend's here! Quick reminder:
Your weekend budget = ₹{daily_budget * 2:,} for 2 days.

💡 *Weekend Challenge:* Try one free activity this weekend — walk, home movie, cooking together!

Every ₹200 saved this weekend = closer to your goal! 🎯"""
        
        # Month-end nudge  
        if day_of_month >= 25:
            month_expenses = self._get_month_expenses(phone)
            return f"""📅 *Month-End Check, {name}!*

This month so far: ₹{month_expenses:,} spent.

Last {30 - day_of_month} days — let's finish strong!

💡 Focus on essentials only. Your future self will thank you. 🙏"""
        
        # Default motivational nudge
        motivations = {
            "warrior": f"💪 {name}, today's battle: stay under ₹{daily_budget}. You're a warrior — conquer it!",
            "protector": f"🛡️ {name}, protecting your money today = protecting your family's future. Budget: ₹{daily_budget}.",
            "dreamer": f"✨ {name}, every rupee saved today brings your dream closer. Today's budget: ₹{daily_budget}!",
            "builder": f"🏗️ {name}, brick by brick, rupee by rupee. Today's building budget: ₹{daily_budget}. Keep stacking!",
            "achiever": f"🎯 {name}, track every expense today. Top achievers miss nothing. Budget: ₹{daily_budget}!"
        }
        return motivations.get(personality, motivations["builder"])
    
    def detect_emotional_tone(self, message: str, user_data: Dict) -> str:
        """Viya Voice Emotional Tone Engine (Feature 4 + Prompt 12)
        
        5 emotional modes:
        1. Celebratory — goals hit, savings milestones
        2. Gentle Coaching — overspending detected
        3. Urgent Alert — budget critically overrun
        4. Motivational — losing momentum
        5. Educational — needs to understand a concept
        """
        msg_lower = message.lower()
        
        # Detect emotional state from message
        if any(w in msg_lower for w in ["don't know", "confused", "what is", "kya hai", "explain", "meaning"]):
            return "educational"
        
        if any(w in msg_lower for w in ["achieved", "goal done", "saved", "milestone", "cleared", "paid off"]):
            return "celebratory"
        
        if any(w in msg_lower for w in ["spent everything", "broke", "no money", "overspent", "sab khatam"]):
            return "gentle_coaching"
        
        if any(w in msg_lower for w in ["urgent", "emergency", "crisis", "help me"]):
            return "urgent_alert"
        
        if any(w in msg_lower for w in ["bored", "not helping", "useless", "leaving", "give up"]):
            return "motivational"
        
        # Default based on tracking behavior
        streak = user_data.get("tracking_streak", 0)
        if streak == 0:
            return "motivational"
        elif streak > 7:
            return "celebratory"
        
        return "gentle_coaching"
    
    def generate_smart_reminder(self, user_data: Dict) -> Dict:
        """Intelligent Reminder Calibration (Strategy Prompt 14)
        
        Decides WHEN to remind, WHAT to say, and HOW to say it.
        Returns: {should_send, reminder_type, message, urgency}
        """
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        hour = now.hour
        
        phone = user_data.get("phone")
        name = user_data.get("name", "Friend")
        lang = user_data.get("language", "en")
        daily_budget = user_data.get("daily_budget", 500)
        
        # Check last activity
        last_active = user_data.get("last_active")
        inactive_hours = 0
        if last_active:
            try:
                last_time = datetime.fromisoformat(str(last_active))
                if last_time.tzinfo is None:
                    last_time = ist.localize(last_time)
                inactive_hours = (now - last_time).total_seconds() / 3600
            except:
                inactive_hours = 0
        
        # INACTIVITY RE-ENGAGEMENT (Prompt 14 - Level 4)
        if inactive_hours > 168:  # 7 days
            return {
                "should_send": True,
                "reminder_type": "re_engagement",
                "urgency": "low",
                "message": f"""👋 *Hey {name}!*

We haven't chatted in a while. No judgment at all — life gets busy!

Want a fresh start? Just tell me one expense from today — that's all 👍

_Your data is safe. Pick up right where you left off._"""
            }
        
        if inactive_hours > 72:  # 3 days
            return {
                "should_send": True,
                "reminder_type": "re_engagement",
                "urgency": "low",
                "message": f"""💛 *{name}, we miss you!*

Your financial journey doesn't need to be perfect — just consistent.

One small step today: tell me any expense and we're back on track! 💪"""
            }
        
        if inactive_hours > 48:  # 2 days
            return {
                "should_send": True,
                "reminder_type": "gentle_nudge",
                "urgency": "low",
                "message": f"""📝 *Quick check-in, {name}!*

Just log one expense today — even "chai 20" counts! ☕

Your streak is waiting for you! 🔥"""
            }
        
        if inactive_hours > 24:  # 1 day
            return {
                "should_send": True,
                "reminder_type": "soft_nudge",
                "urgency": "low",
                "message": f"""😊 *Hey {name}*, how was yesterday?

Did you spend anything? Just drop a quick message and I'll log it!

Example: "spent 200 on lunch" ✨"""
            }
        
        # BUDGET CHECKPOINT (>70% used before 6 PM)
        today_expenses = self._get_today_expenses(phone)
        budget_pct = (today_expenses / daily_budget * 100) if daily_budget > 0 else 0
        
        if budget_pct > 70 and hour < 18:
            remaining = max(0, daily_budget - today_expenses)
            return {
                "should_send": True,
                "reminder_type": "budget_checkpoint",
                "urgency": "medium",
                "message": f"""⚡ *Budget Check, {name}!*

You've used {int(budget_pct)}% of today's ₹{daily_budget} budget.
Remaining: ₹{remaining}

💡 One tip: skip one non-essential purchase today. 💪"""
            }
        
        # No reminder needed
        return {
            "should_send": False,
            "reminder_type": None,
            "urgency": None,
            "message": None
        }
    
    # =================== REMINDER GENERATORS ===================
    
    def generate_morning_reminder(self, user_data: Dict) -> str:
        """AI-Powered Morning Briefing (Strategy Prompt 4)
        
        The most important touchpoint of the day — sets the financial tone.
        Day-of-week aware, personality-calibrated, goal-connected.
        """
        name = user_data.get("name", "Friend")
        phone = user_data.get("phone")
        daily_budget = user_data.get("daily_budget", 500)
        daily_target = user_data.get("daily_target", 200)
        yesterday_saved = self._get_yesterday_savings(phone)
        lang = user_data.get("language", "en")
        personality = user_data.get("money_personality", "builder")
        streak = user_data.get("tracking_streak", 0)
        
        # Get goal info
        goal = self._get_active_goal(phone)
        goal_name = goal.get("name", "your goal") if goal else "your goal"
        goal_progress = self._get_goal_progress(phone)
        
        # Day-of-week context
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        day_name = now.strftime("%A")
        date_str = now.strftime("%d %b %Y")
        
        day_tones = {
            "Monday": "Energetic, fresh start, weekly goal setting",
            "Tuesday": "Steady, progress-focused",
            "Wednesday": "Steady, mid-week momentum",
            "Thursday": "Steady, progress-focused",
            "Friday": "Celebratory of the week, weekend budget reminder",
            "Saturday": "Relaxed, review-focused, no pressure",
            "Sunday": "Reflective, weekly summary, next week preview"
        }
        
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
        language = lang_map.get(lang, "English")
        
        # Try AI-powered briefing
        try:
            import os
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                prompt = f"""Generate MoneyViya's 6 AM morning briefing.

USER: {name} | {day_name}, {date_str}
Yesterday: {'Saved ₹' + str(yesterday_saved) if yesterday_saved > 0 else 'Overspent by ₹' + str(abs(yesterday_saved))}
Today's Budget: ₹{daily_budget} | Savings Target: ₹{daily_target}
Goal: {goal_name} — {goal_progress}% complete
Streak: {streak} days | Personality: {personality}

DAY TONE: {day_tones.get(day_name, "Steady")}

RULES:
- Warm greeting with name + day context
- Yesterday's performance (1-2 sentences)
- Today's target (specific ₹ number)
- One motivational insight tied to THEIR goal
- One micro-action for today
- Under 120 words in {language}
- WhatsApp format (*bold*, emojis sparingly)"""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": f"You are Viya, MoneyViya's warm AI financial advisor. Generate a morning briefing in {language}. Be personal, not templated. Max 120 words."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.8,
                        "max_tokens": 250
                    },
                    timeout=12
                )
                if response.ok:
                    return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Morning AI] Error: {e}")
        
        # Fallback to template
        template = self.templates.get(lang, self.templates["en"])["morning_reminder"]
        motivations = [
            "💪 \"Small daily savings lead to big dreams!\"",
            "🌟 \"Every rupee saved is a step towards your goal!\"",
            "🔥 \"Consistency beats intensity. Keep going!\"",
            "✨ \"Today is a new opportunity to save!\"",
        ]
        tips = [
            "Pack lunch to save ₹100 today!",
            "Compare prices before buying anything.",
            "Avoid impulse purchases - wait 24 hours.",
            "Use public transport when possible.",
        ]
        return template.format(
            name=name,
            daily_budget=daily_budget,
            daily_target=daily_target,
            yesterday_saved=yesterday_saved,
            motivation=random.choice(motivations),
            daily_tip=random.choice(tips)
        )
    
    def generate_evening_checkout(self, user_data: Dict) -> str:
        """AI-Powered Evening Check-in with Financial Day Score (Strategy Prompt 5)
        
        Closes the financial day properly with score, summary, and motivation.
        """
        phone = user_data.get("phone")
        name = user_data.get("name", "Friend")
        lang = user_data.get("language", "en")
        personality = user_data.get("money_personality", "builder")
        streak = user_data.get("tracking_streak", 0)
        daily_budget = user_data.get("daily_budget", 500)
        
        # Get today's data
        today_income = self._get_today_income(phone)
        today_expenses = self._get_today_expenses(phone)
        net = today_income - today_expenses
        
        # Financial Day Score (Strategy Prompt 5)
        if daily_budget > 0:
            variance_pct = ((today_expenses - daily_budget) / daily_budget) * 100
        else:
            variance_pct = 0
        
        if variance_pct < -20:
            score_label = "Outstanding Day 🌟"
        elif variance_pct < -5:
            score_label = "Good Day 👍"
        elif variance_pct <= 5:
            score_label = "Balanced Day ✅"
        elif variance_pct <= 20:
            score_label = "Close Day — recover tomorrow 💪"
        else:
            score_label = "Tough Day — let's talk about it"
        
        # Check if investment was made today — always add champion badge
        investment_badge = ""
        try:
            today_str = datetime.now().strftime("%Y-%m-%d")
            txns = transaction_repo.get_transactions(phone)
            for tx in (txns or []):
                if (tx.get("category", "").lower() in ["mutual_fund", "stocks", "fd", "rd", "insurance", "ppf", "gold", "sip", "investment"]
                    and today_str in str(tx.get("created_at", ""))):
                    investment_badge = "\n🏆 *Investment Champion* — You invested today!"
                    break
        except:
            pass
        
        # Streak milestone celebration
        streak_msg = ""
        if streak in [7, 14, 21, 30, 50, 100]:
            streak_msg = f"\n\n🔥🔥 *{streak}-DAY STREAK!* You're in the top {max(1, 100 - streak)}% of trackers! Keep it up!"
        
        # Get goal info
        goal = self._get_active_goal(phone)
        target = goal.get("target_amount", 100000) if goal else 100000
        goal_name = goal.get("name", "your goal") if goal else "your goal"
        progress = self._get_goal_progress(phone)
        
        # Try AI-powered evening check-in
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}
        language = lang_map.get(lang, "English")
        
        try:
            import os
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                prompt = f"""Generate MoneyViya's 8 PM evening check-in.

USER: {name} | Personality: {personality}
Today's Score: {score_label}
Spending: ₹{today_expenses} / Budget ₹{daily_budget} (Variance: {variance_pct:.0f}%)
Income: ₹{today_income} | Net: ₹{net}
Goal: {goal_name} — {progress}% complete
Streak: {streak} days{investment_badge}{streak_msg}

RULES:
1. Start with today's score: "{score_label}"
2. Clean day summary (3 lines max)
3. Ask naturally about any untracked spending
4. End with tomorrow's budget ₹{daily_budget} and ONE encouraging word
5. If streak milestone — celebrate big
6. Max 130 words in {language}. WhatsApp format."""

                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": f"You are Viya, MoneyViya's evening check-in engine. Summarize the financial day. Be warm, non-judgmental. Max 130 words in {language}."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 250
                    },
                    timeout=12
                )
                if response.ok:
                    return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Evening AI] Error: {e}")
        
        # Fallback to template
        filled = int(progress / 10)
        progress_bar = "█" * filled + "░" * (10 - filled)
        saved = int(target * progress / 100)
        
        comparison = score_label
        template = self.templates.get(lang, self.templates["en"])["evening_checkout"]
        
        return template.format(
            date=datetime.now().strftime("%d %b %Y"),
            income=today_income,
            expenses=today_expenses,
            net=net,
            comparison=comparison,
            progress_bar=progress_bar,
            saved=saved,
            target=target,
            progress=progress,
            advice=f"Tomorrow's budget: ₹{daily_budget}. You've got this! 💪{streak_msg}{investment_badge}"
        )
    
    # =================== DATA HELPERS ===================
    
    def _get_today_expenses(self, phone: str) -> int:
        """Get today's total expenses"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            today = datetime.now().date()
            total = 0
            for tx in transactions:
                if tx.get("type") == "expense":
                    tx_date = datetime.fromisoformat(tx.get("date", "")).date()
                    if tx_date == today:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_today_income(self, phone: str) -> int:
        """Get today's total income"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            today = datetime.now().date()
            total = 0
            for tx in transactions:
                if tx.get("type") == "income":
                    tx_date = datetime.fromisoformat(tx.get("date", "")).date()
                    if tx_date == today:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_month_expenses(self, phone: str) -> int:
        """Get this month's total expenses"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            now = datetime.now()
            total = 0
            for tx in transactions:
                if tx.get("type") == "expense":
                    tx_date = datetime.fromisoformat(tx.get("date", ""))
                    if tx_date.year == now.year and tx_date.month == now.month:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_month_income(self, phone: str) -> int:
        """Get this month's total income"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            now = datetime.now()
            total = 0
            for tx in transactions:
                if tx.get("type") == "income":
                    tx_date = datetime.fromisoformat(tx.get("date", ""))
                    if tx_date.year == now.year and tx_date.month == now.month:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_yesterday_savings(self, phone: str) -> int:
        """Get yesterday's net savings"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            yesterday = (datetime.now() - timedelta(days=1)).date()
            income = 0
            expense = 0
            for tx in transactions:
                tx_date = datetime.fromisoformat(tx.get("date", "")).date()
                if tx_date == yesterday:
                    if tx.get("type") == "income":
                        income += tx.get("amount", 0)
                    else:
                        expense += tx.get("amount", 0)
            return income - expense
        except:
            return 0
    
    def _get_goal_progress(self, phone: str) -> int:
        """Get goal progress percentage"""
        try:
            user = user_repo.get_user(phone)
            if not user:
                return 0
            
            target = user.get("target_amount", 100000)
            # Calculate total savings since start
            start_date = user.get("start_date")
            if not start_date:
                return 0
            
            transactions = transaction_repo.get_transactions(phone)
            start = datetime.fromisoformat(start_date)
            
            total_saved = 0
            for tx in transactions:
                tx_date = datetime.fromisoformat(tx.get("date", ""))
                if tx_date >= start:
                    if tx.get("type") == "income":
                        total_saved += tx.get("amount", 0)
                    else:
                        total_saved -= tx.get("amount", 0)
            
            progress = int((max(0, total_saved) / target) * 100)
            return min(100, progress)
        except:
            return 0
    
    def _get_active_goal(self, phone: str) -> Optional[Dict]:
        """Get user's active goal"""
        try:
            user = user_repo.get_user(phone)
            if not user:
                return None
            
            if not user.get("target_amount"):
                return None
            
            start_date = user.get("start_date")
            if start_date:
                start = datetime.fromisoformat(start_date)
                days_elapsed = (datetime.now() - start).days
                timeline_days = user.get("timeline_days", 365)
                days_left = max(0, timeline_days - days_elapsed)
            else:
                days_left = 365
            
            return {
                "name": user.get("goal_type", "Savings Goal"),
                "target_amount": user.get("target_amount", 100000),
                "days_left": days_left,
                "timeline": user.get("timeline", "1 Year"),
            }
        except:
            return None
    
    def _get_today_income(self, phone: str) -> int:
        """Get today's total income accumulated"""
        try:
            import pytz
            ist = pytz.timezone('Asia/Kolkata')
            today = datetime.now(ist).date()
            
            transactions = transaction_repo.get_transactions(phone)
            total = 0
            print(f"[AccumulatedIncome] Checking {len(transactions) if transactions else 0} transactions for {phone}")
            
            for tx in transactions:
                if tx.get("type") == "income":
                    tx_date_str = tx.get("date", "")
                    try:
                        # Handle timezone-aware dates
                        if "+" in tx_date_str:
                            tx_date_str = tx_date_str.split("+")[0]  # Remove timezone
                        tx_date = datetime.fromisoformat(tx_date_str).date()
                        
                        if tx_date == today:
                            amt = tx.get("amount", 0)
                            total += amt
                            print(f"[AccumulatedIncome] Found ₹{amt} ({tx_date})")
                    except Exception as parse_err:
                        print(f"[AccumulatedIncome] Parse error: {parse_err}")
            
            print(f"[AccumulatedIncome] Total for today: ₹{total}")
            return total
        except Exception as e:
            print(f"Error getting today income: {e}")
            return 0
    
    def _get_today_expenses(self, phone: str) -> int:
        """Get today's total expenses accumulated"""
        try:
            import pytz
            ist = pytz.timezone('Asia/Kolkata')
            today = datetime.now(ist).date()
            
            transactions = transaction_repo.get_transactions(phone)
            total = 0
            for tx in transactions:
                if tx.get("type") == "expense":
                    tx_date_str = tx.get("date", "")
                    try:
                        if "+" in tx_date_str:
                            tx_date_str = tx_date_str.split("+")[0]
                        tx_date = datetime.fromisoformat(tx_date_str).date()
                        if tx_date == today:
                            total += tx.get("amount", 0)
                    except:
                        pass
            return total
        except Exception as e:
            print(f"Error getting today expenses: {e}")
            return 0
    
    def _get_month_income(self, phone: str) -> int:
        """Get this month's total income"""
        try:
            import pytz
            ist = pytz.timezone('Asia/Kolkata')
            now = datetime.now(ist)
            
            transactions = transaction_repo.get_transactions(phone)
            total = 0
            for tx in transactions:
                if tx.get("type") == "income":
                    tx_date = datetime.fromisoformat(tx.get("date", ""))
                    if tx_date.year == now.year and tx_date.month == now.month:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_month_expenses(self, phone: str) -> int:
        """Get this month's total expenses"""
        try:
            import pytz
            ist = pytz.timezone('Asia/Kolkata')
            now = datetime.now(ist)
            
            transactions = transaction_repo.get_transactions(phone)
            total = 0
            for tx in transactions:
                if tx.get("type") == "expense":
                    tx_date = datetime.fromisoformat(tx.get("date", ""))
                    if tx_date.year == now.year and tx_date.month == now.month:
                        total += tx.get("amount", 0)
            return total
        except:
            return 0
    
    def _get_category_breakdown(self, phone: str) -> Dict[str, int]:
        """Get expense breakdown by category"""
        try:
            transactions = transaction_repo.get_transactions(phone)
            now = datetime.now()
            categories = {}
            
            for tx in transactions:
                if tx.get("type") == "expense":
                    tx_date = datetime.fromisoformat(tx.get("date", ""))
                    if tx_date.year == now.year and tx_date.month == now.month:
                        cat = tx.get("category", "other")
                        categories[cat] = categories.get(cat, 0) + tx.get("amount", 0)
            
            return categories
        except:
            return {"other": 0}


# Create global instance
advanced_agent = AdvancedWhatsAppAgent()
