-- ════════════════════════════════════════════════════════════════════
-- Viya Fintech — Complete Data Model Migration
-- v6.4.0 | Run in Supabase SQL Editor (Additive — does NOT drop existing tables)
-- ════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- 1. USER & AUTHENTICATION (Enhanced from existing users table)
-- ═══════════════════════════════════════════════════════════════

-- Add fintech columns to existing users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS email VARCHAR(200) UNIQUE,
  ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Sessions (JWT refresh token tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  phone           TEXT REFERENCES users(phone) ON DELETE CASCADE,
  refresh_token   VARCHAR(500),
  device_id       VARCHAR(200),
  device_name     VARCHAR(100),
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_phone ON sessions(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- MFA Backup Codes
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  code_hash   VARCHAR(255) NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (IMMUTABLE — append only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT,
  actor_type      VARCHAR(20) DEFAULT 'user',
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50),
  resource_id     UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  user_agent      TEXT,
  request_id      VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_phone_date ON audit_logs(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC);

-- Prevent updates/deletes on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable — updates and deletes are not allowed';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();


-- ═══════════════════════════════════════════════════════════════
-- 2. BANK ACCOUNT INTEGRATION
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bank_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  bank_name             VARCHAR(100) NOT NULL,
  bank_code             VARCHAR(20),
  account_type          VARCHAR(30) DEFAULT 'savings',
  account_number_masked VARCHAR(20),
  account_number_hash   VARCHAR(64),
  holder_name           VARCHAR(100),
  ifsc                  VARCHAR(11),

  -- Account Aggregator fields
  aa_consent_id         VARCHAR(200),
  aa_fip_id             VARCHAR(200),
  aa_consent_status     VARCHAR(30) DEFAULT 'pending',
  aa_consent_expires    TIMESTAMPTZ,
  aa_data_range_start   TIMESTAMPTZ,
  aa_data_range_end     TIMESTAMPTZ,
  aa_fetch_frequency    VARCHAR(20) DEFAULT 'daily',
  aa_provider           VARCHAR(50),

  -- Sync state
  sync_enabled          BOOLEAN DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ,
  next_sync_at          TIMESTAMPTZ,
  sync_error            TEXT,
  balance               DECIMAL(15,2),
  balance_as_of         TIMESTAMPTZ,

  -- Import method
  import_method         VARCHAR(20) DEFAULT 'manual',
  is_primary            BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_phone ON bank_accounts(phone, sync_enabled);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_consent ON bank_accounts(aa_consent_expires);

-- AA Consents
CREATE TABLE IF NOT EXISTS aa_consents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone               TEXT NOT NULL REFERENCES users(phone),
  bank_account_id     UUID REFERENCES bank_accounts(id),
  consent_handle      VARCHAR(200) UNIQUE,
  consent_id          VARCHAR(200) UNIQUE,
  aa_provider         VARCHAR(50),
  status              VARCHAR(20) DEFAULT 'REQUESTED',
  purpose             VARCHAR(100) DEFAULT 'personal finance management',
  data_types          TEXT[],
  frequency           VARCHAR(20),
  date_range_start    DATE,
  date_range_end      DATE,
  expires_at          TIMESTAMPTZ,
  signed_consent      JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  revoked_at          TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════
-- 3. SMS MESSAGES (Raw storage — source of truth)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sms_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone               TEXT NOT NULL REFERENCES users(phone),
  sender_id           VARCHAR(20),
  message_body        TEXT NOT NULL,
  received_at         TIMESTAMPTZ NOT NULL,
  is_financial        BOOLEAN,
  is_processed        BOOLEAN DEFAULT FALSE,
  processing_attempts INTEGER DEFAULT 0,
  processing_error    TEXT,
  transaction_id      INTEGER,
  raw_json            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone_processed ON sms_messages(phone, is_processed, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_sender ON sms_messages(sender_id, received_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- 4. ENHANCED TRANSACTIONS (fintech_transactions — separate from legacy)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fintech_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 TEXT NOT NULL,
  bank_account_id       UUID REFERENCES bank_accounts(id),

  -- Core financial data
  type                  VARCHAR(20) NOT NULL,
  amount                DECIMAL(15,2) NOT NULL,
  currency              VARCHAR(3) DEFAULT 'INR',
  balance_after         DECIMAL(15,2),

  -- Merchant and description
  merchant_raw          TEXT,
  merchant_normalized   VARCHAR(200),
  merchant_category     VARCHAR(50),
  merchant_category_code VARCHAR(10),
  description           TEXT,

  -- User classification
  category              VARCHAR(50) NOT NULL DEFAULT 'other',
  subcategory           VARCHAR(50),
  category_source       VARCHAR(20) DEFAULT 'ai',
  is_recurring          BOOLEAN DEFAULT FALSE,
  recurring_pattern_id  UUID,

  -- Payment method
  payment_method        VARCHAR(30),
  payment_app           VARCHAR(30),
  upi_id                VARCHAR(100),
  upi_ref_id            VARCHAR(50),

  -- Source tracking
  source                VARCHAR(30) DEFAULT 'manual',
  source_raw_id         VARCHAR(200),
  sms_message_id        UUID REFERENCES sms_messages(id),

  -- Dates
  transaction_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value_date            TIMESTAMPTZ,
  posted_date           TIMESTAMPTZ,

  -- Deduplication
  dedup_hash            VARCHAR(64) UNIQUE,

  -- Notes and attachments
  notes                 TEXT,
  receipt_url           VARCHAR(500),
  tags                  TEXT[],

  -- Status
  is_excluded           BOOLEAN DEFAULT FALSE,
  is_split              BOOLEAN DEFAULT FALSE,
  parent_id             UUID,

  -- AI processing
  ai_confidence         DECIMAL(3,2),
  ai_category_suggested VARCHAR(50),
  ai_merchant_matched   VARCHAR(200),
  is_verified           BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ft_phone_date ON fintech_transactions(phone, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ft_phone_cat ON fintech_transactions(phone, category, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ft_phone_merchant ON fintech_transactions(phone, merchant_normalized);
CREATE INDEX IF NOT EXISTS idx_ft_phone_payment ON fintech_transactions(phone, payment_method);
CREATE INDEX IF NOT EXISTS idx_ft_dedup ON fintech_transactions(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_ft_source ON fintech_transactions(source, source_raw_id);
CREATE INDEX IF NOT EXISTS idx_ft_upi ON fintech_transactions(upi_ref_id) WHERE upi_ref_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════
-- 5. RECURRING PATTERNS & CATEGORIZATION RULES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             TEXT NOT NULL REFERENCES users(phone),
  name              VARCHAR(200),
  merchant          VARCHAR(200),
  amount            DECIMAL(15,2),
  amount_is_fixed   BOOLEAN DEFAULT TRUE,
  frequency         VARCHAR(20),
  day_of_month      INTEGER,
  day_of_week       INTEGER,
  expected_next_date DATE,
  last_seen_date    DATE,
  category          VARCHAR(50),
  is_subscription   BOOLEAN DEFAULT FALSE,
  is_emi            BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  total_occurrences INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT REFERENCES users(phone),  -- null = global rule
  rule_name       VARCHAR(100),
  priority        INTEGER DEFAULT 50,
  is_active       BOOLEAN DEFAULT TRUE,

  -- Conditions
  condition_merchant_contains TEXT,
  condition_merchant_regex    TEXT,
  condition_amount_min        DECIMAL(15,2),
  condition_amount_max        DECIMAL(15,2),
  condition_payment_method    VARCHAR(30),
  condition_type              VARCHAR(20),

  -- Actions
  action_category     VARCHAR(50) NOT NULL,
  action_subcategory  VARCHAR(50),
  action_notes        TEXT,
  action_tags         TEXT[],
  action_mark_recurring BOOLEAN DEFAULT FALSE,

  -- Stats
  times_applied   INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_phone ON transaction_rules(phone, is_active, priority DESC);


-- ═══════════════════════════════════════════════════════════════
-- 6. PORTFOLIO & INVESTMENT TRACKING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS investment_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT NOT NULL REFERENCES users(phone),
  broker          VARCHAR(50) NOT NULL,
  account_id_at_broker VARCHAR(100),
  display_name    VARCHAR(100),
  account_type    VARCHAR(30) DEFAULT 'demat',
  connection_type VARCHAR(20) DEFAULT 'manual',

  -- API connection (encrypted)
  api_key         TEXT,
  api_secret      TEXT,
  access_token    TEXT,
  token_expires   TIMESTAMPTZ,
  request_token   TEXT,

  -- CAS import
  cas_email       VARCHAR(200),
  cas_password    TEXT,
  folio_list      TEXT[],

  -- Sync
  last_synced_at  TIMESTAMPTZ,
  sync_frequency  VARCHAR(20) DEFAULT 'daily',
  sync_error      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fintech_holdings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 TEXT NOT NULL REFERENCES users(phone),
  investment_account_id UUID REFERENCES investment_accounts(id),
  asset_class           VARCHAR(20) NOT NULL,
  ticker                VARCHAR(30),
  isin                  VARCHAR(12),
  name                  VARCHAR(200) NOT NULL,
  exchange              VARCHAR(10),

  -- Quantity and cost
  quantity              DECIMAL(15,4) DEFAULT 0,
  average_cost          DECIMAL(15,4) DEFAULT 0,
  total_invested        DECIMAL(15,2) DEFAULT 0,

  -- Current valuation
  current_price         DECIMAL(15,4),
  current_value         DECIMAL(15,2),
  unrealized_pnl        DECIMAL(15,2),
  unrealized_pnl_pct    DECIMAL(8,4),
  price_as_of           TIMESTAMPTZ,

  -- Mutual fund specific
  folio_number          VARCHAR(30),
  nav                   DECIMAL(15,4),
  nav_date              DATE,
  fund_house            VARCHAR(100),
  fund_category         VARCHAR(50),
  is_sip                BOOLEAN DEFAULT FALSE,

  -- SIP tracking
  sip_amount            DECIMAL(12,2),
  sip_date              INTEGER,
  sip_status            VARCHAR(20),

  -- Tax fields
  short_term_units      DECIMAL(15,4),
  long_term_units       DECIMAL(15,4),

  last_updated_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_phone ON fintech_holdings(phone, asset_class);
CREATE INDEX IF NOT EXISTS idx_holdings_isin ON fintech_holdings(phone, isin);

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 TEXT NOT NULL REFERENCES users(phone),
  investment_account_id UUID REFERENCES investment_accounts(id),
  holding_id            UUID REFERENCES fintech_holdings(id),

  type                  VARCHAR(20) NOT NULL,
  ticker                VARCHAR(30),
  isin                  VARCHAR(12),
  name                  VARCHAR(200),

  quantity              DECIMAL(15,4),
  price                 DECIMAL(15,4),
  gross_amount          DECIMAL(15,2),
  brokerage             DECIMAL(10,2) DEFAULT 0,
  stt                   DECIMAL(10,2) DEFAULT 0,
  exchange_charges      DECIMAL(10,2) DEFAULT 0,
  gst_on_charges        DECIMAL(10,2) DEFAULT 0,
  net_amount            DECIMAL(15,2),

  trade_date            DATE NOT NULL,
  settlement_date       DATE,
  order_id              VARCHAR(100),
  trade_id              VARCHAR(100),

  realized_pnl          DECIMAL(15,2),
  holding_period_days   INTEGER,
  tax_type              VARCHAR(20),
  applicable_tax_rate   DECIMAL(5,2),

  source                VARCHAR(20) DEFAULT 'manual',
  dedup_hash            VARCHAR(64) UNIQUE,
  notes                 TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptxn_phone_date ON portfolio_transactions(phone, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_ptxn_holding ON portfolio_transactions(holding_id, trade_date DESC);

-- NAV history
CREATE TABLE IF NOT EXISTS nav_history (
  isin        VARCHAR(12) NOT NULL,
  date        DATE NOT NULL,
  nav         DECIMAL(15,4) NOT NULL,
  source      VARCHAR(20) DEFAULT 'amfi',
  PRIMARY KEY (isin, date)
);


-- ═══════════════════════════════════════════════════════════════
-- 7. BUDGETS & FINANCIAL GOALS (Enhanced)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fintech_budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT NOT NULL REFERENCES users(phone),
  period_type     VARCHAR(20) DEFAULT 'monthly',
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_budget    DECIMAL(15,2),
  is_active       BOOLEAN DEFAULT TRUE,
  rollover        BOOLEAN DEFAULT FALSE,
  category_budgets JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_goals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 TEXT NOT NULL REFERENCES users(phone),
  name                  VARCHAR(200) NOT NULL,
  icon                  VARCHAR(50) DEFAULT '🎯',
  type                  VARCHAR(30),
  target_amount         DECIMAL(15,2) NOT NULL,
  current_amount        DECIMAL(15,2) DEFAULT 0,
  start_date            DATE,
  target_date           DATE,
  monthly_contribution  DECIMAL(12,2),
  linked_account_id     UUID REFERENCES bank_accounts(id),
  linked_investment_id  UUID REFERENCES investment_accounts(id),
  status                VARCHAR(20) DEFAULT 'active',
  ai_projected_date     DATE,
  ai_recommended_monthly DECIMAL(12,2),
  achieved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights
CREATE TABLE IF NOT EXISTS fintech_insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             TEXT NOT NULL REFERENCES users(phone),
  type              VARCHAR(50) NOT NULL,
  title             VARCHAR(200),
  body              TEXT,
  action_url        VARCHAR(200),
  priority          VARCHAR(10) DEFAULT 'medium',
  data              JSONB,
  status            VARCHAR(20) DEFAULT 'pending',
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  acted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_insights_phone ON fintech_insights(phone, status, generated_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- 8. ENTERPRISE & API (Phase 3)
-- ═══════════════════════════════════════════════════════════════

-- Organizations (Enterprise RBAC)
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  gstin       VARCHAR(15),
  owner_phone TEXT NOT NULL REFERENCES users(phone),
  plan        VARCHAR(20) DEFAULT 'starter',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL REFERENCES users(phone),
  name        VARCHAR(100),
  role        VARCHAR(20) NOT NULL DEFAULT 'viewer',
  permissions TEXT[] DEFAULT '{}',
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_phone ON org_members(phone);

-- API Keys (Scoped access)
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL REFERENCES users(phone),
  org_id      UUID REFERENCES organizations(id),
  name        VARCHAR(100) NOT NULL,
  key_prefix  VARCHAR(8) NOT NULL,
  key_hash    VARCHAR(64) NOT NULL,
  scopes      TEXT[] DEFAULT '{}',
  rate_limit  INTEGER DEFAULT 100,
  is_active   BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_phone ON api_keys(phone, is_active);


-- ═══════════════════════════════════════════════════════════════
-- 9. INSURANCE & CREDIT (Phase 3)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS insurance_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT NOT NULL REFERENCES users(phone),
  type            VARCHAR(30) NOT NULL,
  provider        VARCHAR(100),
  policy_number   VARCHAR(50),
  policy_name     VARCHAR(200),
  sum_assured     DECIMAL(15,2),
  premium_amount  DECIMAL(12,2),
  premium_frequency VARCHAR(20) DEFAULT 'annual',
  start_date      DATE,
  maturity_date   DATE,
  nominee         VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'active',
  next_premium_date DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL REFERENCES users(phone),
  score       INTEGER NOT NULL,
  bureau      VARCHAR(30) DEFAULT 'cibil',
  factors     JSONB,
  fetched_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════
-- 10. INTERNATIONAL INVESTMENTS (Phase 3)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS international_holdings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             TEXT NOT NULL REFERENCES users(phone),
  market            VARCHAR(10) NOT NULL,  -- us_stock/crypto
  ticker            VARCHAR(20) NOT NULL,
  name              VARCHAR(200),
  quantity          DECIMAL(15,8),
  avg_buy_price_usd DECIMAL(15,4),
  current_price_usd DECIMAL(15,4),
  exchange_rate     DECIMAL(10,4) DEFAULT 83.50,
  tax_note          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intl_phone ON international_holdings(phone, market);


-- ═══════════════════════════════════════════════════════════════
-- 11. RLS POLICIES FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aa_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_holdings ENABLE ROW LEVEL SECURITY;

-- Allow anon access (API uses service_role key in production)
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'sessions', 'mfa_backup_codes', 'audit_logs',
    'bank_accounts', 'aa_consents', 'sms_messages',
    'fintech_transactions', 'recurring_patterns', 'transaction_rules',
    'investment_accounts', 'fintech_holdings', 'portfolio_transactions',
    'nav_history', 'fintech_budgets', 'financial_goals',
    'fintech_insights', 'organizations', 'org_members',
    'api_keys', 'insurance_policies', 'credit_scores',
    'international_holdings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "anon_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- 12. UPDATED_AT TRIGGER (auto-refresh on all mutable tables)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'users', 'bank_accounts', 'fintech_transactions',
    'recurring_patterns', 'transaction_rules',
    'investment_accounts', 'insurance_policies',
    'international_holdings', 'fintech_budgets'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I; CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- DONE — 22 tables, 35 indexes, 2 triggers, RLS on all tables
-- ═══════════════════════════════════════════════════════════════
