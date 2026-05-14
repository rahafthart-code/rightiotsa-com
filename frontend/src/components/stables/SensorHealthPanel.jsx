import React, { useState } from 'react';
import { useSensorHealth } from '../../hooks/useSensorHealth';

function SignalBars({ signal }) {
  // signal is dBm: -50 (great) → -110 (none)
  const level = signal == null ? 0 : signal >= -65 ? 4 : signal >= -80 ? 3 : signal >= -95 ? 2 : 1;
  const color = level >= 3 ? '#10b981' : level === 2 ? '#d97706' : '#b91c1c';
  return (
    <div className="inline-flex items-end gap-[2px] h-3.5" title={signal != null ? `${signal} dBm` : '—'}>
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

function BatteryIcon({ pct }) {
  const value = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const color = pct == null ? '#9ca3af' : pct < 20 ? '#b91c1c' : pct < 50 ? '#d97706' : '#10b981';
  return (
    <div className="inline-flex items-center gap-1.5" title={pct != null ? `${pct}%` : '—'}>
      <div
        className="relative rounded-[3px]"
        style={{ width: 22, height: 11, border: `1.5px solid ${color}`, padding: 1 }}
      >
        <div className="h-full rounded-sm" style={{ width: `${value}%`, background: color }} />
        <span
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            insetInlineEnd: -4,
            width: 2,
            height: 5,
            background: color,
            borderRadius: 1,
          }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {pct != null ? `${pct}%` : '—'}
      </span>
    </div>
  );
}

/**
 * Collapsible "صحة الأجهزة" panel. Driven entirely by useSensorHealth.
 */
export default function SensorHealthPanel({ ownerId, stableId, isAr }) {
  const [open, setOpen] = useState(true);
  const { devices, offlineAlert, relativeTime, loading } = useSensorHealth(ownerId, stableId, isAr);

  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Offline banner — sits at top of the panel */}
      {offlineAlert && (
        <div
          className="px-4 py-2.5 text-xs font-bold flex items-center gap-2"
          style={{ background: '#fef3c7', color: '#92400e', borderBottom: '1px solid #fcd34d' }}
        >
          ⚠️ {isAr
            ? 'يوجد جهاز أو أكثر منقطع منذ أكثر من ساعة — يرجى المراجعة'
            : 'One or more devices have been offline for over an hour — please review'}
        </div>
      )}

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
        <div className="p-4">
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
                const dotColor = d.status === 'online'
                  ? '#10b981'
                  : d.status === 'low_battery'
                  ? '#d97706'
                  : d.status === 'error'
                  ? '#b91c1c'
                  : '#6b7280';
                const asset = d.assets || {};
                const photo = asset.image_url || asset.photo_url;
                const speciesIcon = asset.species === 'Horse' ? '•'
                  : asset.species === 'Falcon' ? '•'
                  : asset.species === 'Camel' ? '•'
                  : '📡';

                return (
                  <li
                    key={d.id}
                    className="rounded-lg px-3 py-2.5 flex items-center gap-3 flex-wrap"
                    style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    {/* Status dot */}
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${d.status === 'online' ? 'animate-pulse' : ''}`}
                      style={{ background: dotColor }}
                      title={d.status}
                    />

                    {/* Asset thumbnail + name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 overflow-hidden"
                        style={{ background: 'rgba(29,158,117,0.12)' }}
                      >
                        {photo ? (
                          <img src={photo} alt={asset.name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <span>{speciesIcon}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: '#1a1a1a' }}>
                          {asset.name || (isAr ? 'بدون أصل' : 'Unassigned')}
                        </div>
                        <div className="text-[10px] font-mono truncate" style={{ color: '#6b6b6b' }}>
                          {d.device_id}
                        </div>
                      </div>
                    </div>

                    {/* Battery */}
                    <BatteryIcon pct={d.battery_pct} />

                    {/* Signal */}
                    <div className="flex flex-col items-center">
                      <SignalBars signal={d.signal_strength} />
                      <div className="text-[9px] mt-0.5" style={{ color: '#6b6b6b' }}>
                        {d.signal_strength != null ? `${d.signal_strength} dBm` : '—'}
                      </div>
                    </div>

                    {/* Last seen */}
                    <div className="text-[11px] font-semibold whitespace-nowrap" style={{ color: '#6b6b6b' }}>
                      ⏱ {relativeTime(d.last_seen_at)}
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
