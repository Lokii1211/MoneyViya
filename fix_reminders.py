import psycopg2

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require'
)
cur = conn.cursor()

# Drop and recreate reminders table with proper columns
cur.execute("""
    DROP TABLE IF EXISTS reminders CASCADE;
    CREATE TABLE reminders (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        task TEXT NOT NULL,
        remind_at TIMESTAMPTZ NOT NULL,
        remind_at_display TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
    CREATE INDEX idx_reminders_status ON reminders(status);
    CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
""")
conn.commit()
print('Reminders table recreated!')

cur.close()
conn.close()
