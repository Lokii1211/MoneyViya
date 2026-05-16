"""
Viya Phase 3: Scale Services
==============================
US-701: Tax Optimizer (TDS, advance tax, 80C optimization)
US-702: AI Financial Advisor (personalized recommendations)
US-704: EPF/NPS Integration
US-706: Insurance Portfolio Tracking
US-707: Credit Score Monitoring
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum


# ══════════════════════════════════════════════════
# US-701: TAX OPTIMIZER
# ══════════════════════════════════════════════════

class TaxOptimizer:
    """Advanced tax planning: TDS optimization, 80C strategy, advance tax."""

    def optimize_80c(self, current_investments: Dict, salary: float) -> Dict:
        """Suggest optimal 80C allocation to maximize tax savings."""
        limit = 150000
        utilized = sum(current_investments.values())
        remaining = max(0, limit - utilized)

        suggestions = []
        if remaining <= 0:
            return {'status': 'maxed', 'utilized': utilized, 'limit': limit, 'suggestions': []}

        # Priority order: ELSS > NPS > PPF > LIC
        instruments = [
            {'name': 'ELSS (Equity Linked Savings)', 'max': remaining, 'lock_in': '3 years',
             'return_range': '12-15%', 'risk': 'medium', 'priority': 1,
             'reason': 'Shortest lock-in + highest expected returns'},
            {'name': 'NPS (Section 80CCD)', 'max': min(50000, remaining), 'lock_in': 'Till 60',
             'return_range': '9-12%', 'risk': 'low', 'priority': 2,
             'reason': 'Additional ₹50K deduction under 80CCD(1B)'},
            {'name': 'PPF', 'max': min(150000, remaining), 'lock_in': '15 years',
             'return_range': '7.1%', 'risk': 'zero', 'priority': 3,
             'reason': 'Government guaranteed, EEE status'},
            {'name': 'Sukanya Samriddhi', 'max': min(150000, remaining), 'lock_in': '21 years',
             'return_range': '8.2%', 'risk': 'zero', 'priority': 4,
             'reason': 'Highest government rate, for girl child'},
        ]

        # Allocate optimally
        left = remaining
        for inst in instruments:
            if left <= 0:
                break
            alloc = min(inst['max'], left)
            tax_saved = alloc * 0.30  # Assuming 30% slab
            suggestions.append({
                **inst,
                'suggested_amount': round(alloc),
                'tax_saved': round(tax_saved),
            })
            left -= alloc

        return {
            'status': 'optimizable',
            'utilized': utilized,
            'remaining': remaining,
            'limit': limit,
            'total_tax_saveable': round(remaining * 0.30),
            'suggestions': suggestions,
            'current_breakdown': current_investments,
        }

    def plan_advance_tax(self, estimated_annual_income: float,
                          tds_deducted: float = 0,
                          already_paid: List[Dict] = None) -> Dict:
        """Plan advance tax installments to avoid interest penalty."""
        already_paid = already_paid or []

        # Estimate tax (simplified new regime)
        taxable = estimated_annual_income - 75000  # Std deduction
        if taxable <= 400000:
            tax = 0
        elif taxable <= 800000:
            tax = (taxable - 400000) * 0.05
        elif taxable <= 1200000:
            tax = 20000 + (taxable - 800000) * 0.10
        elif taxable <= 1600000:
            tax = 60000 + (taxable - 1200000) * 0.15
        elif taxable <= 2000000:
            tax = 120000 + (taxable - 1600000) * 0.20
        elif taxable <= 2400000:
            tax = 200000 + (taxable - 2000000) * 0.25
        else:
            tax = 300000 + (taxable - 2400000) * 0.30

        tax_with_cess = tax * 1.04
        net_tax = max(0, tax_with_cess - tds_deducted)
        total_paid = sum(p.get('amount', 0) for p in already_paid)
        remaining = max(0, net_tax - total_paid)

        now = datetime.utcnow()
        fy_year = now.year if now.month >= 4 else now.year - 1
        schedule = [
            {'quarter': 'Q1', 'due': f'{fy_year}-06-15', 'cum_pct': 15, 'amount': round(net_tax * 0.15)},
            {'quarter': 'Q2', 'due': f'{fy_year}-09-15', 'cum_pct': 45, 'amount': round(net_tax * 0.30)},
            {'quarter': 'Q3', 'due': f'{fy_year}-12-15', 'cum_pct': 75, 'amount': round(net_tax * 0.30)},
            {'quarter': 'Q4', 'due': f'{fy_year + 1}-03-15', 'cum_pct': 100, 'amount': round(net_tax * 0.25)},
        ]

        # Find next due
        next_due = None
        for s in schedule:
            if s['due'] > now.strftime('%Y-%m-%d'):
                next_due = s
                break

        return {
            'estimated_income': round(estimated_annual_income),
            'estimated_tax': round(tax_with_cess),
            'tds_deducted': round(tds_deducted),
            'net_tax_payable': round(net_tax),
            'already_paid': round(total_paid),
            'remaining': round(remaining),
            'schedule': schedule,
            'next_due': next_due,
            'interest_risk': remaining > 10000,
        }


# ══════════════════════════════════════════════════
# US-702: AI FINANCIAL ADVISOR
# ══════════════════════════════════════════════════

class FinancialAdvisor:
    """Personalized investment recommendations based on user profile."""

    def generate_plan(self, profile: Dict) -> Dict:
        """
        Generate investment plan based on age, income, goals, risk tolerance.
        profile: {age, monthly_income, monthly_expenses, risk_tolerance, goals}
        """
        age = profile.get('age', 30)
        income = profile.get('monthly_income', 50000)
        expenses = profile.get('monthly_expenses', 30000)
        risk = profile.get('risk_tolerance', 'moderate')  # conservative/moderate/aggressive
        goals = profile.get('goals', [])
        existing = profile.get('existing_investments', {})

        savings = income - expenses
        savings_rate = round(savings / max(income, 1) * 100)

        # Asset allocation by age + risk
        allocation = self._get_allocation(age, risk)

        # Emergency fund check
        emergency_target = expenses * 6
        emergency_current = existing.get('emergency_fund', 0)

        # Recommendations
        recs = []

        # Emergency fund first
        if emergency_current < emergency_target:
            gap = emergency_target - emergency_current
            recs.append({
                'priority': 1,
                'action': 'Build Emergency Fund',
                'amount': round(gap),
                'where': 'Liquid Fund or Savings Account',
                'why': f'Need {expenses * 6:,.0f} (6 months expenses). Currently {emergency_current:,.0f}.',
                'timeline': f'{math.ceil(gap / max(savings * 0.5, 1))} months',
            })

        # Term insurance (if not covered)
        if not existing.get('term_insurance') and age < 45:
            cover = income * 12 * 15  # 15x annual income
            recs.append({
                'priority': 2,
                'action': 'Get Term Insurance',
                'amount': round(cover),
                'where': f'₹{cover / 10000000:.0f} Cr term plan (HDFC/ICICI/Max)',
                'why': 'Cover family for 15x annual income. Cost: ~₹800/month for ₹1Cr.',
                'timeline': 'Immediately',
            })

        # Health insurance
        if not existing.get('health_insurance'):
            recs.append({
                'priority': 3,
                'action': 'Get Health Insurance',
                'amount': 1000000,
                'where': '₹10L family floater (Star Health/Care/Niva)',
                'why': 'Medical inflation is 14%. One hospitalization can wipe savings.',
                'timeline': 'Within 1 week',
            })

        # Investment allocation
        investable = max(0, savings - (gap if emergency_current < emergency_target else 0))
        if investable > 0:
            for asset, pct in allocation.items():
                amount = round(investable * pct / 100)
                if amount < 500:
                    continue
                instrument = self._get_instrument(asset, risk)
                recs.append({
                    'priority': 4,
                    'action': f'Invest in {asset.title()}',
                    'amount': amount,
                    'where': instrument,
                    'why': f'{pct}% allocation per your {risk} risk profile.',
                    'timeline': 'Start SIP this month',
                })

        return {
            'profile_summary': {
                'age': age,
                'income': income,
                'expenses': expenses,
                'savings': savings,
                'savings_rate': savings_rate,
                'risk_tolerance': risk,
            },
            'target_allocation': allocation,
            'emergency_fund': {
                'target': round(emergency_target),
                'current': round(emergency_current),
                'gap': round(max(0, emergency_target - emergency_current)),
                'status': 'adequate' if emergency_current >= emergency_target else 'insufficient',
            },
            'recommendations': recs,
            'monthly_investment_plan': {
                'total_investable': round(investable),
                'allocation': {
                    asset: round(investable * pct / 100)
                    for asset, pct in allocation.items()
                    if investable * pct / 100 >= 500
                },
            },
            'wealth_projection': self._project_wealth(investable, allocation, 10),
        }

    def _get_allocation(self, age: int, risk: str) -> Dict:
        if risk == 'aggressive':
            equity = min(90, 110 - age)
            return {'equity': equity, 'debt': 100 - equity - 5, 'gold': 5}
        elif risk == 'conservative':
            equity = max(20, 70 - age)
            debt = 100 - equity - 10
            return {'equity': equity, 'debt': debt, 'gold': 10}
        else:  # moderate
            equity = max(30, 90 - age)
            return {'equity': equity, 'debt': 100 - equity - 8, 'gold': 8}

    def _get_instrument(self, asset: str, risk: str) -> str:
        instruments = {
            'equity': {
                'aggressive': 'Smallcap + Midcap MFs (SBI Small Cap, HDFC Mid-Cap)',
                'moderate': 'Flexi Cap + Large Cap (Parag Parikh, Axis Bluechip)',
                'conservative': 'Nifty 50 Index Fund (UTI Nifty 50)',
            },
            'debt': {
                'aggressive': 'Corporate Bond Fund (ICICI Corporate Bond)',
                'moderate': 'Short Duration Fund (HDFC Short Term)',
                'conservative': 'PPF + RBI Bonds (7.1-8% guaranteed)',
            },
            'gold': {
                'aggressive': 'Gold ETF (Nippon Gold BeES)',
                'moderate': 'Sovereign Gold Bond (2.5% + gold appreciation)',
                'conservative': 'Sovereign Gold Bond',
            },
        }
        return instruments.get(asset, {}).get(risk, 'Diversified MF')

    def _project_wealth(self, monthly: float, allocation: dict, years: int) -> Dict:
        returns = {'equity': 0.12, 'debt': 0.07, 'gold': 0.09}
        total_fv = 0
        total_invested = monthly * years * 12

        for asset, pct in allocation.items():
            sip = monthly * pct / 100
            r = returns.get(asset, 0.08) / 12
            months = years * 12
            fv = 0
            for _ in range(months):
                fv = (fv + sip) * (1 + r)
            total_fv += fv

        return {
            'years': years,
            'monthly_investment': round(monthly),
            'total_invested': round(total_invested),
            'projected_value': round(total_fv),
            'wealth_gain': round(total_fv - total_invested),
            'multiplier': round(total_fv / max(total_invested, 1), 2),
        }


# ══════════════════════════════════════════════════
# US-706: INSURANCE PORTFOLIO
# ══════════════════════════════════════════════════

class InsuranceTracker:
    """Track all insurance policies — life, health, motor, property."""

    def __init__(self):
        self.policies = {}  # user -> [policy]

    def add_policy(self, user_phone: str, policy: Dict) -> Dict:
        if user_phone not in self.policies:
            self.policies[user_phone] = []
        policy['added_at'] = datetime.utcnow().isoformat()
        self.policies[user_phone].append(policy)
        return {'status': 'added', 'policy_name': policy.get('name', '')}

    def get_portfolio(self, user_phone: str) -> Dict:
        policies = self.policies.get(user_phone, [])
        total_premium = sum(p.get('annual_premium', 0) for p in policies)
        total_cover = sum(p.get('sum_insured', 0) for p in policies)

        # Check gaps
        gaps = []
        types = [p.get('type', '') for p in policies]
        if 'term_life' not in types:
            gaps.append({'type': 'term_life', 'message': 'No term life insurance — critical gap'})
        if 'health' not in types:
            gaps.append({'type': 'health', 'message': 'No health insurance — high risk'})

        # Upcoming renewals (next 60 days)
        now = datetime.utcnow()
        renewals = []
        for p in policies:
            exp = p.get('expiry_date', '')
            if exp:
                try:
                    exp_dt = datetime.fromisoformat(exp.replace('Z', '+00:00'))
                    days_left = (exp_dt - now).days
                    if 0 < days_left <= 60:
                        renewals.append({
                            'name': p.get('name', ''),
                            'expiry': exp,
                            'days_left': days_left,
                            'premium': p.get('annual_premium', 0),
                        })
                except (ValueError, TypeError):
                    pass

        return {
            'policies': policies,
            'total_annual_premium': round(total_premium),
            'total_coverage': round(total_cover),
            'policy_count': len(policies),
            'gaps': gaps,
            'upcoming_renewals': renewals,
        }


# ══════════════════════════════════════════════════
# US-707: CREDIT SCORE MONITORING
# ══════════════════════════════════════════════════

class CreditScoreService:
    """Credit score tracking and improvement suggestions."""

    def get_score_report(self, score: int, history: List[Dict] = None) -> Dict:
        history = history or []

        # Rating
        if score >= 750:
            rating = 'Excellent'
            emoji = '🟢'
            message = 'You qualify for the best loan rates and credit cards.'
        elif score >= 700:
            rating = 'Good'
            emoji = '🟡'
            message = 'Most lenders will approve you. Room for improvement.'
        elif score >= 650:
            rating = 'Fair'
            emoji = '🟠'
            message = 'You may face higher interest rates. Work on improvement.'
        else:
            rating = 'Poor'
            emoji = '🔴'
            message = 'Loan approval will be difficult. Focus on rebuilding.'

        # Improvement tips
        tips = []
        if score < 750:
            tips = [
                'Pay all EMIs and credit card bills on time',
                'Keep credit utilization below 30%',
                'Avoid multiple loan applications in short period',
                'Maintain a healthy mix of credit types',
                'Check credit report for errors and dispute them',
                'Keep old credit cards active (increases average age)',
            ]

        # Score breakdown
        factors = {
            'Payment History': {'weight': 35, 'status': 'good' if score >= 700 else 'needs_work'},
            'Credit Utilization': {'weight': 30, 'status': 'good' if score >= 700 else 'needs_work'},
            'Credit Age': {'weight': 15, 'status': 'good' if score >= 650 else 'needs_work'},
            'Credit Mix': {'weight': 10, 'status': 'good'},
            'Hard Inquiries': {'weight': 10, 'status': 'good'},
        }

        return {
            'score': score,
            'rating': rating,
            'emoji': emoji,
            'message': message,
            'factors': factors,
            'improvement_tips': tips,
            'history': history,
            'next_check': (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d'),
        }


# Singletons
tax_optimizer = TaxOptimizer()
financial_advisor = FinancialAdvisor()
insurance_tracker = InsuranceTracker()
credit_score_service = CreditScoreService()
