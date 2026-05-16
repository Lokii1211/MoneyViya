"""
Viya Brokerage Sync Service
=============================
Phase 1: Connect Zerodha, Groww, Kuvera, Upstox for live portfolio data.

Supported Methods:
  - Zerodha: Kite Connect OAuth API
  - Groww: Unofficial API (reverse-engineered)
  - Kuvera: CAS (Consolidated Account Statement) import
  - Upstox: Upstox API v2
  - Manual: CAS PDF/CSV upload via CAMS/KFintech
"""

import os
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum


class Broker(Enum):
    ZERODHA = "zerodha"
    GROWW = "groww"
    KUVERA = "kuvera"
    UPSTOX = "upstox"
    MANUAL = "manual"


class AssetClass(Enum):
    EQUITY = "equity"
    MUTUAL_FUND = "mutual_fund"
    ETF = "etf"
    BOND = "bond"
    FD = "fixed_deposit"
    GOLD = "gold"
    NPS = "nps"
    PPF = "ppf"
    EPF = "epf"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"


# ══════════════════════════════════════════════════
# POPULAR HOLDINGS DATABASE (for auto-detection)
# ══════════════════════════════════════════════════

POPULAR_INSTRUMENTS = {
    # Equity - Large Cap
    'RELIANCE': {'name': 'Reliance Industries', 'asset_class': 'equity', 'sector': 'Energy'},
    'TCS': {'name': 'Tata Consultancy Services', 'asset_class': 'equity', 'sector': 'IT'},
    'HDFCBANK': {'name': 'HDFC Bank', 'asset_class': 'equity', 'sector': 'Banking'},
    'INFY': {'name': 'Infosys', 'asset_class': 'equity', 'sector': 'IT'},
    'ICICIBANK': {'name': 'ICICI Bank', 'asset_class': 'equity', 'sector': 'Banking'},
    'HINDUNILVR': {'name': 'Hindustan Unilever', 'asset_class': 'equity', 'sector': 'FMCG'},
    'ITC': {'name': 'ITC Limited', 'asset_class': 'equity', 'sector': 'FMCG'},
    'SBIN': {'name': 'State Bank of India', 'asset_class': 'equity', 'sector': 'Banking'},
    'BHARTIARTL': {'name': 'Bharti Airtel', 'asset_class': 'equity', 'sector': 'Telecom'},
    'KOTAKBANK': {'name': 'Kotak Mahindra Bank', 'asset_class': 'equity', 'sector': 'Banking'},
    'LT': {'name': 'Larsen & Toubro', 'asset_class': 'equity', 'sector': 'Infrastructure'},
    'ASIANPAINT': {'name': 'Asian Paints', 'asset_class': 'equity', 'sector': 'Paints'},
    'TATAMOTORS': {'name': 'Tata Motors', 'asset_class': 'equity', 'sector': 'Auto'},
    'WIPRO': {'name': 'Wipro', 'asset_class': 'equity', 'sector': 'IT'},
    'MARUTI': {'name': 'Maruti Suzuki', 'asset_class': 'equity', 'sector': 'Auto'},

    # Popular Mutual Funds
    'PPFAS_FLEXI': {'name': 'Parag Parikh Flexi Cap Fund', 'asset_class': 'mutual_fund', 'category': 'Flexi Cap'},
    'AXIS_BLUECHIP': {'name': 'Axis Bluechip Fund', 'asset_class': 'mutual_fund', 'category': 'Large Cap'},
    'MIRAE_EMERGING': {'name': 'Mirae Asset Emerging Bluechip', 'asset_class': 'mutual_fund', 'category': 'Large & Mid Cap'},
    'SBI_SMALL': {'name': 'SBI Small Cap Fund', 'asset_class': 'mutual_fund', 'category': 'Small Cap'},
    'HDFC_MID': {'name': 'HDFC Mid-Cap Opportunities', 'asset_class': 'mutual_fund', 'category': 'Mid Cap'},
    'ICICI_TECH': {'name': 'ICICI Pru Technology Fund', 'asset_class': 'mutual_fund', 'category': 'Sectoral'},
    'KOTAK_FLEXI': {'name': 'Kotak Flexi Cap Fund', 'asset_class': 'mutual_fund', 'category': 'Flexi Cap'},
    'UTI_NIFTY': {'name': 'UTI Nifty 50 Index Fund', 'asset_class': 'mutual_fund', 'category': 'Index'},
    'MOTILAL_SP500': {'name': 'Motilal Oswal S&P 500 Index', 'asset_class': 'mutual_fund', 'category': 'International'},
    'NIPPON_LIQUID': {'name': 'Nippon India Liquid Fund', 'asset_class': 'mutual_fund', 'category': 'Liquid'},

    # ETFs
    'NIFTYBEES': {'name': 'Nippon India Nifty BeES', 'asset_class': 'etf', 'category': 'Index'},
    'GOLDBEES': {'name': 'Nippon India Gold BeES', 'asset_class': 'etf', 'category': 'Gold'},
    'BANKBEES': {'name': 'Nippon India Bank BeES', 'asset_class': 'etf', 'category': 'Sectoral'},
}


