"""
Viya Auto-Categorization Engine
================================
Phase 1 MVP: ML + Rules based transaction categorization.
Priority: Global rules → User rules → Merchant DB → AI fallback.
"""

import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# ══════════════════════════════════════════════════
# GLOBAL RULES (Applied to all users)
# ══════════════════════════════════════════════════

GLOBAL_RULES = [
    # Food & Dining
    {'merchant_contains': 'swiggy', 'category': '🍕 Food', 'subcategory': 'delivery'},
    {'merchant_contains': 'zomato', 'category': '🍕 Food', 'subcategory': 'delivery'},
    {'merchant_contains': 'dominos', 'category': '🍕 Food', 'subcategory': 'restaurant'},
    {'merchant_contains': 'mcdonalds', 'category': '🍕 Food', 'subcategory': 'restaurant'},
    {'merchant_contains': 'starbucks', 'category': '🍕 Food', 'subcategory': 'cafe'},
    {'merchant_contains': 'chaayos', 'category': '🍕 Food', 'subcategory': 'cafe'},

    # Grocery
    {'merchant_contains': 'bigbasket', 'category': '🛒 Shopping', 'subcategory': 'grocery'},
    {'merchant_contains': 'blinkit', 'category': '🛒 Shopping', 'subcategory': 'grocery'},
    {'merchant_contains': 'zepto', 'category': '🛒 Shopping', 'subcategory': 'grocery'},
    {'merchant_contains': 'dmart', 'category': '🛒 Shopping', 'subcategory': 'grocery'},
    {'merchant_contains': 'jiomart', 'category': '🛒 Shopping', 'subcategory': 'grocery'},
    {'merchant_contains': 'reliance fresh', 'category': '🛒 Shopping', 'subcategory': 'grocery'},

    # Shopping
    {'merchant_contains': 'amazon', 'category': '🛒 Shopping', 'subcategory': 'online'},
    {'merchant_contains': 'flipkart', 'category': '🛒 Shopping', 'subcategory': 'online'},
    {'merchant_contains': 'myntra', 'category': '🛒 Shopping', 'subcategory': 'fashion'},
    {'merchant_contains': 'ajio', 'category': '🛒 Shopping', 'subcategory': 'fashion'},
    {'merchant_contains': 'meesho', 'category': '🛒 Shopping', 'subcategory': 'online'},
    {'merchant_contains': 'nykaa', 'category': '🛒 Shopping', 'subcategory': 'beauty'},

    # Transport
    {'merchant_contains': 'uber', 'category': '🚗 Transport', 'subcategory': 'ride'},
    {'merchant_contains': 'ola', 'category': '🚗 Transport', 'subcategory': 'ride'},
    {'merchant_contains': 'rapido', 'category': '🚗 Transport', 'subcategory': 'ride'},
    {'merchant_contains': 'metro', 'category': '🚗 Transport', 'subcategory': 'public'},
    {'merchant_contains': 'irctc', 'category': '🚗 Transport', 'subcategory': 'train'},
    {'merchant_contains': 'indigo', 'category': '🚗 Transport', 'subcategory': 'flight'},
    {'merchant_contains': 'hpcl', 'category': '🚗 Transport', 'subcategory': 'fuel'},
    {'merchant_contains': 'bpcl', 'category': '🚗 Transport', 'subcategory': 'fuel'},
    {'merchant_contains': 'iocl', 'category': '🚗 Transport', 'subcategory': 'fuel'},

    # Entertainment
    {'merchant_contains': 'netflix', 'category': '🎬 Entertainment', 'subcategory': 'streaming'},
    {'merchant_contains': 'spotify', 'category': '🎬 Entertainment', 'subcategory': 'streaming'},
    {'merchant_contains': 'hotstar', 'category': '🎬 Entertainment', 'subcategory': 'streaming'},
    {'merchant_contains': 'jiocinema', 'category': '🎬 Entertainment', 'subcategory': 'streaming'},
    {'merchant_contains': 'youtube premium', 'category': '🎬 Entertainment', 'subcategory': 'streaming'},
    {'merchant_contains': 'bookmyshow', 'category': '🎬 Entertainment', 'subcategory': 'movies'},
    {'merchant_contains': 'pvr', 'category': '🎬 Entertainment', 'subcategory': 'movies'},
    {'merchant_contains': 'inox', 'category': '🎬 Entertainment', 'subcategory': 'movies'},

    # Healthcare
    {'merchant_contains': 'pharmeasy', 'category': '💊 Health', 'subcategory': 'pharmacy'},
    {'merchant_contains': '1mg', 'category': '💊 Health', 'subcategory': 'pharmacy'},
    {'merchant_contains': 'netmeds', 'category': '💊 Health', 'subcategory': 'pharmacy'},
    {'merchant_contains': 'apollo', 'category': '💊 Health', 'subcategory': 'hospital'},
    {'merchant_contains': 'practo', 'category': '💊 Health', 'subcategory': 'consultation'},

    # Bills & Utilities
    {'merchant_contains': 'airtel', 'category': '💡 Bills', 'subcategory': 'telecom'},
    {'merchant_contains': 'jio', 'category': '💡 Bills', 'subcategory': 'telecom'},
    {'merchant_contains': 'vodafone', 'category': '💡 Bills', 'subcategory': 'telecom'},
    {'merchant_contains': 'tata power', 'category': '💡 Bills', 'subcategory': 'electricity'},
    {'merchant_contains': 'bescom', 'category': '💡 Bills', 'subcategory': 'electricity'},
    {'merchant_contains': 'mahanagar gas', 'category': '💡 Bills', 'subcategory': 'gas'},

    # Travel
    {'merchant_contains': 'makemytrip', 'category': '✈️ Travel', 'subcategory': 'booking'},
    {'merchant_contains': 'goibibo', 'category': '✈️ Travel', 'subcategory': 'booking'},
    {'merchant_contains': 'cleartrip', 'category': '✈️ Travel', 'subcategory': 'booking'},
    {'merchant_contains': 'oyo', 'category': '✈️ Travel', 'subcategory': 'hotel'},

    # Education
    {'merchant_contains': 'udemy', 'category': '📚 Education', 'subcategory': 'course'},
    {'merchant_contains': 'coursera', 'category': '📚 Education', 'subcategory': 'course'},
    {'merchant_contains': 'unacademy', 'category': '📚 Education', 'subcategory': 'course'},
    {'merchant_contains': 'byju', 'category': '📚 Education', 'subcategory': 'course'},

    # Insurance
    {'merchant_contains': 'lic', 'category': '🛡️ Insurance', 'subcategory': 'life'},
    {'merchant_contains': 'policybazaar', 'category': '🛡️ Insurance', 'subcategory': 'general'},
    {'merchant_contains': 'star health', 'category': '🛡️ Insurance', 'subcategory': 'health'},

    # Income patterns
    {'merchant_contains': 'salary', 'category': '💰 Income', 'subcategory': 'salary', 'type_filter': 'credit'},
    {'merchant_contains': 'interest', 'category': '💰 Income', 'subcategory': 'interest', 'type_filter': 'credit'},
    {'merchant_contains': 'dividend', 'category': '💰 Income', 'subcategory': 'dividend', 'type_filter': 'credit'},
    {'merchant_contains': 'refund', 'category': '💰 Income', 'subcategory': 'refund', 'type_filter': 'credit'},

    # EMI / Loans
    {'merchant_regex': r'(emi|nach|ecs|auto.?debit|loan)', 'category': '🏦 EMI/Loan', 'subcategory': 'emi'},
]

