INSERT INTO storage.buckets (id, name, public) VALUES ('asset-images', 'asset-images', true);

CREATE POLICY "Asset images publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'asset-images');

CREATE POLICY "Owners upload own asset images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners update own asset images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners delete own asset images"
ON storage.objects FOR DELETE
USING (bucket_id = 'asset-images' AND auth.uid()::text = (storage.foldername(name))[1]);