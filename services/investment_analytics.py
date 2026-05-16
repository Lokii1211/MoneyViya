"""
Viya Investment Performance Analytics
========================================
Phase 2: US-607 (Benchmark comparison), US-604 (Multi-account household).
Sharpe ratio, rolling returns, benchmark alpha, drawdown analysis.
"""

import math
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional


# ══════════════════════════════════════════════════
# BENCHMARK INDICES
# ══════════════════════════════════════════════════

BENCHMARKS = {
    'nifty50': {
        'name': 'Nifty 50',
        'annualized_return_5y': 14.5,
        'annualized_return_10y': 12.8,
        'volatility_5y': 17.2,
        'risk_free_rate': 7.0,  # 10-yr GoI bond
    },
    'sensex': {
        'name': 'BSE Sensex',
        'annualized_return_5y': 14.2,
        'annualized_return_10y': 13.1,
        'volatility_5y': 16.8,
        'risk_free_rate': 7.0,
    },
    'nifty_midcap150': {
        'name': 'Nifty Midcap 150',
        'annualized_return_5y': 22.1,
        'annualized_return_10y': 16.5,
        'volatility_5y': 21.0,
        'risk_free_rate': 7.0,
    },
    'nifty_smallcap250': {
        'name': 'Nifty Smallcap 250',
        'annualized_return_5y': 26.3,
        'annualized_return_10y': 14.9,
        'volatility_5y': 25.5,
        'risk_free_rate': 7.0,
    },
    'nifty_next50': {
        'name': 'Nifty Next 50',
        'annualized_return_5y': 18.7,
        'annualized_return_10y': 14.2,
        'volatility_5y': 19.5,
        'risk_free_rate': 7.0,
    },
}


class InvestmentAnalytics:
    """Portfolio performance analytics vs benchmarks."""

    def full_analysis(self, holdings: List[Dict], returns_history: List[Dict],
                      benchmark: str = 'nifty50') -> Dict:
        """
        Complete investment performance analysis.
        holdings: [{name, invested, current_value, asset_class, returns_pct}]
        returns_history: [{date, portfolio_value, benchmark_value}]
        """
        bm = BENCHMARKS.get(benchmark, BENCHMARKS['nifty50'])

        # Portfolio metrics
        total_invested = sum(h.get('invested', 0) for h in holdings)
        total_current = sum(h.get('current_value', 0) for h in holdings)
        total_return_pct = ((total_current - total_invested) / max(total_invested, 1)) * 100

        # Performance metrics
        returns = [h.get('returns_pct', 0) for h in holdings if h.get('returns_pct') is not None]
        avg_return = statistics.mean(returns) if returns else 0

        # Sharpe ratio
        sharpe = self._calculate_sharpe(returns, bm['risk_free_rate'])

        # Alpha vs benchmark
        alpha = avg_return - bm['annualized_return_5y']

        # Drawdown
        drawdown = self._max_drawdown(returns_history)

        # Holdings breakdown
        winners = sorted(holdings, key=lambda h: h.get('returns_pct', 0), reverse=True)[:5]
        losers = sorted(holdings, key=lambda h: h.get('returns_pct', 0))[:5]

        # Sector concentration
        sectors = {}
        for h in holdings:
            sector = h.get('sector', h.get('asset_class', 'Other'))
            val = h.get('current_value', 0)
            if sector not in sectors:
                sectors[sector] = 0
            sectors[sector] += val
        sector_pcts = {
            s: round(v / max(total_current, 1) * 100, 1)
            for s, v in sorted(sectors.items(), key=lambda x: x[1], reverse=True)
        }

        # Concentration risk
        top3_pct = sum(
            h.get('current_value', 0) / max(total_current, 1) * 100
            for h in sorted(holdings, key=lambda h: h.get('current_value', 0), reverse=True)[:3]
        )

        return {
            'summary': {
                'total_invested': round(total_invested),
                'current_value': round(total_current),
                'total_pnl': round(total_current - total_invested),
                'total_return_pct': round(total_return_pct, 2),
                'holdings_count': len(holdings),
            },
            'performance': {
                'portfolio_return': round(avg_return, 2),
                'benchmark_return': bm['annualized_return_5y'],
                'alpha': round(alpha, 2),
                'benchmark_name': bm['name'],
                'outperforming': alpha > 0,
            },
            'risk_metrics': {
                'sharpe_ratio': round(sharpe, 2),
                'sharpe_interpretation': self._interpret_sharpe(sharpe),
                'portfolio_volatility': round(statistics.stdev(returns), 2) if len(returns) > 1 else 0,
                'benchmark_volatility': bm['volatility_5y'],
                'max_drawdown': round(drawdown, 2),
                'concentration_top3': round(top3_pct, 1),
                'concentration_risk': 'high' if top3_pct > 50 else 'medium' if top3_pct > 30 else 'low',
            },
            'sector_allocation': sector_pcts,
            'top_performers': [
                {'name': h.get('name', ''), 'return_pct': round(h.get('returns_pct', 0), 2),
                 'value': round(h.get('current_value', 0))}
                for h in winners
            ],
            'bottom_performers': [
                {'name': h.get('name', ''), 'return_pct': round(h.get('returns_pct', 0), 2),
                 'value': round(h.get('current_value', 0))}
                for h in losers if h.get('returns_pct', 0) < 0
            ],
            'recommendations': self._generate_recommendations(
                alpha, sharpe, top3_pct, sector_pcts, holdings
            ),
        }

    def _calculate_sharpe(self, returns: list, risk_free: float) -> float:
        if not returns or len(returns) < 2:
            return 0.0
        excess_returns = [r - risk_free for r in returns]
        avg_excess = statistics.mean(excess_returns)
        std = statistics.stdev(returns)
        if std == 0:
            return 0.0
        return avg_excess / std

    def _interpret_sharpe(self, sharpe: float) -> str:
        if sharpe >= 2:
            return "Excellent — top-tier risk-adjusted returns"
        elif sharpe >= 1:
            return "Good — above average risk-adjusted returns"
        elif sharpe >= 0.5:
            return "Acceptable — moderate risk-adjusted returns"
        elif sharpe >= 0:
            return "Poor — returns barely compensate for risk"
        else:
            return "Negative — losing money on a risk-adjusted basis"

    def _max_drawdown(self, history: list) -> float:
        if not history:
            return 0.0
        values = [h.get('portfolio_value', 0) for h in history if h.get('portfolio_value', 0) > 0]
        if not values:
            return 0.0
        peak = values[0]
        max_dd = 0
        for v in values:
            if v > peak:
                peak = v
            dd = (peak - v) / peak * 100
            max_dd = max(max_dd, dd)
        return max_dd

    def _generate_recommendations(self, alpha: float, sharpe: float,
                                   concentration: float, sectors: dict,
                                   holdings: list) -> List[str]:
        recs = []
        if alpha < 0:
            recs.append(f"Portfolio underperforming benchmark by {abs(alpha):.1f}%. Consider index funds for core allocation.")
        if sharpe < 0.5:
            recs.append("Low Sharpe ratio. Too much risk for the returns earned. Review high-volatility positions.")
        if concentration > 50:
            recs.append(f"Top 3 holdings = {concentration:.0f}% of portfolio. Diversify to reduce concentration risk.")
        top_sector = max(sectors.items(), key=lambda x: x[1], default=('', 0))
        if top_sector[1] > 40:
            recs.append(f"{top_sector[0]} is {top_sector[1]:.0f}% of portfolio. Consider sector diversification.")
        losers = [h for h in holdings if h.get('returns_pct', 0) < -20]
        if losers:
            names = ', '.join(h.get('name', '')[:15] for h in losers[:3])
            recs.append(f"Deep losers (>20% down): {names}. Review thesis or consider tax-loss harvesting.")
        if not recs:
            recs.append("Portfolio is well-balanced. Keep monitoring quarterly.")
        return recs


