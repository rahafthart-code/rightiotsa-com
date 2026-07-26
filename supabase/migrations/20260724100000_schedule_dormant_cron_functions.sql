-- ============ Activate the other dormant scheduled functions ============
-- Same bug class as device-watchdog (fixed in 20260722120000): these three
-- edge functions were fully built, each already gates on CRON_SECRET and
-- documents its own intended schedule in a header comment, but nothing in
-- the migration history ever actually called cron.schedule for them.
-- Reuses the CRON_SECRET already provisioned in Vault for device-watchdog —
-- it's one project-wide edge function secret, not per-function.

-- uptime-monitor: pings secure-otp/iot-ingest/log-error every 5 min,
-- emails the admin via Resend on failure (own header comment: "every 5 min").
DO $$ BEGIN
  PERFORM cron.unschedule('uptime-monitor-scan');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'uptime-monitor-scan',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://letmkvhragnvdtlkraua.supabase.co/functions/v1/uptime-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'device_watchdog_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- re-engagement: daily digest to owners absent >=3 days
-- (own header comment: "daily 09:00" — read as 09:00 Asia/Riyadh = 06:00 UTC,
-- matching weekly-report's existing UTC/Riyadh convention below).
DO $$ BEGIN
  PERFORM cron.unschedule('re-engagement-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  're-engagement-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://letmkvhragnvdtlkraua.supabase.co/functions/v1/re-engagement',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'device_watchdog_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- weekly-report: per-stable HTML report + owner notification
-- (own header comment: "Sundays 05:00 UTC = 08:00 Asia/Riyadh").
DO $$ BEGIN
  PERFORM cron.unschedule('weekly-report-sunday');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'weekly-report-sunday',
  '0 5 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://letmkvhragnvdtlkraua.supabase.co/functions/v1/weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'device_watchdog_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ACTION REQUIRED: none beyond what was already done for device-watchdog —
-- CRON_SECRET is a single project-wide edge function secret, already set.
-- Just deploy the (unmodified) functions if they aren't live yet:
--   supabase functions deploy uptime-monitor
--   supabase functions deploy re-engagement
--   supabase functions deploy weekly-report