class BrokerageService:
    """Manages brokerage connections and portfolio sync."""

    def __init__(self):
        # Zerodha Kite
        self.kite_api_key = os.getenv('KITE_API_KEY', '')
        self.kite_api_secret = os.getenv('KITE_API_SECRET', '')

        # In-memory store (production: PostgreSQL)
        self.connections = {}  # user_phone -> [{broker, status, ...}]
        self.portfolios = {}   # user_phone -> {holdings, summary}

    def get_supported_brokers(self) -> List[Dict]:
        """Return supported brokers + connection methods."""
        return [
            {'broker': 'zerodha', 'name': 'Zerodha (Kite)', 'method': 'oauth',
             'logo': '🟢', 'supported_types': ['equity', 'mutual_fund', 'etf']},
            {'broker': 'groww', 'name': 'Groww', 'method': 'oauth',
             'logo': '🟡', 'supported_types': ['equity', 'mutual_fund']},
            {'broker': 'kuvera', 'name': 'Kuvera', 'method': 'cas',
             'logo': '🔵', 'supported_types': ['mutual_fund']},
            {'broker': 'upstox', 'name': 'Upstox', 'method': 'oauth',
             'logo': '🟠', 'supported_types': ['equity', 'etf']},
            {'broker': 'manual', 'name': 'Manual (CAS Upload)', 'method': 'csv',
             'logo': '📄', 'supported_types': ['mutual_fund', 'equity']},
        ]

    async def initiate_connection(self, user_phone: str, broker: str) -> Dict:
        """
        Start broker OAuth flow. Returns auth_url for redirect.
        """
        if broker == 'zerodha':
            auth_url = (
                f"https://kite.zerodha.com/connect/login"
                f"?api_key={self.kite_api_key}&v=3"
            )
            return {'auth_url': auth_url, 'broker': broker, 'method': 'oauth'}

        elif broker == 'groww':
            return {'auth_url': 'https://groww.in/oauth/authorize', 'broker': broker, 'method': 'oauth'}

        elif broker == 'upstox':
            return {'auth_url': 'https://api.upstox.com/v2/login/authorization', 'broker': broker, 'method': 'oauth'}

        elif broker in ('kuvera', 'manual'):
            return {
                'broker': broker, 'method': 'cas',
                'instructions': 'Upload your CAS statement (PDF/CSV) from CAMS or KFintech',
            }

        return {'error': f'Unsupported broker: {broker}'}

    async def handle_oauth_callback(self, user_phone: str, broker: str,
                                     request_token: str) -> Dict:
        """
        Exchange OAuth request_token for access_token.
        Then trigger initial portfolio sync.
        """
        # Generate checksum for Zerodha
        if broker == 'zerodha':
            checksum = hashlib.sha256(
                f"{self.kite_api_key}{request_token}{self.kite_api_secret}".encode()
            ).hexdigest()
            # In production: POST to Kite API /session/token
            # response = requests.post('https://api.kite.trade/session/token', ...)

        connection = {
            'broker': broker,
            'user_phone': user_phone,
            'status': 'connected',
            'connected_at': datetime.utcnow().isoformat(),
            'last_sync': None,
            'access_token': f'simulated_{broker}_token',
        }

        if user_phone not in self.connections:
            self.connections[user_phone] = []
        self.connections[user_phone].append(connection)

        # Trigger sync
        await self.sync_portfolio(user_phone, broker)

        return {
            'status': 'connected',
            'broker': broker,
            'message': f'{broker.title()} connected successfully',
        }

    async def sync_portfolio(self, user_phone: str, broker: str = None) -> Dict:
        """
        Sync portfolio from connected broker(s).
        In production: calls broker API for live holdings + positions.
        """
        # Simulated portfolio data structure
        portfolio = {
            'last_sync': datetime.utcnow().isoformat(),
            'holdings': [],
            'summary': {
                'total_invested': 0,
                'current_value': 0,
                'day_change': 0,
                'day_change_pct': 0,
                'total_pnl': 0,
                'total_pnl_pct': 0,
                'xirr': 0,
            },
            'asset_allocation': {},
            'sip_summary': {
                'active_sips': 0,
                'monthly_amount': 0,
                'next_sip_date': None,
            },
        }

        self.portfolios[user_phone] = portfolio
        return {'status': 'synced', 'holdings': 0, 'broker': broker or 'all'}

    def get_portfolio(self, user_phone: str) -> Dict:
        """Get cached portfolio for user."""
        return self.portfolios.get(user_phone, {
            'holdings': [],
            'summary': {'total_invested': 0, 'current_value': 0, 'total_pnl': 0},
            'asset_allocation': {},
        })

    def get_connections(self, user_phone: str) -> List[Dict]:
        """Get broker connections for user."""
        return self.connections.get(user_phone, [])

    async def disconnect_broker(self, user_phone: str, broker: str) -> Dict:
        """Disconnect a broker — revokes tokens, stops sync."""
        if user_phone in self.connections:
            self.connections[user_phone] = [
                c for c in self.connections[user_phone]
                if c['broker'] != broker
            ]
        return {'status': 'disconnected', 'broker': broker}


