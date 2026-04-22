import React from 'react';
import { getPassport } from '../utils/passportData';

function Field({ label, value, mono = false, gold = false }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <div className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-bold ${mono ? 'font-mono tracking-wider' : ''}`}
        style={{ color: gold ? 'var(--color-desert-gold-dark)' : 'var(--color-text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AssetPassport({ animal, isAr }) {
  if (!animal) return null;
  const p = getPassport(animal);
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header band */}
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: 'linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))',
          borderBottom: '3px solid var(--color-desert-gold)',
        }}
      >
        <div className="flex items-center gap-3 text-white">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid var(--color-desert-gold)' }}
          >
            🛂
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-desert-gold-light)' }}>
              {isAr ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
            </div>
            <div className="text-sm sm:text-base font-bold">
              {isAr ? 'جواز السفر الرقمي للأصل' : 'Digital Asset Passport'}
            </div>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full"
          style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
          title={isAr ? 'بيانات موثقة' : 'Verified data'}
        >
          ✓ {isAr ? 'بيانات موثقة' : 'Verified Data'}
        </span>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-3">
          <Field
            label={isAr ? 'رقم الشريحة الوطنية (Microchip ID)' : 'National Microchip ID'}
            value={p.microchip}
            mono
            gold
          />
        </div>
        <Field label={isAr ? 'الاسم' : 'Name'} value={animal.name} />
        <Field label={isAr ? 'النوع' : 'Species'} value={animal.species} />
        <Field label={isAr ? 'السلالة' : 'Breed'} value={isAr ? p.breed.ar : p.breed.en} />
        <Field label={isAr ? 'الجنس' : 'Gender'} value={isAr ? p.gender.ar : p.gender.en} />
        <Field
          label={isAr ? 'العمر' : 'Age'}
          value={isAr ? `${p.age} سنوات` : `${p.age} years`}
        />
        <Field label={isAr ? 'رقم الملكية' : 'Ownership ID'} value={p.ownership} mono />
        <div className="col-span-2 sm:col-span-3">
          <Field
            label={isAr ? 'IMEI الجهاز' : 'Device IMEI'}
            value={animal.device_imei}
            mono
          />
        </div>
        <div className="col-span-2 sm:col-span-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {isAr ? 'تاريخ التسجيل: ' : 'Registered on: '}
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {p.registered.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}
          </span>
        </div>
      </div>
    </section>
  );
}
