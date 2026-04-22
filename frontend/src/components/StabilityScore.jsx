import React, { useMemo } from 'react';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Stability Score (تقييم الانضباط والاستقرار)
 * Combines geofence adherence + health stability into a 0–100 score.
 */
export default function StabilityScore({ animal, telemetryRecords = [], geofence, healthData, isAr }) {
  const { score, geoPct, healthPct } = useMemo(() => {
    let geoPct = 100;
    if (geofence && telemetryRecords.length > 0) {
      const inside = telemetryRecords.filter((r) => {
        const d = haversineKm(r.lat, r.lng, geofence.center_lat, geofence.center_lng);
        return d <= geofence.radius_km;
      }).length;
      geoPct = Math.round((inside / telemetryRecords.length) * 100);
    }
    let healthPct = 90;
    const t = Number(healthData?.temperature);
    if (!Number.isNaN(t) && t > 0) {
      // Ideal range ~37.5–38.5; degrade outside it
      const dev = Math.max(0, Math.abs(t - 38) - 0.5);
      healthPct = Math.max(40, Math.round(100 - dev * 18));
    }
    const score = Math.round(geoPct * 0.6 + healthPct * 0.4);
    return { score, geoPct, healthPct };
  }, [telemetryRecords, geofence, healthData]);

  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  const tier = score >= 85
    ? { ar: 'انضباط ممتاز', en: 'Excellent Discipline', color: 'var(--color-royal-green)' }
    : score >= 70
    ? { ar: 'انضباط جيد', en: 'Good Discipline', color: 'var(--color-desert-gold-dark)' }
    : { ar: 'يحتاج متابعة', en: 'Needs Attention', color: '#d97706' };

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            🏅 {isAr ? 'تقييم الانضباط والاستقرار' : 'Management Excellence Score'}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {isAr
              ? 'مقياس مدى التزام الأصل بالمنطقة الآمنة واستقرار قراءاته الصحية'
              : 'How well the asset stays within its safe zone and maintains stable health readings'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold" style={{ color: tier.color }}>{score}<span className="text-sm">/100</span></div>
          <div className="text-[11px] font-semibold" style={{ color: tier.color }}>
            {isAr ? tier.ar : tier.en}
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="mt-3 flex items-center gap-1" aria-label={`${stars} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="text-lg"
            style={{ color: i <= stars ? 'var(--color-desert-gold)' : 'var(--color-border)' }}
          >
            ★
          </span>
        ))}
      </div>

      {/* Bar */}
      <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, var(--color-royal-green), var(--color-desert-gold))`,
          }}
        />
      </div>

      {/* Sub metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'الالتزام بالنطاق' : 'Geofence Adherence'}
          </div>
          <div className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-royal-green)' }}>{geoPct}%</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'استقرار الصحة' : 'Health Stability'}
          </div>
          <div className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-desert-gold-dark)' }}>{healthPct}%</div>
        </div>
      </div>
    </section>
  );
}
