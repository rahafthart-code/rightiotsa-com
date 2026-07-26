-- ============ Fix device-watchdog cron: wrong project URL ============
-- Migration 20260722120000 scheduled the device-watchdog cron job with a
-- hardcoded project URL that turned out to be the wrong project
-- (ukpdgukfziwsotjaevbd instead of the real one, letmkvhragnvdtlkraua).
-- Since that migration was already applied, don't edit it in place —
-- reschedule the job here with the correct URL instead.

DO $$ BEGIN
  PERFORM cron.unschedule('device-watchdog-scan');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'device-watchdog-scan',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://letmkvhragnvdtlkraua.supabase.co/functions/v1/device-watchdog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'device_watchdog_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
