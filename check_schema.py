import psycopg2, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
conn = psycopg2.connect(host='aws-1-ap-south-1.pooler.supabase.com', port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber', password='LokiKavi@1211', sslmode='require', connect_timeout=10)
cur = conn.cursor()
for t in ['habits','goals','habit_checkins','transactions','users','chat_history','notifications','reminders']:
    cur.execute('SELECT column_name FROM information_schema.columns WHERE table_name=%s ORDER BY ordinal_position', (t,))
    cols = [r[0] for r in cur.fetchall()]
    print(f'{t}: {cols}')
cur.close(); conn.close()
