import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import circle from '@turf/circle';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAssetLocation } from '../../hooks/useAssetLocation';

/**
 * Interactive Mapbox map for a Stable.
 *
 * Props:
 *   stable: { center_lat, center_lng, radius_km, color, name } | null
 *   assets: Asset[] (with gps_lat/gps_lng or latest_reading.latitude/longitude)
 *   isAr:   boolean
 *   selectedAssetId?: string  (when set → show GPS trail)
 *   onAssetClick?: (assetId) => void
 */

const TOKEN_KEY = 'mapbox_public_token';

function getInitialToken() {
  const envTok = import.meta.env.VITE_MAPBOX_TOKEN;
  if (envTok) return envTok;
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  }
  return '';
}

function zoomFromRadius(km) {
  const r = Number(km) || 5;
  if (r <= 5) return 13;
  if (r <= 20) return 11;
  return 9;
}

function statusColor(status) {
  if (status === 'danger') return '#b91c1c';
  if (status === 'warning') return '#d97706';
  return '#10b981';
}

function speciesEmoji(species) {
  const s = (species || '').toLowerCase();
  if (s.includes('horse') || s.includes('خيل') || s.includes('حصان')) return '•';
  if (s.includes('falcon') || s.includes('صقر')) return '•';
  return '•';
}

function relativeTime(iso, isAr) {
  if (!iso) return isAr ? 'لا يوجد' : 'n/a';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return isAr ? 'الآن' : 'just now';
  if (m < 60) return isAr ? `منذ ${m} دقيقة` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return isAr ? `منذ ${d} يوم` : `${d}d ago`;
}

function getAssetLatLng(a) {
  const lat = a?.gps_lat ?? a?.latest_reading?.latitude ?? a?.latest_reading?.gps_lat;
  const lng = a?.gps_lng ?? a?.latest_reading?.longitude ?? a?.latest_reading?.gps_lng;
  if (lat == null || lng == null) return null;
  const n1 = Number(lat);
  const n2 = Number(lng);
  if (Number.isNaN(n1) || Number.isNaN(n2)) return null;
  return [n2, n1]; // [lng, lat]
}

