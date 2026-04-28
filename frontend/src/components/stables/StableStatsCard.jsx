import React from 'react';

/**
 * Wide stats card shown when a specific stable is selected.
 * Pulls from `stable_stats` view (passed in as `stat`).
 */
export default function StableStatsCard({ stable, stat, isAr }) {
  if (!stable) return null;
  const accent = stable.color || '#1D9E75';

  const total = Number(stat?.total_assets) || 0;
  const stableC = Number(stat?.stable_count) || 0;
  const warning = Number(stat?.warning_count) || 0;
  const danger = Number(stat?.danger_count) || 0;
  const online = Number(stat?.sensors_online) || 0;
  const offline = Number(stat?.sensors_offline) || 0;
  const totalSensors = online + offline;
  const coverage = totalSensors ? Math.round((online / totalSensors) * 100) : 0;

  const metrics = [
    { label: isAr ? 'الأصول النشطة' : 'Active Assets', value: total, color: '#1a1a1a' },
    { label: isAr ? 'مستقرة' : 'Stable', value: stableC, color: '#10b981', dot: '#10b981' },
    { label: isAr ? 'تنبيهات' : 'Warnings', value: warning, color: '#d97706', dot: '#d97706' },
    { label: isAr ? 'خطر' : 'Danger', value: danger, color: '#b91c1c', dot: '#b91c1c', pulse: danger > 0 },
    {
      label: isAr ? 'تغطية الحساسات' : 'Sensor Coverage',
      value: `${online} / ${totalSensors}`,
      color: '#1D9E75',
      sub: isAr ? 'جهاز متصل' : 'devices online',
    },
  ];

  return (
    <section
      className="rounded-2xl p-5 shadow-sm"
      style={{
        background: '#fff',
        borderInlineEnd: `4px solid ${accent}`,
        border: '1px solid rgba(0,0,0,0.06)',
        borderInlineEndWidth: 4,
        borderInlineEndColor: accent,
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {stable.icon === 'farm' ? '🌾'
              : stable.icon === 'ranch' ? '🐎'
              : stable.icon === 'desert' ? '⛺'
              : '🌴'}
          </span>
          <div>
            <h2 className="text-lg font-bold" style={{ color: accent }}>
              {isAr ? stable.name : stable.name_en || stable.name}
            </h2>
            {stable.location_name && (
              <div className="text-xs" style={{ color: '#6b6b6b' }}>📍 {stable.location_name}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6b6b6b' }}>
              {m.dot && (
                <span
                  className={`inline-block w-2 h-2 rounded-full ${m.pulse ? 'animate-pulse' : ''}`}
                  style={{ background: m.dot }}
                />
              )}
              {m.label}
            </div>
            <div className="mt-1 text-2xl font-black" style={{ color: m.color }}>
              {m.value}
            </div>
            {m.sub && <div className="text-[10px]" style={{ color: '#9b9b9b' }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Coverage progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold mb-1" style={{ color: '#6b6b6b' }}>
          <span>{isAr ? 'تغطية الحساسات' : 'Sensor coverage'}</span>
          <span style={{ color: '#1D9E75' }}>{coverage}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(29,158,117,0.12)' }}>
          <div
            className="h-full transition-all duration-700 rounded-full"
            style={{ width: `${coverage}%`, background: '#1D9E75' }}
          />
        </div>
      </div>
    </section>
  );
}
