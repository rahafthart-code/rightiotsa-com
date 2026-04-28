-- ============================================
-- TABLE: subscriptions
-- ============================================
CREATE TABLE public.subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid NOT NULL UNIQUE,  -- auth user id (matches assets.owner_id convention)
  plan                  text NOT NULL DEFAULT 'starter'
                          CHECK (plan IN ('starter','pro','enterprise')),
  max_assets            integer NOT NULL DEFAULT 5,
  max_devices           integer NOT NULL DEFAULT 5,
  max_stables           integer NOT NULL DEFAULT 1,
  price_sar             numeric(8,2),
  billing_cycle         text NOT NULL DEFAULT 'monthly'
                          CHECK (billing_cycle IN ('monthly','annual')),
  status                text NOT NULL DEFAULT 'trial'
                          CHECK (status IN ('trial','active','suspended','cancelled')),
  trial_ends_at         timestamptz,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_owner  ON public.subscriptions(owner_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners read their own subscription
CREATE POLICY "Owners view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Admins manage everything
CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger (reuses existing function)
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Auto-create trial subscription on signup
-- (extends existing handle_new_user)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, national_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'national_id'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  INSERT INTO public.subscriptions (owner_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'starter', 'trial', now() + interval '14 days');
  RETURN NEW;
END;
$$;

-- Backfill: create a trial subscription for any existing owner who doesn't have one
INSERT INTO public.subscriptions (owner_id, plan, status, trial_ends_at)
SELECT ur.user_id, 'starter', 'trial', now() + interval '14 days'
FROM public.user_roles ur
WHERE ur.role = 'owner'::app_role
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.owner_id = ur.user_id);

-- ============================================
-- VIEW: admin_dashboard
-- security_invoker=true → underlying RLS applies, so only admins (who can SELECT
-- all profiles/assets/etc via has_role) see the full dataset.
-- ============================================
CREATE OR REPLACE VIEW public.admin_dashboard
WITH (security_invoker = true) AS
SELECT
  p.user_id                                    AS owner_id,
  p.full_name,
  p.phone,
  p.created_at                                 AS joined_at,
  p.last_seen_at,
  s.plan,
  s.status                                     AS sub_status,
  s.trial_ends_at,
  s.price_sar,
  COUNT(DISTINCT st.id)                        AS stables_count,
  COUNT(DISTINCT a.id)                         AS assets_count,
  COUNT(DISTINCT sd.id)                        AS devices_count,
  COUNT(DISTINCT sd.id) FILTER (WHERE sd.status = 'online') AS devices_online,
  ROUND(AVG(a.stability_index), 1)             AS avg_stability
FROM public.profiles p
LEFT JOIN public.subscriptions  s  ON s.owner_id  = p.user_id
LEFT JOIN public.stables        st ON st.owner_id = p.user_id
LEFT JOIN public.assets         a  ON a.owner_id  = p.user_id AND a.is_active = true
LEFT JOIN public.sensor_devices sd ON sd.owner_id = p.user_id
WHERE NOT public.has_role(p.user_id, 'admin'::app_role)
GROUP BY p.user_id, p.full_name, p.phone, p.created_at, p.last_seen_at,
         s.plan, s.status, s.trial_ends_at, s.price_sar;