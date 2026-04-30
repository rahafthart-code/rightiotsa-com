DROP VIEW IF EXISTS public.security_dashboard;

CREATE VIEW public.security_dashboard
WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.security_dashboard TO authenticated;