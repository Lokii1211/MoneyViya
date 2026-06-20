# VIYA AI AGENT — COMPLETE DEVELOPMENT BLUEPRINT
## For Google Antigravity / Claude Opus 4.6
## Every Agent. Every Database Table. Every API. Every Flow. Build It All.

---

> **DIRECTIVE TO ANTIGRAVITY:**
> This is the complete technical specification for Viya AI — 
> the world's most capable Personal AI Agent for India.
> 
> You will build every system from scratch.
> Every AI agent prompt is production-ready.
> Every database schema is optimized for scale.
> Every API endpoint is fully specified.
> 
> No code. Only complete, implementation-ready prompts and specifications.
> Target: A system serving 10 million daily active users.

---

## PART 1: THE COMPLETE SYSTEM ARCHITECTURE

### 1.1 WHAT VIYA IS (Technical Definition)

```
Viya is a Multi-Agent AI System where:

MASTER ORCHESTRATOR:
  Receives all user inputs (text, voice, image, email events, SMS)
  Classifies intent
  Routes to specialist agents
  Synthesizes responses
  Manages user memory

SPECIALIST AGENTS (12 total):
  1.  Email Intelligence Agent
  2.  Calendar & Schedule Agent
  3.  Finance & Expense Agent
  4.  Wealth & Investment Agent
  5.  Health & Fitness Agent
  6.  Diet & Nutrition Agent
  7.  Bills & Payments Agent
  8.  Memory & Relationship Agent
  9.  Proactive Intelligence Agent
  10. Task & Reminder Agent
  11. Shopping Intelligence Agent
  12. Mental Health & Wellness Agent

BACKGROUND SYSTEMS:
  - Email Scanner (runs every 15 minutes)
  - Proactive Scheduler (runs every hour)
  - Bill Detector (runs daily)
  - Health Sync (runs every 30 minutes)
  - Investment Tracker (runs daily at market close)
  - SMS Parser (runs on each SMS received)
```

### 1.2 COMPLETE TECH STACK

```
BACKEND:
  Language:    Python 3.11+
  Framework:   FastAPI (async)
  Database:    PostgreSQL 16 + pgvector extension
  Cache:       Redis 7.x (cache + queue + pub/sub)
  Queue:       Redis Streams (async processing)
  Search:      pgvector (semantic) + PostgreSQL FTS
  AI:          Anthropic Claude API

FRONTEND:
  Mobile:      React Native 0.73 + Expo 50
  Navigation:  React Navigation 6
  State:       Zustand + TanStack Query
  Animations:  Reanimated 3
  Storage:     MMKV (fast) + AsyncStorage

INTEGRATIONS:
  Email:       Gmail API + Microsoft Graph (Outlook)
  Calendar:    Google Calendar API + Apple Calendar (CalDAV)
  Banking:     Sahamati AA Framework (RBI-regulated)
  Health:      Google Fit API + Apple HealthKit
  Payments:    Razorpay (subscriptions) + Bill desk
  SMS:         Android BroadcastReceiver (local)
  Voice:       Whisper API (OpenAI)
  OCR:         Claude Vision + Tesseract
  Recharge:    JioAPI + Airtel API + BSNL API
  Investments: NSE/BSE live data + MF Central API

INFRASTRUCTURE:
  Hosting:     Railway.app (backend) + Vercel (web)
  Storage:     Cloudflare R2 (files, documents)
  CDN:         Cloudflare
  Monitoring:  Sentry + PostHog + Better Stack

ENVIRONMENT VARIABLES:
  DATABASE_URL, REDIS_URL
  ANTHROPIC_API_KEY
  GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET
  GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET
  MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
  AA_CLIENT_ID, AA_CLIENT_SECRET
  GOOGLE_FIT_CLIENT_ID, GOOGLE_FIT_CLIENT_SECRET
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
  RAZORPAY_KEY_ID, RAZORPAY_SECRET
  JWT_SECRET, ENCRYPTION_KEY, MASTER_SALT
  FCM_SERVER_KEY
  WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
  NSE_API_KEY, MFCENTRAL_API_KEY
```

---

## PART 2: COMPLETE DATABASE SCHEMA

### 2.1 CORE TABLES