# Amount-based heuristics
AMOUNT_RULES = [
    {'min': 0, 'max': 100, 'default_if_unknown': '🍕 Food'},
    {'min': 100, 'max': 500, 'default_if_unknown': '🍕 Food'},
    {'min': 5000, 'max': 50000, 'default_if_unknown': '🛒 Shopping'},
]


class AutoCategorizationEngine:
    """
    Multi-tier categorization: Global → User → AI.
    Learns from user corrections to build per-user rules.
    """

    def __init__(self):
        self.user_rules = {}  # user_phone -> [{rule}]
        self.user_corrections = {}  # user_phone -> {merchant: category}
        self.stats = {'global_hits': 0, 'user_hits': 0, 'ai_hits': 0, 'uncategorized': 0}

    def categorize(self, merchant: str, amount: float = 0,
                   txn_type: str = 'debit', payment_method: str = '',
                   user_phone: str = None, description: str = '') -> Dict:
        """
        Returns {category, subcategory, confidence, source}.
        Priority: user_corrections > user_rules > global_rules > amount_heuristic.
        """
        text = (merchant or description or '').lower().strip()
        if not text:
            return self._unknown()

        # Tier 1: User corrections (highest priority — user explicitly changed this)
        if user_phone and user_phone in self.user_corrections:
            for key, cat in self.user_corrections[user_phone].items():
                if key in text:
                    self.stats['user_hits'] += 1
                    return {
                        'category': cat,
                        'subcategory': None,
                        'confidence': 0.98,
                        'source': 'user_correction',
                    }

        # Tier 2: User custom rules
        if user_phone and user_phone in self.user_rules:
            result = self._match_rules(self.user_rules[user_phone], text, txn_type)
            if result:
                self.stats['user_hits'] += 1
                result['source'] = 'user_rule'
                result['confidence'] = 0.95
                return result

        # Tier 3: Global rules
        result = self._match_rules(GLOBAL_RULES, text, txn_type)
        if result:
            self.stats['global_hits'] += 1
            result['source'] = 'global_rule'
            result['confidence'] = 0.90
            return result

        # Tier 4: Amount heuristic
        if amount > 0:
            for ar in AMOUNT_RULES:
                if ar['min'] <= amount <= ar['max']:
                    self.stats['global_hits'] += 1
                    return {
                        'category': ar['default_if_unknown'],
                        'subcategory': None,
                        'confidence': 0.40,
                        'source': 'amount_heuristic',
                    }

        # Uncategorized
        self.stats['uncategorized'] += 1
        return self._unknown()

    def learn_correction(self, user_phone: str, merchant: str, new_category: str):
        """User re-categorized a transaction — learn for future."""
        if not user_phone or not merchant:
            return
        if user_phone not in self.user_corrections:
            self.user_corrections[user_phone] = {}
        self.user_corrections[user_phone][merchant.lower().strip()] = new_category

    def add_user_rule(self, user_phone: str, rule: dict):
        """Add a custom categorization rule for a user."""
        if user_phone not in self.user_rules:
            self.user_rules[user_phone] = []
        self.user_rules[user_phone].append(rule)

    def get_stats(self) -> dict:
        return dict(self.stats)

    # ── Private ──

    def _match_rules(self, rules: list, text: str, txn_type: str) -> Optional[Dict]:
        for rule in rules:
            # Type filter
            if 'type_filter' in rule and rule['type_filter'] != txn_type:
                continue
            # Merchant contains
            if 'merchant_contains' in rule:
                if rule['merchant_contains'] in text:
                    return {
                        'category': rule['category'],
                        'subcategory': rule.get('subcategory'),
                        'confidence': 0.0,
                        'source': '',
                    }
            # Merchant regex
            if 'merchant_regex' in rule:
                if re.search(rule['merchant_regex'], text, re.IGNORECASE):
                    return {
                        'category': rule['category'],
                        'subcategory': rule.get('subcategory'),
                        'confidence': 0.0,
                        'source': '',
                    }
        return None

    def _unknown(self) -> Dict:
        return {
            'category': '📦 General',
            'subcategory': None,
            'confidence': 0.0,
            'source': 'none',
        }


