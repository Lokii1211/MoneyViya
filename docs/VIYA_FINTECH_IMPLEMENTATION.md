# VIYA AI — COMPLETE FINTECH UPGRADE IMPLEMENTATION PLAN
## Beating SpendByMe, Mojeck Money & Litrellay — End-to-End Build Prompt
## For Claude Opus 4.6 / Antigravity: Build Every Feature, Every Flow

---

## RESEARCH FINDINGS — WHAT THE COMPETITION DOES BETTER

```
COMPETITIVE GAP ANALYSIS (May 2026):

SpendByMe, Mojeck Money, and Litrellay have cracked four things we haven't:

GAP 1: AUTOMATIC TRANSACTION CAPTURE
  They do: Read bank SMS the moment it arrives → categorize → show instantly
  We do: User manually enters transactions
  User impact: Users leave because manual entry is 10x more friction

GAP 2: UPI TRANSACTION AUTO-TRACKING
  They do: Detect every GPay/PhonePe/BHIM/Paytm transaction from SMS
  We do: Nothing automatic
  User impact: 70%+ of Indian transactions are UPI — we miss all of them

GAP 3: BROKERAGE ACCOUNT SYNC
  They do: Connect Zerodha/Groww/Kuvera/Upstox → live portfolio values
  We do: Manual stock entry
  User impact: Investment users leave immediately (this is their primary need)

GAP 4: ACCOUNT AGGREGATOR INTEGRATION
  They do: Connect all bank accounts via RBI-regulated AA framework
  We do: No bank connectivity at all
  India reality: 2.61 billion accounts are AA-enabled (Dec 2025 data)
              252.9 million users already have linked accounts
  User impact: We look 3 years behind competitors

THE PLAN:
Close all 4 gaps in 12 weeks. Surpass competitors in 24 weeks.
Then add features they don't have (email intelligence, proactive AI).
That's the competitive moat.
```

---

## PART 1: PRODUCT REQUIREMENTS DOCUMENT

### 1.1 Vision

```
FROM: Manual expense tracker with limited intelligence
TO:   India's most complete automatic financial command center

COMPETITIVE PROMISE:
"Viya knows every rupee that moves in your financial life —
 automatically, accurately, instantly."

KPI TARGETS (12-month):
  Retention Day-7:      55% (from current 35%)
  Retention Day-30:     40% (from current 22%)
  Feature Adoption:     70% connect at least one bank/brokerage (our key metric)
  Net Promoter Score:   65+
  Revenue (MRR):        ₹5 Crore by Month 12
  Play Store Rating:    4.7+
  Auto-capture rate:    90% of user transactions captured without manual input
```

### 1.2 Phase Structure

```
PHASE 1 — MVP (Weeks 1-8): CLOSE THE GAP
  Goal: Match competitors on core automatic tracking
  Features:
    ✅ SMS-based transaction auto-capture (bank + UPI)
    ✅ Account Aggregator bank sync (Setu/Finvu API)
    ✅ Manual CSV/OFX import fallback
    ✅ Auto-categorization engine (ML + rules)
    ✅ Brokerage sync (Zerodha/Groww/Kuvera)
    ✅ Portfolio tracker with live valuations
    ✅ Cash flow dashboard
    ✅ Transaction reconciliation
    ✅ Security: MFA, encryption, audit logs

PHASE 2 — GROWTH (Weeks 9-16): PULL AHEAD
  Goal: Features competitors don't have
  Features:
    ✅ Email intelligence (bill detection, investment emails)
    ✅ Multi-account household management
    ✅ AI-powered insights engine
    ✅ Tax-ready reports (ITR prep, capital gains)
    ✅ Investment performance analytics (XIRR, Sharpe ratio)
    ✅ Budget alerts and goal tracking
    ✅ Subscription detection and management
    ✅ SIP tracking and projection

PHASE 3 — SCALE (Weeks 17-24): DOMINATE
  Goal: Features no competitor offers
  Features:
    ✅ Proactive financial intelligence (predict problems before they happen)
    ✅ AI financial advisor (personalized investment recommendations)
    ✅ Tax optimization recommendations
    ✅ Cross-platform data (GST, ITR, EPF, NPS integration)
    ✅ Family finance mode
    ✅ Enterprise/SME features
    ✅ API access for power users
```

---

## PART 2: SYSTEM ARCHITECTURE

### 2.1 Architecture Overview

```
HIGH-LEVEL SYSTEM ARCHITECTURE:

┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                │
│  React Native App    WhatsApp Bot    Progressive Web App        │
└─────────────────────┬───────────────┬───────────────────────────┘
                      │               │
                      ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY (AWS API Gateway + CloudFront)         │
│  Rate limiting | Auth validation | Request routing | WAF        │
└──────────────┬───────────────┬─────────────────────────────────┘
               │               │
    ┌──────────▼───┐   ┌───────▼──────────┐
    │  Core API    │   │  Data Ingestion   │
    │  (NestJS)    │   │  Service (NestJS) │
    └──────────────┘   └───────────────────┘
               │               │
    ┌──────────▼───────────────▼──────────────────────────────────┐
    │                   SERVICE LAYER                             │
    │                                                             │
    │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
    │  │ Transaction │  │  Portfolio  │  │   Intelligence     │  │
    │  │   Service   │  │   Service   │  │     Service        │  │
    │  └─────────────┘  └─────────────┘  └────────────────────┘  │
    │                                                             │
    │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
    │  │ SMS Parser  │  │ AA Connector│  │ Brokerage Adapters │  │
    │  │   Service   │  │   Service   │  │     Service        │  │
    │  └─────────────┘  └─────────────┘  └────────────────────┘  │
    │                                                             │
    │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
    │  │   Notify    │  │   Budget    │  │    Tax Engine      │  │
    │  │   Service   │  │   Service   │  │      Service       │  │
    │  └─────────────┘  └─────────────┘  └────────────────────┘  │
    └──────────────────────────────────────────────────────────────┘
               │               │              │
    ┌──────────▼───────────────▼──────────────▼──────────────────┐
    │                    DATA LAYER                               │
    │  PostgreSQL 16    Redis 7     S3/R2       ElasticSearch     │
    │  (primary OLTP)   (cache)    (files)     (transaction search)│
    └─────────────────────────────────────────────────────────────┘
               │
    ┌──────────▼───────────────────────────────────────────────────┐
    │              EXTERNAL INTEGRATIONS                           │
    │  Setu/Finvu AA    NSE/BSE Feed    Zerodha Kite API          │
    │  MF Central API   Groww API       Razorpay (subscriptions)  │
    │  Twilio (SMS)     FCM (push)      WhatsApp Business API     │
    └─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

```
BACKEND:
  Framework:     NestJS 10+ (TypeScript, dependency injection, modular)
  Runtime:       Node.js 20 LTS
  API Protocol:  REST (primary) + GraphQL (analytics/dashboard)
  Queue:         BullMQ + Redis (background job processing)
  Scheduler:     @nestjs/schedule (cron jobs for bank sync)
  Validation:    class-validator + class-transformer
  Documentation: Swagger/OpenAPI (auto-generated)

  WHY NestJS OVER EXPRESS:
    - Modular architecture (services stay independent)
    - TypeScript native (type safety for financial data = critical)
    - Dependency injection (testable, maintainable)
    - Built-in support for microservices (Phase 3 extraction)
    - Guards for auth/RBAC (cleaner than Express middleware)

FRONTEND (Mobile):
  Framework:     React Native 0.73 + Expo SDK 50
  State:         Zustand + TanStack Query
  Local DB:      WatermelonDB (offline-first)
  Navigation:    React Navigation 6

FRONTEND (Web):
  Framework:     Next.js 14 (App Router)
  State:         Zustand + TanStack Query
  UI:            shadcn/ui + Tailwind CSS
  Charts:        Recharts + Tremor (admin dashboard)

DATABASE:
  Primary:       PostgreSQL 16 (financial data, ACID transactions)
  Cache:         Redis 7 (sessions, job queues, rate limiting)
  Search:        PostgreSQL FTS + pgvector (semantic transaction search)
  TimeSeries:    PostgreSQL with TimescaleDB extension (portfolio history)
  Files:         Cloudflare R2 (CSV imports, statements, documents)

SECURITY:
  Auth:          JWT (access 15min) + Refresh (7 days) + Redis blacklist
  MFA:           TOTP via @nestjs/speakeasy
  Encryption:    AES-256-GCM at field level for PII
  Secrets:       AWS Secrets Manager
  API Security:  Helmet, CORS, rate limiting, request signing

INFRASTRUCTURE:
  Cloud:         AWS (primary) + Cloudflare (CDN/DDoS)
  Containers:    Docker + AWS ECS Fargate
  IaC:           Terraform
  CI/CD:         GitHub Actions
  Monitoring:    Datadog + Sentry
```

---

## PART 3: COMPLETE DATA MODELS

### 3.1 User and Authentication

```sql
═══════════════════════════════════════════════════════════
TABLE: users
═══════════════════════════════════════════════════════════
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
phone                 VARCHAR(15) UNIQUE NOT NULL         -- PII — encrypted
email                 VARCHAR(200) UNIQUE                 -- PII — encrypted
name                  VARCHAR(100)                        -- PII
password_hash         VARCHAR(255)                        -- bcrypt, 12 rounds
mfa_secret            VARCHAR(100)                        -- TOTP secret encrypted
mfa_enabled           BOOLEAN DEFAULT FALSE
preferred_language    VARCHAR(10) DEFAULT 'en'
timezone              VARCHAR(50) DEFAULT 'Asia/Kolkata'
currency              VARCHAR(3) DEFAULT 'INR'
plan                  VARCHAR(20) DEFAULT 'free'          -- free/premium/enterprise
plan_expires_at       TIMESTAMP
kyc_status            VARCHAR(20) DEFAULT 'pending'       -- for AA consent
onboarding_completed  BOOLEAN DEFAULT FALSE
last_login_at         TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
deleted_at            TIMESTAMP                           -- soft delete

