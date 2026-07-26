import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const LOW_BATTERY_PCT = 20; // matches DevicesPage.jsx / DeviceHealthBox.jsx / device-watchdog
const RESPONSE_WINDOW_MS = 30 * 60 * 1000; // matches device-watchdog's offline threshold

// Groups edge_function_errors rows (last 24h) by function_name into a
// small breakdown list, most-erroring function first.
function summarizeEdgeFunctionErrors(rows) {
  const counts = new Map();
  for (const r of rows ?? []) {
    counts.set(r.function_name, (counts.get(r.function_name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([function_name, count]) => ({ function_name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * useSystemHealth — data + realtime-connectivity self-check for the admin
 * /admin/system page. Polls every 30s and re-fetches on sensor_devices
 * changes; also tracks whether the admin's own Realtime subscription is
 * actually connected (a live proxy for "is Realtime up").
 */
export function useSystemHealth() {
  const [stats, setStats] = useState({
    devicesOnline: 0,
    devicesOffline: 0,
    devicesLowBattery: 0,
    devicesTotal: 0,
    devicesResponding: 0,
    responseRatePct: 0,
    activeUsers24h: 0,
    notificationsToday: 0,
    criticalErrorsHour: 0,
    paymentsToday: 0,
    edgeFunctionErrors: [],
  });
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  const refresh = useCallback(async () => {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const responseWindowAgo = new Date(Date.now() - RESPONSE_WINDOW_MS).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      devTotal, devOnline, devOffline, devLowBattery, devResponding,
      activeUsers, notifs, errs, sysErrs, edgeErrRows, payments,
    ] = await Promise.all([
      supabase.from('sensor_devices').select('id', { count: 'exact', head: true }),
      supabase.from('sensor_devices').select('id', { count: 'exact', head: true }).eq('status', 'online'),
      supabase.from('sensor_devices').select('id', { count: 'exact', head: true }).eq('status', 'offline'),
      supabase.from('sensor_devices').select('id', { count: 'exact', head: true }).lt('battery_pct', LOW_BATTERY_PCT),
      supabase.from('sensor_devices').select('id', { count: 'exact', head: true }).gte('last_seen_at', responseWindowAgo),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }).gte('last_seen_at', dayAgo),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('edge_function_errors').select('id', { count: 'exact', head: true }).gte('created_at', hourAgo),
      supabase.from('error_log').select('id', { count: 'exact', head: true }).eq('resolved', false).gte('created_at', hourAgo),
      supabase.from('edge_function_errors').select('function_name').gte('created_at', dayAgo),
      // payments (not payments_log — that table belonged to the retired
      // ClickPay/Edfapay webhook and is never written to anymore).
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid').gte('updated_at', startOfDay.toISOString()),
    ]);

    const devicesTotal = devTotal.count ?? 0;
    const devicesResponding = devResponding.count ?? 0;

    setStats({
      devicesTotal,
      devicesOnline: devOnline.count ?? 0,
      devicesOffline: devOffline.count ?? 0,
      devicesLowBattery: devLowBattery.count ?? 0,
      devicesResponding,
      responseRatePct: devicesTotal > 0 ? Math.round((devicesResponding / devicesTotal) * 100) : 0,
      activeUsers24h: activeUsers.count ?? 0,
      notificationsToday: notifs.count ?? 0,
      criticalErrorsHour: (errs.count ?? 0) + (sysErrs.count ?? 0),
      paymentsToday: payments.count ?? 0,
      edgeFunctionErrors: summarizeEdgeFunctionErrors(edgeErrRows.data),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    const ch = supabase
      .channel('admin-system-health')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_devices' }, refresh)
      .subscribe((status) => {
        // SUBSCRIBED | TIMED_OUT | CLOSED | CHANNEL_ERROR
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CLOSED' ? 'closed' : 'error');
      });
    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  return { stats, loading, realtimeStatus, refresh };
}
