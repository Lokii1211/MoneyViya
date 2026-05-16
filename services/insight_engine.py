"""
Viya AI Financial Insights Engine
====================================
Phase 2: Proactive financial intelligence.
10 insight types — budget alerts, anomalies, subscriptions, goals, tax.
Tier 1: Rule-based (free), Tier 2: AI-enhanced (premium).
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import statistics


class InsightType(Enum):
    BUDGET_ALERT = "budget_alert"
    RECURRING_DETECTED = "recurring_detected"
    UNUSUAL_TRANSACTION = "unusual_transaction"
    INVESTMENT_REBALANCE = "investment_rebalance"
    TAX_SAVING = "tax_saving"
    SIP_REVIEW = "sip_review"
    SUBSCRIPTION_WASTE = "subscription_waste"
    GOAL_AT_RISK = "goal_at_risk"
    CREDIT_CARD_BILL = "credit_card_bill"
    DUPLICATE_DETECTED = "duplicate_detected"
    SAVINGS_MILESTONE = "savings_milestone"
    SPENDING_TREND = "spending_trend"


class InsightPriority(Enum):
    CRITICAL = "critical"    # Immediate action needed
    HIGH = "high"           # Important, act within 24h
    MEDIUM = "medium"       # Informational, act this week
    LOW = "low"             # FYI, nice to know


class InsightEngine:
    """
    Rule-based financial insight generator.
    Analyzes transactions, budgets, goals, portfolio.
    """

    def __init__(self):
        self.generated = {}  # user_phone -> [insight]

    def generate_all(self, user_phone: str, data: Dict) -> List[Dict]:
        """
        Run all insight generators against user data.
        data keys: transactions, budgets, goals, portfolio, subscriptions.
        """
        insights = []
        txns = data.get('transactions', [])
        budgets = data.get('budgets', {})
        goals = data.get('goals', [])
        portfolio = data.get('portfolio', {})

        insights.extend(self._budget_alerts(txns, budgets))
        insights.extend(self._unusual_transactions(txns))
        insights.extend(self._spending_trends(txns))
        insights.extend(self._savings_milestones(txns))
        insights.extend(self._goal_tracking(goals, txns))
        insights.extend(self._subscription_waste(data.get('subscriptions', [])))
        insights.extend(self._duplicate_detection(txns))
        insights.extend(self._tax_opportunities(portfolio))
        insights.extend(self._rebalancing_alerts(portfolio))
        insights.extend(self._credit_card_alerts(txns))

        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        insights.sort(key=lambda x: priority_order.get(x['priority'], 3))

        self.generated[user_phone] = insights
        return insights

    # ── Type 1: Budget Alerts ──

    def _budget_alerts(self, txns: list, budgets: dict) -> List[Dict]:
        insights = []
        if not budgets:
            return insights

        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        days_left = (month_start.replace(month=month_start.month % 12 + 1 if month_start.month < 12 else 1,
                                          year=month_start.year + (1 if month_start.month == 12 else 0)) - now).days
        days_elapsed = now.day

        month_txns = [t for t in txns if t.get('type') == 'expense' and
                      t.get('date', '')[:7] == now.strftime('%Y-%m')]

        for category, budget_amount in budgets.items():
            cat_spent = sum(t.get('amount', 0) for t in month_txns
                          if (t.get('category', '') or '').lower() == category.lower())
            pct = (cat_spent / budget_amount * 100) if budget_amount > 0 else 0

            if pct >= 100:
                daily_rate = cat_spent / max(days_elapsed, 1)
                projected = cat_spent + (daily_rate * days_left)
                insights.append(self._make_insight(
                    InsightType.BUDGET_ALERT, InsightPriority.CRITICAL,
                    f"🚨 {category} budget exceeded!",
                    f"You've spent ₹{cat_spent:,.0f} of ₹{budget_amount:,.0f} ({pct:.0f}%). "
                    f"At this pace, you'll overspend by ₹{projected - budget_amount:,.0f} this month.",
                    actions=["Adjust Budget", "See Transactions", "I'll be careful"],
                    metadata={'category': category, 'spent': cat_spent, 'budget': budget_amount},
                ))
            elif pct >= 80:
                insights.append(self._make_insight(
                    InsightType.BUDGET_ALERT, InsightPriority.HIGH,
                    f"⚠️ {category} budget at {pct:.0f}%",
                    f"You've spent ₹{cat_spent:,.0f} of ₹{budget_amount:,.0f}. "
                    f"{days_left} days left in the month.",
                    actions=["View Transactions", "Adjust Budget"],
                    metadata={'category': category, 'spent': cat_spent, 'budget': budget_amount},
                ))

        return insights

    # ── Type 2: Unusual Transactions ──

    def _unusual_transactions(self, txns: list) -> List[Dict]:
        insights = []
        expenses = [t for t in txns if t.get('type') == 'expense' and t.get('amount', 0) > 0]
        if len(expenses) < 10:
            return insights

        amounts = [t['amount'] for t in expenses]
        avg_daily = statistics.mean(amounts)
        std_dev = statistics.stdev(amounts) if len(amounts) > 1 else avg_daily

        threshold = avg_daily + (2 * std_dev)

        recent = expenses[-5:]  # Last 5 transactions
        for t in recent:
            if t['amount'] > threshold:
                multiplier = t['amount'] / avg_daily
                insights.append(self._make_insight(
                    InsightType.UNUSUAL_TRANSACTION, InsightPriority.MEDIUM,
                    f"💸 Large transaction: ₹{t['amount']:,.0f}",
                    f"To {t.get('description', t.get('merchant_normalized', 'Unknown'))}. "
                    f"That's {multiplier:.1f}× your average spend.",
                    actions=["Yes, it's planned", "Flag for review"],
                    metadata={'amount': t['amount'], 'merchant': t.get('merchant_normalized', '')},
                ))

        return insights

    # ── Type 3: Spending Trends ──

    def _spending_trends(self, txns: list) -> List[Dict]:
        insights = []
        now = datetime.utcnow()

        this_month = sum(t.get('amount', 0) for t in txns
                        if t.get('type') == 'expense' and t.get('date', '')[:7] == now.strftime('%Y-%m'))
        last_month_str = (now.replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
        last_month = sum(t.get('amount', 0) for t in txns
                        if t.get('type') == 'expense' and t.get('date', '')[:7] == last_month_str)

        if last_month > 0 and this_month > 0:
            change = ((this_month - last_month) / last_month) * 100
            if change > 20:
                insights.append(self._make_insight(
                    InsightType.SPENDING_TREND, InsightPriority.MEDIUM,
                    f"📊 Spending up {change:.0f}% vs last month",
                    f"This month: ₹{this_month:,.0f} vs last month: ₹{last_month:,.0f}.",
                    actions=["See breakdown", "Set budget"],
                ))
            elif change < -20:
                insights.append(self._make_insight(
                    InsightType.SPENDING_TREND, InsightPriority.LOW,
                    f"🎉 Spending down {abs(change):.0f}% — great job!",
                    f"This month: ₹{this_month:,.0f} vs last month: ₹{last_month:,.0f}.",
                ))

        return insights

    # ── Type 4: Savings Milestones ──

    def _savings_milestones(self, txns: list) -> List[Dict]:
        insights = []
        now = datetime.utcnow()

        income = sum(t.get('amount', 0) for t in txns
                    if t.get('type') == 'income' and t.get('date', '')[:7] == now.strftime('%Y-%m'))
        expenses = sum(t.get('amount', 0) for t in txns
                      if t.get('type') == 'expense' and t.get('date', '')[:7] == now.strftime('%Y-%m'))

        if income > 0:
            savings_rate = ((income - expenses) / income) * 100
            if savings_rate >= 50:
                insights.append(self._make_insight(
                    InsightType.SAVINGS_MILESTONE, InsightPriority.LOW,
                    f"🏆 Incredible! {savings_rate:.0f}% savings rate",
                    f"Saved ₹{income - expenses:,.0f} this month. You're in the top 5% of savers!",
                ))
            elif savings_rate >= 30:
                insights.append(self._make_insight(
                    InsightType.SAVINGS_MILESTONE, InsightPriority.LOW,
                    f"💪 Solid {savings_rate:.0f}% savings rate",
                    f"Saved ₹{income - expenses:,.0f} this month. Keep it up!",
                ))

        return insights

    # ── Type 5: Goal Tracking ──

    def _goal_tracking(self, goals: list, txns: list) -> List[Dict]:
        insights = []
        now = datetime.utcnow()

        for goal in goals:
            target = goal.get('target_amount', 0)
            current = goal.get('current_amount', 0)
            deadline_str = goal.get('deadline', '')

            if not target or not deadline_str:
                continue

            try:
                deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                continue

            days_left = (deadline - now).days
            remaining = target - current
            pct = (current / target * 100) if target > 0 else 0

            if days_left > 0 and remaining > 0:
                monthly_needed = remaining / max(days_left / 30, 1)
                if pct < 50 and days_left < 180:
                    insights.append(self._make_insight(
                        InsightType.GOAL_AT_RISK, InsightPriority.HIGH,
                        f"⚠️ {goal.get('name', 'Goal')} is behind schedule",
                        f"₹{current:,.0f} of ₹{target:,.0f} ({pct:.0f}%). "
                        f"Need ₹{monthly_needed:,.0f}/month for {days_left} days.",
                        actions=["Save more now", "Adjust timeline"],
                    ))

        return insights

    # ── Type 6: Subscription Waste ──

    def _subscription_waste(self, subscriptions: list) -> List[Dict]:
        insights = []
        for sub in subscriptions:
            if sub.get('usage_detected') is False and sub.get('amount', 0) > 0:
                yearly = sub['amount'] * 12
                insights.append(self._make_insight(
                    InsightType.SUBSCRIPTION_WASTE, InsightPriority.MEDIUM,
                    f"🔄 Unused subscription: {sub.get('name', 'Unknown')}",
                    f"Paying ₹{sub['amount']:,.0f}/month but no usage detected. "
                    f"Cancel to save ₹{yearly:,.0f}/year.",
                    actions=["Still using it", f"Cancel and save ₹{yearly:,.0f}/year"],
                ))
        return insights

    # ── Type 7: Duplicate Detection ──

    def _duplicate_detection(self, txns: list) -> List[Dict]:
        insights = []
        recent = txns[-20:]  # Last 20 transactions

        for i, t1 in enumerate(recent):
            for t2 in recent[i+1:]:
                if (t1.get('amount') == t2.get('amount') and
                    t1.get('amount', 0) > 0 and
                    t1.get('date', '')[:10] == t2.get('date', '')[:10] and
                    t1.get('merchant_normalized', '') == t2.get('merchant_normalized', '') and
                    t1.get('merchant_normalized', '')):
                    insights.append(self._make_insight(
                        InsightType.DUPLICATE_DETECTED, InsightPriority.HIGH,
                        f"🔁 Possible duplicate: ₹{t1['amount']:,.0f}",
                        f"Two charges of ₹{t1['amount']:,.0f} to {t1['merchant_normalized']} "
                        f"on the same day.",
                        actions=["Yes, it's a duplicate", "Both are valid"],
                    ))
                    break  # One alert per pair

        return insights

    # ── Type 8: Tax Opportunities ──

    def _tax_opportunities(self, portfolio: dict) -> List[Dict]:
        insights = []
        holdings = portfolio.get('holdings', [])

        # Check LTCG approaching exemption
        total_ltcg = sum(h.get('unrealized_pnl', 0) for h in holdings
                        if h.get('holding_period_days', 0) > 365)

        if 100000 <= total_ltcg <= 125000:
            insights.append(self._make_insight(
                InsightType.TAX_SAVING, InsightPriority.MEDIUM,
                f"💡 LTCG at ₹{total_ltcg:,.0f} — almost at ₹1.25L limit",
                f"₹{125000 - total_ltcg:,.0f} more of LTCG gains are tax-free this year. "
                f"Consider booking profits before the limit.",
                actions=["Show tax-free harvesting plan"],
            ))

        # 80C reminder (Jan-March)
        now = datetime.utcnow()
        if now.month in (1, 2, 3):
            section_80c = portfolio.get('section_80c_utilized', 0)
            remaining = 150000 - section_80c
            if remaining > 0:
                insights.append(self._make_insight(
                    InsightType.TAX_SAVING, InsightPriority.HIGH,
                    f"📋 ₹{remaining:,.0f} left in 80C limit",
                    f"Invest in ELSS, PPF, or NPS before March 31 to save up to ₹{remaining * 0.30:,.0f} in taxes.",
                    actions=["Open ELSS calculator", "Invest in PPF"],
                ))

        return insights

    # ── Type 9: Rebalancing ──

    def _rebalancing_alerts(self, portfolio: dict) -> List[Dict]:
        insights = []
        allocation = portfolio.get('asset_allocation', {})
        targets = portfolio.get('target_allocation', {})

        if not allocation or not targets:
            return insights

        for asset_class, target_pct in targets.items():
            actual_pct = allocation.get(asset_class, {}).get('percentage', 0)
            drift = abs(actual_pct - target_pct)

            if drift > 10:
                direction = "overweight" if actual_pct > target_pct else "underweight"
                insights.append(self._make_insight(
                    InsightType.INVESTMENT_REBALANCE, InsightPriority.MEDIUM,
                    f"⚖️ {asset_class.title()} is {direction} ({actual_pct:.0f}% vs {target_pct:.0f}% target)",
                    f"Portfolio has drifted {drift:.0f}% from target. Consider rebalancing.",
                    actions=["Show rebalancing plan", "Remind me in 1 week"],
                ))

        return insights

    # ── Type 10: Credit Card Bill ──

    def _credit_card_alerts(self, txns: list) -> List[Dict]:
        insights = []
        cc_txns = [t for t in txns if t.get('payment_method') in ('credit_card', 'card')
                   and t.get('type') == 'expense']

        if not cc_txns:
            return insights

        now = datetime.utcnow()
        month_cc = sum(t.get('amount', 0) for t in cc_txns
                      if t.get('date', '')[:7] == now.strftime('%Y-%m'))

        if month_cc > 0:
            insights.append(self._make_insight(
                InsightType.CREDIT_CARD_BILL, InsightPriority.MEDIUM,
                f"💳 Credit card spend this month: ₹{month_cc:,.0f}",
                f"Pay in full to avoid interest charges (~3.5%/month = ₹{month_cc * 0.035:,.0f}).",
                actions=["Set reminder", "View CC transactions"],
            ))

        return insights

    # ── Helper ──

    def _make_insight(self, insight_type: InsightType, priority: InsightPriority,
                      title: str, message: str, actions: list = None,
                      metadata: dict = None) -> Dict:
        return {
            'type': insight_type.value,
            'priority': priority.value,
            'title': title,
            'message': message,
            'actions': actions or [],
            'metadata': metadata or {},
            'created_at': datetime.utcnow().isoformat(),
            'is_read': False,
        }

    def get_user_insights(self, user_phone: str) -> List[Dict]:
        return self.generated.get(user_phone, [])


# Singleton
insight_engine = InsightEngine()