═══════════════════════════════════════════════════════════
TABLE: sessions (JWT refresh token tracking)
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
refresh_token   VARCHAR(500)                    -- hashed
device_id       VARCHAR(200)
device_name     VARCHAR(100)
ip_address      INET
user_agent      TEXT
expires_at      TIMESTAMP
revoked_at      TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: mfa_backup_codes
═══════════════════════════════════════════════════════════
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
code_hash   VARCHAR(255)
used_at     TIMESTAMP
created_at  TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: audit_logs (IMMUTABLE — append only)
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID                            -- nullable (for system events)
actor_type      VARCHAR(20)                     -- user/admin/system/api
action          VARCHAR(100) NOT NULL           -- login/transaction_created/consent_granted
resource_type   VARCHAR(50)                     -- user/transaction/account/consent
resource_id     UUID
old_value       JSONB                           -- before state
new_value       JSONB                           -- after state
ip_address      INET
user_agent      TEXT
request_id      VARCHAR(100)
created_at      TIMESTAMP DEFAULT NOW()         -- never updated

INDEX: (user_id, created_at DESC)
INDEX: (resource_type, resource_id)
INDEX: (action, created_at DESC)
RULE: NO UPDATE OR DELETE EVER (enforce via PostgreSQL trigger)
```

### 3.2 Bank Account Integration

```sql
═══════════════════════════════════════════════════════════
TABLE: bank_accounts
═══════════════════════════════════════════════════════════
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
bank_name             VARCHAR(100) NOT NULL
bank_code             VARCHAR(20)                 -- IFSC prefix
account_type          VARCHAR(30)                 -- savings/current/credit/loan
account_number_masked VARCHAR(20)                 -- last 4 digits only
account_number_hash   VARCHAR(64)                 -- SHA-256 for deduplication
holder_name           VARCHAR(100)
ifsc                  VARCHAR(11)

-- Account Aggregator fields
aa_consent_id         VARCHAR(200)
aa_fip_id             VARCHAR(200)                -- Financial Info Provider ID
aa_consent_status     VARCHAR(30)                 -- pending/active/expired/revoked
aa_consent_expires    TIMESTAMP
aa_data_range_start   TIMESTAMP
aa_data_range_end     TIMESTAMP
aa_fetch_frequency    VARCHAR(20)                 -- daily/weekly/monthly
aa_provider           VARCHAR(50)                 -- setu/finvu/onemoney

-- Sync state
sync_enabled          BOOLEAN DEFAULT TRUE
last_synced_at        TIMESTAMP
next_sync_at          TIMESTAMP
sync_error            TEXT
balance               DECIMAL(15,2)               -- cached balance
balance_as_of         TIMESTAMP

-- Manual/CSV import fallback
import_method         VARCHAR(20)                 -- aa/sms/csv/manual
is_primary            BOOLEAN DEFAULT FALSE

created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

INDEX: (user_id, sync_enabled)
INDEX: (aa_consent_expires) -- for renewal alerts

═══════════════════════════════════════════════════════════
TABLE: aa_consents (Consent management)
═══════════════════════════════════════════════════════════
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
bank_account_id     UUID REFERENCES bank_accounts(id)
consent_handle      VARCHAR(200) UNIQUE         -- AA-issued handle
consent_id          VARCHAR(200) UNIQUE
aa_provider         VARCHAR(50)
status              VARCHAR(20)                 -- REQUESTED/ACTIVE/PAUSED/REVOKED/EXPIRED
purpose             VARCHAR(100)                -- personal finance management
data_types          TEXT[]                      -- DEPOSIT/TERM_DEPOSIT/RECURRING_DEPOSIT
frequency           VARCHAR(20)                 -- DAILY/MONTHLY/etc.
date_range_start    DATE
date_range_end      DATE
expires_at          TIMESTAMP
signed_consent      JSONB                       -- full consent artefact
created_at          TIMESTAMP DEFAULT NOW()
revoked_at          TIMESTAMP
```

### 3.3 Transaction Core

```sql
═══════════════════════════════════════════════════════════
TABLE: transactions (PARTITIONED BY MONTH)
═══════════════════════════════════════════════════════════
id                    UUID DEFAULT gen_random_uuid()
user_id               UUID NOT NULL
bank_account_id       UUID REFERENCES bank_accounts(id)

-- Core financial data
type                  VARCHAR(20) NOT NULL        -- credit/debit/transfer
amount                DECIMAL(15,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'INR'
balance_after         DECIMAL(15,2)               -- running balance

-- Merchant and description
merchant_raw          TEXT                        -- raw text from SMS/API
merchant_normalized   VARCHAR(200)                -- cleaned merchant name
merchant_category     VARCHAR(50)                 -- Viya's category
merchant_category_code VARCHAR(10)                -- MCC code if available
description           TEXT                        -- additional notes

-- User classification
category              VARCHAR(50) NOT NULL        -- final category (user-confirmed or AI)
subcategory           VARCHAR(50)
category_source       VARCHAR(20)                 -- ai/user/rule/sms_pattern
is_recurring          BOOLEAN DEFAULT FALSE
recurring_pattern_id  UUID

-- Payment method
payment_method        VARCHAR(30)                 -- upi/debit_card/credit_card/neft/rtgs/imps/cash
payment_app           VARCHAR(30)                 -- gpay/phonepe/paytm/bhim/netbanking
upi_id                VARCHAR(100)                -- recipient/sender UPI ID
upi_ref_id            VARCHAR(50)                 -- UPI transaction ref (unique)

-- Source tracking
source                VARCHAR(30)                 -- sms/aa_api/csv_import/manual/email/brokerage
source_raw_id         VARCHAR(200)                -- original message ID / AA txn ID
sms_message_id        UUID REFERENCES sms_messages(id)

-- Dates
transaction_date      TIMESTAMP NOT NULL
value_date            TIMESTAMP
posted_date           TIMESTAMP

-- Deduplication (CRITICAL — same txn may arrive from SMS + AA)
dedup_hash            VARCHAR(64) UNIQUE          -- SHA-256(user_id+amount+date+type+upi_ref_or_description)

-- Notes and attachments
notes                 TEXT                        -- user notes
receipt_url           VARCHAR(500)                -- R2 URL
tags                  TEXT[]

-- Status
is_excluded           BOOLEAN DEFAULT FALSE       -- exclude from reports
is_split              BOOLEAN DEFAULT FALSE       -- was split into sub-transactions
parent_id             UUID                        -- if this is a split

-- AI processing
ai_confidence         DECIMAL(3,2)               -- 0.00-1.00
ai_category_suggested VARCHAR(50)
ai_merchant_matched   VARCHAR(200)
is_verified           BOOLEAN DEFAULT FALSE       -- user confirmed category

created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
deleted_at            TIMESTAMP

-- PARTITION BY transaction_date (monthly partitions)
) PARTITION BY RANGE (transaction_date);

-- Automatic partition creation (pg_partman)
INDEXES:
  (user_id, transaction_date DESC)           -- most common query
  (user_id, category, transaction_date DESC) -- category analysis
  (user_id, merchant_normalized)             -- merchant lookup
  (user_id, payment_method)                  -- payment method filter
  (dedup_hash)                               -- deduplication
  (source, source_raw_id)                   -- import dedup
  (upi_ref_id) WHERE upi_ref_id IS NOT NULL -- UPI lookup

═══════════════════════════════════════════════════════════
TABLE: sms_messages (Raw SMS storage — source of truth)
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
sender_id       VARCHAR(20)                     -- VM-HDFCBK, VK-ICICIB, etc.
message_body    TEXT NOT NULL
received_at     TIMESTAMP NOT NULL
is_financial    BOOLEAN                         -- AI classification
is_processed    BOOLEAN DEFAULT FALSE
processing_attempts INTEGER DEFAULT 0
processing_error TEXT
transaction_id  UUID REFERENCES transactions(id)
raw_json        JSONB                           -- full SMS data
created_at      TIMESTAMP DEFAULT NOW()

INDEX: (user_id, is_processed, received_at DESC)
INDEX: (sender_id, received_at DESC)

═══════════════════════════════════════════════════════════
TABLE: recurring_patterns (Detected recurring transactions)
═══════════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
name              VARCHAR(200)
merchant          VARCHAR(200)
amount            DECIMAL(15,2)
amount_is_fixed   BOOLEAN DEFAULT TRUE
frequency         VARCHAR(20)                   -- monthly/weekly/yearly/quarterly
day_of_month      INTEGER
day_of_week       INTEGER
expected_next_date DATE
last_seen_date    DATE
category          VARCHAR(50)
is_subscription   BOOLEAN DEFAULT FALSE
is_emi            BOOLEAN DEFAULT FALSE
is_active         BOOLEAN DEFAULT TRUE
total_occurrences INTEGER DEFAULT 0
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: transaction_rules (Auto-categorization rules)
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)       -- null = global rule
rule_name       VARCHAR(100)
priority        INTEGER DEFAULT 50              -- higher = applied first
is_active       BOOLEAN DEFAULT TRUE

-- Conditions (all must match — AND logic)
condition_merchant_contains TEXT
condition_merchant_regex    TEXT
condition_amount_min        DECIMAL(15,2)
condition_amount_max        DECIMAL(15,2)
condition_payment_method    VARCHAR(30)
condition_type              VARCHAR(20)         -- debit/credit

-- Actions
action_category     VARCHAR(50) NOT NULL
action_subcategory  VARCHAR(50)
action_notes        TEXT
action_tags         TEXT[]
action_mark_recurring BOOLEAN DEFAULT FALSE

