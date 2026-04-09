"""
Database migration script to add national_id field to users table.
Run this once to update the database schema.

Usage:
    python add_national_id_field.py
"""

import os
from sqlalchemy import create_engine, text

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/smartherd")

# Create engine
engine = create_engine(DATABASE_URL)

def add_national_id_column():
    """Add national_id column to users table if it doesn't exist."""
    
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='national_id';
        """))
        
        if result.fetchone() is None:
            print("Adding national_id column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN national_id VARCHAR;
            """))
            conn.commit()
            print("✓ Successfully added national_id column!")
        else:
            print("✓ national_id column already exists. No changes needed.")

if __name__ == "__main__":
    print("=== Database Migration: Add National ID Field ===")
    try:
        add_national_id_column()
        print("\n✓ Migration completed successfully!")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        raise
