-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule with same name (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('hourly-stability-snapshot');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule hourly snapshot using the existing snapshot_all_assets() function
SELECT cron.schedule(
  'hourly-stability-snapshot',
  '0 * * * *',
  $$ SELECT public.snapshot_all_assets(); $$
);

-- Seed an initial snapshot row for current assets so charts have data immediately
SELECT public.snapshot_all_assets();