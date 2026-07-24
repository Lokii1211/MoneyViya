-- ═══════════════════════════════════════════════════════════════
-- MoneyViya — Consolidated Database Migration
-- Concatenation of all 6 migration files, in dependency order.
-- Every statement uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS,
-- so running this against an existing database is safe and will
-- not touch or delete any existing data.
-- ═══════════════════════════════════════════════════════════════

-- ══ 1/6: database/supabase_schema.sql ══
-- MoneyViya — Supabase PostgreSQL Schema (PRODUCTION)
-- Run this ONCE in Supabase SQL Editor

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    gender TEXT,
    language TEXT DEFAULT 'en',
    persona TEXT DEFAULT 'salaried',
    age INTEGER,
    city TEXT,
    occupation TEXT,
    avatar TEXT,
    monthly_income REAL DEFAULT 0,
    monthly_expenses REAL DEFAULT 0,
    daily_budget REAL DEFAULT 1000,
    current_savings REAL DEFAULT 0,
    emergency_fund REAL DEFAULT 0,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    partner_phone TEXT,
    otp_code TEXT,
    otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- For an existing live table, CREATE TABLE IF NOT EXISTS above is a no-op
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- ===== TRANSACTIONS =====
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT DEFAULT 'uncategorized',
    description TEXT,
    source TEXT DEFAULT 'manual',
    merchant TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== GOALS =====
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🎯',
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'achieved', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== HABITS =====
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '✅',
    frequency TEXT DEFAULT 'daily',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== HABIT LOGS =====
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    habit_id INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone),
    FOREIGN KEY (habit_id) REFERENCES habits(id)
);

-- ===== SUBSCRIPTIONS =====
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT DEFAULT 'monthly',
    category TEXT DEFAULT 'entertainment',
    last_charged TEXT,
    last_used TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== REMINDERS (old) =====
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    text TEXT NOT NULL,
    amount REAL,
    frequency TEXT DEFAULT 'once',
    day_of_month INTEGER,
    time TEXT DEFAULT '09:00',
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== USER REMINDERS (NEW — used by WhatsApp cron) =====
CREATE TABLE IF NOT EXISTS user_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '⏰',
    freq TEXT DEFAULT 'daily',
    time TEXT DEFAULT '09:00',
    weekday TEXT,
    month_date INTEGER,
    fire_date TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Separate dedup timestamps for the 5-min-advance and monthly 3-day-advance
-- nudges so they don't clash with last_sent_at's own dedup for the real fire
ALTER TABLE user_reminders ADD COLUMN IF NOT EXISTS last_advance_sent_at TIMESTAMPTZ;
ALTER TABLE user_reminders ADD COLUMN IF NOT EXISTS last_monthly_advance_at TIMESTAMPTZ;

-- ===== COUPLES =====
CREATE TABLE IF NOT EXISTS couples (
    id SERIAL PRIMARY KEY,
    phone1 TEXT NOT NULL,
    phone2 TEXT NOT NULL,
    alert_threshold REAL DEFAULT 5000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone1) REFERENCES users(phone),
    FOREIGN KEY (phone2) REFERENCES users(phone)
);

