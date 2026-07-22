-- ============ IoT Watchdog: activate + fix conflicting schedule ============
-- device-watchdog (supabase/functions/device-watchdog) already implements
-- 30-min offline detection + throttled notifications, but nothing ever
-- invoked it. The only thing actually running was a separate raw-SQL cron
-- ("mark-offline-devices") with a conflicting 1-hour threshold and no
-- notifications at all. Replace it with a real scheduled call to the
-- edge function, which now also handles low-battery detection.

-- 1) Remove the old silent/conflicting cron.
DO $$ BEGIN
  PERFORM cron.unschedule('mark-offline-devices');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2) Allow the notification types device-watchdog actually emits.
--    (device_offline was already inserted by the function pre-this-migration
--    and would have silently failed the CHECK constraint every time.)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'danger_alert',
  'warning_alert',
  're_engagement',
  'daily_update',
  'claim_update',
  'zone_breach',
  'system',
  'device_offline',
  'low_battery'
));

-- 3) Shared secret for cron -> edge-function auth, generated here so no
--    literal secret value is ever committed to source control.
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'device_watchdog_cron_secret') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'device_watchdog_cron_secret',
      'Shared secret between pg_cron and the device-watchdog edge function.'
    );
  END IF;
END $$;

-- ACTION REQUIRED (one-time, manual, cannot be done from this migration):
--   1. Run: select decrypted_secret from vault.decrypted_secrets
--            where name = 'device_watchdog_cron_secret';
--   2. Set it as the edge function secret:
--        supabase secrets set CRON_SECRET=<value-from-step-1>
--   3. Deploy the updated function: supabase functions deploy device-watchdog

-- 4) Schedule the real invocation every 5 minutes.
DO $$ BEGIN
  PERFORM cron.unschedule('device-watchdog-scan');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'device-watchdog-scan',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ukpdgukfziwsotjaevbd.supabase.co/functions/v1/device-watchdog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'device_watchdog_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