# ══════════════════════════════════════════════════
# MULTI-ACCOUNT HOUSEHOLD MANAGEMENT (US-604)
# ══════════════════════════════════════════════════

class HouseholdManager:
    """Manage multiple family members' finances in one view."""

    def __init__(self):
        self.households = {}  # household_id -> {members, ...}

    def create_household(self, owner_phone: str, name: str = 'My Family') -> Dict:
        hid = f"hh_{owner_phone[-4:]}"
        self.households[hid] = {
            'id': hid,
            'name': name,
            'owner': owner_phone,
            'members': [{'phone': owner_phone, 'role': 'owner', 'name': 'You'}],
            'created_at': datetime.utcnow().isoformat(),
        }
        return self.households[hid]

    def add_member(self, household_id: str, phone: str,
                   name: str, role: str = 'member') -> Dict:
        hh = self.households.get(household_id)
        if not hh:
            return {'error': 'Household not found'}
        if len(hh['members']) >= 6:
            return {'error': 'Maximum 6 members per household'}
        hh['members'].append({'phone': phone, 'name': name, 'role': role})
        return {'status': 'added', 'member': name, 'total': len(hh['members'])}

    def get_household_summary(self, household_id: str,
                               all_transactions: Dict[str, List]) -> Dict:
        """
        Aggregate financial view across all household members.
        all_transactions: {phone: [transactions]}
        """
        hh = self.households.get(household_id)
        if not hh:
            return {'error': 'Household not found'}

        total_income = 0
        total_expenses = 0
        member_summaries = []

        for member in hh['members']:
            phone = member['phone']
            txns = all_transactions.get(phone, [])

            income = sum(t.get('amount', 0) for t in txns if t.get('type') == 'income')
            expenses = sum(t.get('amount', 0) for t in txns if t.get('type') == 'expense')
            total_income += income
            total_expenses += expenses

            member_summaries.append({
                'name': member['name'],
                'role': member['role'],
                'income': round(income),
                'expenses': round(expenses),
                'savings': round(income - expenses),
                'savings_rate': round((income - expenses) / income * 100, 1) if income > 0 else 0.0,
                'transaction_count': len(txns),
            })

        return {
            'household': hh['name'],
            'total_income': round(total_income),
            'total_expenses': round(total_expenses),
            'total_savings': round(total_income - total_expenses),
            'household_savings_rate': round(
                (total_income - total_expenses) / max(total_income, 1) * 100, 1
            ),
            'members': member_summaries,
        }

    def remove_member(self, household_id: str, phone: str) -> Dict:
        hh = self.households.get(household_id)
        if not hh:
            return {'error': 'Household not found'}
        hh['members'] = [m for m in hh['members'] if m['phone'] != phone]
        return {'status': 'removed', 'remaining': len(hh['members'])}


# Singletons
investment_analytics = InvestmentAnalytics()
household_manager = HouseholdManager()
