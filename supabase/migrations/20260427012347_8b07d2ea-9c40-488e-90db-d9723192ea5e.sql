-- ============================================
-- FIX 1: Privilege escalation in user_roles
-- ============================================
-- Add explicit restrictive policy: only admins can insert roles
-- (The existing "Admins manage roles" ALL policy + this restrictive
-- INSERT policy together ensure non-admins cannot insert any role)

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX 2: Realtime channel authorization
-- ============================================
-- Enable RLS on realtime.messages (if not already)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Helper: check if a user is allowed to subscribe to a topic
-- Topic conventions:
--   user:<user_id>        -> own user channel (notifications)
--   asset:<asset_id>      -> asset channel (sensor_readings, asset updates)
--   ceo                   -> CEO global channel
CREATE OR REPLACE FUNCTION public.can_access_realtime_topic(_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_kind text;
  v_id text;
  v_asset_owner uuid;
BEGIN
  IF v_uid IS NULL OR _topic IS NULL THEN
    RETURN false;
  END IF;

  -- Admin and CEO can subscribe to anything
  IF public.has_role(v_uid, 'admin'::app_role) OR public.has_role(v_uid, 'ceo'::app_role) THEN
    RETURN true;
  END IF;

  -- Parse topic of form "kind:id"
  v_kind := split_part(_topic, ':', 1);
  v_id := split_part(_topic, ':', 2);

  IF v_kind = 'user' THEN
    RETURN v_id = v_uid::text;
  ELSIF v_kind = 'asset' THEN
    SELECT owner_id INTO v_asset_owner FROM public.assets WHERE id::text = v_id;
    RETURN v_asset_owner = v_uid;
  ELSIF v_kind = 'ceo' THEN
    RETURN false; -- only CEO/admin handled above
  END IF;

  RETURN false;
END;
$$;

-- Policy: authenticated users can only subscribe to authorized topics
CREATE POLICY "Authenticated users can read authorized realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (public.can_access_realtime_topic(realtime.topic()));

-- Policy: authenticated users can only send to authorized topics (for presence/broadcast)
CREATE POLICY "Authenticated users can write to authorized realtime topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_realtime_topic(realtime.topic()));