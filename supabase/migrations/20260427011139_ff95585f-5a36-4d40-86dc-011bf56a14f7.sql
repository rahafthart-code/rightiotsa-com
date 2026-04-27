-- 1) Add new vital + environmental + computed columns
ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS respiration_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS activity_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS env_temp numeric(4,2),
  ADD COLUMN IF NOT EXISTS env_humidity numeric(4,2),
  ADD COLUMN IF NOT EXISTS is_in_zone boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS vital_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS env_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS smoothed_stability numeric(5,2);

-- 2) Add gps_lat/gps_lng as generated alias columns mapping to latitude/longitude
ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS gps_lat numeric(10,6) GENERATED ALWAYS AS (latitude::numeric(10,6)) STORED,
  ADD COLUMN IF NOT EXISTS gps_lng numeric(10,6) GENERATED ALWAYS AS (longitude::numeric(10,6)) STORED;

-- 3) Composite index for fast asset history queries
CREATE INDEX IF NOT EXISTS idx_readings_asset_time ON public.sensor_readings(asset_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_time ON public.sensor_readings(recorded_at DESC);

-- 4) Upgraded compute_stability: uses real vitals + env when present, fallback to legacy
CREATE OR REPLACE FUNCTION public.compute_stability_v2(
  p_asset_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_temp numeric,
  p_heart_rate numeric DEFAULT NULL,
  p_respiration_rate numeric DEFAULT NULL,
  p_activity_score numeric DEFAULT NULL,
  p_env_temp numeric DEFAULT NULL,
  p_env_humidity numeric DEFAULT NULL
)
RETURNS TABLE(vital_pct numeric, env_pct numeric, stability numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_pct numeric := 90;  -- default vital health
  e_pct numeric := 100; -- default env (in zone, mild)
  dist double precision;
  g_lat double precision;
  g_lng double precision;
  g_rad numeric;
  body_dev numeric;
  hr_pct numeric := 100;
  resp_pct numeric := 100;
  act_pct numeric := 100;
  env_t_pct numeric := 100;
  env_h_pct numeric := 100;
  geo_pct numeric := 100;
BEGIN
  -- ===== VITAL (60%) =====
  -- Body temperature deviation from 38°C
  IF p_temp IS NOT NULL THEN
    body_dev := GREATEST(0, ABS(p_temp - 38.0) - 0.5);
    v_pct := GREATEST(40, 100 - body_dev * 18);
  END IF;
  -- Heart rate (camel/horse normal ~30-50 bpm)
  IF p_heart_rate IS NOT NULL THEN
    hr_pct := GREATEST(40, 100 - GREATEST(0, ABS(p_heart_rate - 40) - 10) * 2);
  END IF;
  -- Respiration (normal ~10-20)
  IF p_respiration_rate IS NOT NULL THEN
    resp_pct := GREATEST(40, 100 - GREATEST(0, ABS(p_respiration_rate - 15) - 5) * 3);
  END IF;
  -- Activity score (0-100, higher better, dip if too low or hyperactive)
  IF p_activity_score IS NOT NULL THEN
    act_pct := GREATEST(40, 100 - GREATEST(0, ABS(p_activity_score - 60) - 20));
  END IF;
  v_pct := ROUND((v_pct + hr_pct + resp_pct + act_pct) / 4.0, 2);

  -- ===== ENV (40%) =====
  SELECT geofence_lat, geofence_lng, COALESCE(geofence_radius_km, 5)
    INTO g_lat, g_lng, g_rad
  FROM public.assets WHERE id = p_asset_id;

  IF g_lat IS NOT NULL AND g_lng IS NOT NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    dist := public.haversine_km(p_lat, p_lng, g_lat, g_lng);
    IF dist <= g_rad THEN
      geo_pct := 100;
    ELSE
      geo_pct := GREATEST(0, 100 - ((dist - g_rad) / NULLIF(g_rad,0)) * 20);
    END IF;
  END IF;
  -- Ambient temperature (comfort zone 15-35°C)
  IF p_env_temp IS NOT NULL THEN
    env_t_pct := GREATEST(40, 100 - GREATEST(0, CASE
      WHEN p_env_temp < 15 THEN 15 - p_env_temp
      WHEN p_env_temp > 35 THEN p_env_temp - 35
      ELSE 0 END) * 4);
  END IF;
  -- Humidity (comfort 30-70%)
  IF p_env_humidity IS NOT NULL THEN
    env_h_pct := GREATEST(40, 100 - GREATEST(0, CASE
      WHEN p_env_humidity < 30 THEN 30 - p_env_humidity
      WHEN p_env_humidity > 70 THEN p_env_humidity - 70
      ELSE 0 END) * 2);
  END IF;
  e_pct := ROUND((geo_pct + env_t_pct + env_h_pct) / 3.0, 2);

  vital_pct := v_pct;
  env_pct := e_pct;
  stability := ROUND(v_pct * 0.6 + e_pct * 0.4, 2);
  RETURN NEXT;
END;
$$;

-- 5) Upgrade fill_stability_score trigger to use v2 + populate vital_score, env_score, smoothed_stability
CREATE OR REPLACE FUNCTION public.fill_stability_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_result record;
  v_smoothed numeric;
BEGIN
  IF NEW.asset_id IS NOT NULL THEN
    SELECT * INTO v_result FROM public.compute_stability_v2(
      NEW.asset_id, NEW.latitude, NEW.longitude, NEW.temperature,
      NEW.heart_rate, NEW.respiration_rate, NEW.activity_score,
      NEW.env_temp, NEW.env_humidity
    );
    NEW.vital_score := COALESCE(NEW.vital_score, v_result.vital_pct);
    NEW.env_score := COALESCE(NEW.env_score, v_result.env_pct);
    IF NEW.stability_score IS NULL THEN
      NEW.stability_score := v_result.stability;
    END IF;

    -- Smoothed stability = avg of last 5 readings (including this one)
    SELECT AVG(s) INTO v_smoothed FROM (
      SELECT NEW.stability_score AS s
      UNION ALL
      SELECT stability_score FROM public.sensor_readings
        WHERE asset_id = NEW.asset_id AND stability_score IS NOT NULL
        ORDER BY recorded_at DESC LIMIT 4
    ) sub;
    NEW.smoothed_stability := COALESCE(NEW.smoothed_stability, ROUND(v_smoothed, 2));

    -- Auto-fill is_in_zone
    IF NEW.is_in_zone IS NULL THEN
      NEW.is_in_zone := (v_result.env_pct >= 95);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger if not present
DROP TRIGGER IF EXISTS fill_stability_score_trigger ON public.sensor_readings;
CREATE TRIGGER fill_stability_score_trigger
  BEFORE INSERT ON public.sensor_readings
  FOR EACH ROW EXECUTE FUNCTION public.fill_stability_score();

-- 6) Enable Realtime on sensor_readings
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sensor_readings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
  END IF;
END $$;