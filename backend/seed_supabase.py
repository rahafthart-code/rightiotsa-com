"""
Seed data for Supabase database.
Run this to add Khozama and sample telemetry data.
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

print("🌱 Seeding Supabase data...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Get test user
result = conn.run("SELECT id FROM users WHERE email = 'test@example.com'")
if not result:
    print("❌ Test user not found")
    conn.close()
    exit(1)

test_user_id = result[0][0]
print(f"✅ Found test user (ID: {test_user_id})")

# Check if Khozama exists
imei = "359881234567890"
result = conn.run("SELECT id FROM animals WHERE device_imei = :imei", imei=imei)

if result:
    animal_id = result[0][0]
    print(f"✅ Khozama already exists (ID: {animal_id})")
else:
    # Create Khozama - use uppercase for enum (CAMEL, not Camel)
    result = conn.run(
        "INSERT INTO animals (owner_id, name, species, device_imei) VALUES (:owner_id, :name, :species::speciesenum, :device_imei) RETURNING id",
        owner_id=test_user_id, name="Khozama", species="CAMEL", device_imei=imei
    )
    animal_id = result[0][0]
    print(f"✅ Created Khozama (ID: {animal_id})")

# Check telemetry count
result = conn.run("SELECT COUNT(*) FROM telemetry WHERE device_imei = :imei", imei=imei)
existing_count = result[0][0]

if existing_count > 0:
    print(f"✅ {existing_count} telemetry records already exist")
else:
    # Create telemetry records
    now = datetime.utcnow()
    base_lat = 24.7136  # Riyadh area
    base_lng = 46.6753
    
    for i in range(10):
        ts = now - timedelta(minutes=10 - i)
        conn.run(
            "INSERT INTO telemetry (device_imei, lat, lng, battery, status, timestamp) VALUES (:device_imei, :lat, :lng, :battery, :status, :timestamp)",
            device_imei=imei,
            lat=base_lat + 0.01 * i,
            lng=base_lng + 0.01 * i,
            battery=max(5, 100 - i * 5),
            status="Moving" if i % 2 == 0 else "Resting",
            timestamp=ts
        )
    
    print("✅ Created 10 telemetry records")

# Summary
user_count = conn.run("SELECT COUNT(*) FROM users")[0][0]
animal_count = conn.run("SELECT COUNT(*) FROM animals")[0][0]
telemetry_count = conn.run("SELECT COUNT(*) FROM telemetry")[0][0]

print(f"\n📊 Database Summary:")
print(f"   • Users: {user_count}")
print(f"   • Animals: {animal_count}")
print(f"   • Telemetry records: {telemetry_count}")

conn.close()

print("\n🎉 Seeding complete!")
