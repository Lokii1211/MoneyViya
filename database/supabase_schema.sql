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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON user_reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON couples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON chat_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON family_connections FOR ALL USING (true) WITH CHECK (true);
