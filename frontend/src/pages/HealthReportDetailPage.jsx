import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';

export default function HealthReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }
  const { assets } = useAssets(ownerId);

  const [report, setReport] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('health_reports_v1');
      const list = raw ? JSON.parse(raw) : [];
      const r = list.find((x) => x.id === id);
      if (r) setReport(r);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  const Back = isAr ? ArrowRight : ArrowLeft;

  const handleDelete = () => {
    if (!report) return;
    try {
      const raw = localStorage.getItem('health_reports_v1');
      const list = raw ? JSON.parse(raw) : [];
      const next = list.filter((x) => x.id !== report.id);
      localStorage.setItem('health_reports_v1', JSON.stringify(next));
    } catch {}
    navigate('/reports', { replace: true });
  };

  if (notFound) {
    return (
      <div className="px-4 sm:px-6 py-12 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-3">🔎</div>
        <h2 className="text-xl font-bold" style={{ color: '#006c35' }}>
          {isAr ? 'التقرير غير موجود' : 'Report not found'}
        </h2>
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="mt-4 px-5 py-2 rounded-lg text-white font-bold"
          style={{ background: '#006c35' }}
        >
          {isAr ? 'العودة' : 'Back'}
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-4 sm:px-6 py-12 text-center" style={{ color: '#6b6b6b' }}>
        {isAr ? 'جارٍ التحميل...' : 'Loading...'}
      </div>
    );
  }

  const asset = assets.find((a) => a.id === report.assetId);

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

      <div
        className="rounded-2xl overflow-hidden shadow-md"
        style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
      >
        <div
          className="p-5"
          style={{
            background: 'linear-gradient(135deg, #006c35 0%, #004d25 100%)',
            color: '#fff',
          }}
        >
          <div className="text-[10px] uppercase tracking-widest" style={{ color: '#e6d5a8' }}>
            {isAr ? 'تقرير صحي' : 'Health Report'}
          </div>
          <h1 className="text-xl font-extrabold mt-1">
            {asset?.name || (isAr ? 'أصل غير معروف' : 'Unknown asset')}
          </h1>
          <div className="text-xs mt-1 opacity-80">
            {new Date(report.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-GB')}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <Row label={isAr ? 'النوع' : 'Type'} value={report.type || '—'} />
          <Row label={isAr ? 'الطبيب' : 'Veterinarian'} value={report.veterinarian || '—'} />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b6b6b' }}>
              {isAr ? 'الملاحظات' : 'Notes'}
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#1a1a1a' }}>
              {report.summary || '—'}
            </p>
          </div>

          {asset && (
            <button
              type="button"
              onClick={() => navigate(`/asset/${asset.id}`)}
              className="w-full mt-2 py-2.5 rounded-lg text-sm font-bold"
              style={{
                background: 'rgba(0,108,53,0.08)',
                color: '#006c35',
                border: '1px solid rgba(0,108,53,0.2)',
              }}
            >
              {isAr ? 'عرض جواز الأصل' : 'View Asset Passport'}
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="w-full inline-flex items-center justify-center gap-2 mt-1 py-2.5 rounded-lg text-sm font-bold"
            style={{
              background: 'rgba(185,28,28,0.08)',
              color: '#b91c1c',
              border: '1px solid rgba(185,28,28,0.25)',
            }}
          >
            <Trash2 size={14} />
            {isAr ? 'حذف التقرير' : 'Delete Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5"
         style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b6b6b' }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{value}</span>
    </div>
  );
}
