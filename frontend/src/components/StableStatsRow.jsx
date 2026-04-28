import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStables } from '../hooks/useStables';

/**
 * Dashboard row that surfaces per-stable + device-health metrics from the
 * `stable_stats` view: avg stability, sensors online/offline, low-battery count.
 */
export default function StableStatsRow({ ownerId }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { stables, stats, totals, loading } = useStables(ownerId);

  if (loading) return null;
  if (!stables.length) return null;

  const tiles = [
    {
      label: isAr ? 'العزب' : 'Stables',
      value: stables.length,
      accent: '#1D9E75',
      icon: '🏛️',
    },
    {
      label: isAr ? 'متوسط الاستقرار' : 'Avg Stability',
      value: `${totals.avgStability}%`,
      accent: '#006c35',
      icon: '📊',
    },
    {
      label: isAr ? 'حساسات متصلة' : 'Sensors Online',
      value: totals.online,
      accent: '#10b981',
      icon: '📡',
    },
    {
      label: isAr ? 'حساسات غير متصلة' : 'Sensors Offline',
      value: totals.offline,
      accent: '#6b7280',
      icon: '🔌',
    },
    {
      label: isAr ? 'بطاريات منخفضة' : 'Low Battery',
      value: totals.lowBattery,
      accent: totals.lowBattery > 0 ? '#d97706' : '#9ca3af',
      icon: '🔋',
    },
  ];

  return (
    <section className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#006c35' }}>
          {isAr ? 'العزب وصحة الأجهزة' : 'Stables & Device Health'}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
          {isAr ? 'ملخّص لحظي من stable_stats' : 'Live summary from stable_stats'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[90px]"
            style={{ background: '#fff', border: `1px solid ${t.accent}33` }}
          >
            <div className="flex items-center justify-between">
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#6b6b6b' }}
              >
                {t.label}
              </div>
              <span className="text-base">{t.icon}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: t.accent }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      {/* Per-stable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stables.map((s) => {
          const st = stats.find((x) => x.stable_id === s.id) || {};
          const avg = st.avg_stability != null ? Math.round(Number(st.avg_stability)) : null;
          const accent = s.color || '#1D9E75';
          return (
            <div
              key={s.id}
              className="rounded-2xl p-4 shadow-sm"
              style={{
                background: '#fff',
                border: `1px solid ${accent}33`,
                borderInlineStartWidth: 4,
                borderInlineStartColor: accent,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
                    {isAr ? s.name : s.name_en || s.name}
                  </div>
                  {s.location_name && (
                    <div className="text-[11px]" style={{ color: '#6b6b6b' }}>
                      📍 {s.location_name}
                    </div>
                  )}
                </div>
                <span className="text-xl">
                  {s.icon === 'farm' ? '🌾' : s.icon === 'ranch' ? '🐎' : s.icon === 'desert' ? '🏜️' : '🏛️'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Mini label={isAr ? 'إجمالي' : 'Total'} value={st.total_assets ?? 0} color="#1a1a1a" />
                <Mini label={isAr ? 'استقرار' : 'Avg'} value={avg != null ? `${avg}%` : '—'} color={accent} />
                <Mini label={isAr ? 'مستقر' : 'Stable'} value={st.stable_count ?? 0} color="#10b981" />
                <Mini label={isAr ? 'تحذير' : 'Warning'} value={st.warning_count ?? 0} color="#d97706" />
                <Mini label={isAr ? 'خطر' : 'Danger'} value={st.danger_count ?? 0} color="#b91c1c" />
                <Mini
                  label={isAr ? 'بطارية منخفضة' : 'Low Bat.'}
                  value={st.low_battery_count ?? 0}
                  color={Number(st.low_battery_count) > 0 ? '#d97706' : '#9ca3af'}
                />
              </div>

              <div
                className="mt-3 flex items-center justify-between text-[11px]"
                style={{ color: '#6b6b6b' }}
              >
                <span>📡 {st.sensors_online ?? 0} {isAr ? 'متصل' : 'online'}</span>
                <span>🔌 {st.sensors_offline ?? 0} {isAr ? 'غير متصل' : 'offline'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Mini({ label, value, color }) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{ background: 'rgba(0,0,0,0.03)' }}
    >
      <div className="text-[9px] uppercase tracking-wide" style={{ color: '#6b6b6b' }}>
        {label}
      </div>
      <div className="text-sm font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
