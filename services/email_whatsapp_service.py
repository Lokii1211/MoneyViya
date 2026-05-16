"""
Viya Email Intelligence Service
==================================
Phase 2 US-602: Parse Gmail/Outlook for bills, investments, receipts.
Detects: e-bills, mutual fund statements, insurance renewals, credit card bills.
"""

import re
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum


class EmailType(Enum):
    BILL = "bill"
    RECEIPT = "receipt"
    INVESTMENT = "investment"
    INSURANCE = "insurance"
    SALARY = "salary"
    CREDIT_CARD = "credit_card"
    BANK_STATEMENT = "bank_statement"
    SUBSCRIPTION = "subscription"
    TAX = "tax"
    UNKNOWN = "unknown"


# ══════════════════════════════════════════════════
# SENDER PATTERN DATABASE
# ══════════════════════════════════════════════════

SENDER_PATTERNS = {
    # Bills & Utilities
    r'airtel|jio|vodafone|bsnl': {'type': EmailType.BILL, 'category': '💡 Bills', 'sub': 'telecom'},
    r'electricity|bescom|tata.?power|adani.?power': {'type': EmailType.BILL, 'category': '💡 Bills', 'sub': 'electricity'},
    r'broadband|act.?fiber|hathway': {'type': EmailType.BILL, 'category': '💡 Bills', 'sub': 'internet'},

    # E-commerce receipts
    r'amazon|flipkart|myntra|ajio|meesho': {'type': EmailType.RECEIPT, 'category': '🛒 Shopping', 'sub': 'online'},
    r'swiggy|zomato|dominos': {'type': EmailType.RECEIPT, 'category': '🍕 Food', 'sub': 'delivery'},
    r'uber|ola|rapido': {'type': EmailType.RECEIPT, 'category': '🚗 Transport', 'sub': 'ride'},

    # Investment
    r'zerodha|kite|groww|kuvera|upstox|coin': {'type': EmailType.INVESTMENT, 'category': '📈 Investment', 'sub': 'brokerage'},
    r'cams|kfintech|karvy|mutual.?fund': {'type': EmailType.INVESTMENT, 'category': '📈 Investment', 'sub': 'mutual_fund'},
    r'nps|national.?pension': {'type': EmailType.INVESTMENT, 'category': '📈 Investment', 'sub': 'nps'},

    # Insurance
    r'lic|policybazaar|star.?health|hdfc.?ergo|icici.?lombard': {'type': EmailType.INSURANCE, 'category': '🛡️ Insurance', 'sub': 'policy'},

    # Credit card
    r'credit.?card|card.?statement|citibank|amex|visa': {'type': EmailType.CREDIT_CARD, 'category': '💳 Credit Card', 'sub': 'statement'},

    # Bank
    r'hdfc.?bank|icici.?bank|sbi|axis.?bank|kotak': {'type': EmailType.BANK_STATEMENT, 'category': '🏦 Bank', 'sub': 'statement'},

    # Subscription
    r'netflix|spotify|youtube|apple|google.?play|microsoft.?365': {'type': EmailType.SUBSCRIPTION, 'category': '🔄 Subscription', 'sub': 'digital'},

    # Tax
    r'income.?tax|itr|form.?16|26as|tds': {'type': EmailType.TAX, 'category': '📋 Tax', 'sub': 'filing'},

    # Salary
    r'payroll|salary.?slip|pay.?stub|compensation': {'type': EmailType.SALARY, 'category': '💰 Salary', 'sub': 'payslip'},
}

# Amount extraction patterns
AMOUNT_PATTERNS = [
    r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{2})?)',
    r'(?:amount|total|due|payable)[:\s]*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)',
    r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{2})?)\s*(?:due|payable|debited)',
]

# Due date patterns
DUE_DATE_PATTERNS = [
    r'(?:due|payment)\s*(?:date|by)[:\s]*(\d{1,2}[\s/-]\w{3,9}[\s/-]\d{2,4})',
    r'(?:pay\s*before|due\s*on)[:\s]*(\d{1,2}[\s/-]\w{3,9}[\s/-]\d{2,4})',
    r'(\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4})\s*(?:is the|due)',
]