-- Stats
times_applied   INTEGER DEFAULT 0
last_applied_at TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

INDEX: (user_id, is_active, priority DESC)
```

### 3.4 Portfolio and Investment Tracking

```sql
═══════════════════════════════════════════════════════════
TABLE: investment_accounts (Brokerage connections)
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
broker          VARCHAR(50)                     -- zerodha/groww/kuvera/upstox/paytm_money/iifl
account_id_at_broker VARCHAR(100)              -- broker's account ID
display_name    VARCHAR(100)
account_type    VARCHAR(30)                     -- demat/mf_only/trading
connection_type VARCHAR(20)                     -- api/cas/manual

-- API connection (Zerodha Kite / Groww / etc.)
api_key         TEXT                            -- encrypted
api_secret      TEXT                            -- encrypted
access_token    TEXT                            -- encrypted, short-lived
token_expires   TIMESTAMP
request_token   TEXT                            -- temporary during auth

-- CAS import (Consolidated Account Statement)
cas_email       VARCHAR(200)                    -- CAMS/KFintech email
cas_password    TEXT                            -- encrypted, for CAS download
folio_list      TEXT[]                          -- all folio numbers

-- Sync
last_synced_at  TIMESTAMP
sync_frequency  VARCHAR(20)                     -- realtime/daily/weekly
sync_error      TEXT
is_active       BOOLEAN DEFAULT TRUE

created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: holdings (Current portfolio positions)
═══════════════════════════════════════════════════════════
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
investment_account_id UUID REFERENCES investment_accounts(id)
asset_class         VARCHAR(20)                 -- equity/mutual_fund/etf/bond/gold/fd/nps
ticker              VARCHAR(30)                 -- NSE/BSE ticker or ISIN
isin                VARCHAR(12)                 -- ISIN code
name                VARCHAR(200)                -- human readable name
exchange            VARCHAR(10)                 -- NSE/BSE/MCX

-- Quantity and cost
quantity            DECIMAL(15,4)               -- units/shares
average_cost        DECIMAL(15,4)               -- per unit/share
total_invested      DECIMAL(15,2)               -- quantity × avg_cost

-- Current valuation (refreshed by sync)
current_price       DECIMAL(15,4)
current_value       DECIMAL(15,2)               -- quantity × current_price
unrealized_pnl      DECIMAL(15,2)               -- current_value - total_invested
unrealized_pnl_pct  DECIMAL(8,4)
price_as_of         TIMESTAMP

-- Mutual fund specific
folio_number        VARCHAR(30)
nav                 DECIMAL(15,4)
nav_date            DATE
fund_house          VARCHAR(100)
fund_category       VARCHAR(50)                 -- large_cap/elss/liquid/etc.
is_sip              BOOLEAN DEFAULT FALSE

-- SIP tracking
sip_amount          DECIMAL(12,2)
sip_date            INTEGER                     -- day of month
sip_status          VARCHAR(20)                 -- active/paused/stopped

-- For tax calculation
short_term_units    DECIMAL(15,4)               -- held < 1 year (equity) or < 3 years (debt)
long_term_units     DECIMAL(15,4)

last_updated_at     TIMESTAMP
created_at          TIMESTAMP DEFAULT NOW()

INDEX: (user_id, asset_class)
INDEX: (user_id, isin)
INDEX: (investment_account_id)

═══════════════════════════════════════════════════════════
TABLE: portfolio_transactions (Historical buy/sell)
═══════════════════════════════════════════════════════════
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id)
investment_account_id UUID REFERENCES investment_accounts(id)
holding_id            UUID REFERENCES holdings(id)

type                  VARCHAR(20)               -- buy/sell/sip/dividend/bonus/split/switch
ticker                VARCHAR(30)
isin                  VARCHAR(12)
name                  VARCHAR(200)

quantity              DECIMAL(15,4)
price                 DECIMAL(15,4)             -- per unit/share
gross_amount          DECIMAL(15,2)
brokerage             DECIMAL(10,2)
stt                   DECIMAL(10,2)             -- Securities Transaction Tax
exchange_charges      DECIMAL(10,2)
gst_on_charges        DECIMAL(10,2)
net_amount            DECIMAL(15,2)

trade_date            DATE NOT NULL
settlement_date       DATE
order_id              VARCHAR(100)              -- broker order ID
trade_id              VARCHAR(100)              -- unique trade reference

-- For cost basis calculation
realized_pnl          DECIMAL(15,2)             -- on sell transactions
holding_period_days   INTEGER
tax_type              VARCHAR(20)               -- stcg/ltcg/stcl/ltcl
applicable_tax_rate   DECIMAL(5,2)

source                VARCHAR(20)               -- api/cas/manual
dedup_hash            VARCHAR(64) UNIQUE
notes                 TEXT

created_at            TIMESTAMP DEFAULT NOW()

INDEX: (user_id, trade_date DESC)
INDEX: (holding_id, trade_date DESC)
INDEX: (isin, trade_date DESC)

═══════════════════════════════════════════════════════════
TABLE: price_history (TimescaleDB extension)
═══════════════════════════════════════════════════════════
time        TIMESTAMPTZ NOT NULL            -- TimescaleDB time column
ticker      VARCHAR(30) NOT NULL
exchange    VARCHAR(10)
open        DECIMAL(15,4)
high        DECIMAL(15,4)
low         DECIMAL(15,4)
close       DECIMAL(15,4)
volume      BIGINT
-- TimescaleDB hypertable, chunked by 7 days

INDEX: (ticker, time DESC) -- TimescaleDB handles this optimally

═══════════════════════════════════════════════════════════
TABLE: nav_history (Mutual Fund NAV)
═══════════════════════════════════════════════════════════
isin        VARCHAR(12) NOT NULL
date        DATE NOT NULL
nav         DECIMAL(15,4) NOT NULL
source      VARCHAR(20)                     -- amfi/mfcentral/api
PRIMARY KEY (isin, date)
```

### 3.5 Budgets, Goals, and Intelligence

```sql
═══════════════════════════════════════════════════════════
TABLE: budgets
═══════════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
period_type     VARCHAR(20)                     -- monthly/weekly/custom
period_start    DATE NOT NULL
period_end      DATE NOT NULL
total_budget    DECIMAL(15,2)
is_active       BOOLEAN DEFAULT TRUE
rollover        BOOLEAN DEFAULT FALSE            -- unused budget rolls over

-- Category-level budgets
category_budgets JSONB DEFAULT '{}'
/*
{
  "food": {"budget": 8000, "alert_at_pct": 80},
  "transport": {"budget": 3000, "alert_at_pct": 75},
  "shopping": {"budget": 5000, "alert_at_pct": 90}
}
*/

created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: financial_goals
═══════════════════════════════════════════════════════════
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id)
name                  VARCHAR(200) NOT NULL
icon                  VARCHAR(50)
type                  VARCHAR(30)               -- emergency_fund/investment/purchase/debt_payoff/travel
target_amount         DECIMAL(15,2) NOT NULL
current_amount        DECIMAL(15,2) DEFAULT 0
start_date            DATE
target_date           DATE
monthly_contribution  DECIMAL(12,2)
linked_account_id     UUID REFERENCES bank_accounts(id)
linked_investment_id  UUID REFERENCES investment_accounts(id)
status                VARCHAR(20) DEFAULT 'active'
ai_projected_date     DATE
ai_recommended_monthly DECIMAL(12,2)
achieved_at           TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════════
TABLE: insights (AI-generated financial insights)
═══════════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
type              VARCHAR(50)
-- Types: spending_spike/budget_alert/investment_opportunity/
--        tax_saving/subscription_waste/recurring_detected/
--        portfolio_drift/sip_performance/goal_risk

title             VARCHAR(200)
body              TEXT
action_url        VARCHAR(200)                  -- deep link in app
priority          VARCHAR(10)                   -- critical/high/medium/low
data              JSONB                         -- supporting data for the insight
status            VARCHAR(20) DEFAULT 'pending' -- pending/sent/read/dismissed/acted
generated_at      TIMESTAMP DEFAULT NOW()
expires_at        TIMESTAMP
read_at           TIMESTAMP
acted_at          TIMESTAMP

INDEX: (user_id, status, generated_at DESC)
```

---

## PART 4: ALL SERVICE IMPLEMENTATIONS

### 4.1 SMS Transaction Auto-Capture Engine

```
=== SMS PARSER SERVICE — COMPLETE SPECIFICATION ===

PURPOSE:
  Read bank/UPI transaction SMS the moment it arrives on device.
  Parse amount, merchant, type, payment method.
  Create transaction record without user action.
  This is the #1 feature users expect — it must be fast and accurate.

ARCHITECTURE:
  Android: BroadcastReceiver for SMS_RECEIVED intent
  iOS: Cannot read SMS directly — use Bank notification permissions
       + manual import fallback + AA as primary source

ANDROID SMS CAPTURE FLOW:
  1. Permission: READ_SMS + RECEIVE_SMS on app install
  2. BroadcastReceiver registered for SMS_RECEIVED
  3. On SMS received → Send to native module → React Native bridge → API
  4. Backend receives raw SMS → Parser classifies → Creates transaction
  5. Push notification to user: "₹450 Swiggy logged ✅"
  
  Response time target: <5 seconds from SMS receipt to dashboard update

iOS FALLBACK STRATEGY:
  Primary: Account Aggregator (AA) framework (3-hour lag acceptable)
  Secondary: Bank notification reading via UNUserNotificationCenter
             (User enables "Siri Suggestions" for bank notifications)
  Tertiary: Manual CSV import from banking app
  
  Be honest with iOS users: "Bank sync works in 3-hour intervals on iOS.
  For instant tracking, use Android version."