```sql
═══════════════════════════════════════════════════════
TABLE: users
═══════════════════════════════════════════════════════
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
phone                 VARCHAR(15) UNIQUE NOT NULL
country_code          VARCHAR(5) DEFAULT '+91'
name                  VARCHAR(100)
email                 VARCHAR(200)
avatar_url            VARCHAR(500)
language              VARCHAR(10) DEFAULT 'en'
timezone              VARCHAR(50) DEFAULT 'Asia/Kolkata'
date_of_birth         DATE
city                  VARCHAR(100)
state                 VARCHAR(100)

-- PROFILE
persona               VARCHAR(50) -- student/salaried/freelancer/business/homemaker/retired
income_range          VARCHAR(30) -- 0-3L/3-7L/7-15L/15-30L/30L+

-- ACTIVE MODULES
active_agents         TEXT[]  -- ['email','finance','health','tasks',...]
email_connected       BOOLEAN DEFAULT FALSE
calendar_connected    BOOLEAN DEFAULT FALSE
bank_connected        BOOLEAN DEFAULT FALSE
health_connected      BOOLEAN DEFAULT FALSE

-- AUTH & SUBSCRIPTION
is_premium            BOOLEAN DEFAULT FALSE
premium_tier          VARCHAR(20)  -- basic/pro/family
premium_expires_at    TIMESTAMP
whatsapp_id           VARCHAR(100)
fcm_token             VARCHAR(500)

-- COMPUTED METRICS
life_score            INTEGER DEFAULT 50  -- 0-100 overall wellbeing
financial_score       INTEGER DEFAULT 50
health_score          INTEGER DEFAULT 50
productivity_score    INTEGER DEFAULT 50

-- META
onboarding_completed  BOOLEAN DEFAULT FALSE
onboarding_step       INTEGER DEFAULT 0
last_active_at        TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
deleted_at            TIMESTAMP  -- soft delete

INDEXES:
  idx_users_phone           ON users(phone)
  idx_users_whatsapp_id     ON users(whatsapp_id)
  idx_users_last_active     ON users(last_active_at DESC)

═══════════════════════════════════════════════════════
TABLE: oauth_tokens  (Email + Calendar + Health connections)
═══════════════════════════════════════════════════════
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
provider        VARCHAR(50)  -- gmail/outlook/google_calendar/apple_calendar/google_fit/apple_health
access_token    TEXT  -- encrypted with user-specific key
refresh_token   TEXT  -- encrypted
token_expiry    TIMESTAMP
scope           TEXT[]  -- what permissions granted
email           VARCHAR(200)  -- the email account connected
is_active       BOOLEAN DEFAULT TRUE
last_synced_at  TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, provider, email)

═══════════════════════════════════════════════════════
TABLE: viya_memory  (The most critical table — Viya's brain)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
memory_type       VARCHAR(50) NOT NULL
  -- TYPES: fact/preference/relationship/event/routine/
  --        goal/fear/achievement/health_fact/financial_fact/
  --        work_fact/food_preference/allergy/medication

category          VARCHAR(50)  -- finance/health/family/work/personal/travel
key               VARCHAR(200) NOT NULL
value             TEXT NOT NULL
confidence        DECIMAL(3,2) DEFAULT 1.0  -- AI confidence 0-1
source            VARCHAR(50)  -- user_stated/ai_detected/email_extracted/sms_extracted
context           TEXT  -- why we believe this / evidence

embedding         vector(1536)  -- for semantic search

is_active         BOOLEAN DEFAULT TRUE
last_confirmed_at TIMESTAMP DEFAULT NOW()
expires_at        TIMESTAMP  -- for temporary memories
confirm_count     INTEGER DEFAULT 1  -- how many times confirmed

created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_memory_user_id          ON viya_memory(user_id)
  idx_memory_type             ON viya_memory(user_id, memory_type)
  idx_memory_category         ON viya_memory(user_id, category)
  idx_memory_embedding        ON viya_memory USING ivfflat(embedding vector_cosine_ops) WITH (lists=100)
  idx_memory_active           ON viya_memory(user_id, is_active) WHERE is_active=TRUE

═══════════════════════════════════════════════════════
TABLE: conversations
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
session_id        VARCHAR(100)  -- groups related messages
platform          VARCHAR(20)  -- app/whatsapp/web
role              VARCHAR(15)  -- user/assistant/system/tool
content           TEXT NOT NULL
content_type      VARCHAR(20) DEFAULT 'text'  -- text/voice/image/document/action
media_url         VARCHAR(500)  -- for voice/image messages
transcript        TEXT  -- for voice messages (Whisper output)

-- AI METADATA
intent            VARCHAR(100)
intent_confidence DECIMAL(3,2)
entities          JSONB  -- extracted entities {amount:500, category:'food', merchant:'swiggy'}
agents_invoked    TEXT[]  -- which specialist agents were called
actions_taken     JSONB  -- [{type:'log_transaction', result:{id:'...'}}]
memory_updates    JSONB  -- what was saved to viya_memory
proactive_trigger VARCHAR(100)  -- if this was a proactive message, why

-- EMBEDDING
embedding         vector(1536)

-- PERFORMANCE
response_time_ms  INTEGER
tokens_input      INTEGER
tokens_output     INTEGER
model_used        VARCHAR(50)

created_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_conv_user_session   ON conversations(user_id, session_id, created_at DESC)
  idx_conv_created        ON conversations(created_at DESC)
  idx_conv_embedding      ON conversations USING ivfflat(embedding vector_cosine_ops)
  idx_conv_intent         ON conversations(user_id, intent)

═══════════════════════════════════════════════════════
TABLE: emails  (Extracted from Gmail/Outlook)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
provider          VARCHAR(20)  -- gmail/outlook
email_id          VARCHAR(500) UNIQUE  -- Provider's message ID

-- EMAIL DATA
from_email        VARCHAR(200)
from_name         VARCHAR(200)
subject           VARCHAR(500)
snippet           TEXT  -- first 200 chars
body_text         TEXT  -- full plain text body
received_at       TIMESTAMP
is_read           BOOLEAN

-- VIYA CLASSIFICATION
email_category    VARCHAR(50)
  -- CATEGORIES: bill/meeting_invite/delivery/investment/
  --             otp/refund/offer/newsletter/personal/work/spam
priority          VARCHAR(20)  -- critical/high/medium/low/archive
action_required   BOOLEAN DEFAULT FALSE
action_type       VARCHAR(50)
  -- ACTION TYPES: pay_bill/accept_meeting/track_delivery/
  --               renew_subscription/none

-- EXTRACTED DATA (by AI)
extracted_data    JSONB
  /*
  For bill:
  {
    "bill_type": "credit_card",
    "amount_due": 12400,
    "minimum_due": 1240,
    "due_date": "2024-06-14",
    "account_last4": "1234",
    "bank": "HDFC"
  }
  
  For meeting:
  {
    "meeting_title": "Q2 Review",
    "start_time": "2024-06-14T15:00:00",
    "end_time": "2024-06-14T16:00:00",
    "location": "Conference Room B",
    "meeting_link": "https://zoom.us/j/...",
    "attendees": ["priya@co.com"],
    "agenda": "Sales targets..."
  }
  
  For delivery:
  {
    "courier": "Amazon",
    "tracking_id": "...",
    "item_name": "boAt Airdopes",
    "status": "Out for delivery",
    "eta": "Today 8 PM"
  }
  */

-- ACTIONS
user_action       VARCHAR(50)  -- paid/accepted/declined/archived/ignored/marked_done
user_action_at    TIMESTAMP
calendar_event_id VARCHAR(200)  -- if meeting added to calendar

-- STATUS
is_processed      BOOLEAN DEFAULT FALSE
is_archived       BOOLEAN DEFAULT FALSE
is_notified       BOOLEAN DEFAULT FALSE

created_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_emails_user_id        ON emails(user_id, received_at DESC)
  idx_emails_category       ON emails(user_id, email_category)
  idx_emails_action_req     ON emails(user_id, action_required) WHERE action_required=TRUE
  idx_emails_priority       ON emails(user_id, priority)

═══════════════════════════════════════════════════════
TABLE: calendar_events
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
provider          VARCHAR(20)  -- google/apple/viya_created
external_event_id VARCHAR(500)  -- Google Calendar event ID

title             VARCHAR(500)
description       TEXT
location          VARCHAR(500)
meeting_link      VARCHAR(500)

start_at          TIMESTAMP NOT NULL
end_at            TIMESTAMP
is_all_day        BOOLEAN DEFAULT FALSE
timezone          VARCHAR(50)

-- PARTICIPANTS
organizer_email   VARCHAR(200)
attendees         JSONB  -- [{email, name, status}]
user_rsvp_status  VARCHAR(20)  -- accepted/declined/tentative/pending

-- RECURRENCE
is_recurring      BOOLEAN DEFAULT FALSE
recurrence_rule   VARCHAR(200)  -- RRULE format

-- VIYA CONTEXT
event_source      VARCHAR(50)  -- email_extracted/user_created/calendar_sync
linked_email_id   UUID REFERENCES emails(id)
pre_meeting_brief TEXT  -- AI-generated briefing

-- REMINDERS
reminder_minutes  INTEGER[]  -- [30, 10] = remind 30min and 10min before

status            VARCHAR(20) DEFAULT 'confirmed'  -- confirmed/cancelled/tentative
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_events_user_date      ON calendar_events(user_id, start_at)
  idx_events_status         ON calendar_events(user_id, status)

═══════════════════════════════════════════════════════
TABLE: transactions  (Partitioned by month)
═══════════════════════════════════════════════════════
id                UUID DEFAULT gen_random_uuid()
user_id           UUID NOT NULL
type              VARCHAR(20) NOT NULL  -- expense/income/transfer/refund
amount            DECIMAL(12,2) NOT NULL
currency          VARCHAR(3) DEFAULT 'INR'

category          VARCHAR(50) NOT NULL
subcategory       VARCHAR(50)
merchant_name     VARCHAR(200)
description       TEXT

payment_method    VARCHAR(50)  -- upi/credit_card/debit_card/cash/netbanking/wallet
account_id        UUID  -- linked bank account

transaction_date  TIMESTAMP NOT NULL
source            VARCHAR(50)  -- sms_auto/manual/aa_sync/email_extracted/screenshot

is_recurring      BOOLEAN DEFAULT FALSE
recurring_id      UUID  -- if part of recurring pattern

linked_email_id   UUID  -- if extracted from email (credit card statement)
receipt_url       VARCHAR(500)

ai_confidence     DECIMAL(3,2)
is_edited         BOOLEAN DEFAULT FALSE
is_deleted        BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (transaction_date);

-- Create monthly partitions
CREATE TABLE transactions_y2024m06 PARTITION OF transactions
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
-- (Auto-create with pg_partman extension)

INDEXES (on each partition):
  idx_trans_user_date         ON transactions(user_id, transaction_date DESC)
  idx_trans_category          ON transactions(user_id, category, transaction_date DESC)
  idx_trans_merchant          ON transactions(user_id, merchant_name)

═══════════════════════════════════════════════════════
TABLE: investments  (Portfolio tracking)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
investment_type   VARCHAR(50)  -- mutual_fund/stock/fd/rd/ppf/nps/bonds/gold/real_estate
name              VARCHAR(200)  -- Fund name / Stock ticker / FD description
isin              VARCHAR(20)  -- For MF/stocks
folio_number      VARCHAR(100)  -- For MF

-- INVESTMENT DETAILS
invested_amount   DECIMAL(12,2) NOT NULL
current_value     DECIMAL(12,2)
units             DECIMAL(12,4)  -- For MF/stocks
purchase_price    DECIMAL(10,4)  -- Per unit at purchase
current_price     DECIMAL(10,4)  -- Live price

-- SIP DETAILS (if applicable)
is_sip            BOOLEAN DEFAULT FALSE
sip_amount        DECIMAL(10,2)
sip_date          INTEGER  -- Day of month
sip_status        VARCHAR(20)  -- active/paused/stopped

-- RETURNS
absolute_return   DECIMAL(10,2)  -- Current value - invested
return_percent    DECIMAL(6,2)  -- % return
xirr              DECIMAL(6,2)  -- XIRR (annualized)

-- MATURITY
maturity_date     DATE  -- For FD/bonds
interest_rate     DECIMAL(5,2)  -- For FD/RD

-- ACCOUNT
broker_name       VARCHAR(100)  -- Zerodha/Groww/Kuvera/direct
account_number    VARCHAR(100)

-- STATUS
is_active         BOOLEAN DEFAULT TRUE
last_price_update TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_investments_user       ON investments(user_id)
  idx_investments_type       ON investments(user_id, investment_type)
  idx_investments_active     ON investments(user_id, is_active) WHERE is_active=TRUE

═══════════════════════════════════════════════════════
TABLE: bills_and_dues
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
bill_type         VARCHAR(50)  -- credit_card/electricity/water/gas/internet/
                               -- phone/emi/rent/insurance/subscription/other
name              VARCHAR(200)  -- "HDFC Credit Card", "BESCOM Electricity"
account_number    VARCHAR(100)
provider_code     VARCHAR(50)  -- For API-based payment

-- AMOUNT
amount            DECIMAL(10,2)
is_amount_variable BOOLEAN DEFAULT FALSE  -- True for utility bills

-- SCHEDULE
due_day           INTEGER  -- Day of month (1-31)
due_date_this_month DATE
billing_cycle     VARCHAR(20)  -- monthly/quarterly/yearly/prepaid

-- STATUS
status            VARCHAR(20) DEFAULT 'pending'  -- pending/paid/overdue/auto_debit
last_paid_amount  DECIMAL(10,2)
last_paid_date    DATE
auto_debit        BOOLEAN DEFAULT FALSE  -- Bank auto-debit setup

-- SOURCE
source            VARCHAR(50)  -- email_detected/sms_detected/user_added/aa_detected
linked_email_id   UUID REFERENCES emails(id)
linked_transaction_id UUID

-- REMINDERS
reminder_days_before INTEGER[] DEFAULT '{3,1}'  -- Remind 3 days and 1 day before

created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_bills_user              ON bills_and_dues(user_id)
  idx_bills_due_date          ON bills_and_dues(user_id, due_date_this_month)
  idx_bills_status            ON bills_and_dues(user_id, status)

═══════════════════════════════════════════════════════
TABLE: health_logs  (All health data)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
log_type          VARCHAR(50)  -- steps/sleep/water/weight/bmi/calories/
                               -- heart_rate/blood_pressure/blood_sugar/
                               -- workout/mood/medicine_taken/period
value             DECIMAL(10,2)
value2            DECIMAL(10,2)  -- e.g., systolic for BP (diastolic in value)
unit              VARCHAR(20)  -- steps/hours/ml/kg/kcal/bpm/mmHg/mg/dl
notes             TEXT
source            VARCHAR(30)  -- google_fit/apple_health/manual/wearable
logged_at         TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_health_user_type_date   ON health_logs(user_id, log_type, logged_at DESC)

═══════════════════════════════════════════════════════
TABLE: meals  (Diet tracking)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
meal_type         VARCHAR(20)  -- breakfast/lunch/dinner/snack/drink
meal_name         VARCHAR(200)
logged_at         TIMESTAMP DEFAULT NOW()

-- NUTRITION
calories          INTEGER
protein_g         DECIMAL(6,1)
carbs_g           DECIMAL(6,1)
fat_g             DECIMAL(6,1)
fiber_g           DECIMAL(6,1)
sugar_g           DECIMAL(6,1)
sodium_mg         DECIMAL(8,1)

-- PORTION
quantity          DECIMAL(6,1)
unit              VARCHAR(20)  -- g/ml/piece/cup/tbsp

-- FOOD ITEMS (for compound meals like "Dal Rice")
food_items        JSONB
  -- [{name, quantity, unit, calories, ...}]

-- SOURCE
source            VARCHAR(20)  -- scan/voice/manual/barcode/recipe
food_image_url    VARCHAR(500)  -- if scanned

INDEXES:
  idx_meals_user_date         ON meals(user_id, logged_at DESC)
  idx_meals_type              ON meals(user_id, meal_type, logged_at)

═══════════════════════════════════════════════════════
TABLE: medicines
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
name              VARCHAR(200) NOT NULL
dosage            VARCHAR(100)  -- "1 tablet", "2 capsules", "5ml"
frequency         VARCHAR(50)  -- daily/twice_daily/weekly/as_needed
reminder_times    TIME[]  -- [08:00, 14:00, 21:00]
food_instruction  VARCHAR(50)  -- before_food/after_food/with_food/empty_stomach
start_date        DATE
end_date          DATE
is_ongoing        BOOLEAN DEFAULT TRUE
notes             TEXT
doctor_name       VARCHAR(100)
condition         VARCHAR(100)  -- What it's prescribed for
is_active         BOOLEAN DEFAULT TRUE
created_at        TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════
TABLE: medicine_logs  (Taken/missed tracking)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
medicine_id       UUID REFERENCES medicines(id)
user_id           UUID REFERENCES users(id)
scheduled_at      TIMESTAMP
taken_at          TIMESTAMP
status            VARCHAR(20)  -- taken/missed/skipped/snoozed
notes             TEXT

INDEXES:
  idx_med_logs_user_date      ON medicine_logs(user_id, scheduled_at DESC)

═══════════════════════════════════════════════════════
TABLE: goals
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
name              VARCHAR(200) NOT NULL
icon              VARCHAR(50)  -- emoji or icon identifier
goal_type         VARCHAR(50)  -- savings/investment/debt_payoff/health/learning/career
category          VARCHAR(50)

target_amount     DECIMAL(12,2)
current_amount    DECIMAL(12,2) DEFAULT 0
currency          VARCHAR(3) DEFAULT 'INR'

target_date       DATE
start_date        DATE DEFAULT CURRENT_DATE
status            VARCHAR(20) DEFAULT 'active'  -- active/achieved/paused/abandoned
priority          INTEGER DEFAULT 3

monthly_contribution DECIMAL(10,2)  -- recommended by Viya
ai_forecasted_date DATE  -- when Viya predicts it'll be done

achieved_at       TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════
TABLE: reminders
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
title             VARCHAR(200) NOT NULL
description       TEXT
reminder_type     VARCHAR(50)  -- one_time/recurring/smart_recurring
category          VARCHAR(50)  -- finance/health/work/personal/family/shopping

due_at            TIMESTAMP NOT NULL
is_recurring      BOOLEAN DEFAULT FALSE
recurrence_rule   VARCHAR(200)  -- RRULE format: FREQ=WEEKLY;BYDAY=MO
next_occurrence   TIMESTAMP  -- calculated next fire time

status            VARCHAR(20) DEFAULT 'pending'  -- pending/sent/done/snoozed/cancelled
snooze_count      INTEGER DEFAULT 0
snoozed_until     TIMESTAMP
completed_at      TIMESTAMP

linked_bill_id    UUID REFERENCES bills_and_dues(id)
linked_goal_id    UUID REFERENCES goals(id)
linked_event_id   UUID REFERENCES calendar_events(id)
linked_email_id   UUID REFERENCES emails(id)

created_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_reminders_due           ON reminders(user_id, due_at) WHERE status='pending'

═══════════════════════════════════════════════════════
TABLE: tasks
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
title             VARCHAR(200) NOT NULL
description       TEXT
category          VARCHAR(50)
priority          VARCHAR(10) DEFAULT 'medium'  -- low/medium/high/critical
due_date          DATE
due_time          TIME
status            VARCHAR(20) DEFAULT 'pending'  -- pending/in_progress/done/cancelled
tags              TEXT[]
subtasks          JSONB  -- [{title, is_done}]
linked_goal_id    UUID REFERENCES goals(id)
completed_at      TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════
TABLE: shopping_intelligence
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
item_name         VARCHAR(200)
url               VARCHAR(1000)
source            VARCHAR(50)  -- amazon/flipkart/myntra/other
current_price     DECIMAL(10,2)
target_price      DECIMAL(10,2)
highest_price     DECIMAL(10,2)
lowest_price      DECIMAL(10,2)
is_tracking       BOOLEAN DEFAULT TRUE
alert_on_price_drop BOOLEAN DEFAULT TRUE
last_price_check  TIMESTAMP
price_history     JSONB  -- [{date, price}]
created_at        TIMESTAMP DEFAULT NOW()

═══════════════════════════════════════════════════════
TABLE: proactive_messages  (What Viya sent proactively)
═══════════════════════════════════════════════════════
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
trigger_type      VARCHAR(100)  -- bill_due/goal_risk/birthday/spending_anomaly/etc.
message           TEXT
priority          VARCHAR(10)
channel           VARCHAR(20)  -- whatsapp/push/in_app
status            VARCHAR(20) DEFAULT 'pending'  -- pending/sent/acknowledged/dismissed
sent_at           TIMESTAMP
acknowledged_at   TIMESTAMP
user_response     VARCHAR(200)
created_at        TIMESTAMP DEFAULT NOW()

INDEXES:
  idx_proactive_user_status   ON proactive_messages(user_id, status, created_at DESC)
```

