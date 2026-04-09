import os
os.environ['SUPABASE_URL'] = 'https://yvhhtupuczhqplafpofv.supabase.co'
os.environ['SUPABASE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aGh0dXB1Y3pocXBsYWZwb2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4OTQ2ODYsImV4cCI6MjA1NDQ3MDY4Nn0.E1YJR0T2xSLfXr9mBWL_tOEj7i_dO0gIpYYGpvqQZfE'

from app.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

with Session(engine) as db:
    # Update existing health data to 34°C and lower heart rate
    result = db.execute(
        text("""
        UPDATE health_data 
        SET temperature = 34.0, heart_rate = 75
        WHERE device_imei = 'DEMO_HORSE_001'
        """)
    )
    
    rows_updated = result.rowcount
    db.commit()
    
    print(f"✓ Updated {rows_updated} health record(s) for DEMO_HORSE_001")
    print("  • Heart Rate: 75 bpm (Excellent)")
    print("  • Temperature: 34°C (Safe)")
    print("\n🎉 Health data updated successfully!")
    print("   Status will show: حالة ممتازة (Excellent Health)")
