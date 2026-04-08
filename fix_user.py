import psycopg2

conn = psycopg2.connect(
    host='aws-1-ap-south-1.pooler.supabase.com',
    port=5432, dbname='postgres',
    user='postgres.ifarzqlgyeetvtjijber',
    password='LokiKavi@1211', sslmode='require'
)
cur = conn.cursor()

# Add user
cur.execute("""
    INSERT INTO users (phone, password_hash, name) 
    VALUES ('9003360494', 'test123', 'Lokesh') 
    ON CONFLICT (phone) DO UPDATE SET password_hash = 'test123', name = 'Lokesh'
""")
conn.commit()

# Verify
cur.execute('SELECT phone, password_hash, name FROM users')
rows = cur.fetchall()
print('All users:', rows)

cur.close()
conn.close()
print('Done!')
