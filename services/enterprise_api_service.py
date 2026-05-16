"""
Viya Phase 3: Enterprise + API Services
==========================================
US-705: GST Integration for freelancers
US-709: Open API for power users
US-710: Enterprise/SME multi-user with roles
"""

from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum
import hashlib
import secrets


# ══════════════════════════════════════════════════
# US-705: GST INTEGRATION
# ══════════════════════════════════════════════════

class GSTService:
    """GST tracking for freelancers and small businesses."""

    GST_RATES = {
        'software': 18,
        'consulting': 18,
        'design': 18,
        'advertising': 18,
        'food': 5,
        'restaurant': 5,
        'transport': 5,
        'healthcare': 0,
        'education': 0,
        'books': 0,
        'rent': 18,
        'electronics': 18,
        'clothing_under_1000': 5,
        'clothing_over_1000': 12,
        'luxury': 28,
    }

    def __init__(self):
        self.invoices = {}  # user -> [invoice]

    def calculate_gst(self, amount: float, category: str, is_inclusive: bool = True) -> Dict:
        """Calculate GST breakdown for an amount."""
        rate = self.GST_RATES.get(category, 18)
        if is_inclusive:
            base = round(amount / (1 + rate / 100), 2)
            gst = round(amount - base, 2)
        else:
            base = amount
            gst = round(amount * rate / 100, 2)

        cgst = round(gst / 2, 2)
        sgst = round(gst / 2, 2)

        return {
            'base_amount': base,
            'gst_rate': rate,
            'cgst': cgst,
            'sgst': sgst,
            'igst': gst,  # For inter-state
            'total': round(base + gst, 2),
            'is_inclusive': is_inclusive,
        }

    def quarterly_summary(self, user_phone: str, quarter: str = None) -> Dict:
        """Generate GSTR-3B ready quarterly summary."""
        invoices = self.invoices.get(user_phone, [])

        total_sales = sum(i.get('amount', 0) for i in invoices if i.get('type') == 'sales')
        total_purchases = sum(i.get('amount', 0) for i in invoices if i.get('type') == 'purchase')
        output_gst = sum(i.get('gst', 0) for i in invoices if i.get('type') == 'sales')
        input_gst = sum(i.get('gst', 0) for i in invoices if i.get('type') == 'purchase')
        net_gst = output_gst - input_gst

        return {
            'quarter': quarter or 'Q1',
            'total_sales': round(total_sales),
            'total_purchases': round(total_purchases),
            'output_gst': round(output_gst),
            'input_gst_credit': round(input_gst),
            'net_gst_payable': round(max(0, net_gst)),
            'itc_excess': round(max(0, -net_gst)),
            'invoice_count': len(invoices),
            'filing_deadline': self._get_deadline(quarter),
        }

    def _get_deadline(self, quarter: str) -> str:
        now = datetime.utcnow()
        fy = now.year if now.month >= 4 else now.year - 1
        deadlines = {
            'Q1': f'{fy}-07-31', 'Q2': f'{fy}-10-31',
            'Q3': f'{fy + 1}-01-31', 'Q4': f'{fy + 1}-04-30',
        }
        return deadlines.get(quarter, deadlines.get('Q1', ''))


# ══════════════════════════════════════════════════
# US-709: OPEN API FOR POWER USERS
# ══════════════════════════════════════════════════

class APIKeyManager:
    """Manage API keys for third-party integrations."""

    def __init__(self):
        self.keys = {}  # key_hash -> {user, scopes, ...}

    def create_key(self, user_phone: str, name: str,
                   scopes: List[str] = None) -> Dict:
        """Generate new API key with scoped permissions."""
        raw_key = f"viya_{secrets.token_hex(24)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        prefix = raw_key[:12]

        key_data = {
            'hash': key_hash,
            'prefix': prefix,
            'user_phone': user_phone,
            'name': name,
            'scopes': scopes or ['read:transactions', 'read:portfolio'],
            'created_at': datetime.utcnow().isoformat(),
            'last_used': None,
            'is_active': True,
            'rate_limit': 100,  # requests per minute
            'usage_count': 0,
        }
        self.keys[key_hash] = key_data

        return {
            'api_key': raw_key,  # Only shown once
            'prefix': prefix,
            'name': name,
            'scopes': key_data['scopes'],
            'rate_limit': key_data['rate_limit'],
            'warning': 'Save this key securely. It will not be shown again.',
        }

    def validate_key(self, raw_key: str) -> Optional[Dict]:
        """Validate API key and return user info."""
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_data = self.keys.get(key_hash)
        if not key_data or not key_data['is_active']:
            return None
        key_data['last_used'] = datetime.utcnow().isoformat()
        key_data['usage_count'] += 1
        return {
            'user_phone': key_data['user_phone'],
            'scopes': key_data['scopes'],
            'rate_limit': key_data['rate_limit'],
        }

    def list_keys(self, user_phone: str) -> List[Dict]:
        """List user's API keys (without secrets)."""
        return [
            {'prefix': k['prefix'], 'name': k['name'], 'scopes': k['scopes'],
             'created_at': k['created_at'], 'last_used': k['last_used'],
             'is_active': k['is_active'], 'usage_count': k['usage_count']}
            for k in self.keys.values()
            if k['user_phone'] == user_phone
        ]

    def revoke_key(self, user_phone: str, prefix: str) -> Dict:
        """Revoke an API key by prefix."""
        for k in self.keys.values():
            if k['prefix'] == prefix and k['user_phone'] == user_phone:
                k['is_active'] = False
                return {'status': 'revoked', 'prefix': prefix}
        return {'error': 'Key not found'}


