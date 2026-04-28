import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';

/**
 * Technical Passport — public-facing identity card for an asset.
 * Sections: ID Card · Device Fingerprint · Historical Charts · Export/Share.
 * Pulls live data from Lovable Cloud and falls back to the latest cached
 * snapshot in localStorage so it still loads in the desert.
 */

const CACHE_PREFIX = 'passport_cache_v1_';
const writeCache = (id, payload) => {
  try { localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ payload, at: Date.now() })); } catch {}
};
const readCache = (id) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export default function PassportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const cardRef = useRef(null);

  const [asset, setAsset] = useState(null);
  const [device, setDevice] = useState(null);
  const [readings, setReadings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Public sharable URL
  const shareUrl = useMemo(() => `${window.location.origin}/passport/${id}`, [id]);

  // Track connectivity
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Generate QR
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 280, margin: 1, color: { dark: '#005a2c', light: '#faf6ef' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [shareUrl]);

  // Load data with offline fallback
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const { data: assetRow, error: aErr } = await supabase
          .from('assets')
          .select('id, name, species, serial_number, insured_value, insurance_value, image_url, birth_date, notes, geofence_lat, geofence_lng, geofence_radius_km, owner_id, stable_id, status, stability_index, is_insured, is_active')
          .eq('id', id)
          .maybeSingle();
        if (aErr) throw aErr;
        if (!assetRow) throw new Error(isAr ? 'الأصل غير موجود' : 'Asset not found');

        const { data: deviceRow } = await supabase
          .from('devices')
          .select('id, device_serial, battery_level, signal_strength, network_type, last_seen_at, is_active, created_at')
          .eq('asset_id', id)
          .maybeSingle();

        const { data: readingRows } = await supabase
          .from('sensor_readings')
          .select('recorded_at, stability_score, temperature, heart_rate, latitude, longitude, battery_level, signal_strength')
          .eq('asset_id', id)
          .order('recorded_at', { ascending: false })
          .limit(100);

        // Hourly stability snapshots — last 30 days for the passport timeline
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: snapRows } = await supabase
          .from('stability_snapshots')
          .select('snapped_at, vital_score, env_score, final_index, status_flag')
          .eq('asset_id', id)
          .gte('snapped_at', since)
          .order('snapped_at', { ascending: false })
          .limit(720);

        if (cancelled) return;
        setAsset(assetRow);
        setDevice(deviceRow ?? null);
        setReadings(readingRows ?? []);
        setSnapshots(snapRows ?? []);
        setFromCache(false);
        writeCache(id, { asset: assetRow, device: deviceRow, readings: readingRows, snapshots: snapRows });
      } catch (e) {
        const cached = readCache(id);
        if (cached?.payload) {
          setAsset(cached.payload.asset);
          setDevice(cached.payload.device);
          setReadings(cached.payload.readings || []);
          setFromCache(true);
        } else {
          setError(e.message || String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isAr]);

  // Realtime updates
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`passport-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `asset_id=eq.${id}` }, (p) => {
        setReadings((prev) => [p.new, ...prev].slice(0, 100));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices', filter: `asset_id=eq.${id}` }, (p) => {
        setDevice((d) => ({ ...(d || {}), ...p.new }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets', filter: `id=eq.${id}` }, (p) => {
        setAsset((a) => ({ ...(a || {}), ...p.new }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const latest = readings[0];
  // Prefer authoritative asset.stability_index (synced via DB trigger), fallback to latest reading
  const score = asset?.stability_index != null
    ? Number(asset.stability_index)
    : (latest?.stability_score != null ? Number(latest.stability_score) : null);
  // Prefer asset.status (authoritative), fallback to score-based tier
  const statusKey = asset?.status || (
    score == null ? 'nodata' : score >= 85 ? 'stable' : score >= 70 ? 'warning' : 'danger'
  );
  const tier = statusKey === 'stable'  ? { label: isAr ? 'مستقر' : 'Stable',   color: 'var(--color-royal-green)' }
             : statusKey === 'warning' ? { label: isAr ? 'تحذير' : 'Warning',  color: 'var(--color-desert-gold-dark)' }
             : statusKey === 'danger'  ? { label: isAr ? 'خطر'   : 'Danger',   color: 'var(--color-danger)' }
             : statusKey === 'offline' ? { label: isAr ? 'غير متصل' : 'Offline', color: 'var(--color-text-muted)' }
             : { label: isAr ? 'لا توجد بيانات' : 'No Data', color: 'var(--color-text-muted)' };

  // Insurance value — read from either column (insured_value is canonical, insurance_value is legacy)
  const insVal = Number(asset?.insured_value || asset?.insurance_value || 0);

  // Sparkline series (oldest → newest)
  const series = useMemo(() => readings.slice().reverse(), [readings]);

  const exportPDF = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#faf6ef', useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = margin;
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(imgData, 'JPEG', margin, y, imgW, imgH);
      } else {
        // Multi-page slicing
        const pageInnerH = pageH - margin * 2;
        const sliceCanvasH = (canvas.width * pageInnerH) / imgW;
        let offsetY = 0;
        while (offsetY < canvas.height) {
          const slice = document.createElement('canvas');
          slice.width = canvas.width;
          slice.height = Math.min(sliceCanvasH, canvas.height - offsetY);
          const ctx = slice.getContext('2d');
          ctx.drawImage(canvas, 0, offsetY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          const sliceImg = slice.toDataURL('image/jpeg', 0.92);
          const sliceH = (slice.height * imgW) / slice.width;
          pdf.addImage(sliceImg, 'JPEG', margin, margin, imgW, sliceH);
          offsetY += slice.height;
          if (offsetY < canvas.height) pdf.addPage();
        }
      }
      pdf.save(`passport-${asset?.name || id}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const share = async () => {
    const data = { title: `${asset?.name || 'Asset'} — Right Passport`, text: isAr ? 'جواز السفر التقني للأصل' : 'Technical Passport', url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch {}
    }
    try { await navigator.clipboard.writeText(shareUrl); alert(isAr ? 'تم نسخ الرابط' : 'Link copied'); } catch {}
  };

  if (loading) {
    return <CenteredMsg>{isAr ? 'جاري التحميل…' : 'Loading…'}</CenteredMsg>;
  }
  if (error || !asset) {
    return <CenteredMsg error>{error || (isAr ? 'الأصل غير موجود' : 'Asset not found')}</CenteredMsg>;
  }

  const lastSeenAgo = device?.last_seen_at
    ? Math.round((Date.now() - new Date(device.last_seen_at).getTime()) / 60000)
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate(-1)} className="text-xs text-white/85 hover:text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {isAr ? '← رجوع' : '← Back'}
          </button>
          <div className="text-white text-sm font-bold flex items-center gap-2">
            <span aria-hidden>🪪</span> {isAr ? 'جواز السفر التقني' : 'Technical Passport'}
            {!online && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-warning)', color: 'white' }}>
                {isAr ? 'دون اتصال' : 'Offline'}
              </span>
            )}
            {fromCache && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
                {isAr ? 'بيانات محفوظة' : 'Cached'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={share} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
              {isAr ? '↗ مشاركة' : '↗ Share'}
            </button>
            <button onClick={exportPDF} disabled={exporting} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60" style={{ background: 'white', color: 'var(--color-royal-green-dark)' }}>
              {exporting ? (isAr ? 'يصدّر…' : 'Exporting…') : (isAr ? '⤓ PDF' : '⤓ PDF')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div ref={cardRef} className="rounded-3xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 12px 40px -12px rgba(0,0,0,0.15)' }}>

          {/* === IDENTITY CARD (Cyber-Heritage) === */}
          <section className="relative p-5 sm:p-7 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-royal-green) 0%, var(--color-royal-green-dark) 100%)', color: 'white' }}>
            {/* Subtle dotted heritage pattern */}
            <div className="absolute inset-0 opacity-10 select-none pointer-events-none" aria-hidden style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 2px)', backgroundSize: '24px 24px' }} />
            {/* Cyber scanlines */}
            <div className="absolute inset-0 opacity-[0.07] select-none pointer-events-none mix-blend-overlay" aria-hidden style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)' }} />
            {/* Corner brackets */}
            <CornerBracket pos="tl" />
            <CornerBracket pos="tr" />
            <CornerBracket pos="bl" />
            <CornerBracket pos="br" />

            <div className="relative grid grid-cols-1 sm:grid-cols-[140px_1fr_140px] gap-5 items-center">
              {/* Photo */}
              <div className="rounded-2xl overflow-hidden border-4 mx-auto sm:mx-0 relative" style={{ borderColor: 'var(--color-desert-gold)', width: 140, height: 140, background: 'rgba(255,255,255,0.08)', boxShadow: '0 0 0 2px rgba(197,165,90,0.35), 0 12px 32px -8px rgba(0,0,0,0.45)' }}>
                {asset.image_url ? (
                  <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {asset.species === 'horse' ? '🐎' : asset.species === 'falcon' ? '🦅' : '🐪'}
                  </div>
                )}
              </div>
              {/* Identity */}
              <div className="text-center sm:text-start">
                <div className="text-[11px] uppercase tracking-[0.32em] font-bold flex items-center gap-2 justify-center sm:justify-start" style={{ color: 'var(--color-desert-gold-light)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-desert-gold)' }} />
                  {isAr ? 'جواز السفر التقني' : 'TECHNICAL PASSPORT'}
                </div>
                <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold drop-shadow-sm">{asset.name}</h1>
                <div className="mt-2 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <Badge>{asset.species}</Badge>
                  {asset.serial_number && <Badge mono>#{asset.serial_number}</Badge>}
                  {asset.is_insured && (
                    <Badge style={{ background: 'var(--color-desert-gold-light)', color: 'var(--color-royal-green-dark)' }}>
                      {isAr ? '🛡 مؤمَّن' : '🛡 Insured'}
                    </Badge>
                  )}
                  <Badge style={{ background: tier.color, color: 'white', boxShadow: `0 0 18px ${tier.color}, 0 0 0 1px rgba(255,255,255,0.25)` }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle animate-pulse" style={{ background: 'white' }} />
                    {tier.label} {score != null && `· ${Math.round(score)}/100`}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <Mini
                    label={isAr ? 'القيمة المؤمّنة' : 'Insured Value'}
                    value={insVal > 0
                      ? `${insVal.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ${isAr ? 'ر.س' : 'SAR'}`
                      : '—'}
                  />
                  <Mini label={isAr ? 'تاريخ الميلاد' : 'Birth Date'} value={asset.birth_date || '—'} />
                </div>
              </div>
              {/* QR */}
              <div className="flex flex-col items-center gap-1 mx-auto">
                {qrUrl && <img src={qrUrl} alt="QR" className="w-[120px] h-[120px] rounded-lg bg-white p-1" style={{ boxShadow: '0 0 0 2px var(--color-desert-gold)' }} />}
                <div className="text-[10px] opacity-90 text-center max-w-[120px] break-words font-mono tracking-wider">
                  {isAr ? 'امسح للمشاركة' : 'SCAN · SHARE'}
                </div>
              </div>
            </div>
          </section>

          {/* === DEVICE FINGERPRINT === */}
          <section className="p-5 sm:p-7 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <SectionTitle icon="📡" title={isAr ? 'البصمة الرقمية للجهاز' : 'Device Fingerprint'} />
            {device ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label={isAr ? 'الرقم التسلسلي' : 'Serial'} value={device.device_serial} mono />
                <Field label={isAr ? 'البطارية' : 'Battery'} value={`${device.battery_level ?? '—'}%`} color={(device.battery_level ?? 100) < 20 ? 'var(--color-danger)' : 'var(--color-royal-green)'} />
                <Field label={isAr ? 'الإشارة' : 'Signal'} value={`${device.signal_strength ?? '—'}/100`} />
                <Field label={isAr ? 'الشبكة' : 'Network'} value={device.network_type || '—'} />
                <Field label={isAr ? 'آخر اتصال' : 'Last Seen'} value={lastSeenAgo == null ? '—' : isAr ? `قبل ${lastSeenAgo} د` : `${lastSeenAgo} min ago`} color={lastSeenAgo != null && lastSeenAgo > 30 ? 'var(--color-warning)' : 'var(--color-text-primary)'} />
                <Field label={isAr ? 'الحالة' : 'Status'} value={device.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')} color={device.is_active ? 'var(--color-royal-green)' : 'var(--color-danger)'} />
                <Field label={isAr ? 'مفعّل منذ' : 'Activated'} value={device.created_at ? new Date(device.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '—'} />
                <Field label={isAr ? 'آخر حرارة' : 'Last Temp'} value={latest?.temperature != null ? `${latest.temperature}°C` : '—'} />
              </div>
            ) : (
              <Empty isAr={isAr} text={isAr ? 'لم يُربط جهاز بعد بهذا الأصل' : 'No device linked yet'} />
            )}
          </section>

          {/* === HISTORICAL CHARTS === */}
          <section className="p-5 sm:p-7 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <SectionTitle icon="📈" title={isAr ? 'السجل التاريخي للقراءات' : 'Historical Readings'} subtitle={`${series.length} ${isAr ? 'قراءة' : 'readings'}`} />
            {series.length === 0 ? (
              <Empty isAr={isAr} text={isAr ? 'لا توجد قراءات بعد' : 'No readings yet'} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ChartCard title={isAr ? 'الاستقرار' : 'Stability'} series={series} field="stability_score" color="var(--color-royal-green)" suffix="" min={0} max={100} isAr={isAr} />
                <ChartCard title={isAr ? 'الحرارة' : 'Temperature'} series={series} field="temperature" color="var(--color-desert-gold-dark)" suffix="°C" isAr={isAr} />
                <ChartCard title={isAr ? 'البطارية' : 'Battery'} series={series} field="battery_level" color="#3b82f6" suffix="%" min={0} max={100} isAr={isAr} />
              </div>
            )}
          </section>

          {/* Footer brand */}
          <section className="px-5 sm:px-7 py-4 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
            <div>{isAr ? 'صادر عن منصة Right لتتبع الأصول الذكية' : 'Issued by Right — Smart Asset Tracking'}</div>
            <div className="font-mono">{id?.slice(0, 8)}…</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Badge({ children, mono, style }) {
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${mono ? 'font-mono' : ''}`} style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)', ...style }}>
      {children}
    </span>
  );
}

function CornerBracket({ pos }) {
  const base = { position: 'absolute', width: 22, height: 22, borderColor: 'var(--color-desert-gold)', pointerEvents: 'none' };
  const map = {
    tl: { top: 10, left: 10, borderTop: '2px solid', borderLeft: '2px solid' },
    tr: { top: 10, right: 10, borderTop: '2px solid', borderRight: '2px solid' },
    bl: { bottom: 10, left: 10, borderBottom: '2px solid', borderLeft: '2px solid' },
    br: { bottom: 10, right: 10, borderBottom: '2px solid', borderRight: '2px solid' },
  };
  return <span aria-hidden style={{ ...base, ...map[pos] }} />;
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-start" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <div className="text-[9px] uppercase opacity-80">{label}</div>
      <div className="text-[12px] font-bold">{value}</div>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {subtitle && <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</div>}
    </div>
  );
}

function Field({ label, value, mono, color = 'var(--color-text-primary)' }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className={`mt-1 text-sm font-bold ${mono ? 'font-mono tracking-wider' : ''}`} style={{ color }}>{value}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>{text}</div>;
}

function CenteredMsg({ children, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="text-sm font-medium" style={{ color: error ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{children}</div>
    </div>
  );
}

/** Lightweight inline SVG sparkline + summary (no chart lib) */
function ChartCard({ title, series, field, color, suffix = '', min, max, isAr }) {
  const values = series.map((r) => (r[field] == null ? null : Number(r[field])));
  const present = values.filter((v) => v != null && !Number.isNaN(v));
  if (present.length === 0) {
    return (
      <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</div>
        <Empty text={isAr ? 'لا توجد بيانات' : 'No data'} />
      </div>
    );
  }
  const lo = min != null ? min : Math.min(...present);
  const hi = max != null ? max : Math.max(...present);
  const range = Math.max(1, hi - lo);
  const W = 280, H = 70, P = 4;
  const stepX = (W - P * 2) / Math.max(1, values.length - 1);
  let path = '';
  values.forEach((v, i) => {
    if (v == null || Number.isNaN(v)) return;
    const x = P + i * stepX;
    const y = H - P - ((v - lo) / range) * (H - P * 2);
    path += `${path === '' ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  });
  const last = present[present.length - 1];
  const first = present[0];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
  const avg = present.reduce((s, v) => s + v, 0) / present.length;

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</div>
        <div className="text-lg font-extrabold" style={{ color }}>{Number(last).toFixed(field === 'temperature' ? 1 : 0)}{suffix}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[70px] mt-1">
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
        <span>{isAr ? 'متوسط' : 'Avg'}: <b style={{ color: 'var(--color-text-primary)' }}>{avg.toFixed(field === 'temperature' ? 1 : 0)}{suffix}</b></span>
        <span style={{ color: delta >= 0 ? 'var(--color-royal-green)' : 'var(--color-danger)' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
