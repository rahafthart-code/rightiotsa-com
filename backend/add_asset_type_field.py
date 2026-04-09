"""
Migration script to add asset_type field to users table.
Run this once to update the database schema.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        # Add asset_type column if it doesn't exist
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS asset_type VARCHAR
            """))
            print("✓ Added asset_type column")
        except Exception as e:
            print(f"Asset_type column: {e}")
        
        conn.commit()
        print("\n✅ Database migration complete!")

if __name__ == "__main__":
    migrate()
