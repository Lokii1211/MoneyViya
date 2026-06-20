-- MoneyViya Database Schema
-- Works with both SQLite (local) and PostgreSQL/Supabase (production)

CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    language TEXT DEFAULT 'en',
    persona TEXT DEFAULT 'salaried',
    monthly_income REAL DEFAULT 0,
    monthly_expenses REAL DEFAULT 0,
    daily_budget REAL DEFAULT 1000,
    current_savings REAL DEFAULT 0,
    emergency_fund REAL DEFAULT 0,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    partner_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT DEFAULT 'uncategorized',
    description TEXT,
    source TEXT DEFAULT 'manual',
    merchant TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🎯',
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'achieved', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '✅',
    frequency TEXT DEFAULT 'daily',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    habit_id INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone),
    FOREIGN KEY (habit_id) REFERENCES habits(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT DEFAULT 'monthly',
    category TEXT DEFAULT 'entertainment',
    last_charged TEXT,
    last_used TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    text TEXT NOT NULL,
    amount REAL,
    frequency TEXT DEFAULT 'once',
    day_of_month INTEGER,
    time TEXT DEFAULT '09:00',
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS couples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone1 TEXT NOT NULL,
    phone2 TEXT NOT NULL,
    alert_threshold REAL DEFAULT 5000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone1) REFERENCES users(phone),
    FOREIGN KEY (phone2) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone) REFERENCES users(phone)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_goals_phone ON goals(phone);
CREATE INDEX IF NOT EXISTS idx_habits_phone ON habits(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(phone, is_read);
