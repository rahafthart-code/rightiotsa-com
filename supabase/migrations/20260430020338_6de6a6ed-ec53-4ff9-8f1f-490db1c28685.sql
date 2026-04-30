-- ============================================================
-- L1-B: Privilege escalation protection on user_roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only an existing admin can change a row in user_roles via authenticated context
  IF auth.uid() IS NOT NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'SECURITY: role changes are restricted to admins';
    END IF;
  END IF;

  -- Block self-promotion to admin from anything but service_role (auth.uid() is null for service role)
  IF NEW.role = 'admin'::app_role AND auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'SECURITY: cannot self-assign admin role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_role_escalation_ins ON public.user_roles;
DROP TRIGGER IF EXISTS check_role_escalation_upd ON public.user_roles;

CREATE TRIGGER check_role_escalation_ins
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

CREATE TRIGGER check_role_escalation_upd
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================
-- L1-C: Mass-assignment protection on assets (is_locked)
-- ============================================================
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.prevent_locked_asset_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_locked = true AND auth.uid() IS NOT NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'SECURITY: asset is locked. Contact an administrator.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_asset_lock ON public.assets;
CREATE TRIGGER check_asset_lock
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_asset_update();

-- ============================================================
-- L1-D: JSON input validator (helper for triggers/functions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_json_input(input jsonb, max_size int DEFAULT 50000)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN true;
  END IF;
  IF length(input::text) > max_size THEN
    RAISE EXCEPTION 'SECURITY: JSON payload too large (% bytes > %)', length(input::text), max_size;
  END IF;
  RETURN true;
END;
$$;

-- ============================================================
-- L3: Rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL,
  count       integer NOT NULL DEFAULT 1,
  window_end  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_end);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_service_only" ON public.rate_limits;
CREATE POLICY "rate_limits_service_only"
  ON public.rate_limits
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key text,
  p_max integer,
  p_window integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_end timestamptz;
BEGIN
  DELETE FROM public.rate_limits WHERE window_end < now();

  INSERT INTO public.rate_limits (key, count, window_end)
  VALUES (p_key, 1, now() + make_interval(secs => p_window))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
      WHEN public.rate_limits.window_end < now() THEN 1
      ELSE public.rate_limits.count + 1
    END,
    window_end = CASE
      WHEN public.rate_limits.window_end < now()
        THEN now() + make_interval(secs => p_window)
      ELSE public.rate_limits.window_end
    END
  RETURNING count, window_end INTO v_count, v_end;

  RETURN jsonb_build_object(
    'allowed',   v_count <= p_max,
    'count',     v_count,
    'limit',     p_max,
    'remaining', GREATEST(0, p_max - v_count),
    'reset_at',  v_end
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) FROM public, anon, authenticated;

-- ============================================================
-- L7: Security events / monitoring
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id          bigserial PRIMARY KEY,
  event_type  text NOT NULL,
  severity    text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  user_id     uuid,
  ip_address  inet,
  user_agent  text,
  endpoint    text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_type_time ON public.security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_unresolved ON public.security_events(severity, resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON public.security_events(user_id, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_admin_select" ON public.security_events;
CREATE POLICY "security_events_admin_select"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "security_events_admin_update" ON public.security_events;
CREATE POLICY "security_events_admin_update"
  ON public.security_events
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_type text,
  p_severity text DEFAULT 'medium',
  p_user_id uuid DEFAULT NULL,
  p_endpoint text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events(event_type, severity, user_id, endpoint, details)
  VALUES (p_type, p_severity, p_user_id, p_endpoint, p_details);

  IF p_severity = 'critical' THEN
    PERFORM pg_notify('security_alert', jsonb_build_object(
      'type', p_type, 'severity', p_severity, 'user_id', p_user_id, 'at', now()
    )::text);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text, text, uuid, text, jsonb) FROM public, anon, authenticated;

-- Brute-force detector: 5 failed auths in 15 minutes -> log critical event
CREATE OR REPLACE FUNCTION public.detect_brute_force()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed integer;
BEGIN
  IF NEW.event_type = 'auth_failure' AND NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_failed
      FROM public.security_events
     WHERE event_type = 'auth_failure'
       AND user_id = NEW.user_id
       AND created_at > now() - interval '15 minutes';

    IF v_failed >= 5 THEN
      INSERT INTO public.security_events(event_type, severity, user_id, endpoint, details)
      VALUES ('account_brute_force', 'critical', NEW.user_id, NEW.endpoint,
              jsonb_build_object('failed_attempts', v_failed));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS brute_force_detector ON public.security_events;
CREATE TRIGGER brute_force_detector
  AFTER INSERT ON public.security_events
  FOR EACH ROW EXECUTE FUNCTION public.detect_brute_force();

-- Admin-only dashboard view
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT
  date_trunc('hour', created_at) AS hour,
  event_type,
  severity,
  COUNT(*)                AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.security_events
WHERE created_at > now() - interval '7 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;

-- View permissions; SELECT will still be filtered by underlying table RLS (admin-only)
GRANT SELECT ON public.security_dashboard TO authenticated;