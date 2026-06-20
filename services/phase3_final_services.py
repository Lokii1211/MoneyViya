"""
Viya Phase 3 Final: Remaining Scale Services
===============================================
US-703: Family Finance Mode (shared dashboards)
US-704: EPF/NPS Integration
US-708: International Investments (US stocks, crypto)
"""

from datetime import datetime
from typing import Dict, List, Optional


# ══════════════════════════════════════════════════
# US-703: FAMILY FINANCE DASHBOARDS
# ══════════════════════════════════════════════════

class FamilyDashboard:
    """Shared family dashboards with privacy controls."""

    def __init__(self):
        self.dashboards = {}  # dashboard_id -> config

    def create_dashboard(self, family_id: str, name: str,
                          members: List[str], privacy: Dict = None) -> Dict:
        did = f"dash_{family_id}_{name.lower().replace(' ', '_')}"
        config = {
            'id': did,
            'family_id': family_id,
            'name': name,
            'members': members,
            'privacy': privacy or {
                'show_individual_amounts': True,
                'show_transaction_details': False,
                'show_salary': False,
                'show_investments': True,
            },
            'widgets': [
                {'type': 'total_income', 'title': 'Family Income', 'visible': True},
                {'type': 'total_expenses', 'title': 'Family Expenses', 'visible': True},
                {'type': 'savings_rate', 'title': 'Savings Rate', 'visible': True},
                {'type': 'budget_overview', 'title': 'Budget Status', 'visible': True},
                {'type': 'goal_progress', 'title': 'Family Goals', 'visible': True},
                {'type': 'member_breakdown', 'title': 'By Member', 'visible': True},
            ],
            'created_at': datetime.utcnow().isoformat(),
        }
        self.dashboards[did] = config
        return config

    def get_dashboard_data(self, dashboard_id: str,
                            member_data: Dict[str, Dict]) -> Dict:
        """Aggregate data for family dashboard with privacy controls."""
        config = self.dashboards.get(dashboard_id)
        if not config:
            return {'error': 'Dashboard not found'}

        privacy = config['privacy']
        total_income = 0
        total_expenses = 0
        members = []

        for phone in config['members']:
            data = member_data.get(phone, {})
            income = data.get('income', 0)
            expenses = data.get('expenses', 0)
            total_income += income
            total_expenses += expenses

            member_view = {
                'name': data.get('name', phone[-4:]),
                'expenses': expenses if privacy['show_individual_amounts'] else None,
                'savings_rate': round((income - expenses) / max(income, 1) * 100) if income > 0 else 0,
            }
            if privacy['show_salary']:
                member_view['income'] = income
            if privacy['show_investments']:
                member_view['investments'] = data.get('investments', 0)

            members.append(member_view)

        savings = total_income - total_expenses
        return {
            'dashboard': config['name'],
            'total_income': total_income if privacy['show_salary'] else None,
            'total_expenses': total_expenses,
            'total_savings': savings,
            'savings_rate': round(savings / max(total_income, 1) * 100, 1),
            'members': members,
            'goals': member_data.get('_goals', []),
        }


# ══════════════════════════════════════════════════
# US-704: EPF / NPS INTEGRATION
# ══════════════════════════════════════════════════