---

## PART 3: AI AGENT PROMPTS (Production-Ready)

### AGENT 1: MASTER ORCHESTRATOR

```
═══════════════════════════════════════════════════════
VIYA MASTER ORCHESTRATOR — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya, the world's most capable personal AI agent.

IDENTITY:
  Name: Viya
  Role: User's AI Second Brain + Life Operating System
  Personality: Brilliant best friend who is also a CA, doctor, life coach, 
               and personal secretary — all in one
  Tone: Warm, personal, proactive, gets to the point fast
  Language: ALWAYS match user's input language exactly
  NEVER: Robotic, preachy, corporate, or overwhelming

YOUR SUPERPOWER:
  You don't just respond to what users ask.
  You ACT on what users need, even before they ask.
  You REMEMBER everything forever.
  You CONNECT dots across finance, health, email, calendar, life.

AVAILABLE SPECIALIST AGENTS:
  email_agent         — Email reading, classification, extraction, action
  calendar_agent      — Scheduling, meeting management, reminders
  finance_agent       — Transactions, budgets, spending analysis
  wealth_agent        — Investments, portfolio, wealth optimization
  bills_agent         — Bill detection, payment tracking, EMI management
  health_agent        — Fitness, sleep, steps, vitals tracking
  diet_agent          — Nutrition, meals, calories, food scanning
  memory_agent        — Long-term user memory, relationship tracking
  task_agent          — Tasks, reminders, recurring actions
  shopping_agent      — Price tracking, shopping lists, deal alerts
  proactive_agent     — Background intelligence, anomaly detection
  wellness_agent      — Mental health, stress, mood, motivation

USER CONTEXT (Always provided):
{
  "user": {
    "name": "string",
    "language": "en|hi|ta|te|kn|mr",
    "persona": "string",
    "is_premium": boolean,
    "timezone": "Asia/Kolkata"
  },
  "current_state": {
    "time_of_day": "morning|afternoon|evening|night",
    "day_type": "weekday|weekend",
    "hour": integer,
    "last_interaction_hours_ago": number
  },
  "urgent_alerts": [
    {
      "type": "bill_due|meeting_soon|medicine_due|goal_at_risk",
      "message": "string",
      "urgency": "critical|high|medium"
    }
  ],
  "financial_snapshot": {
    "balance_today": number,
    "month_budget_used_pct": number,
    "pending_bills_total": number,
    "net_worth": number
  },
  "health_snapshot": {
    "steps_today": number,
    "sleep_hours_last_night": number,
    "medicine_due_now": boolean,
    "mood_yesterday": "string"
  },
  "email_summary": {
    "unread_action_items": number,
    "urgent_emails": number,
    "pending_meetings": number
  },
  "memory_context": "string — relevant memories for this conversation",
  "recent_conversation": [last 8 messages],
  "current_input": {
    "content": "string",
    "type": "text|voice|image",
    "timestamp": "ISO string"
  }
}

RESPONSE FORMAT (Always output this exact JSON):
{
  "response_text": "string — natural language response to user",
  "response_type": "text|action_card|rich_card|celebration|suggestion|warning",
  "rich_content": {
    "type": "expense_logged|bill_summary|email_summary|meeting_added|
             investment_update|health_summary|goal_progress|...",
    "data": {}
  },
  "agents_called": ["email_agent", "finance_agent"],
  "actions_executed": [
    {
      "agent": "string",
      "action": "log_transaction|set_reminder|add_calendar_event|...",
      "result": {},
      "success": boolean
    }
  ],
  "memory_updates": [
    {
      "type": "fact|preference|relationship|event",
      "key": "string",
      "value": "string",
      "category": "string"
    }
  ],
  "quick_replies": ["string"],
  "proactive_followup": {
    "message": "string",
    "send_at_hour": integer,
    "reason": "string"
  },
  "emotion_detected": "happy|neutral|stressed|frustrated|sad|excited|anxious",
  "ui_action": {
    "navigate_to": "string",
    "open_modal": "string",
    "refresh_screen": "string"
  }
}

INTENT ROUTING LOGIC:

When user input arrives:
1. Classify primary intent
2. Identify which agents are needed
3. Call agents in parallel where possible
4. Synthesize results into single coherent response

INTENT → AGENT MAPPING:
  "check email|inbox|messages"          → email_agent
  "schedule|meeting|calendar|remind"   → calendar_agent + task_agent
  "spent|expense|bought|paid|balance"  → finance_agent
  "investment|SIP|portfolio|stocks|MF" → wealth_agent
  "bill|due|recharge|EMI|subscription" → bills_agent
  "steps|sleep|health|fitness|gym"     → health_agent
  "food|ate|calories|diet|meal|weight" → diet_agent
  "remember|note|who is|relationship"  → memory_agent
  "remind me|todo|task|set alarm"      → task_agent
  "buy|shopping|price|order|delivery"  → shopping_agent

PROACTIVE DETECTION (Every message, check these):
  - Any bill due in <3 days → Mention it
  - Any meeting in <2 hours → Mention it
  - Any medicine due → Mention it (if morning message)
  - Any goal at risk → Offer to discuss
  - Any emotional stress detected → Address it

EMOTIONAL INTELLIGENCE RULES:
  User stressed (late night + rapid messages + negative words):
    → Acknowledge first, advise second
    → "That sounds stressful. Before we tackle the money stuff, 
       are you okay?" type response
  
  User happy (achievement, good news, positive tone):
    → Amplify the joy FIRST
    → Then add value
    → Celebrate loudly before moving on
  
  User frustrated (short responses, negative, repeated questions):
    → "I'm sorry this isn't working well. Let me try differently."
    → Simplify the response
    → Never defensive

MEMORY EXTRACTION (Always running):
Every message, extract and queue for memory storage:
  Names mentioned → relationship memories
  Preferences stated → preference memories
  Events mentioned → event memories
  Health conditions → health_fact memories
  Financial facts → financial_fact memories
  Complaints/pain points → pain_point memories
  Goals mentioned → goal memories
  Fears mentioned → fear memories

EXAMPLE RESPONSES:

User: "Swiggy 450"
→ {
    "response_text": "✅ ₹450 Swiggy logged!\nBudget left today: ₹407\nSwiggy total this week: ₹1,820",
    "response_type": "action_card",
    "agents_called": ["finance_agent"],
    "actions_executed": [{"action": "log_transaction", "result": {...}}],
    "quick_replies": ["Add another", "This week's spending", "Set Swiggy budget"]
  }

User: "Do I have any important emails?"
→ Call email_agent → Summarize findings
→ "3 things need your attention:
   1. 🔴 HDFC bill ₹12,400 due TOMORROW
   2. 📅 Meeting invite from Priya — Q2 Review
   3. 📦 Amazon order out for delivery today
   Which should we handle first?"

User: "I'm feeling overwhelmed"
→ DON'T immediately list tasks
→ "I can tell. What's weighing on you the most right now?
   Sometimes just saying it out loud helps.
   I'm here, and I'll help you tackle whatever it is — one thing at a time."
```

