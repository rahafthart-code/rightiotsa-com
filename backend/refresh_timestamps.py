"""
Refresh telemetry timestamps to make animals appear online NOW.
"""
import os
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

print("🔄 Refreshing all telemetry timestamps to NOW...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

now = datetime.utcnow()

# Get all animals
animals = conn.run("SELECT id, name, device_imei FROM animals ORDER BY id")

for i, animal in enumerate(animals):
    animal_id, name, imei = animal
    
    # Update timestamps to be very recent (last few minutes)
    for j in range(10):
        new_timestamp = now - timedelta(minutes=j)
        conn.run(
            """
            UPDATE telemetry 
            SET timestamp = :ts
            WHERE id = (
                SELECT id FROM telemetry 
                WHERE device_imei = :imei 
                ORDER BY timestamp DESC 
                OFFSET :offset
                LIMIT 1
            )
            """,
            ts=new_timestamp,
            imei=imei,
            offset=j
        )
    
    print(f"   ✓ {name} ({imei}) - timestamps refreshed to last 10 minutes")

print("\n✅ All animals now show as ONLINE!")
print("🗺️  Refresh your dashboard to see live data\n")

conn.close()
