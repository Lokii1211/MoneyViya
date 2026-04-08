import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require'
)
cur = conn.cursor()

# Check current reminders
cur.execute('SELECT id, phone, task, remind_at, status FROM reminders ORDER BY id DESC LIMIT 5')
rows = cur.fetchall()
print(f'Current reminders ({len(rows)}):')
for r in rows:
    print(f'  ID={r[0]} Phone={r[1]} Task="{r[2]}" At={r[3]} Status={r[4]}')

# Add a reminder that's due RIGHT NOW (in the past = immediately sendable)
now_utc = datetime.utcnow() - timedelta(minutes=1)  # 1 min ago = already due
cur.execute("""
    INSERT INTO reminders (phone, task, remind_at, remind_at_display, status)
    VALUES (%s, %s, %s, %s, 'pending')
    RETURNING id
""", ('919003360494', 'Call dad - test reminder from Viya', now_utc.strftime('%Y-%m-%dT%H:%M:%SZ'), 'Right now!'))

row = cur.fetchone()
print(f'\nAdded NEW test reminder ID={row[0]}, due RIGHT NOW')

conn.commit()
cur.close()
conn.close()
