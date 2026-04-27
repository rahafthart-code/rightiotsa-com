-- 1) Create stability_snapshots table
CREATE TABLE IF NOT EXISTS public.stability_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  vital_score numeric(5,2),
  env_score numeric(5,2),
  final_index numeric(5,2),
  status_flag text CHECK (status_flag IN ('stable','warning','danger')),
  snapped_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snaps_asset_time
  ON public.stability_snapshots(asset_id, snapped_at DESC);

CREATE INDEX IF NOT EXISTS idx_snaps_time
  ON public.stability_snapshots(snapped_at DESC);

-- 2) Enable RLS
ALTER TABLE public.stability_snapshots ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Owners view their own snapshots; admin and CEO view all
CREATE POLICY "Owners view their snapshots"
  ON public.stability_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = stability_snapshots.asset_id
        AND (
          a.owner_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'ceo'::app_role)
        )
    )
  );

-- 4) Function to take a snapshot of all active assets from their latest reading
CREATE OR REPLACE FUNCTION public.snapshot_all_assets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  WITH latest AS (
    SELECT DISTINCT ON (sr.asset_id)
      sr.asset_id,
      sr.vital_score,
      sr.env_score,
      COALESCE(sr.smoothed_stability, sr.stability_score) AS final_index
    FROM public.sensor_readings sr
    WHERE sr.asset_id IS NOT NULL
    ORDER BY sr.asset_id, sr.recorded_at DESC
  ),
  ins AS (
    INSERT INTO public.stability_snapshots(asset_id, vital_score, env_score, final_index, status_flag)
    SELECT
      a.id,
      l.vital_score,
      l.env_score,
      COALESCE(l.final_index, a.stability_index),
      CASE
        WHEN COALESCE(l.final_index, a.stability_index) >= 85 THEN 'stable'
        WHEN COALESCE(l.final_index, a.stability_index) >= 70 THEN 'warning'
        ELSE 'danger'
      END
    FROM public.assets a
    LEFT JOIN latest l ON l.asset_id = a.id
    WHERE a.is_active = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;

  -- Optional retention: keep only last 30 days
  DELETE FROM public.stability_snapshots
  WHERE snapped_at < now() - interval '30 days';

  RETURN inserted_count;
END;
$$;