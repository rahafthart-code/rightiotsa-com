import React from "react";
import { useTranslation } from "react-i18next";
import PublicPageShell from "../components/PublicPageShell";

// Default Saudi business WhatsApp number (E.164 without +). Owners can override
// by setting VITE_WHATSAPP_NUMBER in .env. Falls back to a placeholder.
const WA_NUMBER =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHATSAPP_NUMBER) ||
  "966500000000";

function waLink(text) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function ContactPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const channels = [
    {
      key: "support",
      title_ar: "دعم فني",
      title_en: "Technical support",
      desc_ar: "مشكلة في الجهاز، الإشارة، أو لوحة التحكم.",
      desc_en: "Device, signal, or dashboard issues.",
      icon: "🛠️",
      msg_ar: "مرحباً، أحتاج مساعدة فنية. الرقم التسلسلي للجهاز: \nوصف المشكلة: ",
      msg_en: "Hello, I need technical support.\nDevice serial: \nIssue: ",
    },
    {
      key: "sales",
      title_ar: "مبيعات واستفسار باقات",
      title_en: "Sales & plan questions",
      desc_ar: "اختيار الباقة المناسبة، التسعير الخاص، عروض الكميات.",
      desc_en: "Choosing a plan, custom pricing, bulk orders.",
      icon: "💼",
      msg_ar: "مرحباً، أرغب في الاستفسار عن الباقات والأسعار لـ:\nنوع الأصول: \nالعدد التقريبي: ",
      msg_en: "Hello, I'd like to ask about plans & pricing.\nAsset type: \nApprox count: ",
    },
    {
      key: "activate",
      title_ar: "تفعيل جهاز جديد",
      title_en: "Activate a new device",
      desc_ar: "ربط جهاز جديد بحسابك أو نقل ملكية جهاز.",
      desc_en: "Link a new device or transfer ownership.",
      icon: "🔌",
      msg_ar: "مرحباً، أرغب في تفعيل جهاز جديد.\nالرقم التسلسلي: \nاسم الأصل (اختياري): ",
      msg_en: "Hello, I'd like to activate a new device.\nSerial number: \nAsset name (optional): ",
    },
  ];

  return (
    <PublicPageShell
      title={isAr ? "تواصل معنا" : "Contact Us"}
      subtitle={isAr ? "اختر نوع طلبك وسنرد عبر واتساب خلال دقائق" : "Pick a topic and we'll reply on WhatsApp within minutes"}
      maxWidth="max-w-5xl"
    >
      <div className="grid md:grid-cols-3 gap-5">
        {channels.map((c) => (
          <a
            key={c.key}
            href={waLink(isAr ? c.msg_ar : c.msg_en)}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl p-6 transition-transform hover:-translate-y-1"
            style={{
              background: "#ffffff",
              border: "1px solid #e6dcc8",
              boxShadow: "0 6px 24px rgba(0,108,53,0.08)",
            }}
          >
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: "#006c35" }}>
              {isAr ? c.title_ar : c.title_en}
            </h3>
            <p className="text-sm mb-4" style={{ color: "#4a5d4a" }}>
              {isAr ? c.desc_ar : c.desc_en}
            </p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white"
              style={{ background: "#25D366" }}
            >
              <span>💬</span>
              <span>{isAr ? "افتح واتساب" : "Open WhatsApp"}</span>
            </div>
          </a>
        ))}
      </div>

      <div
        className="mt-10 grid sm:grid-cols-3 gap-4 rounded-2xl p-6"
        style={{ background: "#faf6ef", border: "1px dashed #c5a55a" }}
      >
        <div>
          <div className="text-sm font-bold mb-1" style={{ color: "#006c35" }}>📧 {isAr ? "البريد" : "Email"}</div>
          <a href="mailto:support@right.app" className="text-sm" style={{ color: "#1a2e1a" }}>support@right.app</a>
        </div>
        <div>
          <div className="text-sm font-bold mb-1" style={{ color: "#006c35" }}>📍 {isAr ? "المكتب" : "Office"}</div>
          <div className="text-sm" style={{ color: "#1a2e1a" }}>{isAr ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"}</div>
        </div>
        <div>
          <div className="text-sm font-bold mb-1" style={{ color: "#006c35" }}>🕒 {isAr ? "الدوام" : "Hours"}</div>
          <div className="text-sm" style={{ color: "#1a2e1a" }}>
            {isAr ? "السبت–الخميس · 9ص–6م" : "Sat–Thu · 9 AM – 6 PM"}
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
