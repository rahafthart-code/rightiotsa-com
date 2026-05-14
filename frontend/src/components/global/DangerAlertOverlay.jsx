import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, X, Heart, Thermometer } from 'lucide-react';

/**
 * DangerAlertOverlay — full-screen emergency overlay.
 *  - Asset photo with pulsing red ring
 *  - Live pulse + GPS coordinates
 *  - Two actions:
 *      1) اتصل بالطبيب البيطري  (tel:)
 *      2) تتبع الموقع الجغرافي الآن  (opens map)
 *
 * Props:
 *   asset: { id, name, image_url, photo_url, species, stability_index }
 *   reading?: { heart_rate, temperature, latitude, longitude, recorded_at }
 *   vetPhone?: string  (defaults to +966500000000)
 *   onClose: () => void
 *   onTrack?: () => void  (overrides default map open)
 */
export default function DangerAlertOverlay({
  asset,
  reading,
  vetPhone = '+966500000000',
  onClose,
  onTrack,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    if (!asset) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [asset, onClose]);

  if (!asset) return null;

  const stability = Math.round(Number(asset.stability_index ?? 0));
  const photo = asset.photo_url || asset.image_url;
  const speciesEmoji =
    asset.species === 'Horse' ? '•'
    : asset.species === 'Falcon' ? '•'
    : '•';

  const lat = reading?.latitude ?? reading?.gps_lat;
  const lng = reading?.longitude ?? reading?.gps_lng;

  const handleTrack = () => {
    if (onTrack) return onTrack();
    if (lat != null && lng != null) {
      window.open(
        `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`,
        '_blank',
        'noopener'
      );
    } else if (asset.id) {
      window.location.href = `/asset/${asset.id}`;
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dao-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(8,8,12,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'dao-fade 220ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #11182a 0%, #090d17 100%)',
          border: '2px solid #dc2626',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(220,38,38,0.45)',
          animation: 'dao-scale 280ms cubic-bezier(0.2,0.9,0.3,1.2)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(0,0,0,0.4)', color: '#f2efe3' }}
        >
          <X size={16} />
        </button>

        {/* Banner */}
        <div
          className="px-5 py-3 text-center"
          style={{
            background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)',
            color: '#fff',
            borderBottom: '2px solid #7f1d1d',
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-95">
            🚨 {isAr ? 'تنبيه طارئ' : 'Emergency Alert'}
          </div>
          <div className="text-sm font-bold mt-1">
            {isAr
              ? `مؤشر الاستقرار وصل إلى ${stability}%`
              : `Stability dropped to ${stability}%`}
          </div>
        </div>

        {/* Photo + name */}
        <div className="flex flex-col items-center pt-6 px-5">
          <div
            className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              border: '4px solid #dc2626',
              background: 'rgba(220,38,38,0.08)',
              animation: 'dao-ring 1.4s ease-in-out infinite',
            }}
          >
            {photo ? (
              <img src={photo} alt={asset.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">{speciesEmoji}</span>
            )}
          </div>

          <h2
            id="dao-title"
            className="mt-4 text-2xl font-bold text-center"
            style={{
              fontFamily: "'Playfair Display','Amiri','Cairo',Georgia,serif",
              color: '#d4af37',
              letterSpacing: '0.02em',
            }}
          >
            {asset.name}
          </h2>

          <div
            className="mt-2 text-7xl font-black leading-none"
            style={{ color: '#ef4444', textShadow: '0 2px 18px rgba(239,68,68,0.35)' }}
          >
            {stability}%
          </div>
        </div>

        {/* Live stats */}
        <div className="px-5 mt-5 grid grid-cols-2 gap-2">
          <Stat
            icon={<Heart size={14} style={{ color: '#ef4444' }} />}
            label={isAr ? 'النبض' : 'Heart Rate'}
            value={reading?.heart_rate != null
              ? `${Math.round(reading.heart_rate)} bpm` : '—'}
          />
          <Stat
            icon={<Thermometer size={14} style={{ color: '#f59e0b' }} />}
            label={isAr ? 'الحرارة' : 'Temp'}
            value={reading?.temperature != null
              ? `${Number(reading.temperature).toFixed(1)} °C` : '—'}
          />
          <Stat
            icon={<MapPin size={14} style={{ color: '#d4af37' }} />}
            label={isAr ? 'الموقع' : 'GPS'}
            value={lat != null && lng != null
              ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
              : '—'}
            wide
          />
        </div>

        {/* Actions */}
        <div className="p-5 mt-3 space-y-2">
          <a
            href={`tel:${vetPhone}`}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 10px 28px rgba(220,38,38,0.45)',
            }}
          >
            <Phone size={18} />
            {isAr ? 'اتصل بالطبيب البيطري' : 'Call the Veterinarian'}
          </a>

          <button
            type="button"
            onClick={handleTrack}
            className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg, #006c35 0%, #004d25 100%)',
              color: '#fff',
              border: '1px solid #d4af3766',
              boxShadow: '0 10px 28px rgba(0,108,53,0.45)',
            }}
          >
            <MapPin size={18} style={{ color: '#d4af37' }} />
            {isAr ? 'تتبع الموقع الجغرافي الآن' : 'Track Location Now'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold"
            style={{ color: '#7d8499', border: '1px solid #1c2640' }}
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dao-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dao-scale { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes dao-ring  {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
          50%     { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}

function Stat({ icon, label, value, wide }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 ${wide ? 'col-span-2' : ''}`}
      style={{ background: '#0a1020', border: '1px solid #1c2640' }}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: '#7d8499' }}>
          {label}
        </span>
      </div>
      <div className="font-bold text-sm mt-1" style={{ color: '#f2efe3' }}>
        {value}
      </div>
    </div>
  );
}
