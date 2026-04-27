-- 1) Add new columns to assets (keep all existing column names intact)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS stability_index numeric(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'stable'
    CHECK (status IN ('stable','warning','danger','offline')),
  ADD COLUMN IF NOT EXISTS cloudinary_id text,
  ADD COLUMN IF NOT EXISTS sensor_device_id text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_insured boolean DEFAULT false;

-- 2) Add generated alias columns mapping to existing names for forward-compat
--    (image_url -> photo_url, serial_number -> registration_no, insured_value -> insurance_value)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS photo_url text GENERATED ALWAYS AS (image_url) STORED,
  ADD COLUMN IF NOT EXISTS registration_no text GENERATED ALWAYS AS (serial_number) STORED,
  ADD COLUMN IF NOT EXISTS insurance_value numeric(12,2) GENERATED ALWAYS AS (insured_value::numeric(12,2)) STORED;

-- 3) Backfill is_insured from insured_value
UPDATE public.assets SET is_insured = true WHERE insured_value IS NOT NULL AND insured_value > 0 AND is_insured = false;

-- 4) Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(species);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON public.assets(owner_id);

-- 5) Trigger: when a new sensor_reading arrives, update the asset's stability_index and status
CREATE OR REPLACE FUNCTION public.sync_asset_stability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_status text;
BEGIN
  IF NEW.asset_id IS NULL OR NEW.stability_score IS NULL THEN
    RETURN NEW;
  END IF;

  new_status := CASE
    WHEN NEW.stability_score >= 85 THEN 'stable'
    WHEN NEW.stability_score >= 70 THEN 'warning'
    ELSE 'danger'
  END;

  UPDATE public.assets
    SET stability_index = NEW.stability_score,
        status = new_status,
        updated_at = now()
  WHERE id = NEW.asset_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_asset_stability_trigger ON public.sensor_readings;
CREATE TRIGGER sync_asset_stability_trigger
  AFTER INSERT ON public.sensor_readings
  FOR EACH ROW EXECUTE FUNCTION public.sync_asset_stability();

-- 6) Ensure updated_at trigger exists on assets (uses existing update_updated_at_column)
DROP TRIGGER IF EXISTS assets_updated_at ON public.assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();