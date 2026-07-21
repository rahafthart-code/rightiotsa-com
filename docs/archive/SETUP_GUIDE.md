# Right Platform - Complete Setup Guide

This guide will walk you through setting up the Right platform with Supabase, Mapbox, and Resend.

## Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- A Supabase account (free tier works)
- A Mapbox account (free tier works)
- A Resend account (free tier works)

## Step-by-Step Setup

### 1. Get Your API Keys and Credentials

#### A. Resend (Email/OTP Authentication)

1. Go to https://resend.com/signup
2. Create a free account
3. Verify your email
4. Add and verify a domain OR use the testing domain for development
5. Navigate to "API Keys" in the dashboard
6. Click "Create API Key"
7. Copy the key (starts with `re_`)

#### B. Supabase (Database)

1. Go to https://supabase.com/
2. Create a free account
3. Click "New Project"
4. Fill in:
   - Project name: `right-production`
   - Database password: (create a strong password and save it)
   - Region: Choose closest to your users
5. Wait for project to be created (2-3 minutes)
6. Go to Project Settings > Database
7. Find "Connection string" section
8. Copy the URI format connection string
9. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres:your-password-here@db.abcdefghijklm.supabase.co:5432/postgres
```

#### C. Mapbox (Maps)

1. Go to https://account.mapbox.com/auth/signup/
2. Create a free account
3. After signing in, go to "Tokens" page
4. Your default public token is already created
5. Copy the token (starts with `pk.`)

OR create a new token:
1. Click "Create a token"
2. Name it "Right Platform"
3. Select scopes: styles, fonts, geocoding (default scopes are fine)
4. Copy the token

### 2. Configure Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Now edit `backend/.env`:

```env
# Resend Configuration
RESEND_API_KEY=re_YourActualResendAPIKey
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET_KEY=generate-a-random-32-character-string-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin Configuration
ADMIN_EMAIL=your-actual-email@example.com

# Optional: IoT Webhook Security
IOT_WEBHOOK_SECRET=optional-webhook-secret

# Development
DEV_ENABLE_TEST_LOGIN=1
DEV_TEST_USER_EMAIL=test@example.com
```

**Important Notes:**
- Replace `re_YourActualResendAPIKey` with your actual Resend API key
- Replace the entire `DATABASE_URL` with your Supabase connection string
- For `JWT_SECRET_KEY`, generate a secure random string (you can use: `openssl rand -hex 32`)
- Update `ADMIN_EMAIL` with your real email address
- For `RESEND_FROM_EMAIL`, use your verified domain email or Resend's testing email for development

### 3. Initialize Database

```bash
# Make sure you're in backend directory with venv activated
cd backend
source .venv/bin/activate  # if not already activated

# Run seed script to create initial data
python3 -m app.seed_data
```

This will create:
- Test user (test@example.com)
- Sample animal "Khozama" (Camel)
- 10 sample telemetry records

### 4. Start Backend Server

```bash
# Still in backend directory
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Keep this terminal open. The backend is now running at `http://localhost:8000`

### 5. Configure Frontend

Open a NEW terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Now edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_ACCESS_TOKEN=pk.YourActualMapboxToken
```

**Replace** `pk.YourActualMapboxToken` with your actual Mapbox token.

### 6. Start Frontend Server

```bash
# Still in frontend directory
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 7. Test the Application

1. Open your browser and go to `http://localhost:5173`
2. You should see the Right login page
3. Click "Dev: Log in as test user" button
4. You'll be logged in and redirected to the dashboard
5. You should see:
   - Khozama (the sample camel) in the sidebar
   - A map showing the camel's location
   - Battery and activity status
   - Last 10 movement records

### 8. Test Language Toggle

1. In the top-right navbar, click the language button (EN or ع)
2. The interface should switch between English and Arabic
3. The layout should switch between LTR and RTL

### 9. Test Admin Portal

1. In the navbar, click "Admin Portal"
2. You should be able to:
   - Create new users
   - Register new animals/devices
   - View all active devices with connectivity status

### 10. Test OTP Login (with Resend)

1. Click "Logout" or clear browser storage
2. Go back to login page
3. Enter your `ADMIN_EMAIL` in the email field
4. Click "Send login code"
5. Check your email for the 6-digit code
6. Enter the code and click "Verify & continue"
7. You should be logged in

## Troubleshooting

### Backend won't start

**Error: `No module named 'app'`**
- Make sure you're in the `backend` directory
- Make sure venv is activated: `source .venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

**Error: `RESEND_API_KEY is not set`**
- Check your `backend/.env` file exists
- Verify `RESEND_API_KEY` is set correctly
- Make sure there are no quotes around the value

**Database connection error**
- Verify your Supabase connection string is correct
- Check that you replaced `[YOUR-PASSWORD]` with your actual password
- Ensure your Supabase project is running (not paused)

### Frontend won't start

**Error: `Cannot find module`**
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

**Map not loading**
- Check your `VITE_MAPBOX_ACCESS_TOKEN` in `frontend/.env`
- Verify the token is valid and active in your Mapbox account
- Check browser console for errors

**Backend API errors**
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_BASE_URL` in `frontend/.env` is correct
- Open `http://localhost:8000/docs` to see API documentation

### OTP emails not sending

**Using Resend:**
- Verify your Resend API key is correct
- If using a custom domain, ensure it's verified in Resend dashboard
- For testing, use the Resend testing domain
- Check Resend dashboard > Logs to see email status

## Production Deployment

### Backend Deployment

Recommended: Deploy to platforms like:
- Railway.app
- Render.com
- Fly.io
- AWS/GCP/Azure

Set environment variables in your hosting platform's dashboard.

### Frontend Deployment

Recommended: Deploy to:
- Vercel
- Netlify  
- Cloudflare Pages

```bash
npm run build
```

Upload the `dist/` folder or connect your Git repository.

Set environment variables:
- `VITE_API_BASE_URL`: Your production backend URL
- `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox token

## Next Steps

1. **Add Real Users**: Use Admin Portal to create actual user accounts
2. **Register Devices**: Add real animal tracking devices with their IMEIs
3. **Configure IoT Integration**: Set up your IoT devices to send data to `/webhook/iot-data`
4. **Customize Branding**: Update logo, colors, and text as needed
5. **Set Up Production Domain**: Configure custom domain for your frontend
6. **Enable HTTPS**: Ensure both frontend and backend use HTTPS in production

## Support

For issues:
1. Check this guide first
2. Review the main README.md
3. Check backend logs and frontend console for errors
4. Verify all API keys and credentials are correct

## Security Notes

- **Never commit `.env` files** to version control
- Use strong passwords for Supabase
- Rotate API keys regularly
- In production, disable `DEV_ENABLE_TEST_LOGIN`
- Use environment-specific secrets for production
- Enable rate limiting on API endpoints
- Set up proper CORS origins in production

---

Last updated: 2026-02-09
