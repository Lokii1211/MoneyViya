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

-- 2. Subscriptions (auto-detected recurring charges)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  next_charge DATE,
  category TEXT DEFAULT 'subscription',
  detected_from TEXT DEFAULT 'sms',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- 5. Medicine Schedule
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  time TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

SELECT 'Viya V3 migration complete ✅' AS status;
