import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import logoImage from "../assets/logo-transparent.png";

// Cyber-Heritage palette
const CREAM = "#F5F5DC";
const CREAM_SOFT = "#FAF7F0";
const ROYAL_GREEN = "#006c35";
const ROYAL_GREEN_DARK = "#004f26";
const CRIMSON = "#8B0000";
const GOLD = "#C5A55A";
const INK = "#1A1A1A";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { plan } = location.state || {};
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!plan) navigate("/");
  }, [plan, navigate]);

  if (!plan) return null;

  const VAT_RATE = 0.15;
  const subtotal = plan.price_sar;
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  const handlePayment = async () => {
    setProcessing(true);
    setError("");
    try {
      // Edfapay integration will be wired up once merchant credentials are provided.
      // For now we surface a friendly message and route the user back to the dashboard.
      await new Promise((r) => setTimeout(r, 800));
      setError(
        isAr
          ? "بوابة Edfapay قيد الربط النهائي. سيتم تفعيل الدفع الفعلي قريباً."
          : "Edfapay gateway is being finalized. Live payments will be enabled shortly."
      );
    } catch (err) {
      console.error("Payment error:", err);
      setError(isAr ? "تعذّر بدء الدفع. حاول مرة أخرى." : "Could not start payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen"
      style={{
        background: CREAM,
        fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
        color: INK,
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 shadow-sm"
        style={{ background: ROYAL_GREEN, borderBottom: `3px solid ${GOLD}` }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <img src={logoImage} alt="Right" className="h-9 w-auto" style={{ objectFit: "contain" }} />
          <button
            onClick={() => navigate("/")}
            className="text-white/90 hover:text-white text-sm font-bold"
          >
            {isAr ? "إغلاق ✕" : "Close ✕"}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: ROYAL_GREEN_DARK }}>
            {isAr ? "إتمام الدفع الآمن" : "Secure Checkout"}
          </h1>
          <p className="text-sm" style={{ color: "#5a5a5a" }}>
            {isAr ? "مدفوعات معتمدة عبر ClickPay" : "Payments powered by ClickPay"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order summary */}
          <section
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: `1px solid ${GOLD}55` }}
          >
            <h2 className="text-lg font-bold mb-5" style={{ color: ROYAL_GREEN_DARK }}>
              {isAr ? "ملخص الطلب" : "Order Summary"}
            </h2>

            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: CREAM_SOFT, border: `1px dashed ${ROYAL_GREEN}55` }}
            >
              <div className="text-xs mb-1" style={{ color: "#666" }}>
                {isAr ? "الباقة" : "Plan"}
              </div>
              <div className="text-base font-bold" style={{ color: INK }}>
                {isAr ? plan.name_ar : plan.name_en}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <Row label={isAr ? "المبلغ الأساسي" : "Subtotal"} value={`${subtotal.toFixed(2)} ${isAr ? "ر.س" : "SAR"}`} />
              <Row label={isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"} value={`${vatAmount.toFixed(2)} ${isAr ? "ر.س" : "SAR"}`} />
              <div
                className="flex justify-between pt-3 mt-3 text-lg font-bold"
                style={{ borderTop: `1px solid ${GOLD}55`, color: ROYAL_GREEN_DARK }}
              >
                <span>{isAr ? "الإجمالي" : "Total"}</span>
                <span>{total.toFixed(2)} {isAr ? "ر.س" : "SAR"}</span>
              </div>
            </div>
          </section>

          {/* Payment action */}
          <section
            className="rounded-2xl p-6 shadow-sm flex flex-col"
            style={{ background: "#fff", border: `1px solid ${GOLD}55` }}
          >
            <h2 className="text-lg font-bold mb-5" style={{ color: ROYAL_GREEN_DARK }}>
              {isAr ? "طريقة الدفع" : "Payment Method"}
            </h2>

            <div
              className="rounded-xl p-4 mb-4 text-sm"
              style={{ background: CREAM_SOFT, border: `1px solid ${ROYAL_GREEN}33`, color: "#444" }}
            >
              {isAr
                ? "سيتم تحويلك إلى صفحة الدفع الآمنة الخاصة بـ Edfapay لإتمام العملية ببطاقة Mada / Visa / Mastercard أو Apple Pay."
                : "You will be redirected to Edfapay's secure page to complete with Mada / Visa / Mastercard or Apple Pay."}
              <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-bold" style={{ background: '#fff', color: ROYAL_GREEN_DARK, border: `1px solid ${GOLD}55` }}>
                <span style={{ color: GOLD }}>●</span> Edfapay
              </div>
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2 mb-3 text-xs"
                style={{ background: "#FCEBEB", color: CRIMSON, border: `1px solid ${CRIMSON}33` }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full rounded-xl px-6 py-4 text-white text-base font-bold shadow-md disabled:opacity-60 transition-transform hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${ROYAL_GREEN}, ${ROYAL_GREEN_DARK})`,
                border: `1px solid ${GOLD}`,
              }}
            >
              {processing
                ? (isAr ? "جارٍ التحويل…" : "Redirecting…")
                : (isAr ? `ادفع ${total.toFixed(2)} ر.س` : `Pay ${total.toFixed(2)} SAR`)}
            </button>

            <div
              className="mt-4 rounded-lg px-3 py-2 text-xs flex items-center gap-2"
              style={{ background: CREAM_SOFT, color: "#555" }}
            >
              <span style={{ color: ROYAL_GREEN }}>✓</span>
              {isAr ? "اتصال مشفّر SSL 256-bit · متوافق مع SAMA" : "256-bit SSL · SAMA compliant"}
            </div>

            <p className="text-center text-[11px] mt-4" style={{ color: "#888" }}>
              {isAr
                ? "بالنقر على دفع، فإنك توافق على الشروط والأحكام."
                : 'By clicking "Pay" you agree to the Terms & Conditions.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between" style={{ color: "#444" }}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
