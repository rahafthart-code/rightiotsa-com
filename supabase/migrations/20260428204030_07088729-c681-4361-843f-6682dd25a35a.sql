-- 1. Reports bucket (public-read for shareable PDF links; writes are still gated by RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable scheduling extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. RLS policies on storage.objects for the 'reports' bucket
--    Path convention: <owner_id>/<stable_id>/<filename>
--      foldername(name)[1] = owner_id
--      foldername(name)[2] = stable_id

-- Owners can READ their own reports
DROP POLICY IF EXISTS reports_owner_select ON storage.objects;
CREATE POLICY reports_owner_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.stables WHERE owner_id = auth.uid()
  )
);

-- Owners can UPLOAD reports into their own folders
DROP POLICY IF EXISTS reports_owner_insert ON storage.objects;
CREATE POLICY reports_owner_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.stables WHERE owner_id = auth.uid()
  )
);

-- Owners can DELETE their own reports
DROP POLICY IF EXISTS reports_owner_delete ON storage.objects;
CREATE POLICY reports_owner_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read every report
DROP POLICY IF EXISTS reports_admin_select ON storage.objects;
CREATE POLICY reports_admin_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);