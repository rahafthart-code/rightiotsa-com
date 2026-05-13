-- 1. Errors logging table
CREATE TABLE IF NOT EXISTS public.edge_function_errors (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  status_code INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_function_errors_created ON public.edge_function_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_function_errors_function ON public.edge_function_errors(function_name, created_at DESC);

ALTER TABLE public.edge_function_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view edge errors" ON public.edge_function_errors
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Storage policies for asset-images bucket (private, owner-scoped folders by user_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='asset_images_owner_select') THEN
    CREATE POLICY "asset_images_owner_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='asset_images_owner_insert') THEN
    CREATE POLICY "asset_images_owner_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='asset_images_owner_update') THEN
    CREATE POLICY "asset_images_owner_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='asset_images_owner_delete') THEN
    CREATE POLICY "asset_images_owner_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  -- Reports bucket: owner-scoped read/write only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='reports_owner_select') THEN
    CREATE POLICY "reports_owner_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='reports_owner_insert') THEN
    CREATE POLICY "reports_owner_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END
$$;

-- 3. Public verification view: minimal fields only (no PII)
CREATE OR REPLACE VIEW public.public_asset_verify AS
SELECT
  a.id,
  a.name,
  a.species::text AS species,
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
WHERE a.is_active = true;

GRANT SELECT ON public.public_asset_verify TO anon, authenticated;

-- 4. Enable pg_cron + pg_net for scheduled watchdog
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;