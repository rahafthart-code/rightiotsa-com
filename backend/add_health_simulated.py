"""
Add simulated health data to support health alerts in the UI.
Generates random heart rate data with some animals having high stress (>100 bpm).
"""
import os
import re
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
match = re.match(r'postgresql\+pg8000://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
if not match:
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
username, password, host, port, database = match.groups()

print("🏥 Adding simulated health data...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Get all animals
animals = conn.run("SELECT id, name, device_imei FROM animals ORDER BY id")

print(f"📊 Found {len(animals)} animals\n")

now = datetime.utcnow()

for i, animal in enumerate(animals):
    animal_id, name, imei = animal
    
    # Simulate different stress levels
    # Khozama (first) will have high stress (>100 bpm)
    # Others normal (60-90 bpm)
    if i == 0:
        # High stress animal
        for j in range(10):
            heart_rate = random.randint(105, 130)  # High stress
            temperature = random.uniform(38.5, 39.5)  # Normal temp
            timestamp = now - timedelta(minutes=j*5)
            
            conn.run(
                """
                INSERT INTO health_data (device_imei, heart_rate, temperature, recorded_at)
                VALUES (:imei, :hr, :temp, :ts)
                """,
                imei=imei,
                hr=heart_rate,
                temp=temperature,
                ts=timestamp
            )
        print(f"   ⚠️  {name}: HIGH STRESS (heart rate 105-130 bpm) - 10 records")
    else:
        # Normal stress
        for j in range(10):
            heart_rate = random.randint(60, 90)  # Normal
            temperature = random.uniform(37.5, 38.5)
            timestamp = now - timedelta(minutes=j*5)
            
            conn.run(
                """
                INSERT INTO health_data (device_imei, heart_rate, temperature, recorded_at)
                VALUES (:imei, :hr, :temp, :ts)
                """,
                imei=imei,
                hr=heart_rate,
                temp=temperature,
                ts=timestamp
            )
        print(f"   ✅ {name}: Normal (heart rate 60-90 bpm) - 10 records")

print(f"\n✅ Health data seeded successfully!")
print("🏥 Khozama will show 'High Stress' alert in dashboard\n")

conn.close()
