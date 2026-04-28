-- Wrapper that inserts a sensor reading and returns the values computed by
-- existing triggers (fill_stability_score, sync_asset_stability,
-- create_alert_from_reading). This avoids duplicating logic and stays in sync
-- with compute_stability_v2().
CREATE OR REPLACE FUNCTION public.calculate_stability(
  p_asset_id     uuid,
  p_heart_rate   numeric,
  p_temperature  numeric,
  p_resp_rate    numeric,
  p_activity     numeric,
  p_gps_lat      numeric,
  p_gps_lng      numeric,
  p_env_temp     numeric,
  p_in_zone      boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_device_id uuid;
  v_inserted public.sensor_readings%ROWTYPE;
  v_status text;
BEGIN
  -- Ownership check: only the asset owner, an admin, or the service role may write.
  SELECT owner_id INTO v_owner_id FROM public.assets WHERE id = p_asset_id;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  IF auth.uid() IS NOT NULL
     AND auth.uid() <> v_owner_id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized for this asset';
  END IF;

  -- Find a device for this asset (sensor_readings.device_id is NOT NULL).
  SELECT id INTO v_device_id
  FROM public.devices
  WHERE asset_id = p_asset_id AND is_active = true
  ORDER BY last_seen_at DESC NULLS LAST
  LIMIT 1;

  IF v_device_id IS NULL THEN
    RAISE EXCEPTION 'No active device linked to this asset';
  END IF;

  -- Insert the reading. Triggers compute vital/env/stability/smoothed,
  -- update asset status, and create alerts when thresholds are crossed.
  INSERT INTO public.sensor_readings (
    device_id, asset_id,
    heart_rate, temperature, respiration_rate, activity_score,
    latitude, longitude, gps_lat, gps_lng,
    env_temp, is_in_zone
  ) VALUES (
    v_device_id, p_asset_id,
    p_heart_rate, p_temperature, p_resp_rate, p_activity,
    p_gps_lat, p_gps_lng, p_gps_lat, p_gps_lng,
    p_env_temp, p_in_zone
  )
  RETURNING * INTO v_inserted;

  -- Read back the asset status that sync_asset_stability just set.
  SELECT status INTO v_status FROM public.assets WHERE id = p_asset_id;

  RETURN jsonb_build_object(
    'reading_id',   v_inserted.id,
    'vital_score',  ROUND(v_inserted.vital_score, 2),
    'env_score',    ROUND(v_inserted.env_score, 2),
    'stability',    ROUND(v_inserted.stability_score, 2),
    'smoothed',     ROUND(v_inserted.smoothed_stability, 2),
    'status',       v_status,
    'recorded_at',  v_inserted.recorded_at
  );
END;
$$;

-- Lock down EXECUTE. Service role bypasses RLS and may always call it;
-- authenticated users may call it but the function itself enforces ownership.
REVOKE ALL ON FUNCTION public.calculate_stability(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_stability(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_stability(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, boolean) TO authenticated, service_role;