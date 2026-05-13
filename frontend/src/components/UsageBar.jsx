import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * UsageBar — compact plan-usage card with progress bars + upgrade CTA when near cap.
 * Designed for both light (cream) and dark dashboards: pass `dark` prop.
 */
export default function UsageBar({ usage, dark = false, isAr = true }) {
  const navigate = useNavigate();
  if (!usage) return null;

  const pct = usage.assetPct ?? 0;
  const color = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#BA7517' : '#1D9E75';

  const bg     = dark ? '#0f1626' : '#fff';
  const border = dark ? '#1c2640' : 'rgba(0,108,53,0.15)';
  const text   = dark ? '#f2efe3' : '#1a1a1a';
  const muted  = dark ? '#7d8499' : '#6b6b6b';
  const track  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const planLabel = ({
    starter:  isAr ? 'الباقة المبتدئة' : 'Starter',
    pro:      isAr ? 'الباقة الاحترافية' : 'Pro',
    business: isAr ? 'باقة الأعمال' : 'Business',
    enterprise: isAr ? 'الباقة المؤسسية' : 'Enterprise',
  })[usage.plan] || usage.plan;

  const Row = ({ label, used, max }) => {
    const p = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    const c = p >= 90 ? '#E24B4A' : p >= 70 ? '#BA7517' : '#1D9E75';
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-bold" style={{ color: text }}>
          <span>{label}: {used} / {max}</span>
          <span style={{ color: c }}>{p}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: track }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p}%`, background: c }}
          />
        </div>
      </div>
    );
  };

  return (
    <section
      className="rounded-2xl p-5 space-y-4"
      style={{ background: bg, border: `1px solid ${border}` }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: muted }}>
            {isAr ? 'استهلاك الباقة' : 'Plan usage'}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: text }}>
            {planLabel}
            <span className="ms-2 text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: usage.status === 'active' ? 'rgba(29,158,117,0.15)' : 'rgba(186,117,23,0.15)',
                       color:      usage.status === 'active' ? '#1D9E75' : '#BA7517' }}>
              {usage.status === 'active' ? (isAr ? 'نشطة' : 'Active')
                : usage.status === 'trial' ? (isAr ? 'تجريبية' : 'Trial') : usage.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/subscribe')}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}
        >
          {isAr ? 'إدارة الباقة' : 'Manage plan'}
        </button>
      </div>

      <Row label={isAr ? 'الأصول' : 'Assets'}  used={usage.usedAssets}  max={usage.maxAssets} />
      <Row label={isAr ? 'العزب'  : 'Stables'} used={usage.usedStables} max={usage.maxStables} />
      <Row label={isAr ? 'الأجهزة' : 'Devices'} used={usage.usedDevices} max={usage.maxDevices} />

      {pct >= 90 && (
        <button
          onClick={() => navigate('/subscribe?upgrade=true&reason=asset_limit')}
          className="w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          style={{ background: color, color: '#fff' }}
        >
          ⚠️ {isAr ? 'اقتربت من الحد — ترقية الباقة الآن' : 'Near limit — upgrade plan now'}
        </button>
      )}
    </section>
  );
}
