import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, ShieldCheck, Fingerprint, Dna, Stamp, Syringe, Calendar, Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import logoWhite from '../assets/logo-white.png';

/**
 * DigitalPassport — Luxury Glassmorphism passport view.
 * Reads from `assets` + `asset_passports` (1-to-1 by asset_id).
 */
export default function DigitalPassport() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [asset, setAsset] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);

        // Verify the user is signed in — RLS only returns rows owned by them.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error(isAr ? 'يجب تسجيل الدخول لعرض جواز السفر' : 'Please sign in to view this passport');
        }

        const { data: a, error: aErr } = await supabase
          .from('assets')
          .select('id, owner_id, name, species, image_url, photo_url, registration_no, serial_number, status, stability_index, is_insured, insured_value')
          .eq('id', id)
          .maybeSingle();
        if (aErr) throw aErr;
        // With RLS, if the row exists but doesn't belong to the user, `a` will be null.
        // We can't distinguish "missing" from "forbidden" without a server check, so we
        // surface a permission-style message that's accurate in both cases.
        if (!a) {
          throw new Error(isAr
            ? 'ليس لديك صلاحية للوصول إلى هذا الأصل'
            : "You don't have permission to access this asset");
        }

        const { data: p } = await supabase
          .from('asset_passports')
          .select('official_name, microchip_id, bloodline, birth_date, gender, color_markings, height_cm, weight_kg, issuing_authority, passport_no, veterinarian_id, vaccinations, issued_at, expires_at')
          .eq('asset_id', id)
          .maybeSingle();

        if (cancelled) return;
        setAsset(a);
        setPassport(p || {});
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isAr]);

  const vaccinations = useMemo(() => {
    const v = passport?.vaccinations;
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
    return [];
  }, [passport]);

  const exportPDF = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#0a0f0a', useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = (canvas.height * pw) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, pw, ph);
      pdf.save(`passport-${asset?.name || id}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <CenterMsg text={isAr ? 'جاري التحميل…' : 'Loading…'} />;
  if (error) return <AccessDenied message={error} isAr={isAr} />;

  const photo = asset?.image_url || asset?.photo_url;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background: `
          radial-gradient(circle at 15% 20%, rgba(197,165,90,0.18) 0%, transparent 45%),
          radial-gradient(circle at 85% 80%, rgba(0,108,53,0.25) 0%, transparent 50%),
          linear-gradient(135deg, #050a08 0%, #0a1410 40%, #08110d 100%)
        `,
        fontFamily: "'Cairo','Tajawal',system-ui,sans-serif",
      }}
    >
      {/* Subtle gold grain overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(rgba(197,165,90,0.6) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Floating Export Button */}
      <button
        onClick={exportPDF}
        disabled={exporting}
        className="fixed top-6 z-50 group flex items-center gap-2 px-5 py-3 rounded-full border transition-all duration-300 hover:scale-105 disabled:opacity-50"
        style={{
          [isAr ? 'left' : 'right']: '1.5rem',
          background: 'linear-gradient(135deg, rgba(197,165,90,0.25), rgba(168,137,50,0.15))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(197,165,90,0.45)',
          boxShadow: '0 8px 32px rgba(197,165,90,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          color: '#f4e4b8',
        }}
        title={isAr ? 'تصدير PDF' : 'Export PDF'}
      >
        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
        <span className="text-sm font-semibold tracking-wide">{isAr ? 'تصدير PDF' : 'Export PDF'}</span>
      </button>

      <div ref={cardRef} className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 relative z-10">
        {/* === HERO HEADER === */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(197,165,90,0.1)',
              border: '1px solid rgba(197,165,90,0.3)',
              backdropFilter: 'blur(10px)',
            }}>
            <Award size={14} style={{ color: '#d4b37a' }} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#d4b37a' }}>
              {isAr ? 'جواز السفر الرقمي' : 'Digital Passport'}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #f4e4b8 0%, #c5a55a 50%, #8a6d2c 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '0.02em',
          }}>
            {passport?.official_name || asset?.name}
          </h1>
          {passport?.passport_no && (
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(244,228,184,0.6)' }}>
              № {passport.passport_no}
            </p>
          )}
        </header>

        {/* === MAIN CARD: photo + key facts === */}
        <GlassCard className="p-6 sm:p-8 mb-6">
          <div className="grid md:grid-cols-[220px,1fr] gap-6 items-center">
            {photo ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden" style={{
                border: '2px solid rgba(197,165,90,0.4)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,165,90,0.2) inset',
              }}>
                <img src={photo} alt={asset.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4))',
                }}/>
              </div>
            ) : (
              <div className="aspect-square rounded-2xl flex items-center justify-center text-5xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(197,165,90,0.3)' }}>
                🐾
              </div>
            )}

            <div className="space-y-4">
              {/* HIGHLIGHTED: Bloodline */}
              <HighlightField
                icon={<Dna size={18} />}
                label={isAr ? 'السلالة' : 'Bloodline'}
                value={passport?.bloodline || (isAr ? 'غير مسجل' : 'Not registered')}
                isPrimary
              />
              {/* HIGHLIGHTED: Microchip */}
              <HighlightField
                icon={<Fingerprint size={18} />}
                label={isAr ? 'الشريحة الإلكترونية' : 'Microchip ID'}
                value={passport?.microchip_id || '—'}
                mono
                isPrimary
              />
            </div>
          </div>
        </GlassCard>

        {/* === IDENTITY GRID === */}
        <GlassCard className="p-6 sm:p-8 mb-6">
          <SectionTitle icon={<ShieldCheck size={16} />} text={isAr ? 'الهوية الرسمية' : 'Official Identity'} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
            <Field label={isAr ? 'الجنس' : 'Gender'} value={passport?.gender ? (isAr ? (passport.gender === 'male' ? 'ذكر' : 'أنثى') : passport.gender) : '—'} />
            <Field label={isAr ? 'تاريخ الميلاد' : 'Birth Date'} value={fmtDate(passport?.birth_date)} />
            <Field label={isAr ? 'الوزن' : 'Weight'} value={passport?.weight_kg ? `${passport.weight_kg} kg` : '—'} />
            <Field label={isAr ? 'الطول' : 'Height'} value={passport?.height_cm ? `${passport.height_cm} cm` : '—'} />
            <Field label={isAr ? 'العلامات اللونية' : 'Color / Markings'} value={passport?.color_markings || '—'} />
            <Field label={isAr ? 'الطبيب البيطري' : 'Veterinarian'} value={passport?.veterinarian_id || '—'} />
          </div>
        </GlassCard>

        {/* === VACCINATIONS TABLE === */}
        <GlassCard className="p-6 sm:p-8 mb-6">
          <SectionTitle icon={<Syringe size={16} />} text={isAr ? 'سجل التطعيمات' : 'Vaccinations'} />
          {vaccinations.length === 0 ? (
            <div className="mt-5 text-center py-8 text-sm" style={{ color: 'rgba(244,228,184,0.5)' }}>
              {isAr ? 'لا توجد تطعيمات مسجلة' : 'No vaccinations on record'}
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl" style={{ border: '1px solid rgba(197,165,90,0.15)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(197,165,90,0.08)' }}>
                    <Th>{isAr ? 'اسم اللقاح' : 'Vaccine'}</Th>
                    <Th>{isAr ? 'تاريخ الإعطاء' : 'Date Given'}</Th>
                    <Th>{isAr ? 'الجرعة القادمة' : 'Next Due'}</Th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((v, idx) => (
                    <tr
                      key={idx}
                      className="transition-all duration-200"
                      style={{
                        borderTop: '1px solid rgba(197,165,90,0.08)',
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(197,165,90,0.07)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Td bold>{v.name || '—'}</Td>
                      <Td>{fmtDate(v.date)}</Td>
                      <Td accent>{fmtDate(v.next_due)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* === ISSUING AUTHORITY + DIGITAL STAMP === */}
        <GlassCard className="p-6 sm:p-8 mb-6">
          <div className="grid md:grid-cols-[1fr,auto] gap-6 items-center">
            <div>
              <SectionTitle icon={<Stamp size={16} />} text={isAr ? 'جهة الإصدار' : 'Issuing Authority'} />
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold" style={{ color: '#f4e4b8' }}>
                  {passport?.issuing_authority || (isAr ? 'غير محدد' : 'Not specified')}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: 'rgba(244,228,184,0.65)' }}>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {isAr ? 'صدر:' : 'Issued:'} {fmtDate(passport?.issued_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {isAr ? 'ينتهي:' : 'Expires:'} {fmtDate(passport?.expires_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Right Stamp */}
            <div className="relative w-32 h-32 mx-auto md:mx-0">
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(0,108,53,0.4) 0%, rgba(0,108,53,0.05) 70%)',
                  border: '2px solid rgba(197,165,90,0.6)',
                  boxShadow: '0 0 30px rgba(197,165,90,0.3), inset 0 0 20px rgba(0,108,53,0.2)',
                  transform: 'rotate(-8deg)',
                }}
              >
                <div className="absolute inset-2 rounded-full border" style={{ borderColor: 'rgba(197,165,90,0.3)', borderStyle: 'dashed' }} />
                <div className="text-center">
                  <img src={logoWhite} alt="Right" className="h-7 mx-auto mb-1 opacity-90" />
                  <div className="text-[8px] tracking-[0.3em] font-bold" style={{ color: '#d4b37a' }}>
                    {isAr ? 'موثّق' : 'VERIFIED'}
                  </div>
                  <div className="text-[7px] tracking-[0.2em] mt-0.5" style={{ color: 'rgba(244,228,184,0.6)' }}>
                    RIGHT · {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-[11px] tracking-[0.25em] uppercase mt-8" style={{ color: 'rgba(244,228,184,0.4)' }}>
          {isAr ? 'مدعوم بواسطة Right · النظام الرقمي للأصول الحية' : 'Powered by Right · Live Asset Digital Identity'}
        </p>
      </div>
    </div>
  );
}

/* ===== Subcomponents ===== */
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`relative rounded-3xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        border: '1px solid rgba(197,165,90,0.18)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg" style={{
        background: 'linear-gradient(135deg, rgba(197,165,90,0.25), rgba(0,108,53,0.15))',
        border: '1px solid rgba(197,165,90,0.3)',
        color: '#d4b37a',
      }}>{icon}</span>
      <h2 className="text-sm font-bold tracking-[0.18em] uppercase" style={{ color: '#f4e4b8' }}>{text}</h2>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(244,228,184,0.5)' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: '#f0e8d8' }}>{value}</div>
    </div>
  );
}

