-- =========================================================
-- VIYA V2 — DATABASE SCHEMA MIGRATION
-- Run in Supabase SQL Editor
-- =========================================================

-- Enable pgvector extension (required for semantic search)
-- If this fails, the embedding column will be skipped
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Viya Memory — Long-term AI memory with semantic search
CREATE TABLE IF NOT EXISTS viya_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'fact',  -- fact, preference, event, goal, emotion
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',           -- finance, health, work, family, personal
  importance INTEGER DEFAULT 5,             -- 1-10 scale
  source TEXT DEFAULT 'chat',               -- chat, whatsapp, system, email
  -- embedding column added separately after table creation (requires pgvector)
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,                   -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memory_phone ON viya_memory(phone);
CREATE INDEX IF NOT EXISTS idx_memory_type ON viya_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_category ON viya_memory(category);

-- Add vector embedding column (only works if pgvector extension is enabled)
DO $$ BEGIN
  ALTER TABLE viya_memory ADD COLUMN IF NOT EXISTS embedding VECTOR(384);
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'pgvector not available — skipping embedding column. Install pgvector extension to enable semantic search.';
END $$;

-- 2. Health Logs — Daily health metrics
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  water_glasses INTEGER DEFAULT 0,
  sleep_hours NUMERIC(3,1) DEFAULT 0,
  calories INTEGER DEFAULT 0,
  weight NUMERIC(5,2),
  heart_rate INTEGER,
  health_score INTEGER DEFAULT 50,
  mood TEXT DEFAULT 'neutral',              -- great, good, neutral, low, bad
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone, log_date)
);
CREATE INDEX IF NOT EXISTS idx_health_phone ON health_logs(phone);

-- 3. Meals — Diet tracking
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL,                  -- breakfast, lunch, dinner, snack
  name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein NUMERIC(6,1) DEFAULT 0,
  carbs NUMERIC(6,1) DEFAULT 0,
  fat NUMERIC(6,1) DEFAULT 0,
  time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meals_phone ON meals(phone);

-- 4. Medicines — Medication tracker
CREATE TABLE IF NOT EXISTS medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT DEFAULT 'daily',           -- daily, twice_daily, weekly, as_needed
  time TEXT,                                -- HH:MM format
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicines_phone ON medicines(phone);

-- 5. Medicine Check-ins
CREATE TABLE IF NOT EXISTS medicine_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  checked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken BOOLEAN DEFAULT TRUE,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medicine_id, checked_date)
);

-- 6. Bills & Dues — Recurring bills tracker
CREATE TABLE IF NOT EXISTS bills_and_dues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  bill_type TEXT NOT NULL,                  -- credit_card, electricity, internet, phone, rent, insurance, emi, subscription
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  frequency TEXT DEFAULT 'monthly',         -- monthly, quarterly, yearly, one_time
  auto_debit BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',            -- pending, paid, overdue
  last_paid_at TIMESTAMPTZ,
  reminder_days INTEGER DEFAULT 3,          -- Remind X days before due
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_phone ON bills_and_dues(phone);

-- 7. Investments — Portfolio tracker
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  investment_type TEXT NOT NULL,            -- mutual_fund, stock, fd, ppf, nps, gold, crypto
  invested_amount NUMERIC(14,2) NOT NULL,
  current_value NUMERIC(14,2),
  units NUMERIC(10,4),
  return_pct NUMERIC(6,2) DEFAULT 0,
  is_sip BOOLEAN DEFAULT FALSE,
  sip_amount NUMERIC(10,2),
  sip_date INTEGER,                         -- Day of month for SIP
  broker TEXT,                              -- groww, zerodha, kuvera, etc
  folio_number TEXT,
  maturity_date DATE,
  interest_rate NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investments_phone ON investments(phone);

-- 8. Emails — AI-processed email intelligence
CREATE TABLE IF NOT EXISTS emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  from_address TEXT,
  from_name TEXT,
  subject TEXT NOT NULL,
  snippet TEXT,
  category TEXT DEFAULT 'other',            -- bill, meeting, delivery, investment, offer, personal, work
  priority TEXT DEFAULT 'medium',           -- critical, high, medium, low
  action_required BOOLEAN DEFAULT FALSE,
  action_type TEXT,                         -- pay_bill, accept_meeting, track_delivery
  extracted_data JSONB DEFAULT '{}',        -- {amount, dueDate, startTime, location, etc}
  is_read BOOLEAN DEFAULT FALSE,
  is_handled BOOLEAN DEFAULT FALSE,
  gmail_id TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emails_phone ON emails(phone);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);

-- 9. Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'personal',       -- meeting, personal, health, bill, reminder
  event_date DATE NOT NULL,
  start_time TEXT,                          -- HH:MM format
  end_time TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  meeting_link TEXT,
  attendees JSONB DEFAULT '[]',
  recurring TEXT,                           -- NULL, daily, weekly, monthly
  ai_brief TEXT,                            -- AI-generated pre-meeting brief
  source TEXT DEFAULT 'manual',             -- manual, email, google_calendar
  external_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_phone ON calendar_events(phone);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(event_date);

-- 10. Agent Logs — Track specialist agent routing
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_intent TEXT,
  specialist TEXT,                          -- finance, health, productivity, lifestyle, master
  tier TEXT,                                -- instant, fast, standard, deep
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_phone ON agent_logs(phone);

-- Add memory count to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS memory_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_sync TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_connected BOOLEAN DEFAULT FALSE;
