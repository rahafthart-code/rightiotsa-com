import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Cpu, AlertTriangle, Battery, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_GREEN, ADMIN_AMBER, ADMIN_GOLD, relTime,
} from '../theme';

const TOKEN_KEY = 'mapbox_public_token';
function getInitialToken() {
  const envTok = import.meta.env.VITE_MAPBOX_TOKEN;
  if (envTok) return envTok;
  if (typeof window !== 'undefined') return window.localStorage.getItem(TOKEN_KEY) || '';
  return '';
}

// Hash → stable hue for owner color coding
function ownerColor(ownerId) {
  if (!ownerId) return '#888';
  let h = 0;
  for (let i = 0; i < ownerId.length; i++) h = (h * 31 + ownerId.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 70%, 55%)`;
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs" style={{ color: ADMIN_MUTED }}>{label}</div>
        <div className="text-xl font-bold" style={{ color: ADMIN_TEXT }}>{value}</div>
      </div>
    </div>
  );
}

function DevicesMap({ devices }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [token, setToken] = useState(getInitialToken);
  const [tokenInput, setTokenInput] = useState('');
  const [ready, setReady] = useState(false);

  // Init map
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [46.6753, 24.7136], // Riyadh fallback
      zoom: 5,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-left');
    map.on('load', () => setReady(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [token]);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const points = devices.filter((d) => d.last_lat != null && d.last_lng != null);
    if (!points.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    points.forEach((d) => {
      const lng = Number(d.last_lng);
      const lat = Number(d.last_lat);
      if (Number.isNaN(lng) || Number.isNaN(lat)) return;
      const el = document.createElement('div');
      const color = ownerColor(d.owner_id);
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${d.status === 'online' ? '#22c55e' : '#ef4444'};box-shadow:0 0 8px rgba(0,0,0,0.5);cursor:pointer`;
      el.title = `${d.device_id} · ${d.status}`;
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 600 });
    }
  }, [devices, ready]);

  if (!token) {
    return (
      <div className="rounded-2xl p-5" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <div className="text-sm font-bold mb-2" style={{ color: ADMIN_TEXT }}>أدخل Mapbox public token لعرض الخريطة</div>
        <p className="text-xs mb-3" style={{ color: ADMIN_MUTED }}>يبدأ بـ <code>pk.</code> — يتم حفظه محلياً في المتصفح.</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="pk.eyJ..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1 text-xs p-2 rounded-lg font-mono outline-none"
            style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
          />
          <button
            onClick={() => {
              if (tokenInput.startsWith('pk.')) {
                window.localStorage.setItem(TOKEN_KEY, tokenInput.trim());
                setToken(tokenInput.trim());
              } else {
                alert('التوكن يجب أن يبدأ بـ pk.');
              }
            }}
            className="px-3 py-2 text-xs font-bold rounded-lg"
            style={{ background: ADMIN_RED, color: '#fff' }}
          >
            حفظ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, height: 360 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [profiles, setProfiles] = useState(new Map());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: d } = await supabase
      .from('sensor_devices')
      .select('*')
      .order('updated_at', { ascending: false });
    const rows = d || [];
    setDevices(rows);
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))].filter(Boolean);
    if (ownerIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ownerIds);
      setProfiles(new Map((profs || []).map((p) => [p.user_id, p])));
    } else {
      setProfiles(new Map());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.status === 'online').length;
    const offlineLong = devices.filter((d) => {
      if (!d.last_seen_at) return false;
      return Date.now() - new Date(d.last_seen_at).getTime() > 6 * 3600 * 1000;
    }).length;
    const lowBat = devices.filter((d) => (d.battery_pct ?? 100) < 20).length;
    return { total, online, offlineLong, lowBat };
  }, [devices]);

  function rowAccent(d) {
    if (d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() > 6 * 3600 * 1000) return 'rgba(226,75,74,0.10)';
    if ((d.battery_pct ?? 100) < 20) return 'rgba(245,158,11,0.10)';
    return 'transparent';
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ADMIN_TEXT }}>الأجهزة</h1>
        <p className="text-sm mt-1" style={{ color: ADMIN_MUTED }}>كل المستشعرات عبر جميع العملاء، مع تظليل التحذيرات.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي الأجهزة" value={stats.total} icon={Cpu} accent={ADMIN_GOLD} />
        <StatCard label="متصلة" value={stats.online} icon={Wifi} accent={ADMIN_GREEN} />
        <StatCard label="غير متصل > 6س" value={stats.offlineLong} icon={AlertTriangle} accent={ADMIN_RED} />
        <StatCard label="بطارية منخفضة" value={stats.lowBat} icon={Battery} accent={ADMIN_AMBER} />
      </div>

      <DevicesMap devices={devices} />

      <div className="rounded-2xl overflow-hidden" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: ADMIN_TEXT }}>
            <thead style={{ background: ADMIN_PANEL_2, color: ADMIN_MUTED }}>
              <tr>
                <th className="text-start px-4 py-3 text-xs font-semibold">معرف الجهاز</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">المالك</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">النوع</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">البطارية</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الإشارة</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الحالة</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">آخر اتصال</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>...جاري التحميل</td></tr>}
              {!loading && devices.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>لا توجد أجهزة</td></tr>
              )}
              {!loading && devices.map((d) => {
                const prof = profiles.get(d.owner_id);
                const bat = d.battery_pct;
                const batColor = bat == null ? ADMIN_MUTED : bat < 20 ? ADMIN_RED : bat < 40 ? ADMIN_AMBER : ADMIN_GREEN;
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${ADMIN_BORDER}`, background: rowAccent(d) }}>
                    <td className="px-4 py-3 font-mono text-xs">{d.device_id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ownerColor(d.owner_id) }} />
                        {prof?.full_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }}>{d.device_type || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: batColor }}>{bat != null ? `${bat}%` : '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: ADMIN_MUTED }}>{d.signal_strength ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{
                        background: d.status === 'online' ? 'rgba(34,197,94,0.16)' : 'rgba(226,75,74,0.16)',
                        color: d.status === 'online' ? '#5eea93' : '#ff7e7d',
                      }}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }}>{relTime(d.last_seen_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
