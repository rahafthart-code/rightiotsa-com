import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLatestReading } from '../hooks/useLatestReading';

/**
 * DangerOverlay — full-screen emergency overlay shown when an asset
 * enters a danger state. Saudi Royal Green identity with critical-red accents.
 *
 * Props:
 *   asset: { id, name, image_url, photo_url, species, stability_index }
 *   onClose: () => void
 *   vetPhone?: string  (defaults to +966500000000)
 *   recentReadings?: Array<{ heart_rate, temperature, latitude, longitude, recorded_at }>
 *     If omitted, the latest live reading is shown.
 */
export default function DangerOverlay({
  asset,
  onClose,
  vetPhone = '+966500000000',
  recentReadings,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Always call the hook (rules of hooks); pass null when no asset.
  const liveReading = useLatestReading(asset?.id ?? null);

  // ESC closes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!asset) return null;

  const stability = Math.round(Number(asset.stability_index ?? 0));
  const photo = asset.photo_url || asset.image_url;
  const speciesEmoji =
    asset.species === 'Horse' ? '•'
    : asset.species === 'Falcon' ? '•'
    : '•';

  // Build the "last 3 readings" list. If caller didn't pass any,
  // fall back to the single live reading.
  const readings = (recentReadings && recentReadings.length > 0)
    ? recentReadings.slice(0, 3)
    : (liveReading ? [liveReading] : []);

  const callVet = () => {
    window.open(`tel:${vetPhone}`, '_self');
  };

  const fmtTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString(isAr ? 'ar-SA' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const fmtCoord = (n) =>
    typeof n === 'number' ? n.toFixed(4) : (n ? Number(n).toFixed(4) : '—');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-danger-in"
      style={{
        background: 'rgba(8, 8, 12, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="danger-overlay-title"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-pulse-danger"
        style={{
          background:
            'linear-gradient(180deg, #fffaf0 0%, #fdf3df 100%)',
          border: '3px solid #dc2626',
          boxShadow:
            '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(220,38,38,0.45)',
        }}
      >
        {/* ─── Red banner ──────────────────────────── */}
        <div
          className="px-5 py-3 text-center"
          style={{
            background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)',
            color: '#fff',
            borderBottom: '2px solid #7f1d1d',
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-90">
            🚨 {isAr ? 'تنبيه طارئ' : 'Emergency Alert'}
          </div>
          <div className="text-sm font-bold mt-1">
            {isAr
              ? `مؤشر الاستقرار وصل إلى ${stability}%`
              : `Stability index dropped to ${stability}%`}
          </div>
        </div>

        {/* ─── Asset photo with pulsing red ring ───── */}
        <div className="flex flex-col items-center pt-6 px-5">
          <div
            className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center animate-pulse-ring"
            style={{
              border: '4px solid #dc2626',
              background: 'rgba(220,38,38,0.08)',
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">{speciesEmoji}</span>
            )}
          </div>

          {/* Asset name — serif gold */}
          <h2
            id="danger-overlay-title"
            className="mt-4 text-2xl font-bold text-center"
            style={{
              fontFamily:
                "'Playfair Display', 'Amiri', 'Cairo', Georgia, serif",
              color: 'var(--color-desert-gold-dark, #8a6d2a)',
              letterSpacing: '0.02em',
            }}
          >
            {asset.name}
          </h2>

          {/* Stability index — large red number */}
          <div className="mt-3 text-center">
            <div
              className="text-[10px] uppercase tracking-widest font-bold"
              style={{ color: '#7f1d1d' }}
            >
              {isAr ? 'مؤشر الاستقرار' : 'Stability Index'}
            </div>
            <div
              className="text-7xl font-black leading-none mt-1"
              style={{
                color: '#dc2626',
                textShadow: '0 2px 18px rgba(220,38,38,0.35)',
              }}
            >
              {stability}%
            </div>
          </div>
        </div>

        {/* ─── Last 3 sensor readings ───────────────── */}
        <div className="px-5 mt-5">
          <div
            className="text-[10px] uppercase tracking-widest font-bold mb-2"
            style={{ color: '#6b6b6b' }}
          >
            {isAr ? 'آخر القراءات' : 'Recent Readings'}
          </div>
          {readings.length === 0 ? (
            <div
              className="text-center py-3 text-xs rounded-xl"
              style={{
                background: 'rgba(0,0,0,0.04)',
                color: '#6b6b6b',
              }}
            >
              {isAr ? 'لا توجد قراءات متاحة' : 'No readings available'}
            </div>
          ) : (
            <div className="space-y-2">
              {readings.map((r, i) => (
                <div
                  key={r.id ?? i}
                  className="rounded-xl p-3 grid grid-cols-3 gap-2 text-center"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(220,38,38,0.18)',
                  }}
                >
                  <Stat
                    label={isAr ? 'النبض' : 'HR'}
                    value={
                      r.heart_rate != null
                        ? `${Math.round(Number(r.heart_rate))} bpm`
                        : '—'
                    }
                    color="#b91c1c"
                  />
                  <Stat
                    label={isAr ? 'الحرارة' : 'Temp'}
                    value={
                      r.temperature != null
                        ? `${Number(r.temperature).toFixed(1)}°C`
                        : '—'
                    }
                    color="#c2410c"
                  />
                  <Stat
                    label={isAr ? 'الموقع' : 'GPS'}
                    value={
                      r.latitude != null && r.longitude != null
                        ? `${fmtCoord(r.latitude)}, ${fmtCoord(r.longitude)}`
                        : (r.gps_lat != null && r.gps_lng != null
                            ? `${fmtCoord(r.gps_lat)}, ${fmtCoord(r.gps_lng)}`
                            : '—')
                    }
                    color="#006c35"
                    small
                  />
                  {r.recorded_at && (
                    <div
                      className="col-span-3 text-[10px] mt-1"
                      style={{ color: '#8a8a8a' }}
                    >
                      {fmtTime(r.recorded_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Action buttons ───────────────────────── */}
        <div className="p-5 mt-2 space-y-2">
          <button
            type="button"
            onClick={callVet}
            className="w-full py-4 rounded-xl text-base font-bold text-white transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 10px 28px rgba(220,38,38,0.45)',
            }}
          >
            📞 {isAr ? 'اتصل بالطبيب البيطري' : 'Call the Veterinarian'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: 'transparent',
              color: '#6b6b6b',
              border: '1px solid rgba(0,0,0,0.15)',
            }}
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, small }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="text-[9px] uppercase tracking-wider font-bold"
        style={{ color: '#8a8a8a' }}
      >
        {label}
      </div>
      <div
        className={`font-bold leading-tight ${small ? 'text-[11px]' : 'text-sm'}`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
