-- Allow admins to insert notifications for any owner (for "Send notification" admin action)
CREATE POLICY "Admins insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));