function HighlightField({ icon, label, value, mono, isPrimary }) {
  return (
    <div
      className="p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: isPrimary
          ? 'linear-gradient(135deg, rgba(197,165,90,0.12), rgba(0,108,53,0.08))'
          : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(197,165,90,0.25)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: '#d4b37a' }}>{icon}</span>
        <span className="text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ color: '#d4b37a' }}>{label}</span>
      </div>
      <div
        className="text-xl sm:text-2xl font-bold"
        style={{
          fontFamily: mono ? "'JetBrains Mono','Courier New',monospace" : undefined,
          letterSpacing: mono ? '0.05em' : '0.01em',
          background: 'linear-gradient(135deg, #f4e4b8 0%, #c5a55a 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-start px-4 py-3 text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: '#d4b37a' }}>
      {children}
    </th>
  );
}

function Td({ children, bold, accent }) {
  return (
    <td className="px-4 py-3 text-sm" style={{
      color: accent ? '#d4b37a' : '#f0e8d8',
      fontWeight: bold ? 600 : 400,
    }}>
      {children}
    </td>
  );
}

function CenterMsg({ text, danger }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050a08', color: danger ? '#fca5a5' : '#d4b37a' }}>
      <p className="text-sm tracking-wide">{text}</p>
    </div>
  );
}
