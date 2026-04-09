"""
Add subscription tables to Supabase for the Right platform.
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

print("🔧 Adding subscription system to Supabase...\n")

import pg8000.native

conn = pg8000.native.Connection(
    user=username,
    password=password,
    host=host,
    port=int(port),
    database=database
)

# Create subscription plans enum
print("📋 Creating subscription types...")
conn.run("""
    DO $$ BEGIN
        CREATE TYPE subscriptionplan AS ENUM ('CAMEL_ANNUAL', 'HORSE_ANNUAL', 'FALCON_ANNUAL');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
""")
print("   ✓ subscriptionplan enum created\n")

# Create subscriptions table
print("📋 Creating subscriptions table...")
conn.run("""
    CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan subscriptionplan NOT NULL,
        price_sar DECIMAL(10, 2) NOT NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ subscriptions table created\n")

# Create payment_transactions table (for mock payments)
print("📋 Creating payment_transactions table...")
conn.run("""
    CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount_sar DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'MOCK_PAYMENT',
        transaction_status VARCHAR(20) DEFAULT 'SUCCESS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ payment_transactions table created\n")

# Create indexes
print("📋 Creating indexes...")
conn.run("CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)")
conn.run("CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active)")
conn.run("CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id)")
print("   ✓ indexes created\n")

# Check tables
tables_count = conn.run("""
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('subscriptions', 'payment_transactions')
""")[0][0]

print("=" * 60)
print("✅ Subscription System Added Successfully!")
print("=" * 60)
print(f"   • New Tables: {tables_count}")
print("   • Subscription Plans: CAMEL_ANNUAL, HORSE_ANNUAL, FALCON_ANNUAL")
print("   • Ready for payments!")
print("=" * 60)

conn.close()