class EmailIntelligenceService:
    """Parse emails for financial intelligence."""

    def __init__(self):
        self.processed = {}  # user -> [parsed_emails]

    def parse_email(self, sender: str, subject: str, body: str = '',
                    received_at: str = None) -> Dict:
        """
        Parse a single email for financial data.
        Returns: {type, category, amount, due_date, merchant, ...}
        """
        combined = f"{sender} {subject} {body}".lower()

        # Classify email type
        email_type = EmailType.UNKNOWN
        category = '📧 Other'
        subcategory = None

        for pattern, info in SENDER_PATTERNS.items():
            if re.search(pattern, combined, re.IGNORECASE):
                email_type = info['type']
                category = info['category']
                subcategory = info.get('sub')
                break

        # Extract amount
        amount = self._extract_amount(combined)

        # Extract due date
        due_date = self._extract_due_date(combined)

        # Extract merchant
        merchant = self._extract_merchant(sender, subject)

        # Dedup hash
        dedup = hashlib.sha256(
            f"{sender}:{subject}:{amount}:{received_at or ''}".encode()
        ).hexdigest()[:16]

        # Action items
        actions = self._determine_actions(email_type, amount, due_date)

        return {
            'type': email_type.value,
            'category': category,
            'subcategory': subcategory,
            'amount': amount,
            'due_date': due_date,
            'merchant': merchant,
            'sender': sender,
            'subject': subject,
            'received_at': received_at or datetime.utcnow().isoformat(),
            'dedup_hash': dedup,
            'actions': actions,
            'is_actionable': bool(actions),
        }

    def parse_batch(self, emails: List[Dict], user_phone: str = '') -> Dict:
        """Parse batch of emails, return aggregated insights."""
        results = []
        bills_total = 0
        investments_total = 0
        upcoming_dues = []

        for email in emails:
            parsed = self.parse_email(
                sender=email.get('sender', ''),
                subject=email.get('subject', ''),
                body=email.get('body', ''),
                received_at=email.get('received_at'),
            )
            results.append(parsed)

            if parsed['type'] == 'bill' and parsed['amount']:
                bills_total += parsed['amount']
                if parsed['due_date']:
                    upcoming_dues.append({
                        'merchant': parsed['merchant'],
                        'amount': parsed['amount'],
                        'due_date': parsed['due_date'],
                    })
            elif parsed['type'] == 'investment' and parsed['amount']:
                investments_total += parsed['amount']

        if user_phone:
            self.processed[user_phone] = results

        return {
            'parsed': results,
            'summary': {
                'total_emails': len(emails),
                'bills_detected': sum(1 for r in results if r['type'] == 'bill'),
                'receipts_detected': sum(1 for r in results if r['type'] == 'receipt'),
                'investments_detected': sum(1 for r in results if r['type'] == 'investment'),
                'subscriptions_detected': sum(1 for r in results if r['type'] == 'subscription'),
                'bills_total': round(bills_total),
                'investments_total': round(investments_total),
                'upcoming_dues': sorted(upcoming_dues, key=lambda x: x.get('due_date', '')),
                'actionable_count': sum(1 for r in results if r['is_actionable']),
            },
        }

    def _extract_amount(self, text: str) -> Optional[float]:
        for pattern in AMOUNT_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(',', ''))
                except (ValueError, IndexError):
                    continue
        return None

    def _extract_due_date(self, text: str) -> Optional[str]:
        for pattern in DUE_DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_merchant(self, sender: str, subject: str) -> str:
        # Try sender domain
        domain_match = re.search(r'@([^.]+)', sender)
        if domain_match:
            return domain_match.group(1).title()
        # Fallback to first word of subject
        words = subject.split()
        return words[0].title() if words else 'Unknown'

    def _determine_actions(self, email_type: EmailType, amount: float,
                           due_date: str) -> List[str]:
        actions = []
        if email_type == EmailType.BILL:
            if amount:
                actions.append(f"Pay ₹{amount:,.0f}")
            if due_date:
                actions.append(f"Due: {due_date}")
            actions.append("Add to expenses")
        elif email_type == EmailType.CREDIT_CARD:
            if amount:
                actions.append(f"Pay ₹{amount:,.0f} to avoid interest")
            actions.append("View statement")
        elif email_type == EmailType.INVESTMENT:
            actions.append("Update portfolio")
        elif email_type == EmailType.INSURANCE:
            actions.append("Check renewal date")
        elif email_type == EmailType.SUBSCRIPTION:
            actions.append("Review subscription")
        return actions


