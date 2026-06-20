"""
Viya Tax Report & Financial Report Generator
==============================================
Phase 2: US-601 (Tax Summary), US-609 (Budget Report).
Generates ITR-ready capital gains, advance tax, 80C/80D reports.
"""

from datetime import datetime, timedelta
from typing import Dict, List
from enum import Enum


class FinancialYear(Enum):
    FY_2024_25 = "2024-25"
    FY_2025_26 = "2025-26"
    FY_2026_27 = "2026-27"


# ══════════════════════════════════════════════════
# TAX RATES (FY 2025-26 New Regime)
# ══════════════════════════════════════════════════

NEW_REGIME_SLABS = [
    (0, 400000, 0.00),
    (400001, 800000, 0.05),
    (800001, 1200000, 0.10),
    (1200001, 1600000, 0.15),
    (1600001, 2000000, 0.20),
    (2000001, 2400000, 0.25),
    (2400001, float('inf'), 0.30),
]

OLD_REGIME_SLABS = [
    (0, 250000, 0.00),
    (250001, 500000, 0.05),
    (500001, 1000000, 0.20),
    (1000001, float('inf'), 0.30),
]

STCG_EQUITY_RATE = 0.20        # 20% (post Budget 2024)
LTCG_EQUITY_RATE = 0.125       # 12.5% (post Budget 2024)
LTCG_EQUITY_EXEMPTION = 125000 # Rs 1.25L per year
SURCHARGE_THRESHOLD = 5000000
CESS_RATE = 0.04               # 4% Health & Education Cess