-- ===== REVIEWS =====
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    period TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_income REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    savings_rate REAL DEFAULT 0,
    top_category TEXT,
    financial_health_score INTEGER DEFAULT 50,
    ai_insights TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- ===== CHAT HISTORY =====
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'app',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FAMILY CONNECTIONS (Friends & Family) =====
CREATE TABLE IF NOT EXISTS family_connections (
    id SERIAL PRIMARY KEY,
    owner_phone TEXT NOT NULL,
    member_phone TEXT NOT NULL,
    relation TEXT DEFAULT 'Friend',
    connection_type TEXT DEFAULT 'friend',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_goals_phone ON goals(phone);
CREATE INDEX IF NOT EXISTS idx_habits_phone ON habits(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(phone, is_read);
CREATE INDEX IF NOT EXISTS idx_user_reminders_phone ON user_reminders(phone);
CREATE INDEX IF NOT EXISTS idx_user_reminders_time ON user_reminders(time);
CREATE INDEX IF NOT EXISTS idx_chat_history_phone ON chat_history(phone);
CREATE INDEX IF NOT EXISTS idx_family_connections_owner ON family_connections(owner_phone);
CREATE INDEX IF NOT EXISTS idx_family_connections_member ON family_connections(member_phone);

-- ===== ROW LEVEL SECURITY (allow anonymous access for API) =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Allow anon access (your API uses anon key)
-- DROP first so this file is safe to re-run (Postgres has no CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS "Allow all for anon" ON users;
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON transactions;
CREATE POLICY "Allow all for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON goals;
CREATE POLICY "Allow all for anon" ON goals FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON habits;
CREATE POLICY "Allow all for anon" ON habits FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON habit_logs;
CREATE POLICY "Allow all for anon" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON subscriptions;
CREATE POLICY "Allow all for anon" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON reminders;
CREATE POLICY "Allow all for anon" ON reminders FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON user_reminders;
CREATE POLICY "Allow all for anon" ON user_reminders FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON couples;
CREATE POLICY "Allow all for anon" ON couples FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON reviews;
CREATE POLICY "Allow all for anon" ON reviews FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON notifications;
CREATE POLICY "Allow all for anon" ON notifications FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON chat_history;
CREATE POLICY "Allow all for anon" ON chat_history FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON family_connections;
CREATE POLICY "Allow all for anon" ON family_connections FOR ALL USING (true) WITH CHECK (true);

-- ══ 2/6: supabase/v2_migration.sql ══
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

-- ──────────────────────────────────────────
-- 11. ROW LEVEL SECURITY — this file never had any.
-- Supabase's dashboard/Table Editor auto-enables RLS on new tables but
-- doesn't add a policy, which leaves a table locked with literally no way
-- in — including for this app's own anon-key REST calls (confirmed live:
-- "new row violates row-level security policy for table health_logs",
-- Postgres 42501). The app has no Supabase Auth session anywhere (custom
-- phone+password auth against the anon key), so a permissive policy here
-- matches every other table in this schema, not a security regression.
-- ──────────────────────────────────────────
ALTER TABLE viya_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_and_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON viya_memory;
CREATE POLICY "Allow all for anon" ON viya_memory FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON health_logs;
CREATE POLICY "Allow all for anon" ON health_logs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON meals;
CREATE POLICY "Allow all for anon" ON meals FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON medicines;
CREATE POLICY "Allow all for anon" ON medicines FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON medicine_checkins;
CREATE POLICY "Allow all for anon" ON medicine_checkins FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON bills_and_dues;
CREATE POLICY "Allow all for anon" ON bills_and_dues FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON investments;
CREATE POLICY "Allow all for anon" ON investments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON emails;
CREATE POLICY "Allow all for anon" ON emails FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON calendar_events;
CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON agent_logs;
CREATE POLICY "Allow all for anon" ON agent_logs FOR ALL USING (true) WITH CHECK (true);

-- ══ 3/6: supabase/v3_migration.sql ══
-- =============================================
-- VIYA V3 — Database Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Gamification: User XP & Levels
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Subscriptions table already created earlier in this file (see "===== SUBSCRIPTIONS ====="
-- section near the top) — that definition wins under IF NOT EXISTS, so this duplicate
-- (which had a conflicting id type and columns) was removed to stop the schema drift.

-- 3. Split Bills
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  title TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Journal Entries
CREATE TABLE IF NOT EXISTS journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  entry TEXT NOT NULL,
  mood TEXT,
  ai_analysis TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Medicine schedule table already created earlier in this file (see "-- 4. Medicines —
-- Medication tracker" section) — that definition wins under IF NOT EXISTS and matches what
-- the frontend actually queries (column `active`, not `is_active`), so this conflicting
-- duplicate was removed.

-- 6. Medicine Logs
CREATE TABLE IF NOT EXISTS medicine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT now(),
  date DATE DEFAULT CURRENT_DATE
);

-- 7. Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  bedtime TEXT,
  wakeup TEXT,
  hours DECIMAL(4,2),
  quality INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Meal Logs
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  items TEXT,
  calories INTEGER DEFAULT 0,
  time TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 50,
  type TEXT DEFAULT 'weekly',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. User Challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  progress DECIMAL(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Ensure expenses table exists, then add 'source' column
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT DEFAULT 'other',
  note TEXT,
  type TEXT DEFAULT 'expense',
  date DATE DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add 'source' column if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'source') THEN
    ALTER TABLE expenses ADD COLUMN source TEXT DEFAULT 'app';
  END IF;
END $$;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_xp_phone ON user_xp(phone);
CREATE INDEX IF NOT EXISTS idx_subscriptions_phone ON subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_splits_phone ON splits(phone);
CREATE INDEX IF NOT EXISTS idx_journal_phone_date ON journal(phone, created_at);
CREATE INDEX IF NOT EXISTS idx_medicines_phone ON medicines(phone);
CREATE INDEX IF NOT EXISTS idx_sleep_phone_date ON sleep_logs(phone, date);
CREATE INDEX IF NOT EXISTS idx_meal_phone_date ON meal_logs(phone, date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_phone ON user_challenges(phone);

-- 13. Seed default challenges
INSERT INTO challenges (title, description, xp_reward, type, start_date, end_date) VALUES
  ('No-Spend Weekend', 'Don''t spend anything this weekend', 100, 'weekly', CURRENT_DATE, CURRENT_DATE + 7),
  ('Log All Meals', 'Log breakfast, lunch, dinner for 3 days', 75, 'weekly', CURRENT_DATE, CURRENT_DATE + 7),
  ('10K Steps Daily', 'Walk 10,000 steps for 5 days', 150, 'weekly', CURRENT_DATE, CURRENT_DATE + 7),
  ('Hydration Hero', 'Drink 8 glasses of water for 7 days', 100, 'weekly', CURRENT_DATE, CURRENT_DATE + 7),
  ('Budget Master', 'Stay under budget for a full month', 500, 'monthly', CURRENT_DATE, CURRENT_DATE + 30)
ON CONFLICT DO NOTHING;

-- 14. Enable RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies (allow authenticated users to manage their own data)
-- DROP first to avoid "already exists" errors on re-run
DROP POLICY IF EXISTS "Users manage own xp" ON user_xp;
CREATE POLICY "Users manage own xp" ON user_xp FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own subs" ON subscriptions;
CREATE POLICY "Users manage own subs" ON subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own splits" ON splits;
CREATE POLICY "Users manage own splits" ON splits FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own journal" ON journal;
CREATE POLICY "Users manage own journal" ON journal FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own meds" ON medicines;
CREATE POLICY "Users manage own meds" ON medicines FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own med_logs" ON medicine_logs;
CREATE POLICY "Users manage own med_logs" ON medicine_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own sleep" ON sleep_logs;
CREATE POLICY "Users manage own sleep" ON sleep_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own meals" ON meal_logs;
CREATE POLICY "Users manage own meals" ON meal_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage own challenges" ON user_challenges;
CREATE POLICY "Users manage own challenges" ON user_challenges FOR ALL USING (true);

DROP POLICY IF EXISTS "Challenges readable by all" ON challenges;
CREATE POLICY "Challenges readable by all" ON challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
CREATE POLICY "Users manage own expenses" ON expenses FOR ALL USING (true);

SELECT 'Viya V3 migration complete ✅' AS status;

-- ══ 4/6: supabase/fintech_migration.sql ══
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sms_messages' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_sms_user_processed ON sms_messages(user_phone, is_processed, received_at DESC);
  ELSE
    RAISE NOTICE 'Skipping idx_sms_user_processed — sms_messages.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_bank_user ON bank_accounts(user_phone, sync_enabled);
  ELSE
    RAISE NOTICE 'Skipping idx_bank_user — bank_accounts.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_rules' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_rules_user_active ON transaction_rules(user_phone, is_active, priority DESC);
  ELSE
    RAISE NOTICE 'Skipping idx_rules_user_active — transaction_rules.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='holdings' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_phone, asset_class);
  ELSE
    RAISE NOTICE 'Skipping idx_holdings_user — holdings.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='holdings' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_holdings_isin ON holdings(user_phone, isin);
  ELSE
    RAISE NOTICE 'Skipping idx_holdings_isin — holdings.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_transactions' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_ptxn_user_date ON portfolio_transactions(user_phone, trade_date DESC);
  ELSE
    RAISE NOTICE 'Skipping idx_ptxn_user_date — portfolio_transactions.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_phone, created_at DESC);
  ELSE
    RAISE NOTICE 'Skipping idx_audit_user — audit_logs.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insights' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_phone, status, generated_at DESC);
  ELSE
    RAISE NOTICE 'Skipping idx_insights_user — insights.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

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
-- (Postgres has no "CREATE POLICY IF NOT EXISTS" — DROP+CREATE is the safe re-runnable idiom)
DROP POLICY IF EXISTS sms_own ON sms_messages;
CREATE POLICY sms_own ON sms_messages FOR ALL USING (true);
DROP POLICY IF EXISTS bank_own ON bank_accounts;
CREATE POLICY bank_own ON bank_accounts FOR ALL USING (true);
DROP POLICY IF EXISTS rules_own ON transaction_rules;
CREATE POLICY rules_own ON transaction_rules FOR ALL USING (true);
DROP POLICY IF EXISTS patterns_own ON recurring_patterns;
CREATE POLICY patterns_own ON recurring_patterns FOR ALL USING (true);
DROP POLICY IF EXISTS inv_own ON investment_accounts;
CREATE POLICY inv_own ON investment_accounts FOR ALL USING (true);
DROP POLICY IF EXISTS hold_own ON holdings;
CREATE POLICY hold_own ON holdings FOR ALL USING (true);
DROP POLICY IF EXISTS ptxn_own ON portfolio_transactions;
CREATE POLICY ptxn_own ON portfolio_transactions FOR ALL USING (true);
DROP POLICY IF EXISTS audit_own ON audit_logs;
CREATE POLICY audit_own ON audit_logs FOR ALL USING (true);
DROP POLICY IF EXISTS insights_own ON insights;
CREATE POLICY insights_own ON insights FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- Tables created: 9 new + 1 altered (transactions)
-- Indexes: 10
-- Triggers: 1 (audit immutability)
-- ═══════════════════════════════════════════════════════════

-- ══ 5/6: supabase/lending_migration.sql ══
-- Lending / Borrowing tracker with interest and reminders
CREATE TABLE IF NOT EXISTS lending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('given', 'taken')),
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  has_interest BOOLEAN DEFAULT FALSE,
  interest_rate NUMERIC DEFAULT 0,
  interest_type TEXT DEFAULT 'monthly' CHECK (interest_type IN ('monthly', 'yearly')),
  due_date DATE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_frequency TEXT DEFAULT 'weekly' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')),
  last_reminded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lending' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_lending_user ON lending(user_phone);
  ELSE
    RAISE NOTICE 'Skipping idx_lending_user — lending.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lending' AND column_name='user_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_lending_status ON lending(user_phone, status);
  ELSE
    RAISE NOTICE 'Skipping idx_lending_status — lending.user_phone not found (table may pre-exist with a different schema)';
  END IF;
END $$;

-- RLS — the app has no Supabase Auth session (custom phone+password auth
-- against the anon key, same as every other table here), so a policy keyed
-- off current_setting('app.user_phone') would always evaluate to NULL and
-- block every request from the app itself. Matches the permissive pattern
-- used everywhere else in this schema.
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lending_user_policy ON lending;
CREATE POLICY lending_user_policy ON lending FOR ALL USING (true) WITH CHECK (true);

-- ══ 6/6: supabase/gmail_migration.sql ══
-- Gmail OAuth columns for users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected BOOLEAN DEFAULT FALSE;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_gmail ON users (gmail_connected) WHERE gmail_connected = TRUE;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 0 — AI Agents & Hybrid RAG foundation
-- See docs/AI_AGENTS_RAG_PRD.md. This phase needs no new API keys — it only
-- adds pgvector, the news/knowledge-graph tables (populated in later phases),
-- and Postgres full-text search (our BM25-equivalent) on data that already
-- exists, so lexical retrieval ("that Swiggy order last week") works today.
-- ══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- News ingested by the Market Analyst agent (Phase 2 populates this)
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  url TEXT UNIQUE,
  title TEXT,
  summary TEXT,
  published_at TIMESTAMPTZ,
  tags TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_articles' AND column_name='fts') THEN
    ALTER TABLE news_articles ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_news_articles_fts ON news_articles USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_news_articles_embedding ON news_articles USING ivfflat (embedding vector_cosine_ops);

-- Personal knowledge graph edges, per user (Phase 3 populates this nightly)
CREATE TABLE IF NOT EXISTS kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  relation TEXT NOT NULL,
  object TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kg_edges_user_subject ON kg_edges (user_phone, subject);
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own kg edges" ON kg_edges;
CREATE POLICY "Users manage own kg edges" ON kg_edges FOR ALL USING (true);
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "News readable by all" ON news_articles;
CREATE POLICY "News readable by all" ON news_articles FOR SELECT USING (true);
-- The Market Analyst cron (cron/market-news.py) writes with the anon key,
-- same as every other write path in this app (no Supabase Auth session) —
-- without this, RLS silently rejects every insert/upsert (bug found live:
-- ingestion ran, fetched real articles, saved 0 — this was why).
DROP POLICY IF EXISTS "News insertable by all" ON news_articles;
CREATE POLICY "News insertable by all" ON news_articles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "News updatable by all" ON news_articles;
CREATE POLICY "News updatable by all" ON news_articles FOR UPDATE USING (true) WITH CHECK (true);

-- Semantic search over the user's own transactions (Phase 1 populates this on write)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Full-text search (BM25-equivalent) on transactions, goals, bills — works
-- immediately, no embeddings or external API needed.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='fts') THEN
    ALTER TABLE transactions ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(description,'') || ' ' || coalesce(category,'') || ' ' || coalesce(merchant,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_transactions_fts ON transactions USING gin (fts);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='fts') THEN
    ALTER TABLE goals ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_goals_fts ON goals USING gin (fts);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills_and_dues' AND column_name='fts') THEN
    ALTER TABLE bills_and_dues ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(name,'') || ' ' || coalesce(bill_type,'') || ' ' || coalesce(notes,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_bills_fts ON bills_and_dues USING gin (fts);

SELECT 'Phase 0 — RAG foundation ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 1 — Hybrid retriever (BM25 + vector) over the user's own data
-- Needs OPENAI_API_KEY set in Vercel to actually populate embeddings/do
-- vector search — the match_* functions and columns below are inert until
-- then, and frontend/api/_rag.py degrades to lexical-only search without it.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE goals ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE bills_and_dues ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS idx_goals_embedding ON goals USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_bills_embedding ON bills_and_dues USING ivfflat (embedding vector_cosine_ops);

-- Vector similarity search functions — called via PostgREST RPC
-- (POST /rest/v1/rpc/match_transactions etc.) from frontend/api/_rag.py.
CREATE OR REPLACE FUNCTION match_transactions(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id int, type text, amount real, category text, description text, merchant text, created_at timestamptz, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, type, amount, category, description, merchant, created_at,
         1 - (embedding <=> query_embedding) AS similarity
  FROM transactions
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_goals(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id int, name text, current_amount real, target_amount real, deadline text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, current_amount, target_amount, deadline,
         1 - (embedding <=> query_embedding) AS similarity
  FROM goals
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_bills(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, name text, bill_type text, amount numeric, due_date date, status text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, bill_type, amount, due_date, status,
         1 - (embedding <=> query_embedding) AS similarity
  FROM bills_and_dues
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_transactions(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_goals(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_bills(vector, text, int) TO anon, authenticated;

SELECT 'Phase 1 — hybrid retriever schema ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 2 — Market Analyst (news ingestion)
-- news_articles table already exists from Phase 0. This adds the one thing
-- Phase 0 couldn't: a vector match function (news is global, not per-user,
-- so unlike match_transactions/goals/bills there's no match_phone filter).
-- Populated by frontend/api/cron/market-news.py, needs ALPHA_VANTAGE_API_KEY
-- and OPENAI_API_KEY set in Vercel to actually fetch + embed anything.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_news(query_embedding vector(1536), match_count int DEFAULT 5)
RETURNS TABLE(id uuid, title text, summary text, published_at timestamptz, tags text[], similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, title, summary, published_at, tags,
         1 - (embedding <=> query_embedding) AS similarity
  FROM news_articles
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_news(vector, int) TO anon, authenticated;

SELECT 'Phase 2 — Market Analyst schema ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 5 — Full life-OS coverage (Health, Habits)
-- Same hybrid-retrieval pattern as Phase 1, extended past money — this is
-- what makes chat/WhatsApp a whole-life assistant, not just a finance bot.
-- Needs OPENAI_API_KEY (already set from Phase 1) for the vector half;
-- degrades to lexical-only without it, same as everywhere else.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE health_logs ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE habits ADD COLUMN IF NOT EXISTS embedding vector(1536);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_logs' AND column_name='fts') THEN
    ALTER TABLE health_logs ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(mood,'') || ' ' || coalesce(notes,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_health_logs_fts ON health_logs USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_health_logs_embedding ON health_logs USING ivfflat (embedding vector_cosine_ops);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='habits' AND column_name='fts') THEN
    ALTER TABLE habits ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(frequency,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_habits_fts ON habits USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_habits_embedding ON habits USING ivfflat (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_health_logs(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, log_date date, steps int, water_glasses int, sleep_hours numeric, mood text, notes text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, log_date, steps, water_glasses, sleep_hours, mood, notes,
         1 - (embedding <=> query_embedding) AS similarity
  FROM health_logs
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_habits(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id int, name text, icon text, current_streak int, frequency text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, icon, current_streak, frequency,
         1 - (embedding <=> query_embedding) AS similarity
  FROM habits
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_health_logs(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_habits(vector, text, int) TO anon, authenticated;

SELECT 'Phase 5 — full life-OS retrieval schema ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 6 — Meals and Lending join the retriever
-- Same hybrid BM25+vector pattern as everywhere else. Lending is the
-- concrete feature requested: "gave 20000 to a friend at 2% interest,
-- collect on the 5th every month" — the lending table already had every
-- column this needs (interest_rate, due_date, reminder_frequency), this
-- just makes it retrievable/groundable in chat answers like
-- "who owes me money" or "what did I lend Rahul".
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE meals ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE lending ADD COLUMN IF NOT EXISTS embedding vector(1536);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meals' AND column_name='fts') THEN
    ALTER TABLE meals ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(meal_type,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_meals_fts ON meals USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_meals_embedding ON meals USING ivfflat (embedding vector_cosine_ops);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lending' AND column_name='fts') THEN
    ALTER TABLE lending ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(person_name,'') || ' ' || coalesce(reason,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_lending_fts ON lending USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_lending_embedding ON lending USING ivfflat (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_meals(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, name text, meal_type text, calories int, meal_date date, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, meal_type, calories, meal_date,
         1 - (embedding <=> query_embedding) AS similarity
  FROM meals
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_lending(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, type text, person_name text, amount numeric, has_interest boolean, interest_rate numeric, interest_type text, due_date date, status text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, type, person_name, amount, has_interest, interest_rate, interest_type, due_date, status,
         1 - (embedding <=> query_embedding) AS similarity
  FROM lending
  WHERE user_phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_meals(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_lending(vector, text, int) TO anon, authenticated;

SELECT 'Phase 6 — meals + lending retrieval schema ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 7 — investments, medicines, journal, and emails join the retriever
-- Completes the full-app coverage requested: "reminders, income, expense,
-- health, wealth, portfolio, subscriptions, medicines, journal, email" —
-- all of these now have both an ACTION path (see chat.py/whatsapp.py) and
-- a retrieval path (grounded answers, not guesses) except reminders/income/
-- expense/health which already had both from earlier phases.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE investments ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE journal ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS embedding vector(1536);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='fts') THEN
    ALTER TABLE investments ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(investment_type,'') || ' ' || coalesce(broker,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_investments_fts ON investments USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_investments_embedding ON investments USING ivfflat (embedding vector_cosine_ops);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicines' AND column_name='fts') THEN
    ALTER TABLE medicines ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(dosage,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_medicines_fts ON medicines USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_medicines_embedding ON medicines USING ivfflat (embedding vector_cosine_ops);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal' AND column_name='fts') THEN
    ALTER TABLE journal ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(entry,'') || ' ' || coalesce(mood,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_journal_fts ON journal USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_journal_embedding ON journal USING ivfflat (embedding vector_cosine_ops);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emails' AND column_name='fts') THEN
    ALTER TABLE emails ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(subject,'') || ' ' || coalesce(snippet,'') || ' ' || coalesce(from_name,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_emails_fts ON emails USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_emails_embedding ON emails USING ivfflat (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_investments(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, name text, investment_type text, invested_amount numeric, current_value numeric, is_sip boolean, broker text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, investment_type, invested_amount, current_value, is_sip, broker,
         1 - (embedding <=> query_embedding) AS similarity
  FROM investments
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_medicines(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, name text, dosage text, "time" text, frequency text, active boolean, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, name, dosage, medicines."time", frequency, active,
         1 - (embedding <=> query_embedding) AS similarity
  FROM medicines
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_journal(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, entry text, mood text, created_at timestamptz, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, entry, mood, created_at,
         1 - (embedding <=> query_embedding) AS similarity
  FROM journal
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_emails(query_embedding vector(1536), match_phone text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, from_name text, subject text, snippet text, category text, action_required boolean, received_at timestamptz, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, from_name, subject, snippet, category, action_required, received_at,
         1 - (embedding <=> query_embedding) AS similarity
  FROM emails
  WHERE phone = match_phone AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_investments(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_medicines(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_journal(vector, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_emails(vector, text, int) TO anon, authenticated;

SELECT 'Phase 7 — investments + medicines + journal + emails retrieval schema ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 8 — Lending: separate "settle this period's interest" from
-- "settle the whole loan". Someone can pay just the monthly interest for
-- 6 months and only hand back the principal at the end — until now the
-- app only had one settle action that closed the entry outright, so there
-- was no way to record an interest-only payment without losing the loan.
-- interest now accrues from last_interest_settled_at (falls back to
-- created_at the first time), not always from created_at.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE lending ADD COLUMN IF NOT EXISTS interest_paid_total NUMERIC DEFAULT 0;
ALTER TABLE lending ADD COLUMN IF NOT EXISTS last_interest_settled_at TIMESTAMPTZ;

SELECT 'Phase 8 — lending interest-only settlement columns ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 9 — Bills/EMI due-date reminders. bills_and_dues already had
-- due_date/frequency/status/reminder_days, but nothing tracked whether a
-- reminder had already gone out today, so the cron had no way to dedup —
-- this is why bill/EMI due dates were never wired into check-reminders.py
-- at all (only `lending` and `user_reminders` were). Mirrors lending's
-- last_reminded_at column exactly.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE bills_and_dues ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

SELECT 'Phase 9 — bills/EMI reminder dedup column ready ✅' AS status;

-- ══════════════════════════════════════════════════════════════════════════
-- PHASE 10 — Curated financial KNOWLEDGE BASE (our own RAG, not API answers)
-- Until now retrieval only covered the user's OWN rows (transactions, goals,
-- …). When someone asks "should I do ELSS or PPF?" the *advice* came purely
-- from the LLM's parametric knowledge — un-auditable, un-versioned, and not
-- ours. This adds a curated corpus of vetted Indian personal-finance
-- knowledge that Viya retrieves from (same hybrid BM25 + vector path as
-- news) and is told to prefer over generic model knowledge. fts is a
-- generated column, so lexical/BM25 retrieval works the moment this runs;
-- vector search activates automatically once embeddings backfill (needs
-- OPENAI_API_KEY — degrades to lexical-only without it, like everything else
-- in _rag.py). Grow it by INSERTing more rows — no code change needed.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,          -- investing, tax, budgeting, debt, insurance, savings, credit
  title TEXT NOT NULL UNIQUE,   -- UNIQUE so the seed below is idempotent
  content TEXT NOT NULL,
  tags TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='fts') THEN
    ALTER TABLE knowledge_base ADD COLUMN fts tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(tags,''))) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_kb_fts ON knowledge_base USING gin (fts);
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kb_read_policy ON knowledge_base;
CREATE POLICY kb_read_policy ON knowledge_base FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION match_knowledge(query_embedding vector(1536), match_count int DEFAULT 4)
RETURNS TABLE(id uuid, topic text, title text, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, topic, title, content, 1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
GRANT EXECUTE ON FUNCTION match_knowledge(vector, int) TO anon, authenticated;

-- Seed — vetted Indian personal-finance knowledge. ON CONFLICT keeps it
-- idempotent (title is UNIQUE). Rates are phrased as "around/revised" on
-- purpose — never hard-code a number that drifts.
INSERT INTO knowledge_base (topic, title, content, tags) VALUES
('savings','Emergency fund','Keep 3–6 months of essential expenses in a liquid place (savings account, sweep-in FD, or liquid fund) before investing for growth. It stops one job loss or medical bill from becoming debt. Aim for 6 months if your income is irregular (freelancers, commission).','emergency fund safety buffer liquid'),
('budgeting','50/30/20 rule','A simple monthly budget: ~50% of take-home to needs (rent, food, bills, EMIs), ~30% to wants, ~20% to savings and investments. Adjust the ratios to your reality — the point is to pay your future self first, automatically, on salary day.','budget 50 30 20 rule allocation'),
('investing','SIP and rupee-cost averaging','A SIP invests a fixed amount every month regardless of market level, so you buy more units when prices are low and fewer when high — averaging your cost and removing the need to time the market. Consistency over years matters far more than the entry point.','sip mutual fund rupee cost averaging'),
('investing','Index funds vs active funds','Index funds track a benchmark (e.g. Nifty 50) at very low cost. Most active funds fail to beat their index over 10+ years after fees. For a core long-term equity allocation, a low-cost index fund is a sensible default; active funds are a bet that a manager will outperform.','index fund active nifty expense ratio'),
('tax','ELSS funds','ELSS (Equity Linked Savings Scheme) are tax-saving equity mutual funds that qualify for Section 80C (up to ₹1.5 lakh/year) and have the shortest lock-in of all 80C options — 3 years. Returns are market-linked, so treat them as equity, not a guaranteed FD.','elss 80c tax saving equity lock-in'),
('tax','PPF (Public Provident Fund)','PPF is a government-backed 15-year savings scheme, fully tax-free (EEE), interest revised quarterly (around 7% recently). Great for a debt/safe portion of long-term goals like retirement. Illiquid by design — partial withdrawals only after year 6.','ppf 80c tax free retirement safe eee'),
('tax','Section 80C basics','Section 80C lets you deduct up to ₹1.5 lakh/year from taxable income (old regime) via EPF, PPF, ELSS, life insurance premiums, principal on a home loan, and 5-year tax-saver FDs. It only helps under the OLD tax regime — the new regime removes most deductions for lower slabs.','80c deduction old regime 1.5 lakh'),
('tax','Old vs new tax regime','The new regime has lower slab rates but removes most deductions (80C, 80D, HRA). The old regime has higher rates but lets you claim them. Roughly: if you actively use deductions (rent, 80C, insurance), the old regime often wins; if you don''t, the new one usually does. Compare both on your actual numbers each year.','tax regime old new deductions slabs'),
('tax','Section 80D health insurance','Premiums for health insurance are deductible under 80D — up to ₹25,000 for yourself/family and an extra ₹25,000 (₹50,000 if senior citizens) for parents. This is separate from the 80C ₹1.5 lakh limit.','80d health insurance premium deduction'),
('insurance','Term vs endowment insurance','Buy pure term insurance for life cover — it''s cheap and pays a large sum if you die during the term. Avoid endowment/ULIP "insurance + investment" combos: they give poor cover and poor returns. Keep insurance and investing separate. A common cover target is 10–15× annual income.','term insurance endowment ulip life cover'),
('insurance','Health insurance is non-negotiable','Even if young and healthy, hold a health policy — a single hospitalisation can wipe out years of savings. A family floater of at least ₹5–10 lakh is a common starting point in metros; add a super top-up for cheap extra cover.','health insurance mediclaim floater hospitalisation'),
('debt','Credit card minimum-payment trap','Paying only the "minimum due" keeps the card active but the rest rolls over at ~36–42% annual interest — one of the most expensive debts there is. Always pay the FULL statement balance. If you can''t, treat clearing card debt as priority #1 before any investing.','credit card minimum due interest debt trap'),
('debt','Avalanche vs snowball','Two ways to clear multiple debts: avalanche pays the highest interest rate first (cheapest overall), snowball pays the smallest balance first (fastest wins for motivation). Avalanche saves more money; snowball keeps you going. Either beats paying only minimums.','debt payoff avalanche snowball strategy'),
('debt','Home loan prepayment','Prepaying a home loan early (when most of the EMI is interest) saves a lot of total interest. Compare the loan rate against what you''d earn investing instead — if the loan rate is higher than your expected safe return, prepaying is effectively a guaranteed, tax-free return.','home loan prepayment emi interest'),
('credit','Credit score (CIBIL)','A CIBIL score (300–900, aim for 750+) reflects how reliably you repay. Biggest drivers: paying every EMI/card bill on time and keeping credit-card usage below ~30% of the limit. Check it free once a year; a good score gets you cheaper loans.','cibil credit score utilisation on-time'),
('investing','Rule of 72','A quick mental shortcut: divide 72 by the annual return to estimate years to double your money. At 12% ≈ 6 years, at 8% ≈ 9 years. Useful for sanity-checking whether a goal timeline is realistic.','rule of 72 compounding double returns'),
('investing','Inflation erodes idle cash','Money sitting in a savings account (~3%) loses value against inflation (~5–6%). That''s fine for your emergency fund, but for long-term goals you need investments that beat inflation (equity, over 7+ year horizons) or your buying power shrinks every year.','inflation cash savings account real return'),
('investing','Match investment to goal horizon','Short-term goals (0–3 yrs) → safe/liquid (FD, liquid fund); medium (3–5 yrs) → hybrid/debt; long (7+ yrs) → mostly equity. Don''t put next year''s rent in stocks, or a 20-year retirement corpus entirely in FDs.','goal horizon asset allocation equity debt'),
('savings','Sinking funds for known expenses','For predictable irregular costs (insurance renewals, festivals, annual subscriptions), set aside a little every month into a separate pot so they never become a shock. It turns a lumpy ₹12,000 annual bill into a painless ₹1,000/month.','sinking fund irregular expenses planning'),
('investing','Diversification','Don''t put everything in one stock, one fund, or one asset. Spread across asset classes (equity, debt, gold) and within equity across companies/sectors so a single bad bet can''t sink you. A simple index fund is already diversified across its whole benchmark.','diversification asset allocation risk'),
('retirement','Start early — compounding','₹5,000/month invested from age 25 typically ends up far larger by 60 than ₹10,000/month started at 35, because the early money compounds for longer. Time in the market is the biggest lever most people underuse. Start with whatever you can, now.','retirement compounding start early nps'),
('budgeting','Pay yourself first','Automate your savings/SIP on salary day BEFORE you start spending, not with whatever''s left at month-end (usually nothing). Treat investing like a fixed bill. This one habit does more than any amount of expense-tracking.','pay yourself first automate sip savings')
ON CONFLICT (title) DO NOTHING;

SELECT 'Phase 10 — curated financial knowledge base ready ✅' AS status;