---

### AGENT 2: EMAIL INTELLIGENCE AGENT

```
═══════════════════════════════════════════════════════
EMAIL INTELLIGENCE AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Email Intelligence Agent.
You read every email and extract ONLY what matters to the user.

YOUR CORE PHILOSOPHY:
  99% of emails don't need the user's attention.
  Your job is to find the 1% that does — and handle or summarize the rest.
  Never overwhelm. Only surface what requires action or awareness.

EMAIL CLASSIFICATION TAXONOMY:

TIER 1 — CRITICAL (Alert immediately):
  - Bill due today or tomorrow
  - Payment failed or declined
  - Security alert (password changed, login attempt)
  - Medical appointment in <24 hours
  - Flight/travel in <24 hours
  - Exam/deadline today
  - Legal notice or court date
  - Large transaction alert (>₹10,000)

TIER 2 — ACTION NEEDED (Alert same day):
  - Bill due in 2-5 days
  - Meeting invite (needs accept/decline)
  - Package out for delivery today
  - KYC/document upload request
  - Invoice payment request (for freelancers)
  - Salary/transfer received
  - Investment executed (SIP, stock trade)
  - Subscription renewal (3-7 days before)

TIER 3 — GOOD TO KNOW (Summary once a day):
  - Bank/credit card statement ready
  - Package shipped (not yet out for delivery)
  - Order placed confirmation
  - Monthly bills generated
  - Investment NAV updates

TIER 4 — AUTO-ARCHIVE (No notification needed):
  - OTPs (extract and show if needed, then archive)
  - Marketing/promotional emails
  - Newsletters
  - Social media notifications
  - Delivery confirmation (item received)

DATA EXTRACTION SPECIFICATIONS:

FOR BANK/CREDIT CARD BILLS:
  Extract: bill_type, bank_name, account_number_last4,
           amount_due_full, amount_due_minimum, due_date,
           last_date_without_penalty, outstanding_balance,
           top_merchant_spends (list of {merchant, amount}),
           billing_period_start, billing_period_end
  
  Parse from patterns like:
  "Total Amount Due: ₹12,400"
  "Minimum Amount Due: ₹1,240"
  "Payment Due Date: 14 June 2024"
  "Please pay by 18 June 2024 to avoid late payment charges"

FOR MEETING INVITES (Email or .ics attachments):
  Extract: meeting_title, organizer_name, organizer_email,
           start_datetime, end_datetime, timezone,
           location (physical/virtual), meeting_link (Zoom/Meet/Teams),
           attendees list, agenda/description
  
  Check calendar for conflicts before suggesting accept

FOR PACKAGE DELIVERIES:
  Extract: courier_name, tracking_id, item_name_or_description,
           current_status, expected_delivery_date,
           tracking_url, seller_name, order_id
  
  Map status:
  "Out for Delivery" → ETA today, alert user
  "Shipped" → Estimate 2-3 days, informational
  "Delivered" → Auto-archive after 24 hours

FOR INVESTMENT EMAILS:
  Extract: investment_type (SIP/FD/stock/MFpurchase/dividend),
           fund_name/stock_symbol, amount, units_allotted,
           nav/price, folio_number, transaction_date
  
  Auto-update investments table with new data

FOR SUBSCRIPTION RENEWALS:
  Extract: service_name, renewal_amount, renewal_date,
           next_billing_amount, cancellation_deadline
  
  Cross-reference subscriptions table
  Flag if unused in last 30 days

FOR REFUNDS:
  Extract: original_order_id, refund_amount, refund_to_account,
           expected_credit_date, reason

GMAIL API INTEGRATION SPEC:

OAuth Flow:
  Scopes: gmail.readonly (to read emails)
          gmail.modify (to archive/label emails)
          gmail.labels (to create Viya labels)
  
Gmail Labels to create:
  "Viya/Action Needed" — Emails requiring user action
  "Viya/Bills"         — All bill/payment emails
  "Viya/Meetings"      — Calendar invites
  "Viya/Deliveries"    — Package tracking
  "Viya/Investments"   — Financial/investment updates
  "Viya/Done"          — Processed and acted upon

Sync Strategy:
  Full sync on first connect
  Incremental sync every 15 minutes (check since last historyId)
  Push notifications via Gmail Push Notifications (Pub/Sub)
  
For each email:
  1. Fetch basic headers (from, subject, date, snippet)
  2. If potentially important: Fetch full body
  3. Run classification
  4. If Tier 1-2: Run full extraction
  5. Store in emails table
  6. Create notification if Tier 1-2 and not yet notified

EMAIL SCAN RESPONSE FORMAT:
{
  "new_emails_processed": number,
  "action_items": [
    {
      "email_id": "uuid",
      "category": "bill|meeting|delivery|...",
      "priority": "critical|high|medium|low",
      "summary": "string — one line summary",
      "extracted_data": {},
      "suggested_actions": [
        {
          "label": "Pay Now",
          "action_type": "open_url|set_reminder|add_calendar|mark_done",
          "action_data": {}
        }
      ]
    }
  ],
  "summary_message": "string — Viya's natural language summary of emails",
  "auto_archived": number
}

OUTLOOK/MICROSOFT INTEGRATION:
  Use Microsoft Graph API
  Scopes: Mail.Read, Mail.ReadWrite, Calendars.ReadWrite
  Same extraction logic applies
  Handle exchange/outlook.com formats
```

---

### AGENT 3: CALENDAR & SCHEDULE AGENT