class TaxReportService:
    """Generate ITR-ready tax reports."""

    def generate_full_report(self, user_data: Dict) -> Dict:
        """
        Generate comprehensive tax report.
        user_data keys: income, capital_gains, deductions, advance_tax_paid.
        """
        income = user_data.get('income', {})
        cg = user_data.get('capital_gains', {})
        deductions = user_data.get('deductions', {})
        advance_paid = user_data.get('advance_tax_paid', [])

        # Calculate income components
        salary = income.get('salary', 0)
        interest = income.get('interest', 0)
        rental = income.get('rental', 0)
        other = income.get('other', 0)
        total_income = salary + interest + rental + other

        # Capital gains
        stcg_equity = cg.get('stcg_equity', 0)
        ltcg_equity = cg.get('ltcg_equity', 0)
        stcg_debt = cg.get('stcg_debt', 0)
        ltcg_debt = cg.get('ltcg_debt', 0)
        dividend = cg.get('dividend', 0)

        # LTCG equity exemption
        ltcg_equity_taxable = max(0, ltcg_equity - LTCG_EQUITY_EXEMPTION)

        # Capital gains tax
        stcg_tax = stcg_equity * STCG_EQUITY_RATE
        ltcg_tax = ltcg_equity_taxable * LTCG_EQUITY_RATE

        # Deductions (Old Regime)
        section_80c = min(deductions.get('section_80c', 0), 150000)
        section_80d = min(deductions.get('section_80d', 0), 75000)
        nps_80ccd = min(deductions.get('nps_80ccd', 0), 50000)
        home_loan_24b = min(deductions.get('home_loan_24b', 0), 200000)
        total_deductions = section_80c + section_80d + nps_80ccd + home_loan_24b

        # New regime (no deductions except std deduction 75K)
        new_regime_income = total_income + dividend - 75000
        new_regime_tax = self._calculate_slab_tax(new_regime_income, NEW_REGIME_SLABS)

        # Old regime
        old_regime_income = total_income + dividend - total_deductions
        old_regime_tax = self._calculate_slab_tax(old_regime_income, OLD_REGIME_SLABS)

        # Add CG tax to both
        cg_tax = stcg_tax + ltcg_tax
        new_total = new_regime_tax + cg_tax
        old_total = old_regime_tax + cg_tax

        # Add cess
        new_total_with_cess = new_total * (1 + CESS_RATE)
        old_total_with_cess = old_total * (1 + CESS_RATE)

        recommended = 'new' if new_total_with_cess <= old_total_with_cess else 'old'

        # Advance tax
        total_advance_paid = sum(p.get('amount', 0) for p in advance_paid)
        remaining_tax = (min(new_total_with_cess, old_total_with_cess)
                        - total_advance_paid)

        # 80C utilization breakdown
        _80c = deductions.get('section_80c_breakdown', {})

        return {
            'financial_year': self._current_fy(),
            'income_summary': {
                'salary': salary,
                'interest': interest,
                'rental': rental,
                'dividend': dividend,
                'other': other,
                'total_gross': total_income + dividend,
            },
            'capital_gains': {
                'stcg_equity': stcg_equity,
                'stcg_equity_tax': round(stcg_tax, 2),
                'ltcg_equity': ltcg_equity,
                'ltcg_equity_exempt': min(ltcg_equity, LTCG_EQUITY_EXEMPTION),
                'ltcg_equity_taxable': ltcg_equity_taxable,
                'ltcg_equity_tax': round(ltcg_tax, 2),
                'stcg_debt': stcg_debt,
                'ltcg_debt': ltcg_debt,
                'total_cg_tax': round(cg_tax, 2),
            },
            'deductions': {
                'section_80c': section_80c,
                'section_80c_remaining': max(0, 150000 - section_80c),
                'section_80c_breakdown': _80c,
                'section_80d': section_80d,
                'nps_80ccd': nps_80ccd,
                'home_loan_24b': home_loan_24b,
                'total': total_deductions,
            },
            'tax_comparison': {
                'new_regime': {
                    'taxable_income': round(new_regime_income),
                    'income_tax': round(new_regime_tax),
                    'cg_tax': round(cg_tax),
                    'cess': round(new_total * CESS_RATE),
                    'total': round(new_total_with_cess),
                },
                'old_regime': {
                    'taxable_income': round(old_regime_income),
                    'income_tax': round(old_regime_tax),
                    'cg_tax': round(cg_tax),
                    'cess': round(old_total * CESS_RATE),
                    'total': round(old_total_with_cess),
                },
                'recommended': recommended,
                'savings': round(abs(new_total_with_cess - old_total_with_cess)),
            },
            'advance_tax': {
                'paid': advance_paid,
                'total_paid': total_advance_paid,
                'estimated_total': round(min(new_total_with_cess, old_total_with_cess)),
                'remaining': round(max(0, remaining_tax)),
                'schedule': self._advance_tax_schedule(),
            },
            'insights': self._generate_tax_insights(
                section_80c, ltcg_equity, stcg_equity, remaining_tax, recommended
            ),
        }

    def generate_budget_report(self, transactions: List[Dict],
                                budgets: Dict, month: str = None) -> Dict:
        """US-609: Budget vs actual monthly report."""
        now = datetime.utcnow()
        if not month:
            month = now.strftime('%Y-%m')

        month_txns = [t for t in transactions
                     if t.get('date', '')[:7] == month and t.get('type') == 'expense']

        total_spent = sum(t.get('amount', 0) for t in month_txns)
        total_budget = sum(budgets.values()) if budgets else 0

        # Category breakdown
        categories = {}
        for t in month_txns:
            cat = t.get('category', 'Other')
            if cat not in categories:
                categories[cat] = {'spent': 0, 'count': 0, 'budget': budgets.get(cat, 0)}
            categories[cat]['spent'] += t.get('amount', 0)
            categories[cat]['count'] += 1

        for cat in categories:
            budget = categories[cat]['budget']
            spent = categories[cat]['spent']
            categories[cat]['percentage'] = round((spent / budget * 100) if budget > 0 else 0)
            categories[cat]['remaining'] = max(0, budget - spent)
            categories[cat]['status'] = (
                'over' if spent > budget and budget > 0
                else 'warning' if spent > budget * 0.8 and budget > 0
                else 'good'
            )

        # Sort: over budget first
        sorted_cats = dict(sorted(
            categories.items(),
            key=lambda x: x[1]['percentage'],
            reverse=True,
        ))

        return {
            'month': month,
            'summary': {
                'total_budget': total_budget,
                'total_spent': round(total_spent),
                'remaining': round(max(0, total_budget - total_spent)),
                'percentage': round((total_spent / total_budget * 100) if total_budget > 0 else 0),
                'transaction_count': len(month_txns),
                'over_budget': total_spent > total_budget,
            },
            'categories': sorted_cats,
            'top_expenses': sorted(month_txns, key=lambda t: t.get('amount', 0), reverse=True)[:5],
        }

    # ── Private ──

    def _calculate_slab_tax(self, income: float, slabs: list) -> float:
        if income <= 0:
            return 0
        tax = 0
        for low, high, rate in slabs:
            if income <= 0:
                break
            taxable = min(income, high) - low + 1
            if taxable > 0:
                tax += taxable * rate
            income -= (high - low + 1)
        return max(0, tax)

    def _current_fy(self) -> str:
        now = datetime.utcnow()
        if now.month >= 4:
            return f"{now.year}-{str(now.year + 1)[-2:]}"
        return f"{now.year - 1}-{str(now.year)[-2:]}"

    def _advance_tax_schedule(self) -> List[Dict]:
        now = datetime.utcnow()
        fy_year = now.year if now.month >= 4 else now.year - 1
        return [
            {'quarter': 'Q1', 'due_date': f'{fy_year}-06-15', 'cumulative_pct': 15},
            {'quarter': 'Q2', 'due_date': f'{fy_year}-09-15', 'cumulative_pct': 45},
            {'quarter': 'Q3', 'due_date': f'{fy_year}-12-15', 'cumulative_pct': 75},
            {'quarter': 'Q4', 'due_date': f'{fy_year + 1}-03-15', 'cumulative_pct': 100},
        ]

    def _generate_tax_insights(self, _80c: float, ltcg: float,
                                stcg: float, remaining: float,
                                recommended: str) -> List[str]:
        insights = []
        if _80c < 150000:
            gap = 150000 - _80c
            savings = gap * 0.30
            insights.append(
                f"Invest ₹{gap:,.0f} more in ELSS/PPF by March 31 to save ₹{savings:,.0f} in taxes"
            )
        if ltcg < LTCG_EQUITY_EXEMPTION:
            headroom = LTCG_EQUITY_EXEMPTION - ltcg
            insights.append(f"₹{headroom:,.0f} more LTCG is tax-free this year")
        if remaining > 0:
            insights.append(f"₹{remaining:,.0f} advance tax still due — avoid interest penalty")
        insights.append(f"Recommended regime: {recommended.upper()} (saves more)")
        return insights


# Singleton
tax_report_service = TaxReportService()
