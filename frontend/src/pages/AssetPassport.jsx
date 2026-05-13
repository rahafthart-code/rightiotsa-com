import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { useLatestReading } from '../hooks/useLatestReading';
import logoImage from '../assets/logo-transparent.png';
import { exportAssetPassportPDF } from '../utils/passportPdf';
import { toast } from 'sonner';

/**
 * Asset Passport — identity, live vitals, and 30-day stability history chart.
 * Saudi Royal Green identity, RTL-aware, uses .maybeSingle() to handle missing data.
 */
export default function AssetPassport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [asset, setAsset] = useState(null);
  const [passport, setPassport] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reading = useLatestReading(id);

  const handleExportPDF = async () => {
    if (!asset) return;
    setExporting(true);
    try {
      await exportAssetPassportPDF({ asset, passport });
      toast.success(isAr ? 'تم تصدير الجواز الرقمي' : 'Digital passport exported');
    } catch (e) {
      console.error(e);
      toast.error(isAr ? 'تعذّر تصدير الملف' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      supabase.from('assets').select('*').eq('id', id).maybeSingle(),
      supabase.from('asset_passports').select('*').eq('asset_id', id).maybeSingle(),
      supabase
        .from('stability_snapshots')
        .select('final_index, snapped_at, status_flag')
        .eq('asset_id', id)
        .order('snapped_at', { ascending: true })
        .limit(720),
    ]).then(([a, p, s]) => {
      if (!active) return;
      if (!a.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setAsset(a.data);
      setPassport(p.data ?? null);
      setSnapshots(
        (s.data ?? []).map((r) => ({
          time: new Date(r.snapped_at).toLocaleDateString(
            isAr ? 'ar-SA' : 'en-GB',
            { month: 'short', day: 'numeric' }
          ),
          index: Number(r.final_index) || 0,
          flag: r.status_flag,
        }))
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, isAr]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary, #faf7f0)' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div
          className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#006c35', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--color-bg-primary, #faf7f0)' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔎</div>
          <h2 className="text-xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'الأصل غير موجود' : 'Asset not found'}
          </h2>
          <p className="text-sm mt-2" style={{ color: '#6b6b6b' }}>
            {isAr
              ? 'لم نعثر على بيانات لهذا الأصل. ربما تم حذفه.'
              : 'We could not find any data for this asset. It may have been removed.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-5 px-5 py-2 rounded-lg text-white font-bold"
            style={{ background: '#006c35' }}
          >
            {isAr ? 'العودة للوحة' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const stability = Math.round(Number(asset.stability_index ?? 0));
  const statusColor =
    asset.status === 'danger' ? '#b91c1c'
    : asset.status === 'warning' ? '#c5a55a'
    : '#006c35';

  const speciesEmoji =
    asset.species === 'Horse' ? '🐎'
    : asset.species === 'Falcon' ? '🦅'
    : '🐪';

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, var(--color-bg-primary, #faf7f0) 0%, #f3ecd8 100%)',
        color: 'var(--color-text-primary, #1a1a1a)',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{
          background: 'var(--color-royal-green, #006c35)',
          borderBottom: '3px solid var(--color-desert-gold, #c5a55a)',
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label={isAr ? 'رجوع' : 'Back'}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {isAr ? '→' : '←'}
            </button>
            <img src={logoImage} alt="Right" className="h-8 w-auto" style={{ objectFit: 'contain' }} />
            <div>
              <div className="text-sm font-bold text-white">
                {isAr ? 'جواز الأصل' : 'Asset Passport'}
              </div>
              <div
                className="text-[11px]"
                style={{ color: 'var(--color-desert-gold-light, #e6d5a8)' }}
              >
                {asset.name}
              </div>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
            style={{ background: statusColor }}
          >
            {asset.status === 'danger'
              ? (isAr ? 'خطر' : 'Danger')
              : asset.status === 'warning'
              ? (isAr ? 'تحذير' : 'Warning')
              : (isAr ? 'مستقر' : 'Stable')}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ─── Identity card ─────────────────────────── */}
        <section
          className="rounded-2xl overflow-hidden shadow-md grid grid-cols-1 sm:grid-cols-3 gap-0"
          style={{
            background: '#fff',
            border: '1px solid rgba(197,165,90,0.3)',
          }}
        >
          <div
            className="aspect-[4/3] sm:aspect-auto sm:col-span-1 flex items-center justify-center"
            style={{ background: 'rgba(0,108,53,0.06)' }}
          >
            {asset.image_url ? (
              <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-7xl">{speciesEmoji}</div>
            )}
          </div>

          <div className="sm:col-span-2 p-5 space-y-3">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: '#006c35' }}>
                {asset.name}
              </h1>
              <p className="text-xs" style={{ color: '#6b6b6b' }}>
                {asset.species} {asset.serial_number ? `· ${asset.serial_number}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <Field label={isAr ? 'مؤشر الاستقرار' : 'Stability'} value={`${stability}%`} accent={statusColor} />
              <Field
                label={isAr ? 'النبض' : 'Heart Rate'}
                value={reading?.heart_rate != null ? `${Math.round(reading.heart_rate)} bpm` : '—'}
              />
              <Field
                label={isAr ? 'الحرارة' : 'Temperature'}
                value={reading?.temperature != null ? `${Number(reading.temperature).toFixed(1)}°C` : '—'}
              />
              <Field
                label={isAr ? 'تاريخ الميلاد' : 'Birth Date'}
                value={asset.birth_date || '—'}
              />
              <Field
                label={isAr ? 'الجنس' : 'Gender'}
                value={passport?.gender || '—'}
              />
              <Field
                label={isAr ? 'رقم الجواز' : 'Passport No.'}
                value={passport?.passport_no || '—'}
              />
            </div>

            {asset.notes && (
              <p className="text-xs italic mt-2" style={{ color: '#6b6b6b' }}>
                {asset.notes}
              </p>
            )}
          </div>
        </section>

        {/* ─── Passport details ────────────────────────── */}
        {passport && (
          <section
            className="rounded-2xl p-5 shadow-md"
            style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: '#006c35' }}>
              {isAr ? 'البيانات الرسمية' : 'Official Records'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Field label={isAr ? 'السلالة' : 'Bloodline'} value={passport.bloodline || '—'} />
              <Field label={isAr ? 'الوزن' : 'Weight'} value={passport.weight_kg ? `${passport.weight_kg} kg` : '—'} />
              <Field label={isAr ? 'الطول' : 'Height'} value={passport.height_cm ? `${passport.height_cm} cm` : '—'} />
              <Field label={isAr ? 'الشريحة' : 'Microchip'} value={passport.microchip_id || '—'} />
              <Field label={isAr ? 'جهة الإصدار' : 'Issuer'} value={passport.issuing_authority || '—'} />
              <Field label={isAr ? 'الطبيب البيطري' : 'Veterinarian'} value={passport.veterinarian_id || '—'} />
              <Field
                label={isAr ? 'الإصدار' : 'Issued'}
                value={passport.issued_at ? new Date(passport.issued_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB') : '—'}
              />
              <Field
                label={isAr ? 'الانتهاء' : 'Expires'}
                value={passport.expires_at ? new Date(passport.expires_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB') : '—'}
              />
            </div>
          </section>
        )}

        {/* ─── Stability chart ─────────────────────────── */}
        <section
          className="rounded-2xl p-5 shadow-md"
          style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: '#006c35' }}>
              {isAr ? 'مؤشر الاستقرار — آخر 30 يوم' : 'Stability Index — Last 30 Days'}
            </h2>
            <span className="text-[11px] font-semibold" style={{ color: '#6b6b6b' }}>
              {snapshots.length} {isAr ? 'قراءة' : 'points'}
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: '#6b6b6b' }}>
              {isAr ? 'لا توجد بيانات تاريخية بعد' : 'No historical data yet'}
            </div>
          ) : (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshots} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b6b6b' }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b6b6b' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid rgba(0,108,53,0.3)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine y={70} stroke="#c5a55a" strokeDasharray="4 4" />
                  <ReferenceLine y={50} stroke="#b91c1c" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#006c35"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#006c35' }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: '#6b6b6b' }}>
            <Legend color="#006c35" label={isAr ? 'مستقر ≥ 70%' : 'Stable ≥ 70%'} />
            <Legend color="#c5a55a" label={isAr ? 'تحذير 50–70%' : 'Warning 50–70%'} dashed />
            <Legend color="#b91c1c" label={isAr ? 'خطر < 50%' : 'Danger < 50%'} dashed />
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, accent }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: 'rgba(0,108,53,0.05)', border: '1px solid rgba(0,108,53,0.08)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b6b6b' }}>
        {label}
      </div>
      <div className="text-sm font-bold" style={{ color: accent || '#1a1a1a' }}>
        {value}
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-5 h-0.5"
        style={{
          background: color,
          ...(dashed ? { borderTop: `2px dashed ${color}`, background: 'transparent', height: 0 } : {}),
        }}
      />
      <span>{label}</span>
    </div>
  );
}
