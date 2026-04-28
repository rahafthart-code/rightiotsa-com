import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Live owner asset list with portfolio metrics.
 * - Subscribes to UPDATE/INSERT/DELETE on assets filtered by owner_id
 * - Reflects stability_index/status in real time
 * - Dispatches a global `asset-danger` CustomEvent when an asset transitions to 'danger'
 */
export function useAssets(ownerId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    if (!ownerId) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('assets')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('status')           // danger first (alphabetical: danger < stable < warning isn't perfect; see sort below)
      .order('stability_index'); // lowest stability first
    if (err) setError(err.message);
    else setAssets(data ?? []);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    fetchAssets();
    if (!ownerId) return undefined;

    const channel = supabase
      .channel(`assets-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          setAssets((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...prev.filter((a) => a.id !== payload.new.id)];
            }
            if (payload.eventType === 'UPDATE') {
              const prevAsset = prev.find((a) => a.id === payload.new.id);
              // Fire danger event only on transition into 'danger'
              if (
                payload.new.status === 'danger' &&
                prevAsset?.status !== 'danger'
              ) {
                window.dispatchEvent(
                  new CustomEvent('asset-danger', { detail: payload.new })
                );
              }
              return prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a
              );
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((a) => a.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, fetchAssets]);

  // Sort: danger → warning → stable, then by stability_index ascending
  const sortedAssets = useMemo(() => {
    const rank = { danger: 0, warning: 1, stable: 2, offline: 3 };
    return [...assets].sort((a, b) => {
      const ra = rank[a.status] ?? 99;
      const rb = rank[b.status] ?? 99;
      if (ra !== rb) return ra - rb;
      return (Number(a.stability_index) || 0) - (Number(b.stability_index) || 0);
    });
  }, [assets]);

  // Portfolio metrics
  const portfolioIndex = assets.length
    ? Math.round(
        assets.reduce((s, a) => s + (Number(a.stability_index) || 0), 0) /
          assets.length
      )
    : 0;
  const dangerCount = assets.filter((a) => a.status === 'danger').length;
  const warningCount = assets.filter((a) => a.status === 'warning').length;
  const stableCount = assets.filter((a) => a.status === 'stable').length;

  return {
    assets: sortedAssets,
    loading,
    error,
    portfolioIndex,
    dangerCount,
    warningCount,
    stableCount,
    refetch: fetchAssets,
  };
}
