
-- ============ 1. SUBSCRIPTION LIMITS ============
UPDATE public.subscriptions SET
  max_assets  = CASE plan WHEN 'starter' THEN 5 WHEN 'pro' THEN 20 WHEN 'business' THEN 50 WHEN 'enterprise' THEN 999 ELSE COALESCE(max_assets, 5) END,
  max_devices = CASE plan WHEN 'starter' THEN 5 WHEN 'pro' THEN 20 WHEN 'business' THEN 50 WHEN 'enterprise' THEN 999 ELSE COALESCE(max_devices, 5) END,
  max_stables = CASE plan WHEN 'starter' THEN 1 WHEN 'pro' THEN 5 WHEN 'business' THEN 20 WHEN 'enterprise' THEN 99 ELSE COALESCE(max_stables, 1) END;

CREATE OR REPLACE FUNCTION public.check_asset_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max int; v_curr int;
BEGIN
  SELECT max_assets INTO v_max FROM public.subscriptions
    WHERE owner_id = NEW.owner_id AND status IN ('active','trial')
    ORDER BY created_at DESC LIMIT 1;
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION' USING HINT = 'يجب الاشتراك في خطة نشطة لإضافة أصول';
  END IF;
  SELECT COUNT(*) INTO v_curr FROM public.assets
    WHERE owner_id = NEW.owner_id AND is_active = true;
  IF v_curr >= v_max THEN
    RAISE EXCEPTION 'ASSET_LIMIT_REACHED' USING HINT = 'لقد وصلت للحد الأقصى من الأصول في باقتك',
      DETAIL = 'max=' || v_max || ', current=' || v_curr;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_asset_limit ON public.assets;
CREATE TRIGGER enforce_asset_limit
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.check_asset_limit();

CREATE OR REPLACE FUNCTION public.check_stable_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max int; v_curr int;
BEGIN
  SELECT max_stables INTO v_max FROM public.subscriptions
    WHERE owner_id = NEW.owner_id AND status IN ('active','trial')
    ORDER BY created_at DESC LIMIT 1;
  SELECT COUNT(*) INTO v_curr FROM public.stables
    WHERE owner_id = NEW.owner_id AND is_active = true;
  IF COALESCE(v_max, 0) > 0 AND v_curr >= v_max THEN
    RAISE EXCEPTION 'STABLE_LIMIT_REACHED' USING HINT = 'وصلت للحد الأقصى من العزب في باقتك';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_stable_limit ON public.stables;
CREATE TRIGGER enforce_stable_limit
  BEFORE INSERT ON public.stables
  FOR EACH ROW EXECUTE FUNCTION public.check_stable_limit();

CREATE OR REPLACE VIEW public.subscription_usage
WITH (security_invoker = on) AS
SELECT
  s.owner_id, s.plan, s.status,
  s.max_assets, s.max_devices, s.max_stables,
  (SELECT COUNT(*) FROM public.assets   WHERE owner_id = s.owner_id AND is_active = true)::int AS used_assets,
  (SELECT COUNT(*) FROM public.sensor_devices WHERE owner_id = s.owner_id)::int                AS used_devices,
  (SELECT COUNT(*) FROM public.stables  WHERE owner_id = s.owner_id AND is_active = true)::int AS used_stables,
  s.current_period_end
FROM public.subscriptions s;

-- ============ 2. SYSTEM HEALTH LOG ============
CREATE TABLE IF NOT EXISTS public.system_health_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type      text NOT NULL,
  devices_offline integer DEFAULT 0,
  low_battery     integer DEFAULT 0,
  error_count     integer DEFAULT 0,
  details         jsonb DEFAULT '{}'::jsonb,
  checked_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_log_time ON public.system_health_log(checked_at DESC);
ALTER TABLE public.system_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view health log" ON public.system_health_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ 3. ERROR LOG + BURST DETECTION ============
CREATE TABLE IF NOT EXISTS public.error_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL,
  error_code  text,
  error_msg   text,
  owner_id    uuid,
  asset_id    uuid,
  device_id   text,
  payload     jsonb,
  resolved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_err_time   ON public.error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_err_source ON public.error_log(source, created_at DESC);
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view errors" ON public.error_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update errors" ON public.error_log
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.detect_error_burst()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_since timestamptz := now() - interval '15 minutes';
  v_bursts jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(b)) INTO v_bursts
  FROM (
    SELECT source, COUNT(*) AS error_count, MAX(created_at) AS last_error
    FROM public.error_log
    WHERE created_at >= v_since AND resolved = false
    GROUP BY source HAVING COUNT(*) >= 5
  ) b;
  IF v_bursts IS NOT NULL THEN
    INSERT INTO public.system_health_log (check_type, error_count, details)
    VALUES ('error_burst', jsonb_array_length(v_bursts), v_bursts);
  END IF;
  RETURN jsonb_build_object(
    'bursts_found', COALESCE(jsonb_array_length(v_bursts), 0),
    'details', v_bursts
  );
END $$;

-- ============ 4. PAYMENTS LOG ============
CREATE TABLE IF NOT EXISTS public.payments_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL,
  payment_id  text UNIQUE NOT NULL,
  amount_sar  numeric(10,2),
  plan        text,
  status      text DEFAULT 'paid',
  gateway     text DEFAULT 'clickpay',
  raw_payload jsonb,
  paid_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_log_owner ON public.payments_log(owner_id, paid_at DESC);
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own payments log" ON public.payments_log
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
