import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Sensor health hook.
 *
 * - Fetches sensor_devices for the owner (optionally scoped to a stable),
 *   joined with the linked asset's name/species/photo.
 * - Subscribes to realtime UPDATE events to keep battery/signal/status fresh.
 * - Exposes `offlineAlert` = true when any device hasn't reported in > 1h.
 * - Exposes a localized `relativeTime(iso)` helper.
 */
export function useSensorHealth(ownerId, stableId, isAr = true) {
  const [devices, setDevices] = useState([]);
  const [offlineAlert, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compute alert from the freshest list
  const recomputeOffline = useCallback((list) => {
    const oneHourAgo = Date.now() - 3600 * 1000;
    setOffline(
      list.some((d) => !d.last_seen_at || new Date(d.last_seen_at).getTime() < oneHourAgo)
    );
  }, []);

  useEffect(() => {
    if (!ownerId) {
      setDevices([]);
      setOffline(false);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    let q = supabase
      .from('sensor_devices')
      .select('*, assets(name, species, image_url, photo_url)')
      .eq('owner_id', ownerId);
    if (stableId && stableId !== 'all') q = q.eq('stable_id', stableId);

    q.order('last_seen_at', { ascending: false, nullsLast: true }).then(({ data }) => {
      if (cancelled) return;
      const list = data ?? [];
      setDevices(list);
      recomputeOffline(list);
      setLoading(false);
    });

    // Realtime: update device rows in place
    const ch = supabase
      .channel(`devices-${ownerId}-${stableId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sensor_devices',
          filter: `owner_id=eq.${ownerId}`,
        },
        ({ new: row, old, eventType }) => {
          setDevices((prev) => {
            let next;
            if (eventType === 'DELETE') {
              next = prev.filter((d) => d.id !== old.id);
            } else if (stableId && stableId !== 'all' && row.stable_id !== stableId) {
              // Row moved out of the active stable scope
              next = prev.filter((d) => d.id !== row.id);
            } else {
              const idx = prev.findIndex((d) => d.id === row.id);
              if (idx === -1) {
                next = [{ ...row, assets: row.assets ?? null }, ...prev];
              } else {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], ...row };
                next = copy;
              }
            }
            recomputeOffline(next);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [ownerId, stableId, recomputeOffline]);

  // Localized "X ago" helper
  const relativeTime = useCallback(
    (iso) => {
      if (!iso) return isAr ? 'لم يتصل بعد' : 'never';
      const diff = (Date.now() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return isAr ? 'منذ لحظات' : 'just now';
      if (diff < 3600) return isAr ? `منذ ${Math.floor(diff / 60)} دقيقة` : `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return isAr ? `منذ ${Math.floor(diff / 3600)} ساعة` : `${Math.floor(diff / 3600)}h ago`;
      return isAr ? `منذ ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
    },
    [isAr]
  );

  return { devices, offlineAlert, relativeTime, loading };
}
