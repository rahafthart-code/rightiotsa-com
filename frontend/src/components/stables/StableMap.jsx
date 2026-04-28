import React, { useMemo } from 'react';

/**
 * OpenStreetMap embed centered on a stable's geofence (or all assets).
 * Asset markers are NOT supported via the public OSM iframe — we render
 * an overlay legend with status counts so the map stays informative.
 */
export default function StableMap({ stable, assets, isAr }) {
  const center = useMemo(() => {
    if (stable?.center_lat != null && stable?.center_lng != null) {
      return { lat: Number(stable.center_lat), lng: Number(stable.center_lng) };
    }
    // fallback: average of assets w/ geofence_lat
    const pts = assets
      .map((a) => ({ lat: Number(a.geofence_lat), lng: Number(a.geofence_lng) }))
      .filter((p) => !Number.isNaN(p.lat) && !Number.isNaN(p.lng) && p.lat && p.lng);
    if (pts.length) {
      const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
      const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
      return { lat, lng };
    }
    return { lat: 24.7136, lng: 46.6753 }; // Riyadh fallback
  }, [stable, assets]);

  const radiusKm = Number(stable?.radius_km) || 5;
  const dLat = radiusKm / 111;
  const cosLat = Math.cos((center.lat * Math.PI) / 180) || 1;
  const dLng = radiusKm / (111 * cosLat);
  const bbox = [
    center.lng - dLng,
    center.lat - dLat,
    center.lng + dLng,
    center.lat + dLat,
  ].join(',');

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;

  const counts = assets.reduce(
    (a, x) => {
      a[x.status] = (a[x.status] || 0) + 1;
      return a;
    },
    {}
  );

  const accent = stable?.color || '#1D9E75';

  return (
    <section
      className="relative rounded-xl overflow-hidden shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      <iframe
        title="stable-map"
        src={src}
        style={{ width: '100%', height: 280, border: 0, display: 'block' }}
        loading="lazy"
      />

      {/* Top-left badge: stable name + radius */}
      <div
        className="absolute top-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-2"
        style={{
          [isAr ? 'right' : 'left']: 12,
          background: '#fff',
          color: accent,
          border: `1px solid ${accent}55`,
        }}
      >
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: accent, opacity: 0.6 }}
        />
        {stable
          ? `${isAr ? stable.name : stable.name_en || stable.name} · ${radiusKm}km`
          : (isAr ? 'كل العزب' : 'All stables')}
      </div>

      {/* Status legend (since OSM iframe can't draw custom markers) */}
      <div
        className="absolute bottom-3 px-3 py-2 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-3"
        style={{
          [isAr ? 'left' : 'right']: 12,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Legend dot="#10b981" label={isAr ? 'مستقر' : 'Stable'} count={counts.stable || 0} />
        <Legend dot="#d97706" label={isAr ? 'تحذير' : 'Warning'} count={counts.warning || 0} />
        <Legend dot="#b91c1c" label={isAr ? 'خطر' : 'Danger'} count={counts.danger || 0} pulse={counts.danger > 0} />
      </div>
    </section>
  );
}

function Legend({ dot, label, count, pulse }) {
  return (
    <span className="flex items-center gap-1" style={{ color: '#1a1a1a' }}>
      <span
        className={`inline-block w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {label} <span style={{ color: dot }}>{count}</span>
    </span>
  );
}
