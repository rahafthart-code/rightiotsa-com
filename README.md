# Right - Livestock Telemetry & Health Platform

A comprehensive platform for monitoring and managing livestock (Camels, Horses, Falcons) with real-time telemetry, health tracking, and multi-language support.

## Features

### Backend (FastAPI)
- ✅ Email-based OTP authentication via Resend
- ✅ PostgreSQL/Supabase database support
- ✅ IoT device telemetry ingestion
- ✅ Multi-species animal management (Camels, Horses, Falcons)
- ✅ Admin portal APIs
- ✅ JWT-based authentication
- ✅ Connectivity status monitoring

### Frontend (React + Vite + Tailwind)
- ✅ Multi-language support (English/Arabic) with i18next
- ✅ Separate dashboards for each species
- ✅ Real-time Mapbox map integration
- ✅ Connectivity status indicators (Online/Offline/Removed)
- ✅ Responsive design with Tailwind CSS
- ✅ Admin portal for user and device management

## Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your:
# - Resend API key
# - Supabase connection string  
# - Mapbox token
# - Admin email

# Run server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Add your Mapbox token to .env

# Run dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Environment Configuration

### Backend (.env)

```env
# Resend (Email/OTP)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=no-reply@yourdomain.com

# Supabase (Database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin
ADMIN_EMAIL=your-admin@email.com

# Optional: IoT Webhook Security
IOT_WEBHOOK_SECRET=your-webhook-secret
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxx
```

## Service Provider Setup

### 1. Resend Setup (Email/OTP)
1. Go to https://resend.com/
2. Create an account and verify your domain
3. Generate an API key
4. Add to backend `.env`: `RESEND_API_KEY=re_xxxxx`

### 2. Supabase Setup (Database)
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (URI format)
5. Add to backend `.env`: `DATABASE_URL=postgresql://...`

### 3. Mapbox Setup (Maps)
1. Go to https://account.mapbox.com/
2. Create an account
3. Generate an access token
4. Add to frontend `.env`: `VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxx`

## Default Credentials

For local development, use the "Dev: Log in as test user" button on the login page.

- Email: `test@example.com`
- No password required (dev mode only)

## Project Structure

```
right-mvp/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py       # Main FastAPI app
│   │   ├── auth.py       # Authentication logic
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # Database configuration
│   │   ├── email_utils.py # Resend email integration
│   │   └── seed_data.py  # Database seeding
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/             # React frontend
    ├── src/
    │   ├── pages/        # Page components
    │   ├── components/   # Reusable components
    │   ├── utils/        # Utility functions
    │   ├── i18n.js       # i18next configuration
    │   ├── api.js        # API client
    │   └── App.jsx       # Main app component
    ├── package.json
    └── .env.example
```

## API Endpoints

### Authentication
- `POST /request-otp` - Request OTP code
- `POST /verify-otp` - Verify OTP and get JWT
- `POST /dev/test-login` - Dev mode login (local only)

### User Endpoints
- `GET /me` - Get current user
- `GET /animals` - List user's animals
- `GET /animals/{id}/latest-telemetry` - Latest telemetry for animal
- `GET /animals/{id}/telemetry` - Telemetry history

### Admin Endpoints
- `POST /admin/users` - Create user
- `POST /admin/animals` - Register animal/device
- `GET /admin/devices` - List all devices with status

### IoT Webhook
- `POST /webhook/iot-data` - Receive telemetry from IoT devices

## Multi-Language Support

The platform supports English and Arabic:
- Click the language toggle in the navbar (EN/ع)
- Translations stored in `frontend/src/i18n.js`
- RTL support for Arabic

## Connectivity Status

Devices are automatically marked as:
- **Online**: Telemetry received within last 30 minutes
- **Offline**: No telemetry for 30+ minutes
- **Removed**: No telemetry data available

## License

Proprietary - All Rights Reserved

## Support

For issues or questions, contact: your-email@example.com