class RetirementTracker:
    """Track EPF, NPS, PPF for retirement planning."""

    EPF_INTEREST_RATE = 8.25   # FY 2024-25
    PPF_INTEREST_RATE = 7.1    # Current
    NPS_EXPECTED = {
        'aggressive': 12.0,
        'moderate': 10.0,
        'conservative': 8.0,
    }

    def calculate_epf_corpus(self, basic_salary: float, current_balance: float,
                              current_age: int, retirement_age: int = 60) -> Dict:
        """Project EPF corpus at retirement."""
        years = retirement_age - current_age
        if years <= 0:
            return {'error': 'Already at or past retirement age'}

        monthly_contribution = basic_salary * 0.24  # Employee 12% + Employer 12%
        employee_share = basic_salary * 0.12
        employer_eps = min(basic_salary, 15000) * 0.0833  # EPS capped at 15K
        employer_epf = basic_salary * 0.12 - employer_eps  # Rest to EPF

        monthly_rate = self.EPF_INTEREST_RATE / 100 / 12
        balance = current_balance
        yearly = []

        for y in range(1, years + 1):
            for _ in range(12):
                balance = (balance + monthly_contribution) * (1 + monthly_rate)
            yearly.append({
                'year': y,
                'age': current_age + y,
                'balance': round(balance),
            })

        return {
            'current_balance': round(current_balance),
            'monthly_contribution': round(monthly_contribution),
            'employee_share': round(employee_share),
            'employer_epf': round(employer_epf),
            'employer_eps': round(employer_eps),
            'interest_rate': self.EPF_INTEREST_RATE,
            'years_to_retirement': years,
            'projected_corpus': round(balance),
            'total_contribution': round(monthly_contribution * 12 * years),
            'interest_earned': round(balance - current_balance - monthly_contribution * 12 * years),
            'monthly_pension_estimate': round(balance * 0.004),  # ~4.8% annual withdrawal
            'yearly_projection': yearly[-5:] if len(yearly) > 5 else yearly,  # Last 5 years
        }

    def calculate_nps_corpus(self, monthly_sip: float, current_balance: float,
                              current_age: int, risk: str = 'moderate',
                              retirement_age: int = 60) -> Dict:
        """Project NPS corpus and annuity at retirement."""
        years = retirement_age - current_age
        if years <= 0:
            return {'error': 'Already at or past retirement age'}

        rate = self.NPS_EXPECTED.get(risk, 10.0)
        monthly_rate = rate / 100 / 12
        balance = current_balance

        for _ in range(years * 12):
            balance = (balance + monthly_sip) * (1 + monthly_rate)

        # NPS rules: 60% lump sum tax-free, 40% annuity mandatory
        lump_sum = balance * 0.60
        annuity_corpus = balance * 0.40
        monthly_annuity = annuity_corpus * 0.06 / 12  # ~6% annuity rate

        # Tax benefit: 80CCD(1B) additional 50K
        tax_benefit_annual = min(monthly_sip * 12, 50000) * 0.30

        return {
            'current_balance': round(current_balance),
            'monthly_sip': round(monthly_sip),
            'expected_return': rate,
            'risk_profile': risk,
            'years_to_retirement': years,
            'projected_corpus': round(balance),
            'lump_sum_60pct': round(lump_sum),
            'annuity_corpus_40pct': round(annuity_corpus),
            'estimated_monthly_pension': round(monthly_annuity),
            'annual_tax_benefit': round(tax_benefit_annual),
            'total_tax_saved': round(tax_benefit_annual * years),
        }


# ══════════════════════════════════════════════════
# US-708: INTERNATIONAL INVESTMENTS
# ══════════════════════════════════════════════════