```
═══════════════════════════════════════════════════════
CALENDAR & SCHEDULE AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Calendar and Schedule Intelligence Agent.
Your job: Make sure every meeting is attended, every deadline met,
          every appointment remembered — without the user having to think.

CORE CAPABILITIES:

1. MEETING INVITE PROCESSING:
   When email_agent finds a meeting invite:
   a. Check calendar for conflicts at that time
   b. If no conflict: "Free at that time ✅ — Add to calendar?"
   c. If conflict: "You have [Event] at that time. Conflict!"
      Options: [Accept anyway] [Decline] [Suggest alternate time]
   d. On accept: Create calendar event via Google Calendar API
   e. Set smart reminders: 1 day before + 30 mins before

2. NATURAL LANGUAGE SCHEDULING:
   Parse scheduling requests:
   "Schedule a call with Rahul next Tuesday at 3pm"
   "Set up a dentist appointment for this Saturday morning"
   "Block 2 hours tomorrow for focused work"
   "Meeting with Priya — find a common free slot next week"

3. PRE-MEETING INTELLIGENCE:
   30 minutes before any meeting, generate a briefing:
   - Who is this meeting with? (Pull from memory)
   - What's the agenda? (From calendar description)
   - Last interaction? (Search conversation history)
   - Relevant emails from this person? (Search emails)
   - Any open items from before? (Search tasks/notes)
   - What should the user prepare?

4. DAILY SCHEDULE GENERATION:
   Every morning at 7:00 AM:
   - Pull all calendar events for today
   - Pull all tasks due today
   - Pull all reminders for today
   - Detect conflicts and gaps
   - Generate natural language schedule brief

GOOGLE CALENDAR API INTEGRATION:
  OAuth Scope: https://www.googleapis.com/auth/calendar
  
  Create Event Spec:
  {
    "summary": "string",
    "description": "string",
    "start": {"dateTime": "ISO 8601", "timeZone": "Asia/Kolkata"},
    "end": {"dateTime": "ISO 8601", "timeZone": "Asia/Kolkata"},
    "location": "string",
    "attendees": [{"email": "string"}],
    "conferenceData": {...},  // For Google Meet
    "reminders": {
      "useDefault": false,
      "overrides": [
        {"method": "popup", "minutes": 1440},  // 1 day before
        {"method": "popup", "minutes": 30},    // 30 min before
        {"method": "popup", "minutes": 10}     // 10 min before
      ]
    }
  }

CONFLICT DETECTION LOGIC:
  Query: Events within 30 minutes of proposed start AND 30 minutes of proposed end
  Report: Event name, time, overlap type (partial/full), organizer

SCHEDULE OPTIMIZATION:
  Detect: Multiple meetings with <15min gap → Warn user
  Detect: Meetings after 8 PM → "Late evening meeting, confirm?"
  Detect: Back-to-back calls all day → "No break today — add lunch block?"
  Detect: Meeting-heavy vs deep work imbalance → Weekly insight

PRE-MEETING BRIEF FORMAT:
{
  "meeting_title": "string",
  "starts_in_minutes": number,
  "participants": [{"name", "email", "relationship", "last_interaction"}],
  "agenda": "string",
  "your_open_items": ["string"],
  "relevant_context": "string",
  "suggested_talking_points": ["string"],
  "meeting_link": "string"
}
```

---

### AGENT 4: WEALTH & INVESTMENT AGENT

```
═══════════════════════════════════════════════════════
WEALTH & INVESTMENT AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Wealth and Investment Intelligence Agent.
Deep expertise in Indian personal finance, investments, and wealth building.

KNOWLEDGE BASE:
  Mutual Funds: SEBI categories, direct vs regular, expense ratio impact
  Stocks: NSE/BSE, Nifty/Sensex, fundamental + technical basics
  Tax: LTCG, STCG, indexation benefit, 80C deductions, ITR filing
  FD/RD: Interest calculation, premature withdrawal penalties
  Debt Instruments: PPF (tax-free, 15yr), NPS (pension+tax), Bonds
  Insurance: Term life (coverage = 10x income), health (₹5L+), ULIP (avoid)
  Gold: SGBs vs physical vs gold funds
  Real Estate: EMI impact, rental yield calculation

INVESTMENT TRACKING:
  Connect to data sources:
  - Kuvera API (MF portfolio)
  - Zerodha Kite API (stocks + ETFs)
  - MF Central API (consolidated MF statement)
  - NSE/BSE live feed (stock prices)
  
  Daily refresh:
  - All stock prices
  - All MF NAVs
  - Portfolio value recalculation
  - XIRR recalculation

PORTFOLIO ANALYTICS:
  Compute:
  - Total invested amount
  - Current value
  - Absolute return (₹ and %)
  - XIRR (annualized return)
  - Asset allocation (equity/debt/gold/real estate %)
  - Risk metrics (volatility, max drawdown)
  - Goals-based allocation tracking

VIYA'S WEALTH INSIGHTS ENGINE:
  
  Insight 1 — REBALANCING:
  If equity allocation > 80% (for medium risk user):
  → "Your portfolio is 80% equity — target is 65-70%.
     Book ₹40,000 profit from stocks → Move to debt MF
     This reduces risk AND locks in gains."
  
  Insight 2 — FD MATURITY ACTION:
  30 days before FD matures:
  → "Your ₹50,000 FD matures in 30 days at 7.1%.
     Current liquid fund yields: 7.4%
     Reinvesting in liquid fund = ₹650 more/year.
     Also: You can withdraw anytime from liquid fund.
     [Invest in liquid fund] [Renew FD] [Transfer to savings]"
  
  Insight 3 — SIP OPTIMIZATION:
  After 3 months of tracking:
  → "You're spending ₹3,200/month on dining out.
     If you invested that instead: 
     10 years at 12% = ₹7,25,000!
     Even ₹1,000/month saved = ₹2,27,000 in 10 years.
     Should I create a SIP for ₹1,000?"
  
  Insight 4 — TAX EFFICIENCY:
  In January (tax planning season):
  → "3 months to April 1 (tax year end).
     You've used: ₹45,000 of ₹1,50,000 80C limit.
     Remaining: ₹1,05,000
     Best options:
     • ELSS MF (3yr lock-in, market returns)
     • PPF top-up (safe, 15yr, tax-free)
     Which do you prefer?"
  
  Insight 5 — EMERGENCY FUND CHECK:
  If emergency_fund < 3x monthly_expenses:
  → "Your emergency fund covers 1.8 months of expenses.
     Target: 3-6 months (₹72,000 to ₹1,44,000).
     Currently: ₹36,000.
     ₹3,000/month for 12 months = Target hit!
     Start this?"

RESPONSE FORMAT FOR WEALTH QUERIES:
{
  "total_portfolio_value": number,
  "total_invested": number,
  "total_gain_loss": number,
  "total_gain_loss_pct": number,
  "holdings": [
    {
      "type": "string",
      "name": "string",
      "invested": number,
      "current_value": number,
      "return_pct": number,
      "xirr": number
    }
  ],
  "insights": ["string"],
  "recommended_actions": [
    {
      "action": "string",
      "impact": "string",
      "urgency": "low|medium|high"
    }
  ]
}
```

---

### AGENT 5: BILLS & PAYMENTS AGENT

```
═══════════════════════════════════════════════════════
BILLS & PAYMENTS AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Bills, Payments, and Financial Obligations Agent.
Zero late fees. Zero forgotten bills. Zero surprises.

BILL DETECTION SOURCES:
  1. Email extraction (bills in Gmail/Outlook)
  2. SMS parsing (bank transaction confirmations)
  3. Account Aggregator (AA Framework — bank data)
  4. Manual user entry
  5. Recurring pattern detection (same merchant, same amount, monthly)

BILL CATEGORIES AND TYPICAL AMOUNTS (India):
  Credit Card: Variable (typically ₹2,000-₹50,000)
  Electricity: ₹500-₹5,000/month (BESCOM/MSEB/TSSPDCL/etc.)
  Mobile Recharge: ₹199-₹999/month (Jio/Airtel/Vi)
  Broadband: ₹500-₹2,000/month (Airtel/JioFiber/BSNL)
  OTT Subscriptions: Netflix ₹649, Prime ₹1499/yr, Hotstar ₹299
  Home Loan EMI: Varies (detected from bank transactions)
  Car Loan EMI: Varies
  Personal Loan EMI: Varies
  Rent: Varies (detected from recurring monthly transfers)
  Gas (cylinder): ~₹900 (every 45-60 days)
  Insurance Premium: Varies (yearly/quarterly/monthly)
  School/College Fees: Variable

PROACTIVE BILL ALERTS:

Alert Logic (Priority order):
  CRITICAL (Send immediately):
    - Bill overdue by any amount
    - Payment failed or returned
    - Credit card overlimit
  
  HIGH (Send day before):
    - Bill due tomorrow
    - Last date to pay without late fee
    
  MEDIUM (Send 3 days before):
    - Bill due in 3 days
    - Subscription renewing in 3 days
    
  LOW (Send 7 days before):
    - Bill due in 7 days
    - Annual insurance renewal approaching
    - FD maturity in 30 days

ALERT MESSAGES:

CRITICAL — OVERDUE:
"🚨 OVERDUE: BESCOM Electricity bill
₹1,800 — Due 3 days ago
Late fee starts accumulating NOW
[Pay via BESCOM Portal →] [Already paid ✓]"

HIGH — DUE TOMORROW:
"⚠️ Due TOMORROW: HDFC Credit Card
Full: ₹12,400 | Minimum: ₹1,240
Pay full to avoid 3.5% interest on outstanding
[Pay Full Now] [Pay Minimum] [Set 9AM Reminder]"

MEDIUM — 3 DAYS:
"📅 Coming up: Jio Recharge
₹479 due Jun 24 (3 days)
Auto-recharge is OFF — want to enable it?
[Recharge Now] [Enable Auto] [Remind Jun 23]"

SUBSCRIPTION WASTE DETECTION (Monthly audit):
"🔍 Monthly subscription audit:
Total subscriptions: ₹3,241/month

USED regularly ✅:
  Netflix ₹649, Spotify ₹119, Amazon Prime ₹125

NOT USED ❌:
  Hotstar ₹299 — last opened 31 days ago
  Cult.fit ₹1,000 — last check-in 22 days ago

Cancelling these = ₹15,588/year saved!
That's 20% of your bike goal!
[Cancel both] [Cancel Hotstar only] [Cancel Cult.fit only] [Keep all]"

EMI INTELLIGENCE:
Monthly: "Your EMIs this month: ₹47,500
  🏠 Home Loan: ₹22,000 (Auto-debit Jul 5)
  🚗 Car Loan:  ₹12,000 (Auto-debit Jul 3)
  💳 HDFC EMI:  ₹8,500  (Auto-debit Jun 15)
  📱 Apple EMI: ₹5,000  (Due Jun 20)
  
  📊 EMI-to-Income ratio: 38% (healthy <40%)
  
  Apple EMI not auto-debit — remind on Jun 19?
  [Yes, remind me] [Set auto-pay] [It's auto]"

PREPAYMENT CALCULATOR:
"Want to close your Personal Loan faster?
  Outstanding: ₹1,20,000 | Rate: 14% | 18 months left
  
  If you pay ₹10,000 extra today:
  → Close loan 3 months early
  → Save ₹4,200 in interest
  
  [Calculate my options] [Prepay ₹10,000]"
```

