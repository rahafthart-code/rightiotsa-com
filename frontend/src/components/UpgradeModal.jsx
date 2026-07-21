import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, X } from 'lucide-react';

const REASON_COPY = {
  asset: {
    ar: { title: 'وصلت للحد الأقصى من الأصول', label: 'الأصول' },
    en: { title: "You've reached your asset limit", label: 'Assets' },
  },
  stable: {
    ar: { title: 'وصلت للحد الأقصى من العزب', label: 'العزب' },
    en: { title: "You've reached your stable limit", label: 'Stables' },
  },
  device: {
    ar: { title: 'وصلت للحد الأقصى من الأجهزة', label: 'الأجهزة' },
    en: { title: "You've reached your device limit", label: 'Devices' },
  },
};

/**
 * UpgradeModal — Cyber-Heritage styled paywall dialog shown when a plan
 * limit (assets/stables/devices) is reached. Matches the gold/green palette
 * already established across SubscribePage/OwnerDashboardDark/UsageBar.
 */
export default function UpgradeModal({ open, onClose, reason = 'asset', current, max, plan }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(false);
  }, [open]);

  if (!open) return null;

  const copy = (REASON_COPY[reason] || REASON_COPY.asset)[isAr ? 'ar' : 'en'];
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 100;

  const planLabel = ({
    starter: isAr ? 'المبتدئة' : 'Starter',
    pro: isAr ? 'الاحترافية' : 'Pro',
    enterprise: isAr ? 'المؤسسية' : 'Enterprise',
  })[plan] || plan;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300"
      style={{ background: 'rgba(10,15,12,0.6)', backdropFilter: 'blur(6px)', opacity: mounted ? 1 : 0 }}
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden transition-all duration-300"
        style={{
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(8px)',
          opacity: mounted ? 1 : 0,
          background: 'linear-gradient(160deg, #fffdf8 0%, #faf6ef 100%)',
          boxShadow: '0 0 0 1px rgba(197,165,90,0.5), 0 25px 60px -15px rgba(0,108,53,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heritage gold/green gradient rule at the top */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #c5a55a, #006c35, #c5a55a)' }} />

        <button
          onClick={onClose}
          className="absolute top-4 opacity-60 hover:opacity-100 transition-opacity"
          style={{ [isAr ? 'left' : 'right']: 16, color: '#1a2e1a' }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={20} />
        </button>

        <div className="px-7 pt-8 pb-7 text-center">
          <div
            className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(197,165,90,0.25), rgba(197,165,90,0.05))',
              boxShadow: '0 0 0 6px rgba(197,165,90,0.12)',
            }}
          >
            <Sparkles size={28} style={{ color: '#c5a55a' }} />
          </div>

          <h2 className="text-xl font-extrabold mb-2" style={{ color: '#1a2e1a' }}>
            {copy.title}
          </h2>
          <p className="text-sm mb-5" style={{ color: '#5a6b5a' }}>
            {isAr
              ? `باقتك الحالية (${planLabel}) تسمح بحد أقصى ${max}. رقّي باقتك لإضافة المزيد دون أي انقطاع.`
              : `Your current plan (${planLabel}) allows up to ${max}. Upgrade to add more without interruption.`}
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5" style={{ color: '#1a2e1a' }}>
              <span>{copy.label}</span>
              <span style={{ color: '#c5a55a' }}>{current} / {max}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,108,53,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c5a55a, #006c35)' }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate(`/subscribe?upgrade=true&reason=${reason}_limit`)}
            className="w-full py-3 rounded-xl font-bold text-white transition-transform hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #c5a55a, #006c35)',
              boxShadow: '0 10px 25px -8px rgba(0,108,53,0.5)',
            }}
          >
            {isAr ? 'ترقية الباقة الآن' : 'Upgrade plan now'}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-sm font-medium transition-colors"
            style={{ color: '#5a6b5a' }}
          >
            {isAr ? 'لاحقاً' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  );
}
