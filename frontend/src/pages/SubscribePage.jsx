import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import PublicPageShell from "../components/PublicPageShell";
import { PLANS } from "../constants/plans";

export default function SubscribePage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [currentSub, setCurrentSub] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  // Load the signed-in user's active subscription from the DB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { if (!cancelled) setSubLoading(false); return; }
        const { data } = await supabase
          .from("subscriptions")
          .select("plan,status,trial_ends_at,current_period_end,max_assets,max_stables,billing_cycle,price_sar")
          .eq("owner_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setCurrentSub(data || null);
      } catch (e) {
        console.warn("Failed to load subscription");
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubscribe(plan) {
    setError("");
    setLoadingId(plan.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { state: { from: { pathname: "/subscribe" } } });
        return;
      }
      const { data, error: invokeError } = await supabase.functions.invoke("create-payment", {
        body: { plan_id: plan.id },
      });
      if (invokeError) throw invokeError;
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else if (data?.requires_setup) {
        setError(isAr
          ? "بوابة الدفع (Edfapay) قيد الربط النهائي وستتاح قريباً. تواصل معنا عبر الواتساب لتفعيل اشتراكك يدوياً."
          : "Edfapay gateway is being finalized and will be available shortly. Contact us on WhatsApp to activate your subscription manually.");
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message || (isAr ? "تعذّر بدء عملية الدفع" : "Could not start payment"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <PublicPageShell
      title={isAr ? "اختر باقتك" : "Choose your plan"}
      subtitle={isAr ? "أسعار شفافة، لا رسوم خفية، إلغاء في أي وقت" : "Transparent pricing, no hidden fees, cancel anytime"}
      maxWidth="max-w-6xl"
    >
      {error && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm text-center"
          style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
        >
          {error}
        </div>
      )}

      {/* Current subscription banner from DB */}
      {!subLoading && currentSub && (() => {
        const trialMs = currentSub.trial_ends_at ? new Date(currentSub.trial_ends_at).getTime() - Date.now() : 0;
        const periodMs = currentSub.current_period_end ? new Date(currentSub.current_period_end).getTime() - Date.now() : 0;
        const daysLeft = Math.max(0, Math.ceil((currentSub.status === 'trial' ? trialMs : periodMs) / 86400000));
        const isActive = currentSub.status === 'active';
        const isTrial = currentSub.status === 'trial';
        return (
          <div
            className="mb-6 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
            style={{
              background: isActive ? 'rgba(0,108,53,0.08)' : isTrial ? 'rgba(197,165,90,0.14)' : '#fef2f2',
              border: `1px solid ${isActive ? 'rgba(0,108,53,0.25)' : isTrial ? 'rgba(197,165,90,0.4)' : '#fecaca'}`,
            }}
          >
            <div className="text-sm">
              <strong style={{ color: '#006c35' }}>
                {isAr ? 'باقتك الحالية:' : 'Your current plan:'}
              </strong>{' '}
              <span className="font-bold capitalize">{currentSub.plan}</span>
              <span className="mx-2 opacity-50">·</span>
              <span style={{ color: isActive ? '#006c35' : isTrial ? '#8a6d2a' : '#991b1b' }}>
                {isTrial ? (isAr ? 'تجربة مجانية' : 'Free trial')
                 : isActive ? (isAr ? 'مفعّلة' : 'Active')
                 : (isAr ? currentSub.status : currentSub.status)}
              </span>
              {(isTrial || isActive) && daysLeft > 0 && (
                <>
                  <span className="mx-2 opacity-50">·</span>
                  <span>{isAr ? `يتبقى ${daysLeft} يوماً` : `${daysLeft} days left`}</span>
                </>
              )}
            </div>
            <div className="text-xs" style={{ color: '#4a5d4a' }}>
              {isAr
                ? `حدّ الأصول: ${currentSub.max_assets ?? '—'} · حدّ الإسطبلات: ${currentSub.max_stables ?? '—'}`
                : `Asset limit: ${currentSub.max_assets ?? '—'} · Stables: ${currentSub.max_stables ?? '—'}`}
            </div>
          </div>
        );
      })()}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isPopular = plan.badge?.startsWith("ar:");
          const badgeText = plan.badge
            ? (isAr ? plan.badge.split("|")[0].slice(3) : plan.badge.split("|")[1].slice(3))
            : null;
          return (
            <div
              key={plan.id}
              className="rounded-2xl p-6 flex flex-col relative"
              style={{
                background: "#ffffff",
                border: isPopular ? `2px solid ${plan.accent}` : "1px solid #e6dcc8",
                boxShadow: isPopular ? "0 12px 40px rgba(0,108,53,0.18)" : "0 4px 20px rgba(0,108,53,0.06)",
                transform: isPopular ? "scale(1.03)" : "none",
              }}
            >
              {badgeText && (
                <div
                  className="absolute -top-3 right-6 px-3 py-1 text-xs font-bold rounded-full text-white"
                  style={{ background: plan.accent }}
                >
                  {badgeText}
                </div>
              )}

              <h3 className="text-2xl font-extrabold mb-1" style={{ color: plan.accent }}>
                {isAr ? plan.name_ar : plan.name_en}
              </h3>
              <p className="text-sm mb-4" style={{ color: "#4a5d4a" }}>
                {isAr ? plan.description_ar : plan.description_en}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold" style={{ color: "#1a2e1a" }}>
                  {plan.price}
                </span>
                <span className="text-base font-bold mx-1" style={{ color: "#4a5d4a" }}>
                  {isAr ? "ر.س" : "SAR"}
                </span>
                <span className="text-sm" style={{ color: "#7a8d7a" }}>
                  {isAr ? plan.cycle_ar : plan.cycle_en}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {(isAr ? plan.features_ar : plan.features_en).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#1a2e1a" }}>
                    <span style={{ color: "#006c35" }} className="font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {(() => {
                const isCurrent = currentSub?.plan === plan.id && (currentSub?.status === 'active' || currentSub?.status === 'trial');
                return (
                  <button
                    onClick={() => !isCurrent && handleSubscribe(plan)}
                    disabled={loadingId === plan.id || isCurrent}
                    className="w-full py-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-70"
                    style={{ background: isCurrent ? '#7a8d7a' : plan.accent, cursor: isCurrent ? 'default' : 'pointer' }}
                  >
                    {isCurrent
                      ? (isAr ? '✓ باقتك الحالية' : '✓ Your current plan')
                      : loadingId === plan.id
                        ? (isAr ? 'جارِ التحويل...' : 'Redirecting...')
                        : (isAr ? 'اشترك الآن' : 'Subscribe now')}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>

      <p className="text-center mt-8 text-sm" style={{ color: "#7a8d7a" }}>
        {isAr
          ? "جميع الأسعار شاملة الضريبة. الدفع مؤمَّن عبر بوابة Edfapay (قريباً)."
          : "All prices include VAT. Secured payments via Edfapay (coming soon)."}
      </p>
    </PublicPageShell>
  );
}
