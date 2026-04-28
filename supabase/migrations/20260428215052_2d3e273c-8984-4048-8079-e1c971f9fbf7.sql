-- Make reports bucket private (signed URLs only)
UPDATE storage.buckets SET public = false WHERE id = 'reports';

-- Fix sensor_readings RLS to also recognize sensor_devices linkage and asset ownership
DROP POLICY IF EXISTS "Owners view their readings" ON public.sensor_readings;

CREATE POLICY "Owners view their readings"
ON public.sensor_readings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.devices d
    WHERE d.id = sensor_readings.device_id
      AND (d.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ceo'::app_role))
  )
  OR EXISTS (
    SELECT 1 FROM public.assets a
    WHERE a.id = sensor_readings.asset_id
      AND (a.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ceo'::app_role))
  )
);