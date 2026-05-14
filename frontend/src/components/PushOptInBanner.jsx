import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isPushSupported,
  getPushOptIn,
  requestPushPermission,
  disablePush,
  startStabilityWatcher,
} from '../utils/pushNotifications';

/**
 * Small banner that asks the user to enable push notifications for
 * stability alerts. Hides itself once the user has opted in or dismissed.
 * Also boots the realtime stability watcher when the user has already opted in.
 */
const DISMISS_KEY = 'right_push_banner_dismissed_v1';

export default function PushOptInBanner() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    // If already granted + opted in, just start the watcher silently.
    if (Notification.permission === 'granted' && getPushOptIn()) {
      const stop = startStabilityWatcher();
      return stop;
    }
    const dismissed = (() => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } })();
    if (Notification.permission === 'default' && !dismissed) setShow(true);
  }, []);

  const enable = async () => {
    setBusy(true);
    const perm = await requestPushPermission();
    setBusy(false);
    if (perm === 'granted') {
      startStabilityWatcher();
      setShow(false);
    } else {
      // Treat denial as dismiss so we don't nag.
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
      setShow(false);
    }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    disablePush();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:max-w-sm z-40 rounded-2xl shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, var(--color-royal-green) 0%, var(--color-royal-green-dark) 100%)',
        border: '1px solid var(--color-desert-gold)',
        color: 'white',
      }}
      role="dialog"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl" aria-hidden></div>
          <div className="flex-1">
            <div className="font-bold text-sm">
              {isAr ? 'فعّل تنبيهات الاستقرار' : 'Enable stability alerts'}
            </div>
            <div className="text-[12px] opacity-90 mt-1 leading-relaxed">
              {isAr
                ? 'سنرسل لك إشعاراً فورياً إذا انخفض استقرار أي أصل تحت 70%.'
                : 'We will push a notification the moment any asset drops below 70% stability.'}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={enable}
                disabled={busy}
                className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
              >
                {busy ? (isAr ? 'لحظة…' : 'Working…') : (isAr ? 'تفعيل' : 'Enable')}
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
              >
                {isAr ? 'لاحقاً' : 'Not now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
