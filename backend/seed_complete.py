"""
Complete seed script for Supabase with all three species.
Seeds: Khozama (Camel), Al-Adiyat (Horse), Shaheen (Falcon)
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

print("🌱 Seeding Supabase with complete data...\n")

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
print(f"✅ Found test user (ID: {test_user_id})\n")

# Clear existing animals and telemetry
print("🗑️  Clearing existing data...")
conn.run("DELETE FROM telemetry")
conn.run("DELETE FROM animals")
print("✅ Cleared old data\n")

now = datetime.utcnow()

# ========== ANIMAL 1: KHOZAMA (Camel) ==========
print("🐪 Creating Khozama (Camel)...")
imei_camel = "359881234567890"
result = conn.run(
    "INSERT INTO animals (owner_id, name, species, device_imei) VALUES (:owner_id, :name, :species::speciesenum, :device_imei) RETURNING id",
    owner_id=test_user_id, name="Khozama", species="CAMEL", device_imei=imei_camel
)
khozama_id = result[0][0]
print(f"   ✓ Khozama created (ID: {khozama_id}, IMEI: {imei_camel})")

# Khozama telemetry - Riyadh area
base_lat_camel = 24.7136
base_lng_camel = 46.6753
for i in range(15):
    ts = now - timedelta(minutes=15 - i)
    conn.run(
        "INSERT INTO telemetry (device_imei, lat, lng, battery, status, timestamp) VALUES (:device_imei, :lat, :lng, :battery, :status, :timestamp)",
        device_imei=imei_camel,
        lat=base_lat_camel + 0.008 * i,
        lng=base_lng_camel + 0.008 * i,
        battery=max(10, 95 - i * 3),
        status="Moving" if i % 3 != 0 else "Resting",
        timestamp=ts
    )
print(f"   ✓ Created 15 telemetry records for Khozama\n")

# ========== ANIMAL 2: AL-ADIYAT (Horse) ==========
print("🐴 Creating Al-Adiyat (Horse)...")
imei_horse = "359881234567891"
result = conn.run(
    "INSERT INTO animals (owner_id, name, species, device_imei) VALUES (:owner_id, :name, :species::speciesenum, :device_imei) RETURNING id",
    owner_id=test_user_id, name="Al-Adiyat", species="HORSE", device_imei=imei_horse
)
aladiyat_id = result[0][0]
print(f"   ✓ Al-Adiyat created (ID: {aladiyat_id}, IMEI: {imei_horse})")

# Al-Adiyat telemetry - East of Riyadh (horse farm area)
base_lat_horse = 24.7500
base_lng_horse = 46.7200
for i in range(12):
    ts = now - timedelta(minutes=12 - i)
    conn.run(
        "INSERT INTO telemetry (device_imei, lat, lng, battery, status, timestamp) VALUES (:device_imei, :lat, :lng, :battery, :status, :timestamp)",
        device_imei=imei_horse,
        lat=base_lat_horse + 0.005 * i,
        lng=base_lng_horse + 0.006 * i,
        battery=max(15, 92 - i * 4),
        status="Moving" if i % 2 == 0 else "Resting",
        timestamp=ts
    )
print(f"   ✓ Created 12 telemetry records for Al-Adiyat\n")

# ========== ANIMAL 3: SHAHEEN (Falcon) ==========
print("🦅 Creating Shaheen (Falcon)...")
imei_falcon = "359881234567892"
result = conn.run(
    "INSERT INTO animals (owner_id, name, species, device_imei) VALUES (:owner_id, :name, :species::speciesenum, :device_imei) RETURNING id",
    owner_id=test_user_id, name="Shaheen", species="FALCON", device_imei=imei_falcon
)
shaheen_id = result[0][0]
print(f"   ✓ Shaheen created (ID: {shaheen_id}, IMEI: {imei_falcon})")

# Shaheen telemetry - Northern area with varied altitude pattern
base_lat_falcon = 24.8000
base_lng_falcon = 46.6500
for i in range(10):
    ts = now - timedelta(minutes=10 - i)
    # Falcons have more varied movement patterns
    lat_offset = 0.015 * i if i % 2 == 0 else 0.010 * i
    lng_offset = 0.012 * i if i % 2 == 0 else 0.008 * i
    conn.run(
        "INSERT INTO telemetry (device_imei, lat, lng, battery, status, timestamp) VALUES (:device_imei, :lat, :lng, :battery, :status, :timestamp)",
        device_imei=imei_falcon,
        lat=base_lat_falcon + lat_offset,
        lng=base_lng_falcon + lng_offset,
        battery=max(20, 88 - i * 5),
        status="Moving" if i % 3 != 1 else "Resting",
        timestamp=ts
    )
print(f"   ✓ Created 10 telemetry records for Shaheen\n")

# Summary
user_count = conn.run("SELECT COUNT(*) FROM users")[0][0]
animal_count = conn.run("SELECT COUNT(*) FROM animals")[0][0]
telemetry_count = conn.run("SELECT COUNT(*) FROM telemetry")[0][0]

# Get animals with their latest telemetry
animals = conn.run("""
    SELECT a.name, a.species, a.device_imei, COUNT(t.id) as telemetry_count
    FROM animals a
    LEFT JOIN telemetry t ON a.device_imei = t.device_imei
    GROUP BY a.id, a.name, a.species, a.device_imei
    ORDER BY a.species
""")

print("=" * 60)
print("📊 Supabase Database Summary:")
print("=" * 60)
print(f"   • Users: {user_count}")
print(f"   • Animals: {animal_count}")
print(f"   • Total Telemetry Records: {telemetry_count}\n")

print("🐾 Animals & Tracking Data:")
print("-" * 60)
for animal in animals:
    name, species, imei, count = animal
    print(f"   {species:8} | {name:12} | {imei} | {count:2} records")

print("=" * 60)

conn.close()

print("\n✅ Seeding complete!")
print("🚀 All three species are now in Supabase with tracking data")
print("\n📍 Tracking Locations:")
print("   🐪 Khozama    → Riyadh central area (24.71°N, 46.67°E)")
print("   🐴 Al-Adiyat → East Riyadh farm area (24.75°N, 46.72°E)")
print("   🦅 Shaheen   → North Riyadh highlands (24.80°N, 46.65°E)")
print("\n🌐 Refresh your dashboard to see the data!")
