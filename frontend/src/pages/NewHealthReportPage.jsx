import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';

const REPORT_TYPES = [
  { value: 'checkup', ar: 'فحص دوري', en: 'Routine checkup' },
  { value: 'vaccination', ar: 'تطعيم', en: 'Vaccination' },
  { value: 'injury', ar: 'إصابة', en: 'Injury' },
  { value: 'illness', ar: 'مرض', en: 'Illness' },
];

export default function NewHealthReportPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }
  const { assets } = useAssets(ownerId);

  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState('checkup');
  const [summary, setSummary] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [saving, setSaving] = useState(false);

  const Back = isAr ? ArrowRight : ArrowLeft;

  const handleSave = (e) => {
    e.preventDefault();
    if (!assetId) return;
    setSaving(true);
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `r_${Date.now()}`;
    const report = {
      id,
      assetId,
      type,
      summary,
      veterinarian,
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem('health_reports_v1');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(report);
      localStorage.setItem('health_reports_v1', JSON.stringify(list));
    } catch {}
    setSaving(false);
    navigate(`/reports/${id}`, { replace: true });
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/reports')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-4"
        style={{ color: '#006c35' }}
      >
        <Back size={16} />
        {isAr ? 'العودة للتقارير' : 'Back to Reports'}
      </button>

      <h1 className="text-2xl font-bold mb-1" style={{ color: '#006c35' }}>
        {isAr ? 'تقرير صحي جديد' : 'New Health Report'}
      </h1>
      <p className="text-sm mb-6" style={{ color: '#6b6b6b' }}>
        {isAr ? 'سجّل ملاحظات الفحص البيطري' : 'Record veterinary findings'}
      </p>

      <form
        onSubmit={handleSave}
        className="std-form rounded-2xl p-5 space-y-4 shadow-sm"
        style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
      >
        <Field label={isAr ? 'الأصل' : 'Asset'}>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg text-sm bg-white"
            style={{ border: '1px solid rgba(0,108,53,0.25)' }}
          >
            <option value="">{isAr ? 'اختر الأصل...' : 'Choose an asset...'}</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>

        <Field label={isAr ? 'نوع التقرير' : 'Report Type'}>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: type === opt.value ? '#006c35' : 'rgba(0,108,53,0.05)',
                  color: type === opt.value ? '#fff' : '#006c35',
                  border: '1px solid rgba(0,108,53,0.2)',
                }}
              >
                {isAr ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </Field>

        <Field label={isAr ? 'الطبيب البيطري' : 'Veterinarian'}>
          <input
            type="text"
            value={veterinarian}
            onChange={(e) => setVeterinarian(e.target.value)}
            placeholder={isAr ? 'الاسم أو الترخيص' : 'Name or license #'}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid rgba(0,108,53,0.25)' }}
          />
        </Field>

        <Field label={isAr ? 'الملاحظات' : 'Notes'}>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            placeholder={isAr ? 'وصف الفحص والنتائج...' : 'Describe findings...'}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ border: '1px solid rgba(0,108,53,0.25)' }}
          />
        </Field>

        <button
          type="submit"
          disabled={!assetId || saving}
          className="w-full py-3 rounded-lg text-white font-bold text-sm disabled:opacity-50"
          style={{ background: '#006c35' }}
        >
          {saving
            ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
            : (isAr ? 'حفظ التقرير' : 'Save Report')}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b6b6b' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
