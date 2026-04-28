import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Half-circle speedometer gauge for portfolio stability index.
 * Themed with Saudi Royal Green (#006c35) + Desert Gold (#c5a55a).
 *
 * @param {number} value 0..100
 * @param {number} dangerCount
 * @param {number} warningCount
 * @param {number} stableCount
 */
export default function PortfolioGauge({
  value = 0,
  dangerCount = 0,
  warningCount = 0,
  stableCount = 0,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const v = Math.max(0, Math.min(100, Number(value) || 0));

  // Geometry: 200x110 viewport, half-circle from 180° → 0°
  const cx = 100;
  const cy = 100;
  const r = 80;

  // Needle: angle in degrees, 180° (left) = 0%, 0° (right) = 100%
  const angle = 180 - (v / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.92 * Math.cos(rad);
  const needleY = cy - r * 0.92 * Math.sin(rad);

  // Arc helper — describe full half-arc
  const arcPath = (startPct, endPct, radius = r) => {
    const sa = 180 - (startPct / 100) * 180;
    const ea = 180 - (endPct / 100) * 180;
    const sx = cx + radius * Math.cos((sa * Math.PI) / 180);
    const sy = cy - radius * Math.sin((sa * Math.PI) / 180);
    const ex = cx + radius * Math.cos((ea * Math.PI) / 180);
    const ey = cy - radius * Math.sin((ea * Math.PI) / 180);
    return `M ${sx} ${sy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`;
  };

  const valueColor =
    v >= 70 ? 'var(--color-royal-green, #006c35)'
    : v >= 40 ? '#c5a55a'
    : '#b91c1c';

  const label =
    v >= 70 ? (isAr ? 'مستقر' : 'Stable')
    : v >= 40 ? (isAr ? 'تحذير' : 'Warning')
    : (isAr ? 'خطر' : 'Danger');

  return (
    <div
      className="rounded-2xl p-5 shadow-md"
      style={{
        background: 'var(--color-bg-card, #ffffff)',
        border: '1px solid rgba(197,165,90,0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-sm font-bold tracking-wide"
          style={{ color: 'var(--color-royal-green, #006c35)' }}
        >
          {isAr ? 'صحة المحفظة' : 'Portfolio Health'}
        </h3>
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(197,165,90,0.15)',
            color: '#8a6d2a',
          }}
        >
          {isAr ? 'لحظي' : 'Live'}
        </span>
      </div>

      <div className="flex items-center justify-center" dir="ltr">
        <svg viewBox="0 0 200 120" className="w-full max-w-[280px] h-auto">
          {/* Track */}
          <path
            d={arcPath(0, 100)}
            fill="none"
            stroke="rgba(0,108,53,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Danger zone 0-40 */}
          <path d={arcPath(0, 40)} fill="none" stroke="#b91c1c" strokeWidth="14" strokeLinecap="round" opacity="0.85" />
          {/* Warning zone 40-70 */}
          <path d={arcPath(40, 70)} fill="none" stroke="#c5a55a" strokeWidth="14" strokeLinecap="round" opacity="0.9" />
          {/* Stable zone 70-100 */}
          <path d={arcPath(70, 100)} fill="none" stroke="#006c35" strokeWidth="14" strokeLinecap="round" />

          {/* Tick labels */}
          <text x="14" y="115" fontSize="9" fill="#8a8a8a" textAnchor="middle">0</text>
          <text x="100" y="22" fontSize="9" fill="#8a8a8a" textAnchor="middle">50</text>
          <text x="186" y="115" fontSize="9" fill="#8a8a8a" textAnchor="middle">100</text>

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={valueColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <circle cx={cx} cy={cy} r="7" fill={valueColor} />
          <circle cx={cx} cy={cy} r="3" fill="#fff" />
        </svg>
      </div>

      <div className="text-center -mt-2">
        <div className="text-4xl font-black" style={{ color: valueColor }}>
          {Math.round(v)}%
        </div>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: valueColor }}>
          {label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="rounded-lg py-2 px-1" style={{ background: 'rgba(0,108,53,0.08)' }}>
          <div className="text-lg font-extrabold" style={{ color: '#006c35' }}>{stableCount}</div>
          <div className="text-[10px] font-semibold" style={{ color: '#006c35' }}>
            {isAr ? 'مستقر' : 'Stable'}
          </div>
        </div>
        <div className="rounded-lg py-2 px-1" style={{ background: 'rgba(197,165,90,0.18)' }}>
          <div className="text-lg font-extrabold" style={{ color: '#8a6d2a' }}>{warningCount}</div>
          <div className="text-[10px] font-semibold" style={{ color: '#8a6d2a' }}>
            {isAr ? 'تحذير' : 'Warning'}
          </div>
        </div>
        <div className="rounded-lg py-2 px-1" style={{ background: 'rgba(185,28,28,0.10)' }}>
          <div className="text-lg font-extrabold" style={{ color: '#b91c1c' }}>{dangerCount}</div>
          <div className="text-[10px] font-semibold" style={{ color: '#b91c1c' }}>
            {isAr ? 'خطر' : 'Danger'}
          </div>
        </div>
      </div>
    </div>
  );
}
