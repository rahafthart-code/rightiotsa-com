
-- 1) Restrict profiles SELECT: remove CEO access to sensitive PII
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Provide a safe view for CEO/admin dashboards (no national_id / phone)
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  daily_digest_enabled,
  last_seen_at,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;

-- 2) Make asset-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'asset-images';

-- Ensure authenticated owners (and admins) can read their own asset images
DROP POLICY IF EXISTS "asset_images_authenticated_select" ON storage.objects;
CREATE POLICY "asset_images_authenticated_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'asset-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ceo'::app_role)
  )
);

-- 3) Add UPDATE policy on the reports bucket scoped to owner folder
DROP POLICY IF EXISTS "reports_owner_update" ON storage.objects;
CREATE POLICY "reports_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
