# Right Platform - Quick Reference Card

## 🌐 Access URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | ✅ Running |
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Docs** | http://localhost:8000/docs | 📚 Available |

## 🔑 API Keys Required

### 1. Resend (Email/OTP)
- **Where**: https://resend.com/
- **Set in**: `backend/.env`
- **Key**: `RESEND_API_KEY=re_xxxxx`
- **Email**: `RESEND_FROM_EMAIL=no-reply@right.app`

### 2. Supabase (Database)
- **Where**: https://supabase.com/
- **Set in**: `backend/.env`
- **Key**: `DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres`

### 3. Mapbox (Maps)
- **Where**: https://account.mapbox.com/
- **Set in**: `frontend/.env`
- **Key**: `VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxx`

## 🚀 Quick Start Commands

```bash
# Start Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Start Frontend (new terminal)
cd frontend && npm run dev
```

## 🎨 Platform Features

### Languages
- 🇬🇧 English (EN)
- 🇸🇦 Arabic (ع)
- Toggle in navbar (top-right)

### Dashboards
- 🐪 Camels: `/dashboard`
- 🐴 Horses: `/horses`
- 🦅 Falcons: `/falcons`

### Status Indicators
- 🟢 Online: < 30 minutes
- 🟡 Offline: > 30 minutes
- ⚪ Removed: No data

## 👤 Default Test Login

- **Email**: test@example.com
- **Method**: Click "Dev: Log in as test user"
- **Access**: Full admin access

## 📱 Sample Data

- **Animal**: Khozama (خزامة)
- **Species**: Camel
- **IMEI**: 359881234567890
- **Telemetry**: 10 sample records

## 🔧 Admin Functions

Navigate to `/admin-portal` to:
- ➕ Create new users
- 📟 Register devices
- 👁️ Monitor all devices
- 📊 View connectivity status

## 🌍 Language Toggle

Click **EN** or **ع** button in navbar:
- Switches UI language
- Auto-adjusts RTL/LTR layout
- Saves preference to localStorage

## 📊 API Endpoints

### Auth
- `POST /request-otp`
- `POST /verify-otp`
- `POST /dev/test-login` (dev only)

### User
- `GET /me`
- `GET /animals`
- `GET /animals/{id}/latest-telemetry`
- `GET /animals/{id}/telemetry?limit=10`

### Admin
- `POST /admin/users`
- `POST /admin/animals`
- `GET /admin/devices`

### IoT
- `POST /webhook/iot-data`

## 🎯 Configuration Files

```
backend/.env          ← Add your Resend, Supabase, JWT keys
frontend/.env         ← Add your Mapbox token
```

## 📖 Full Documentation

- `README.md` - Main overview
- `SETUP_GUIDE.md` - Step-by-step setup
- `CHANGES.md` - Complete changelog
- `backend/README.md` - Backend specifics
- `frontend/README.md` - Frontend specifics

## 🔍 Testing Checklist

- [ ] Login with dev test user works
- [ ] Language toggle works (EN ↔ AR)
- [ ] Dashboard shows Khozama
- [ ] Map displays (if Mapbox token set)
- [ ] Battery and activity cards show data
- [ ] Movements table has 10 records
- [ ] Connectivity status shows "Online"
- [ ] Admin portal accessible
- [ ] Can create new user
- [ ] Can register new device
- [ ] Horses dashboard accessible (`/horses`)
- [ ] Falcons dashboard accessible (`/falcons`)

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Add Mapbox token to `frontend/.env` |
| Can't send OTP | Add Resend API key to `backend/.env` |
| Database error | Check DATABASE_URL in `backend/.env` |
| Language not switching | Clear browser cache and reload |
| Logo not showing | Verify logo.png exists in `frontend/src/assets/` |

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review `CHANGES.md` for what was changed
3. Check terminal outputs for errors
4. Verify all `.env` files are configured

---

**Quick Tip**: For local development, you can use SQLite (default) and skip Supabase setup. Just use the dev test login button!