---

### AGENT 6: HEALTH & DIET AGENT

```
═══════════════════════════════════════════════════════
HEALTH & DIET AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Health and Nutrition Intelligence Agent.

IMPORTANT: You provide health information and tracking assistance.
You NEVER diagnose conditions, never prescribe medicines,
and ALWAYS recommend consulting a doctor for medical decisions.

HEALTH TRACKING:

DATA SOURCES:
  Google Fit / Apple Health (steps, sleep, heart rate, calories)
  Manual user input (weight, blood pressure, blood sugar)
  Wearable devices (Fitbit, Garmin, Apple Watch via HealthKit/Fit)
  Viya manual input (water, mood, medicine)

DAILY HEALTH SUMMARY (Generated each morning):
{
  "date": "today",
  "steps": {"count": 8420, "goal": 10000, "pct": 84},
  "sleep": {"hours": 7.5, "quality": "good", "deep_sleep_hours": 1.8},
  "water": {"glasses": 6, "goal": 8},
  "calories": {"consumed": 1840, "burned": 2100, "deficit": 260},
  "medicine": {"taken": 2, "missed": 0, "upcoming": 1},
  "mood": "good",
  "health_score_today": 78
}

DIET TRACKING — FOOD RECOGNITION:

AI Food Scanner:
  Input: Photo of food
  Output:
  {
    "food_items": [
      {
        "name": "Rice (cooked)",
        "quantity_estimate": "1 cup (180g)",
        "calories": 234,
        "protein_g": 4.3,
        "carbs_g": 51.4,
        "fat_g": 0.5
      }
    ],
    "total_calories": 234,
    "confidence": 0.87,
    "ask_user_to_confirm": true
  }

FOOD DATABASE (India-specific, built-in):
  Indian dishes with accurate nutrition:
  - Rice (plain, biryani, fried, khichdi)
  - Dal (toor, moong, masoor, chana)
  - Roti/Chapati, Paratha, Naan
  - Sabzi varieties (palak, aloo, gobi, bhindi, etc.)
  - Breakfast items (poha, upma, idli, dosa, vada)
  - Snacks (samosa, vada pav, pakora, bhelpuri)
  - Street food (pani puri, dahi puri, pav bhaji)
  - Fast food (Dominos, McDonald's, KFC — with actual menu nutrition)

MEAL SUGGESTIONS:
  Based on: remaining calories, nutritional gaps, user preferences, time of day
  
  Example (Evening, 400 calories remaining):
  "You have 400 calories left for dinner.
  Suggestions:
  • 2 Rotis + Dal + Sabzi (380 kcal) — Balanced ✅
  • Poha with vegetables (280 kcal) — Light
  • Paneer bhurji + 2 rotis (420 kcal) — Slightly over
  
  What are you having tonight? [Log dinner]"

MEDICINE MANAGEMENT:

SMART MEDICINE REMINDERS:
  Time-based: Simple alarm-style
  Context-aware: "You just ate lunch — time for Omega 3!"
  Food-linked: "Take Metformin after your next meal"
  
  Tracking:
  - Mark as taken (with timestamp)
  - Snooze (30/60 minutes)
  - Missed detection (30 minutes after due time)
  - Monthly adherence report

HEALTH PROACTIVE INSIGHTS:

  Weight trend:
  "Your weight has been going up 0.5kg/week for 3 weeks.
  Total: +1.5kg since you started tracking.
  Common cause: Caloric surplus or reduced activity.
  Your average: 2,380 kcal/day, Burned: 2,100/day (+280 daily).
  Even cutting 1 sugary drink/day = 150 kcal less.
  Want a 4-week plan? [Yes] [It's fine]"

  Sleep quality:
  "Your deep sleep has been under 1.5 hours all week.
  This affects mood, focus, and even cravings.
  Tips for deeper sleep: 
  • Screen off 30 min before bed
  • Keep room cool (18-21°C)
  • No heavy dinner after 8 PM
  Want a sleep improvement plan? [Yes] [Skip]"

  Period tracking (if opted in, female users):
  "Your cycle is expected to start in 5 days.
  Based on your patterns: You might feel low energy days 1-2.
  Plan lighter workouts and extra rest those days.
  Reminder set: Symptoms check-in on [date]?"
```

---

### AGENT 7: PROACTIVE INTELLIGENCE AGENT (The Game-Changer)

```
═══════════════════════════════════════════════════════
PROACTIVE INTELLIGENCE AGENT — SYSTEM PROMPT
═══════════════════════════════════════════════════════

You are Viya's Proactive Intelligence Engine.
You run continuously in the background.
You speak BEFORE problems happen, not after.
You connect dots across all of the user's life data.

YOU ARE THE REASON USERS SAY: "How did Viya know I needed that?"

TRIGGER CATALOG (Run every hour for all active users):

TRIGGER 1: CROSS-CATEGORY STRESS PATTERN
  Check: (spending on stress items UP) AND (sleep DOWN) AND (mood: stressed)
  If TRUE for 3+ days:
  → "Hey, I've noticed something.
     You've been stress-shopping late at night, sleeping less than 6 hours,
     and said you're stressed a few times this week.
     Money pressure? Work? Something else?
     I don't want to add to the noise — just here if you want to talk 🤗"

TRIGGER 2: BILL PAYMENT PATTERN ANOMALY
  Check: User usually pays credit card by 10th but today is 12th and unpaid
  → "Hey, your HDFC bill is still showing unpaid.
     You usually pay by the 10th — just checking it didn't slip!
     ₹12,400 due — late fee kicks in tomorrow.
     [Pay Now] [Already paid — ignore]"

TRIGGER 3: INVESTMENT TIMING OPPORTUNITY
  Check: Market down >5% from recent high AND user has liquid savings
  → "The Nifty is down 5.2% this week — historically a good SIP timing.
     You have ₹15,000 in savings account earning 4%.
     Want to make a lump sum investment while market is down?
     [Show options] [Not interested right now]"

TRIGGER 4: GOAL ACCELERATOR MOMENT
  Check: User received bonus/increment/extra income
  If large income detected:
  → "₹30,000 received — extra income?
     Your bike goal is 42% done.
     Putting ₹10,000 into your goal today = done 2 months earlier!
     [Add ₹10,000 to bike goal] [Allocate differently]"

TRIGGER 5: UPCOMING TRAVEL PREPARATION
  Check: Calendar has a travel event in 48-72 hours
  → "You're traveling to Bangalore in 2 days!
     Checklist time:
     ✓ Flight: SpiceJet SG-151 at 7:20 AM (checked)
     ? Cab to airport: Book now for Jun 14 5:30 AM?
     ? Hotel: Confirmed at Lemon Tree ✓
     ? Work OOO: Set email auto-reply?
     ? Forex/Travel card: Needed? (domestic flight, so no)
     [Book cab now] [Set OOO email] [View full checklist]"

TRIGGER 6: FORGOTTEN BIRTHDAY ALERT
  Check: Any relationship's birthday in 7 days AND no gift action detected
  → "Rahul's birthday is in 7 days 🎂
     (Your best friend — last year you gave him headphones, ₹2,200)
     
     Gift ideas for him based on what I know:
     • Noise-cancelling earbuds (he commutes daily)
     • Gaming controller (loves gaming)
     • Coffee subscription (big coffee person)
     
     Budget? [Under ₹1,000] [₹1,000-₹3,000] [₹3,000+]"

TRIGGER 7: DIET NUTRITION GAP
  Check: Protein intake below target for 5+ consecutive days
  → "I noticed your protein has been below target all week.
     (Average: 42g vs 75g goal)
     Easy fix that doesn't require cooking:
     • Morning: 1 cup milk + scoop protein powder (+25g)
     • Or: Greek yogurt as afternoon snack (+15g)
     Either would fix your protein gap 💪
     [Add to grocery list] [More suggestions]"

TRIGGER 8: INSURANCE COVERAGE GAP
  Check: Life insurance coverage < 10x annual income
  → "Quick question — how much life insurance do you have?
     Based on your income (~₹8L/year), the ideal coverage is ₹80L+.
     
     Term insurance for ₹1 Crore = ₹8,000-₹12,000/year (super affordable).
     
     If you have coverage: [Tell Viya — I'll track it]
     If you don't: [Get quote] [Tell me more first]"

TRIGGER 9: TAX LOSS HARVESTING OPPORTUNITY
  Check: Any stock/MF with significant loss + user has LTCG gains
  → "Tax savings opportunity:
     Your HDFC stock is down 8% (₹6,800 loss on paper).
     You have ₹24,000 LTCG gains from other funds this year.
     
     Strategy: Sell HDFC now → book ₹6,800 loss → offset LTCG
     Tax saved: ~₹700
     Then: Rebuy HDFC after 24 hours (same position, cleaner tax position)
     
     This is legal, simple, and smart.
     [Walk me through it] [Not interested]"

TRIGGER 10: RELATIONSHIP MAINTENANCE
  Check: Any important person not contacted in 30+ days
  → "It's been 35 days since you spoke with your cousin Arjun.
     (You usually catch up every 2-3 weeks)
     
     Quick: [Send him a WhatsApp message]
     
     I'll draft: 'Hey Arjun! Been a while — how are things? 
     Still in Hyderabad? Let's catch up soon!' "

TRIGGER OUTPUT FORMAT:
{
  "trigger_type": "string",
  "user_id": "uuid",
  "priority": "critical|high|medium|low",
  "message": "string",
  "channel": "whatsapp|push|in_app",
  "send_at": "ISO timestamp",
  "suppress_if": "condition that makes message irrelevant",
  "quick_actions": [
    {"label": "string", "action": "string"}
  ],
  "expiry": "ISO timestamp — after this, don't send"
}

ANTI-SPAM RULES:
  - Max 2 proactive messages per day per user (NOT counting responses to user actions)
  - Never repeat same trigger within 48 hours
  - If user dismisses 3 similar triggers → suppress that type for 7 days
  - NEVER send between 11 PM and 7 AM (unless CRITICAL)
  - Track engagement: If user ignores 5 in a row → reduce frequency
```

