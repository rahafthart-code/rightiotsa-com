import React, { useState } from "react";

/**
 * Generates a guest link for read-only live tracking.
 * The link is signed with a base64-encoded payload (demo-grade — not auth).
 */
export default function ShareLocationButton({ animal, latestTelemetry, isAr }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!animal) return null;

  const buildLink = () => {
    const payload = {
      n: animal.name,
      s: animal.species,
      i: animal.device_imei,
      lat: latestTelemetry?.lat,
      lng: latestTelemetry?.lng,
      ts: latestTelemetry?.timestamp || new Date().toISOString(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    };
    const token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/guest/${encodeURIComponent(token)}`;
  };

  const link = buildLink();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isAr ? 'تتبع مباشر — رايت' : 'Live Tracking — Right',
          text: isAr
            ? `تتبع موقع ${animal.name} مباشرة عبر رايت.`
            : `Track ${animal.name}'s live location via Right.`,
          url: link,
        });
      } catch {
        // user cancelled
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={share}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-white hover:opacity-90"
        style={{ background: 'var(--color-royal-green)' }}
        title={isAr ? 'مشاركة الموقع المباشر' : 'Share live location'}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {isAr ? 'مشاركة الموقع' : 'Share Location'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: 'var(--color-bg-card)', border: '2px solid var(--color-desert-gold)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'رابط المشاركة المباشر' : 'Live Guest Link'}
              </h3>
              <button onClick={() => setOpen(false)} className="text-lg" style={{ color: 'var(--color-text-muted)' }}>✕</button>
            </div>
            <p className="text-[11px] mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {isAr
                ? 'رابط للقراءة فقط، صالح لمدة 24 ساعة. مثالي للأطباء البيطريين أو الرعاة.'
                : 'Read-only link, valid for 24 hours. Perfect for vets or herders.'}
            </p>
            <div
              className="rounded-lg p-2 text-[11px] font-mono break-all"
              style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {link}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={copy}
                className="flex-1 px-3 py-2 text-xs font-bold rounded-lg text-white"
                style={{ background: 'var(--color-royal-green)' }}
              >
                {copied ? (isAr ? '✓ تم النسخ' : '✓ Copied') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-3 py-2 text-xs font-bold rounded-lg"
                style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
              >
                {isAr ? 'معاينة' : 'Preview'}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
