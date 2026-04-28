import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Stables hook with selection state + per-stable stats lookup.
 *
 * Returns:
 *   stables          — owner's active stables
 *   stableStats      — { [stable_id]: row from stable_stats }
 *   selectedStable   — 'all' | <stable_id>
 *   setSelected      — (id) => void
 *   createStable(p)  — inserts to stables, auto-selects new tab
 *   stableFilter     — {} when 'all', { stable_id } when specific (pass to useAssets)
 *   currentStats     — stableStats[selectedStable] or null when 'all'
 *   loading
 */
export function useStables(ownerId) {
  const [stables, setStables] = useState([]);
  const [stableStats, setStats] = useState({});
  const [selectedStable, setSelected] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!ownerId) {
      setStables([]);
      setStats({});
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
    setStables(s.data ?? []);
    const map = {};
    (v.data ?? []).forEach((r) => { map[r.stable_id] = r; });
    setStats(map);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    fetchAll();
    if (!ownerId) return undefined;

    // Realtime: refresh on stables/sensor_devices changes (stats are derived)
    const ch = supabase
      .channel(`stables-hook-${ownerId}`)
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

    return () => { supabase.removeChannel(ch); };
  }, [ownerId, fetchAll]);

  // Reset selection if the selected stable disappears
  useEffect(() => {
    if (selectedStable === 'all') return;
    if (!stables.find((s) => s.id === selectedStable)) setSelected('all');
  }, [stables, selectedStable]);

  const createStable = useCallback(async (payload) => {
    if (!ownerId) throw new Error('No owner');
    const { data, error } = await supabase
      .from('stables')
      .insert({ ...payload, owner_id: ownerId })
      .select()
      .single();
    if (error) throw error;
    setStables((prev) => [...prev, data]);
    setSelected(data.id); // auto-select new stable
    // Stats row will arrive via realtime refetch
    return data;
  }, [ownerId]);

  // Filter object to forward to useAssets
  const stableFilter = useMemo(
    () => (selectedStable === 'all' ? {} : { stable_id: selectedStable }),
    [selectedStable]
  );

  const currentStats = selectedStable !== 'all' ? stableStats[selectedStable] || null : null;

  // Aggregate across stables, used when selectedStable === 'all'
  const totals = useMemo(() => {
    const rows = Object.values(stableStats);
    return rows.reduce(
      (acc, r) => {
        acc.total_assets += Number(r.total_assets) || 0;
        acc.stable_count += Number(r.stable_count) || 0;
        acc.warning_count += Number(r.warning_count) || 0;
        acc.danger_count += Number(r.danger_count) || 0;
        acc.sensors_online += Number(r.sensors_online) || 0;
        acc.sensors_offline += Number(r.sensors_offline) || 0;
        acc.low_battery_count += Number(r.low_battery_count) || 0;
        if (r.avg_stability != null) {
          acc._avgSum += Number(r.avg_stability) || 0;
          acc._avgN += 1;
        }
        return acc;
      },
      {
        total_assets: 0, stable_count: 0, warning_count: 0, danger_count: 0,
        sensors_online: 0, sensors_offline: 0, low_battery_count: 0,
        _avgSum: 0, _avgN: 0,
      }
    );
  }, [stableStats]);
  totals.avg_stability = totals._avgN ? Math.round(totals._avgSum / totals._avgN) : 100;

  return {
    stables,
    stableStats,
    selectedStable,
    setSelected,
    createStable,
    stableFilter,
    currentStats,
    totals,
    loading,
    refetch: fetchAll,
  };
}
