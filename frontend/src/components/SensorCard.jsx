import React from "react";

export default function SensorCard({ icon, label, value, unit, subtitle, color = "var(--color-royal-green)", bgColor }) {
  return (
    <div className="rounded-xl p-4 transition-all hover:shadow-md"
      style={{
        background: bgColor || 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-medium ml-1 opacity-70">{unit}</span>}
      </div>
      {subtitle && (
        <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