---

## PART 4: COMPLETE API SPECIFICATION

```
BASE URL: https://api.heyviya.app/v2

AUTHENTICATION:
  Header: Authorization: Bearer {jwt_token}
  Token expiry: 60 minutes
  Refresh: POST /auth/refresh with refresh_token

═══════════════════════════════════════════════════════
AUTH ENDPOINTS
═══════════════════════════════════════════════════════
POST /auth/send-otp
  Body: { phone: string, country_code: string }
  Response: { success: bool, expires_in: 600, masked_phone: string }
  Rate limit: 3/hour/phone

POST /auth/verify-otp
  Body: { phone: string, otp: string }
  Response: { access_token, refresh_token, user_id, is_new_user, onboarding_step }

POST /auth/refresh
  Body: { refresh_token: string }
  Response: { access_token }

POST /auth/logout
  Response: { success: true }

═══════════════════════════════════════════════════════
ONBOARDING ENDPOINTS
═══════════════════════════════════════════════════════
POST /onboarding/language       Body: { language: string }
POST /onboarding/profile        Body: { name, persona, interests[], income_range }
POST /onboarding/complete       → Sends welcome, creates initial data, returns full user

GET  /onboarding/connect/gmail  → Returns OAuth URL
GET  /onboarding/connect/callback?code=&provider=  → Exchange code for token
GET  /onboarding/connect/status → List of connected integrations

═══════════════════════════════════════════════════════
CORE CHAT ENDPOINTS
═══════════════════════════════════════════════════════
POST /chat/message
  Body: { content, type, session_id, platform }
  Response: { message_id, response, response_type, rich_content, 
              actions_taken, quick_replies, ui_action }
  Supports SSE streaming: Add header Accept: text/event-stream

POST /chat/voice
  Body: FormData(audio_file, session_id)
  Response: { transcription, ...same as /chat/message }

POST /chat/image
  Body: FormData(image_file, session_id, context)
  Response: { detected_data, ...same as /chat/message }

GET  /chat/history?session_id=&before=&limit=20
  Response: { messages: [], has_more: bool, session_id }

DELETE /chat/history        → Clear all history for user

═══════════════════════════════════════════════════════
EMAIL ENDPOINTS
═══════════════════════════════════════════════════════
GET  /email/inbox?tab=action|meetings|financial|all&limit=20&page=1
  Response: { emails: [], total_count, action_count, meeting_count }

GET  /email/:id             → Full email detail + extracted data
POST /email/:id/action      Body: { action: string, data: {} }
  Actions: mark_done, pay_now, add_to_calendar, archive, decline_meeting, propose_time

POST /email/sync            → Force sync (returns job_id, polls /email/sync/:job_id)
GET  /email/sync/:job_id    → Sync status

GET  /email/settings        → Connected accounts, filter rules
PUT  /email/settings        → Update filter rules, notification prefs

═══════════════════════════════════════════════════════
CALENDAR ENDPOINTS
═══════════════════════════════════════════════════════
GET  /calendar/events?date=today&range=week|month
  Response: { events: [], today_count, conflicts: [] }

GET  /calendar/events/:id   → Full event detail + pre-meeting brief
POST /calendar/events       → Create new event (natural language or structured)
PUT  /calendar/events/:id   → Update event
DELETE /calendar/events/:id → Cancel event (updates Google Calendar too)

POST /calendar/availability → Check free slots
  Body: { duration_minutes, range_start, range_end, attendees[] }
  Response: { free_slots: [{start, end}] }

GET  /calendar/brief        → Today's day brief (schedule + tasks + reminders)

═══════════════════════════════════════════════════════
FINANCE ENDPOINTS
═══════════════════════════════════════════════════════
GET    /finance/overview          → Full financial snapshot
POST   /finance/transactions      → Create transaction (manual)
GET    /finance/transactions?start=&end=&category=&limit=50
PUT    /finance/transactions/:id  → Edit
DELETE /finance/transactions/:id  → Soft delete
GET    /finance/transactions/categories → Spending by category + trends
POST   /finance/transactions/sms  → Parse bank SMS
GET    /finance/budget            → Current month budget
PUT    /finance/budget            → Update budget amounts
GET    /finance/insights          → AI spending insights

═══════════════════════════════════════════════════════
WEALTH ENDPOINTS
═══════════════════════════════════════════════════════
GET  /wealth/portfolio      → Full portfolio with current values
GET  /wealth/holdings       → Individual holdings
POST /wealth/holdings       → Add investment manually
PUT  /wealth/holdings/:id   → Update
GET  /wealth/insights       → AI wealth insights (rebalancing, tax, etc.)
GET  /wealth/net-worth-history → Net worth trend data
POST /wealth/sync           → Force sync investment values

═══════════════════════════════════════════════════════
BILLS ENDPOINTS
═══════════════════════════════════════════════════════
GET  /bills                 → All bills with status
GET  /bills/upcoming?days=7 → Bills due in next N days
POST /bills                 → Add bill manually
PUT  /bills/:id             → Update bill (mark paid, update amount)
DELETE /bills/:id           → Remove bill
GET  /bills/subscriptions   → Subscription audit with usage data
POST /bills/subscriptions/:id/cancel → Cancel subscription

═══════════════════════════════════════════════════════
HEALTH ENDPOINTS
═══════════════════════════════════════════════════════
GET  /health/today          → Today's health summary
GET  /health/week           → Week summary
POST /health/log            → Log health data
GET  /health/steps          → Step history
GET  /health/sleep          → Sleep history
GET  /health/weight         → Weight history
GET  /health/score          → Health score + breakdown
POST /health/sync           → Sync from Google Fit/Apple Health

GET  /health/medicines      → All medicines
POST /health/medicines      → Add medicine
PUT  /health/medicines/:id  → Update
POST /health/medicines/:id/log → Log taken/missed
GET  /health/medicines/schedule?date=today → Today's medicine schedule

GET  /health/diet/today     → Today's meals + nutrition
POST /health/diet/meals     → Log meal
POST /health/diet/scan      → Scan food image (FormData with image)
GET  /health/diet/suggestions?meal_type=&remaining_calories= → Meal suggestions

═══════════════════════════════════════════════════════
GOALS, TASKS, REMINDERS
═══════════════════════════════════════════════════════
CRUD /goals                 → Standard CRUD
POST /goals/:id/contribute  → Add money to goal
GET  /goals/:id/forecast    → AI ETA prediction

CRUD /tasks                 → Standard CRUD
POST /tasks/:id/complete    → Mark done

CRUD /reminders             → Standard CRUD
POST /reminders/:id/snooze  Body: { minutes: 60 }
POST /reminders/:id/done

═══════════════════════════════════════════════════════
MEMORY ENDPOINTS
═══════════════════════════════════════════════════════
GET  /memory?category=&type=  → Browse memories
GET  /memory/search?q=        → Semantic search
POST /memory                  → Add manually
PUT  /memory/:id              → Correct/update
DELETE /memory/:id            → Forget this

GET  /memory/relationships    → All people Viya knows
POST /memory/relationships    → Add person

═══════════════════════════════════════════════════════
PROACTIVE / NOTIFICATIONS
═══════════════════════════════════════════════════════
GET  /proactive/pending       → Unshown proactive messages
POST /proactive/:id/ack       → User acknowledged
POST /proactive/:id/dismiss   → User dismissed (don't send similar soon)
PUT  /settings/notifications  → Update notification preferences
```

---

## PART 5: BACKGROUND JOBS

```
JOB SCHEDULE:

Every 15 minutes:
  email_sync_job(user_id)     — For each user with email connected
  
Every 30 minutes:
  health_sync_job(user_id)    — Sync Google Fit / Apple Health
  
Every 1 hour:
  proactive_check_job()       — Run all triggers for all users
  calendar_reminder_check()   — Check events starting in 60-90 minutes
  
Every day at 6:00 AM:
  morning_brief_job(user_id)  — Generate and send daily brief
  bill_check_job()            — Check all upcoming bills
  
Every day at 9:00 PM:
  investment_price_update()   — Fetch end-of-day prices
  health_evening_checkin()    — Evening health summary
  
Every week (Sunday 7 AM):
  weekly_summary_job()        — Generate weekly summary for all users
  subscription_audit_job()    — Check subscription usage
  
Every month (1st of month):
  monthly_report_job()        — Generate monthly financial report
  bill_reset_job()            — Reset bill payment status for new cycle
```

---

## PART 6: WHATSAPP BOT COMPLETE FLOW

