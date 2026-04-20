import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  classifyTemperature,
  combineHealthStatus,
  statusBg,
  statusColor,
  statusLabel,
} from "../utils/healthStatus";

/**
 * Animated dual-line weekly chart (Temperature + Activity).
 * Pure SVG — no external chart deps. RTL-aware.
 */
export default function HealthChart({ data, isAr }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  // Animate stroke-dashoffset on mount / data change
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        {isAr ? 'لا توجد بيانات صحية' : 'No health data'}
      </div>
    );
  }

  const W = 520;
  const H = 200;
  const PAD_L = 36;
  const PAD_R = 36;
  const PAD_T = 16;
  const PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const temps = data.map((d) => d.temperature);
  const acts = data.map((d) => d.activity);
  const tMin = Math.min(...temps) - 0.5;
  const tMax = Math.max(...temps) + 0.5;
  const aMin = 0;
  const aMax = 100;

  const xAt = (i) => PAD_L + (i / (data.length - 1)) * innerW;
  const yTemp = (v) => PAD_T + innerH - ((v - tMin) / (tMax - tMin)) * innerH;
  const yAct = (v) => PAD_T + innerH - ((v - aMin) / (aMax - aMin)) * innerH;

  const buildPath = (yFn, vals) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yFn(v).toFixed(2)}`).join(' ');

  const tempPath = buildPath(yTemp, temps);
  const actPath = buildPath(yAct, acts);

  // Approx stroke length for animation
  const strokeLen = innerW * 1.4;
  const offset = strokeLen * (1 - progress);

  // Overall status from latest day
  const last = data[data.length - 1];
  const tStatus = classifyTemperature(last.temperature);
  const overall = combineHealthStatus(tStatus, 'stable');

  const dayLabel = (d) => {
    if (isAr) {
      const arDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
      return arDays[d.getDay()];
    }
    return d.toLocaleDateString('en', { weekday: 'short' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 text-[11px] font-bold rounded-full border"
            style={{
              background: statusBg(overall),
              color: statusColor(overall),
              borderColor: statusColor(overall),
            }}
          >
            ● {statusLabel(overall, isAr)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'متوسط الأسبوع' : 'Weekly avg'}: {(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-block w-3 h-0.5" style={{ background: 'var(--color-royal-green)' }} />
            {isAr ? 'الحرارة' : 'Temperature'}
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-block w-3 h-0.5" style={{ background: 'var(--color-desert-gold-dark)' }} />
            {isAr ? 'النشاط' : 'Activity'}
          </span>
        </div>
      </div>

      <div className="rounded-xl p-3 overflow-x-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320, maxHeight: 240 }}>
          <defs>
            <linearGradient id="tempArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-royal-green)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-royal-green)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={PAD_L} x2={W - PAD_R}
              y1={PAD_T + innerH * p} y2={PAD_T + innerH * p}
              stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 4"
            />
          ))}

          {/* Temperature area fill */}
          <path
            d={`${tempPath} L ${xAt(data.length - 1)} ${PAD_T + innerH} L ${xAt(0)} ${PAD_T + innerH} Z`}
            fill="url(#tempArea)"
            opacity={progress}
          />

          {/* Temperature line */}
          <path
            d={tempPath}
            fill="none"
            stroke="var(--color-royal-green)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeLen}
            strokeDashoffset={offset}
          />

          {/* Activity line */}
          <path
            d={actPath}
            fill="none"
            stroke="var(--color-desert-gold-dark)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeLen}
            strokeDashoffset={offset}
          />

          {/* Points */}
          {data.map((d, i) => (
            <g key={i} opacity={progress}>
              <circle cx={xAt(i)} cy={yTemp(d.temperature)} r="3.5" fill="var(--color-royal-green)" stroke="white" strokeWidth="1.5" />
              <circle cx={xAt(i)} cy={yAct(d.activity)} r="3" fill="var(--color-desert-gold-dark)" stroke="white" strokeWidth="1.5" />
            </g>
          ))}

          {/* X-axis day labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xAt(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-muted)"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              {dayLabel(d.date)}
            </text>
          ))}

          {/* Y-axis temp ticks (left) */}
          {[tMin, (tMin + tMax) / 2, tMax].map((v, i) => (
            <text
              key={i}
              x={PAD_L - 6}
              y={yTemp(v) + 3}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-royal-green)"
            >
              {v.toFixed(1)}°
            </text>
          ))}

          {/* Y-axis activity ticks (right) */}
          {[0, 50, 100].map((v, i) => (
            <text
              key={i}
              x={W - PAD_R + 6}
              y={yAct(v) + 3}
              textAnchor="start"
              fontSize="9"
              fill="var(--color-desert-gold-dark)"
            >
              {v}%
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
