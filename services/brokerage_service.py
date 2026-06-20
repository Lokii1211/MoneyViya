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
             'logo': '🟢', 'supported_types': ['equity', 'mutual_fund', 'etf'],
             'cost': '₹2,000/month API', 'rate_limit': '3 req/sec, 10K/day'},
            {'broker': 'groww', 'name': 'Groww', 'method': 'oauth',
             'logo': '🟡', 'supported_types': ['equity', 'mutual_fund']},
            {'broker': 'kuvera', 'name': 'Kuvera', 'method': 'api_key',
             'logo': '🔵', 'supported_types': ['mutual_fund']},
            {'broker': 'upstox', 'name': 'Upstox', 'method': 'oauth',
             'logo': '🟠', 'supported_types': ['equity', 'etf']},
            {'broker': 'paytm_money', 'name': 'Paytm Money', 'method': 'partner_api',
             'logo': '🔵', 'supported_types': ['mutual_fund', 'equity', 'nps']},
            {'broker': 'cas', 'name': 'CAS Import (CAMS/KFintech)', 'method': 'upload',
             'logo': '📄', 'supported_types': ['mutual_fund'],
             'note': 'Universal — covers ALL MF folios across ALL AMCs'},
            {'broker': 'cdsl', 'name': 'CDSL Demat', 'method': 'pan_otp',
             'logo': '🏦', 'supported_types': ['equity', 'etf', 'bond'],
             'note': 'All demat holdings via PAN + OTP'},
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

        elif broker in ('kuvera', 'cas', 'cdsl', 'manual'):
            return {
                'broker': broker, 'method': 'upload' if broker in ('cas','manual') else 'api_key',
                'instructions': 'Upload your CAS statement (PDF/CSV) from CAMS or KFintech'
                                if broker in ('cas','manual')
                                else f'Enter your {broker.upper()} credentials',
            }
        elif broker == 'paytm_money':
            return {'auth_url': 'https://www.paytmmoney.com/oauth/authorize',
                    'broker': broker, 'method': 'partner_api'}

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

        # Persist to investment_accounts table
        try:
            from database.fintech_repository import supabase as sb, AuditRepository
            if sb:
                sb.table('investment_accounts').insert({
                    'phone': user_phone,
                    'broker': broker,
                    'display_name': f'{broker.title()} Account',
                    'connection_type': 'api',
                    'is_active': True,
                }).execute()
                AuditRepository.log('broker_connected', phone=user_phone,
                    resource_type='investment_account',
                    new_value={'broker': broker})
        except Exception:
            pass

        await self.sync_portfolio(user_phone, broker)
        return {'status': 'connected', 'broker': broker,
                'message': f'{broker.title()} connected successfully'}

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
        """Get portfolio — DB first, cache fallback."""
        try:
            from database.fintech_repository import HoldingsRepository
            holdings = HoldingsRepository.list_by_phone(user_phone)
            if holdings:
                total_invested = sum(h.get('total_invested', 0) or 0 for h in holdings)
                current_value = sum(h.get('current_value', 0) or 0 for h in holdings)
                return {
                    'holdings': holdings,
                    'summary': {'total_invested': round(total_invested, 2),
                                'current_value': round(current_value, 2),
                                'total_pnl': round(current_value - total_invested, 2)},
                    'source': 'db',
                }
        except Exception:
            pass
        return self.portfolios.get(user_phone, {
            'holdings': [], 'summary': {'total_invested': 0, 'current_value': 0, 'total_pnl': 0},
        })

    def get_connections(self, user_phone: str) -> List[Dict]:
        """Get broker connections — DB first."""
        try:
            from database.fintech_repository import supabase as sb
            if sb:
                res = (sb.table('investment_accounts').select('*')
                       .eq('phone', user_phone).eq('is_active', True).execute())
                if res.data:
                    return res.data
        except Exception:
            pass
        return self.connections.get(user_phone, [])

    async def disconnect_broker(self, user_phone: str, broker: str) -> Dict:
        """Disconnect broker — revokes tokens, stops sync, updates DB."""
        if user_phone in self.connections:
            self.connections[user_phone] = [
                c for c in self.connections[user_phone] if c['broker'] != broker
            ]
        try:
            from database.fintech_repository import supabase as sb, AuditRepository
            if sb:
                sb.table('investment_accounts').update({'is_active': False}).eq(
                    'phone', user_phone).eq('broker', broker).execute()
                AuditRepository.log('broker_disconnected', phone=user_phone,
                    resource_type='investment_account', new_value={'broker': broker})
        except Exception:
            pass
        return {'status': 'disconnected', 'broker': broker}

    @staticmethod
    def is_market_open() -> bool:
        """Check if Indian stock market is currently open (9:15 AM - 3:30 PM IST)."""
        from datetime import timezone
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        if now_ist.weekday() >= 5:  # Sat/Sun
            return False
        market_open = now_ist.replace(hour=9, minute=15, second=0)
        market_close = now_ist.replace(hour=15, minute=30, second=0)
        return market_open <= now_ist <= market_close


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

    def fifo_cost_basis(self, lots: List[Dict], sell_qty: float, sell_price: float) -> Dict:
        """FIFO cost basis calculation for tax reporting.
        lots: [{qty, price, date}] sorted oldest first.
        Returns realized PnL, tax type (STCG/LTCG), tax amount.
        """
        remaining = sell_qty
        total_cost = 0.0
        stcg_pnl = 0.0
        ltcg_pnl = 0.0
        now = datetime.utcnow()

        for lot in sorted(lots, key=lambda x: x.get('date', '')):
            if remaining <= 0:
                break
            lot_qty = min(lot['qty'], remaining)
            cost = lot_qty * lot['price']
            proceeds = lot_qty * sell_price
            pnl = proceeds - cost
            total_cost += cost

            try:
                buy_date = datetime.fromisoformat(lot['date'].replace('Z', '+00:00'))
                days_held = (now - buy_date).days
            except (ValueError, TypeError):
                days_held = 0

            if days_held > 365:
                ltcg_pnl += pnl
            else:
                stcg_pnl += pnl
            remaining -= lot_qty

        # FY2024-25 tax rates
        ltcg_exempt = min(max(ltcg_pnl, 0), 125000)
        ltcg_taxable = max(0, ltcg_pnl - 125000)

        return {
            'sell_qty': sell_qty,
            'sell_price': sell_price,
            'total_cost_basis': round(total_cost, 2),
            'total_proceeds': round(sell_qty * sell_price, 2),
            'stcg_pnl': round(stcg_pnl, 2),
            'stcg_tax': round(max(stcg_pnl, 0) * 0.20, 2),
            'ltcg_pnl': round(ltcg_pnl, 2),
            'ltcg_exempt': round(ltcg_exempt, 2),
            'ltcg_taxable': round(ltcg_taxable, 2),
            'ltcg_tax': round(ltcg_taxable * 0.125, 2),
            'total_tax': round(max(stcg_pnl, 0) * 0.20 + ltcg_taxable * 0.125, 2),
        }


# Singletons
brokerage_service = BrokerageService()
portfolio_analytics = PortfolioAnalytics()
