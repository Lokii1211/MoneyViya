"""
MoneyViya Auto-Capture Services
================================
Implements Layer 1 (SMS Parsing), Layer 3 (Screenshot Parsing), 
and Layer 5 (Smart Cash Prompting) from the Zero Friction Strategy.

Uses OpenAI GPT-4o-mini for intelligent parsing.
"""

import re
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

try:
    import requests as http_requests
except:
    http_requests = None

try:
    import pytz
    IST = pytz.timezone('Asia/Kolkata')
except:
    IST = None


# ══════════════════════════════════════════════════
# LAYER 1: SMS TRANSACTION PARSER
# ══════════════════════════════════════════════════

class SMSParser:
    """
    Parses Indian bank SMS messages to extract transaction data.
    Supports: SBI, HDFC, ICICI, Axis, Kotak, Paytm Bank, 
    GPay UPI alerts, PhonePe alerts, and more.
    """
    
    # Indian bank SMS patterns (regex-based for speed, AI fallback for complex ones)
    DEBIT_PATTERNS = [
        # Standard bank formats
        r'(?:debited|spent|paid|charged|withdrawn|deducted)\s*(?:by|of|with|for)?\s*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)',
        r'(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|paid|charged|withdrawn|deducted)',
        r'(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:has been|was)\s*(?:debited|deducted)',
        # UPI format
        r'debited by\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*(?:for|via)\s*UPI',
        r'UPI.*?(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)',
        # Card format
        r'(?:card|credit card|debit card).*?(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)',
    ]
    
    CREDIT_PATTERNS = [
        r'(?:credited|received|deposited)\s*(?:with|by|of)?\s*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)',
        r'(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:credited|received|deposited)',
        r'(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(?:has been|was)\s*(?:credited|received)',
        r'salary.*?(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)',
    ]
    
    # Merchant to category mapping
    MERCHANT_CATEGORIES = {
        # Food Delivery
        "swiggy": "food_delivery", "zomato": "food_delivery", 
        "dominos": "food_delivery", "pizza hut": "food_delivery",
        "eatsure": "food_delivery", "dunzo": "food_delivery",
        
        # Groceries
        "bigbazaar": "groceries", "dmart": "groceries", 
        "spencer": "groceries", "reliance fresh": "groceries",
        "jiomart": "groceries", "blinkit": "groceries",
        "zepto": "groceries", "instamart": "groceries",
        "bb now": "groceries", "grofers": "groceries",
        
        # Shopping
        "amazon": "shopping", "flipkart": "shopping", 
        "myntra": "shopping", "ajio": "shopping",
        "meesho": "shopping", "nykaa": "shopping",
        
        # Subscriptions
        "netflix": "subscription", "spotify": "subscription",
        "hotstar": "subscription", "prime": "subscription",
        "youtube": "subscription", "jio cinema": "subscription",
        "zee5": "subscription", "sony liv": "subscription",
        
        # Transport
        "ola": "transport", "uber": "transport", 
        "rapido": "transport", "metro": "transport",
        
        # Fuel
        "hpcl": "fuel", "bpcl": "fuel", "iocl": "fuel",
        "indian oil": "fuel", "petrol": "fuel",
        
        # Telecom
        "airtel": "telecom", "jio": "telecom", "vi": "telecom",
        "bsnl": "telecom",
        
        # Utilities
        "electricity": "utilities", "bescom": "utilities",
        "water bill": "utilities", "gas bill": "utilities",
        
        # Health
        "apollo": "health", "medplus": "health", 
        "pharmeasy": "health", "1mg": "health",
        "netmeds": "health", "practo": "health",
        
        # EMI
        "emi": "emi", "nach": "emi", "ecs": "emi",
        "loan": "emi",
    }
    
    def parse_sms(self, sms_text: str) -> Dict:
        """Parse a bank SMS and extract transaction data"""
        result = {
            "is_financial": False,
            "confidence": 0.0,
            "type": None,
            "amount": None,
            "merchant": None,
            "category": "uncategorized",
            "payment_method": "unknown",
            "account_last4": None,
            "balance_after": None,
            "reference": None,
        }
        
        if not sms_text:
            return result
        
        sms_lower = sms_text.lower()
        
        # Skip non-financial SMS
        non_financial = ["otp", "verification", "login", "password", "offer", "cashback offer", 
                        "apply now", "pre-approved", "congratulations"]
        if any(nf in sms_lower for nf in non_financial):
            if "otp" in sms_lower or "verification" in sms_lower or "password" in sms_lower:
                return result
        
        # Try debit patterns (use IGNORECASE to handle Rs/rs/RS etc)
        for pattern in self.DEBIT_PATTERNS:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(",", "")
                try:
                    result["amount"] = float(amount_str)
                    result["type"] = "debit"
                    result["is_financial"] = True
                    result["confidence"] = 0.85
                except:
                    continue
                break
        
        # Try credit patterns if no debit found
        if not result["is_financial"]:
            for pattern in self.CREDIT_PATTERNS:
                match = re.search(pattern, sms_text, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).replace(",", "")
                    try:
                        result["amount"] = float(amount_str)
                        result["type"] = "credit"
                        result["is_financial"] = True
                        result["confidence"] = 0.85
                    except:
                        continue
                    break
        
        if not result["is_financial"]:
            return result
        
        # Extract account last 4
        acc_match = re.search(r'(?:a/c|account|ac|card)\s*(?:no\.?|number)?\s*[xX*]+(\d{4})', sms_text)
        if acc_match:
            result["account_last4"] = acc_match.group(1)
        
        # Extract balance
        bal_match = re.search(r'(?:bal|balance|avl bal|available balance)[:\s]*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)', sms_lower)
        if bal_match:
            result["balance_after"] = float(bal_match.group(1).replace(",", ""))
        
        # Extract reference
        ref_match = re.search(r'(?:ref|reference|txn|transaction)\s*(?:no\.?|id|#)?\s*[:\s]*(\w+)', sms_lower)
        if ref_match:
            result["reference"] = ref_match.group(1)
        
        # Detect payment method
        if "upi" in sms_lower:
            result["payment_method"] = "upi"
        elif any(w in sms_lower for w in ["credit card", "cc"]):
            result["payment_method"] = "credit_card"
        elif any(w in sms_lower for w in ["debit card", "dc", "pos"]):
            result["payment_method"] = "debit_card"
        elif "neft" in sms_lower:
            result["payment_method"] = "neft"
        elif "imps" in sms_lower:
            result["payment_method"] = "imps"
        elif "atm" in sms_lower:
            result["payment_method"] = "atm"
        elif "nach" in sms_lower or "ecs" in sms_lower:
            result["payment_method"] = "auto_debit"
        
        # Extract and categorize merchant
        merchant = self._extract_merchant(sms_text)
        if merchant:
            result["merchant"] = merchant
            result["category"] = self._categorize_merchant(merchant)
            result["confidence"] = min(result["confidence"] + 0.1, 1.0)
        
        # Salary detection
        if result["type"] == "credit" and "salary" in sms_lower:
            result["category"] = "income_salary"
            result["merchant"] = "Salary"
            result["confidence"] = 0.95
        
        return result
    
    def _extract_merchant(self, sms_text: str) -> Optional[str]:
        """Extract merchant name from SMS"""
        # "at MERCHANT" pattern
        at_match = re.search(r'at\s+([A-Z][A-Za-z0-9\s&\'-]+?)(?:\s+on|\s+for|\s*\.|\s*$)', sms_text)
        if at_match:
            return at_match.group(1).strip()
        
        # "to MERCHANT" pattern (UPI)
        to_match = re.search(r'(?:to|for)\s+([A-Z][A-Za-z0-9\s&\'-]+?)(?:\s+on|\s+ref|\s*\.|\s*$)', sms_text)
        if to_match:
            return to_match.group(1).strip()
        
        # UPI ID pattern
        upi_match = re.search(r'([\w.]+@\w+)', sms_text)
        if upi_match:
            upi_id = upi_match.group(1).lower()
            # Map known UPI IDs to merchants
            for merchant, _ in self.MERCHANT_CATEGORIES.items():
                if merchant in upi_id:
                    return merchant.title()
            return upi_id
        
        return None
    
    def _categorize_merchant(self, merchant: str) -> str:
        """Categorize based on merchant name"""
        merchant_lower = merchant.lower()
        for keyword, category in self.MERCHANT_CATEGORIES.items():
            if keyword in merchant_lower:
                return category
        return "uncategorized"
    
    def format_whatsapp_message(self, parsed: Dict, user: Dict, daily_budget_left: float = None) -> str:
        """Format parsed SMS into a WhatsApp confirmation message"""
        if not parsed["is_financial"]:
            return None
        
        name = user.get("name", "Friend")
        
        # Category emoji map
        emoji_map = {
            "food_delivery": "🍔", "groceries": "🛒", "shopping": "🛍️",
            "subscription": "📺", "transport": "🚗", "fuel": "⛽",
            "telecom": "📱", "utilities": "💡", "health": "💊",
            "emi": "🏦", "income_salary": "💰", "uncategorized": "📋"
        }
        
        emoji = emoji_map.get(parsed["category"], "📋")
        category_display = parsed["category"].replace("_", " ").title()
        merchant = parsed["merchant"] or "Unknown"
        amount = int(parsed["amount"])
        
        if parsed["type"] == "credit":
            msg = f"""💰 *Auto-logged Income!*

{emoji} ₹{amount:,} received — {merchant}
📂 Category: {category_display}"""
            
            if parsed.get("balance_after"):
                msg += f"\n💳 Bank balance: ₹{int(parsed['balance_after']):,}"
            
            msg += "\n\n_Wrong? Reply 'fix'_"
            return msg
        
        # Debit
        msg = f"""✅ *Auto-logged!*

{emoji} ₹{amount:,} → {category_display} ({merchant})"""

        if daily_budget_left is not None:
            remaining = daily_budget_left - amount
            if remaining > 0:
                msg += f"\n💰 Budget left today: ₹{int(remaining):,}"
            else:
                msg += f"\n⚠️ Over budget by ₹{int(abs(remaining)):,}"
        
        if parsed.get("balance_after"):
            msg += f"\n💳 Bank balance: ₹{int(parsed['balance_after']):,}"
        
        msg += "\n\n_Wrong category? Reply 'fix'_"
        return msg


