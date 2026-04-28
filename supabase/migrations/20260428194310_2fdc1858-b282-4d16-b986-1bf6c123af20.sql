-- Ensure device_id is unique for ON CONFLICT upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sensor_devices_device_id_key'
  ) THEN
    ALTER TABLE public.sensor_devices
      ADD CONSTRAINT sensor_devices_device_id_key UNIQUE (device_id);
  END IF;
END $$;

-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: refresh sensor_devices on every new reading
CREATE OR REPLACE FUNCTION public.update_device_on_reading()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset public.assets%ROWTYPE;
BEGIN
  IF NEW.asset_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_asset FROM public.assets WHERE id = NEW.asset_id;

  IF v_asset.sensor_device_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.sensor_devices (
    device_id, asset_id, stable_id, owner_id,
    last_seen_at, last_lat, last_lng, status
  )
  VALUES (
    v_asset.sensor_device_id, NEW.asset_id,
    v_asset.stable_id, v_asset.owner_id,
    NEW.recorded_at, NEW.gps_lat, NEW.gps_lng,
    'online'
  )
  ON CONFLICT (device_id)
  DO UPDATE SET
    last_seen_at = EXCLUDED.last_seen_at,
    last_lat     = EXCLUDED.last_lat,
    last_lng     = EXCLUDED.last_lng,
    status       = 'online',
    stable_id    = EXCLUDED.stable_id,
    asset_id     = EXCLUDED.asset_id,
    updated_at   = now();

  RETURN NEW;
END;
$$;

-- Attach trigger to sensor_readings
DROP TRIGGER IF EXISTS on_sensor_reading ON public.sensor_readings;
CREATE TRIGGER on_sensor_reading
  AFTER INSERT ON public.sensor_readings
  FOR EACH ROW EXECUTE FUNCTION public.update_device_on_reading();

-- Cron: every 5 minutes mark stale devices offline
DO $$ BEGIN
  PERFORM cron.unschedule('mark-offline-devices');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'mark-offline-devices',
  '*/5 * * * *',
  $$
    UPDATE public.sensor_devices
    SET status = 'offline', updated_at = now()
    WHERE last_seen_at < now() - interval '1 hour'
      AND status = 'online';
  $$
);