class InternationalInvestments:
    """Track US stocks, crypto, and international MFs."""

    EXCHANGE_RATES = {
        'USD': 83.50,
        'EUR': 91.20,
        'GBP': 106.30,
        'SGD': 62.80,
    }

    POPULAR_US_STOCKS = {
        'AAPL': {'name': 'Apple Inc', 'price_usd': 198.50, 'sector': 'Technology'},
        'MSFT': {'name': 'Microsoft', 'price_usd': 430.20, 'sector': 'Technology'},
        'GOOGL': {'name': 'Alphabet', 'price_usd': 178.30, 'sector': 'Technology'},
        'AMZN': {'name': 'Amazon', 'price_usd': 186.40, 'sector': 'E-commerce'},
        'TSLA': {'name': 'Tesla', 'price_usd': 177.90, 'sector': 'Automotive'},
        'NVDA': {'name': 'Nvidia', 'price_usd': 135.40, 'sector': 'Semiconductors'},
        'META': {'name': 'Meta Platforms', 'price_usd': 507.30, 'sector': 'Technology'},
        'VOO': {'name': 'Vanguard S&P 500 ETF', 'price_usd': 530.10, 'sector': 'Index ETF'},
        'QQQ': {'name': 'Nasdaq 100 ETF', 'price_usd': 505.80, 'sector': 'Index ETF'},
        'VTI': {'name': 'Vanguard Total Market', 'price_usd': 280.60, 'sector': 'Index ETF'},
    }

    CRYPTO_DB = {
        'BTC': {'name': 'Bitcoin', 'price_usd': 103500},
        'ETH': {'name': 'Ethereum', 'price_usd': 2480},
        'SOL': {'name': 'Solana', 'price_usd': 172},
        'BNB': {'name': 'BNB', 'price_usd': 650},
        'XRP': {'name': 'Ripple', 'price_usd': 2.42},
    }

    def convert_to_inr(self, amount: float, currency: str = 'USD') -> Dict:
        rate = self.EXCHANGE_RATES.get(currency.upper(), 83.50)
        return {
            'amount': amount,
            'currency': currency.upper(),
            'rate': rate,
            'inr_value': round(amount * rate, 2),
        }

    def track_us_holdings(self, holdings: List[Dict]) -> Dict:
        """
        Track US stock holdings with INR conversion.
        holdings: [{ticker, quantity, avg_price_usd}]
        """
        usd_rate = self.EXCHANGE_RATES['USD']
        results = []
        total_invested_usd = 0
        total_current_usd = 0

        for h in holdings:
            ticker = h.get('ticker', '').upper()
            qty = h.get('quantity', 0)
            avg_price = h.get('avg_price_usd', 0)

            stock = self.POPULAR_US_STOCKS.get(ticker, {})
            current_price = stock.get('price_usd', avg_price)

            invested_usd = qty * avg_price
            current_usd = qty * current_price
            pnl_usd = current_usd - invested_usd
            pnl_pct = (pnl_usd / max(invested_usd, 0.01)) * 100

            total_invested_usd += invested_usd
            total_current_usd += current_usd

            results.append({
                'ticker': ticker,
                'name': stock.get('name', ticker),
                'quantity': qty,
                'avg_price_usd': avg_price,
                'current_price_usd': current_price,
                'pnl_usd': round(pnl_usd, 2),
                'pnl_pct': round(pnl_pct, 2),
                'current_value_inr': round(current_usd * usd_rate),
                'pnl_inr': round(pnl_usd * usd_rate),
            })

        total_pnl_usd = total_current_usd - total_invested_usd
        return {
            'holdings': results,
            'summary': {
                'total_invested_usd': round(total_invested_usd, 2),
                'total_current_usd': round(total_current_usd, 2),
                'total_pnl_usd': round(total_pnl_usd, 2),
                'total_pnl_pct': round(total_pnl_usd / max(total_invested_usd, 0.01) * 100, 2),
                'total_invested_inr': round(total_invested_usd * usd_rate),
                'total_current_inr': round(total_current_usd * usd_rate),
                'total_pnl_inr': round(total_pnl_usd * usd_rate),
                'exchange_rate': usd_rate,
            },
            'tax_note': 'US stocks: LTCG (>24 months) taxed at 20% with indexation. STCG at slab rate. DTAA: 25% US tax credit available.',
        }

    def track_crypto(self, holdings: List[Dict]) -> Dict:
        """Track crypto holdings."""
        results = []
        total_invested = 0
        total_current = 0

        for h in holdings:
            symbol = h.get('symbol', '').upper()
            qty = h.get('quantity', 0)
            avg_price = h.get('avg_price_usd', 0)

            crypto = self.CRYPTO_DB.get(symbol, {})
            current_price = crypto.get('price_usd', avg_price)

            invested = qty * avg_price
            current = qty * current_price
            pnl = current - invested

            total_invested += invested
            total_current += current

            results.append({
                'symbol': symbol,
                'name': crypto.get('name', symbol),
                'quantity': qty,
                'avg_price_usd': avg_price,
                'current_price_usd': current_price,
                'pnl_usd': round(pnl, 2),
                'pnl_pct': round(pnl / max(invested, 0.01) * 100, 2),
                'current_value_inr': round(current * self.EXCHANGE_RATES['USD']),
            })

        return {
            'holdings': results,
            'total_invested_usd': round(total_invested, 2),
            'total_current_usd': round(total_current, 2),
            'total_pnl_usd': round(total_current - total_invested, 2),
            'total_current_inr': round(total_current * self.EXCHANGE_RATES['USD']),
            'tax_note': 'Crypto: Flat 30% tax on gains. 1% TDS on transfers >₹50K. No loss set-off allowed.',
        }


# Singletons
family_dashboard = FamilyDashboard()
retirement_tracker = RetirementTracker()
international_investments = InternationalInvestments()