# ══════════════════════════════════════════════════
# LAYER 3: SCREENSHOT / FORWARDED MESSAGE PARSER
# ══════════════════════════════════════════════════

class ScreenshotParser:
    """
    Parses forwarded payment messages and screenshots using OpenAI Vision.
    Handles: GPay, PhonePe, Paytm, Amazon Pay screenshots,
    forwarded bank alerts, and email receipts.
    """
    
    FORWARDED_PATTERNS = [
        # GPay / PhonePe / Paytm forwarded messages
        r'(?:you |)paid\s*(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:to|for)\s+(.+)',
        r'(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:sent|paid)\s*(?:to|successfully)',
        r'payment\s*(?:of\s*)?(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:successful|completed|done)',
        r'(?:received|got)\s*(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:from)\s+(.+)',
    ]
    
    def parse_forwarded_text(self, text: str) -> Dict:
        """Parse forwarded payment confirmation text"""
        result = {
            "is_financial": False,
            "confidence": 0.0,
            "type": None,
            "amount": None,
            "merchant": None,
            "category": "uncategorized",
            "source": "forwarded_message"
        }
        
        text_lower = text.lower()
        
        for pattern in self.FORWARDED_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(",", "")
                try:
                    result["amount"] = float(amount_str)
                    result["is_financial"] = True
                    result["confidence"] = 0.80
                    
                    # Determine type
                    if any(w in text_lower for w in ["received", "got", "credited"]):
                        result["type"] = "credit"
                    else:
                        result["type"] = "debit"
                    
                    # Extract merchant if in group 2
                    if match.lastindex and match.lastindex >= 2:
                        result["merchant"] = match.group(2).strip().title()
                    
                    # Detect app
                    if "google pay" in text_lower or "gpay" in text_lower:
                        result["source"] = "google_pay"
                    elif "phonepe" in text_lower:
                        result["source"] = "phonepe"
                    elif "paytm" in text_lower:
                        result["source"] = "paytm"
                    elif "amazon pay" in text_lower:
                        result["source"] = "amazon_pay"
                    
                    break
                except:
                    continue
        
        # If regex didn't catch it, try AI
        if not result["is_financial"] and self._has_openai():
            result = self._parse_with_ai(text)
        
        return result
    
    def parse_screenshot_base64(self, image_base64: str, user: Dict) -> Dict:
        """Parse a payment screenshot using OpenAI Vision API"""
        if not self._has_openai():
            return {"is_financial": False, "error": "OpenAI not available for image parsing"}
        
        try:
            api_key = os.getenv("OPENAI_API_KEY", "")
            
            system_prompt = """You are MoneyViya's visual transaction parser. 
Extract financial transaction data from this payment screenshot.

Look for:
1. Amount (largest ₹ number visible)
2. Merchant/recipient name
3. Payment app (GPay, PhonePe, Paytm, Amazon Pay, bank app)
4. Status (success/failed/pending)
5. Date/time if visible

Respond ONLY in this JSON format:
{
  "is_financial": true/false,
  "type": "debit" or "credit",
  "amount": number,
  "merchant": "name",
  "category": "food_delivery/groceries/shopping/transport/subscription/utilities/uncategorized",
  "app": "gpay/phonepe/paytm/amazon_pay/bank/unknown",
  "status": "success/failed/pending",
  "confidence": 0.0-1.0
}

If the image is NOT a payment screenshot, return {"is_financial": false}"""

            response = http_requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": [
                            {"type": "text", "text": "Parse this payment screenshot:"},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                        ]}
                    ],
                    "max_tokens": 300,
                    "temperature": 0.1
                },
                timeout=20
            )
            
            if response.ok:
                content = response.json()["choices"][0]["message"]["content"].strip()
                # Extract JSON from response
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    parsed["source"] = "screenshot_ocr"
                    return parsed
            
            return {"is_financial": False, "error": "Could not parse image"}
            
        except Exception as e:
            print(f"[ScreenshotParser] Error: {e}")
            return {"is_financial": False, "error": str(e)}
    
    def _parse_with_ai(self, text: str) -> Dict:
        """Use AI to parse complex forwarded text"""
        try:
            api_key = os.getenv("OPENAI_API_KEY", "")
            
            response = http_requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": """Extract transaction from this forwarded message.
