import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLatestReading } from '../hooks/useLatestReading';

/**
 * Full-screen overlay shown when an asset enters 'danger' status.
 */
export default function DangerAlert({ asset, onClose }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const reading = useLatestReading(asset?.id);

  if (!asset) return null;

  const stability = Math.round(Number(asset.stability_index ?? 0));

  const callVet = () => {
    window.open('tel:+966500000000', '_self');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(127, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden border-4 animate-pulse-danger"
        style={{
          background: 'linear-gradient(180deg, #1a0303 0%, #0a0000 100%)',
          borderColor: '#dc2626',
          boxShadow: '0 0 60px rgba(220,38,38,0.8)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/80"
        >
          ×
        </button>

        <div className="relative aspect-[4/3] bg-black">
          {asset.image_url ? (
            <img
              src={asset.image_url}
              alt={asset.name}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {asset.species === 'Horse' ? '•' : asset.species === 'Falcon' ? '•' : '•'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-[11px] uppercase font-bold text-red-400 tracking-widest">
              🚨 {isAr ? 'تنبيه خطر' : 'Danger Alert'}
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">{asset.name}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-red-300">
              {isAr ? 'مؤشر الاستقرار' : 'Stability Index'}
            </div>
            <div className="text-6xl font-black text-red-500 mt-1">{stability}%</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/40 border border-red-900 px-3 py-2">
              <div className="text-[10px] uppercase text-red-300">
                {isAr ? 'النبض' : 'Heart Rate'}
              </div>
              <div className="text-lg font-bold text-white">
                {reading?.heart_rate != null ? `${Math.round(reading.heart_rate)} bpm` : '—'}
              </div>
            </div>
            <div className="rounded-xl bg-black/40 border border-red-900 px-3 py-2">
              <div className="text-[10px] uppercase text-red-300">
                {isAr ? 'الحرارة' : 'Temperature'}
              </div>
              <div className="text-lg font-bold text-white">
                {reading?.temperature != null ? `${Number(reading.temperature).toFixed(1)}°C` : '—'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={callVet}
            className="w-full py-4 rounded-xl text-base font-bold text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #dc2626, #991b1b)',
              boxShadow: '0 8px 24px rgba(220,38,38,0.5)',
            }}
          >
            📞 {isAr ? 'اتصل بالطبيب البيطري' : 'Call the Veterinarian'}
          </button>
        </div>
      </div>
    </div>
  );
}
