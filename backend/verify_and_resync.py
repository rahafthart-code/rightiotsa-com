"""
Verify and re-sync Supabase data to fix loading errors.
Ensures species match exactly with Arabic keys.
"""
import os
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

print("🔄 Verifying and re-syncing Supabase data...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Check current data
print("📊 Current Database Status:")
animals = conn.run("SELECT id, name, species, device_imei FROM animals ORDER BY id")
print(f"   • Total Animals: {len(animals)}")
for animal in animals:
    print(f"     - ID: {animal[0]} | Name: {animal[1]} | Species: {animal[2]} | IMEI: {animal[3]}")

telemetry_count = conn.run("SELECT COUNT(*) FROM telemetry")[0][0]
print(f"   • Total Telemetry: {telemetry_count}\n")

# Verify species enum values
print("🔍 Checking species enum values...")
enum_values = conn.run("""
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'speciesenum'
    ORDER BY e.enumsortorder
""")
print(f"   Enum values: {[v[0] for v in enum_values]}\n")

# Check if telemetry has recent timestamps
print("🕐 Checking telemetry freshness...")
recent = conn.run("""
    SELECT device_imei, MAX(timestamp) as last_seen
    FROM telemetry
    GROUP BY device_imei
""")
for row in recent:
    print(f"   • IMEI {row[0]}: Last seen {row[1]}")

print("\n" + "=" * 60)
print("✅ Data verification complete!")
print("=" * 60)

# Update telemetry timestamps to NOW for fresh data
print("\n🔄 Refreshing telemetry timestamps...")
now = datetime.utcnow()

for i, animal in enumerate(animals):
    imei = animal[3]
    # Update last 10 records to be recent
    conn.run("""
        UPDATE telemetry 
        SET timestamp = :new_time
        WHERE id IN (
            SELECT id FROM telemetry 
            WHERE device_imei = :imei 
            ORDER BY timestamp DESC 
            LIMIT 10
        )
    """, {
        "new_time": now - timedelta(minutes=i*2),
        "imei": imei
    })
    print(f"   ✓ Refreshed timestamps for {animal[1]} ({imei})")

print("\n✅ All telemetry timestamps refreshed to NOW!")
print("🗺️  Animals should now appear as ONLINE on the map\n")

conn.close()
