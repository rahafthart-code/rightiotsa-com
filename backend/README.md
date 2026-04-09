Backend for Right
=================

## Overview

This is a FastAPI backend with support for both SQLite (development) and PostgreSQL/Supabase (production). It provides:

- User management and email OTP authentication via Resend
- Animal and device management (Camels, Horses, Falcons)
- Telemetry ingestion from an IoT provider (`POST /webhook/iot-data`)
- Admin APIs for managing users and devices
- Multi-language support (English/Arabic)

## Setup

1. Create a virtual environment and install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Create a `.env` file based on `.env.example` and configure:
   - **RESEND_API_KEY**: Get from https://resend.com/
   - **RESEND_FROM_EMAIL**: Your verified sender email
   - **DATABASE_URL**: 
     - Development: `sqlite:///./right.db`
     - Production: `postgresql://...` (Supabase connection string)
   - **ADMIN_EMAIL**: Your admin email address
   - **JWT_SECRET_KEY**: Generate a secure random string

3. Run the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Database Migration

### SQLite to Supabase (PostgreSQL)

To migrate from SQLite to Supabase:

1. Update `.env` with your Supabase connection string
2. Run the seed data script to populate initial data
3. Restart the server## API DocumentationInteractive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`