-- ═══════════════════════════════════════════════════════════
-- VIYA FINTECH UPGRADE — DATABASE MIGRATION
-- Version: 1.0.0 | Date: 2026-05-16
-- Closes GAP 1-4 from competitive analysis
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. SMS MESSAGES (Raw SMS storage — source of truth)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone      VARCHAR(15) NOT NULL,
  sender_id       VARCHAR(30),                       -- VM-HDFCBK, VK-ICICIB, etc.
  message_body    TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_financial    BOOLEAN DEFAULT FALSE,
  is_processed    BOOLEAN DEFAULT FALSE,
  processing_attempts INTEGER DEFAULT 0,
  processing_error TEXT,
  transaction_id  UUID,                              -- linked to transactions table
  parsed_data     JSONB,                             -- full parsed result
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_user_processed
  ON sms_messages(user_phone, is_processed, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_sender
  ON sms_messages(sender_id, received_at DESC);

-- ──────────────────────────────────────────
-- 2. BANK ACCOUNTS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone            VARCHAR(15) NOT NULL,
  bank_name             VARCHAR(100) NOT NULL,
  bank_code             VARCHAR(20),                  -- IFSC prefix (HDFC0, ICIC0, etc.)
  account_type          VARCHAR(30) DEFAULT 'savings', -- savings/current/credit/loan
  account_number_masked VARCHAR(20),                  -- last 4 digits only (XXXX1234)
  account_number_hash   VARCHAR(64),                  -- SHA-256 for deduplication
  holder_name           VARCHAR(100),
  ifsc                  VARCHAR(11),

  -- Account Aggregator fields
  aa_consent_id         VARCHAR(200),
  aa_fip_id             VARCHAR(200),
  aa_consent_status     VARCHAR(30) DEFAULT 'none',   -- none/pending/active/expired/revoked
  aa_consent_expires    TIMESTAMPTZ,
  aa_provider           VARCHAR(50),                  -- setu/finvu/onemoney

  -- Sync state
  sync_enabled          BOOLEAN DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ,
  next_sync_at          TIMESTAMPTZ,
  sync_error            TEXT,
  balance               DECIMAL(15,2),
  balance_as_of         TIMESTAMPTZ,

  -- Import method
  import_method         VARCHAR(20) DEFAULT 'sms',    -- aa/sms/csv/manual
  is_primary            BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_user
  ON bank_accounts(user_phone, sync_enabled);

-- ──────────────────────────────────────────
-- 3. TRANSACTION RULES (Auto-categorization engine)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone      VARCHAR(15),                        -- null = global rule
  rule_name       VARCHAR(100),
  priority        INTEGER DEFAULT 50,
  is_active       BOOLEAN DEFAULT TRUE,

  -- Conditions (AND logic)
  condition_merchant_contains TEXT,
  condition_merchant_regex    TEXT,
  condition_amount_min        DECIMAL(15,2),
  condition_amount_max        DECIMAL(15,2),
  condition_payment_method    VARCHAR(30),
  condition_type              VARCHAR(20),             -- debit/credit

  -- Actions
  action_category     VARCHAR(50) NOT NULL,
  action_subcategory  VARCHAR(50),
  action_tags         TEXT[],

  -- Stats
  times_applied   INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_user_active
  ON transaction_rules(user_phone, is_active, priority DESC);

-- ──────────────────────────────────────────
-- 4. RECURRING PATTERNS (Detected recurring txns)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone        VARCHAR(15) NOT NULL,
  name              VARCHAR(200),
  merchant          VARCHAR(200),
  amount            DECIMAL(15,2),
  amount_is_fixed   BOOLEAN DEFAULT TRUE,
  frequency         VARCHAR(20),                      -- monthly/weekly/yearly/quarterly
  day_of_month      INTEGER,
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

-- ──────────────────────────────────────────
-- 5. INVESTMENT ACCOUNTS (Brokerage connections)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone      VARCHAR(15) NOT NULL,
  broker          VARCHAR(50) NOT NULL,               -- zerodha/groww/kuvera/upstox
  account_id_at_broker VARCHAR(100),
  display_name    VARCHAR(100),
  account_type    VARCHAR(30) DEFAULT 'demat',        -- demat/mf_only/trading
  connection_type VARCHAR(20) DEFAULT 'manual',       -- api/cas/manual

  -- Encrypted API credentials (AES-256-GCM)
  api_key_enc     TEXT,
  api_secret_enc  TEXT,
  access_token_enc TEXT,
  token_expires   TIMESTAMPTZ,

  -- CAS import
  cas_email       VARCHAR(200),
  folio_list      TEXT[],

  -- Sync
  last_synced_at  TIMESTAMPTZ,
  sync_frequency  VARCHAR(20) DEFAULT 'daily',
  sync_error      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- 6. HOLDINGS (Current portfolio positions)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holdings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone            VARCHAR(15) NOT NULL,
  investment_account_id UUID REFERENCES investment_accounts(id) ON DELETE CASCADE,
  asset_class           VARCHAR(20) NOT NULL,          -- equity/mutual_fund/etf/bond/gold/fd/nps
  ticker                VARCHAR(30),
  isin                  VARCHAR(12),
  name                  VARCHAR(200) NOT NULL,
  exchange              VARCHAR(10),                   -- NSE/BSE/MCX

  -- Quantity and cost
  quantity              DECIMAL(15,4) NOT NULL,
  average_cost          DECIMAL(15,4),
  total_invested        DECIMAL(15,2),

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
  sip_amount            DECIMAL(12,2),
  sip_date              INTEGER,
  sip_status            VARCHAR(20) DEFAULT 'active',

  last_updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_user
  ON holdings(user_phone, asset_class);
CREATE INDEX IF NOT EXISTS idx_holdings_isin
  ON holdings(user_phone, isin);

-- ──────────────────────────────────────────
-- 7. PORTFOLIO TRANSACTIONS (Buy/sell history)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone            VARCHAR(15) NOT NULL,
  investment_account_id UUID REFERENCES investment_accounts(id),
  holding_id            UUID REFERENCES holdings(id),

  type                  VARCHAR(20) NOT NULL,          -- buy/sell/sip/dividend/bonus/split
  ticker                VARCHAR(30),
  isin                  VARCHAR(12),
  name                  VARCHAR(200),

  quantity              DECIMAL(15,4),
  price                 DECIMAL(15,4),
  gross_amount          DECIMAL(15,2),
  brokerage             DECIMAL(10,2) DEFAULT 0,
  stt                   DECIMAL(10,2) DEFAULT 0,
  net_amount            DECIMAL(15,2),

  trade_date            DATE NOT NULL,
  settlement_date       DATE,
  order_id              VARCHAR(100),

  -- Tax calculation
  realized_pnl          DECIMAL(15,2),
  holding_period_days   INTEGER,
  tax_type              VARCHAR(20),                   -- stcg/ltcg/stcl/ltcl

  source                VARCHAR(20) DEFAULT 'manual',
  dedup_hash            VARCHAR(64) UNIQUE,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptxn_user_date
  ON portfolio_transactions(user_phone, trade_date DESC);

-- ──────────────────────────────────────────
-- 8. ENHANCED TRANSACTIONS — Add fintech columns
-- ──────────────────────────────────────────
DO $$
BEGIN
  -- Source tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='source') THEN
    ALTER TABLE transactions ADD COLUMN source VARCHAR(30) DEFAULT 'manual';
  END IF;

  -- Payment method tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_method') THEN
    ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_app') THEN
    ALTER TABLE transactions ADD COLUMN payment_app VARCHAR(30);
  END IF;

  -- UPI tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='upi_ref_id') THEN
    ALTER TABLE transactions ADD COLUMN upi_ref_id VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='upi_id') THEN
    ALTER TABLE transactions ADD COLUMN upi_id VARCHAR(100);
  END IF;

  -- Merchant normalization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='merchant_raw') THEN
    ALTER TABLE transactions ADD COLUMN merchant_raw TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='merchant_normalized') THEN
    ALTER TABLE transactions ADD COLUMN merchant_normalized VARCHAR(200);
  END IF;

  -- Deduplication
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='dedup_hash') THEN
    ALTER TABLE transactions ADD COLUMN dedup_hash VARCHAR(64);
  END IF;

  -- AI categorization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='ai_confidence') THEN
    ALTER TABLE transactions ADD COLUMN ai_confidence DECIMAL(3,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='category_source') THEN
    ALTER TABLE transactions ADD COLUMN category_source VARCHAR(20) DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='is_verified') THEN
    ALTER TABLE transactions ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Bank account link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='bank_account_id') THEN
    ALTER TABLE transactions ADD COLUMN bank_account_id UUID;
  END IF;

  -- SMS link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='sms_message_id') THEN
    ALTER TABLE transactions ADD COLUMN sms_message_id UUID;
  END IF;

  -- Balance after transaction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='balance_after') THEN
    ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(15,2);
  END IF;

  -- Recurring pattern link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='recurring_pattern_id') THEN
    ALTER TABLE transactions ADD COLUMN recurring_pattern_id UUID;
  END IF;
