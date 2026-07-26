# Right (rightiotsa) — Project Conventions

Livestock/falconry IoT tracking + insurance platform (Saudi market). Architecture:
frontend (React + Vite + Tailwind) talks directly to **Supabase** (Postgres/RLS,
Auth, Edge Functions) — there is no separate application backend server. See
[README.md](README.md) for the full architecture and edge function catalog.

## UI/UX

- **RTL-first.** Arabic is the primary layout direction (`html`/`body` are forced
  `dir: rtl` in `frontend/index.html`); English is secondary via i18next. Check
  both directions before shipping any UI change — don't design LTR-first and
  mirror it later.
- **Font: Cairo**, loaded via Google Fonts in `frontend/index.html` and used
  everywhere (`frontend/src/index.css`). Keep it — it's already wired across
  every page and is visually equivalent to Tajawal for this purpose; don't
  introduce a second Arabic font without a real reason.
- Dashboards must be designed mobile-responsive from the start, not
  desktop-first with mobile bolted on.
- Prefer smooth micro-interactions (transitions, hover/press states, skeleton
  loaders) over static, instant-snap UI.
- Multi-digit inputs (OTP/verification codes) must auto-advance focus to the
  next box on input, support backspace-to-previous, and support paste-to-fill
  across all boxes at once.

## Frontend (`frontend/src/`)

- Stack: React + Vite + Tailwind CSS. **Shadcn UI is not installed yet** — when
  a task needs new UI primitives, add them via the Shadcn CLI (built on Tailwind
  + Radix) instead of hand-rolling equivalents Shadcn already provides.
- Keep components small and single-purpose. Extract data-fetching/mutation
  logic into custom hooks rather than inlining Supabase calls inside JSX.
- Every view that fetches async data needs explicit loading and error states —
  no silent failures, no unhandled promise rejections.
- Talk to Supabase via `frontend/src/lib/supabaseClient.js` (the one client
  instance) — never introduce a second client or a competing HTTP backend
  (a parallel FastAPI backend was already retired for exactly this reason).

## Testing (`frontend/`)

- `npm test` (Vitest, jsdom) — run before considering frontend work on hooks
  or components done. `npm run test:watch` while iterating.
- Mock `../lib/supabaseClient` per-test with the chainable helper in
  `src/test/supabaseMock.js` (`mockSupabaseFrom({ table: response })`) rather
  than hand-rolling a new query-builder mock each time.
- Mock `react-router-dom`'s `useNavigate` and `react-i18next`'s
  `useTranslation` inline per test file (see `useSubscriptionGuard.test.jsx`,
  `UpgradeModal.test.jsx` for the pattern) instead of a real Router/i18next
  instance — cheaper and the components only ever touch `navigate()` and
  `i18n.language`.
- Edge functions (`supabase/functions/*`, Deno) are **not** covered by Vitest
  — there's no Deno test runner wired up in this repo yet. Business logic
  that can reasonably move to the frontend layer (or a shared, Node-testable
  module) should be tested there; Deno-only logic is currently unverified by
  automated tests, so review those changes extra carefully.

## Backend / Edge Functions (`supabase/functions/`)

- All privileged / service-role logic belongs in an edge function, written in
  TypeScript for Deno. Nothing here should call out to a non-Supabase backend.
- Mirror the auth boilerplate already established in the codebase rather than
  inventing a new pattern per function:
  - User-facing, JWT-gated functions → copy `admin-activate-device/index.ts`'s
    pattern (`Bearer` header → `getClaims` → role check against `user_roles`
    via a service-role client).
  - Device-facing functions (no user session) → copy `iot-ingest/index.ts`'s
    pattern (`X-Device-Api-Key` header, hashed and matched against `devices`).
- Reuse existing RPCs/insert paths (e.g. `calculate_stability`) instead of
  hand-rolling a parallel insert that skips triggers/stability computation.
- Verify payment-gateway and DB integrations end-to-end (actually call them),
  not just type-check them, before calling a task done.
- Log errors and security-relevant events reliably (`error_log`,
  `edge_function_errors` tables) — but never log secrets, full payloads
  containing PII, or payment details.

## Known architecture gotcha: `devices` vs `sensor_devices`

Two tables that look like duplicates but aren't quite:
- `devices` — the IoT auth/ingestion table (`api_key_hash`), written by
  `register-device` (self-service) and read by `iot-ingest`/`volt-webhook`.
  `sensor_readings.device_id` FKs here.
- `sensor_devices` — a denormalized, human-facing device-status table kept in
  sync by a trigger (`update_device_on_reading`) on every `sensor_readings`
  insert, keyed by the string `assets.sensor_device_id`. Also written
  directly by `admin-activate-device` (admin-side activation never touches
  `devices` at all). This is what nearly all UI (dashboards, admin panel,
  `AssetPassport`, health hooks) actually reads.
