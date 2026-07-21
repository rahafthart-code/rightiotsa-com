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

## Security

- Never commit `.env` files with real values — they're gitignored. This repo's
  git history was purged once already (July 2026) after real secrets leaked
  via committed `.env` files; don't reintroduce the pattern.
- Treat `JWT_SECRET_KEY`, `DATABASE_URL`, API keys, etc. as deployment-env-only
  secrets (Supabase project secrets / CI env), never as repo content.
