import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Live owner asset list with portfolio metrics + embedded latest sensor reading.
 *
 * - Initial fetch joins the most recent `sensor_readings` row per asset.
 * - Realtime subscription on assets (filtered by owner) keeps cards fresh.
 * - On any UPDATE, exposes `flashId` for ~400ms so the card can flash.
 * - On asset transitioning to status='danger', dispatches `asset-danger` event.
 */
export function useAssets(ownerId, filter = {}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashId, setFlashId] = useState(null);

  // Stable serialization of filter so identity-changing parents don't refetch
  const filterKey = useMemo(() => JSON.stringify(filter || {}), [filter]);

  const fetchAssets = useCallback(async () => {
    if (!ownerId) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let q = supabase
      .from('assets')
      .select(`
        *,
        sensor_readings (
          heart_rate, temperature, respiration_rate,
          is_in_zone, latitude, longitude, recorded_at
        )
      `)
      .eq('owner_id', ownerId)
      .eq('is_active', true);

    // Apply caller-provided equality filters (e.g. { stable_id: '...' })
    const parsed = JSON.parse(filterKey);
    Object.entries(parsed).forEach(([col, val]) => {
      if (val === null) q = q.is(col, null);
      else q = q.eq(col, val);
    });

    const { data, error: err } = await q
      .order('created_at', { ascending: false })
      .order('recorded_at', { foreignTable: 'sensor_readings', ascending: false })
      .limit(1, { foreignTable: 'sensor_readings' });

    if (err) {
      setError(err.message);
    } else {
      setAssets(
        (data ?? []).map((a) => ({
          ...a,
          latest_reading: a.sensor_readings?.[0] ?? null,
        }))
      );
    }
    setLoading(false);
  }, [ownerId, filterKey]);

  useEffect(() => {
    fetchAssets();
    if (!ownerId) return undefined;

    const channel = supabase
      .channel(`assets-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
        },
        (payload) => {
          const r = payload.new;
          if (!r?.asset_id) return;
          setAssets((prev) => {
            // Only update if this asset belongs to the current owner's list
            if (!prev.some((a) => a.id === r.asset_id)) return prev;
            return prev.map((a) =>
              a.id === r.asset_id
                ? {
                    ...a,
                    stability_index:
                      r.smoothed_stability ?? r.stability_score ?? a.stability_index,
                    latest_reading: {
                      heart_rate: r.heart_rate,
                      temperature: r.temperature,
                      respiration_rate: r.respiration_rate,
                      is_in_zone: r.is_in_zone,
                      latitude: r.latitude,
                      longitude: r.longitude,
                      recorded_at: r.recorded_at,
                    },
                  }
                : a
            );
          });
          setFlashId(r.asset_id);
          setTimeout(() => setFlashId(null), 400);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssets((prev) => [
              { ...payload.new, latest_reading: null },
              ...prev.filter((a) => a.id !== payload.new.id),
            ]);
            setFlashId(payload.new.id);
            setTimeout(() => setFlashId(null), 400);
            return;
          }
          if (payload.eventType === 'UPDATE') {
            setAssets((prev) => {
              const before = prev.find((a) => a.id === payload.new.id);
              if (
                payload.new.status === 'danger' &&
                before?.status !== 'danger'
              ) {
                window.dispatchEvent(
                  new CustomEvent('asset-danger', { detail: payload.new })
                );
              }
              return prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a
              );
            });
            setFlashId(payload.new.id);
            setTimeout(() => setFlashId(null), 400);
            return;
          }
          if (payload.eventType === 'DELETE') {
            setAssets((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, fetchAssets]);

  // Sort: danger → warning → stable → other, then by stability ascending.
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
    : 100;
  const dangerCount = assets.filter((a) => a.status === 'danger').length;
  const warningCount = assets.filter((a) => a.status === 'warning').length;
  const stableCount = assets.filter((a) => a.status === 'stable').length;

  return {
    assets: sortedAssets,
    loading,
    error,
    flashId,
    portfolioIndex,
    dangerCount,
    warningCount,
    stableCount,
    refetch: fetchAssets,
  };
}
