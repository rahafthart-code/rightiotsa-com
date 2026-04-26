-- Add geofence config to assets (used by stability formula)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS geofence_lat double precision,
  ADD COLUMN IF NOT EXISTS geofence_lng double precision,
  ADD COLUMN IF NOT EXISTS geofence_radius_km numeric DEFAULT 5;

-- Haversine distance helper (km)
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r constant double precision := 6371;
  dlat double precision;
  dlng double precision;
  a double precision;
BEGIN
  IF lat1 IS NULL OR lat2 IS NULL OR lng1 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
  RETURN r * 2 * atan2(sqrt(a), sqrt(1 - a));
END;
$$;

-- Stability formula (60% geofence adherence + 40% health stability)
-- Health stability degrades linearly outside ideal temperature window (37.5–38.5 C)
CREATE OR REPLACE FUNCTION public.compute_stability(
  p_asset_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_temp numeric
) RETURNS numeric
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  geo_pct numeric := 100;
  health_pct numeric := 90;
  dist double precision;
  g_lat double precision;
  g_lng double precision;
  g_rad numeric;
  dev numeric;
BEGIN
  SELECT geofence_lat, geofence_lng, COALESCE(geofence_radius_km, 5)
    INTO g_lat, g_lng, g_rad
  FROM public.assets WHERE id = p_asset_id;

  IF g_lat IS NOT NULL AND g_lng IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    dist := public.haversine_km(p_lat, p_lng, g_lat, g_lng);
    IF dist <= g_rad THEN
      geo_pct := 100;
    ELSE
      -- Linear decay: lose 20% per radius outside, floor at 0
      geo_pct := GREATEST(0, 100 - ((dist - g_rad) / NULLIF(g_rad,0)) * 20);
    END IF;
  END IF;

  IF p_temp IS NOT NULL THEN
    dev := GREATEST(0, ABS(p_temp - 38.0) - 0.5);
    health_pct := GREATEST(40, 100 - dev * 18);
  END IF;

  RETURN ROUND(geo_pct * 0.6 + health_pct * 0.4, 2);
END;
$$;

-- Trigger: auto-fill stability_score on sensor_readings insert if not provided
CREATE OR REPLACE FUNCTION public.fill_stability_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stability_score IS NULL AND NEW.asset_id IS NOT NULL THEN
    NEW.stability_score := public.compute_stability(
      NEW.asset_id, NEW.latitude, NEW.longitude, NEW.temperature
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_stability_score ON public.sensor_readings;
CREATE TRIGGER trg_fill_stability_score
  BEFORE INSERT ON public.sensor_readings
  FOR EACH ROW EXECUTE FUNCTION public.fill_stability_score();

-- Enable realtime
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE public.assets REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sensor_readings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.assets';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'devices'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.devices';
  END IF;
END $$;

-- Helpful index for "latest reading per asset"
CREATE INDEX IF NOT EXISTS idx_sensor_readings_asset_recorded
  ON public.sensor_readings (asset_id, recorded_at DESC);