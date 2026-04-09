import os
import re
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Check enum values
result = conn.run("""
    SELECT enum_range(NULL::speciesenum)
""")

print("Enum values:", result)

# Also check from pg_enum
result2 = conn.run("""
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'speciesenum'
    ORDER BY e.enumsortorder
""")

print("Enum labels from pg_enum:", result2)

conn.close()
