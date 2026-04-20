/**
 * Health status helpers for assets — temperature & activity classification.
 * Returns one of: 'stable' (green), 'irregular' (yellow), 'fever' (red).
 */

const TEMP_FEVER_C = 39.5; // > 39.5°C → fever
const TEMP_HIGH_C = 38.8;  // > 38.8°C → irregular
const TEMP_LOW_C = 36.0;   // < 36°C → irregular

export function classifyTemperature(temp) {
  if (temp == null || Number.isNaN(temp)) return 'unknown';
  if (temp >= TEMP_FEVER_C) return 'fever';
  if (temp >= TEMP_HIGH_C || temp <= TEMP_LOW_C) return 'irregular';
  return 'stable';
}

export function classifyActivity(value) {
  // value can be 0..100 percentile
  if (value == null) return 'unknown';
  if (value > 90) return 'irregular'; // overexertion
  if (value < 10) return 'irregular'; // lethargic
  return 'stable';
}

export function combineHealthStatus(tempStatus, activityStatus) {
  if (tempStatus === 'fever' || activityStatus === 'fever') return 'fever';
  if (tempStatus === 'irregular' || activityStatus === 'irregular') return 'irregular';
  if (tempStatus === 'unknown' && activityStatus === 'unknown') return 'unknown';
  return 'stable';
}

export function statusColor(status) {
  switch (status) {
    case 'stable': return 'var(--color-royal-green)';
    case 'irregular': return 'var(--color-warning)';
    case 'fever': return 'var(--color-danger)';
    default: return 'var(--color-text-muted)';
  }
}

export function statusBg(status) {
  switch (status) {
    case 'stable': return 'var(--color-success-bg)';
    case 'irregular': return 'var(--color-warning-bg)';
    case 'fever': return 'var(--color-danger-bg)';
    default: return 'var(--color-bg-secondary)';
  }
}

export function statusLabel(status, isAr) {
  const map = {
    stable: isAr ? 'مستقر' : 'Stable',
    irregular: isAr ? 'غير منتظم' : 'Irregular',
    fever: isAr ? 'حمى محتملة' : 'Potential Fever',
    unknown: isAr ? 'غير متاح' : 'Unknown',
  };
  return map[status] || map.unknown;
}

/**
 * Build a synthetic 7-day series from a base value (deterministic by seed).
 * Used as fallback when only a single latest reading is available.
 */
export function buildWeeklySeries(baseTemp = 37.2, baseActivity = 55, seed = 0) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // pseudo-random, deterministic
    const r1 = Math.sin((seed + i) * 12.9898) * 43758.5453;
    const r2 = Math.sin((seed + i) * 78.233) * 43758.5453;
    const tempJitter = ((r1 - Math.floor(r1)) - 0.5) * 1.6;
    const actJitter = ((r2 - Math.floor(r2)) - 0.5) * 30;
    days.push({
      date: d,
      temperature: +(baseTemp + tempJitter).toFixed(2),
      activity: Math.max(5, Math.min(95, Math.round(baseActivity + actJitter))),
    });
  }
  return days;
}
