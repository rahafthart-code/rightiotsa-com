
-- ==========================================
-- 1. Health Score column on assets
-- ==========================================
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS health_score numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS movement_index numeric DEFAULT 50;

-- ==========================================
-- 2. Health-score computation: combines vital + movement
--    movement_index is derived from activity_score (recent avg)
--    final health_score = 0.6 * vital + 0.4 * movement_normalized
-- ==========================================
CREATE OR REPLACE FUNCTION public.compute_health_score(p_asset_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_vital numeric;
  v_movement numeric;
  v_activity_avg numeric;
  v_score numeric;
BEGIN
  -- Average vital score over last 10 readings
  SELECT AVG(vital_score), AVG(activity_score)
    INTO v_vital, v_activity_avg
  FROM (
    SELECT vital_score, activity_score
    FROM public.sensor_readings
    WHERE asset_id = p_asset_id AND vital_score IS NOT NULL
    ORDER BY recorded_at DESC LIMIT 10
  ) recent;

  IF v_vital IS NULL THEN
    v_vital := 90;
  END IF;

  -- Movement index: 60 is ideal, both lethargy and hyperactivity reduce score
  IF v_activity_avg IS NULL THEN
    v_movement := 70;
  ELSE
    v_movement := GREATEST(40, 100 - GREATEST(0, ABS(v_activity_avg - 60) - 15) * 2);
  END IF;

  v_score := ROUND(v_vital * 0.6 + v_movement * 0.4, 2);
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- Trigger: recompute health_score after each reading
CREATE OR REPLACE FUNCTION public.sync_asset_health_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_health numeric;
BEGIN
  IF NEW.asset_id IS NULL THEN RETURN NEW; END IF;
  v_health := public.compute_health_score(NEW.asset_id);
  UPDATE public.assets
    SET health_score = v_health,
        movement_index = COALESCE(NEW.activity_score, movement_index),
        updated_at = now()
    WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_asset_health_score ON public.sensor_readings;
CREATE TRIGGER trg_sync_asset_health_score
  AFTER INSERT ON public.sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_asset_health_score();

-- ==========================================
-- 3. Payments table for ClickPay
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'clickpay',
  provider_tran_ref text UNIQUE,
  cart_id text NOT NULL,
  plan text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'pending',
  payment_url text,
  webhook_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_cart ON public.payments(cart_id);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 4. IoT webhook events log (audit + replay protection)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.iot_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'volt',
  device_serial text,
  asset_id uuid,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  ip_address inet,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.iot_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook events"
  ON public.iot_webhook_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON public.iot_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_device ON public.iot_webhook_events(device_serial);

-- ==========================================
-- 5. Role-escalation trigger (L1 hardening) — ensure attached
-- ==========================================
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_roles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- Brute-force detection trigger on security_events
DROP TRIGGER IF EXISTS trg_detect_brute_force ON public.security_events;
CREATE TRIGGER trg_detect_brute_force
  AFTER INSERT ON public.security_events
  FOR EACH ROW EXECUTE FUNCTION public.detect_brute_force();
