import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Loads the owner's stables + per-stable aggregated stats from `stable_stats`.
 * Subscribes to realtime changes on stables and sensor_devices to refresh.
 */
export function useStables(ownerId) {
  const [stables, setStables] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!ownerId) {
      setStables([]);
      setStats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [s, v] = await Promise.all([
      supabase
        .from('stables')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('stable_stats')
        .select('*')
        .eq('owner_id', ownerId),
    ]);
    if (s.error) setError(s.error.message);
    if (v.error) setError(v.error.message);
    setStables(s.data ?? []);
    setStats(v.data ?? []);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    fetchAll();
    if (!ownerId) return undefined;

    const ch = supabase
      .channel(`stables-${ownerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stables', filter: `owner_id=eq.${ownerId}` },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_devices', filter: `owner_id=eq.${ownerId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [ownerId, fetchAll]);

  // Aggregate totals across all stables for a single dashboard summary
  const totals = stats.reduce(
    (acc, r) => {
      acc.total += Number(r.total_assets) || 0;
      acc.stable += Number(r.stable_count) || 0;
      acc.warning += Number(r.warning_count) || 0;
      acc.danger += Number(r.danger_count) || 0;
      acc.online += Number(r.sensors_online) || 0;
      acc.offline += Number(r.sensors_offline) || 0;
      acc.lowBattery += Number(r.low_battery_count) || 0;
      if (r.avg_stability != null) acc.avgSum += Number(r.avg_stability) || 0;
      acc.avgCount += 1;
      return acc;
    },
    { total: 0, stable: 0, warning: 0, danger: 0, online: 0, offline: 0, lowBattery: 0, avgSum: 0, avgCount: 0 }
  );
  const avgStability = totals.avgCount ? Math.round(totals.avgSum / totals.avgCount) : 100;

  return { stables, stats, totals: { ...totals, avgStability }, loading, error, refetch: fetchAll };
}
