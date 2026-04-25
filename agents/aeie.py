"""
AI Expense Intelligence Engine (AEIE) v1.0
===========================================
Automatically detects expenses from SMS/bank notifications,
categorizes them using AI, provides smart financial insights,
generates monthly reports, and sends budget alerts.

Features:
- SMS/notification parsing for auto-expense detection
- AI-powered categorization (food, travel, EMI, shopping, etc.)
- Behavioral analysis & personalized insights
- Monthly report auto-generation
- Budget breach alerts
- Learning from user corrections

Author: Viya Engineering
"""

import os
import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

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
        print(f"[AEIE] Supabase error: {e}")
        return None


# ============================================================
# SMS PARSING PATTERNS — Indian Banks & UPI
# ============================================================

SMS_PATTERNS = {
    # Debit patterns (expenses)
    "debit_upi": re.compile(
        r"(?:debited|spent|paid|sent)\s*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*"
        r"(?:from|via|thru|through)?\s*(?:.*?)"
        r"(?:to|at|for)\s+(.+?)(?:\s+on|\s+ref|\s+txn|\.|$)",
        re.IGNORECASE
    ),
    "debit_card": re.compile(
        r"(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*(?:has been |was )?(?:debited|charged|deducted)"
        r"(?:.*?)(?:at|to|for)\s+(.+?)(?:\s+on|\s+ref|\.|$)",
        re.IGNORECASE
    ),
    "debit_simple": re.compile(
        r"(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|paid)"
        r"(?:.*?)(?:info[:\s]*)?(.+?)(?:\s+avl|\s+bal|\.|$)",
        re.IGNORECASE
    ),
    # Credit patterns (income)
    "credit": re.compile(
        r"(?:credited|received|deposited)\s*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)"
        r"(?:.*?)(?:from|by)\s+(.+?)(?:\s+on|\s+ref|\.|$)",
        re.IGNORECASE
    ),
    # Balance check
    "balance": re.compile(
        r"(?:avl\.?\s*bal|available\s*balance|a/c\s*bal)[:\s]*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
        re.IGNORECASE
    ),
    # EMI
    "emi": re.compile(
        r"emi\s*(?:of|:)?\s*(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s*(?:.*?)(?:for|towards)\s+(.+?)(?:\s+on|\.|$)",
        re.IGNORECASE
    ),
}

# ============================================================
# CATEGORY DETECTION — AI + Rules
# ============================================================

CATEGORY_RULES = {
    "food": {
        "keywords": ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger",
                     "biryani", "chai", "coffee", "starbucks", "dominos", "mcdonalds",
                     "kfc", "subway", "dunkin", "hotel", "dhaba", "canteen", "mess"],
        "emoji": "🍕",
    },
    "grocery": {
        "keywords": ["bigbasket", "blinkit", "zepto", "instamart", "dmart", "reliance",
                     "grocery", "supermarket", "kirana", "vegetables", "fruits", "milk"],
        "emoji": "🛒",
    },
    "transport": {
        "keywords": ["uber", "ola", "rapido", "auto", "metro", "bus", "train", "irctc",
                     "petrol", "diesel", "fuel", "parking", "toll", "fastag", "redbus"],
        "emoji": "🚗",
    },
    "shopping": {
        "keywords": ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho",
                     "mall", "shop", "store", "retail", "clothing", "shoes"],
        "emoji": "🛍️",
    },
    "bills": {
        "keywords": ["electricity", "bescom", "water", "gas", "broadband", "wifi",
                     "airtel", "jio", "vi", "bsnl", "recharge", "dth", "tata sky"],
        "emoji": "📋",
    },
    "rent": {
        "keywords": ["rent", "house", "flat", "apartment", "pg", "hostel", "landlord"],
        "emoji": "🏠",
    },
    "emi": {
        "keywords": ["emi", "loan", "instalment", "installment", "bajaj", "hdfc loan",
                     "car loan", "home loan", "personal loan", "credit card"],
        "emoji": "🏦",
    },
    "health": {
        "keywords": ["hospital", "doctor", "medical", "pharmacy", "medicine", "apollo",
                     "1mg", "pharmeasy", "netmeds", "lab", "test", "consultation"],
        "emoji": "🏥",
    },
    "entertainment": {
        "keywords": ["netflix", "hotstar", "prime video", "spotify", "movie", "cinema",
                     "pvr", "inox", "gaming", "playstation", "xbox", "steam"],
        "emoji": "🎬",
    },
    "education": {
        "keywords": ["school", "college", "tuition", "course", "udemy", "coursera",
                     "coaching", "books", "unacademy", "byju", "exam", "fee"],
        "emoji": "📚",
    },
    "investment": {
        "keywords": ["sip", "mutual fund", "groww", "zerodha", "kuvera", "paytm money",
                     "nps", "ppf", "fd", "fixed deposit", "stock", "share"],
        "emoji": "📈",
    },
    "transfer": {
        "keywords": ["transfer", "neft", "rtgs", "imps", "sent to", "paid to"],
        "emoji": "💸",
    },
}