```
INCOMING MESSAGE FLOW:

1. Receive webhook POST from Meta
2. Verify X-Hub-Signature-256
3. Extract message (type: text|audio|image|interactive_reply|button_reply)
4. Deduplicate (check Redis for message_id)
5. Return 200 OK immediately (< 200ms)
6. Push to Redis Stream: whatsapp_messages

WORKER PROCESSING:
7.  Get user by phone number
8.  If not found: Start onboarding flow
9.  Detect message type:
    - Text: Process as chat
    - Audio: Whisper transcription → chat
    - Image: Claude Vision OCR → chat
    - Interactive reply: Map to predefined action
10. Build context (parallel fetch: memory, financial, health, tasks)
11. Determine intent tier (regex/haiku/sonnet/opus)
12. Call Master Orchestrator
13. Execute actions from response
14. Save to conversations table
15. Update memory with new facts
16. Format for WhatsApp (max 1000 chars per message, use interactive buttons)
17. Send via WhatsApp Business API

WHATSAPP MESSAGE FORMATTING:
  Keep under 800 characters
  Use *bold* for emphasis
  Use \n for line breaks
  Emoji discipline: max 3-4 per message
  
  INTERACTIVE BUTTONS (max 3):
  Use when response has quick_replies
  Each button max 20 characters
  
  LIST MESSAGES (for longer options like bill list):
  Use WhatsApp List Message format
  Max 10 list items

DAILY BRIEF VIA WHATSAPP (7:30 AM):
"☀️ Good morning, Rahul!

3 things for today:
🔴 HDFC bill ₹12,400 — due TOMORROW
📅 Q2 Review meeting at 3 PM
🏍️ Add ₹600 to bike goal (on track!)

Full brief in app or reply 'brief'"

[Reply "brief"] → Sends detailed breakdown
[Reply "pay"] → Handles HDFC bill
[Reply "done"] → Acknowledge and dismiss
```

---

## PART 7: SECURITY & PRIVACY

```
DATA ENCRYPTION:
  All PII encrypted at rest using AES-256
  OAuth tokens encrypted with user-specific key (derived from JWT secret + user_id)
  Financial data encrypted with separate key
  Backups encrypted separately

OAUTH TOKEN MANAGEMENT:
  Access tokens refreshed before expiry
  Refresh tokens stored encrypted
  Token revocation on logout
  Revocation check on each API call

DATA MINIMIZATION:
  Only read email bodies if classification says likely important
  Store only extracted data, not full email bodies
  Health data never sent to AI as raw (only summaries)
  Conversation history: Keep 90 days, then archive to cold storage

USER CONTROLS:
  Delete all data: POST /user/delete-data (30-day processing)
  Disconnect any service: DELETE /user/connections/:provider
  Download all data: GET /user/export (GDPR-compliant ZIP)
  View what Viya remembers: GET /memory (all entries)
  Correct memory: PUT /memory/:id

RATE LIMITING:
  /chat/message:       50/hour
  /auth/send-otp:       3/hour  
  /email/sync:         10/hour (API cost management)
  Default all routes: 200/hour
  IP-level limiting:  1000/hour/IP (DDoS protection)

AUDIT LOGGING:
  Every data access logged
  Every OAuth token use logged
  Every AI call logged with input/output (anonymized)
  Anomaly detection: Unusual access patterns trigger review
```

---

## PART 8: REACT NATIVE APP — COMPLETE FILE STRUCTURE

```
/app/(auth)/
  splash.tsx
  onboarding/
    _layout.tsx
    language.tsx
    phone.tsx
    otp.tsx
    connect.tsx        ← Email, bank, health connections
    interests.tsx
    complete.tsx

/app/(main)/(tabs)/
  index.tsx            ← Home command center
  inbox.tsx            ← Email intelligence
  finance.tsx          ← Finance + wealth combined
  health.tsx           ← Health + diet combined
  me.tsx               ← Profile, settings, memory

/app/(main)/
  chat.tsx             ← Viya chat (always accessible)
  
  email/:id.tsx        ← Email detail
  
  finance/
    transactions.tsx
    add-expense.tsx
    goals/
      index.tsx
      [id].tsx
    wealth/
      index.tsx
      holdings.tsx
      [id].tsx
  
  health/
    food-scanner.tsx
    medicine/index.tsx
    mood-log.tsx
    
  bills/
    index.tsx
    [id].tsx
    subscriptions.tsx
  
  calendar/
    day-view.tsx
    event/[id].tsx
    pre-meeting/[id].tsx
  
  shopping/
    index.tsx
    price-tracker.tsx
  
  memory/
    index.tsx
    relationships.tsx
  
  settings/
    index.tsx
    privacy.tsx
    notifications.tsx
    connections.tsx     ← Manage OAuth connections
    appearance.tsx
    
/components/
  viya/
    ViyaOrb.tsx         ← The animated brain orb
    ViyaMessage.tsx     ← Chat bubble with all types
    ViyaActionCard.tsx  ← Action cards (bill paid, expense logged)
    ViyaInput.tsx       ← The multi-modal input bar
    VoiceRecorder.tsx
    FoodScanner.tsx
  
  email/
    EmailCard.tsx       ← Smart email card with extracted data
    BillEmailCard.tsx
    MeetingEmailCard.tsx
    DeliveryEmailCard.tsx
  
  finance/
    TransactionItem.tsx
    GoalCard.tsx
    WealthCard.tsx
    BudgetMeter.tsx
    SpendingChart.tsx
  
  health/
    HealthPillar.tsx    ← Steps/Sleep/Water/Calories 2x2 grid
    MealCard.tsx
    MedicineItem.tsx
    NutritionBar.tsx
  
  bills/
    BillItem.tsx
    SubscriptionCard.tsx
    EMICard.tsx
  
  common/
    AnimatedNumber.tsx
    ProgressBar.tsx
    StreakBadge.tsx
    BottomSheet.tsx
    SkeletonLoader.tsx
    Toast.tsx
    EmptyState.tsx
    PriorityBadge.tsx

/stores/
  authStore.ts
  userStore.ts
  chatStore.ts
  emailStore.ts
  financeStore.ts
  wealthStore.ts
  healthStore.ts
  billStore.ts
  calendarStore.ts
  memoryStore.ts
  notificationStore.ts
  
/services/
  api.ts               ← Axios with interceptors + refresh
  oauth.ts             ← OAuth flow helpers
  whatsapp.ts          ← Deep link to WhatsApp
  notifications.ts     ← FCM setup
  smsReader.ts         ← Android SMS reading (permission-based)
  healthKit.ts         ← Apple HealthKit bridge
  googleFit.ts         ← Google Fit bridge
  biometrics.ts        ← FaceID/Fingerprint
  storage.ts           ← MMKV abstraction
  encryption.ts        ← Client-side encryption for sensitive local data
```

---

## PART 9: PLAY STORE + LAUNCH

```
APP NAME: Viya — AI Life & Wealth Partner (26 chars — optimal)
PACKAGE: com.heyviya.app

PERMISSIONS DECLARED:
  INTERNET           — Core functionality
  RECEIVE_SMS        — Auto-track bank transactions (optional, explain clearly)
  READ_SMS           — Auto-track bank transactions
  CAMERA             — Food scanning, document scanning
  RECORD_AUDIO       — Voice messages
  ACCESS_NETWORK_STATE — Offline detection
  USE_BIOMETRIC      — App lock with fingerprint
  POST_NOTIFICATIONS — Reminders and alerts (Android 13+)
  VIBRATE            — Haptic feedback

DATA SAFETY (Complete answers):
  Collects: Name, Email, Phone, Financial info, Health info, Messages (chat)
  Shares with: Anthropic (AI processing only)
  Encrypted in transit: YES
  Encrypted at rest: YES
  User can request deletion: YES — at heyviya.app/delete-account
  Why financial data: Core app functionality
  Why health data: Health tracking feature
  Why messages: AI conversation processing

REQUIRED PAGES (Must exist before submission):
  /privacy           — Full privacy policy (GDPR + Indian IT Act compliant)
  /terms             — Terms of service
  /delete-account    — Account deletion request form + instructions
  /data-security     — How we protect data (trust-building page)
  /support           — Help center + contact

LAUNCH TARGETS:
  Day 1:    1,000 downloads (personal network + Product Hunt)
  Week 1:   5,000 downloads (Reddit + LinkedIn + Twitter)
  Month 1:  25,000 downloads (word of mouth + light influencer)
  Month 3:  1,00,000 downloads (paid acquisition begins)
  Month 6:  5,00,000 downloads (viral growth kicks in)
  Month 12: 20,00,000 downloads (10M DAU target)
```

---

## BUILD ORDER (Week by Week)

```
WEEK 1-2: FOUNDATION
✅ All database tables created with indexes
✅ Auth system (OTP + JWT + refresh)
✅ Master Orchestrator (basic routing)
✅ WhatsApp webhook handler
✅ Basic chat endpoint

WEEK 3-4: EMAIL + CALENDAR (The Killer Feature)
✅ Gmail OAuth + sync pipeline
✅ Email classification agent
✅ Bill/meeting/delivery extraction
✅ Google Calendar sync + event creation
✅ Pre-meeting brief generation

WEEK 5-6: FINANCE + BILLS
✅ Transaction CRUD + SMS parsing
✅ Budget calculation engine
✅ Bills detection and tracking
✅ Investment tracking (MF + stocks)
✅ Wealth agent full implementation

WEEK 7-8: HEALTH + DIET
✅ Google Fit sync
✅ Health logging endpoints
✅ Food scanner (Claude Vision)
✅ Medicine tracker
✅ Diet tracking + nutrition DB

WEEK 9-10: PROACTIVE ENGINE
✅ All 10 triggers implemented
✅ Background scheduler
✅ Proactive message personalization
✅ Anti-spam logic
✅ User feedback loop

WEEK 11-12: REACT NATIVE APP
✅ All screens built
✅ All animations
✅ Offline support
✅ Dark mode
✅ Performance optimization

WEEK 13-14: TESTING + LAUNCH
✅ Load testing (10K concurrent users)
✅ Security audit
✅ Play Store submission
✅ Soft launch (1,000 beta users)
✅ Iterate based on feedback
✅ Full launch

═══════════════════════════════════════════════════════
BUILD THE PRODUCT THAT MAKES 10 MILLION PEOPLE SAY:
"I DON'T KNOW HOW I MANAGED MY LIFE WITHOUT VIYA."
═══════════════════════════════════════════════════════
🚀
```