Return JSON: {"is_financial": bool, "type": "debit"/"credit", "amount": number, "merchant": "name", "category": "category", "confidence": 0.0-1.0}
If not financial, return {"is_financial": false}"""},
                        {"role": "user", "content": text}
                    ],
                    "max_tokens": 200,
                    "temperature": 0.1
                },
                timeout=10
            )
            
            if response.ok:
                content = response.json()["choices"][0]["message"]["content"].strip()
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    result["source"] = "ai_parsed"
                    return result
        except:
            pass
        
        return {"is_financial": False, "source": "forwarded_message"}
    
    def _has_openai(self) -> bool:
        """Check if OpenAI is available"""
        return bool(os.getenv("OPENAI_API_KEY", "")) and http_requests is not None


# ══════════════════════════════════════════════════
# LAYER 5: SMART CASH PROMPT ENGINE
# ══════════════════════════════════════════════════

class SmartCashPrompter:
    """
    Generates contextual, time-based prompts to capture cash expenses.
    Learns user patterns and asks at the right time about the right category.
    """
    
    # Default routine patterns by occupation
    OCCUPATION_ROUTINES = {
        "employee": {
            "morning": {"time": "08:30", "prompt": "commute", "examples": ["auto", "bus", "metro", "petrol"]},
            "afternoon": {"time": "13:00", "prompt": "lunch", "examples": ["lunch", "canteen", "dabba"]},
            "evening": {"time": "18:30", "prompt": "chai_snack", "examples": ["chai", "snack", "nashta"]},
        },
        "student": {
            "morning": {"time": "09:00", "prompt": "commute", "examples": ["bus", "auto", "metro"]},
            "afternoon": {"time": "13:00", "prompt": "lunch", "examples": ["canteen", "mess", "lunch"]},
            "evening": {"time": "17:00", "prompt": "chai_snack", "examples": ["chai", "snack", "photocopy"]},
        },
        "freelancer": {
            "morning": {"time": "10:00", "prompt": "coffee", "examples": ["coffee", "chai", "breakfast"]},
            "afternoon": {"time": "13:30", "prompt": "lunch", "examples": ["lunch", "food"]},
            "evening": {"time": "19:00", "prompt": "evening_spend", "examples": ["groceries", "dinner"]},
        },
        "homemaker": {
            "morning": {"time": "09:00", "prompt": "daily_needs", "examples": ["doodh", "sabji", "bread"]},
            "afternoon": {"time": "12:00", "prompt": "groceries", "examples": ["kirana", "vegetables"]},
            "evening": {"time": "18:00", "prompt": "evening_market", "examples": ["sabji mandi", "fruits"]},
        },
        "business": {
            "morning": {"time": "09:00", "prompt": "commute", "examples": ["petrol", "auto", "parking"]},
            "afternoon": {"time": "13:00", "prompt": "lunch", "examples": ["lunch", "chai", "meeting"]},
            "evening": {"time": "19:00", "prompt": "business_expense", "examples": ["supplies", "misc"]},
        },
    }
    
    def generate_prompt(self, user: Dict, current_hour: int, 
                       today_transactions: List = None,
                       cash_gap: float = 0,
                       last_prompt_time: str = None) -> Optional[Dict]:
        """Generate a contextual cash expense prompt"""
        
        name = user.get("name", "Friend")
        lang = user.get("language", "en")
        occupation = user.get("occupation", "employee").lower()
        
        # Don't prompt too frequently (max 2 per day, min 3 hours apart)
        if last_prompt_time:
            try:
                last = datetime.fromisoformat(last_prompt_time)
                now = datetime.now(IST) if IST else datetime.now()
                if (now - last).total_seconds() < 10800:  # 3 hours
                    return None
            except:
                pass
        
        routines = self.OCCUPATION_ROUTINES.get(occupation, self.OCCUPATION_ROUTINES["employee"])
        
        # Determine time period
        if 7 <= current_hour < 11:
            period = "morning"
        elif 11 <= current_hour < 15:
            period = "afternoon"
        elif 15 <= current_hour < 20:
            period = "evening"
        else:
            return None  # Don't prompt at night
        
        routine = routines.get(period)
        if not routine:
            return None
        
        # Check if already tracked this period
        if today_transactions:
            period_categories = routine.get("examples", [])
            has_tracked = any(
                any(cat in str(t.get("description", "")).lower() or cat in str(t.get("category", "")).lower() 
                    for cat in period_categories)
                for t in today_transactions
            )
            if has_tracked:
                return None
        
        # Generate prompt based on period and occupation
        prompt_type = routine["prompt"]
        
        prompts = self._get_prompts(prompt_type, name, lang, cash_gap)
        
        if not prompts:
            return None
        
        import random
        chosen = random.choice(prompts)
        
        return {
            "should_prompt": True,
            "prompt_type": prompt_type,
            "message": chosen,
            "period": period,
            "best_send_time": routine["time"],
        }
    
    def generate_atm_tracking_prompt(self, user: Dict, atm_amount: float, 
                                      atm_remaining: float) -> str:
        """Prompt for tracking cash after ATM withdrawal"""
        name = user.get("name", "Friend")
        spent = atm_amount - atm_remaining
        
        return f"""💵 *Cash Tracker for {name}*