AVAILABLE_SCOPES = [
    'read:transactions',
    'read:portfolio',
    'read:insights',
    'read:budget',
    'write:transactions',
    'write:categorize',
    'read:tax',
    'read:recurring',
]


# ══════════════════════════════════════════════════
# US-710: ENTERPRISE/SME MULTI-USER
# ══════════════════════════════════════════════════

class Role(Enum):
    OWNER = "owner"
    ADMIN = "admin"
    ACCOUNTANT = "accountant"
    VIEWER = "viewer"


ROLE_PERMISSIONS = {
    Role.OWNER: ['*'],
    Role.ADMIN: ['read:*', 'write:*', 'manage:users'],
    Role.ACCOUNTANT: ['read:*', 'write:transactions', 'write:categorize', 'read:tax'],
    Role.VIEWER: ['read:transactions', 'read:portfolio', 'read:budget'],
}


class EnterpriseManager:
    """Multi-user organization management with RBAC."""

    def __init__(self):
        self.orgs = {}  # org_id -> {name, members, ...}

    def create_org(self, owner_phone: str, name: str, gstin: str = '') -> Dict:
        org_id = f"org_{hashlib.sha256(f'{owner_phone}:{name}'.encode()).hexdigest()[:8]}"
        self.orgs[org_id] = {
            'id': org_id,
            'name': name,
            'gstin': gstin,
            'owner': owner_phone,
            'members': [{
                'phone': owner_phone,
                'role': Role.OWNER.value,
                'name': 'Owner',
                'added_at': datetime.utcnow().isoformat(),
            }],
            'created_at': datetime.utcnow().isoformat(),
            'plan': 'free',
            'limits': {'members': 5, 'api_calls': 10000},
        }
        return self.orgs[org_id]

    def add_member(self, org_id: str, phone: str, name: str,
                   role: str = 'viewer') -> Dict:
        org = self.orgs.get(org_id)
        if not org:
            return {'error': 'Organization not found'}
        if len(org['members']) >= org['limits']['members']:
            return {'error': f'Member limit reached ({org["limits"]["members"]})'}
        if role not in [r.value for r in Role]:
            return {'error': f'Invalid role. Use: {[r.value for r in Role]}'}

        org['members'].append({
            'phone': phone, 'role': role, 'name': name,
            'added_at': datetime.utcnow().isoformat(),
        })
        return {'status': 'added', 'member': name, 'role': role}

    def check_permission(self, org_id: str, phone: str,
                          permission: str) -> bool:
        """Check if user has permission in org."""
        org = self.orgs.get(org_id)
        if not org:
            return False

        for member in org['members']:
            if member['phone'] == phone:
                role = Role(member['role'])
                perms = ROLE_PERMISSIONS.get(role, [])
                if '*' in perms:
                    return True
                if permission in perms:
                    return True
                # Wildcard match: read:* matches read:transactions
                prefix = permission.split(':')[0]
                if f'{prefix}:*' in perms:
                    return True
                return False
        return False

    def get_org(self, org_id: str) -> Optional[Dict]:
        return self.orgs.get(org_id)

    def list_user_orgs(self, phone: str) -> List[Dict]:
        return [
            {'id': org['id'], 'name': org['name'], 'role': next(
                (m['role'] for m in org['members'] if m['phone'] == phone), None
            )}
            for org in self.orgs.values()
            if any(m['phone'] == phone for m in org['members'])
        ]


# Singletons
gst_service = GSTService()
api_key_manager = APIKeyManager()
enterprise_manager = EnterpriseManager()
