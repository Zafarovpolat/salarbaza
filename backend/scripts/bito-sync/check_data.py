"""Quick diagnostic: show product codes and bitoSku in Supabase."""
import psycopg2
import psycopg2.extras
import os

conn = psycopg2.connect(os.environ["SUPABASE_DSN"])
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Products with -2/-3 suffix
cur.execute("""SELECT code, "bitoSku" FROM products WHERE code ~ '-[23]$' ORDER BY code LIMIT 30""")
print("=== Products with -2/-3 suffix ===")
for r in cur.fetchall():
    print(f"  {r['code']:>12}  bitoSku={r['bitoSku']}")

# product_colors for C-6 and B-35
cur.execute("""
    SELECT pc."bitoSku", pc."nameRu", p.code
    FROM product_colors pc
    JOIN products p ON pc."productId" = p.id
    WHERE p.code LIKE 'C-6%' OR p.code LIKE 'B-35%'
    LIMIT 20
""")
print("\n=== product_colors for C-6/B-35 ===")
for r in cur.fetchall():
    print(f"  code={r['code']:>8}  bitoSku={str(r['bitoSku']):>30}  color={r['nameRu']}")

# Check if C-6 and C-6-2 both exist
cur.execute("""SELECT id, code, "nameRu" FROM products WHERE code IN ('C-6','C-6-2','B-35','B-28','B-28-2','B-19','B-19-2')""")
print("\n=== Do both C-6 and C-6-2 exist? ===")
for r in cur.fetchall():
    print(f"  {r['code']:>8}  name={r['nameRu']}")

conn.close()
