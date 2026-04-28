import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Thermometer, Activity, MapPin, Wind } from 'lucide-react';

/**
 * LiveReadingBox — sensor reading panel with a gold "flash" pulse
 * triggered whenever the `reading.recorded_at` (or `reading` identity) changes.
 *
 * Props:
 *   reading: {
 *     heart_rate, temperature, respiration_rate, activity_score,
 *     is_in_zone, latitude, longitude, recorded_at
 *   } | null
 *   compact?: boolean
 */
export default function LiveReadingBox({ reading, compact = false }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [flash, setFlash] = useState(false);
  const lastKey = useRef(null);

  useEffect(() => {
    if (!reading) return;
    const key = reading.recorded_at || JSON.stringify(reading);
    if (lastKey.current && lastKey.current !== key) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(t);
    }
    lastKey.current = key;
  }, [reading]);

  const fmtTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString(isAr ? 'ar-SA' : 'en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch { return ''; }
  };

  const items = [
    {
      icon: Heart, color: '#dc2626',
      label: isAr ? 'النبض' : 'Heart',
      value: reading?.heart_rate != null ? `${Math.round(reading.heart_rate)}` : '—',
      unit: 'bpm',
    },
    {
      icon: Thermometer, color: '#f59e0b',
      label: isAr ? 'الحرارة' : 'Temp',
      value: reading?.temperature != null ? Number(reading.temperature).toFixed(1) : '—',
      unit: '°C',
    },
    {
      icon: Wind, color: '#0ea5e9',
      label: isAr ? 'التنفس' : 'Resp',
      value: reading?.respiration_rate != null
        ? `${Math.round(reading.respiration_rate)}` : '—',
      unit: 'rpm',
    },
    {
      icon: Activity, color: '#a855f7',
      label: isAr ? 'النشاط' : 'Activity',
      value: reading?.activity_score != null
        ? `${Math.round(reading.activity_score)}` : '—',
      unit: '%',
    },
  ];

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: '#0f1626',
        border: `1px solid ${flash ? '#d4af37' : '#1c2640'}`,
        boxShadow: flash
          ? '0 0 0 3px rgba(212,175,55,0.25), 0 0 24px rgba(212,175,55,0.35)'
          : 'none',
        transition: 'box-shadow 250ms ease, border-color 250ms ease',
      }}
    >
      {/* Flash sweep */}
      {flash && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.18) 50%, transparent 100%)',
            animation: 'lrb-sweep 700ms ease-out',
          }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: reading ? '#22c55e' : '#7d8499',
              boxShadow: reading ? '0 0 8px #22c55e' : 'none',
              animation: reading ? 'lrb-dot 1.6s ease-in-out infinite' : 'none',
            }}
          />
          <span className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: '#d4af37' }}>
            {isAr ? 'قراءات حية' : 'Live Readings'}
          </span>
        </div>
        {reading?.recorded_at && (
          <span className="text-[10px]" style={{ color: '#7d8499' }}>
            {fmtTime(reading.recorded_at)}
          </span>
        )}
      </div>

      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-2`}>
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl p-2.5 flex flex-col items-center text-center"
            style={{ background: '#0a1020', border: '1px solid #1c2640' }}
          >
            <it.icon size={16} style={{ color: it.color }} />
            <div className="font-bold text-base mt-1" style={{ color: '#f2efe3' }}>
              {it.value}
              <span className="text-[10px] font-normal mr-1" style={{ color: '#7d8499' }}>
                {' '}{it.unit}
              </span>
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: '#7d8499' }}>
              {it.label}
            </div>
          </div>
        ))}
      </div>

      {/* GPS / zone status row */}
      <div
        className="mt-3 flex items-center justify-between rounded-lg px-3 py-2"
        style={{ background: '#0a1020', border: '1px solid #1c2640' }}
      >
        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#f2efe3' }}>
          <MapPin size={13} style={{ color: '#d4af37' }} />
          {reading?.latitude != null && reading?.longitude != null
            ? `${Number(reading.latitude).toFixed(4)}, ${Number(reading.longitude).toFixed(4)}`
            : (isAr ? 'لا يوجد موقع' : 'No location')}
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: reading?.is_in_zone === false
              ? 'rgba(220,38,38,0.18)' : 'rgba(34,197,94,0.18)',
            color: reading?.is_in_zone === false ? '#fca5a5' : '#86efac',
            border: `1px solid ${reading?.is_in_zone === false ? '#dc2626' : '#22c55e'}55`,
          }}
        >
          {reading?.is_in_zone === false
            ? (isAr ? 'خارج النطاق' : 'Out of zone')
            : (isAr ? 'داخل النطاق' : 'In zone')}
        </span>
      </div>

      <style>{`
        @keyframes lrb-sweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        @keyframes lrb-dot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%     { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
