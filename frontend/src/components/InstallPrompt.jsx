import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DISMISS_KEY = "right_install_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Mobile-only "Install Right App" banner.
 * Uses the native beforeinstallprompt when available; otherwise shows
 * an elegant CTA so the experience is consistent on iOS too.
 */
export default function InstallPrompt() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = parseInt(
      localStorage.getItem(DISMISS_KEY) || "0",
      10,
    );
    if (Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (!isMobile || isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after a short delay even without the native event (iOS Safari).
    const timer = setTimeout(() => setVisible(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted" || outcome === "dismissed") {
        setDeferredPrompt(null);
        dismiss();
      }
    } else {
      // iOS fallback: explain how to install.
      alert(
        isAr
          ? "لتثبيت التطبيق على iPhone: اضغط على زر المشاركة ⬆️ ثم اختر «أضف إلى الشاشة الرئيسية»."
          : "To install on iPhone: tap the Share button ⬆️ and choose “Add to Home Screen”.",
      );
      dismiss();
    }
  };

  if (!visible) return null;

  return (
    <div
      className="md:hidden fixed bottom-20 inset-x-3 z-30 rounded-2xl p-3 flex items-center gap-3 animate-fade-in"
      style={{
        background:
          "linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))",
        borderInlineStart: "4px solid var(--color-desert-gold)",
        boxShadow: "0 8px 24px rgba(0,108,53,0.35)",
        color: "white",
      }}
      role="dialog"
      aria-label={isAr ? "تثبيت التطبيق" : "Install app"}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{
          background: "var(--color-desert-gold)",
          color: "var(--color-royal-green-dark)",
        }}
      >
        📲
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight">
          {isAr
            ? "ثبّت تطبيق رايت لتنبيهات فورية"
            : "Install Right App for Instant Alerts"}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "var(--color-desert-gold-light)" }}
        >
          {isAr
            ? "تجربة أسرع ووصول دون اتصال"
            : "Faster experience and offline access"}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={install}
          className="px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap"
          style={{
            background: "var(--color-desert-gold)",
            color: "var(--color-royal-green-dark)",
          }}
        >
          {isAr ? "تثبيت" : "Install"}
        </button>
        <button
          onClick={dismiss}
          className="px-3 py-1 text-[10px] font-medium rounded-lg whitespace-nowrap text-white/80 hover:text-white"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          {isAr ? "لاحقاً" : "Later"}
        </button>
      </div>
    </div>
  );
}
