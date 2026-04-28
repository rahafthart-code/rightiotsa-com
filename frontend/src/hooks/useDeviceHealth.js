import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Returns the freshest sensor_devices row for an asset with realtime updates
 * on battery, signal, and connection status.
 */
export function useDeviceHealth(assetId) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!assetId) {
      setDevice(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);

    supabase
      .from('sensor_devices')
      .select('*')
      .eq('asset_id', assetId)
      .order('last_seen_at', { ascending: false, nullsLast: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setDevice(data ?? null);
          setLoading(false);
        }
      });

    const ch = supabase
      .channel(`device-${assetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sensor_devices',
          filter: `asset_id=eq.${assetId}`,
        },
        ({ new: row, eventType }) => {
          if (eventType === 'DELETE') setDevice(null);
          else if (row) setDevice(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [assetId]);

  return { device, loading };
}