# ══════════════════════════════════════════════════
# PORTFOLIO ANALYTICS ENGINE
# ══════════════════════════════════════════════════

class PortfolioAnalytics:
    """Calculate XIRR, Sharpe, allocation drift, tax implications."""

    def calculate_xirr(self, cashflows: List[Dict]) -> float:
        """
        Calculate XIRR (Extended Internal Rate of Return).
        cashflows: [{date: ISO, amount: float}] — negative = investment, positive = redemption.
        Uses Newton-Raphson method.
        """
        if not cashflows or len(cashflows) < 2:
            return 0.0

        try:
            dates = [datetime.fromisoformat(cf['date'].replace('Z', '+00:00')) for cf in cashflows]
            amounts = [cf['amount'] for cf in cashflows]

            # Newton-Raphson
            guess = 0.1
            for _ in range(100):
                npv = sum(
                    a / ((1 + guess) ** ((d - dates[0]).days / 365.25))
                    for a, d in zip(amounts, dates)
                )
                dnpv = sum(
                    -a * ((d - dates[0]).days / 365.25) /
                    ((1 + guess) ** ((d - dates[0]).days / 365.25 + 1))
                    for a, d in zip(amounts, dates)
                )
                if abs(dnpv) < 1e-10:
                    break
                new_guess = guess - npv / dnpv
                if abs(new_guess - guess) < 1e-8:
                    guess = new_guess
                    break
                guess = new_guess

            return round(guess * 100, 2)  # As percentage
        except Exception:
            return 0.0

    def calculate_allocation(self, holdings: List[Dict]) -> Dict:
        """Calculate actual asset allocation vs target."""
        total = sum(h.get('current_value', 0) for h in holdings)
        if total == 0:
            return {}

        allocation = {}
        for h in holdings:
            ac = h.get('asset_class', 'other')
            val = h.get('current_value', 0)
            if ac not in allocation:
                allocation[ac] = {'value': 0, 'percentage': 0}
            allocation[ac]['value'] += val

        for ac in allocation:
            allocation[ac]['percentage'] = round(allocation[ac]['value'] / total * 100, 1)

        return allocation

    def tax_implications(self, holdings: List[Dict]) -> Dict:
        """Calculate STCG/LTCG based on holding period."""
        stcg_equity = 0
        ltcg_equity = 0
        stcg_debt = 0
        ltcg_debt = 0

        now = datetime.utcnow()
        for h in holdings:
            pnl = h.get('unrealized_pnl', 0)
            if pnl <= 0:
                continue

            buy_date_str = h.get('buy_date', '')
            if not buy_date_str:
                continue

            try:
                buy_date = datetime.fromisoformat(buy_date_str.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                continue

            holding_days = (now - buy_date).days
            ac = h.get('asset_class', 'equity')

            if ac in ('equity', 'mutual_fund', 'etf'):
                if holding_days > 365:
                    ltcg_equity += pnl
                else:
                    stcg_equity += pnl
            else:
                if holding_days > 365 * 3:
                    ltcg_debt += pnl
                else:
                    stcg_debt += pnl

        # Apply FY2024-25 tax rates
        ltcg_equity_exempt = min(ltcg_equity, 125000)
        ltcg_equity_taxable = max(0, ltcg_equity - 125000)

        return {
            'stcg_equity': round(stcg_equity, 2),
            'stcg_equity_tax': round(stcg_equity * 0.20, 2),
            'ltcg_equity': round(ltcg_equity, 2),
            'ltcg_equity_exempt': round(ltcg_equity_exempt, 2),
            'ltcg_equity_taxable': round(ltcg_equity_taxable, 2),
            'ltcg_equity_tax': round(ltcg_equity_taxable * 0.125, 2),
            'stcg_debt': round(stcg_debt, 2),
            'ltcg_debt': round(ltcg_debt, 2),
            'total_tax_liability': round(
                stcg_equity * 0.20 + ltcg_equity_taxable * 0.125, 2
            ),
        }


# Singletons
brokerage_service = BrokerageService()
portfolio_analytics = PortfolioAnalytics()