class AIExpenseIntelligenceEngine:
    """
    AEIE — Core engine for automatic expense detection and intelligence.
    
    Usage:
        aeie = AIExpenseIntelligenceEngine()
        result = aeie.process_sms(phone, sms_text, sender)
        insights = aeie.get_smart_insights(phone)
        report = aeie.generate_monthly_report(phone)
    """

    def __init__(self):
        self.correction_log = {}  # Track user corrections for learning

    # ============================================================
    # 1. SMS PARSING — Auto-detect expenses from bank SMS
    # ============================================================

    def process_sms(self, phone: str, sms_text: str, sender: str = "") -> Optional[Dict]:
        """
        Parse a bank SMS and auto-log the expense/income.
        Returns the detected transaction or None if not a financial SMS.
        """
        # Check if it's a financial SMS
        if not self._is_financial_sms(sms_text, sender):
            return None

        # Try each pattern
        for pattern_name, pattern in SMS_PATTERNS.items():
            match = pattern.search(sms_text)
            if match:
                amount = float(match.group(1).replace(",", ""))
                merchant = match.group(2).strip() if match.lastindex >= 2 else "Unknown"

                # Determine type
                is_credit = "credit" in pattern_name
                txn_type = "income" if is_credit else "expense"

                # AI categorize
                category = self._categorize(merchant, sms_text)

                # Build transaction
                txn = {
                    "phone": phone,
                    "amount": amount,
                    "type": txn_type,
                    "category": category,
                    "description": merchant[:100],
                    "source": "sms_auto",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                }

                # Save to database
                result = _sb_fetch("transactions", "", "POST", txn)

                # Check budget alerts
                if txn_type == "expense":
                    alert = self._check_budget_alert(phone, amount, category)
                    txn["alert"] = alert

                return txn

        return None

    def _is_financial_sms(self, text: str, sender: str) -> bool:
        """Check if SMS is from a bank/financial institution"""
        financial_senders = [
            "HDFCBK", "SBIINB", "ICICIB", "AXISBK", "KOTAKB", "BOIIND",
            "PNBSMS", "YESBNK", "IDBIBK", "CANBNK", "CENTBK", "INDBNK",
            "PAYTM", "PHONEPE", "GPAY", "AMAZONPAY", "CRED",
        ]
        sender_upper = sender.upper()
        if any(s in sender_upper for s in financial_senders):
            return True
        # Content-based detection
        financial_keywords = ["debited", "credited", "transaction", "upi", "neft",
                            "imps", "emi", "a/c", "account", "balance"]
        text_lower = text.lower()
        return sum(1 for kw in financial_keywords if kw in text_lower) >= 2

    def _categorize(self, merchant: str, full_text: str) -> str:
        """AI-powered categorization using keyword matching + learning"""
        combined = f"{merchant} {full_text}".lower()

        # Score each category
        scores = {}
        for cat, config in CATEGORY_RULES.items():
            score = sum(2 for kw in config["keywords"] if kw in combined)
            if score > 0:
                scores[cat] = score

        if scores:
            return max(scores, key=scores.get)
        return "other"

    # ============================================================
    # 2. BUDGET ALERTS — Real-time breach detection
    # ============================================================

    def _check_budget_alert(self, phone: str, amount: float, category: str) -> Optional[Dict]:
        """Check if this expense breaches any budget limits"""
        user = _sb_fetch("users", f"?phone=eq.{phone}&select=daily_budget,monthly_income")
        if not user or len(user) == 0:
            return None

        daily_budget = float(user[0].get("daily_budget", 1000))

        # Get today's total
        today = datetime.now().strftime("%Y-%m-%d")
        today_txns = _sb_fetch(
            "transactions",
            f"?phone=eq.{phone}&type=eq.expense&date=eq.{today}&select=amount"
        ) or []
        today_total = sum(float(t.get("amount", 0)) for t in today_txns)

        alert = None
        if today_total > daily_budget:
            overshoot = today_total - daily_budget
            pct = int((today_total / daily_budget) * 100)
            alert = {
                "type": "budget_breach",
                "severity": "critical" if pct > 150 else "warning",
                "message": f"⚠️ Budget Alert! You've spent ₹{today_total:,.0f} today "
                          f"({pct}% of ₹{daily_budget:,.0f} daily budget). "
                          f"₹{overshoot:,.0f} over limit!",
            }
        elif today_total > daily_budget * 0.8:
            remaining = daily_budget - today_total
            alert = {
                "type": "budget_warning",
                "severity": "info",
                "message": f"💡 Heads up! Only ₹{remaining:,.0f} left in today's budget.",
            }

        return alert

    # ============================================================
    # 3. SMART INSIGHTS — Behavioral analysis
    # ============================================================

    def get_smart_insights(self, phone: str) -> List[Dict]:
        """Generate personalized financial insights from spending patterns"""
        insights = []

        # Get last 30 days transactions
        since = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        txns = _sb_fetch(
            "transactions",
            f"?phone=eq.{phone}&type=eq.expense&date=gte.{since}&select=*&order=date.desc"
        ) or []

        if len(txns) < 5:
            return [{"type": "info", "icon": "📊", "title": "Keep Tracking!",
                     "desc": "Log more expenses and I'll give you smart insights."}]

        total = sum(float(t.get("amount", 0)) for t in txns)
        daily_avg = total / 30

        # Category breakdown
        cat_totals = {}
        for t in txns:
            cat = t.get("category", "other")
            cat_totals[cat] = cat_totals.get(cat, 0) + float(t.get("amount", 0))

        top_cat = max(cat_totals, key=cat_totals.get) if cat_totals else "other"
        top_amt = cat_totals.get(top_cat, 0)
        top_pct = int((top_amt / total) * 100) if total > 0 else 0
        emoji = CATEGORY_RULES.get(top_cat, {}).get("emoji", "💰")

        # Insight 1: Top spending category
        insights.append({
            "type": "spending_pattern", "icon": emoji,
            "title": f"{top_cat.title()} is your #1 expense",
            "desc": f"₹{top_amt:,.0f} ({top_pct}%) in 30 days. "
                   f"{'Consider cutting back!' if top_pct > 40 else 'Looks reasonable.'}",
        })

        # Insight 2: Daily average
        insights.append({
            "type": "daily_avg", "icon": "📈",
            "title": f"₹{daily_avg:,.0f}/day average",
            "desc": f"Total: ₹{total:,.0f} in 30 days. "
                   f"{'Try reducing to ₹' + f'{daily_avg * 0.8:,.0f}' if daily_avg > 500 else 'Great control!'}",
        })

        # Insight 3: Weekend vs weekday
        weekend_total = sum(float(t.get("amount", 0)) for t in txns
                          if datetime.strptime(t.get("date", "2026-01-01"), "%Y-%m-%d").weekday() >= 5)
        weekday_total = total - weekend_total
        if weekend_total > weekday_total * 0.5:
            insights.append({
                "type": "weekend_spike", "icon": "🎉",
                "title": "Weekend splurge detected!",
                "desc": f"You spend ₹{weekend_total:,.0f} on weekends vs ₹{weekday_total:,.0f} on weekdays. "
                       f"Plan weekend budgets!",
            })

        # Insight 4: Subscription audit
        sub_cats = ["entertainment", "bills"]
        sub_total = sum(cat_totals.get(c, 0) for c in sub_cats)
        if sub_total > total * 0.15:
            insights.append({
                "type": "sub_audit", "icon": "📺",
                "title": "Subscription costs are high",
                "desc": f"₹{sub_total:,.0f}/month on subscriptions & bills ({int(sub_total/total*100)}%). Review at /bills",
            })

        # Insight 5: Food spending
        food_total = cat_totals.get("food", 0)
        if food_total > total * 0.3:
            savings = food_total * 0.2
            insights.append({
                "type": "food_savings", "icon": "🍕",
                "title": f"Food = {int(food_total/total*100)}% of spending",
                "desc": f"Cook 2 more meals/week → save ~₹{savings:,.0f}/month",
            })

        return insights[:5]  # Max 5 insights

    # ============================================================
    # 4. MONTHLY REPORT — Auto-generated
    # ============================================================

    def generate_monthly_report(self, phone: str, month: int = None, year: int = None) -> Dict:
        """Generate comprehensive monthly financial report"""
        now = datetime.now()
        month = month or now.month
        year = year or now.year

        start = f"{year}-{month:02d}-01"
        if month == 12:
            end = f"{year + 1}-01-01"
        else:
            end = f"{year}-{month + 1:02d}-01"

        # Fetch data
        txns = _sb_fetch(
            "transactions",
            f"?phone=eq.{phone}&date=gte.{start}&date=lt.{end}&select=*"
        ) or []

        expenses = [t for t in txns if t.get("type") == "expense"]
        incomes = [t for t in txns if t.get("type") == "income"]

        total_exp = sum(float(t.get("amount", 0)) for t in expenses)
        total_inc = sum(float(t.get("amount", 0)) for t in incomes)
        savings = total_inc - total_exp
        savings_rate = int((savings / total_inc) * 100) if total_inc > 0 else 0

        # Category breakdown
        categories = {}
        for t in expenses:
            cat = t.get("category", "other")
            categories[cat] = categories.get(cat, 0) + float(t.get("amount", 0))

        sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)

        return {
            "month": f"{year}-{month:02d}",
            "total_income": total_inc,
            "total_expenses": total_exp,
            "savings": savings,
            "savings_rate": savings_rate,
            "transaction_count": len(txns),
            "expense_count": len(expenses),
            "income_count": len(incomes),
            "top_categories": [
                {"category": cat, "amount": amt, "pct": int((amt / total_exp) * 100) if total_exp > 0 else 0,
                 "emoji": CATEGORY_RULES.get(cat, {}).get("emoji", "💰")}
                for cat, amt in sorted_cats[:5]
            ],
            "daily_average": total_exp / 30,
            "grade": "A+" if savings_rate >= 30 else "A" if savings_rate >= 20 else "B" if savings_rate >= 10 else "C" if savings_rate >= 0 else "F",
        }

    # ============================================================
    # 5. EMAIL INTELLIGENCE — Auto-categorize emails
    # ============================================================

    def process_email(self, phone: str, email_data: Dict) -> Optional[Dict]:
        """
        Process an email and extract actionable data.
        Called when user grants email permission.
        """
        subject = (email_data.get("subject") or "").lower()
        body = (email_data.get("body") or email_data.get("snippet") or "").lower()
        from_addr = (email_data.get("from") or "").lower()
        combined = f"{subject} {body} {from_addr}"

        # Detect category
        category = "other"
        priority = "medium"
        action_required = False
        action_type = None
        extracted = {}

        # Bill detection
        if any(w in combined for w in ["bill", "invoice", "payment due", "amount due", "pay now", "overdue"]):
            category = "bill"
            priority = "high"
            action_required = True
            action_type = "pay_bill"
            # Extract amount
            amt_match = re.search(r"(?:rs\.?|₹|inr)\s*([\d,]+\.?\d*)", combined)
            if amt_match:
                extracted["amount"] = float(amt_match.group(1).replace(",", ""))
            # Extract due date
            date_match = re.search(r"(?:due|by|before)\s*:?\s*(\d{1,2}[\s/-]\w+[\s/-]\d{2,4})", combined)
            if date_match:
                extracted["dueDate"] = date_match.group(1)

        # Meeting detection
        elif any(w in combined for w in ["meeting", "invitation", "calendar", "join", "zoom", "meet.google"]):
            category = "meeting"
            priority = "high"
            action_required = True
            action_type = "accept_meeting"
            # Extract time
            time_match = re.search(r"(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))", combined)
            if time_match:
                extracted["startTime"] = time_match.group(1)

        # Delivery detection
        elif any(w in combined for w in ["shipped", "dispatched", "delivery", "out for delivery", "tracking"]):
            category = "delivery"
            action_required = True
            action_type = "track_delivery"

        # Investment detection
        elif any(w in combined for w in ["sip", "mutual fund", "dividend", "folio", "nav", "units allotted"]):
            category = "investment"
            amt_match = re.search(r"(?:rs\.?|₹|inr)\s*([\d,]+\.?\d*)", combined)
            if amt_match:
                extracted["amount"] = float(amt_match.group(1).replace(",", ""))

        # Offer detection
        elif any(w in combined for w in ["offer", "sale", "discount", "coupon", "cashback", "deal"]):
            category = "offer"
            priority = "low"

        # Save to emails table
        email_record = {
            "phone": phone,
            "from_address": email_data.get("from", ""),
            "from_name": email_data.get("from_name", ""),
            "subject": email_data.get("subject", "")[:500],
            "snippet": (email_data.get("snippet") or "")[:500],
            "category": category,
            "priority": priority,
            "action_required": action_required,
            "action_type": action_type,
            "extracted_data": json.dumps(extracted),
            "gmail_id": email_data.get("gmail_id", ""),
        }

        result = _sb_fetch("emails", "", "POST", email_record)
        return {**email_record, "extracted_data": extracted}


# Singleton
aeie = AIExpenseIntelligenceEngine()
