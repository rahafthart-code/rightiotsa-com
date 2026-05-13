import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "../assets/logo-transparent.png";

/**
 * Shared shell for the static / legal / informational pages
 * (FAQ, Privacy, Terms, Contact). Enforces the unified
 * Cyber-Heritage identity: cream background (#F5F5DC),
 * royal green (#006c35) accents, Cairo/Tajawal typography, RTL.
 */
export default function PublicPageShell({ title, subtitle, lastUpdated, children, maxWidth = "max-w-4xl" }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen"
      style={{
        background: "#F5F5DC",
        color: "#1a2e1a",
        fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
      }}
    >
      {/* Header — same identity as the Landing page */}
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{
          background: "#006c35",
          borderBottom: "3px solid #c5a55a",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/landing")}
          >
            <img
              src={logoImage}
              alt="Right Logo"
              className="h-10 w-auto"
              style={{ objectFit: "contain" }}
            />
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white">
                {isAr ? "رايت" : "Right"}
              </div>
              <div className="text-[10px]" style={{ color: "#d4b37a" }}>
                {isAr ? "إدارة وتتبع الأصول الذكية" : "Smart Asset Management"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/landing")}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors"
              style={{ background: "#c5a55a", color: "#005a2c" }}
            >
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </button>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#d4b37a",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {i18n.language === "ar" ? "EN" : "عربي"}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`${maxWidth} mx-auto px-4 sm:px-6 py-10 sm:py-14`}>
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ color: "#006c35" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg" style={{ color: "#4a5d4a" }}>
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="text-xs mt-2" style={{ color: "#7a8d7a" }}>
              {lastUpdated}
            </p>
          )}
        </div>

        {children}
      </main>

      {/* Footer */}
      <footer
        className="py-8 px-4 sm:px-6 mt-10"
        style={{ background: "#005a2c", color: "rgba(255,255,255,0.85)" }}
      >
        <div className="max-w-6xl mx-auto text-center text-sm">
          {isAr
            ? "© 2026 رايت — جميع الحقوق محفوظة"
            : "© 2026 Right — All rights reserved"}
        </div>
      </footer>
    </div>
  );
}