SMS SENDER ID DATABASE (Indian banks — 100+ patterns):

HDFC_SENDERS: ['VM-HDFCBK', 'VK-HDFCBK', 'BZ-HDFCBK', 'IM-HDFCBK']
ICICI_SENDERS: ['VM-ICICIB', 'VK-ICICIB', 'BZ-ICICI', 'JD-ICICIB']
SBI_SENDERS: ['VM-SBIINB', 'VK-SBIBNK', 'IM-SBIINB', 'BK-SBIINB']
AXIS_SENDERS: ['VM-AXISBK', 'VK-AXISBK', 'IM-AXISBK']
KOTAK_SENDERS: ['VK-KOTAKB', 'VM-KOTAKB', 'IM-KOTAKB']
CANARA_SENDERS: ['VM-CANBNK', 'VK-CANBK']
BOB_SENDERS: ['VM-BARBK', 'VK-BARODA']
PNB_SENDERS: ['VM-PNBSMS', 'VK-PUNBNK']
PAYTM_SENDERS: ['VM-PYTMBN', 'VK-PAYTMB']
GPAY_SENDERS: ['JD-GOOGLE', 'VM-GOOGLE']
PHONEPE_SENDERS: ['VM-PHONEPE', 'VK-PHONEPE']

SMS REGEX PATTERNS:

PATTERN 1 — HDFC Debit/Credit:
  DEBIT: /INR\s*([\d,]+\.?\d*)\s+(?:debited|deducted).*?to\s+(.+?)(?:\s+on|\s+Ref|\.)/i
  CREDIT: /INR\s*([\d,]+\.?\d*)\s+credited.*?from\s+(.+?)(?:\s+on|\s+Ref|\.)/i

PATTERN 2 — ICICI Bank:
  /Rs\.?\s*([\d,]+\.?\d*)\s+(?:debited|credited).*?(?:at|to|from)\s+([A-Za-z0-9\s]+)/i

PATTERN 3 — SBI:
  /Rs\s*([\d,]+\.?\d*)\s+(?:debited|credited).*?(?:to|from)\s+([A-Z\s]+)/i