You withdrew ₹{int(atm_amount):,} from ATM.
✅ Tracked: ₹{int(spent):,}
💰 Remaining: ₹{int(atm_remaining):,}

Any cash spending today?
Just reply: "cash 50 chai" or "cash 200 sabji"

_I'll keep counting until your withdrawal is accounted for!_"""
    
    def generate_gap_investigation(self, user: Dict, gap_amount: float, 
                                    days_gap: int = 1) -> str:
        """Prompt when there's an unexplained gap in finances"""
        name = user.get("name", "Friend")
        
        return f"""🔍 *{name}, quick check!*

Your income vs tracked expenses shows ₹{int(gap_amount):,} unaccounted this {'week' if days_gap > 1 else 'day'}.

This might be cash spending like:
🚖 Auto/transport
☕ Chai/snacks  
🛒 Kirana/vegetables

Quick log: just type "auto 60" or "chai 20"
Or reply "nothing" if everything's tracked! ✅"""
    
    def _get_prompts(self, prompt_type: str, name: str, lang: str, 
                     cash_gap: float) -> List[str]:
        """Get contextual prompts by type"""
        
        if prompt_type == "commute":
            return [
                f"🚖 *Morning {name}!* Auto/bus fare today?\nJust reply: auto 60 🚌",
                f"☀️ *Good morning {name}!* How was the commute?\nReply: 'auto 50' or 'metro 30' to log it",
            ]
        elif prompt_type == "lunch":
            return [
                f"🍽️ *Lunch time {name}!* Ate out today?\nReply the amount: 'lunch 150' or 'canteen 80'",
                f"🥗 *{name}, lunch check!* What did you eat?\nType: 'lunch 200' or 'home' if packed lunch 🍱",
            ]
        elif prompt_type == "coffee":
            return [
                f"☕ *Coffee break {name}!* Any cafe visits today?\nReply: 'coffee 180' or 'chai 20'",
            ]
        elif prompt_type == "chai_snack":
            return [
                f"☕ *{name}, chai time!* Any snacks today?\nReply: 'chai 20' or 'snack 50'",
                f"🍪 *Evening {name}!* Chai/snack kharcha?\nJust type the amount: 'chai 30'",
            ]
        elif prompt_type == "daily_needs":
            return [
                f"🥛 *Good morning {name}!* Daily needs — doodh, bread?\nReply: 'doodh 60' or 'bread 40'",
            ]
        elif prompt_type == "groceries":
            return [
                f"🛒 *{name}, kirana shopping today?*\nReply: 'kirana 350' or 'sabji 150'",
            ]
        elif prompt_type == "evening_market":
            return [
                f"🥬 *{name}, sabji mandi ka hisab?*\nReply: 'sabji 200' or 'fruits 150'",
            ]
        elif prompt_type == "evening_spend":
            return [
                f"🌆 *Evening {name}!* Any cash spending today?\nQuick: 'chai 30' or 'auto 80'",
            ]
        elif prompt_type == "business_expense":
            return [
                f"📋 *{name}, business expenses today?*\nReply: 'supplies 500' or 'misc 200'",
            ]
        
        return []


# ══════════════════════════════════════════════════
# SINGLETONS
# ══════════════════════════════════════════════════

sms_parser = SMSParser()
screenshot_parser = ScreenshotParser()
smart_cash_prompter = SmartCashPrompter()
