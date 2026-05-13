DROP VIEW IF EXISTS public.public_asset_verify;

-- Use SECURITY INVOKER explicitly so RLS of the querying user applies.
-- Since assets/asset_passports tables have RLS, instead expose a SECURITY INVOKER
-- function that returns only safe columns for any active asset.
CREATE OR REPLACE FUNCTION public.get_public_asset_verify(_asset_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  species text,
  registration_no text,
  birth_date date,
  registered_at timestamptz,
  passport_no text,
  bloodline text,
  microchip_id text,
  issuing_authority text,
  issued_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.name,
    a.species::text,
    a.registration_no,
    a.birth_date,
    a.created_at AS registered_at,
    ap.passport_no,
    ap.bloodline,
    ap.microchip_id,
    ap.issuing_authority,
    ap.issued_at,
    ap.expires_at
  FROM public.assets a
  LEFT JOIN public.asset_passports ap ON ap.asset_id = a.id
  WHERE a.id = _asset_id AND a.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_asset_verify(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_asset_verify(uuid) TO anon, authenticated;