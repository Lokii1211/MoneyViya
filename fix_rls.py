import psycopg2

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require',
    connect_timeout=10
)
cur = conn.cursor()

tables = ['users','transactions','goals','habits','habit_checkins','reminders','notifications','chat_history']
for t in tables:
    try:
        cur.execute(f'ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;')
        conn.commit()
        print(f'RLS enabled: {t}')
    except Exception as e:
        conn.rollback()
        print(f'RLS err {t}: {e}')

for t in tables:
    try:
        cur.execute(f"""
            DO $$ BEGIN
                EXECUTE 'DROP POLICY IF EXISTS anon_all_{t} ON {t}';
                EXECUTE 'CREATE POLICY anon_all_{t} ON {t} FOR ALL TO anon USING (true) WITH CHECK (true)';
                EXECUTE 'DROP POLICY IF EXISTS auth_all_{t} ON {t}';
                EXECUTE 'CREATE POLICY auth_all_{t} ON {t} FOR ALL TO authenticated USING (true) WITH CHECK (true)';
            END $$;
        """)
        conn.commit()
        print(f'✅ Policies set: {t}')
    except Exception as e:
        conn.rollback()
        print(f'Policy err {t}: {e}')

cur.close()
conn.close()
print('\nDone!')