export default function StableMap({
  stable,
  assets = [],
  isAr = true,
  selectedAssetId = null,
  onAssetClick,
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map()); // assetId -> { marker, status }
  const [token, setToken] = useState(getInitialToken);
  const [tokenInput, setTokenInput] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [styleKey, setStyleKey] = useState('satellite'); // 'satellite' | 'streets'

  const accent = stable?.color || '#1D9E75';

  // Center: stable center → fallback to first asset → Riyadh
  const center = useMemo(() => {
    if (stable?.center_lat != null && stable?.center_lng != null) {
      return [Number(stable.center_lng), Number(stable.center_lat)];
    }
    for (const a of assets) {
      const ll = getAssetLatLng(a);
      if (ll) return ll;
    }
    return [46.6753, 24.7136];
  }, [stable, assets]);

  const zoom = zoomFromRadius(stable?.radius_km);

  // ── Init map ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    let map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style:
          styleKey === 'satellite'
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom,
        attributionControl: false,
      });
    } catch (e) {
      console.error('Mapbox init failed', e);
      return;
    }
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    map.on('load', () => setMapReady(true));

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Style switch ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const styleUrl =
      styleKey === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12';
    setMapReady(false);
    map.setStyle(styleUrl);
    map.once('styledata', () => setMapReady(true));
  }, [styleKey]);

  // ── Geofence circle ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !stable?.center_lat || !stable?.center_lng) return;
    const radiusKm = Number(stable.radius_km) || 5;
    const poly = circle([Number(stable.center_lng), Number(stable.center_lat)], radiusKm, {
      steps: 64,
      units: 'kilometers',
    });

    if (map.getLayer('geofence-fill')) map.removeLayer('geofence-fill');
    if (map.getLayer('geofence-line')) map.removeLayer('geofence-line');
    if (map.getLayer('geofence-label')) map.removeLayer('geofence-label');
    if (map.getSource('geofence')) map.removeSource('geofence');
    if (map.getSource('geofence-center')) map.removeSource('geofence-center');

    map.addSource('geofence', { type: 'geojson', data: poly });
    map.addLayer({
      id: 'geofence-fill',
      type: 'fill',
      source: 'geofence',
      paint: { 'fill-color': accent, 'fill-opacity': 0.12 },
    });
    map.addLayer({
      id: 'geofence-line',
      type: 'line',
      source: 'geofence',
      paint: {
        'line-color': accent,
        'line-width': 2,
        'line-dasharray': [3, 2],
      },
    });

    map.addSource('geofence-center', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(stable.center_lng), Number(stable.center_lat)],
        },
        properties: { name: stable.name || '' },
      },
    });
    map.addLayer({
      id: 'geofence-label',
      type: 'symbol',
      source: 'geofence-center',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0],
        'text-anchor': 'center',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.6)',
        'text-halo-width': 1.4,
      },
    });

    map.flyTo({ center, zoom, duration: 800 });
  }, [mapReady, stable, accent, center, zoom]);

  // ── Asset markers ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const seen = new Set();

    assets.forEach((a) => {
      const ll = getAssetLatLng(a);
      if (!ll) return;
      seen.add(a.id);

      const existing = markersRef.current.get(a.id);
      if (existing) {
        // Smoothly animate to new position
        const cur = existing.marker.getLngLat();
        if (cur.lng !== ll[0] || cur.lat !== ll[1]) {
          animateMarker(existing.marker, [cur.lng, cur.lat], ll, 1500);
        }
        // Update status ring color if changed
        if (existing.status !== a.status) {
          const ring = existing.el.querySelector('.rb-ring');
          if (ring) ring.style.borderColor = statusColor(a.status);
          existing.el.classList.toggle('rb-pulse', a.status === 'danger');
          existing.status = a.status;
        }
        return;
      }

      const el = buildMarkerEl(a);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onAssetClick) onAssetClick(a.id);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(ll)
        .setPopup(buildPopup(a, isAr, () => navigate(`/passport/${a.id}`)))
        .addTo(map);

      markersRef.current.set(a.id, { marker, el, status: a.status });
    });

    // Remove markers no longer in list
    markersRef.current.forEach((entry, id) => {
      if (!seen.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [assets, mapReady, isAr, navigate, onAssetClick]);

  // ── Realtime: sensor_devices position updates ────────────
  useEffect(() => {
    if (!mapReady || !assets.length) return;
    const ownerId = assets[0]?.owner_id;
    if (!ownerId) return;

    const ch = supabase
      .channel(`map-devices-${ownerId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sensor_devices', filter: `owner_id=eq.${ownerId}` },
        (payload) => {
          const d = payload.new;
          if (!d?.asset_id || d.last_lat == null || d.last_lng == null) return;
          const entry = markersRef.current.get(d.asset_id);
          if (!entry) return;
          const cur = entry.marker.getLngLat();
          animateMarker(entry.marker, [cur.lng, cur.lat], [Number(d.last_lng), Number(d.last_lat)], 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [mapReady, assets]);

  // ── GPS Trail for selected asset (live via useAssetLocation) ──
  const { trail: liveTrail } = useAssetLocation(selectedAssetId);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear previous trail layers/sources first
    ['trail-line', 'trail-points'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['trail-line-src', 'trail-points-src'].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    if (!selectedAssetId || liveTrail.length < 2) return;

    const asset = assets.find((a) => a.id === selectedAssetId);
    const trailColor = statusColor(asset?.status);

    // Hook returns newest → oldest; map needs oldest → newest for the gradient
    const ordered = [...liveTrail].reverse();
    const coords = ordered.map((p) => [p.lng, p.lat]);

    map.addSource('trail-line-src', {
      type: 'geojson',
      lineMetrics: true,
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      },
    });
    map.addLayer({
      id: 'trail-line',
      type: 'line',
      source: 'trail-line-src',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': 3,
        'line-gradient': [
          'interpolate', ['linear'], ['line-progress'],
          0, 'rgba(120,120,120,0.3)',
          1, trailColor,
        ],
      },
    });

    map.addSource('trail-points-src', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: ordered.map((p, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: {
            t: p.recordedAt,
            s: p.stability,
            progress: i / Math.max(1, ordered.length - 1),
          },
        })),
      },
    });
    map.addLayer({
      id: 'trail-points',
      type: 'circle',
      source: 'trail-points-src',
      paint: {
        'circle-radius': 4,
        'circle-color': trailColor,
        'circle-opacity': ['interpolate', ['linear'], ['get', 'progress'], 0, 0.3, 1, 1],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
    });
    const onEnter = (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties || {};
      const html = `
        <div style="font-family:Cairo,sans-serif;font-size:12px;color:#1a1a1a">
          <div><b>${isAr ? 'الوقت' : 'Time'}:</b> ${relativeTime(p.t, isAr)}</div>
          <div><b>${isAr ? 'الاستقرار' : 'Stability'}:</b> ${
            p.s != null ? Math.round(Number(p.s)) + '%' : '—'
          }</div>
        </div>`;
      popup.setLngLat(f.geometry.coordinates.slice()).setHTML(html).addTo(map);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };
    map.on('mouseenter', 'trail-points', onEnter);
    map.on('mouseleave', 'trail-points', onLeave);

    return () => {
      map.off('mouseenter', 'trail-points', onEnter);
      map.off('mouseleave', 'trail-points', onLeave);
      popup.remove();
    };
  }, [selectedAssetId, mapReady, liveTrail, assets, isAr]);

  // ── Reset to center ──────────────────────────────────────
  const handleReset = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 700 });
  }, [center, zoom]);

  // ── Token entry UI ───────────────────────────────────────
  if (!token) {
    return (
      <section
        className="rounded-xl p-5 shadow-sm"
        style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <h3 className="font-bold text-sm mb-2" style={{ color: accent }}>
          🗺️ {isAr ? 'إعداد الخريطة التفاعلية' : 'Setup Interactive Map'}
        </h3>
        <p className="text-xs mb-3" style={{ color: '#6b6b6b' }}>
          {isAr
            ? 'لعرض الخريطة، الصق رمز Mapbox العام (يبدأ بـ pk.). يُحفظ في متصفحك فقط.'
            : 'Paste your public Mapbox token (starts with pk.) to enable the map. Stored only in your browser.'}{' '}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            style={{ color: accent, textDecoration: 'underline' }}
          >
            {isAr ? 'احصل على رمز' : 'Get a token'}
          </a>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="pk.eyJ..."
            className="flex-1 px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          />
          <button
            type="button"
            onClick={() => {
              const t = tokenInput.trim();
              if (!t) return;
              localStorage.setItem(TOKEN_KEY, t);
              setToken(t);
            }}
            className="px-4 py-2 rounded-lg text-white font-bold text-sm"
            style={{ background: accent }}
          >
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative rounded-xl overflow-hidden shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
      dir="ltr"
    >
      <style>{`
        .rb-marker { width:36px; height:36px; cursor:pointer; position:relative; }
        .rb-ring {
          position:absolute; inset:0; border-radius:9999px; border:2px solid #10b981;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
          background:#fff; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        .rb-ring img { width:100%; height:100%; object-fit:cover; border-radius:9999px; }
        .rb-ring .rb-emoji { font-size:18px; line-height:1; }
        .rb-marker.rb-pulse::before {
          content:''; position:absolute; inset:-4px; border-radius:9999px;
          border:2px solid #b91c1c; opacity:0.7;
          animation: rb-pulse 1.4s ease-out infinite;
        }
        @keyframes rb-pulse {
          0%   { transform:scale(1);   opacity:0.7; }
          100% { transform:scale(1.6); opacity:0;   }
        }
        .mapboxgl-popup-content { font-family:Cairo,sans-serif; padding:10px 12px; }
      `}</style>

      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 'clamp(240px, 38vw, 320px)' }}
      />

      {!mapReady && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.7)', color: accent }}
        >
          {isAr ? 'جاري تحميل الخريطة...' : 'Loading map...'}
        </div>
      )}

      {/* Top-left: style toggle + reset */}
      <div
        className="absolute top-3 left-3 flex flex-col gap-2 z-10"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex rounded-lg overflow-hidden shadow-md" style={{ background: '#fff' }}>
          {[
            { k: 'satellite', label: isAr ? 'قمر صناعي' : 'Satellite' },
            { k: 'streets', label: isAr ? 'شوارع' : 'Streets' },
          ].map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => setStyleKey(o.k)}
              className="px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: styleKey === o.k ? accent : '#fff',
                color: styleKey === o.k ? '#fff' : '#1a1a1a',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-md"
          style={{ background: '#fff', color: accent }}
        >
          ⌖ {isAr ? 'توسيط' : 'Reset'}
        </button>
      </div>

      {/* Bottom legend */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-3 shadow-md z-10"
        style={{ background: 'rgba(255,255,255,0.95)' }}
      >
        <Legend dot="#10b981" label={isAr ? 'مستقر' : 'Stable'} />
        <Legend dot="#d97706" label={isAr ? 'تحذير' : 'Warning'} />
        <Legend dot="#b91c1c" label={isAr ? 'خطر' : 'Danger'} pulse />
      </div>
    </section>
  );
}

function Legend({ dot, label, pulse }) {
  return (
    <span className="flex items-center gap-1" style={{ color: '#1a1a1a' }}>
      <span
        className={`inline-block w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {label}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────

function buildMarkerEl(asset) {
  const el = document.createElement('div');
  el.className = `rb-marker${asset.status === 'danger' ? ' rb-pulse' : ''}`;
  const ring = document.createElement('div');
  ring.className = 'rb-ring';
  ring.style.borderColor = statusColor(asset.status);
  if (asset.photo_url || asset.image_url) {
    const img = document.createElement('img');
    img.src = asset.photo_url || asset.image_url;
    img.alt = asset.name || '';
    img.onerror = () => {
      ring.innerHTML = `<span class="rb-emoji">${speciesEmoji(asset.species)}</span>`;
    };
    ring.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'rb-emoji';
    span.textContent = speciesEmoji(asset.species);
    ring.appendChild(span);
  }
  el.appendChild(ring);
  return el;
}

function buildPopup(asset, isAr, onPassport) {
  const stab = Math.round(Number(asset.stability_index) || 0);
  const color = statusColor(asset.status);
  const last = asset.latest_reading?.recorded_at;
  const html = `
    <div style="min-width:180px">
      <div style="font-weight:800;font-size:14px;color:#1a1a1a;margin-bottom:6px">
        ${escapeHtml(asset.name || '')}
      </div>
      <div style="display:inline-block;padding:2px 8px;border-radius:9999px;background:${color}1a;color:${color};font-weight:700;font-size:11px;margin-bottom:6px">
        ${isAr ? 'الاستقرار' : 'Stability'}: ${stab}%
      </div>
      <div style="font-size:11px;color:#6b6b6b;margin-bottom:6px">
        ${isAr ? 'آخر تحديث' : 'Last update'}: ${escapeHtml(relativeTime(last, isAr))}
      </div>
      <a id="rb-passport-link" href="#" style="font-size:12px;font-weight:700;color:#1D9E75;text-decoration:none">
        ${isAr ? 'عرض الجواز ←' : 'View passport →'}
      </a>
    </div>`;
  const popup = new mapboxgl.Popup({ offset: 22, closeButton: true });
  popup.setHTML(html);
  popup.on('open', () => {
    const node = document.getElementById('rb-passport-link');
    if (node) {
      node.addEventListener('click', (e) => {
        e.preventDefault();
        onPassport();
      });
    }
  });
  return popup;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function animateMarker(marker, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const lng = from[0] + (to[0] - from[0]) * ease;
    const lat = from[1] + (to[1] - from[1]) * ease;
    marker.setLngLat([lng, lat]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
