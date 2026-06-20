"""
Viya Fintech — Supabase Repository Layer
=========================================
Connects all fintech services to the 22-table schema via Supabase client.
Maps service objects to/from database rows.
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

# Supabase client — reuse app-level instance
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', os.getenv('SUPABASE_KEY', ''))
    supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None
except Exception:
    supabase = None


# ═══════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════

def _dedup_hash(phone: str, amount: float, date: str, txn_type: str, ref: str = '') -> str:
    """SHA-256 dedup key for transaction uniqueness"""
    raw = f"{phone}|{amount}|{date[:16]}|{txn_type}|{ref}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _now() -> str:
    return datetime.utcnow().isoformat()


# ═══════════════════════════════════════════════════════
# SMS MESSAGES
# ═══════════════════════════════════════════════════════

class SMSRepository:
    """Raw SMS storage — source of truth"""

    @staticmethod
    def store(phone: str, sender_id: str, body: str, received_at: str,
              is_financial: bool = False, raw_json: dict = None) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'sender_id': sender_id,
            'message_body': body,
            'received_at': received_at,
            'is_financial': is_financial,
            'raw_json': raw_json or {},
        }
        res = supabase.table('sms_messages').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def mark_processed(sms_id: str, transaction_id: int = None) -> None:
        if not supabase:
            return
        update = {'is_processed': True}
        if transaction_id:
            update['transaction_id'] = transaction_id
        supabase.table('sms_messages').update(update).eq('id', sms_id).execute()

    @staticmethod
    def get_unprocessed(phone: str, limit: int = 50) -> list:
        if not supabase:
            return []
        res = (supabase.table('sms_messages')
               .select('*')
               .eq('phone', phone)
               .eq('is_processed', False)
               .order('received_at', desc=True)
               .limit(limit)
               .execute())
        return res.data or []


# ═══════════════════════════════════════════════════════
# FINTECH TRANSACTIONS
# ═══════════════════════════════════════════════════════

class TransactionRepository:
    """Enhanced fintech transactions with dedup, AI, merchant normalization"""

    @staticmethod
    def create(phone: str, txn: dict) -> dict:
        if not supabase:
            return {'error': 'no_db'}

        # Generate dedup hash
        ref = txn.get('upi_ref_id') or txn.get('merchant_normalized', '')
        dedup = _dedup_hash(phone, txn['amount'], txn.get('transaction_date', _now()),
                           txn.get('type', 'debit'), ref)

        row = {
            'phone': phone,
            'type': txn.get('type', 'debit'),
            'amount': txn['amount'],
            'currency': txn.get('currency', 'INR'),
            'merchant_raw': txn.get('merchant_raw'),
            'merchant_normalized': txn.get('merchant_normalized'),
            'category': txn.get('category', 'other'),
            'subcategory': txn.get('subcategory'),
            'category_source': txn.get('category_source', 'ai'),
            'payment_method': txn.get('payment_method'),
            'payment_app': txn.get('payment_app'),
            'upi_id': txn.get('upi_id'),
            'upi_ref_id': txn.get('upi_ref_id'),
            'source': txn.get('source', 'manual'),
            'source_raw_id': txn.get('source_raw_id'),
            'transaction_date': txn.get('transaction_date', _now()),
            'dedup_hash': dedup,
            'ai_confidence': txn.get('ai_confidence'),
            'ai_category_suggested': txn.get('ai_category_suggested'),
        }

        # Handle dedup — upsert on hash
        try:
            res = supabase.table('fintech_transactions').insert(row).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            if 'duplicate' in str(e).lower() or '23505' in str(e):
                return {'deduplicated': True, 'hash': dedup}
            raise

    @staticmethod
    def list_by_phone(phone: str, limit: int = 100, offset: int = 0,
                      category: str = None, source: str = None) -> list:
        if not supabase:
            return []
        q = (supabase.table('fintech_transactions')
             .select('*')
             .eq('phone', phone)
             .is_('deleted_at', 'null')
             .order('transaction_date', desc=True)
             .limit(limit)
             .offset(offset))
        if category:
            q = q.eq('category', category)
        if source:
            q = q.eq('source', source)
        res = q.execute()
        return res.data or []

    @staticmethod
    def get_by_date_range(phone: str, start: str, end: str) -> list:
        if not supabase:
            return []
        res = (supabase.table('fintech_transactions')
               .select('*')
               .eq('phone', phone)
               .gte('transaction_date', start)
               .lte('transaction_date', end)
               .is_('deleted_at', 'null')
               .order('transaction_date', desc=True)
               .execute())
        return res.data or []

    @staticmethod
    def update_category(txn_id: str, category: str, subcategory: str = None) -> None:
        if not supabase:
            return
        update = {'category': category, 'category_source': 'user', 'is_verified': True}
        if subcategory:
            update['subcategory'] = subcategory
        supabase.table('fintech_transactions').update(update).eq('id', txn_id).execute()


# ═══════════════════════════════════════════════════════
# BANK ACCOUNTS
# ═══════════════════════════════════════════════════════

class BankAccountRepository:
    """Bank account management with AA consent tracking"""

    @staticmethod
    def create(phone: str, bank_name: str, account_type: str = 'savings',
               masked_number: str = None, ifsc: str = None,
               import_method: str = 'manual') -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'bank_name': bank_name,
            'account_type': account_type,
            'account_number_masked': masked_number,
            'ifsc': ifsc,
            'import_method': import_method,
        }
        if masked_number:
            row['account_number_hash'] = hashlib.sha256(masked_number.encode()).hexdigest()
        res = supabase.table('bank_accounts').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_by_phone(phone: str) -> list:
        if not supabase:
            return []
        res = (supabase.table('bank_accounts')
               .select('*')
               .eq('phone', phone)
               .order('is_primary', desc=True)
               .execute())
        return res.data or []

    @staticmethod
    def update_balance(account_id: str, balance: float) -> None:
        if not supabase:
            return
        supabase.table('bank_accounts').update({
            'balance': balance,
            'balance_as_of': _now(),
            'last_synced_at': _now(),
        }).eq('id', account_id).execute()

    @staticmethod
    def update_aa_consent(account_id: str, consent_id: str, status: str,
                          expires: str = None) -> None:
        if not supabase:
            return
        update = {
            'aa_consent_id': consent_id,
            'aa_consent_status': status,
        }
        if expires:
            update['aa_consent_expires'] = expires
        supabase.table('bank_accounts').update(update).eq('id', account_id).execute()


# ═══════════════════════════════════════════════════════
# HOLDINGS & PORTFOLIO
# ═══════════════════════════════════════════════════════

class HoldingsRepository:
    """Portfolio holdings with valuation tracking"""

    @staticmethod
    def upsert(phone: str, holding: dict) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'asset_class': holding.get('asset_class', 'equity'),
            'ticker': holding.get('ticker'),
            'isin': holding.get('isin'),
            'name': holding['name'],
            'exchange': holding.get('exchange'),
            'quantity': holding.get('quantity', 0),
            'average_cost': holding.get('average_cost', 0),
            'total_invested': holding.get('total_invested', 0),
            'current_price': holding.get('current_price'),
            'current_value': holding.get('current_value'),
            'unrealized_pnl': holding.get('unrealized_pnl'),
            'unrealized_pnl_pct': holding.get('unrealized_pnl_pct'),
            'fund_category': holding.get('fund_category'),
            'is_sip': holding.get('is_sip', False),
            'sip_amount': holding.get('sip_amount'),
            'last_updated_at': _now(),
        }
        res = supabase.table('fintech_holdings').upsert(row, on_conflict='phone,isin').execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_by_phone(phone: str, asset_class: str = None) -> list:
        if not supabase:
            return []
        q = supabase.table('fintech_holdings').select('*').eq('phone', phone)
        if asset_class:
            q = q.eq('asset_class', asset_class)
        res = q.order('current_value', desc=True).execute()
        return res.data or []

    @staticmethod
    def record_trade(phone: str, trade: dict) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        dedup = _dedup_hash(phone, trade['gross_amount'], trade['trade_date'],
                           trade['type'], trade.get('trade_id', ''))
        row = {
            'phone': phone,
            'type': trade['type'],
            'ticker': trade.get('ticker'),
            'isin': trade.get('isin'),
            'name': trade.get('name'),
            'quantity': trade['quantity'],
            'price': trade['price'],
            'gross_amount': trade['gross_amount'],
            'net_amount': trade.get('net_amount', trade['gross_amount']),
            'trade_date': trade['trade_date'],
            'source': trade.get('source', 'manual'),
            'dedup_hash': dedup,
        }
        try:
            res = supabase.table('portfolio_transactions').insert(row).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            if 'duplicate' in str(e).lower():
                return {'deduplicated': True}
            raise


# ═══════════════════════════════════════════════════════
# INSIGHTS
# ═══════════════════════════════════════════════════════

class InsightsRepository:
    """AI-generated financial insights lifecycle"""

    @staticmethod
    def create(phone: str, insight_type: str, title: str, body: str,
               priority: str = 'medium', data: dict = None,
               action_url: str = None, expires_in_days: int = 7) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'type': insight_type,
            'title': title,
            'body': body,
            'priority': priority,
            'data': data or {},
            'action_url': action_url,
            'expires_at': (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat(),
        }
        res = supabase.table('fintech_insights').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_active(phone: str, limit: int = 20) -> list:
        if not supabase:
            return []
        res = (supabase.table('fintech_insights')
               .select('*')
               .eq('phone', phone)
               .in_('status', ['pending', 'sent'])
               .gte('expires_at', _now())
               .order('generated_at', desc=True)
               .limit(limit)
               .execute())
        return res.data or []

    @staticmethod
    def mark_read(insight_id: str) -> None:
        if not supabase:
            return
        supabase.table('fintech_insights').update({
            'status': 'read', 'read_at': _now()
        }).eq('id', insight_id).execute()


# ═══════════════════════════════════════════════════════
# ENTERPRISE (Orgs + API Keys)
# ═══════════════════════════════════════════════════════

class EnterpriseRepository:
    """Organization RBAC and API key management"""

    @staticmethod
    def create_org(phone: str, name: str, gstin: str = None) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'name': name,
            'owner_phone': phone,
            'gstin': gstin,
        }
        res = supabase.table('organizations').insert(row).execute()
        if res.data:
            # Auto-add owner as member
            supabase.table('org_members').insert({
                'org_id': res.data[0]['id'],
                'phone': phone,
                'name': name,
                'role': 'owner',
                'accepted_at': _now(),
            }).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def add_member(org_id: str, phone: str, name: str, role: str = 'viewer') -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'org_id': org_id,
            'phone': phone,
            'name': name,
            'role': role,
        }
        res = supabase.table('org_members').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def store_api_key(phone: str, name: str, key_prefix: str, key_hash: str,
                      scopes: list = None, org_id: str = None) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'name': name,
            'key_prefix': key_prefix,
            'key_hash': key_hash,
            'scopes': scopes or [],
            'org_id': org_id,
        }
        res = supabase.table('api_keys').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def validate_key(key_prefix: str, key_hash: str) -> dict:
        if not supabase:
            return {}
        res = (supabase.table('api_keys')
               .select('*')
               .eq('key_prefix', key_prefix)
               .eq('key_hash', key_hash)
               .eq('is_active', True)
               .execute())
        if res.data:
            # Update last used
            supabase.table('api_keys').update({
                'last_used_at': _now()
            }).eq('id', res.data[0]['id']).execute()
        return res.data[0] if res.data else {}


# ═══════════════════════════════════════════════════════
# AUDIT LOG
# ═══════════════════════════════════════════════════════

class AuditRepository:
    """Immutable audit trail"""

    @staticmethod
    def log(action: str, phone: str = None, resource_type: str = None,
            resource_id: str = None, old_value: dict = None,
            new_value: dict = None, actor_type: str = 'user',
            ip_address: str = None) -> None:
        if not supabase:
            return
        row = {
            'phone': phone,
            'actor_type': actor_type,
            'action': action,
            'resource_type': resource_type,
            'old_value': old_value,
            'new_value': new_value,
            'ip_address': ip_address,
        }
        if resource_id:
            row['resource_id'] = resource_id
        try:
            supabase.table('audit_logs').insert(row).execute()
        except Exception:
            pass  # Never block on audit failure


# ═══════════════════════════════════════════════════════
# INSURANCE & CREDIT
# ═══════════════════════════════════════════════════════

class InsuranceRepository:

    @staticmethod
    def add_policy(phone: str, policy: dict) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'type': policy['type'],
            'provider': policy.get('provider'),
            'policy_number': policy.get('policy_number'),
            'policy_name': policy.get('policy_name'),
            'sum_assured': policy.get('sum_assured'),
            'premium_amount': policy.get('premium_amount'),
            'premium_frequency': policy.get('premium_frequency', 'annual'),
            'start_date': policy.get('start_date'),
            'maturity_date': policy.get('maturity_date'),
            'nominee': policy.get('nominee'),
        }
        res = supabase.table('insurance_policies').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_by_phone(phone: str) -> list:
        if not supabase:
            return []
        res = (supabase.table('insurance_policies')
               .select('*')
               .eq('phone', phone)
               .eq('status', 'active')
               .order('next_premium_date')
               .execute())
        return res.data or []


class CreditRepository:

    @staticmethod
    def store_score(phone: str, score: int, bureau: str = 'cibil',
                    factors: dict = None) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'score': score,
            'bureau': bureau,
            'factors': factors or {},
        }
        res = supabase.table('credit_scores').insert(row).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def get_latest(phone: str) -> dict:
        if not supabase:
            return {}
        res = (supabase.table('credit_scores')
               .select('*')
               .eq('phone', phone)
               .order('fetched_at', desc=True)
               .limit(1)
               .execute())
        return res.data[0] if res.data else {}


# ═══════════════════════════════════════════════════════
# INTERNATIONAL HOLDINGS
# ═══════════════════════════════════════════════════════

class InternationalRepository:

    @staticmethod
    def upsert(phone: str, holding: dict) -> dict:
        if not supabase:
            return {'error': 'no_db'}
        row = {
            'phone': phone,
            'market': holding['market'],
            'ticker': holding['ticker'],
            'name': holding.get('name'),
            'quantity': holding.get('quantity', 0),
            'avg_buy_price_usd': holding.get('avg_buy_price_usd', 0),
            'current_price_usd': holding.get('current_price_usd'),
            'exchange_rate': holding.get('exchange_rate', 83.50),
            'tax_note': holding.get('tax_note'),
        }
        res = supabase.table('international_holdings').upsert(
            row, on_conflict='phone,market,ticker'
        ).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_by_phone(phone: str, market: str = None) -> list:
        if not supabase:
            return []
        q = supabase.table('international_holdings').select('*').eq('phone', phone)
        if market:
            q = q.eq('market', market)
        res = q.order('current_price_usd', desc=True).execute()
        return res.data or []
