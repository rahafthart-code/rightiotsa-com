import React, { useEffect } from 'react';
import { getPassport } from '../utils/passportData';

/**
 * Official passport export — print-ready modal with Right InsurTech branding.
 * Uses window.print() with a scoped @page style so the user can "Save as PDF".
 */
export default function PassportExportModal({ open, onClose, animal, isAr }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !animal) return null;
  const p = getPassport(animal);
  const issued = new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.65)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Print-only style: only the passport sheet prints. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          #right-passport-sheet, #right-passport-sheet * { visibility: visible !important; }
          #right-passport-sheet {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        className="relative bg-white w-full max-w-3xl max-h-full overflow-y-auto rounded-none sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal toolbar (hidden on print) */}
        <div
          className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b"
          style={{
            background: 'linear-gradient(135deg, #006c35, #00582b)',
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <div className="text-white text-sm font-bold">
            {isAr ? 'معاينة الجواز الرقمي الرسمي' : 'Official Digital Passport Preview'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold rounded-lg"
              style={{ background: '#c5a55a', color: '#00382a', border: '1px solid #f4e4bc' }}
            >
              ⬇ {isAr ? 'تحميل / طباعة (PDF)' : 'Download / Print (PDF)'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              ✕ {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

        {/* Printable passport sheet */}
        <div id="right-passport-sheet" className="bg-white text-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Top emblem band */}
          <div
            className="px-8 py-6 flex items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, #006c35, #003f1f)',
              borderBottom: '4px solid #c5a55a',
              color: 'white',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Right InsurTech emblem (inline SVG) */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid #c5a55a' }}
              >
                <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden>
                  <defs>
                    <linearGradient id="rt-g" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f4e4bc" />
                      <stop offset="100%" stopColor="#c5a55a" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M32 4 L54 14 V32 C54 46 44 56 32 60 C20 56 10 46 10 32 V14 Z"
                    fill="none"
                    stroke="url(#rt-g)"
                    strokeWidth="2.5"
                  />
                  <text
                    x="32" y="40"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="800"
                    fill="url(#rt-g)"
                    fontFamily="Cairo, sans-serif"
                  >R</text>
                </svg>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#f4e4bc' }}>
                  {isAr ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
                </div>
                <div className="text-lg font-extrabold mt-0.5">
                  {isAr ? 'رايت إنشورتك' : 'Right InsurTech'}
                </div>
                <div className="text-[11px]" style={{ color: '#f4e4bc' }}>
                  {isAr ? 'منصة التأمين الذكي للحلال والأصول' : 'Smart Insurance Platform for Livestock & Assets'}
                </div>
              </div>
            </div>
            <div className="text-end">
              <div
                className="inline-block px-3 py-1 text-[11px] font-bold rounded-full"
                style={{ background: '#c5a55a', color: '#00382a' }}
              >
                ✓ {isAr ? 'وثيقة موثّقة رسمياً' : 'Officially Verified Document'}
              </div>
              <div className="text-[10px] mt-2" style={{ color: '#f4e4bc' }}>
                {isAr ? 'رقم الإصدار' : 'Doc No.'}: RT-PSP-{p.ownership.replace('RT-', '')}
              </div>
            </div>
          </div>

          {/* Title strip */}
          <div className="px-8 py-4" style={{ background: 'linear-gradient(90deg, rgba(0,108,53,0.06), rgba(197,165,90,0.06))', borderBottom: '1px solid #e5e7eb' }}>
            <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#006c35' }}>
              {isAr ? 'جواز السفر الرقمي للأصل الحيواني' : 'Digital Passport for Animal Asset'}
            </div>
            <div className="text-2xl font-extrabold mt-1" style={{ color: '#0f172a' }}>
              {animal.name}
            </div>
          </div>

          {/* Body grid */}
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Row label={isAr ? 'النوع' : 'Species'} value={animal.species} />
            <Row label={isAr ? 'السلالة' : 'Breed'} value={isAr ? p.breed.ar : p.breed.en} />
            <Row label={isAr ? 'الجنس' : 'Gender'} value={isAr ? p.gender.ar : p.gender.en} />
            <Row label={isAr ? 'العمر' : 'Age'} value={isAr ? `${p.age} سنوات` : `${p.age} years`} />
            <Row label={isAr ? 'رقم الملكية' : 'Ownership ID'} value={p.ownership} mono />
            <Row label={isAr ? 'تاريخ التسجيل' : 'Registered On'} value={p.registered.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')} />

            <div className="sm:col-span-2 mt-2">
              <Row
                label={isAr ? 'رقم الشريحة الوطنية (Microchip ID)' : 'National Microchip ID'}
                value={p.microchip}
                mono
                accent
              />
            </div>
            <div className="sm:col-span-2">
              <Row label={isAr ? 'IMEI الجهاز' : 'Device IMEI'} value={animal.device_imei} mono />
            </div>
          </div>

          {/* Authenticity panel */}
          <div className="mx-8 mb-6 rounded-xl p-4 flex items-center gap-4" style={{ background: '#f7f5ee', border: '1.5px dashed #c5a55a' }}>
            {/* Faux QR */}
            <div
              className="w-20 h-20 rounded-md grid grid-cols-6 grid-rows-6 gap-px shrink-0"
              style={{ background: '#0f172a', padding: 4 }}
              aria-hidden
            >
              {Array.from({ length: 36 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    background: ((i * 7 + p.microchip.length) % 3 === 0) ? '#c5a55a' : '#ffffff',
                    display: 'block',
                  }}
                />
              ))}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: '#006c35' }}>
                {isAr ? 'تم التحقق من الوثيقة بنجاح' : 'Document Successfully Verified'}
              </div>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#475569' }}>
                {isAr
                  ? 'هذه الوثيقة صادرة إلكترونياً من منصة رايت إنشورتك ومرتبطة بسجل ملكية رقمي. أي تعديل غير معتمد يُعد لاغياً.'
                  : 'This document is issued electronically by Right InsurTech and is linked to a digital ownership record. Any unauthorized modification is invalid.'}
              </p>
              <div className="text-[10px] mt-2 font-mono" style={{ color: '#94a3b8' }}>
                {isAr ? 'رمز التحقق' : 'Verification'}: RT-{p.microchip.replace(/\s/g, '')}-{issued.getFullYear()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-8 py-4 flex items-center justify-between text-[10px]"
            style={{ borderTop: '3px solid #c5a55a', background: '#fafafa', color: '#475569' }}
          >
            <div>
              {isAr ? 'تاريخ الإصدار' : 'Issued on'}:{' '}
              <span className="font-semibold" style={{ color: '#0f172a' }}>
                {issued.toLocaleString(isAr ? 'ar-SA' : 'en-GB')}
              </span>
            </div>
            <div className="text-end">
              <div className="font-bold" style={{ color: '#006c35' }}>Right InsurTech © {issued.getFullYear()}</div>
              <div>{isAr ? 'تحديث سجلات الملكية الرقمية' : 'Digital Ownership Registry'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false, accent = false }) {
  return (
    <div>
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: '#94a3b8' }}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-[15px] ${mono ? 'font-mono tracking-wider' : ''}`}
        style={{
          color: accent ? '#006c35' : '#0f172a',
          fontWeight: accent ? 800 : 600,
          borderBottom: accent ? '2px solid #c5a55a' : '1px solid #e5e7eb',
          paddingBottom: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
