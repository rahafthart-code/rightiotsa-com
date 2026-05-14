import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Upload, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

/* ──────────────────────────────────────────────────────────
 * Onboarding wizard — dark theme, gold accents, RTL Arabic.
 * 3 steps: Asset basics → Photo (Cloudinary) → Sensor + geofence.
 * ────────────────────────────────────────────────────────── */

const SPECIES = [
  { value: 'Horse',  emoji: '•', label: 'خيل' },
  { value: 'Camel',  emoji: '•', label: 'إبل' },
  { value: 'Falcon', emoji: '•', label: 'صقر' },
];

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = 'right_insurtech_assets';

const GOLD = '#c5a55a';
const GOLD_DIM = '#7a6a3a';
const BG = '#090d17';
const CARD_BG = '#11182a';
const BORDER = '#1f2940';
const TEXT = '#f5efe0';
const MUTED = '#8a8472';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  const [data, setData] = useState({
    species: '',
    name: '',
    breed: '',
    insurance_value: '',
    photo_url: '',
    sensor_device_id: '',
    geofence_lat: 24.7136,
    geofence_lng: 46.6753,
    geofence_radius_km: 5,
  });
  const set = (p) => setData((d) => ({ ...d, ...p }));

  const canNext =
    (step === 1 && data.species && data.name.trim().length >= 2) ||
    (step === 2) ||
    (step === 3);

  /* ── Cloudinary upload (XHR for progress) ────────────── */
  const uploadFile = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error('الرجاء اختيار ملف صورة');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('الحد الأقصى 8 ميجابايت');
      return;
    }
    if (!CLOUDINARY_CLOUD) {
      toast.error('لم يتم إعداد Cloudinary — أضف VITE_CLOUDINARY_CLOUD_NAME');
      return;
    }

    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          set({ photo_url: res.secure_url });
          toast.success('تم رفع الصورة');
        } catch {
          toast.error('فشل قراءة استجابة Cloudinary');
        }
      } else {
        toast.error('فشل الرفع — تأكد من إعدادات Cloudinary');
      }
    };
    xhr.onerror = () => { setUploading(false); toast.error('خطأ في الشبكة'); };
    xhr.send(fd);
  };

  const onDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('ring-2');
    const f = e.dataTransfer?.files?.[0];
    if (f) uploadFile(f);
  };

  /* ── Final submit ────────────────────────────────────── */
  const finish = async () => {
    if (!ownerId) { toast.error('الرجاء تسجيل الدخول'); return; }
    setSaving(true);
    try {
      const payload = {
        owner_id: ownerId,
        name: data.name.trim(),
        species: data.species,
        photo_url: data.photo_url || null,
        image_url: data.photo_url || null,
        insured_value: data.insurance_value ? Number(data.insurance_value) : 0,
        sensor_device_id: data.sensor_device_id || null,
        geofence_lat: data.geofence_lat,
        geofence_lng: data.geofence_lng,
        geofence_radius_km: data.geofence_radius_km,
        is_active: true,
      };
      const { data: asset, error } = await supabase
        .from('assets').insert([payload]).select().maybeSingle();
      if (error) throw error;
      if (asset && data.breed) {
        await supabase.from('asset_passports')
          .insert([{ asset_id: asset.id, bloodline: data.breed }]);
      }
      toast.success('تم إعداد الأصل بنجاح');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.message || 'فشل حفظ الأصل');
    } finally {
      setSaving(false);
    }
  };

  /* ── OSM iframe with marker + radius hint ────────────── */
  const mapSrc = useMemo(() => {
    const { geofence_lat: lat, geofence_lng: lng, geofence_radius_km: r } = data;
    const d = Math.max(0.02, r * 0.02);
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [data.geofence_lat, data.geofence_lng, data.geofence_radius_km]);

  return (
    <div dir="rtl" style={{ background: BG, color: TEXT, minHeight: '100vh' }}
         className="px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n}
                 className="rounded-full transition-all"
                 style={{
                   width: n === step ? 14 : 10,
                   height: n === step ? 14 : 10,
                   background: n === step ? GOLD : 'transparent',
                   border: `2px solid ${n <= step ? GOLD : GOLD_DIM}`,
                 }} />
          ))}
        </div>

        <div className="rounded-2xl p-6 sm:p-8"
             style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: GOLD }}>
                أضف أصلك الأول
              </h2>
              <p className="text-sm mb-6" style={{ color: MUTED }}>
                ابدأ بإدخال المعلومات الأساسية
              </p>

              <label className="text-xs font-bold mb-2 block" style={{ color: MUTED }}>
                نوع الأصل
              </label>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {SPECIES.map((s) => {
                  const sel = data.species === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set({ species: s.value })}
                      className="rounded-xl flex flex-col items-center justify-center transition-all"
                      style={{
                        width: '100%', height: 100,
                        background: sel ? 'rgba(197,165,90,0.08)' : '#0c1322',
                        border: `2px solid ${sel ? GOLD : BORDER}`,
                        boxShadow: sel ? `0 0 0 4px rgba(197,165,90,0.15)` : 'none',
                      }}
                    >
                      <span className="text-3xl mb-1">{s.emoji}</span>
                      <span className="text-sm font-bold" style={{ color: sel ? GOLD : TEXT }}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Field label="اسم الأصل">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="مثال: شاهين"
                  className="w-full rounded-lg px-3 py-2.5 outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="السلالة / الفصيلة">
                <input
                  type="text"
                  value={data.breed}
                  onChange={(e) => set({ breed: e.target.value })}
                  placeholder="مثال: عربي أصيل"
                  className="w-full rounded-lg px-3 py-2.5 outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="القيمة التأمينية">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={data.insurance_value}
                    onChange={(e) => set({ insurance_value: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg px-3 py-2.5 pl-14 outline-none"
                    style={inputStyle}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                        style={{ color: GOLD }}>
                    SAR
                  </span>
                </div>
              </Field>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: GOLD }}>صورة الأصل</h2>
              <p className="text-sm mb-6" style={{ color: MUTED }}>
                ارفع صورة واضحة — حد أقصى 8 ميجابايت
              </p>

              <div className="flex justify-center">
                {data.photo_url ? (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="rounded-full overflow-hidden"
                      style={{
                        width: 200, height: 200,
                        border: `3px solid ${GOLD}`,
                        boxShadow: `0 0 0 4px rgba(197,165,90,0.2)`,
                      }}
                    >
                      <img src={data.photo_url} alt="preview"
                           className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => { set({ photo_url: '' }); setProgress(0); }}
                      className="text-xs font-semibold underline"
                      style={{ color: GOLD }}
                    >
                      تغيير الصورة
                    </button>
                  </div>
                ) : (
                  <div
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('ring-2'); }}
                    onDragLeave={() => dropRef.current?.classList.remove('ring-2')}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all"
                    style={{
                      width: 280, height: 200,
                      border: `2px dashed ${GOLD}`,
                      background: 'rgba(197,165,90,0.04)',
                    }}
                  >
                    {uploading ? (
                      <div className="w-3/4 text-center">
                        <Loader2 className="mx-auto mb-2 animate-spin" style={{ color: GOLD }} />
                        <div className="text-xs mb-2" style={{ color: MUTED }}>
                          جاري الرفع… {progress}%
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden"
                             style={{ background: BORDER }}>
                          <div className="h-full transition-all"
                               style={{ width: `${progress}%`, background: GOLD }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} style={{ color: GOLD }} className="mb-3" />
                        <div className="text-sm font-bold mb-1" style={{ color: TEXT }}>
                          اسحب الصورة هنا أو انقر للاختيار
                        </div>
                        <div className="text-[11px]" style={{ color: MUTED }}>
                          PNG / JPG حتى 8MB
                        </div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden
                           onChange={(e) => uploadFile(e.target.files?.[0])} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: GOLD }}>ربط الحساس</h2>
              <p className="text-sm mb-6" style={{ color: MUTED }}>
                اختياري — يمكنك إضافة الحساس لاحقاً
              </p>

              <Field label="معرّف الجهاز (Device ID)">
                <input
                  type="text"
                  value={data.sensor_device_id}
                  onChange={(e) => set({ sensor_device_id: e.target.value })}
                  placeholder="RGT-XXXX-XXXX"
                  className="w-full rounded-lg px-3 py-2.5 outline-none font-mono"
                  style={inputStyle}
                />
              </Field>

              <div className="mt-4">
                <label className="text-xs font-bold mb-2 flex items-center gap-2"
                       style={{ color: MUTED }}>
                  <MapPin size={14} style={{ color: GOLD }} /> النطاق الجغرافي الآمن
                </label>
                <div className="rounded-xl overflow-hidden mb-3"
                     style={{ border: `1px solid ${BORDER}`, height: 220 }}>
                  <iframe
                    title="geofence-map"
                    src={mapSrc}
                    className="w-full h-full"
                    style={{ border: 0, filter: 'invert(0.92) hue-rotate(180deg)' }}
                  />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: MUTED }}>نصف القطر</span>
                  <span className="text-sm font-bold" style={{ color: GOLD }}>
                    {data.geofence_radius_km} كم
                  </span>
                </div>
                <input
                  type="range"
                  min="1" max="50" step="1"
                  value={data.geofence_radius_km}
                  onChange={(e) => set({ geofence_radius_km: parseInt(e.target.value, 10) })}
                  className="w-full"
                  style={{ accentColor: GOLD }}
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: MUTED }}>
                  <span>1 كم</span><span>50 كم</span>
                </div>
              </div>

              <button
                onClick={() => { set({ sensor_device_id: '' }); finish(); }}
                disabled={saving}
                className="block mx-auto mt-5 text-xs font-semibold underline disabled:opacity-50"
                style={{ color: GOLD_DIM }}
              >
                سأضيف الحساس لاحقاً
              </button>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-8 pt-5"
               style={{ borderTop: `1px solid ${BORDER}` }}>
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || saving}
              className="flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0"
              style={{ color: MUTED }}
            >
              <ArrowRight size={16} /> السابق
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                style={{ background: GOLD, color: '#1a1408' }}
              >
                التالي <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: GOLD, color: '#1a1408' }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                إنهاء الإعداد
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: '#0c1322',
  border: `1px solid ${BORDER}`,
  color: TEXT,
};

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-bold mb-1.5 block" style={{ color: MUTED }}>
        {label}
      </label>
      {children}
    </div>
  );
}
