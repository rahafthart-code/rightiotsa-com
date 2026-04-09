"""
Standalone Supabase migration script.
Run this to create tables and seed data in Supabase.

Usage: python3 migrate_standalone.py
"""
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL.startswith("postgresql"):
    print("❌ ERROR: DATABASE_URL must be a PostgreSQL connection string")
    print(f"   Current: {DATABASE_URL[:50]}...")
    sys.exit(1)

# Parse connection string for pg8000
import re
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    # Try without driver prefix
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    print("❌ ERROR: Invalid DATABASE_URL format")
    sys.exit(1)

username, password, host, port, database = match.groups()

print("🔄 Starting Supabase migration...\n")
print(f"📊 Target: {host}:{port}/{database}\n")

try:
    import pg8000.native
    
    # Connect to Supabase using pg8000
    print("🔌 Connecting to Supabase...")
    conn = pg8000.native.Connection(
        user=username,
        password=password,
        host=host,
        port=int(port),
        database=database
    )
    
    print("✅ Connected to Supabase!\n")
    
    # Create tables
    print("📋 Creating tables...\n")
    
    # Create enum type for species
    conn.run("""
        DO $$ BEGIN
            CREATE TYPE speciesenum AS ENUM ('Camel', 'Horse', 'Falcon');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    print("   ✓ speciesenum type")
    
    # Users table
    conn.run("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("   ✓ users")
    
    # Animals table
    conn.run("""
        CREATE TABLE IF NOT EXISTS animals (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            species speciesenum NOT NULL,
            device_imei VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("   ✓ animals")
    
    # Telemetry table
    conn.run("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id SERIAL PRIMARY KEY,
            device_imei VARCHAR(255) NOT NULL,
            lat DOUBLE PRECISION NOT NULL,
            lng DOUBLE PRECISION NOT NULL,
            battery INTEGER,
            status VARCHAR(50),
            timestamp TIMESTAMP NOT NULL
        )
    """)
    print("   ✓ telemetry")
    
    # OTP codes table
    conn.run("""
        CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            is_used BOOLEAN DEFAULT FALSE
        )
    """)
    print("   ✓ otp_codes")
    
    # Create indexes
    conn.run("CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_imei)")
    conn.run("CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC)")
    print("   ✓ indexes")
    
    # Check if we need to seed data
    result = conn.run("SELECT COUNT(*) FROM users")
    user_count = result[0][0]
    
    if user_count == 0:
        print("\n📥 Seeding initial data...\n")
        
        # Get admin email
        admin_email = os.getenv("ADMIN_EMAIL", "test@example.com").lower()
        
        # Create test user
        result = conn.run(
            "INSERT INTO users (full_name, email, is_active) VALUES (:full_name, :email, :is_active) RETURNING id",
            full_name="Test User", email="test@example.com", is_active=True
        )
        test_user_id = result[0][0]
        print(f"   ✓ Created test user: test@example.com (ID: {test_user_id})")
        
        # Create admin user if different
        if admin_email != "test@example.com":
            result = conn.run(
                "INSERT INTO users (full_name, email, is_active) VALUES (:full_name, :email, :is_active) RETURNING id",
                full_name="Admin User", email=admin_email, is_active=True
            )
            admin_user_id = result[0][0]
            print(f"   ✓ Created admin user: {admin_email} (ID: {admin_user_id})")
        else:
            admin_user_id = test_user_id
        
        # Create Khozama (camel)
        imei = "359881234567890"
        result = conn.run(
            "INSERT INTO animals (owner_id, name, species, device_imei) VALUES (:owner_id, :name, :species, :device_imei) RETURNING id",
            owner_id=test_user_id, name="Khozama", species="Camel", device_imei=imei
        )
        animal_id = result[0][0]
        print(f"   ✓ Created animal: Khozama (Camel, IMEI: {imei})")
        
        # Create telemetry records
        now = datetime.utcnow()
        base_lat = 24.7136  # Riyadh area
        base_lng = 46.6753
        
        records_created = 0
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
            records_created += 1
        
        print(f"   ✓ Created {records_created} telemetry records")
        
        print("\n✅ Migration completed successfully!")
    else:
        print(f"\n✅ Database already contains {user_count} user(s)")
        print("   Skipping seed data")
    
    # Show summary
    user_count = conn.run("SELECT COUNT(*) FROM users")[0][0]
    animal_count = conn.run("SELECT COUNT(*) FROM animals")[0][0]
    telemetry_count = conn.run("SELECT COUNT(*) FROM telemetry")[0][0]
    otp_count = conn.run("SELECT COUNT(*) FROM otp_codes")[0][0]
    
    print(f"\n📊 Database Summary:")
    print(f"   • Users: {user_count}")
    print(f"   • Animals: {animal_count}")
    print(f"   • Telemetry records: {telemetry_count}")
    print(f"   • OTP codes: {otp_count}")
    
    conn.close()
    
    print("\n🎉 Supabase is ready!")
    print("🚀 Restart your backend server to use the cloud database")
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    print("\n🔍 Troubleshooting:")
    print("   1. Verify DATABASE_URL in backend/.env")
    print("   2. Check Supabase project is active")
    print("   3. Ensure IP is allowed in Supabase settings")
    print("   4. Verify password is correct")
    sys.exit(1)
