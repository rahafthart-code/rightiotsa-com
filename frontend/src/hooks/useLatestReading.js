import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Returns the latest sensor_readings row for a given asset and stays live
 * via realtime INSERT subscription filtered by asset_id.
 */
export function useLatestReading(assetId) {
  const [reading, setReading] = useState(null);

  useEffect(() => {
    if (!assetId) return;
    let active = true;

    supabase
      .from('sensor_readings')
      .select('heart_rate, temperature, stability_score, smoothed_stability, recorded_at, latitude, longitude, battery_level')
      .eq('asset_id', assetId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setReading(data);
      });

    const channel = supabase
      .channel(`reading-${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => setReading(payload.new)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [assetId]);

  return reading;
}
