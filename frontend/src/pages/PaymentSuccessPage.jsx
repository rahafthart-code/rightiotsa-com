import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import PublicPageShell from "../components/PublicPageShell";

export default function PaymentSuccessPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("");

  useEffect(() => {
    const paymentId = search.get("id") || search.get("payment_id");
    if (!paymentId) {
      setStatus("failed");
      setMessage(isAr ? "لم يتم العثور على معرّف الدفعة" : "Payment id missing");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { payment_id: paymentId },
      });
      if (error || !data?.ok) {
        setStatus("failed");
        setMessage(data?.error || error?.message || (isAr ? "فشل التحقق من الدفع" : "Payment verification failed"));
        return;
      }
      setStatus("success");
      setMessage(isAr ? "تم تفعيل اشتراكك بنجاح" : "Your subscription is active");
      setTimeout(() => navigate("/dashboard"), 2500);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PublicPageShell title={isAr ? "نتيجة الدفع" : "Payment Result"}>
      <div className="text-center py-10">
        {status === "verifying" && (
          <>
            <div className="animate-spin h-12 w-12 mx-auto rounded-full border-4 border-t-transparent" style={{ borderColor: "#006c35", borderTopColor: "transparent" }} />
            <p className="mt-4 text-lg" style={{ color: "#4a5d4a" }}>
              {isAr ? "جارِ التحقق من الدفعة..." : "Verifying payment..."}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-6xl mb-3"></div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#006c35" }}>
              {isAr ? "تم الدفع بنجاح" : "Payment successful"}
            </h2>
            <p className="mt-2" style={{ color: "#4a5d4a" }}>{message}</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="text-6xl mb-3">❌</div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#991b1b" }}>
              {isAr ? "فشل الدفع" : "Payment failed"}
            </h2>
            <p className="mt-2" style={{ color: "#4a5d4a" }}>{message}</p>
            <button
              onClick={() => navigate("/subscribe")}
              className="mt-6 px-6 py-3 rounded-lg font-bold text-white"
              style={{ background: "#006c35" }}
            >
              {isAr ? "حاول مرة أخرى" : "Try again"}
            </button>
          </>
        )}
      </div>
    </PublicPageShell>
  );
}
