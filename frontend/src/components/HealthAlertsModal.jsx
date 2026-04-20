import React, { useEffect, useState } from "react";

const STORAGE_KEY = "right_health_alerts_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Engagement modal shown after the user views a health report.
 * Heritage-themed; offers a notification toggle that mimics system settings.
 */
export default function HealthAlertsModal({ open, onClose, isAr }) {
  const [enabled, setEnabled] = useState(false);
  const [granted, setGranted] = useState(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false,
  );

  useEffect(() => {
    if (open) {
      // Persist dismissal so it doesn't pop again repeatedly
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    }
  }, [open]);

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    if (next && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const result = await Notification.requestPermission();
        setGranted(result === 'granted');
        if (result === 'granted') {
          new Notification(isAr ? 'تم تفعيل التنبيهات الصحية' : 'Health alerts enabled', {
            body: isAr ? 'سنخبرك فوراً عن أي تغير في حالة قطيعك.' : "We'll notify you instantly about any herd health change.",
            icon: '/icon-192.png',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-card)', border: '2px solid var(--color-desert-gold)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-6 text-center text-white"
          style={{ background: 'linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))' }}
        >
          <div className="text-4xl mb-2">🔔</div>
          <h2 className="text-base font-bold leading-snug">
            {isAr ? 'ابقَ على اطلاع دائم' : 'Stay always informed'}
          </h2>
          <p className="text-[12px] mt-2" style={{ color: 'var(--color-desert-gold-light)' }}>
            {isAr
              ? 'فعّل تنبيهات الحالة الصحية لحلالك الآن.'
              : "Enable health status alerts for your herd now."}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'تنبيهات الصحة' : 'Health Alerts'}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {isAr ? 'حمى، إجهاد، وتغير الحرارة' : 'Fever, stress & temperature changes'}
              </div>
            </div>
            <button
              role="switch"
              aria-checked={enabled}
              onClick={handleToggle}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: enabled ? 'var(--color-royal-green)' : 'var(--color-cream-darker)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ left: enabled ? '22px' : '2px' }}
              />
            </button>
          </div>

          <ul className="space-y-2 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-royal-green)' }}>✓</span>
              {isAr ? 'إشعار فوري عند تجاوز درجة الحرارة الآمنة' : 'Instant notification when temperature exceeds safe range'}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-royal-green)' }}>✓</span>
              {isAr ? 'تقارير صحية أسبوعية تلقائية' : 'Automatic weekly health reports'}
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-royal-green)' }}>✓</span>
              {isAr ? 'تنبيهات السياج الجغرافي على هاتفك' : 'Geofence alerts pushed to your phone'}
            </li>
          </ul>

          {granted && enabled && (
            <div
              className="text-[11px] rounded-lg px-3 py-2"
              style={{ background: 'var(--color-success-bg)', color: 'var(--color-royal-green)', border: '1px solid rgba(0,108,53,0.25)' }}
            >
              ✓ {isAr ? 'تم تفعيل تنبيهات النظام بنجاح' : 'System notifications enabled successfully'}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              {isAr ? 'لاحقاً' : 'Maybe later'}
            </button>
            <button
              onClick={() => { if (!enabled) handleToggle(); else onClose(); }}
              className="flex-1 px-3 py-2 text-xs font-bold rounded-lg text-white"
              style={{ background: 'var(--color-royal-green)' }}
            >
              {enabled ? (isAr ? 'تم' : 'Done') : (isAr ? 'فعّل الآن' : 'Enable Now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldShowHealthAlertsModal() {
  try {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    return Date.now() - last >= DISMISS_TTL_MS;
  } catch {
    return true;
  }
}
