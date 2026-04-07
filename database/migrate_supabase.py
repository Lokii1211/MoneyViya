import psycopg2

SQL = """
CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY, name TEXT, language TEXT DEFAULT 'en', persona TEXT DEFAULT 'salaried',
    monthly_income REAL DEFAULT 0, monthly_expenses REAL DEFAULT 0, daily_budget REAL DEFAULT 1000,
    current_savings REAL DEFAULT 0, emergency_fund REAL DEFAULT 0, onboarding_complete BOOLEAN DEFAULT FALSE,
    password_hash TEXT, partner_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    type TEXT NOT NULL CHECK(type IN ('income','expense')), amount REAL NOT NULL,
    category TEXT DEFAULT 'uncategorized', description TEXT, source TEXT DEFAULT 'manual', merchant TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    name TEXT NOT NULL, icon TEXT DEFAULT '🎯', target_amount REAL NOT NULL, current_amount REAL DEFAULT 0,
    deadline TEXT, priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','achieved','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    name TEXT NOT NULL, icon TEXT DEFAULT '✅', frequency TEXT DEFAULT 'daily',
    current_streak INTEGER DEFAULT 0, longest_streak INTEGER DEFAULT 0, last_completed TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    habit_id INTEGER NOT NULL REFERENCES habits(id), completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    name TEXT NOT NULL, amount REAL NOT NULL, frequency TEXT DEFAULT 'monthly',
    category TEXT DEFAULT 'entertainment', last_charged TEXT, last_used TEXT, is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    text TEXT NOT NULL, amount REAL, frequency TEXT DEFAULT 'once', day_of_month INTEGER,
    time TEXT DEFAULT '09:00', is_active BOOLEAN DEFAULT TRUE, last_triggered TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS couples (
    id SERIAL PRIMARY KEY, phone1 TEXT NOT NULL REFERENCES users(phone),
    phone2 TEXT NOT NULL REFERENCES users(phone), alert_threshold REAL DEFAULT 5000,
    is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    period TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
    total_income REAL DEFAULT 0, total_expenses REAL DEFAULT 0, savings_rate REAL DEFAULT 0,
    top_category TEXT, financial_health_score INTEGER DEFAULT 50, ai_insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, phone TEXT NOT NULL REFERENCES users(phone),
    type TEXT DEFAULT 'info', title TEXT NOT NULL, description TEXT,
    is_read BOOLEAN DEFAULT FALSE, action_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_txn_phone ON transactions(phone);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_goals_phone ON goals(phone);
CREATE INDEX IF NOT EXISTS idx_habits_phone ON habits(phone);
CREATE INDEX IF NOT EXISTS idx_notif_phone ON notifications(phone);
"""

print("Connecting to Supabase PostgreSQL...")
conn = psycopg2.connect(
    host="aws-1-ap-south-1.pooler.supabase.com",
    port=5432,
    dbname="postgres",
    user="postgres.ifarzqlgyeetvtjijber",
    password="LokiKavi@1211",
    sslmode="require"
)
cur = conn.cursor()
cur.execute(SQL)
conn.commit()
cur.close()
conn.close()
print("✅ All 10 tables created on Supabase!")
