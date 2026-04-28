import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * useAssetLocation(assetId)
 *
 * Returns the historical GPS trail (last 100 points) for a single asset
 * plus a realtime-updated "last point" and zone status.
 *
 * Each point: { lat, lng, stability, recordedAt }
 *
 * Also exposes a ready-to-render GeoJSON LineString (oldest → newest)
 * for use with mapbox-gl / maplibre sources.
 */
export function useAssetLocation(assetId) {
  const [trail, setTrail] = useState([]);
  const [lastPoint, setLast] = useState(null);
  const [isInZone, setInZone] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchTrail = useCallback(async () => {
    if (!assetId) {
      setTrail([]);
      setLast(null);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('gps_lat, gps_lng, latitude, longitude, smoothed_stability, stability_score, is_in_zone, recorded_at')
      .eq('asset_id', assetId)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (!error && data?.length) {
      const points = data
        .map((r) => {
          const lat = r.gps_lat ?? r.latitude;
          const lng = r.gps_lng ?? r.longitude;
          if (lat == null || lng == null) return null;
          return {
            lat: Number(lat),
            lng: Number(lng),
            stability: Number(r.smoothed_stability ?? r.stability_score ?? 100),
            recordedAt: r.recorded_at,
          };
        })
        .filter(Boolean);

      setTrail(points);
      setLast(points[0] ?? null);
      setInZone(data[0]?.is_in_zone ?? true);
    } else {
      setTrail([]);
      setLast(null);
    }
    setLoading(false);
  }, [assetId]);

  useEffect(() => {
    fetchTrail();
    if (!assetId) return undefined;

    const ch = supabase
      .channel(`gps-${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `asset_id=eq.${assetId}`,
        },
        ({ new: r }) => {
          const lat = r.gps_lat ?? r.latitude;
          const lng = r.gps_lng ?? r.longitude;
          if (lat == null || lng == null) return;
          const pt = {
            lat: Number(lat),
            lng: Number(lng),
            stability: Number(r.smoothed_stability ?? r.stability_score ?? 100),
            recordedAt: r.recorded_at,
          };
          setLast(pt);
          setInZone(r.is_in_zone ?? true);
          setTrail((prev) => [pt, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [assetId, fetchTrail]);

  // GeoJSON LineString — oldest → newest, ready for map sources
  const trailGeoJSON = useMemo(
    () => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [...trail].reverse().map((p) => [p.lng, p.lat]),
      },
      properties: {},
    }),
    [trail]
  );

  return { trail, lastPoint, isInZone, loading, trailGeoJSON, refetch: fetchTrail };
}
