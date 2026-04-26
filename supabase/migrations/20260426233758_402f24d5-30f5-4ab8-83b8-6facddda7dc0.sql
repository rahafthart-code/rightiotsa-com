DROP POLICY IF EXISTS "Asset images publicly viewable" ON storage.objects;

-- Allow public access only to direct file paths (not listing)
-- Owners can still list their own files
CREATE POLICY "Owners list own asset images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'asset-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);