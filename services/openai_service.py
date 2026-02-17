"""
OpenAI Integration Service
Provides voice transcription, smart NLP, and AI-powered responses
"""

import os
import re
import requests
from typing import Dict, Any, Optional
from datetime import datetime

# OpenAI setup
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

class OpenAIService:
    """OpenAI integration for transcription and NLP"""
    
    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def is_available(self) -> bool:
        """Check if OpenAI is configured"""
        return bool(self.api_key and len(self.api_key) > 20)
    
    def transcribe_audio(self, audio_url: str) -> str:
        """Transcribe audio from URL using Whisper API"""
        if not self.is_available():
            return ""
        
        try:
            # Download audio file
            audio_response = requests.get(audio_url, timeout=30)
            if not audio_response.ok:
                print(f"Failed to download audio: {audio_response.status_code}")
                return ""
            
            # Send to Whisper API
            files = {
                'file': ('audio.ogg', audio_response.content, 'audio/ogg'),
                'model': (None, 'whisper-1'),
                'language': (None, 'hi')  # Hindi - will auto-detect
            }
            
            response = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
                timeout=60
            )
            
            if response.ok:
                result = response.json()
                transcript = result.get("text", "")
                print(f"Transcribed: {transcript}")
                return transcript
            else:
                print(f"Whisper API error: {response.text}")
                return ""
                
        except Exception as e:
            print(f"Transcription error: {e}")
            return ""
    
    def understand_message(self, message: str, language: str = "english", context: dict = None) -> Dict[str, Any]:
        """Smart Transaction Parser — Strategy Prompt 3
        
        Uses the rich category taxonomy from MoneyViya Product Strategy
        to intelligently categorize transactions and provide behavioral context.
        """
        if not self.is_available():
            return self._fallback_parse(message)
        
        try:
            prompt = f"""You are MoneyViya's transaction understanding engine.
A user has sent a message that may contain financial information.

CATEGORY TAXONOMY:
Income: salary, freelance, business, interest, rental, gift, bonus, other_income
Expenses: 
  - Essentials: rent, groceries, electricity, water, internet, mobile, medicine, school_fees
  - Transport: fuel, auto, cab, bus, train, flight
  - Food: restaurant, coffee, snacks, swiggy, zomato, delivery
  - Shopping: clothing, electronics, household, beauty
  - Entertainment: movies, streaming, gaming, events
  - Health: gym, doctor, pharmacy
  - Investment: mutual_fund, stocks, fd, rd, insurance, ppf, gold
  - Debt: emi, credit_card, loan_repayment
  - Savings: bank_transfer, piggy_bank

SMART CATEGORY RULES:
- "Swiggy", "Zomato", "food delivery" = food (not groceries)
- "Big Bazaar", "DMart", "vegetables" = groceries
- "Netflix", "Spotify", "Hotstar" = entertainment (streaming)
- "SIP", "mutual fund" = investment (POSITIVE — celebrate this)
- "EMI" = debt (note: this is positive behavior)
- "Uber", "Ola", "auto" = transport (cab)

User's language: {language}
Message: "{message}"

IMPORTANT: If message contains BOTH earned/income AND spent/expense, return MULTIPLE_TRANSACTIONS.

Respond ONLY with valid JSON:

Single transaction:
{{"intent": "EXPENSE_ENTRY", "amount": 200, "category": "food", "description": "lunch", "confidence": 0.95}}

Multiple transactions:
{{"intent": "MULTIPLE_TRANSACTIONS", "transactions": [
    {{"type": "income", "amount": 500, "category": "salary", "description": "earned"}},
    {{"type": "expense", "amount": 200, "category": "food", "description": "lunch"}}
]}}

Queries: {{"intent": "BALANCE_QUERY"}} or {{"intent": "REPORT_QUERY"}} or {{"intent": "GREETING"}} or {{"intent": "INVESTMENT_QUERY"}}

Parse: "{message}"
"""
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=self.headers,
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are MoneyViya's Smart Transaction Parser. Parse financial messages in any Indian language (Hindi, Tamil, Telugu, English, etc.). Extract amounts, categories from the taxonomy, and intent. Return ONLY valid JSON. If message contains BOTH income AND expense, return MULTIPLE_TRANSACTIONS."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 400
                },
                timeout=15
            )
            
            if response.ok:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                # Parse JSON from response
                import json
                try:
                    # Find JSON in response
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        print(f"[SmartParser] Parsed: {parsed}")
                        return parsed
                except Exception as e:
                    print(f"[SmartParser] JSON parse error: {e}")
            
            return self._fallback_parse(message)
            
        except Exception as e:
            print(f"SmartParser error: {e}")
            return self._fallback_parse(message)
    
    def _fallback_parse(self, message: str) -> Dict[str, Any]:
        """Fallback NLP when OpenAI is not available"""
        message_lower = message.lower()
        
        # Extract amount
        amount_match = re.search(r'(\d+)', message)
        amount = int(amount_match.group(1)) if amount_match else 0
        
        # Detect intent
        income_words = ['earn', 'income', 'salary', 'got', 'received', 'कमाया', 'കിട്ടി', 'சம்பளம்']
        expense_words = ['spent', 'spend', 'खर्च', 'செலவு', 'ఖర్చు', 'paid', 'bought']
        balance_words = ['balance', 'बैलेंस', 'how much', 'कितना']
        
        intent = "OTHER"
        if any(w in message_lower for w in income_words):
            intent = "INCOME_ENTRY"
        elif any(w in message_lower for w in expense_words):
            intent = "EXPENSE_ENTRY"
        elif any(w in message_lower for w in balance_words):
            intent = "BALANCE_QUERY"
        
        # Detect category
        category = "other"
        food_words = ['food', 'खाना', 'lunch', 'dinner', 'breakfast', 'chai', 'coffee']
        transport_words = ['petrol', 'uber', 'ola', 'auto', 'bus', 'train']
        
        if any(w in message_lower for w in food_words):
            category = "food"
        elif any(w in message_lower for w in transport_words):
            category = "transport"
        
        return {
            "intent": intent,
            "amount": amount,
            "category": category,
            "description": message[:50]
        }
    
    def generate_financial_plan(self, user_data: dict, language: str = "english") -> str:
        """Smart Financial Plan Generator (Strategy Prompt 13)
        
        Comprehensive, personalized financial plan with 4 phases:
        Snapshot → Foundation (0-3mo) → Build (3-12mo) → Grow (1-5yr)
        """
        if not self.is_available():
            return self._fallback_plan(user_data, language)
        
        try:
            income = user_data.get("monthly_income", 20000)
            expenses = user_data.get("monthly_expenses", user_data.get("fixed_expenses", 0))
            savings = user_data.get("current_savings", 0)
            surplus = income - expenses
            goals = user_data.get("financial_goals", user_data.get("goals", ["General Savings"]))
            name = user_data.get("name", "Friend")
            risk = user_data.get("risk_appetite", "Medium")
            personality = user_data.get("money_personality", "builder")
            occupation = user_data.get("occupation", "professional")
            
            # Income-tier specific rules
            if income < 15000:
                tier_rules = "Focus on emergency fund, RD, no risky investments"
            elif income < 30000:
                tier_rules = "Emergency fund + Index fund SIP (₹500 minimum)"
            elif income < 60000:
                tier_rules = "Multi-goal approach, diversified SIPs, some stocks if risk-tolerant"
            else:
                tier_rules = "Full diversification, tax planning, wealth accumulation"
            
            # Investment recommendations by risk
            inv_recs = {
                "Low": "Post Office RD, SBI/HDFC FD, Liquid Mutual Funds, PPF",
                "Medium": "Nifty 50 Index Fund, Balanced Advantage Fund, Large Cap Fund",
                "High": "Mid Cap Fund, Small Cap Fund, Direct Stocks (blue chip)"
            }
            
            prompt = f"""Create MoneyViya's personalized financial plan.

USER PROFILE:
Name: {name} | {occupation} | Personality: {personality}
Income: ₹{income:,}/mo | Expenses: ₹{expenses:,}/mo | Surplus: ₹{surplus:,}/mo
Savings: ₹{savings:,} | Risk: {risk}
Goals: {', '.join(goals) if isinstance(goals, list) else goals}

INCOME TIER: {tier_rules}
RISK-BASED INVESTMENTS: {inv_recs.get(risk, inv_recs["Medium"])}

PLAN STRUCTURE (Prompt 13):
Section 1: FINANCIAL SNAPSHOT (current status, net surplus, emergency fund status)
Section 2: THE FOUNDATION (first 3 months — emergency fund, budget tweak, first investment)
Section 3: THE BUILD (3-12 months — goal allocation, monthly savings split, SIP plan)
Section 4: THE GROW (1-5 years — projections, goal timeline, wealth strategy)

RULES:
- WhatsApp format, each section 3-4 lines
- Under 300 words total
- End with: "This is your starting point. We build from here together 💪"
- Write in {language}"""

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=self.headers,
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": f"You are Viya, MoneyViya's financial planner. Create inspiring, non-overwhelming plans. In {language}. Max 300 words. WhatsApp format."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=15
            )
            
            if response.ok:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
                
        except Exception as e:
            print(f"Plan generation error: {e}")
        
        return self._fallback_plan(user_data, language)
    
    def _fallback_plan(self, user_data: dict, language: str) -> str:
        """Fallback plan generation"""
        income = user_data.get("monthly_income", 20000)
        savings = user_data.get("savings_target", int(income * 0.2))
        daily_budget = (income - savings) // 30
        daily_savings = savings // 30
        
        if language == "hindi":
            return f"""📊 *आपका वित्तीय प्लान*

💰 मासिक आय: ₹{income:,}
💾 बचत लक्ष्य: ₹{savings:,}/माह

📅 *दैनिक लक्ष्य:*
• 💸 खर्च सीमा: ₹{daily_budget:,}/दिन
• 💾 बचत लक्ष्य: ₹{daily_savings:,}/दिन

💪 छोटे कदम, बड़े लक्ष्य!"""
        
        return f"""📊 *Your Financial Plan*

💰 Monthly Income: ₹{income:,}
💾 Savings Goal: ₹{savings:,}/month

📅 *Daily Targets:*
• 💸 Spending Limit: ₹{daily_budget:,}/day
• 💾 Savings Target: ₹{daily_savings:,}/day

💪 Small steps, big goals!"""
    
    def adapt_multilingual_response(self, message: str, response: str, language: str = "en", emotion: str = None) -> str:
        """Multilingual Emotional Intelligence (Strategy Prompt 12)
        
        Ensures communication is culturally appropriate, emotionally intelligent,
        and linguistically authentic.
        """
        if not self.is_available():
            return response  # Can't adapt without AI
        
        lang_profiles = {
            "hi": "Hindi — Warm, familial (Aap, respectful forms), aspirational. Use Shabash!, Kya baat hai!, Wah!",
            "ta": "Tamil — Respectful, community-oriented, achievement-focused. Use Soopar!, Romba nalla irukku!",
            "te": "Telugu — Formal yet warm, family-first. Use Chala bagundi!, Super!",
            "kn": "Kannada — Steady, practical, understated celebrations. Use Thumba channagide!, Super!",
            "en": "English — Professional but friendly, direct. Can use more financial jargon."
        }
        
        emotion_guideline = {
            "stressed": "Lead with empathy before data",
            "excited": "Match their energy, celebrate with them",
            "confused": "Slow down, use analogy, simple language",
            "frustrated": "Validate their feeling, ask what they need",
            "ashamed": "Normalize, forward-focus immediately, never judge"
        }
        
        if language == "en":
            return response  # English doesn't need cultural adaptation
        
        try:
            lang_name = {"hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada"}.get(language, "English")
            
            prompt = f"""Adapt this response for cultural and emotional intelligence.

LANGUAGE PROFILE: {lang_profiles.get(language, lang_profiles["en"])}
USER MESSAGE: {message}
DETECTED EMOTION: {emotion or "neutral"}
EMOTION GUIDELINE: {emotion_guideline.get(emotion, "Default warm tone")}

ORIGINAL RESPONSE:
{response}

RULES:
- Adapt to {lang_name} — not translated, NATIVE feeling
- Apply cultural nuances (respect forms, celebration styles)
- Keep financial terms in English if user may understand them
- Maintain the same information and intent
- Max same length as original"""

            api_response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=self.headers,
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": f"You are MoneyViya's cultural adaptation engine. Adapt financial messages to be culturally authentic in {lang_name}. Never translate literally — make it NATIVE."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 300
                },
                timeout=10
            )
            
            if api_response.ok:
                return api_response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Multilingual AI] Error: {e}")
        
        return response  # Return original if adaptation fails


# Global instance
openai_service = OpenAIService()


def transcribe_voice(audio_url: str) -> str:
    """Transcribe voice message"""
    return openai_service.transcribe_audio(audio_url)


def understand_message(message: str, language: str = "english") -> Dict[str, Any]:
    """Smart NLP understanding"""
    return openai_service.understand_message(message, language)


def generate_plan(user_data: dict, language: str = "english") -> str:
    """Generate personalized plan"""
    return openai_service.generate_financial_plan(user_data, language)

