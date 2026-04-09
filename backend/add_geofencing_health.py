"""
Add geo-fencing and health monitoring tables to Supabase.
"""
import os
import re
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

print("🔧 Adding geo-fencing and health monitoring to Supabase...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Add geo-fencing table
print("📋 Creating geofences table...")
conn.run("""
    CREATE TABLE IF NOT EXISTS geofences (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
        center_lat DOUBLE PRECISION NOT NULL,
        center_lng DOUBLE PRECISION NOT NULL,
        radius_km DECIMAL(5, 2) DEFAULT 5.0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ geofences table created\n")

# Add health_data table
print("📋 Creating health_data table...")
conn.run("""
    CREATE TABLE IF NOT EXISTS health_data (
        id SERIAL PRIMARY KEY,
        device_imei VARCHAR(255) NOT NULL,
        heart_rate INTEGER,
        temperature DECIMAL(4, 1),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ health_data table created\n")

# Add alert_status to telemetry (for geo-fence breaches)
print("📋 Adding alert_status column to telemetry...")
try:
    conn.run("""
        ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS alert_status VARCHAR(50)
    """)
    print("   ✓ alert_status column added\n")
except Exception as e:
    print(f"   ⚠️  Column might already exist: {e}\n")

# Create indexes
print("📋 Creating indexes...")
conn.run("CREATE INDEX IF NOT EXISTS idx_geofences_animal ON geofences(animal_id)")
conn.run("CREATE INDEX IF NOT EXISTS idx_health_device ON health_data(device_imei)")
conn.run("CREATE INDEX IF NOT EXISTS idx_health_recorded ON health_data(recorded_at DESC)")
print("   ✓ indexes created\n")

print("=" * 60)
print("✅ Geo-fencing & Health Monitoring Added!")
print("=" * 60)
print("   • Geofences: Virtual fence with radius (default 5km)")
print("   • Health Data: Heart rate & temperature tracking")
print("   • Alert Status: Out of range notifications")
print("=" * 60)

conn.close()
