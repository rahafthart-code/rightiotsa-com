"""
Migration script to add mobile and city fields to users table.
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
        # Add mobile column if it doesn't exist
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS mobile VARCHAR
            """))
            print("✓ Added mobile column")
        except Exception as e:
            print(f"Mobile column: {e}")
        
        # Add city column if it doesn't exist
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS city VARCHAR
            """))
            print("✓ Added city column")
        except Exception as e:
            print(f"City column: {e}")
        
        # Add created_at column if it doesn't exist
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            print("✓ Added created_at column")
        except Exception as e:
            print(f"Created_at column: {e}")
        
        conn.commit()
        print("\n✅ Database migration complete!")

if __name__ == "__main__":
    migrate()