# ══════════════════════════════════════════════════
# RECURRING TRANSACTION DETECTOR
# ══════════════════════════════════════════════════

class RecurringDetector:
    """
    Detects recurring transactions (subscriptions, EMIs, SIPs).
    Requires 3+ occurrences of same merchant + similar amount on same day_of_month.
    """

    def __init__(self):
        self.patterns = {}  # user_phone -> [pattern]

    def analyze(self, user_phone: str, transactions: List[Dict]) -> List[Dict]:
        """Analyze transaction history and return detected recurring patterns."""
        if not transactions or len(transactions) < 3:
            return []

        # Group by normalized merchant
        groups = {}
        for t in transactions:
            key = (t.get('merchant_normalized') or t.get('description', '')).lower().strip()
            if not key or len(key) < 2:
                continue
            if key not in groups:
                groups[key] = []
            groups[key].append(t)

        detected = []
        for merchant, txns in groups.items():
            if len(txns) < 3:
                continue

            # Check if amounts are similar (within 10%)
            amounts = [t.get('amount', 0) for t in txns if t.get('amount', 0) > 0]
            if not amounts:
                continue
            avg = sum(amounts) / len(amounts)
            if avg == 0:
                continue
            is_fixed = all(abs(a - avg) / avg < 0.10 for a in amounts)

            # Check dates for monthly pattern
            dates = []
            for t in txns:
                d = t.get('date') or t.get('created_at', '')
                if d:
                    try:
                        dt = datetime.fromisoformat(d.replace('Z', '+00:00'))
                        dates.append(dt)
                    except (ValueError, TypeError):
                        pass

            if len(dates) < 3:
                continue

            dates.sort()
            days_of_month = [d.day for d in dates]

            # Check if day_of_month is consistent (within ±3 days)
            mode_day = max(set(days_of_month), key=days_of_month.count)
            consistent = sum(1 for d in days_of_month if abs(d - mode_day) <= 3)

            if consistent >= 3:
                frequency = self._detect_frequency(dates)
                is_sub = any(kw in merchant for kw in [
                    'netflix', 'spotify', 'hotstar', 'youtube', 'prime',
                    'jiocinema', 'zee5', 'cred', 'apple',
                ])
                is_emi = any(kw in merchant for kw in ['emi', 'loan', 'nach', 'ecs'])

                pattern = {
                    'merchant': merchant.title(),
                    'amount': round(avg, 2),
                    'amount_is_fixed': is_fixed,
                    'frequency': frequency,
                    'day_of_month': mode_day,
                    'occurrences': len(txns),
                    'last_seen': dates[-1].isoformat(),
                    'is_subscription': is_sub,
                    'is_emi': is_emi,
                    'category': txns[0].get('category', '📦 General'),
                    'estimated_yearly': round(avg * (12 if frequency == 'monthly' else 52 if frequency == 'weekly' else 4), 2),
                }
                detected.append(pattern)

        self.patterns[user_phone] = detected
        return detected

    def _detect_frequency(self, dates: list) -> str:
        if len(dates) < 2:
            return 'unknown'
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_gap = sum(gaps) / len(gaps)
        if avg_gap <= 10:
            return 'weekly'
        elif avg_gap <= 40:
            return 'monthly'
        elif avg_gap <= 100:
            return 'quarterly'
        else:
            return 'yearly'


# Singletons
categorization_engine = AutoCategorizationEngine()
recurring_detector = RecurringDetector()
