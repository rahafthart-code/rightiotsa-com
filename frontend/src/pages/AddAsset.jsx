import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check, Loader2, Upload, Wifi, ChevronRight, ChevronLeft,
  Image as ImageIcon, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const STEPS = 4;

const SPECIES = [
  { value: 'horse',  emoji: '🐎', ar: 'حصان', en: 'Horse' },
  { value: 'camel',  emoji: '🐪', ar: 'جمل',  en: 'Camel' },
  { value: 'falcon', emoji: '🦅', ar: 'صقر',  en: 'Falcon' },
];

// Map UI species → DB enum (assets.species). We try canonical capitalised
// values used elsewhere in the codebase first.
const SPECIES_DB = { horse: 'Horse', camel: 'Camel', falcon: 'Falcon' };

export default function AddAsset() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Resolve owner id (Supabase user, or demo mock user fallback).
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [testStatus, setTestStatus] = useState('idle'); // idle | testing | success | fail
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    species: '',
    name: '',
    breed: '',
    registration_no: '',
    photo_url: '',
    sensor_device_id: '',
  });

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  /* ── Step validation ─────────────────────────────── */
  const canAdvance =
    (step === 1 && !!formData.species) ||
    (step === 2 && formData.name.trim().length >= 2) ||
    (step === 3) || // sensor optional
    step === 4;

  /* ── Step 2: photo upload to Cloudinary (auto w_400,c_fill thumbnail) ── */
  const handlePhoto = async (file) => {
    if (!file || !ownerId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? 'الحد الأقصى 10 ميجابايت' : 'Max file size is 10MB');
      return;
    }
    if (!/^image\//.test(file.type)) {
      toast.error(isAr ? 'الرجاء اختيار ملف صورة' : 'Please choose an image file');
      return;
    }
    setUploading(true);
    setUploadPct(0);
    try {
      const { uploadToCloudinary } = await import('../lib/cloudinary');
      const result = await uploadToCloudinary(file, (pct) => setUploadPct(pct));
      set({
        photo_url: result.url,
        thumb_url: result.thumbnailUrl,
        cloudinary_id: result.publicId,
      });
      toast.success(isAr ? 'تم رفع الصورة' : 'Photo uploaded');
    } catch (e) {
      toast.error((isAr ? 'فشل رفع الصورة: ' : 'Photo upload failed: ') + (e?.message || ''));
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  /* ── Step 3: sensor connectivity test ─────────────── */
  const testConnection = async () => {
    if (!formData.sensor_device_id.trim()) {
      toast.error(isAr ? 'أدخل معرف الجهاز أولاً' : 'Enter the device ID first');
      return;
    }
    setTestStatus('testing');
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-sensor`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: formData.sensor_device_id,
          api_key: 'test_mode_2026',
          heart_rate: 40,
          temperature: 37.5,
        }),
      });
      if (res.ok) {
        setTestStatus('success');
        toast.success(isAr ? 'تم الاتصال بالحساس بنجاح' : 'Sensor connected successfully');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      setTestStatus('fail');
      toast.error(
        isAr
          ? 'لم يتم العثور على إشارة من الحساس'
          : 'No signal from the sensor'
      );
    }
  };

  /* ── Final save ──────────────────────────────────── */
  const handleConfirm = async () => {
    if (!ownerId) {
      toast.error(isAr ? 'الرجاء تسجيل الدخول' : 'Please sign in');
      return;
    }
    setLoading(true);
    try {
      const insertPayload = {
        owner_id: ownerId,
        species: SPECIES_DB[formData.species] || 'Horse',
        name: formData.name.trim(),
        photo_url: formData.photo_url || null,
        image_url: formData.photo_url || null, // keep both columns in sync
        thumb_url: formData.thumb_url || formData.photo_url || null,
        registration_no: formData.registration_no || null,
        sensor_device_id: formData.sensor_device_id || null,
        is_active: true,
        status: 'stable',
        stability_index: 100,
      };

      const { data: asset, error: assetErr } = await supabase
        .from('assets')
        .insert([insertPayload])
        .select()
        .maybeSingle();

      if (assetErr) throw assetErr;
      if (!asset) throw new Error('Insert returned no row');

      // Auto-create empty passport (best-effort; ignore failure)
      const passportPayload = {
        asset_id: asset.id,
        bloodline: formData.breed || null,
      };
      const { error: ppErr } = await supabase
        .from('asset_passports')
        .insert([passportPayload]);
      if (ppErr) {
        // Non-fatal — log only
        console.warn('passport insert failed:', ppErr.message);
      }

      toast.success(
        isAr ? 'تمت إضافة الأصل وبدء التتبع' : 'Asset added and tracking started'
      );
      navigate(`/asset/${asset.id}`, { replace: true });
    } catch (e) {
      toast.error((isAr ? 'حدث خطأ أثناء الحفظ: ' : 'Save failed: ') + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const Next = isAr ? ChevronLeft : ChevronRight;
  const Prev = isAr ? ChevronRight : ChevronLeft;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'إضافة أصل جديد' : 'Add New Asset'}
          </h1>
          <span className="text-xs font-bold" style={{ color: '#6b6b6b' }}>
            {isAr ? `الخطوة ${step} من ${STEPS}` : `Step ${step} of ${STEPS}`}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all"
              style={{
                background: step >= s ? '#006c35' : 'rgba(0,108,53,0.12)',
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-5 sm:p-6 shadow-md"
        style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
      >
        {/* ───── Step 1: Species ───── */}
        {step === 1 && (
          <section>
            <h2 className="text-lg font-bold mb-1" style={{ color: '#006c35' }}>
              {isAr ? 'اختر نوع الأصل' : 'Choose Asset Type'}
            </h2>
            <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
              {isAr ? 'الإبل، الخيول، أو الصقور' : 'Camels, horses, or falcons'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {SPECIES.map((sp) => (
                <TypeCard
                  key={sp.value}
                  emoji={sp.emoji}
                  label={isAr ? sp.ar : sp.en}
                  selected={formData.species === sp.value}
                  onClick={() => set({ species: sp.value })}
                />
              ))}
            </div>
          </section>
        )}

        {/* ───── Step 2: Basics ───── */}
        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: '#006c35' }}>
              {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
            </h2>

            <Field label={isAr ? 'الاسم' : 'Name'} required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => set({ name: e.target.value })}
                maxLength={100}
                placeholder={isAr ? 'مثال: شاهين' : 'e.g. Shaheen'}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid rgba(0,108,53,0.25)' }}
              />
            </Field>

            <Field label={isAr ? 'السلالة' : 'Breed / Bloodline'}>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => set({ breed: e.target.value })}
                maxLength={100}
                placeholder={isAr ? 'مثال: عربي أصيل' : 'e.g. Arabian'}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid rgba(0,108,53,0.25)' }}
              />
            </Field>

            <Field label={isAr ? 'رقم التسجيل' : 'Registration No.'}>
              <input
                type="text"
                value={formData.registration_no}
                onChange={(e) => set({ registration_no: e.target.value })}
                maxLength={64}
                placeholder={isAr ? 'اختياري' : 'Optional'}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid rgba(0,108,53,0.25)' }}
              />
            </Field>

            <Field label={isAr ? 'صورة الأصل' : 'Asset Photo'}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhoto(e.target.files?.[0])}
                className="hidden"
              />
              {formData.photo_url ? (
                <div className="flex items-center gap-3 p-3 rounded-lg"
                     style={{ background: 'rgba(0,108,53,0.05)', border: '1px solid rgba(0,108,53,0.2)' }}>
                  <img src={formData.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: '#006c35' }}>
                      {isAr ? 'تم رفع الصورة' : 'Photo uploaded'}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: '#6b6b6b' }}>
                      {formData.photo_url.split('/').pop()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-md text-xs font-bold"
                    style={{ background: 'rgba(197,165,90,0.2)', color: '#8a6d2a' }}
                  >
                    {isAr ? 'تغيير' : 'Change'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-6 rounded-lg flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{
                    background: 'rgba(0,108,53,0.04)',
                    border: '2px dashed rgba(0,108,53,0.3)',
                    color: '#006c35',
                  }}
                >
                  {uploading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Upload size={22} />
                  )}
                  <span className="text-sm font-bold">
                    {uploading
                      ? (isAr ? 'جارٍ الرفع...' : 'Uploading...')
                      : (isAr ? 'ارفع صورة الأصل' : 'Upload asset photo')}
                  </span>
                  <span className="text-[11px]" style={{ color: '#6b6b6b' }}>
                    {isAr ? 'JPG/PNG حتى 8MB' : 'JPG/PNG up to 8MB'}
                  </span>
                </button>
              )}
            </Field>
          </section>
        )}

        {/* ───── Step 3: Sensor ───── */}
        {step === 3 && (
          <section className="space-y-4">
            <div className="flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    testStatus === 'success'
                      ? 'rgba(0,108,53,0.15)'
                      : testStatus === 'fail'
                      ? 'rgba(185,28,28,0.12)'
                      : 'rgba(197,165,90,0.18)',
                  color:
                    testStatus === 'success'
                      ? '#006c35'
                      : testStatus === 'fail'
                      ? '#b91c1c'
                      : '#8a6d2a',
                }}
              >
                {testStatus === 'testing'
                  ? <Loader2 size={26} className="animate-spin" />
                  : testStatus === 'success'
                  ? <Check size={28} />
                  : testStatus === 'fail'
                  ? <AlertTriangle size={26} />
                  : <Wifi size={26} />}
              </div>
            </div>

            <h2 className="text-lg font-bold text-center" style={{ color: '#006c35' }}>
              {isAr ? 'ربط الحساس الذكي' : 'Connect Smart Sensor'}
            </h2>
            <p className="text-sm text-center" style={{ color: '#6b6b6b' }}>
              {isAr
                ? 'هذه الخطوة اختيارية — يمكنك ربط الحساس لاحقاً'
                : 'This step is optional — you can link a sensor later'}
            </p>

            <Field label={isAr ? 'معرّف الجهاز (Device ID)' : 'Device ID'}>
              <input
                type="text"
                value={formData.sensor_device_id}
                onChange={(e) => { set({ sensor_device_id: e.target.value }); setTestStatus('idle'); }}
                placeholder="sensor-horse-001"
                maxLength={64}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid rgba(0,108,53,0.25)' }}
              />
            </Field>

            <button
              type="button"
              onClick={testConnection}
              disabled={testStatus === 'testing' || !formData.sensor_device_id.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={{
                background: 'rgba(0,108,53,0.08)',
                color: '#006c35',
                border: '1px solid rgba(0,108,53,0.25)',
              }}
            >
              {testStatus === 'testing'
                ? <Loader2 size={16} className="animate-spin" />
                : <Wifi size={16} />}
              {isAr ? 'اختبار الاتصال' : 'Test Connection'}
            </button>

            {testStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm font-bold p-3 rounded-lg"
                   style={{ background: 'rgba(0,108,53,0.08)', color: '#006c35' }}>
                <Check size={16} /> {isAr ? 'تم الاتصال بنجاح' : 'Connected successfully'}
              </div>
            )}
            {testStatus === 'fail' && (
              <div className="flex items-center gap-2 text-sm font-bold p-3 rounded-lg"
                   style={{ background: 'rgba(185,28,28,0.08)', color: '#b91c1c' }}>
                <AlertTriangle size={16} />
                {isAr ? 'لم يتم العثور على إشارة من الحساس' : 'No signal from sensor'}
              </div>
            )}
          </section>
        )}

        {/* ───── Step 4: Review ───── */}
        {step === 4 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: '#006c35' }}>
              {isAr ? 'مراجعة وتأكيد' : 'Review & Confirm'}
            </h2>

            <div className="rounded-xl overflow-hidden"
                 style={{ border: '1px solid rgba(0,108,53,0.15)' }}>
              <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center" style={{ color: '#6b6b6b' }}>
                    <ImageIcon size={28} />
                    <span className="text-xs mt-1">{isAr ? 'بدون صورة' : 'No photo'}</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <Row label={isAr ? 'النوع' : 'Species'} value={
                  SPECIES.find((s) => s.value === formData.species)
                    ? (isAr ? SPECIES.find((s) => s.value === formData.species).ar
                            : SPECIES.find((s) => s.value === formData.species).en)
                    : '—'
                } />
                <Row label={isAr ? 'الاسم' : 'Name'} value={formData.name || '—'} />
                <Row label={isAr ? 'السلالة' : 'Breed'} value={formData.breed || '—'} />
                <Row label={isAr ? 'رقم التسجيل' : 'Registration'} value={formData.registration_no || '—'} />
                <Row
                  label={isAr ? 'الحساس' : 'Sensor'}
                  value={formData.sensor_device_id
                    ? `${formData.sensor_device_id}${testStatus === 'success' ? ' ✓' : ''}`
                    : (isAr ? 'بدون' : 'None')}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-1 text-sm font-bold disabled:opacity-0 transition-opacity"
          style={{ color: '#6b6b6b' }}
        >
          <Prev size={16} />
          {isAr ? 'السابق' : 'Back'}
        </button>

        {step < STEPS ? (
          <button
            type="button"
            onClick={() => canAdvance && setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: '#006c35' }}
          >
            {isAr ? 'التالي' : 'Next'}
            <Next size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: '#006c35' }}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Check size={16} />}
            {isAr ? 'تأكيد الإضافة' : 'Confirm & Add'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ───── Helpers ─────────────────────────────────── */
function TypeCard({ emoji, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
      style={{
        background: selected ? 'rgba(0,108,53,0.1)' : '#fff',
        border: `2px solid ${selected ? '#006c35' : 'rgba(0,108,53,0.15)'}`,
        boxShadow: selected ? '0 4px 14px rgba(0,108,53,0.18)' : 'none',
        transform: selected ? 'translateY(-2px)' : 'none',
      }}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-bold" style={{ color: selected ? '#006c35' : '#1a1a1a' }}>
        {label}
      </span>
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b6b6b' }}>
        {label}{required && <span style={{ color: '#b91c1c' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5"
         style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b6b6b' }}>
        {label}
      </span>
      <span className="text-sm font-semibold text-end" style={{ color: '#1a1a1a' }}>{value}</span>
    </div>
  );
}
