DROP VIEW IF EXISTS public.devices_safe;

CREATE VIEW public.devices_safe
WITH (security_invoker = on) AS
SELECT
  id,
  owner_id,
  asset_id,
  device_serial,
  is_active,
  last_seen_at,
  network_type,
  signal_strength,
  battery_level,
  created_at,
  updated_at
FROM public.devices;

GRANT SELECT ON public.devices_safe TO authenticated;

DROP POLICY IF EXISTS "Owners manage own devices" ON public.devices;
DROP POLICY IF EXISTS "Owners insert own devices" ON public.devices;
DROP POLICY IF EXISTS "Owners update own devices" ON public.devices;
DROP POLICY IF EXISTS "Owners delete own devices" ON public.devices;
DROP POLICY IF EXISTS "Admins read devices base table" ON public.devices;

CREATE POLICY "Owners insert own devices"
  ON public.devices FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners update own devices"
  ON public.devices FOR UPDATE TO authenticated
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners delete own devices"
  ON public.devices FOR DELETE TO authenticated
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read devices base table"
  ON public.devices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));