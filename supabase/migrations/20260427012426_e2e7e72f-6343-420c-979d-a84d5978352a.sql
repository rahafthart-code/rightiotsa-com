-- Drop the previous restrictive policy that was scoped to 'authenticated' only
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- Recreate it for ALL roles (public) so anonymous users are also blocked
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Also add a restrictive UPDATE/DELETE policy for safety
CREATE POLICY "Only admins can modify roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));