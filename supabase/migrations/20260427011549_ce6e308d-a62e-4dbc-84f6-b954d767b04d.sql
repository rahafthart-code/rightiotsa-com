-- 1) Notification type enum (use text + CHECK as per spec for flexibility)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN (
    'danger_alert',
    'warning_alert',
    're_engagement',
    'daily_update',
    'claim_update',
    'zone_breach',
    'system'
  )),
  title text NOT NULL,
  body text,
  photo_url text,
  metadata jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notif_owner_unread
  ON public.notifications(owner_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_asset
  ON public.notifications(asset_id, created_at DESC);

-- 2) RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Owners view their own notifications; admins/CEO view all
CREATE POLICY "Owners view their notifications"
  ON public.notifications
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ceo'::app_role)
  );

-- Owners can mark their own notifications as read
CREATE POLICY "Owners update their notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own notifications
CREATE POLICY "Owners delete their notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Note: No INSERT policy for end-users. Notifications are created by SECURITY DEFINER
-- functions/triggers (system-generated) or via edge functions using service role.

-- 3) Trigger that auto-creates notifications on new sensor readings
CREATE OR REPLACE FUNCTION public.create_alert_from_reading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_asset_name text;
  v_recent_count int;
  v_score numeric;
  v_alert_type text;
  v_title text;
  v_body text;
BEGIN
  IF NEW.asset_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT owner_id, name INTO v_owner_id, v_asset_name
  FROM public.assets WHERE id = NEW.asset_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_score := COALESCE(NEW.smoothed_stability, NEW.stability_score);

  -- ===== Stability alerts =====
  IF v_score IS NOT NULL THEN
    IF v_score < 70 THEN
      v_alert_type := CASE WHEN v_score < 50 THEN 'danger_alert' ELSE 'warning_alert' END;

      -- Throttle: skip if same alert type for same asset within last 30 min
      SELECT COUNT(*) INTO v_recent_count
      FROM public.notifications
      WHERE asset_id = NEW.asset_id
        AND type = v_alert_type
        AND created_at > now() - interval '30 minutes';

      IF v_recent_count = 0 THEN
        v_title := CASE
          WHEN v_alert_type = 'danger_alert' THEN '🚨 تنبيه خطر: ' || v_asset_name
          ELSE '⚠️ تحذير: ' || v_asset_name
        END;
        v_body := 'انخفض مؤشر الاستقرار إلى ' || ROUND(v_score)::text || '%';

        INSERT INTO public.notifications(owner_id, asset_id, type, title, body, metadata)
        VALUES (
          v_owner_id, NEW.asset_id, v_alert_type, v_title, v_body,
          jsonb_build_object(
            'stability_index', v_score,
            'asset_name', v_asset_name,
            'reading_id', NEW.id
          )
        );
      END IF;
    END IF;
  END IF;

  -- ===== Zone breach alert =====
  IF NEW.is_in_zone IS FALSE THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.notifications
    WHERE asset_id = NEW.asset_id
      AND type = 'zone_breach'
      AND created_at > now() - interval '30 minutes';

    IF v_recent_count = 0 THEN
      INSERT INTO public.notifications(owner_id, asset_id, type, title, body, metadata)
      VALUES (
        v_owner_id, NEW.asset_id, 'zone_breach',
        '📍 خروج من النطاق: ' || v_asset_name,
        v_asset_name || ' غادر النطاق الجغرافي المحدد',
        jsonb_build_object(
          'asset_name', v_asset_name,
          'lat', NEW.latitude,
          'lng', NEW.longitude
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_alert_from_reading_trigger ON public.sensor_readings;
CREATE TRIGGER create_alert_from_reading_trigger
  AFTER INSERT ON public.sensor_readings
  FOR EACH ROW EXECUTE FUNCTION public.create_alert_from_reading();

-- 4) Mark-as-read helper (sets read_at automatically)
CREATE OR REPLACE FUNCTION public.touch_notification_read()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_notification_read_trigger ON public.notifications;
CREATE TRIGGER touch_notification_read_trigger
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_notification_read();

-- 5) Enable Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;