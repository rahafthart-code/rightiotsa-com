-- Remove CEO direct access to devices table (exposes api_key_hash)
DROP POLICY IF EXISTS "CEO views all devices" ON public.devices;

-- Create a safe view excluding api_key_hash for CEO/admin dashboards
CREATE OR REPLACE VIEW public.devices_safe
WITH (security_invoker = true) AS
SELECT
  id,
  owner_id,
  asset_id,
  device_serial,
  battery_level,
  signal_strength,
  network_type,
  is_active,
  last_seen_at,
  created_at,
  updated_at
FROM public.devices
WHERE
  auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'ceo'::app_role);

GRANT SELECT ON public.devices_safe TO authenticated;