PATTERN 4 — UPI Generic (all banks):
  DEBIT: /(?:UPI\/|UPI-)\s*([A-Za-z0-9@._]+)\s+(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i
  CREDIT: /received\s+(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*).*?from\s+([A-Za-z0-9@._]+)/i

PATTERN 5 — GPay/PhonePe:
  /You paid\s+(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s+to\s+(.+?)(?:\s+via|$)/i
  /Paid\s+(?:Rs\.?|₹)\s*([\d,]+\.?\d*).*?UPI ID:\s*([a-zA-Z0-9@._]+)/i

PATTERN 6 — Credit Card:
  /(?:credit card|card)\s+(?:ending|no)\s+(\d{4}).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i
  /spent\s+(?:Rs\.?|INR)\s*([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9\s]+)\s+on\s+card/i

PATTERN 7 — Paytm:
  /Paytm\s+(?:payment|transaction).*?(?:Rs\.?|₹)\s*([\d,]+\.?\d*)/i

FALLBACK: If no pattern matches → send to Claude Haiku API for extraction

MERCHANT NORMALIZATION:
  Raw: "SWIGGY*ORDERS" → "Swiggy"
  Raw: "AMZN*MKTP IN" → "Amazon"
  Raw: "NETFLIX.COM" → "Netflix"
  Raw: "ZOMATOMEDIA" → "Zomato"
  Raw: "POS 1234 DMART" → "DMart"
  Raw: "NEFT/ONLINE" → extract from narration

  Merchant database: 50,000+ merchants with normalized names
  Fallback: Fuzzy match + Claude Haiku extraction (for unknown merchants)

DEDUPLICATION (Critical — SMS + AA may both report same transaction):
  Key: SHA-256(user_id + amount + date(to_minute) + type + upi_ref_or_merchant_cleaned)
  If key exists: Skip, update source to "sms+aa" (both confirmed)
  Race condition: Redis distributed lock with 30-second TTL

CATEGORIZATION ENGINE:
  Priority 1: User's custom rules (rule_engine table) — 100% match
  Priority 2: Merchant category database (50K merchants pre-mapped)
  Priority 3: ML model (trained on 10M+ Indian transactions)
  Priority 4: Claude Haiku API (fallback, 2% of transactions)
  
  Category list (India-specific):
  - food_dining (restaurants, Swiggy, Zomato, cafes)
  - grocery (BigBasket, Blinkit, Zepto, D-Mart, kiranas)
  - transport (Ola, Uber, Rapido, Metro, petrol, Fastag)
  - shopping (Amazon, Flipkart, Myntra, Meesho)
  - healthcare (PharmEasy, 1mg, hospital, clinic, chemist)
  - entertainment (Netflix, Hotstar, BookMyShow, Spotify, Prime)
  - bills_utilities (electricity, water, gas, internet, phone)
  - education (Udemy, BYJU's, school fees, tuition)
  - investment (SIP, stocks, FD, mutual funds)
  - transfer_sent (bank transfer to person)
  - transfer_received (bank transfer from person)
  - emi_loan (EMI, loan repayment)
  - insurance (LIC, health insurance, vehicle insurance)
  - personal_care (salon, spa, pharmacy, gym)
  - travel (flights, hotels, MakeMyTrip, Goibibo)
  - cash_withdrawal (ATM)
  - income_salary (salary credit)
  - income_freelance (client payment)
  - income_dividend (investment dividend)
  - income_interest (bank interest)
  - income_refund (refund credits)
  - taxes (advance tax, TDS)
  - other (everything else)
```

### 4.2 Account Aggregator Integration Service

```
=== ACCOUNT AGGREGATOR SERVICE — COMPLETE SPECIFICATION ===

PROVIDER SELECTION:
  Primary: Setu AA (best developer experience, excellent docs)
  Secondary: Finvu (consumer-facing fallback)
  Why Setu: 
    - Pre-built consent UI (mobile SDK)
    - Sandbox with mock data
    - Webhook support for real-time updates
    - 600+ FIPs supported
    - Per-successful-fetch pricing (₹5-25/fetch)

FLOW — USER CONNECTING BANK ACCOUNT:

Step 1: User taps "Connect Bank" in Viya app
Step 2: Select bank from list (filtered by AA-supported FIPs)
Step 3: Viya API creates consent request with Setu
  POST /consents {
    "consentTypes": ["TRANSACTIONS"],
    "fiTypes": ["DEPOSIT"],
    "purposeCode": "04",           // Personal finance management
    "fetchType": "PERIODIC",
    "frequency": { "value": 24, "unit": "HOURS" },
    "dataRange": {
      "from": "-12m",              // Last 12 months
      "to": "now"
    }
  }
Step 4: Setu returns consent_handle
Step 5: Viya opens Setu Consent Manager SDK (webview/deeplink)
Step 6: User sees bank selection → logs into bank → approves consent
Step 7: Setu sends webhook: consent status = ACTIVE
Step 8: Viya API triggers data fetch
Step 9: Setu fetches encrypted data from bank (FIP)
Step 10: Setu sends encrypted data to Viya (FIU)
Step 11: Viya decrypts with private key, parses transactions
Step 12: Transactions stored, dashboard updated
Step 13: WhatsApp notification: "Bank connected! Syncing 6 months of history..."

CONSENT ARTEFACT (Stored in aa_consents table):
{
  "consentId": "uuid",
  "consentHandle": "handle",
  "status": "ACTIVE",
  "purpose": {
    "code": "04",
    "text": "Personal Finance Management"
  },
  "fetchType": "PERIODIC",
  "frequency": {"unit": "HOURS", "value": 24},
  "dataLife": {"unit": "MONTH", "value": 3},
  "dataRange": {"from": "2024-01-01", "to": "2025-01-01"},
  "fiType": ["DEPOSIT"],
  "accounts": ["masked_account_1"],
  "signature": "digital_signature"
}

DATA FETCH AND PARSING:
  Trigger: Webhook from Setu (ACTIVE status) OR scheduled job (every 24h)
  Format received: FIP encrypted JSON (DEPA standard format)
  
  After decryption, transaction format:
  {
    "txnId": "string",
    "type": "DEBIT|CREDIT",
    "amount": "1500.00",
    "currentBalance": "45000.00",
    "transactionTimestamp": "2024-06-15T14:30:00+05:30",
    "valueDate": "2024-06-15",
    "narration": "UPI/SWIGGY TECHNOLOGIES/ZOMATO",
    "reference": "4242424242424242"
  }

PRIVACY AND SECURITY:
  Viya is FIU (Financial Information User) — we REQUEST data
  Viya does NOT need AA license (only intermediaries need it)
  Key principle: Data stored only as long as consent is active
  User revokes consent → Delete all AA-sourced transactions within 30 days
  Encryption: JWE (JSON Web Encryption) + JWS (JSON Web Signature)
  Keys: 2048-bit RSA keypair, stored in AWS KMS
  Data residency: India region only (ap-south-1)

CONSENT LIFECYCLE MANAGEMENT:
  Renewal: Alert user 7 days before consent expires
  Renewal: Auto-renew if user has "auto-renew" enabled
  Expiry: Mark as expired, pause sync, notify user
  Revocation: User can revoke anytime from app → send revoke to Setu
  Post-revocation: Delete AA data within 30 days (GDPR-like right)

FALLBACK STRATEGY (When AA is unavailable):
  1. SMS auto-read (covers most transactions in real-time)
  2. PDF bank statement upload (OCR extraction)
  3. CSV import (any standard bank format)
  4. Manual entry with smart suggestions

BANKS SUPPORTED VIA AA (2025 coverage):
  Tier 1: HDFC, ICICI, SBI, Axis, Kotak, IndusInd, Yes Bank
  Tier 2: PNB, Canara, BoB, BoI, Union Bank, Central Bank
  Tier 3: Federal, Bandhan, RBL, IDFC First, South Indian Bank
  Payment Banks: Paytm Payments Bank, Airtel Payments Bank, Jio Payments Bank
  Total: 170+ FIPs (as of 2025)
```

### 4.3 Brokerage Account Sync Service

```
=== BROKERAGE SYNC SERVICE — COMPLETE SPECIFICATION ===

SUPPORTED BROKERS:

1. ZERODHA (Most critical — largest user base in India)
   Integration: Kite Connect API v3
   Auth: OAuth 2.0 (API key + secret from Zerodha console)
   Endpoints:
     /holdings → All current stock/ETF positions
     /positions → Intraday positions
     /portfolio/holdings → With buy average
     /orders → Order history for cost basis
     /tradebook → Complete trade history
   Cost: ₹2,000/month API subscription from Zerodha
   Webhooks: Postback for order updates
   Rate limits: 3 req/sec, 10K req/day

2. GROWW
   Integration: Groww Partner API (invitation required)
   Auth: OAuth 2.0
   Data: Holdings, MF portfolio, transaction history
   Alternative: CAS from CAMS/KFintech (for MF)

3. KUVERA
   Integration: Kuvera API (open for fintech partners)
   Data: MF portfolio, SIP details, redeemed funds
   Auth: API key (user generates in Kuvera settings)

4. UPSTOX
   Integration: Upstox API v2
   Auth: OAuth 2.0
   Data: Holdings, positions, order history

5. PAYTM MONEY
   Integration: Paytm Money APIs (partner access)
   Data: MF portfolio, stocks, NPS

6. CAS IMPORT (Universal — works for all brokers)
   Source: CAMS (camsmail@camsonline.com) + KFintech
   Format: PDF (OCR) or XML (direct)
   Coverage: ALL mutual fund folios across ALL AMCs
   Frequency: Monthly (CAMS sends automatically to registered email)
   Processing: PDF → OCR → Parse → Store transactions + holdings

7. DEMAT HOLDINGS VIA CDSL/NSDL
   Integration: CDSL Myeasi API or NSDL eAccess
   Data: All demat holdings (complete picture)
   Auth: PAN + OTP verification
   Coverage: All stocks across all brokers

ZERODHA KITE CONNECT DETAILED FLOW:

Authorization:
  User clicks "Connect Zerodha" in Viya
  Viya generates: GET https://kite.zerodha.com/connect/login?api_key=XXX&v=3
  User logs into Zerodha → Approves access
  Redirect to callback with request_token
  Viya exchanges: POST /session/token {api_key, request_token, api_secret}
  Receive access_token (valid for one trading day)
  Store encrypted in investment_accounts.access_token

Daily Sync (8:00 AM IST):
  1. Re-authenticate if access_token expired (request new via login)
  2. Fetch holdings: GET /portfolio/holdings
  3. Fetch positions: GET /portfolio/positions
  4. Fetch today's orders: GET /orders
  5. Compare with stored holdings → Update quantities, prices
  6. Calculate P&L, returns
  7. Update portfolio dashboard

Webhook for real-time updates:
  Zerodha Kite postback on order execution
  URL: https://api.heyviya.app/webhooks/zerodha/{user_id}
  Payload: Order details with status
  Action: Update positions, send notification

PORTFOLIO ANALYTICS ENGINE:

Calculate on every sync:
  1. Total portfolio value = SUM(quantity × current_price) per holding
  2. Total invested = SUM(quantity × avg_buy_price) per holding
  3. Unrealized P&L = Total value - Total invested
  4. Unrealized P&L % = (Unrealized P&L / Total invested) × 100
  5. XIRR calculation:
     - Cash flows: [-buy_amount_1, -buy_amount_2, ..., +current_value]
     - Dates: [buy_date_1, buy_date_2, ..., today]
     - Newton-Raphson iteration to find rate
  6. Realized P&L = SUM(sell_amount - cost_basis) from portfolio_transactions
  7. Asset allocation: { equity_pct, mf_pct, fd_pct, gold_pct, other_pct }
  8. Sector allocation (for equity holdings)
  9. Beta and volatility (optional, Phase 3)
  10. SIP performance: XIRR for SIP investments separately

COST BASIS CALCULATION (FIFO — First In First Out):
  When user sells shares:
    Find oldest lots first (FIFO)
    Calculate realized P&L = sell_price - cost_of_oldest_lots
    Determine STCG vs LTCG:
      Equity STCG: Held < 12 months → taxed at 20% (post July 2024)
      Equity LTCG: Held > 12 months → 12.5% above ₹1.25L/year
      Debt MF: Slab rate for all gains (post-2023 change)
      Equity MF: Same as equity shares
    Store realized_pnl and tax_type in portfolio_transactions

LIVE PRICE FETCHING:
  NSE/BSE: Live prices via NSE India Open API or Angel Broking API
  MF NAV: AMFI daily NAV data (free, published by 11 PM daily)
  Market hours detection: Only refresh during 9:15 AM - 3:30 PM IST
  After market: Use last close price
  Source: Multiple providers for redundancy
```

### 4.4 Dashboard and Analytics Service

```
=== DASHBOARD SERVICE — ALL SCREENS AND DATA =====

DASHBOARD 1: CASH FLOW OVERVIEW

Data served by GET /api/v1/dashboard/cashflow?period=month

Response structure:
{
  "period": { "start": "2024-06-01", "end": "2024-06-30" },
  "summary": {
    "total_income": 85000.00,
    "total_expenses": 34250.00,
    "net_cashflow": 50750.00,
    "savings_rate": 59.7
  },
  "income_breakdown": [
    { "category": "income_salary", "amount": 80000, "count": 1 },
    { "category": "income_freelance", "amount": 5000, "count": 2 }
  ],
  "expense_breakdown": [
    { "category": "food_dining", "amount": 8400, "count": 28, "vs_last_month": +15.2 },
    { "category": "grocery", "amount": 6200, "count": 12, "vs_last_month": -8.1 }
  ],
  "daily_cashflow": [
    { "date": "2024-06-01", "income": 80000, "expense": 1200 },
    ...30 items
  ],
  "top_merchants": [
    { "merchant": "Swiggy", "amount": 3200, "count": 14, "category": "food_dining" }
  ],
  "unusual_transactions": [
    { "transaction_id": "uuid", "reason": "15x higher than usual" }
  ],
  "budget_status": {
    "total_budget": 40000,
    "spent": 34250,
    "remaining": 5750,
    "pct_used": 85.6,
    "category_status": [...]
  }
}

DASHBOARD 2: PORTFOLIO OVERVIEW

Data served by GET /api/v1/dashboard/portfolio

Response:
{
  "net_worth": {
    "total": 1234567.00,
    "breakdown": {
      "stocks": 450000,
      "mutual_funds": 600000,
      "fd_rd": 150000,
      "cash_bank": 34567
    },
    "change_today": 8420.00,
    "change_today_pct": 0.69,
    "change_this_month": 45234.00
  },
  "portfolio_returns": {
    "total_invested": 950000.00,
    "current_value": 1050000.00,
    "absolute_return": 100000.00,
    "absolute_return_pct": 10.5,
    "xirr": 18.4,
    "stcg_unrealized": 25000.00,
    "ltcg_unrealized": 75000.00
  },
  "holdings": [
    {
      "id": "uuid",
      "name": "Reliance Industries",
      "ticker": "RELIANCE",
      "quantity": 10,
      "avg_cost": 2400.00,
      "current_price": 2890.00,
      "current_value": 28900.00,
      "pnl": 4900.00,
      "pnl_pct": 20.42,
      "day_change": 45.00,
      "day_change_pct": 1.58
    }
  ],
  "sip_summary": {
    "total_monthly_sip": 15000.00,
    "active_sips": 3,
    "next_sip_date": "2024-07-01",
    "sip_performance_xirr": 14.2
  },
  "asset_allocation": {
    "large_cap_equity": 45,
    "mid_cap_equity": 20,
    "small_cap_equity": 10,
    "debt": 15,
    "gold": 5,
    "international": 5
  }
}

DASHBOARD 3: TAX SUMMARY (Phase 2)

Data served by GET /api/v1/dashboard/tax?fy=2024-25

Response:
{
  "financial_year": "2024-25",
  "income": {
    "salary": 960000.00,
    "freelance": 120000.00,
    "interest": 8500.00,
    "dividend": 12000.00
  },
  "capital_gains": {
    "stcg_equity": 25000.00,       -- Tax: 20%
    "ltcg_equity": 80000.00,       -- Tax: 12.5% on 80K-1.25L = 0 (exemption used)
    "stcg_debt": 0,
    "ltcg_debt": 0                 -- Taxed at slab rate post 2023
  },
  "deductions": {
    "section_80c": {
      "utilized": 75000.00,
      "available": 150000.00,
      "remaining": 75000.00,
      "components": {
        "elss_sip": 36000.00,
        "ppf": 24000.00,
        "life_insurance": 15000.00
      }
    },
    "section_80d": 25000.00,       -- Health insurance
    "nps_80ccd": 50000.00          -- Additional ₹50K
  },
  "advance_tax": {
    "q1_paid": 10000.00,
    "q2_paid": 0.00,
    "q2_due_by": "2024-09-15",
    "estimated_q2_amount": 12000.00
  },
  "estimated_tax": 89750.00,
  "insights": [
    "Invest ₹75,000 more in ELSS by March 31 to max 80C savings",
    "Your LTCG this year is under ₹1.25L exemption limit — no tax",
    "Q2 advance tax of ₹12,000 due September 15"
  ]
}
```

### 4.5 Intelligence and Proactive Alerts Engine

```
=== FINANCIAL INTELLIGENCE ENGINE ===

AUTOMATIC INSIGHTS GENERATED:

TYPE 1: BUDGET ALERT
  Trigger: spending_this_month_in_category > 80% of budget
  Message: "You've spent ₹6,400 of ₹8,000 food budget (80%).
            8 more days left in June.
            At current pace, you'll exceed budget by ₹3,200."
  Actions: [Adjust Budget] [See Food Transactions] [I'll be careful]

TYPE 2: RECURRING TRANSACTION DETECTED
  Trigger: Same merchant + similar amount + same day_of_month × 3 months
  Message: "I detected a monthly payment of ₹499 to Netflix.
            It's recurring every month on the ~14th.
            Want me to track this as a subscription?"
  Actions: [Yes, track it] [Ignore]

TYPE 3: UNUSUAL TRANSACTION ALERT
  Trigger: Transaction > 3× average daily spending
  Message: "Large transaction detected: ₹15,000 to INDIGO AIRLINES.
            That's 4× your typical daily spend.
            Was this a planned expense?"
  Actions: [Yes, it's planned] [Flag for review] [View transaction]

TYPE 4: INVESTMENT REBALANCING NEEDED
  Trigger: Asset allocation drifted > 10% from target
  Message: "Your portfolio is now 82% equity (target: 65%).
            Markets have been strong — consider rebalancing.
            Sell ₹80,000 equity → Move to debt MF to rebalance."
  Actions: [Show rebalancing plan] [Remind me in 1 week] [Ignore]

TYPE 5: TAX SAVING OPPORTUNITY
  Trigger: LTCG approaching ₹1.25L limit OR January (tax season)
  Message: "You have ₹1,10,000 LTCG this year.
            Limit is ₹1.25L. ₹15,000 more is tax-free.
            Also: ₹75,000 remaining in 80C limit — invest in ELSS by March 31."
  Actions: [Open ELSS SIP calculator] [Mark as read]

TYPE 6: SIP PERFORMANCE REVIEW
  Trigger: Every 6 months after SIP started
  Message: "Your Axis Bluechip SIP is 18 months old.
            XIRR: 14.8% (Category avg: 12.3%) ✅
            Invested: ₹54,000 | Current: ₹64,200
            This is performing well!"
  Actions: [View details] [Increase SIP amount]

TYPE 7: SUBSCRIPTION WASTE
  Trigger: Subscription paid but no usage (detected from spending patterns)
  Message: "You're paying ₹649/month for Netflix.
            I haven't seen any Netflix-related expenses in 45 days.
            (No streaming top-ups, friend shares, etc.)
            Still using it?"
  Actions: [Still using it] [Cancel and save ₹7,788/year]

TYPE 8: GOAL ON TRACK / AT RISK
  Trigger: Monthly goal progress check
  Message (at risk): "Your emergency fund goal is behind schedule.
            You needed to save ₹8,000 this month — saved ₹2,000.
            At this rate, goal completes March 2026 (3 months late)."
  Actions: [Save more now] [Adjust timeline] [View goal]

TYPE 9: CREDIT CARD BILL DETECTED (from SMS/email)
  Trigger: Credit card SMS or email received
  Message: "HDFC Credit Card bill ready: ₹23,450
            Due: July 14 (12 days away)
            Min payment: ₹2,345
            Pay in full to avoid 3.5% monthly interest (₹820/month!)"
  Actions: [Set reminder] [View statement] [Pay now via HDFC app]

TYPE 10: DUPLICATE TRANSACTION DETECTED
  Trigger: Two transactions with same amount within 30 seconds
  Message: "Possible duplicate detected:
            ₹499 to Netflix at 3:45 PM and 3:45 PM
            Same amount, same time — looks like a duplicate charge.
            Check your bank/credit card?"
  Actions: [Yes, it's a duplicate] [No, both are valid]

DELIVERY:
  WhatsApp message (primary — 80% read rate)
  In-app notification badge
  Push notification (backup)
  In-app notification center (always logged here)

AI MODEL FOR INSIGHT GENERATION:
  Tier 1 (free): Rule-based + simple ML (no API cost)
  Tier 2 (premium): Claude Sonnet for nuanced insights
  Tier 3 (premium): Claude Opus for investment recommendations
```

---

## PART 5: API CONTRACTS

### 5.1 Transaction APIs

```
POST /api/v1/transactions
  Auth: Bearer JWT
  Body: {
    type: 'credit' | 'debit',
    amount: number,
    category: string,
    merchant_normalized: string,
    bank_account_id: string,
    transaction_date: ISO8601,
    payment_method: string,
    notes?: string,
    receipt_base64?: string
  }
  Response: { transaction: Transaction, budget_impact: BudgetImpact }
  Idempotency-Key: Required header

GET /api/v1/transactions
  Auth: Bearer JWT
  Query: ?start=ISO8601&end=ISO8601&category=string&type=debit|credit
         &search=string&account_id=uuid&limit=50&cursor=string
  Response: { data: Transaction[], next_cursor: string, has_more: bool, summary: Summary }

PATCH /api/v1/transactions/:id
  Auth: Bearer JWT
  Body: { category?, notes?, merchant_normalized?, tags?, is_excluded? }
  Response: { transaction: Transaction }
  Note: Updates user_category_source to "user"
        Triggers rule learning if same merchant recategorized

DELETE /api/v1/transactions/:id
  Auth: Bearer JWT
  Response: { success: true }
  Note: Soft delete only. Audit logged.

POST /api/v1/transactions/import/csv
  Auth: Bearer JWT
  Body: FormData { file: CSV, bank_name: string, account_id: string }
  Response: { job_id: string, status: 'processing' }
  Note: Background processing, webhook/polling for completion

GET /api/v1/transactions/import/:job_id
  Response: { status: processing|completed|failed, processed: n, imported: n, duplicates: n, errors: [] }

POST /api/v1/transactions/:id/split
  Auth: Bearer JWT
  Body: { splits: [{ amount, category, notes }] }  -- must sum to parent amount
  Response: { parent: Transaction, children: Transaction[] }
```

### 5.2 Account Connection APIs

```
POST /api/v1/accounts/bank/connect/aa
  Body: { bank_name: string, fip_id: string }
  Response: { consent_url: string, consent_handle: string }
  Note: Redirect user to consent_url in webview

POST /api/v1/accounts/bank/connect/aa/callback
  Body: { consent_handle: string, status: string }
  Note: Called by Setu webhook after consent granted
  Action: Triggers initial data fetch

GET /api/v1/accounts/bank
  Response: { accounts: BankAccount[] }

DELETE /api/v1/accounts/bank/:id/revoke
  Action: Revokes AA consent, marks account inactive, schedules data deletion

POST /api/v1/accounts/investment/connect
  Body: {
    broker: 'zerodha' | 'groww' | 'kuvera' | 'upstox',
    auth_type: 'oauth' | 'api_key' | 'cas'
  }
  Response: { auth_url?: string, instructions?: string }

POST /api/v1/accounts/investment/connect/zerodha/callback
  Body: { request_token: string }
  Action: Exchange for access_token, store, trigger sync

POST /api/v1/accounts/investment/connect/cas
  Body: { cas_email: string, cas_password: string }
  Action: Download latest CAS, parse, import holdings

GET /api/v1/accounts/investment
  Response: { accounts: InvestmentAccount[], total_value: number }

POST /api/v1/accounts/bank/:id/sync
  Note: Manually trigger sync for specific account
  Response: { job_id: string }
```

### 5.3 Portfolio APIs

```
GET /api/v1/portfolio/overview
  Response: {
    net_worth: number,
    breakdown: AssetBreakdown,
    change_today: number,
    change_today_pct: number,
    total_invested: number,
    unrealized_pnl: number,
    unrealized_pnl_pct: number,
    xirr: number,
    holdings: Holding[],
    sip_summary: SIPSummary,
    asset_allocation: Allocation
  }

GET /api/v1/portfolio/holdings
  Query: ?asset_class=equity|mf|fd&broker=zerodha&sort_by=value|pnl_pct
  Response: { holdings: DetailedHolding[] }

GET /api/v1/portfolio/holdings/:id
  Response: { holding: Holding, history: PriceHistory[], transactions: PortfolioTransaction[] }

GET /api/v1/portfolio/transactions
  Query: ?start=&end=&type=buy|sell&holding_id=
  Response: { transactions: PortfolioTransaction[] }

GET /api/v1/portfolio/performance
  Query: ?period=1w|1m|3m|6m|1y|all
  Response: {
    period_return_pct: number,
    period_return_amount: number,
    xirr: number,
    benchmark_comparison: { nifty50_return: number, your_return: number },
    best_performer: Holding,
    worst_performer: Holding
  }

GET /api/v1/portfolio/tax-report
  Query: ?fy=2024-25
  Response: TaxReport

POST /api/v1/portfolio/sync
  Body: { account_ids?: string[] }  -- empty = all accounts
  Response: { job_id: string }
```

### 5.4 Dashboard and Analytics APIs

```
GET /api/v1/dashboard/overview
  Response: {
    cashflow_summary: CashflowSummary,
    portfolio_snapshot: PortfolioSnapshot,
    active_goals: Goal[],
    pending_alerts: Alert[],
    recent_transactions: Transaction[5],
    upcoming_bills: Bill[]
  }

GET /api/v1/dashboard/cashflow
  Query: ?period=week|month|quarter|year&start=&end=
  Response: CashflowDashboard (see 4.4 spec)

GET /api/v1/dashboard/portfolio
  Response: PortfolioDashboard (see 4.4 spec)

GET /api/v1/insights
  Query: ?status=pending|read|all&limit=20
  Response: { insights: Insight[] }

POST /api/v1/insights/:id/action
  Body: { action: 'read' | 'dismissed' | 'acted' }
  Response: { success: true }

GET /api/v1/reports/monthly
  Query: ?month=2024-06
  Response: { transactions: Transaction[], summary: MonthlySummary, pdf_url: string }

POST /api/v1/reports/generate
  Body: { type: 'monthly' | 'annual' | 'tax' | 'portfolio', period: string }
  Response: { job_id: string }
  Note: PDF generated in background, link emailed + available in app
```

---

## PART 6: SECURITY AND COMPLIANCE

### 6.1 Security Architecture

```
AUTHENTICATION LAYERS:

Layer 1: JWT Authentication
  Access token: 15-minute expiry, HS256 signed
  Refresh token: 7-day expiry, stored hashed in PostgreSQL
  Refresh rotation: New refresh token on every use
  Revocation: Redis blacklist for instant logout
  
  JWT payload:
  {
    "sub": "user_uuid",
    "plan": "premium",
    "mfa_verified": true,
    "session_id": "session_uuid",
    "iat": timestamp,
    "exp": timestamp
  }

Layer 2: MFA (Multi-Factor Authentication)
  TOTP: Google Authenticator / Authy compatible
  Implementation: @nestjs/speakeasy (TOTP RFC 6238)
  Setup: QR code generated with otplib
  Backup codes: 10 single-use codes, bcrypt hashed
  Required: All financial actions when enabled
  Enforcement: Optional for free, recommended for premium, required for enterprise

Layer 3: Device Trust
  Device fingerprint: SHA-256(device_id + screen + os_version)
  New device → Email notification + optional MFA prompt
  Trusted devices: Store in sessions table, 30-day expiry

ENCRYPTION STRATEGY:

Field-level (Most sensitive data):
  PII (phone, email, name): AES-256-GCM, per-user key
  OAuth tokens: AES-256-GCM, system key + user salt
  Key derivation: PBKDF2 (100,000 iterations) for user keys
  Master key: AWS KMS HSM-backed

Database-level:
  PostgreSQL TDE via AWS RDS encryption
  All data encrypted at rest (AES-256)
  Backup encryption: Separate CMK in AWS KMS

Transport:
  TLS 1.3 only (reject 1.2 and below)
  HSTS header with 1-year max-age
  Certificate pinning in mobile app
  API: Only HTTPS (no HTTP)

COMPLIANCE FRAMEWORK:

PCI DSS (Payment Card data):
  We do NOT store raw card numbers EVER
  Card data: Only last 4 digits + masked
  Payment processing: Through Razorpay (they handle PCI)
  
India PDPB (Personal Data Protection Bill 2023):
  Consent for all data collection
  Deletion within 30 days of request
  Data residency: All data in India (ap-south-1)
  Notice + purpose clearly stated at collection
  
RBI Guidelines (for AA integration):
  FIU registration with RBI (required)
  Maintain data security standards
  Audit logs for all data access
  
Data Retention Policy:
  Transaction data: 7 years (IT Act compliance)
  AA consent data: 6 months post-revocation
  Audit logs: 5 years
  Deleted user data: Purged within 30 days
  Session data: 7 days

AUDIT LOG REQUIREMENTS:
  EVERY sensitive action logged:
    - User authentication (success + failure)
    - Consent granted/revoked
    - Bank account connected/disconnected
    - Transaction created/modified/deleted
    - Data export
    - API key creation
    - Admin access to user data
    - Failed MFA attempts
  
  Audit log immutability:
    PostgreSQL trigger prevents UPDATE/DELETE on audit_logs
    Separate read-only audit replica
    AWS S3 export (append-only) for long-term storage

RATE LIMITING (By endpoint category):

  Auth: 5 requests / minute / IP
  OTP: 3 requests / hour / phone
  Dashboard: 60 requests / minute / user
  Transaction create: 100 / hour / user
  Portfolio sync: 10 / day / account
  File upload: 10 / hour / user
  Report generate: 5 / day / user
  AI insights: 50 / day (free) / 500 (premium)
```

### 6.2 Threat Model and Mitigations

```
THREAT 1: Unauthorized Access to Financial Data
  Risk: CRITICAL
  Attacks: Credential theft, session hijacking, token leakage
  Mitigations:
    - MFA on all accounts with linked banks
    - Short-lived access tokens (15 min)
    - Refresh token rotation (one-time use)
    - Redis blacklist for immediate revocation
    - Device fingerprinting + new device alerts
    - No sensitive data in JWT payload

THREAT 2: SMS Spoofing / Transaction Injection
  Risk: HIGH
  Attack: Malicious app sends fake bank SMS to inject false transactions
  Mitigations:
    - Validate SMS sender ID against approved sender list
    - Deduplication on UPI reference number
    - Amount anomaly detection (flag outliers)
    - User can report false transactions
    - Manual verification required for large amounts (>₹50,000) from SMS

THREAT 3: API Key/Token Theft for Brokerage
  Risk: HIGH
  Attack: Attacker gets Zerodha/Groww API token, drains portfolio info
  Mitigations:
    - API tokens encrypted with AES-256 + user-specific key
    - Tokens never returned to client (server-side only)
    - Minimum scope: Read-only (no trading permissions)
    - Token re-validation on each API call
    - Revoke token if suspicious activity detected
    - Zerodha: Access tokens expire daily (limited blast radius)

THREAT 4: SQL Injection
  Risk: MEDIUM (mitigated by ORM)
  Mitigations:
    - TypeORM parameterized queries ONLY
    - Input validation via class-validator
    - PostgreSQL least-privilege DB user
    - No raw SQL strings with user input

THREAT 5: Insider Data Access
  Risk: MEDIUM
  Mitigations:
    - Admin actions logged to immutable audit log
    - No admin can access PII without logging
    - Principle of least privilege for all team roles
    - Two-person approval for sensitive admin operations
    - Regular audit log review

THREAT 6: AA Consent Abuse
  Risk: LOW (RBI-regulated)
  Attack: Viya fetches more data than consented
  Mitigations:
    - We are FIU — we receive, not control, the flow
    - Consent artefact stored and verifiable
    - Setu/AA handles consent enforcement
    - User can revoke at any time
    - Data deletion on revocation within 30 days
```

---

## PART 7: COMPLETE BACKLOG

### Phase 1 — MVP User Stories (Weeks 1-8)

```
EPIC 1: AUTOMATIC SMS TRANSACTION CAPTURE

US-101: As an Android user, I want the app to automatically read bank SMS
        so I don't have to manually enter transactions.
  Acceptance Criteria:
    ✅ App requests READ_SMS permission on first launch with clear explanation
    ✅ BroadcastReceiver captures SMS from bank sender IDs
    ✅ Transaction parsed within 5 seconds of SMS receipt
    ✅ Auto-categorized using ML + merchant database
    ✅ WhatsApp notification confirms: "₹450 Swiggy logged ✅"
    ✅ User can edit category if wrong
    ✅ Deduplication prevents double-logging
    ✅ Works for: HDFC, ICICI, SBI, Axis, Kotak (+ 20 others)

US-102: As a user, I want UPI transactions auto-tracked from SMS
  Acceptance Criteria:
    ✅ GPay/PhonePe/Paytm/BHIM UPI payments captured
    ✅ UPI ID of recipient/sender extracted
    ✅ UPI reference number used for deduplication
    ✅ Merchant identified from UPI ID (e.g., zomato@hdfcbank → Zomato)
    ✅ Category auto-assigned based on merchant

US-103: As an iOS user, I want to import bank statements via CSV
  Acceptance Criteria:
    ✅ Upload CSV from banking app
    ✅ Support HDFC, ICICI, SBI, Axis, Kotak CSV formats
    ✅ Auto-detect column mapping (date, amount, description)
    ✅ Preview before import with category suggestions
    ✅ Import progress shown
    ✅ Duplicates detected and skipped
    ✅ Success: "Imported 145 transactions, 3 duplicates skipped"

US-104: As a user, I want to correct transaction categories
  Acceptance Criteria:
    ✅ Swipe right on transaction to edit
    ✅ Category picker with search
    ✅ Option: "Apply to all [Merchant] transactions"
    ✅ Option: "Create rule for future [Merchant] transactions"
    ✅ Category change reflected immediately in all dashboards

─────────────────────────────────────────────────────────────

EPIC 2: ACCOUNT AGGREGATOR BANK SYNC

US-201: As a user, I want to connect my bank account via AA framework
        for automatic transaction sync without SMS.
  Acceptance Criteria:
    ✅ Clear explanation of what AA is and why it's safe
    ✅ List of supported banks (170+ FIPs)
    ✅ One-tap consent flow (Setu SDK)
    ✅ 12 months of historical transactions imported on first connect
    ✅ Daily sync runs automatically
    ✅ Consent expiry: 1 year, auto-renewal alert 7 days before
    ✅ User can revoke consent any time
    ✅ On revocation: "Your AA-sourced data will be deleted in 30 days"

US-202: As a user, I want to see the status of my connected accounts
  Acceptance Criteria:
    ✅ Settings > Connected Accounts shows all connections
    ✅ Per account: Bank name, last synced, sync method, status
    ✅ Manual sync trigger button
    ✅ Error message if sync fails with resolution steps
    ✅ Disconnect button with confirmation dialog

─────────────────────────────────────────────────────────────

EPIC 3: INVESTMENT PORTFOLIO TRACKING

US-301: As a Zerodha user, I want to connect my account and see portfolio
  Acceptance Criteria:
    ✅ "Connect Zerodha" button → Opens Kite Connect OAuth
    ✅ Zerodha login in webview
    ✅ Portfolio syncs within 2 minutes of authorization
    ✅ Shows: All holdings with qty, avg cost, current price, P&L
    ✅ Daily P&L shown (change today in ₹ and %)
    ✅ Total portfolio value with unrealized P&L
    ✅ XIRR calculated and displayed

US-302: As a mutual fund investor, I want to see all my MF holdings
  Acceptance Criteria:
    ✅ CAS import (email-based from CAMS)
    ✅ Shows: Fund name, NAV, units, invested amount, current value, returns
    ✅ SIP details: Amount, date, status, projected returns
    ✅ Folio-level drill down
    ✅ AMC-level grouping option

US-303: As an investor, I want to see my portfolio performance over time
  Acceptance Criteria:
    ✅ Time period selector: 1W, 1M, 3M, 6M, 1Y, ALL
    ✅ Portfolio value chart
    ✅ XIRR displayed prominently
    ✅ Best and worst performer highlighted
    ✅ Asset allocation donut chart
    ✅ Compare against Nifty 50 benchmark (Phase 2)

─────────────────────────────────────────────────────────────

EPIC 4: DASHBOARDS

US-401: As a user, I want a cash flow dashboard showing my income vs expenses
  Acceptance Criteria:
    ✅ Monthly view: Total income, total expenses, net savings
    ✅ Savings rate displayed as %
    ✅ Category breakdown with bar charts
    ✅ Day-by-day spending chart
    ✅ Period selector: Week/Month/Quarter/Year
    ✅ Top merchants list
    ✅ Comparison vs previous period (% change)

US-402: As a user, I want real-time budget tracking against limits I set
  Acceptance Criteria:
    ✅ Create monthly budget per category
    ✅ Budget bar: Shows spent / total with color coding
    ✅ Alert at 75%: "Warning" state (amber)
    ✅ Alert at 90%: "Critical" state (red)
    ✅ Budget exceeded: Overage shown prominently
    ✅ Remaining budget in ₹ shown always

US-403: As a user, I want alerts for unusual or important financial events
  Acceptance Criteria:
    ✅ Large transaction alert (>3× daily average)
    ✅ Duplicate transaction detected alert
    ✅ Credit card bill detected (from SMS)
    ✅ Budget 80% reached alert
    ✅ Recurring subscription detected
    ✅ Investment SIP failed/succeeded notification
    ✅ All alerts accessible in Notifications screen
    ✅ Alert by WhatsApp (primary) + in-app (always)

─────────────────────────────────────────────────────────────

EPIC 5: SECURITY

US-501: As a user, I want secure login with optional MFA
  Acceptance Criteria:
    ✅ Phone + OTP login (no passwords)
    ✅ Optional TOTP 2FA (Google Authenticator compatible)
    ✅ Biometric authentication (Face ID / Fingerprint)
    ✅ Session management: See all active sessions
    ✅ Remote logout from specific device
    ✅ "New device login" email notification

US-502: As a user, I want my financial data protected
  Acceptance Criteria:
    ✅ All API calls over HTTPS only
    ✅ Sensitive fields encrypted at rest (phone, email, bank details)
    ✅ Auto-lock after 5 minutes background (configurable)
    ✅ Privacy screen on app switch (blur sensitive data)
    ✅ Jailbreak/root detection with warning

US-503: As a user, I want to control my data
  Acceptance Criteria:
    ✅ Download all my data (GDPR-style export)
    ✅ Delete my account and all data (30-day processing)
    ✅ View all connected accounts and revoke
    ✅ View and delete all bank consents
    ✅ Privacy policy link accessible always
```

### Phase 2 — Growth Stories (Weeks 9-16)

```
US-601: Tax summary and capital gains report
US-602: Email intelligence (bill detection from Gmail)
US-603: AI-powered spending insights
US-604: Multi-account (household) management
US-605: Goals tracking with projected timelines
US-606: Subscription management and waste detection
US-607: Investment performance vs benchmark
US-608: SIP projection calculator
US-609: Budget vs actual monthly report PDF
US-610: WhatsApp bot with full financial intelligence
```

### Phase 3 — Scale Stories (Weeks 17-24)

```
US-701: Tax optimizer (TDS planning, advance tax, 80C optimization)
US-702: AI financial advisor (personalized investment recommendations)
US-703: Family finance mode (shared dashboards)
US-704: EPF / NPS integration (Government portals)
US-705: GST integration for freelancers/business
US-706: Insurance portfolio tracking
US-707: Credit score monitoring (Experian/CIBIL)
US-708: International investments (US stocks, crypto)
US-709: Open API for power users and third-party apps
US-710: Enterprise/SME multi-user with roles
```

---

## PART 8: DEPLOYMENT PLAN

### 8.1 Environment Strategy

```
ENVIRONMENTS:
  local:       Docker Compose, mock external APIs, developer seeds
  development: AWS shared, real AA sandbox, Kite Connect sandbox
  staging:     AWS production-sized, real integrations with test accounts
  production:  AWS multi-AZ, all real integrations, full monitoring

DEPLOYMENT PROCESS:
  1. PR created → GitHub Actions: lint + test + security scan
  2. PR merged → Deploy to development (automated)
  3. Release candidate → Deploy to staging (automated)
  4. Manual testing on staging (2-hour window)
  5. Approval gate: Tech lead sign-off
  6. Production deploy: Blue-green, 5% → 25% → 100% canary
  7. Auto-rollback: If error rate >1% in first 30 minutes

MOBILE RELEASE:
  Internal testing: EAS Build → Google Internal Track
  Beta: 500 users via TestFlight/Google Closed Testing (2 weeks)
  Production: Staged rollout 5% → 10% → 25% → 100% over 1 week
  OTA updates: Expo EAS Update for JS changes (no store review needed)
```

### 8.2 Monitoring and Alerting

```
KEY METRICS TO MONITOR:

BUSINESS METRICS (PostHog):
  - Daily active users
  - Bank accounts connected (target: 70% of users)
  - Auto-capture rate (target: 90% of transactions)
  - Transaction accuracy rate (target: 95% correct category)
  - Portfolio connections (target: 40% of users)
  - Feature activation funnel

TECHNICAL METRICS (Datadog):
  - API response time p95 (target: <500ms)
  - SMS processing lag (target: <5 seconds)
  - AA sync success rate (target: >95%)
  - Portfolio sync success rate (target: >98%)
  - Error rate (target: <0.1%)

ALERTS:
  P1 (Immediate): 
    API down, database connection failure, error rate >5%
    SMS processing queue depth >10,000
    AA consent webhook failures >10%
    
  P2 (30 minutes):
    API latency p95 >2 seconds
    SMS processing lag >30 seconds
    Portfolio sync failure rate >5%
    
  P3 (Next business day):
    Auto-categorization accuracy drop >5%
    New uncovered SMS sender IDs detected (banks we don't handle)
```

---

## PART 9: OKRs AND SUCCESS CRITERIA

```
QUARTER 1 OKRs (Phases 1-2):

OKR 1: Automatic transaction capture
  KR1: 70% of users connect at least one bank/brokerage account by Month 2
  KR2: 90% auto-capture rate for connected users (vs 0% today)
  KR3: <5% transaction categorization error rate
  KR4: SMS → dashboard in <5 seconds

OKR 2: Portfolio tracking adoption
  KR1: 40% of users connect brokerage account by Month 2
  KR2: XIRR accuracy within 0.5% of broker's own calculation
  KR3: Daily price refresh lag <1 hour

OKR 3: User retention improvement
  KR1: Day-7 retention 55% (from 35%)
  KR2: Day-30 retention 40% (from 22%)
  KR3: Net Promoter Score 60+

OKR 4: Revenue
  KR1: Premium conversion 10% by Month 3
  KR2: MRR ₹1 Crore by Month 6
  KR3: LTV/CAC ratio >3×

QUARTER 2 OKRs (Phase 3):
  KR1: Tax report feature used by 60% of eligible users
  KR2: AI insights action rate >40%
  KR3: Family mode adopted by 20% of premium users
  KR4: MRR ₹5 Crore by Month 12

FEATURE SUCCESS CRITERIA:

SMS Auto-Capture:
  Success: >90% of bank SMSes correctly parsed
  Failure: <80% → Investigate regex patterns, add new bank formats

AA Integration:
  Success: >95% consent success rate, <3 hour sync lag
  Failure: <90% → Escalate with Setu, add fallback

Portfolio Sync:
  Success: All holdings match broker to within 0.1 unit
  Failure: Any discrepancy >1% → Alert user, flag for review

Categorization:
  Success: User corrects <5% of auto-categorized transactions
  Failure: >10% corrections → Retrain ML model with correction data
```

---

## FINAL IMPLEMENTATION PRIORITY

```
WEEK 1-2: FOUNDATION
  ✅ SMS receiver (Android) — this is the most urgent gap
  ✅ SMS parser + 40 bank patterns
  ✅ Transaction dedup engine
  ✅ Auto-categorization (rule engine + merchant DB)

WEEK 3-4: BANK CONNECTIVITY
  ✅ AA integration (Setu SDK)
  ✅ Consent flow UI
  ✅ Historical data import (12 months on first connect)
  ✅ Daily sync scheduler

WEEK 5-6: PORTFOLIO TRACKING
  ✅ Zerodha Kite Connect (largest user base)
  ✅ CAS import (covers all MF investors)
  ✅ Holdings dashboard + P&L calculation
  ✅ XIRR engine

WEEK 7-8: INTELLIGENCE + POLISH
  ✅ Budget alerts
  ✅ Unusual transaction detection
  ✅ Credit card bill detection
  ✅ Recurring transaction detection
  ✅ Dashboard polish + performance

WEEK 9+: GROWTH FEATURES
  (See Phase 2 backlog above)

BUILD THIS. SHIP THIS. DOMINATE.
Every week we delay, users choose SpendByMe over us.
The first 8 weeks determine whether Viya wins this market.
🚀
```
