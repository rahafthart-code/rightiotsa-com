import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Asset detail bundle: asset row + passport + 30d stability snapshots
 * + the latest sensor reading, with realtime updates on new readings.
 *
 * Uses .maybeSingle() because passport / readings may not exist yet.
 * Exposes `loading` and `error` so the UI can show meaningful empty states.
 */
export function useAssetDetail(assetId) {
  const [asset, setAsset] = useState(null);
  const [passport, setPassport] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [liveReading, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      supabase.from('assets').select('*').eq('id', assetId).maybeSingle(),
      supabase.from('asset_passports').select('*').eq('asset_id', assetId).maybeSingle(),
      supabase
        .from('stability_snapshots')
        .select('vital_score,env_score,final_index,snapped_at')
        .eq('asset_id', assetId)
        .order('snapped_at', { ascending: true })
        .limit(720), // 30 days × 24h
      supabase
        .from('sensor_readings')
        .select('heart_rate,temperature,respiration_rate,activity_score,gps_lat,gps_lng,is_in_zone,recorded_at')
        .eq('asset_id', assetId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
      .then(([a, p, s, r]) => {
        if (cancelled) return;
        const firstErr = a.error || p.error || s.error || r.error;
        if (firstErr) setError(firstErr.message);
        setAsset(a.data ?? null);
        setPassport(p.data ?? null);
        setSnapshots(s.data ?? []);
        setLive(r.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Realtime: live sensor readings
    const ch = supabase
      .channel(`live-${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `asset_id=eq.${assetId}`,
        },
        ({ new: r }) => setLive(r)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [assetId]);

  return { asset, passport, snapshots, liveReading, loading, error };
}
