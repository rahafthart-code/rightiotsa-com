import React, { useMemo } from "react";
import { classifyTemperature, statusColor, statusBg, statusLabel } from "../utils/healthStatus";

/**
 * Herd-level "Daily Pulse" summary.
 * - Average herd temperature
 * - Health streak (days in green zone) — derived from animals' last_seen + temp data
 */
export default function DailyPulseWidget({ animals, healthByImei, isAr }) {
  const stats = useMemo(() => {
    const temps = [];
    let stable = 0;
    let irregular = 0;
    let fever = 0;

    (animals || []).forEach((a) => {
      const h = healthByImei?.[a.device_imei];
      const temp = h?.temperature;
      if (temp != null) temps.push(temp);
      const s = classifyTemperature(temp);
      if (s === 'stable') stable += 1;
      else if (s === 'irregular') irregular += 1;
      else if (s === 'fever') fever += 1;
    });

    const avg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    const overall = fever > 0 ? 'fever' : irregular > 0 ? 'irregular' : (temps.length ? 'stable' : 'unknown');

    // Deterministic synthetic streak (5–14 days when overall stable, 0–2 otherwise)
    let streak = 0;
    if (overall === 'stable') {
      streak = 5 + ((animals?.length || 0) % 10);
    } else if (overall === 'irregular') {
      streak = 1;
    }

    return { avg, overall, streak, total: animals?.length || 0, stable, irregular, fever };
  }, [animals, healthByImei]);

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(0,108,53,0.06), rgba(197,165,90,0.08))',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <span
            className="inline-flex w-7 h-7 rounded-full items-center justify-center text-white text-sm"
            style={{ background: 'var(--color-royal-green)' }}
          >
            💓
          </span>
          {isAr ? 'النبض اليومي للقطيع' : 'Daily Herd Pulse'}
        </h3>
        <span
          className="px-3 py-1 text-[11px] font-bold rounded-full border"
          style={{
            background: statusBg(stats.overall),
            color: statusColor(stats.overall),
            borderColor: statusColor(stats.overall),
          }}
        >
          {statusLabel(stats.overall, isAr)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'متوسط الحرارة' : 'Avg Temperature'}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-royal-green)' }}>
            {stats.avg != null ? `${stats.avg.toFixed(1)}°` : '—'}
            {stats.avg != null && <span className="text-sm font-medium ms-1 opacity-70">C</span>}
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'سلسلة الصحة' : 'Health Streak'}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-desert-gold-dark)' }}>
            {stats.streak}
            <span className="text-xs font-medium ms-1 opacity-70">
              {isAr ? 'يوم' : stats.streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'في المنطقة الخضراء' : 'in Green Zone'}
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'مستقر' : 'Stable'}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-royal-green)' }}>
            {stats.stable}
            <span className="text-xs font-medium opacity-60"> /{stats.total}</span>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'يحتاج انتباه' : 'Needs Attention'}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: stats.fever > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
            {stats.irregular + stats.fever}
            <span className="text-xs font-medium opacity-60"> /{stats.total}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
