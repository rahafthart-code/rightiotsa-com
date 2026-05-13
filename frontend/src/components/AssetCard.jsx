import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLatestReading } from '../hooks/useLatestReading';

/**
 * Asset card with live sensor_readings + optional stable badge.
 * Pass `stable` (object with name/name_en/color/icon) to render a top-corner chip.
 * a pulsing red border when status === 'danger'.
 * Memoized to skip re-renders when neighbouring cards in the dashboard
 * grid update — only re-renders when this asset's data or onClick change.
 */
function AssetCard({ asset, onClick, stable }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const reading = useLatestReading(asset.id);

  const isDanger = asset.status === 'danger';
  const isWarning = asset.status === 'warning';

  const stability = Math.round(Number(asset.stability_index ?? 100));
  const statusColor = isDanger
    ? '#dc2626'
    : isWarning
    ? '#d4a017'
    : '#006c35';

  const statusLabel = isDanger
    ? (isAr ? 'خطر' : 'Danger')
    : isWarning
    ? (isAr ? 'تحذير' : 'Warning')
    : (isAr ? 'مستقر' : 'Stable');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-2xl overflow-hidden border transition-all ${
        isDanger ? 'animate-pulse-danger' : ''
      }`}
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderColor: isDanger ? '#dc2626' : isWarning ? '#d4a017' : 'rgb(30, 41, 59)',
        borderWidth: isDanger ? 2 : 1,
        boxShadow: isDanger ? '0 0 0 0 rgba(220,38,38,0.7)' : 'none',
      }}
    >
      <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
        {(asset.thumb_url || asset.image_url) ? (
          <img
            src={asset.thumb_url || asset.image_url}
            alt={asset.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width="400"
            height="300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {asset.species === 'Horse' ? '🐎' : asset.species === 'Falcon' ? '🦅' : '🐪'}
          </div>
        )}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ background: statusColor }}
        >
          {statusLabel}
        </div>
        {stable && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 max-w-[60%] truncate"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: stable.color || '#1D9E75',
              border: `1px solid ${(stable.color || '#1D9E75')}55`,
            }}
            title={isAr ? stable.name : stable.name_en || stable.name}
          >
            <span>{stable.icon === 'farm' ? '🌾' : stable.icon === 'ranch' ? '🐎' : stable.icon === 'desert' ? '⛺' : '🌴'}</span>
            <span className="truncate">{isAr ? stable.name : stable.name_en || stable.name}</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 truncate">{asset.name}</h3>
          <span className="text-lg font-extrabold" style={{ color: statusColor }}>
            {stability}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-950/60 rounded-md px-2 py-1.5">
            <div className="text-slate-500 uppercase text-[9px]">
              {isAr ? 'النبض' : 'Heart Rate'}
            </div>
            <div className="font-semibold text-rose-400">
              {reading?.heart_rate != null ? `${Math.round(reading.heart_rate)} bpm` : '—'}
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-md px-2 py-1.5">
            <div className="text-slate-500 uppercase text-[9px]">
              {isAr ? 'الحرارة' : 'Temperature'}
            </div>
            <div className="font-semibold text-amber-400">
              {reading?.temperature != null ? `${Number(reading.temperature).toFixed(1)}°C` : '—'}
            </div>
          </div>
        </div>

        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(30,41,59,0.8)' }}
        >
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${stability}%`, background: statusColor }}
          />
        </div>
      </div>
    </button>
  );
}

export default React.memo(AssetCard, (prev, next) => {
  const a = prev.asset || {};
  const b = next.asset || {};
  return (
    prev.onClick === next.onClick &&
    prev.stable?.id === next.stable?.id &&
    prev.stable?.color === next.stable?.color &&
    a.id === b.id &&
    a.name === b.name &&
    a.status === b.status &&
    a.stability_index === b.stability_index &&
    a.image_url === b.image_url &&
    a.species === b.species
  );
});