- `useSubscriptionGuard`'s device count reads `sensor_devices` (fixed — it
  used to read `devices`, which undercounts admin-activated devices). There
  is also no DB-level trigger enforcing `max_devices` (unlike
  `enforce_asset_limit`/`enforce_stable_limit`) — device-limit enforcement is
  client-side only for now.
- Don't assume these two tables should be merged into one without a real
  schema-design pass — they currently serve genuinely different roles
  (auth/ingestion vs. UI read-model), just with a confusingly similar name.

## Alerting: the notifications pipeline is real, the delivery UI wasn't wired

- `sensor_readings` insert triggers (`sync_asset_stability` and friends)
  already create throttled (30-min) `notifications` rows for
  `danger_alert`/`warning_alert`/`zone_breach` — this part is live and does
  not need to be rebuilt.
- `GlobalDangerOverlay` (mounted at the true app root in `App.jsx`, alongside
  `GeofenceBreachToast`) subscribes to Realtime INSERTs on `notifications`
  and shows `DangerOverlay` (full-screen red modal, vet-call button) for
  `danger_alert`/`zone_breach`. It used to live only inside `ProtectedLayout`,
  which the actual primary `/dashboard` route (`OwnerDashboardDark`) doesn't
  use — so it never reached real users. Fixed by moving it to the root.
- `GeofenceBreachToast` (softer toast, also root-mounted) handles the same
  event types plus `warning_alert` — this is intentional layering (toast for
  everything, full-screen modal for the two most severe types), not
  duplication. Don't remove one thinking it supersedes the other.
- A completely dead 4th variant (`components/global/DangerAlertOverlay.jsx`
  + 3 other unreferenced files in that directory) was deleted — if you find
  yourself wanting a `<Something>Overlay.jsx` for this, check `DangerOverlay.jsx`
  first, it almost certainly already does what you need.
- `device-watchdog` (offline + low-battery detection, throttled notifications)
  existed but was **never actually scheduled** — a separate raw-SQL cron
  (`mark-offline-devices`, 1h threshold, silent) was the only thing running.
  Fixed via migration `20260722120000_iot_watchdog_scheduling.sql`: removed
  the old cron, extended `notifications.type` to allow `device_offline`/
  `low_battery` (the CHECK constraint didn't have them — the old code's insert
  was silently failing), and scheduled the real function via `pg_cron` +
  `pg_net` + a Vault-stored secret. Applying this migration and setting the
  `CRON_SECRET` edge function secret is a manual one-time step — see the
  migration file's header comment.
- Live Supabase project ref is `letmkvhragnvdtlkraua` (in `supabase/config.toml`
  and hardcoded into the watchdog cron's `net.http_post` URL — if the project
  ever changes again, both places need updating, plus a new migration to
  reschedule the cron since already-applied migrations aren't re-run).
- Same bug, three more functions: `uptime-monitor`, `re-engagement`, and
  `weekly-report` were each fully built with a header comment claiming a
  cron schedule ("Triggered by pg_cron every 5 min", etc.) that never
  actually existed anywhere in the migrations. Fixed in
  `20260724100000_schedule_dormant_cron_functions.sql`, reusing the same
  `device_watchdog_cron_secret` Vault secret (`CRON_SECRET` is one
  project-wide edge function secret, not per-function — no new manual step
  needed beyond what device-watchdog already required). Before adding a
  *new* cron-triggered function, check `supabase/migrations/` for an actual
  `cron.schedule(...)` call, not just a comment claiming one — this codebase
  has a track record of the two drifting apart.
- `re-engagement` fires for any owner with `profiles.daily_digest_enabled`
  (default `true`, opt-out) absent ≥3 days — scheduling it means real users
  start getting daily notifications the next morning, not a no-op.

## Admin panel (`/admin/*`)

- `/admin/system` (`SystemHealthPage.jsx` + `useSystemHealth` hook): live
  tiles for device online/offline/low-battery counts, IoT response rate
  (% of devices with a signal in the last 30 min), active users, today's
  notifications, critical errors, an Edge Function error breakdown (last
  24h), and a Realtime connectivity self-check badge. Payment stat reads
  the `payments` table (Moyasar/mock) — **not** `payments_log`, which
  belonged to the retired ClickPay/Edfapay webhook and is never written to.
- `/admin/audit` (`AuditLogPage.jsx` + `useAuditLog`/`useFilteredAuditLog`
  hooks): unified, filterable, sortable, CSV-exportable view over
  `notifications` + `error_log` + `edge_function_errors` (last 200 rows
  each, normalized into one shape). Admin RLS already allowed reading all
  three tables — this was purely a missing frontend, no new policies needed.

## Security

- Never commit `.env` files with real values — they're gitignored. This repo's
  git history was purged once already (July 2026) after real secrets leaked
  via committed `.env` files; don't reintroduce the pattern.
- Treat `JWT_SECRET_KEY`, `DATABASE_URL`, API keys, etc. as deployment-env-only
  secrets (Supabase project secrets / CI env), never as repo content.
