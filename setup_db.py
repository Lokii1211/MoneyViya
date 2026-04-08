import psycopg2

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require'
)
cur = conn.cursor()

# ===== CREATE ALL TABLES =====

# 1. Users (ensure exists)
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT 'User',
    monthly_income NUMERIC DEFAULT 0,
    monthly_expenses NUMERIC DEFAULT 0,
    current_savings NUMERIC DEFAULT 0,
    daily_budget NUMERIC DEFAULT 1000,
    persona TEXT DEFAULT 'saver',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 2. Transactions
cur.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 3. Goals
cur.execute("""
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '🎯',
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    deadline TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 4. Habits  
cur.execute("""
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '✅',
    frequency TEXT DEFAULT 'daily',
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 5. Habit Check-ins
cur.execute("""
CREATE TABLE IF NOT EXISTS habit_checkins (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    checked_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'done' CHECK (status IN ('done', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, checked_date)
);
""")

# 6. Reminders (ensure exists)
cur.execute("""
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    task TEXT NOT NULL,
    remind_at TEXT DEFAULT '',
    remind_at_display TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 7. Notifications
cur.execute("""
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# 8. Chat History (for in-app chat sync)
cur.execute("""
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    source TEXT DEFAULT 'app',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

# Enable RLS policies (allow all for anon key)
tables = ['users','transactions','goals','habits','habit_checkins','reminders','notifications','chat_history']
for t in tables:
    try:
        cur.execute(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;")
        cur.execute(f"DROP POLICY IF EXISTS allow_all_{t} ON {t};")
        cur.execute(f"CREATE POLICY allow_all_{t} ON {t} FOR ALL USING (true) WITH CHECK (true);")
    except Exception as e:
        print(f"  Policy {t}: {e}")
        conn.rollback()

conn.commit()

# Verify tables
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")
for row in cur.fetchall():
    print(f"✅ {row[0]}")

cur.close()
conn.close()
print("\n🎉 All tables created successfully!")
