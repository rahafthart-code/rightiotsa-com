import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileHeart, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';

/**
 * Health Reports list — replaces the requested "Claims" route.
 * Reports are sourced from veterinary visits (notifications of type
 * 'health_report'). For the MVP, this lists existing reports + a CTA
 * to create a new one.
 */
export default function HealthReportsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }
  const { assets } = useAssets(ownerId);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Load drafts from localStorage (MVP)
    try {
      const raw = localStorage.getItem('health_reports_v1');
      setReports(raw ? JSON.parse(raw) : []);
    } catch {
      setReports([]);
    }
  }, []);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'التقارير الصحية' : 'Health Reports'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            {isAr ? 'سجل الفحوصات والملاحظات البيطرية' : 'Veterinary check-ups and observations'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/reports/new')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm"
          style={{ background: '#006c35' }}
        >
          <Plus size={16} />
          {isAr ? 'تقرير جديد' : 'New Report'}
        </button>
      </header>

      {reports.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: '#fff', border: '1px dashed rgba(0,108,53,0.3)' }}
        >
          <FileHeart size={40} style={{ color: '#006c35' }} className="mx-auto mb-3" />
          <p style={{ color: '#6b6b6b' }} className="text-sm">
            {isAr ? 'لا توجد تقارير بعد' : 'No reports yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const asset = assets.find((a) => a.id === r.assetId);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/reports/${r.id}`)}
                className="w-full text-start rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                style={{ background: '#fff', border: '1px solid rgba(197,165,90,0.3)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#006c35' }}>
                      {asset?.name || (isAr ? 'أصل غير معروف' : 'Unknown asset')}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
                      {new Date(r.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-GB')}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{ background: 'rgba(0,108,53,0.1)', color: '#006c35' }}
                  >
                    {r.type || 'checkup'}
                  </span>
                </div>
                {r.summary && (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: '#4b4b4b' }}>
                    {r.summary}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
