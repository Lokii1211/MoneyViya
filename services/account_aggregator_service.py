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
    'hdfc': {'fip_id': 'HDFC-FIP', 'name': 'HDFC Bank', 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'icici': {'fip_id': 'ICICI-FIP', 'name': 'ICICI Bank', 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'sbi': {'fip_id': 'SBI-FIP', 'name': 'State Bank of India', 'types': ['DEPOSIT']},
    'axis': {'fip_id': 'AXIS-FIP', 'name': 'Axis Bank', 'types': ['DEPOSIT', 'CREDIT_CARD']},
    'kotak': {'fip_id': 'KOTAK-FIP', 'name': 'Kotak Mahindra Bank', 'types': ['DEPOSIT']},
    'indusind': {'fip_id': 'INDUSIND-FIP', 'name': 'IndusInd Bank', 'types': ['DEPOSIT']},
    'yes': {'fip_id': 'YES-FIP', 'name': 'Yes Bank', 'types': ['DEPOSIT']},
    'idfc': {'fip_id': 'IDFC-FIP', 'name': 'IDFC First Bank', 'types': ['DEPOSIT']},
    'federal': {'fip_id': 'FEDERAL-FIP', 'name': 'Federal Bank', 'types': ['DEPOSIT']},
    'rbl': {'fip_id': 'RBL-FIP', 'name': 'RBL Bank', 'types': ['DEPOSIT']},
    # Mutual Funds
    'cams': {'fip_id': 'CAMS-FIP', 'name': 'CAMS (Mutual Funds)', 'types': ['MUTUAL_FUNDS']},
    'kfintech': {'fip_id': 'KFIN-FIP', 'name': 'KFintech (Mutual Funds)', 'types': ['MUTUAL_FUNDS']},
    # Insurance
    'lic': {'fip_id': 'LIC-FIP', 'name': 'LIC', 'types': ['INSURANCE']},
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

        # In-memory consent store (production: PostgreSQL)
        self.consents = {}  # consent_handle -> consent_data

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

        consent_data = {
            'handle': consent_handle,
            'user_phone': user_phone,
            'fip_id': fip_id,
            'status': ConsentStatus.PENDING.value,
            'created_at': now.isoformat(),
            'expires_at': (now + timedelta(days=365)).isoformat(),
            'data_range_months': data_range_months,
        }
        self.consents[consent_handle] = consent_data

        # Build redirect URL for user
        webview_url = f"{self.base_url}/consents/webview/{consent_handle}"

        return {
            'consent_handle': consent_handle,
            'webview_url': webview_url,
            'redirect_url': self.redirect_url,
            'status': 'pending',
            'expires_at': consent_data['expires_at'],
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

        if status == 'ACTIVE':
            # Trigger data fetch
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
        """Revoke an active consent — stops data sync."""
        consent = self.consents.get(consent_handle)
        if not consent:
            return {'error': 'Consent not found'}

        consent['status'] = ConsentStatus.REVOKED.value
        # In production: POST to Setu API to revoke
        return {'status': 'revoked', 'consent_handle': consent_handle}

    def get_user_consents(self, user_phone: str) -> List[Dict]:
        """Get all consents for a user."""
        return [
            c for c in self.consents.values()
            if c['user_phone'] == user_phone
        ]

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
