import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require'
)
cur = conn.cursor()

# Add a test reminder that's already due (past time)
now_utc = datetime.utcnow()
cur.execute("""
    INSERT INTO reminders (phone, task, remind_at, remind_at_display, status)
    VALUES (%s, %s, %s, %s, 'pending')
    RETURNING id, phone, task, remind_at, status
""", ('919003360494', 'Test reminder - call dad', now_utc.isoformat() + 'Z', '2:00 PM today', ))

row = cur.fetchone()
print(f'Added reminder: {row}')

# List all reminders 
cur.execute('SELECT id, phone, task, remind_at, status FROM reminders ORDER BY id DESC LIMIT 10')
rows = cur.fetchall()
print(f'\nAll reminders ({len(rows)}):')
for r in rows:
    print(f'  ID={r[0]} Phone={r[1]} Task={r[2]} At={r[3]} Status={r[4]}')

conn.commit()
cur.close()
conn.close()
print('\nDone!')
