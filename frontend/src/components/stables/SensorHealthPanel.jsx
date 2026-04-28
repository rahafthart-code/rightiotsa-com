import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function timeAgo(ts, isAr) {
  if (!ts) return isAr ? 'لم يتصل بعد' : 'never';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return isAr ? 'الآن' : 'just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return isAr ? `منذ ${m} دقيقة` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return isAr ? `منذ ${d} يوم` : `${d}d ago`;
}

function SignalBars({ signal }) {
  // signal is dBm: -50 (great) → -110 (none)
  const level = signal == null ? 0 : signal >= -65 ? 4 : signal >= -80 ? 3 : signal >= -95 ? 2 : 1;
  const color = level >= 3 ? '#10b981' : level === 2 ? '#d97706' : '#b91c1c';
  return (
    <div className="inline-flex items-end gap-[2px] h-3.5">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: `${i * 25}%`,
            background: i <= level ? color : 'rgba(0,0,0,0.15)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function SensorHealthPanel({ ownerId, stableId, assets, isAr }) {
  const [open, setOpen] = useState(true);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return undefined;
    let cancelled = false;
    setLoading(true);

    let q = supabase
      .from('sensor_devices')
      .select('*')
      .eq('owner_id', ownerId)
      .order('last_seen_at', { ascending: false, nullsLast: true });
    if (stableId && stableId !== 'all') q = q.eq('stable_id', stableId);

    q.then(({ data }) => {
      if (cancelled) return;
      setDevices(data ?? []);
      setLoading(false);
    });

    const ch = supabase
      .channel(`sensor-health-${ownerId}-${stableId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_devices', filter: `owner_id=eq.${ownerId}` },
        ({ new: row, old, eventType }) => {
          setDevices((prev) => {
            if (eventType === 'DELETE') return prev.filter((d) => d.id !== old.id);
            if (stableId && stableId !== 'all' && row.stable_id !== stableId) {
              return prev.filter((d) => d.id !== row.id);
            }
            const idx = prev.findIndex((d) => d.id === row.id);
            if (idx === -1) return [row, ...prev];
            const copy = [...prev];
            copy[idx] = row;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [ownerId, stableId]);

  const assetMap = useMemo(() => {
    const m = new Map();
    assets.forEach((a) => m.set(a.id, a));
    return m;
  }, [assets]);

  const offlineLong = devices.filter(
    (d) => d.status === 'offline' && d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() > 3600 * 1000
  );

  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ background: 'linear-gradient(135deg, #1D9E75, #006c35)', color: '#fff' }}
      >
        <div className="font-bold flex items-center gap-2">
          📡 {isAr ? 'صحة الأجهزة' : 'Sensor Health'}
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {devices.length}
          </span>
        </div>
        <span className="text-lg leading-none">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {offlineLong.length > 0 && (
            <div
              className="rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2"
              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
            >
              ⚠️ {isAr
                ? `${offlineLong.length} جهاز غير متصل لأكثر من ساعة`
                : `${offlineLong.length} device(s) offline > 1 hour`}
            </div>
          )}

          {loading ? (
            <div className="text-center py-6 text-sm" style={{ color: '#6b6b6b' }}>
              {isAr ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: '#6b6b6b' }}>
              {isAr ? 'لا توجد أجهزة في هذا التصنيف' : 'No devices in this scope'}
            </div>
          ) : (
            <ul className="space-y-2">
              {devices.map((d) => {
                const asset = assetMap.get(d.asset_id);
                const battery = d.battery_pct;
                const batColor = battery == null ? '#9ca3af' : battery < 20 ? '#b91c1c' : battery < 50 ? '#d97706' : '#10b981';
                const dotColor = d.status === 'online'
                  ? '#10b981'
                  : d.status === 'low_battery'
                  ? '#d97706'
                  : d.status === 'error'
                  ? '#b91c1c'
                  : '#6b7280';
                return (
                  <li
                    key={d.id}
                    className="rounded-lg px-3 py-2.5 flex items-center gap-3 flex-wrap"
                    style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${d.status === 'online' ? 'animate-pulse' : ''}`}
                      style={{ background: dotColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate" style={{ color: '#1a1a1a' }}>
                        {asset?.name || (isAr ? 'بدون أصل' : 'Unassigned')}
                      </div>
                      <div className="text-[10px] font-mono truncate" style={{ color: '#6b6b6b' }}>
                        {d.device_id}
                      </div>
                    </div>

                    {/* Battery */}
                    <div className="min-w-[110px]">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5" style={{ color: '#6b6b6b' }}>
                        <span>🔋 {isAr ? 'البطارية' : 'Battery'}</span>
                        <span style={{ color: batColor }}>{battery != null ? `${battery}%` : '—'}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${Math.max(0, Math.min(100, battery ?? 0))}%`, background: batColor }}
                        />
                      </div>
                    </div>

                    {/* Signal */}
                    <div className="flex flex-col items-center" title={`${d.signal_strength ?? '—'} dBm`}>
                      <SignalBars signal={d.signal_strength} />
                      <div className="text-[9px] mt-0.5" style={{ color: '#6b6b6b' }}>
                        {d.signal_strength != null ? `${d.signal_strength}` : '—'}
                      </div>
                    </div>

                    {/* Last seen */}
                    <div className="text-[11px] font-semibold whitespace-nowrap" style={{ color: '#6b6b6b' }}>
                      ⏱ {timeAgo(d.last_seen_at, isAr)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
