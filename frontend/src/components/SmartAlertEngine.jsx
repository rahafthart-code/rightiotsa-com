import React, { useMemo } from 'react';
import { buildWeeklySeries } from '../utils/healthStatus';

/**
 * Smart Alert Engine — analyzes vital-signs trend (temperature & activity)
 * and surfaces an "administrative alert" when irregular fluctuations are detected.
 *
 * Heuristics (intentionally conservative for demo):
 *   - Sustained temperature elevation: ≥3 of last 5 days above 38.6°C  → fever risk
 *   - High variability: stdev of weekly temps > 0.7°C                  → fluctuation
 *   - Activity collapse: latest activity < 25 while weekly avg > 50    → lethargy
 */
function stdev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((acc, x) => acc + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

export function analyzeVitals(series) {
  if (!series || series.length === 0) return { level: 'stable', reasons: [] };
  const reasons = [];
  const last5 = series.slice(-5);
  const elevatedCount = last5.filter((d) => d.temperature > 38.6).length;
  if (elevatedCount >= 3) reasons.push('elevated_temp');

  const tempStd = stdev(series.map((d) => d.temperature));
  if (tempStd > 0.7) reasons.push('temp_volatility');

  const acts = series.map((d) => d.activity);
  const actAvg = acts.reduce((a, b) => a + b, 0) / acts.length;
  const lastAct = acts[acts.length - 1];
  if (actAvg > 50 && lastAct < 25) reasons.push('activity_drop');

  let level = 'stable';
  if (reasons.includes('elevated_temp')) level = 'critical';
  else if (reasons.length > 0) level = 'warning';
  return { level, reasons, tempStd, elevatedCount, lastAct, actAvg };
}

const REASON_COPY = {
  elevated_temp: {
    ar: 'ارتفاع متواصل في درجة الحرارة خلال آخر 5 أيام',
    en: 'Sustained temperature elevation over last 5 days',
  },
  temp_volatility: {
    ar: 'تذبذب غير اعتيادي في قراءات الحرارة',
    en: 'Unusual variability in temperature readings',
  },
  activity_drop: {
    ar: 'انخفاض حاد في مستوى النشاط البدني',
    en: 'Sharp drop in physical activity level',
  },
};

export default function SmartAlertEngine({ animal, healthData, isAr, onOpenHealth }) {
  const series = useMemo(() => {
    if (!animal) return [];
    const baseTemp = healthData?.temperature ?? 37.2;
    const seed = (animal.id || 0) + (animal.device_imei?.length || 0);
    return buildWeeklySeries(baseTemp, 55, seed);
  }, [animal, healthData]);

  const analysis = useMemo(() => analyzeVitals(series), [series]);
  if (!animal || analysis.level === 'stable') return null;

  const isCritical = analysis.level === 'critical';
  // Warning palette (orange) per spec; critical escalates intensity.
  const accent = isCritical ? '#c2410c' : '#d97706';
  const accentBg = isCritical ? 'rgba(194,65,12,0.10)' : 'rgba(217,119,6,0.10)';
  const accentBorder = isCritical ? 'rgba(194,65,12,0.35)' : 'rgba(217,119,6,0.35)';

  return (
    <section
      className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accentBg}, var(--color-bg-card))`,
        border: `1px solid ${accentBorder}`,
        boxShadow: `0 2px 14px ${accentBg}`,
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        className="absolute inset-y-0 start-0 w-1.5"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-3 ps-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: accent, color: 'white' }}
          aria-hidden
        >
          ⚠
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold" style={{ color: accent }}>
              {isAr ? 'تنبيه إداري: تذبذب في المؤشرات الحيوية' : 'Administrative Alert: Vital-Sign Fluctuation'}
            </h3>
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full"
              style={{ background: accent, color: 'white' }}
            >
              {isCritical
                ? (isAr ? 'أولوية عالية' : 'High Priority')
                : (isAr ? 'متابعة موصى بها' : 'Recommended Follow-up')}
            </span>
          </div>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {isAr
              ? `تم رصد قراءات غير معتادة على الأصل "${animal.name}". ننصح بمراجعة التقرير الصحي الأسبوعي.`
              : `Unusual readings detected on asset "${animal.name}". Please review the weekly health report.`}
          </p>

          <ul className="mt-3 space-y-1.5">
            {analysis.reasons.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: accent }}
                />
                <span>{isAr ? REASON_COPY[r].ar : REASON_COPY[r].en}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenHealth}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white"
              style={{ background: accent, border: '1px solid var(--color-desert-gold)' }}
            >
              {isAr ? 'فتح التقرير الصحي' : 'Open Health Report'}
            </button>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {isAr ? 'تم التحقق من البيانات تلقائياً بواسطة محرك التنبيهات الذكي' : 'Auto-verified by Smart Alert Engine'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
