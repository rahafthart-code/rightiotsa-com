import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * StabilityGauge — circular SVG gauge (0-100).
 *  - ≥70 royal green, 50-70 amber, <50 red
 *  - Shows status text: مستقر / تنبيه / خطر
 *
 * Props: value (0-100), size?=140, label?, showStatus?=true
 */
export default function StabilityGauge({
  value = 0,
  size = 140,
  label,
  showStatus = true,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  const color =
    v >= 70 ? '#006c35'
    : v >= 50 ? '#d97706'
    : '#dc2626';

  const statusAr =
    v >= 70 ? 'مستقر' : v >= 50 ? 'تنبيه' : 'خطر';
  const statusEn =
    v >= 70 ? 'Stable' : v >= 50 ? 'Warning' : 'Danger';

  const isDanger = v < 50;

  return (
    <div
      className="inline-flex flex-col items-center"
      role="img"
      aria-label={`${isAr ? statusAr : statusEn} ${v}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="rgba(212,175,55,0.18)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 800ms ease, stroke 400ms ease',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              filter: `drop-shadow(0 0 8px ${color}66)`,
              animation: isDanger ? 'sg-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="font-black leading-none"
            style={{ color, fontSize: size * 0.26 }}
          >
            {v}
          </div>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: '#7d8499' }}>
            %
          </div>
        </div>
      </div>

      {showStatus && (
        <div className="mt-2 text-center">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: `${color}22`,
              color,
              border: `1px solid ${color}55`,
            }}
          >
            {isAr ? statusAr : statusEn}
          </span>
          {label && (
            <div className="text-[10px] mt-1" style={{ color: '#7d8499' }}>
              {label}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes sg-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
