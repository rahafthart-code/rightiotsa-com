"""
Database migration utility to migrate from SQLite to Supabase/PostgreSQL.

Usage:
    python3 -m app.migrate_to_supabase

Make sure to:
1. Update DATABASE_URL in .env with your Supabase connection string
2. Run this script to create tables and migrate data
"""
import os
import sys
from datetime import datetime

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from .models import Base, User, Animal, Telemetry, OtpCode


def migrate():
    database_url = os.getenv("DATABASE_URL", "sqlite:///./right.db")
    
    if not database_url.startswith("postgresql"):
        print("❌ ERROR: DATABASE_URL must be a PostgreSQL connection string for Supabase")
        print(f"   Current: {database_url[:50]}...")
        print("\n📝 Update your backend/.env file with:")
        print("   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres")
        print("\n   Get this from: Supabase Dashboard > Settings > Database > Connection String")
        sys.exit(1)
    
    print("🔄 Starting migration to Supabase...\n")
    print(f"📊 Target Database: {database_url[:60]}...\n")
    
    try:
        # Create engine for Supabase
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=True
        )
        
        # Test connection
        with engine.connect() as conn:
            print("✅ Successfully connected to Supabase!\n")
        
        # Create all tables
        print("📋 Creating tables in Supabase...\n")
        Base.metadata.create_all(bind=engine)
        
        # Check what tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n✅ Created {len(tables)} tables:")
        for table in tables:
            print(f"   ✓ {table}")
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Check if we need to seed initial data
            user_count = db.query(User).count()
            
            if user_count == 0:
                print("\n📥 Seeding initial data...\n")
                
                # Create test user
                user = User(
                    full_name="Test User",
                    email="test@example.com",
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"   ✓ Created test user: {user.email}")
                
                # Create sample animal (Khozama)
                from .models import SpeciesEnum
                animal = Animal(
                    owner_id=user.id,
                    name="Khozama",
                    species=SpeciesEnum.CAMEL,
                    device_imei="359881234567890"
                )
                db.add(animal)
                db.commit()
                db.refresh(animal)
                print(f"   ✓ Created animal: {animal.name} ({animal.species})")
                
                # Create sample telemetry
                now = datetime.utcnow()
                base_lat = 24.7136  # Riyadh area
                base_lng = 46.6753
                
                from datetime import timedelta
                records = []
                for i in range(10):
                    ts = now - timedelta(minutes=10 - i)
                    records.append(
                        Telemetry(
                            device_imei=animal.device_imei,
                            lat=base_lat + 0.01 * i,
                            lng=base_lng + 0.01 * i,
                            battery=max(5, 100 - i * 5),
                            status="Moving" if i % 2 == 0 else "Resting",
                            timestamp=ts,
                        )
                    )
                db.add_all(records)
                db.commit()
                print(f"   ✓ Created {len(records)} telemetry records")
                
                print("\n✅ Migration completed successfully!")
                print(f"\n📊 Summary:")
                print(f"   • Users: {db.query(User).count()}")
                print(f"   • Animals: {db.query(Animal).count()}")
                print(f"   • Telemetry records: {db.query(Telemetry).count()}")
            else:
                print(f"\n✅ Database already contains {user_count} user(s)")
                print("   Skipping seed data (tables already populated)")
                print(f"\n📊 Current database state:")
                print(f"   • Users: {db.query(User).count()}")
                print(f"   • Animals: {db.query(Animal).count()}")
                print(f"   • Telemetry records: {db.query(Telemetry).count()}")
                print(f"   • OTP codes: {db.query(OtpCode).count()}")
        
        finally:
            db.close()
        
        print("\n🎉 Supabase migration complete!")
        print("🚀 You can now restart your backend server to use Supabase")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("\n🔍 Troubleshooting:")
        print("   1. Verify your DATABASE_URL is correct in backend/.env")
        print("   2. Check that your Supabase project is active")
        print("   3. Ensure your IP is allowed in Supabase > Settings > Database > Connection Pooling")
        print("   4. Verify password in connection string is correct")
        sys.exit(1)


if __name__ == "__main__":
    # Load .env file
    from dotenv import load_dotenv
    load_dotenv()
    
    migrate()
