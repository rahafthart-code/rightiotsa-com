# Right - Livestock Telemetry & Insurance Platform

An IoT-based tracking, health-monitoring, and insurance platform for livestock and falconry assets (camels, horses, falcons) in Saudi Arabia — GPS geofencing, vital-sign monitoring, subscription plans, and Payflowly/Moyasar-based payments.

## Architecture

There is no custom backend server. **Supabase is the single backend**: Postgres (with Row Level Security) for data, Supabase Auth for identity, and Edge Functions for anything that needs privileged/service-role logic. The frontend talks to Supabase directly.

```
├── frontend/                # React + Vite + Tailwind app
│   └── src/
│       ├── pages/           # Route-level pages (dashboards, checkout, onboarding, ...)
│       ├── admin/           # Admin panel (/admin/*) — customers, devices, subscriptions,
│       │                    #   system health, reports, settings — gated by AdminGuard
│       ├── components/      # Shared components
│       ├── lib/
│       │   └── supabaseClient.js   # The only Supabase client instance
│       ├── constants/       # Static data (e.g. subscription plans)
│       ├── hooks/, utils/   # Hooks and helpers
│       └── i18n.js          # English/Arabic translations (RTL supported)
│
├── supabase/
│   ├── migrations/          # Postgres schema: profiles, stables, assets, devices,
│   │                        #   sensor_readings, subscriptions, user_roles, RLS policies
│   └── functions/           # Edge Functions (Deno) — see below
│
├── iot-device/
│   └── volt_api.py          # Standalone script for physical IoT hardware (Raspberry Pi).
│                             #   Reads sensors and posts readings directly to the
│                             #   iot-ingest / volt-webhook edge functions. Independent
│                             #   of the web app — does not run as part of it.
│
└── docs/archive/            # Historical build logs from earlier development, kept for
                              #   reference only; not current documentation.
```

## Edge Functions (`supabase/functions/`)

| Function | Purpose |
|---|---|
| `secure-otp` | Email/phone OTP request + verify (login/signup) |
| `iot-ingest`, `volt-webhook` | Device telemetry ingestion (API-key authenticated, no user JWT) |
| `simulate-movement` | Admin-only live-demo mode: jitters GPS/vitals for active devices through the same stability-calculation path real telemetry uses |
| `register-device`, `admin-activate-device` | Device lifecycle (linking a device to an owner/asset) |
| `device-watchdog` | Marks devices offline when telemetry goes stale |
| `create-payment`, `verify-payment` | Subscription payments (Moyasar; falls back to a server-side mock activation when no gateway key is configured yet) |
| `cloudinary-upload` | Image uploads |
| `re-engagement`, `weekly-report`, `uptime-monitor`, `log-error` | Notifications, reporting, and monitoring |

Functions that must be callable by devices without a user session (`iot-ingest`, `volt-webhook`, `weekly-report`) have `verify_jwt = false` in `supabase/config.toml` and authenticate via a device/API key instead.

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

Runs at `http://localhost:5173` (or run `npm run dev` from the repo root, which wraps the same command on port 8080).

### 2. Supabase

The project already has a hosted Supabase instance (`project_id` in `supabase/config.toml`). To work on migrations or functions locally, install the [Supabase CLI](https://supabase.com/docs/guides/cli) and:

```bash
supabase link --project-ref <project-ref>
supabase db push              # apply migrations
supabase functions deploy     # deploy edge functions
```

## Environment Configuration

### `frontend/.env`

```env
# Supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key from Supabase dashboard>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Mapbox (https://account.mapbox.com/access-tokens/)
VITE_MAPBOX_ACCESS_TOKEN=pk.xxxxx
```

### Edge Function secrets (set via `supabase secrets set`, never committed)

Resend (OTP email), Mapbox, and Moyasar/Payflowly keys used by the edge functions are configured as Supabase project secrets, not in any `.env` file in this repo.

## Multi-Language Support

English and Arabic, toggled from the navbar. Translations live in `frontend/src/i18n.js`; Arabic renders RTL.

## Admin Panel

`/admin/*` (guarded by `AdminGuard`, requires the `admin` role in `user_roles`): customers, devices, subscriptions, system health (including the live-demo simulation control), reports, and settings.

## License

Proprietary - All Rights Reserved
