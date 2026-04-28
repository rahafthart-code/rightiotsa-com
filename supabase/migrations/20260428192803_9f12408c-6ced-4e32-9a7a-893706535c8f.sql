-- ============================================
-- TABLE: stables
-- ============================================
CREATE TABLE IF NOT EXISTS public.stables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL,
  name          text NOT NULL,
  name_en       text,
  icon          text DEFAULT 'stable'
                  CHECK (icon IN ('stable', 'farm', 'ranch', 'desert')),
  location_name text,
  center_lat    numeric(10,6),
  center_lng    numeric(10,6),
  radius_km     numeric(5,2) DEFAULT 5,
  color         text DEFAULT '#1D9E75',
  is_active     boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Note: existing public.stables already exists in this project per schema.
-- The CREATE TABLE IF NOT EXISTS guards against re-creation. Add any missing cols:
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS icon text DEFAULT 'stable';
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS location_name text;
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS center_lat numeric(10,6);
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS center_lng numeric(10,6);
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS radius_km numeric(5,2) DEFAULT 5;
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS color text DEFAULT '#1D9E75';
ALTER TABLE public.stables ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add icon CHECK constraint if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stables_icon_check'
  ) THEN
    ALTER TABLE public.stables
      ADD CONSTRAINT stables_icon_check
      CHECK (icon IN ('stable', 'farm', 'ranch', 'desert'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stables_owner ON public.stables(owner_id);

-- ============================================
-- assets.stable_id (already exists in schema, ensure FK + index)
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_stable_id_fkey'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_stable_id_fkey
      FOREIGN KEY (stable_id) REFERENCES public.stables(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assets_stable ON public.assets(stable_id);

-- ============================================
-- TABLE: sensor_devices
-- ============================================
CREATE TABLE IF NOT EXISTS public.sensor_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       text UNIQUE NOT NULL,
  asset_id        uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  stable_id       uuid REFERENCES public.stables(id) ON DELETE SET NULL,
  owner_id        uuid NOT NULL,
  device_type     text DEFAULT 'collar'
                    CHECK (device_type IN ('collar','tag','implant','external')),
  firmware_ver    text,
  battery_pct     integer,
  signal_strength integer,
  last_seen_at    timestamptz,
  last_lat        numeric(10,6),
  last_lng        numeric(10,6),
  status          text DEFAULT 'online'
                    CHECK (status IN ('online','offline','low_battery','error')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensor_devices_asset ON public.sensor_devices(asset_id);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_stable ON public.sensor_devices(stable_id);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_owner ON public.sensor_devices(owner_id);

ALTER TABLE public.sensor_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own sensor devices" ON public.sensor_devices;
CREATE POLICY "Owners manage own sensor devices"
  ON public.sensor_devices
  FOR ALL
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "CEO views all sensor devices" ON public.sensor_devices;
CREATE POLICY "CEO views all sensor devices"
  ON public.sensor_devices
  FOR SELECT
  USING (public.has_role(auth.uid(), 'ceo'::app_role));

-- updated_at triggers
DROP TRIGGER IF EXISTS update_stables_updated_at ON public.stables;
CREATE TRIGGER update_stables_updated_at
  BEFORE UPDATE ON public.stables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sensor_devices_updated_at ON public.sensor_devices;
CREATE TRIGGER update_sensor_devices_updated_at
  BEFORE UPDATE ON public.sensor_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.sensor_devices REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_devices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================
-- VIEW: stable_stats
-- ============================================
CREATE OR REPLACE VIEW public.stable_stats
WITH (security_invoker = true) AS
SELECT
  s.id                                                    AS stable_id,
  s.owner_id,
  s.name,
  s.icon,
  s.color,
  COUNT(a.id)                                             AS total_assets,
  COUNT(a.id) FILTER (WHERE a.status = 'stable')          AS stable_count,
  COUNT(a.id) FILTER (WHERE a.status = 'warning')         AS warning_count,
  COUNT(a.id) FILTER (WHERE a.status = 'danger')          AS danger_count,
  ROUND(AVG(a.stability_index), 1)                        AS avg_stability,
  COUNT(sd.id) FILTER (WHERE sd.status = 'online')        AS sensors_online,
  COUNT(sd.id) FILTER (WHERE sd.status = 'offline')       AS sensors_offline,
  COUNT(sd.id) FILTER (WHERE sd.battery_pct < 20)         AS low_battery_count
FROM public.stables s
LEFT JOIN public.assets         a  ON a.stable_id = s.id AND a.is_active = true
LEFT JOIN public.sensor_devices sd ON sd.stable_id = s.id
GROUP BY s.id;