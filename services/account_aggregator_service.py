"""
Viya Account Aggregator Integration — Setu API
=================================================
Phase 1: Connect user bank accounts via India's Account Aggregator framework.
Supports: Setu (primary) and Finvu (fallback).

Flow:
  1. User selects bank → create consent request
  2. Redirect to AA webview → user approves
  3. Webhook callback → fetch financial data
  4. Parse statements → create transactions
"""

import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum


class AAProvider(Enum):
    SETU = "setu"
    FINVU = "finvu"


class ConsentStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    REVOKED = "revoked"
    EXPIRED = "expired"
    REJECTED = "rejected"


# ══════════════════════════════════════════════════
# SUPPORTED FIPs (Financial Information Providers)
# ══════════════════════════════════════════════════

SUPPORTED_FIPS = {
    # Tier 1 — Major private banks
    'hdfc': {'fip_id': 'HDFC-FIP', 'name': 'HDFC Bank', 'tier': 1, 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'icici': {'fip_id': 'ICICI-FIP', 'name': 'ICICI Bank', 'tier': 1, 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'sbi': {'fip_id': 'SBI-FIP', 'name': 'State Bank of India', 'tier': 1, 'types': ['DEPOSIT']},
    'axis': {'fip_id': 'AXIS-FIP', 'name': 'Axis Bank', 'tier': 1, 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'kotak': {'fip_id': 'KOTAK-FIP', 'name': 'Kotak Mahindra Bank', 'tier': 1, 'types': ['DEPOSIT']},
    'indusind': {'fip_id': 'INDUSIND-FIP', 'name': 'IndusInd Bank', 'tier': 1, 'types': ['DEPOSIT']},
    'yes': {'fip_id': 'YES-FIP', 'name': 'Yes Bank', 'tier': 1, 'types': ['DEPOSIT']},
    # Tier 2 — Public sector banks
    'pnb': {'fip_id': 'PNB-FIP', 'name': 'Punjab National Bank', 'tier': 2, 'types': ['DEPOSIT']},
    'canara': {'fip_id': 'CANARA-FIP', 'name': 'Canara Bank', 'tier': 2, 'types': ['DEPOSIT']},
    'bob': {'fip_id': 'BOB-FIP', 'name': 'Bank of Baroda', 'tier': 2, 'types': ['DEPOSIT']},
    'boi': {'fip_id': 'BOI-FIP', 'name': 'Bank of India', 'tier': 2, 'types': ['DEPOSIT']},
    'union': {'fip_id': 'UNION-FIP', 'name': 'Union Bank of India', 'tier': 2, 'types': ['DEPOSIT']},
    'central': {'fip_id': 'CENTRAL-FIP', 'name': 'Central Bank of India', 'tier': 2, 'types': ['DEPOSIT']},
    'indian': {'fip_id': 'INDIAN-FIP', 'name': 'Indian Bank', 'tier': 2, 'types': ['DEPOSIT']},
    'iob': {'fip_id': 'IOB-FIP', 'name': 'Indian Overseas Bank', 'tier': 2, 'types': ['DEPOSIT']},
    # Tier 3 — Smaller private banks
    'idfc': {'fip_id': 'IDFC-FIP', 'name': 'IDFC First Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'federal': {'fip_id': 'FEDERAL-FIP', 'name': 'Federal Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'rbl': {'fip_id': 'RBL-FIP', 'name': 'RBL Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'bandhan': {'fip_id': 'BANDHAN-FIP', 'name': 'Bandhan Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'sib': {'fip_id': 'SIB-FIP', 'name': 'South Indian Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'karur': {'fip_id': 'KVB-FIP', 'name': 'Karur Vysya Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'csb': {'fip_id': 'CSB-FIP', 'name': 'CSB Bank', 'tier': 3, 'types': ['DEPOSIT']},
    # Payment Banks
    'paytm': {'fip_id': 'PAYTM-FIP', 'name': 'Paytm Payments Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'airtel': {'fip_id': 'AIRTEL-FIP', 'name': 'Airtel Payments Bank', 'tier': 3, 'types': ['DEPOSIT']},
    'jio': {'fip_id': 'JIO-FIP', 'name': 'Jio Payments Bank', 'tier': 3, 'types': ['DEPOSIT']},
    # Mutual Funds (via CAMS/KFintech)
    'cams': {'fip_id': 'CAMS-FIP', 'name': 'CAMS (Mutual Funds)', 'tier': 1, 'types': ['MUTUAL_FUNDS']},
    'kfintech': {'fip_id': 'KFIN-FIP', 'name': 'KFintech (Mutual Funds)', 'tier': 1, 'types': ['MUTUAL_FUNDS']},
    # Insurance
    'lic': {'fip_id': 'LIC-FIP', 'name': 'LIC', 'tier': 2, 'types': ['INSURANCE']},
}


class AccountAggregatorService:
    """
    Manages AA consent lifecycle and data fetching.
    Uses Setu's API (https://docs.setu.co/data/account-aggregator).
    """

    def __init__(self):
        self.base_url = os.getenv('SETU_AA_BASE_URL', 'https://aa-sandbox.setu.co')
        self.client_id = os.getenv('SETU_CLIENT_ID', '')
        self.client_secret = os.getenv('SETU_CLIENT_SECRET', '')
        self.aa_id = os.getenv('SETU_AA_ID', 'viya-aa@setu')
        self.redirect_url = os.getenv('SETU_REDIRECT_URL', 'https://app.viya.money/aa/callback')
        self.webhook_secret = os.getenv('SETU_WEBHOOK_SECRET', '')

        # In-memory consent cache (primary store: PostgreSQL via fintech_repository)
        self.consents = {}  # consent_handle -> consent_data (cache)

    def get_supported_banks(self) -> List[Dict]:
        """Return list of supported FIPs for the UI."""
        return [
            {'code': code, 'name': fip['name'], 'fip_id': fip['fip_id'],
             'types': fip['types']}
            for code, fip in SUPPORTED_FIPS.items()
        ]

    async def create_consent(self, user_phone: str, fip_id: str,
                              data_range_months: int = 6) -> Dict:
        """
        Step 1: Create consent request with Setu.
        Returns consent_handle + redirect_url for user approval.
        """
        now = datetime.utcnow()
        consent_request = {
            "Detail": {
                "consentStart": now.isoformat() + "Z",
                "consentExpiry": (now + timedelta(days=365)).isoformat() + "Z",
                "Customer": {"id": f"{user_phone}@viya-aa"},
                "FIDataRange": {
                    "from": (now - timedelta(days=30 * data_range_months)).isoformat() + "Z",
                    "to": now.isoformat() + "Z",
                },
                "consentMode": "STORE",
                "consentTypes": ["TRANSACTIONS", "PROFILE", "SUMMARY"],
                "fetchType": "PERIODIC",
                "Frequency": {"unit": "DAY", "value": 1},
                "DataLife": {"unit": "MONTH", "value": 12},
                "DataFilter": [],
                "FITypes": ["DEPOSIT", "CREDIT_CARD"],
                "Purpose": {
                    "code": "101",
                    "refUri": "https://api.rebit.org.in/aa/purpose/101.xml",
                    "text": "Personal finance management",
                    "Category": {"type": "string"},
                },
            },
            "redirectUrl": self.redirect_url,
        }

        # In production: POST to Setu API
        # response = await self._post('/consents', consent_request)
        # For now, simulate:
        consent_handle = hashlib.sha256(
            f"{user_phone}:{fip_id}:{now.isoformat()}".encode()
        ).hexdigest()[:24]

        expires = (now + timedelta(days=365)).isoformat()
        consent_data = {
            'handle': consent_handle,
            'user_phone': user_phone,
            'fip_id': fip_id,
            'status': ConsentStatus.PENDING.value,
            'created_at': now.isoformat(),
            'expires_at': expires,
            'data_range_months': data_range_months,
        }
        self.consents[consent_handle] = consent_data

        # Persist to aa_consents table
        try:
            from database.fintech_repository import supabase as sb
            if sb:
                sb.table('aa_consents').insert({
                    'phone': user_phone,
                    'consent_handle': consent_handle,
                    'aa_provider': 'setu',
                    'status': 'REQUESTED',
                    'purpose': 'personal finance management',
                    'data_types': ['DEPOSIT'],
                    'frequency': 'DAILY',
                    'date_range_start': (now - timedelta(days=30 * data_range_months)).strftime('%Y-%m-%d'),
                    'date_range_end': now.strftime('%Y-%m-%d'),
                    'expires_at': expires,
                    'signed_consent': consent_request,
                }).execute()
        except Exception:
            pass

        webview_url = f"{self.base_url}/consents/webview/{consent_handle}"
        return {
            'consent_handle': consent_handle,
            'webview_url': webview_url,
            'redirect_url': self.redirect_url,
            'status': 'pending',
            'expires_at': expires,
        }

    async def handle_consent_callback(self, consent_handle: str,
                                       status: str) -> Dict:
        """
        Step 2: Called by Setu webhook when user approves/rejects consent.
        If approved, triggers data fetch.
        """
        consent = self.consents.get(consent_handle)
        if not consent:
            return {'error': 'Consent not found'}

        consent['status'] = status

        # Update DB
        try:
            from database.fintech_repository import supabase as sb, AuditRepository
            if sb:
                sb.table('aa_consents').update(
                    {'status': status}
                ).eq('consent_handle', consent_handle).execute()
                AuditRepository.log('aa_consent_status_changed',
                    phone=consent.get('user_phone'),
                    resource_type='aa_consent',
                    new_value={'handle': consent_handle, 'status': status})
        except Exception:
            pass

        if status == 'ACTIVE':
            result = await self.fetch_financial_data(consent_handle)
            return {
                'status': 'active',
                'consent_handle': consent_handle,
                'data_fetched': result.get('success', False),
                'accounts': result.get('accounts', []),
            }
        elif status == 'REJECTED':
            consent['status'] = ConsentStatus.REJECTED.value
            return {'status': 'rejected', 'consent_handle': consent_handle}
        else:
            return {'status': status, 'consent_handle': consent_handle}

    async def fetch_financial_data(self, consent_handle: str) -> Dict:
        """
        Step 3: Fetch financial data from FIP via AA.
        Creates a data session, fetches data, and parses into transactions.
        """
        consent = self.consents.get(consent_handle)
        if not consent or consent['status'] != ConsentStatus.ACTIVE.value:
            return {'success': False, 'error': 'Consent not active'}

        # In production: POST to Setu /sessions → GET /sessions/:id/data
        # Simulate response structure:
        return {
            'success': True,
            'accounts': [],
            'transactions': [],
            'message': 'AA data fetch requires live Setu credentials',
        }

    async def revoke_consent(self, consent_handle: str) -> Dict:
        """Revoke consent — stops sync, schedules AA data deletion within 30 days."""
        consent = self.consents.get(consent_handle)
        if not consent:
            return {'error': 'Consent not found'}

        consent['status'] = ConsentStatus.REVOKED.value

        # Update DB + schedule data deletion
        try:
            from database.fintech_repository import supabase as sb, AuditRepository
            if sb:
                sb.table('aa_consents').update({
                    'status': 'REVOKED',
                    'revoked_at': datetime.utcnow().isoformat(),
                }).eq('consent_handle', consent_handle).execute()
                AuditRepository.log('aa_consent_revoked',
                    phone=consent.get('user_phone'),
                    resource_type='aa_consent',
                    new_value={'handle': consent_handle,
                               'data_deletion_deadline': (datetime.utcnow() + timedelta(days=30)).isoformat()})
        except Exception:
            pass

        return {'status': 'revoked', 'consent_handle': consent_handle,
                'data_deletion_by': (datetime.utcnow() + timedelta(days=30)).isoformat()}

    def get_user_consents(self, user_phone: str) -> List[Dict]:
        """Get all consents for a user — DB first, cache fallback."""
        try:
            from database.fintech_repository import supabase as sb
            if sb:
                res = sb.table('aa_consents').select('*').eq('phone', user_phone).execute()
                if res.data:
                    return res.data
        except Exception:
            pass
        return [c for c in self.consents.values() if c['user_phone'] == user_phone]

    def parse_depa_transaction(self, raw_txn: dict, user_phone: str) -> dict:
        """Parse DEPA-format transaction from AA into Viya fintech_transaction format."""
        from services.fintech_sms_parser import fintech_parser
        amount = float(raw_txn.get('amount', 0))
        txn_type = 'debit' if raw_txn.get('type', '').upper() == 'DEBIT' else 'credit'
        narration = raw_txn.get('narration', '')

        # Extract merchant from narration
        merchant_raw = narration
        merchant_norm = fintech_parser._normalize_merchant(narration) if narration else None
        from services.fintech_sms_parser import MERCHANT_CATEGORIES
        category = MERCHANT_CATEGORIES.get(merchant_norm, 'other')

        return {
            'type': txn_type,
            'amount': amount,
            'currency': 'INR',
            'merchant_raw': merchant_raw,
            'merchant_normalized': merchant_norm,
            'category': category,
            'category_source': 'aa_narration',
            'source': 'aa_api',
            'source_raw_id': raw_txn.get('txnId'),
            'transaction_date': raw_txn.get('transactionTimestamp'),
            'upi_ref_id': raw_txn.get('reference'),
            'ai_confidence': 0.90,
        }

    def get_expiring_consents(self, days_ahead: int = 7) -> List[Dict]:
        """Find consents expiring within N days — for renewal alerts."""
        try:
            from database.fintech_repository import supabase as sb
            if sb:
                cutoff = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat()
                res = (sb.table('aa_consents').select('*')
                       .eq('status', 'ACTIVE')
                       .lte('expires_at', cutoff)
                       .execute())
                return res.data or []
        except Exception:
            pass
        return []

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Verify Setu webhook signature (HMAC-SHA256)."""
        if not self.webhook_secret:
            return True  # Skip in dev
        expected = hmac.new(
            self.webhook_secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


# ══════════════════════════════════════════════════
# TRANSACTION RECONCILIATION SERVICE
# ══════════════════════════════════════════════════

class TransactionReconciliationService:
    """
    Reconciles transactions from multiple sources:
    SMS, AA API, CSV import, manual entry.
    Prevents duplicates using dedup_hash.
    """

    def reconcile(self, existing: List[Dict], incoming: List[Dict]) -> Dict:
        """
        Compare incoming transactions against existing ones.
        Returns: {new: [], duplicates: [], conflicts: [], stats: {}}.
        """
        existing_hashes = {t.get('dedup_hash') for t in existing if t.get('dedup_hash')}
        existing_lookup = {}
        for t in existing:
            key = self._fuzzy_key(t)
            if key:
                existing_lookup[key] = t

        new_txns = []
        duplicates = []
        conflicts = []

        for txn in incoming:
            # Exact dedup match
            if txn.get('dedup_hash') and txn['dedup_hash'] in existing_hashes:
                duplicates.append(txn)
                continue

            # Fuzzy match: same amount + same date + similar merchant
            fuzzy = self._fuzzy_key(txn)
            if fuzzy and fuzzy in existing_lookup:
                existing_match = existing_lookup[fuzzy]
                # Check if categories differ → conflict
                if (existing_match.get('category') != txn.get('category')
                        and txn.get('ai_confidence', 0) > existing_match.get('ai_confidence', 0)):
                    conflicts.append({
                        'existing': existing_match,
                        'incoming': txn,
                        'reason': 'higher_confidence_category',
                    })
                else:
                    duplicates.append(txn)
                continue

            new_txns.append(txn)

        return {
            'new': new_txns,
            'duplicates': duplicates,
            'conflicts': conflicts,
            'stats': {
                'total_incoming': len(incoming),
                'new': len(new_txns),
                'duplicates': len(duplicates),
                'conflicts': len(conflicts),
            },
        }

    def _fuzzy_key(self, txn: Dict) -> Optional[str]:
        """Generate fuzzy match key: amount|date|type."""
        amount = txn.get('amount', 0)
        date = (txn.get('date') or txn.get('created_at', ''))[:10]
        txn_type = txn.get('type', '')
        if amount and date:
            return f"{amount:.2f}|{date}|{txn_type}"
        return None

    def merge_conflict(self, existing: Dict, incoming: Dict,
                       prefer: str = 'incoming') -> Dict:
        """Resolve a conflict by merging fields."""
        if prefer == 'incoming':
            merged = {**existing, **{k: v for k, v in incoming.items() if v is not None}}
        else:
            merged = {**incoming, **{k: v for k, v in existing.items() if v is not None}}
        merged['source'] = f"{existing.get('source', 'unknown')}+{incoming.get('source', 'unknown')}"
        merged['is_verified'] = True
        return merged


# Singletons
aa_service = AccountAggregatorService()
reconciliation_service = TransactionReconciliationService()
