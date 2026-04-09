import os
os.environ['SUPABASE_URL'] = 'https://yvhhtupuczhqplafpofv.supabase.co'
os.environ['SUPABASE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aGh0dXB1Y3pocXBsYWZwb2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4OTQ2ODYsImV4cCI6MjA1NDQ3MDY4Nn0.E1YJR0T2xSLfXr9mBWL_tOEj7i_dO0gIpYYGpvqQZfE'

from app.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

demo_telemetry = [
    {"imei": "DEMO_CAMEL_001", "lat": 24.7136, "lng": 46.6753},
    {"imei": "DEMO_HORSE_001", "lat": 24.7200, "lng": 46.6800},
    {"imei": "DEMO_FALCON_001", "lat": 24.7100, "lng": 46.6900},
]

with Session(engine) as db:
    for demo in demo_telemetry:
        # Check if telemetry exists
        count = db.execute(
            text("SELECT COUNT(*) FROM telemetry WHERE device_imei = :imei"),
            {"imei": demo["imei"]}
        ).scalar()
        
        if count == 0:
            db.execute(
                text("INSERT INTO telemetry (device_imei, lat, lng, timestamp) VALUES (:imei, :lat, :lng, :ts)"),
                {"imei": demo["imei"], "lat": demo["lat"], "lng": demo["lng"], "ts": datetime.utcnow()}
            )
            print(f"✓ Created telemetry for {demo['imei']}")
        else:
            print(f"ℹ Telemetry already exists for {demo['imei']}: {count} records")
    
    # Create health data for horse if it doesn't exist
    horse_health_count = db.execute(
        text("SELECT COUNT(*) FROM health_data WHERE device_imei = 'DEMO_HORSE_001'"),
        {}
    ).scalar()
    
    if horse_health_count == 0:
        db.execute(
            text("INSERT INTO health_data (device_imei, heart_rate, temperature, recorded_at) VALUES (:imei, :hr, :temp, :ts)"),
            {"imei": "DEMO_HORSE_001", "hr": 75, "temp": 34.0, "ts": datetime.utcnow()}
        )
        print("✓ Created health data for DEMO_HORSE_001 (HR: 75, Temp: 34°C)")
    
    db.commit()
    print("\n🎉 Demo telemetry seeded successfully!")