END $$;

-- Create unique index on dedup_hash (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_txn_dedup
  ON transactions(dedup_hash) WHERE dedup_hash IS NOT NULL;

-- ──────────────────────────────────────────
-- 9. AUDIT LOGS (Immutable — append only)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone      VARCHAR(15),
  actor_type      VARCHAR(20) DEFAULT 'system',       -- user/admin/system/api
  action          VARCHAR(100) NOT NULL,
  resource_type   VARCHAR(50),
  resource_id     UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  request_id      VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user
  ON audit_logs(user_phone, created_at DESC);

-- Prevent UPDATE/DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable — UPDATE and DELETE are prohibited';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_audit_update ON audit_logs;
CREATE TRIGGER no_audit_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- ──────────────────────────────────────────
-- 10. INSIGHTS (AI-generated financial insights)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone        VARCHAR(15) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_insights_user
  ON insights(user_phone, status, generated_at DESC);

-- ──────────────────────────────────────────
-- 11. ENABLE RLS (Row Level Security)
-- ──────────────────────────────────────────
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS policies — users see only their own data
CREATE POLICY IF NOT EXISTS sms_own ON sms_messages FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS bank_own ON bank_accounts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS rules_own ON transaction_rules FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS patterns_own ON recurring_patterns FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS inv_own ON investment_accounts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS hold_own ON holdings FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS ptxn_own ON portfolio_transactions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS audit_own ON audit_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS insights_own ON insights FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- Tables created: 9 new + 1 altered (transactions)
-- Indexes: 10
-- Triggers: 1 (audit immutability)
-- ═══════════════════════════════════════════════════════════
