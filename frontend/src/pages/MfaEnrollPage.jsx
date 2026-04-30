import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";

/**
 * MFA TOTP enrollment page.
 * Step 1 — show QR + secret. User scans with Authenticator app.
 * Step 2 — user types the 6-digit code; we verify the factor.
 */
export default function MfaEnrollPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  const [factorId, setFactorId] = useState(null);
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setError("");
      try {
        // Clean up any unverified factors first
        const { data: list } = await supabase.auth.mfa.listFactors();
        const stale = (list?.totp || []).find(f => f.status === "unverified");
        if (stale) await supabase.auth.mfa.unenroll({ factorId: stale.id });

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Right IoT (${new Date().toLocaleDateString()})`,
        });
        if (error) throw error;
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e) {
        setError(e.message || "MFA enroll failed");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  async function verify(e) {
    e.preventDefault();
    if (!factorId || code.length < 6) return;
    setBusy(true);
    setError("");
    try {
      const ch = await supabase.auth.mfa.challenge({ factorId });
      if (ch.error) throw ch.error;
      const v = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.data.id,
        code,
      });
      if (v.error) throw v.error;
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: "var(--color-bg-primary, #faf7f0)" }} dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-lg"
           style={{ background: "white", borderColor: "var(--color-border-tertiary, #e5e7eb)" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: "#006c35" }}>
          {isAr ? "🔐 تفعيل المصادقة الثنائية" : "🔐 Enable Two-Factor Authentication"}
        </h1>
        <p className="text-sm mb-4 text-slate-600">
          {isAr
            ? "امسح الرمز ضوئيًا بتطبيق Google Authenticator أو Authy، ثم أدخل الرمز المكوّن من 6 أرقام."
            : "Scan the QR with Google Authenticator or Authy, then enter the 6-digit code."}
        </p>

        {error && (
          <div className="mb-3 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {done ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-medium" style={{ color: "#006c35" }}>
              {isAr ? "تم تفعيل المصادقة الثنائية بنجاح" : "MFA enabled successfully"}
            </p>
          </div>
        ) : (
          <>
            {qr && (
              <div className="flex justify-center mb-4">
                <img src={qr} alt="MFA QR Code" className="w-48 h-48 border rounded" />
              </div>
            )}
            {secret && (
              <div className="mb-4 text-center">
                <div className="text-xs text-slate-500 mb-1">
                  {isAr ? "أو أدخل المفتاح يدوياً:" : "Or enter the key manually:"}
                </div>
                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded select-all break-all">
                  {secret}
                </code>
              </div>
            )}

            <form onSubmit={verify} className="space-y-3">
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder={isAr ? "000000" : "000000"}
                className="w-full text-center tracking-[0.5em] text-lg font-bold rounded-lg border px-3 py-2.5"
                style={{ borderColor: "#006c35" }}
                required
              />
              <button
                type="submit" disabled={busy || code.length !== 6}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "#006c35" }}
              >
                {busy
                  ? (isAr ? "جارٍ التحقق..." : "Verifying...")
                  : (isAr ? "تأكيد وتفعيل" : "Verify & Enable")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