# ══════════════════════════════════════════════════
# WHATSAPP BOT SERVICE (US-610)
# ══════════════════════════════════════════════════

class WhatsAppBotService:
    """
    WhatsApp bot for financial queries.
    Supported commands: balance, spend, budget, sip, tax, help.
    Uses Twilio/Gupshup webhook.
    """

    COMMANDS = {
        'hi': 'greeting',
        'hello': 'greeting',
        'help': 'help',
        'balance': 'balance',
        'spend': 'spending',
        'spent': 'spending',
        'budget': 'budget',
        'sip': 'sip',
        'tax': 'tax',
        'insights': 'insights',
        'portfolio': 'portfolio',
        'subscribe': 'subscribe',
        'stop': 'unsubscribe',
    }

    def process_message(self, user_phone: str, message: str,
                        user_data: Dict = None) -> Dict:
        """
        Process incoming WhatsApp message.
        Returns: {response_text, media_url?, quick_replies?}
        """
        msg = message.strip().lower()
        data = user_data or {}

        # Match command
        command = None
        for keyword, cmd in self.COMMANDS.items():
            if keyword in msg:
                command = cmd
                break

        if not command:
            # Try amount-based queries: "spent on food", "how much uber"
            if any(w in msg for w in ['how much', 'kitna', 'total']):
                command = 'spending'
            else:
                command = 'help'

        handler = getattr(self, f'_handle_{command}', self._handle_help)
        return handler(user_phone, msg, data)

    def _handle_greeting(self, phone: str, msg: str, data: dict) -> Dict:
        name = data.get('name', 'there')
        balance = data.get('balance', 0)
        return {
            'text': (
                f"👋 Hey {name}! Welcome to Viya.\n\n"
                f"💰 Your balance: ₹{balance:,.0f}\n\n"
                f"Type *help* to see what I can do!"
            ),
            'quick_replies': ['💰 Balance', '📊 Spending', '📈 Portfolio'],
        }

    def _handle_help(self, phone: str, msg: str, data: dict) -> Dict:
        return {
            'text': (
                "🤖 *Viya Financial Assistant*\n\n"
                "Here's what I can help with:\n\n"
                "💰 *balance* — Your current balance\n"
                "📊 *spend* — This month's spending\n"
                "📋 *budget* — Budget vs actual\n"
                "📈 *portfolio* — Investment overview\n"
                "💡 *sip* — SIP projection\n"
                "📋 *tax* — Tax summary\n"
                "🔔 *insights* — Smart financial tips\n\n"
                "Or just ask: _How much did I spend on food?_"
            ),
        }

    def _handle_balance(self, phone: str, msg: str, data: dict) -> Dict:
        accounts = data.get('accounts', [])
        total = sum(a.get('balance', 0) for a in accounts)
        lines = [f"💰 *Your Balance: ₹{total:,.0f}*\n"]
        for acc in accounts[:5]:
            lines.append(f"  🏦 {acc.get('bank', 'Bank')}: ₹{acc.get('balance', 0):,.0f}")
        return {'text': '\n'.join(lines)}

    def _handle_spending(self, phone: str, msg: str, data: dict) -> Dict:
        total = data.get('monthly_spend', 0)
        categories = data.get('top_categories', [])
        lines = [f"📊 *This Month's Spending: ₹{total:,.0f}*\n"]
        for cat in categories[:5]:
            lines.append(f"  {cat.get('name', '')}: ₹{cat.get('amount', 0):,.0f}")
        income = data.get('monthly_income', 0)
        if income > 0:
            rate = round((income - total) / income * 100)
            lines.append(f"\n💪 Savings rate: {rate}%")
        return {'text': '\n'.join(lines)}

    def _handle_budget(self, phone: str, msg: str, data: dict) -> Dict:
        budgets = data.get('budgets', {})
        if not budgets:
            return {'text': "📋 No budgets set yet.\n\nReply *set budget Food 8000* to create one."}
        lines = ["📋 *Budget Status*\n"]
        for cat, info in budgets.items():
            pct = info.get('percentage', 0)
            emoji = '🔴' if pct >= 100 else '🟡' if pct >= 80 else '🟢'
            lines.append(f"  {emoji} {cat}: ₹{info.get('spent', 0):,.0f}/₹{info.get('budget', 0):,.0f} ({pct}%)")
        return {'text': '\n'.join(lines)}

    def _handle_portfolio(self, phone: str, msg: str, data: dict) -> Dict:
        port = data.get('portfolio', {})
        invested = port.get('total_invested', 0)
        current = port.get('current_value', 0)
        pnl = current - invested
        pnl_pct = round(pnl / max(invested, 1) * 100, 1)
        emoji = '📈' if pnl >= 0 else '📉'
        return {
            'text': (
                f"{emoji} *Portfolio Overview*\n\n"
                f"💵 Invested: ₹{invested:,.0f}\n"
                f"💰 Current: ₹{current:,.0f}\n"
                f"{'🟢' if pnl >= 0 else '🔴'} P&L: ₹{pnl:,.0f} ({pnl_pct}%)\n\n"
                f"Type *portfolio detail* for holdings breakdown."
            ),
        }

    def _handle_sip(self, phone: str, msg: str, data: dict) -> Dict:
        # Parse: "sip 10000 20 years" or use defaults
        numbers = re.findall(r'\d+', msg)
        monthly = int(numbers[0]) if len(numbers) > 0 else 10000
        years = int(numbers[1]) if len(numbers) > 1 else 20
        rate = 0.12
        months = years * 12
        mr = rate / 12
        fv = 0
        for _ in range(months):
            fv = (fv + monthly) * (1 + mr)
        invested = monthly * months
        return {
            'text': (
                f"📈 *SIP Projection*\n\n"
                f"💵 Monthly: ₹{monthly:,.0f}\n"
                f"⏱️ Duration: {years} years\n"
                f"📊 Expected: 12% p.a.\n\n"
                f"💰 Total Invested: ₹{invested:,.0f}\n"
                f"🏆 Future Value: ₹{fv:,.0f}\n"
                f"✨ Wealth Gain: ₹{fv - invested:,.0f} ({fv/max(invested,1):.1f}x)"
            ),
        }

    def _handle_tax(self, phone: str, msg: str, data: dict) -> Dict:
        tax = data.get('tax', {})
        return {
            'text': (
                f"📋 *Tax Summary (FY 2026-27)*\n\n"
                f"💵 Total Income: ₹{tax.get('income', 0):,.0f}\n"
                f"📊 Estimated Tax: ₹{tax.get('estimated', 0):,.0f}\n"
                f"✅ 80C Used: ₹{tax.get('80c_used', 0):,.0f}/₹1,50,000\n"
                f"{'⚠️' if tax.get('80c_used', 0) < 150000 else '✅'} "
                f"80C Remaining: ₹{150000 - tax.get('80c_used', 0):,.0f}\n\n"
                f"Type *tax detail* for full breakdown."
            ),
        }

    def _handle_insights(self, phone: str, msg: str, data: dict) -> Dict:
        insights = data.get('insights', [])
        if not insights:
            return {'text': "🧠 No new insights right now. Check back later!"}
        lines = ["🧠 *Smart Insights*\n"]
        for ins in insights[:3]:
            lines.append(f"  {ins.get('title', '')}")
            lines.append(f"  _{ins.get('message', '')[:80]}_\n")
        return {'text': '\n'.join(lines)}

    def _handle_subscribe(self, phone: str, msg: str, data: dict) -> Dict:
        return {
            'text': (
                "🔔 *Daily Brief Activated!*\n\n"
                "You'll receive:\n"
                "  ☀️ Morning: Yesterday's summary\n"
                "  🌙 Evening: Today's spending\n"
                "  📊 Weekly: Budget report\n\n"
                "Reply *stop* to unsubscribe."
            ),
        }

    def _handle_unsubscribe(self, phone: str, msg: str, data: dict) -> Dict:
        return {'text': "🔕 Daily briefs stopped. Reply *subscribe* to restart."}


# Singletons
email_intelligence = EmailIntelligenceService()
whatsapp_bot = WhatsAppBotService()
