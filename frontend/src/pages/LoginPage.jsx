import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, PlayCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { enableDemoMode } from "../utils/mockData";
import logoImage from "../assets/logo-transparent.png";

// Saudi mobile login: +966 prefix is fixed; user enters 9 digits starting with 5.
// Calls the `secure-otp` edge function which handles rate-limiting and event logging.

const MAX_FAILS = 3;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_SECONDS = 60;
const FAIL_KEY = "otp_fails";
const LOCK_KEY = "otp_locked_until";

function getLockoutRemaining() {
  const until = Number(localStorage.getItem(LOCK_KEY) || 0);
  if (!until || until < Date.now()) return 0;
  return until - Date.now();
}

function recordFailure() {
  const fails = Number(localStorage.getItem(FAIL_KEY) || 0) + 1;
  localStorage.setItem(FAIL_KEY, String(fails));
  if (fails >= MAX_FAILS) {
    localStorage.setItem(LOCK_KEY, String(Date.now() + LOCKOUT_MS));
  }
}

function clearFailures() {
  localStorage.removeItem(FAIL_KEY);
  localStorage.removeItem(LOCK_KEY);
}

export default function LoginPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [step, setStep] = useState("phone"); // 'phone' | 'code'
  const [phoneDigits, setPhoneDigits] = useState(""); // 9 digits, starts with 5
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [lockMs, setLockMs] = useState(getLockoutRemaining());

  const otpRefs = useRef([]);

  // Lockout countdown tick
  useEffect(() => {
    if (lockMs <= 0) return;
    const t = setInterval(() => {
      const rem = getLockoutRemaining();
      setLockMs(rem);
      if (rem <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [lockMs]);

  // Resend countdown tick
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const fullPhone = `+966${phoneDigits}`;
  const isPhoneValid = /^5\d{8}$/.test(phoneDigits);
  const otpString = otp.join("");
  const isOtpComplete = otpString.length === 6;

  async function callEdge(action, body) {
    const { data, error: invokeError } = await supabase.functions.invoke("secure-otp", {
      body: { action, ...body },
    });
    if (invokeError) {
      // Try to read JSON error from context
      let msg = invokeError.message || "Network error";
      try {
        const ctx = invokeError.context;
        if (ctx && typeof ctx.json === "function") {
          const j = await ctx.json();
          if (j?.error) msg = j.error;
        }
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    return data;
  }

  async function handleRequestOtp(e) {
    e?.preventDefault();
    setError("");
    if (lockMs > 0) return;
    if (!isPhoneValid) {
      setError(isAr ? "رقم الجوال يجب أن يبدأ بـ 5 ويتكون من 9 أرقام" : "Mobile must start with 5 and be 9 digits");
      return;
    }
    setLoading(true);
    try {
      await callEdge("request", { identifier: fullPhone });
      setStep("code");
      setResendIn(RESEND_SECONDS);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err.message || (isAr ? "تعذّر إرسال الرمز" : "Could not send code"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(codeStr) {
    setError("");
    if (lockMs > 0) return;
    setLoading(true);
    try {
      const data = await callEdge("verify", { identifier: fullPhone, code: codeStr });
      const session = data?.session;
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error(isAr ? "استجابة غير صالحة" : "Invalid response");
      }
      // Persist the Supabase session so onAuthStateChange picks it up.
      const { error: setErr } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (setErr) throw setErr;
      clearFailures();
      navigate(from, { replace: true });
    } catch (err) {
      recordFailure();
      const newLock = getLockoutRemaining();
      setLockMs(newLock);
      if (newLock > 0) {
        setError(isAr ? "تم حظر المحاولات لمدة 10 دقائق بسبب محاولات فاشلة متكررة" : "Locked for 10 minutes after repeated failed attempts");
      } else {
        setError(err.message || (isAr ? "رمز غير صحيح" : "Invalid code"));
      }
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function setOtpAt(i, val) {
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      // Paste of multiple digits
      const arr = ["", "", "", "", "", ""];
      digits.slice(0, 6).split("").forEach((d, idx) => (arr[idx] = d));
      setOtp(arr);
      const lastIdx = Math.min(digits.length, 6) - 1;
      otpRefs.current[lastIdx]?.focus();
      if (arr.join("").length === 6 && !loading && lockMs <= 0) {
        handleVerifyOtp(arr.join(""));
      }
      return;
    }
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.join("").length === 6 && !loading && lockMs <= 0) {
      handleVerifyOtp(next.join(""));
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  const lockMinutes = Math.ceil(lockMs / 60000);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#F5F5DC", fontFamily: "'Cairo','Tajawal',system-ui,sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8"
        style={{ background: "#ffffff", border: "1px solid #e6dcc8", boxShadow: "0 10px 40px rgba(0,108,53,0.10)" }}
      >
        <div className="text-center mb-6">
          <img src={logoImage} alt="Right" className="h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold" style={{ color: "#006c35" }}>
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#4a5d4a" }}>
            {step === "phone"
              ? (isAr ? "أدخل رقم جوالك السعودي لاستلام رمز التحقق" : "Enter your Saudi mobile to receive a verification code")
              : (isAr ? `سنرسل الرمز إلى ${fullPhone}` : `We sent a code to ${fullPhone}`)}
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg px-3 py-2 text-sm"
            style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
          >
            {error}
          </div>
        )}

        {lockMs > 0 && (
          <div
            className="mb-4 rounded-lg px-3 py-2 text-sm text-center inline-flex items-center justify-center gap-2 w-full"
            style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
          >
            <Lock size={14} />
            {isAr ? `محظور مؤقتاً — حاول بعد ${lockMinutes} دقيقة` : `Locked — try again in ${lockMinutes} min`}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleRequestOtp} className="std-form space-y-4">
            <label className="block text-sm font-bold" style={{ color: "#006c35" }}>
              {isAr ? "رقم الجوال" : "Mobile number"}
            </label>
            <div
              className="flex items-stretch rounded-lg overflow-hidden"
              style={{ border: "1px solid #e6dcc8", background: "#faf6ef" }}
              dir="ltr"
            >
              <span
                className="px-3 flex items-center text-sm font-bold select-none"
                style={{ background: "#006c35", color: "#fff" }}
              >
                +966
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="5XXXXXXXX"
                className="flex-1 px-3 py-3 text-base bg-transparent outline-none tracking-wider"
                style={{ color: "#1a2e1a" }}
                disabled={loading || lockMs > 0}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isPhoneValid || lockMs > 0}
              className="w-full py-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "#006c35" }}
            >
              {loading
                ? (isAr ? "جارِ الإرسال..." : "Sending...")
                : (isAr ? "إرسال رمز التحقق" : "Send verification code")}
            </button>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-5">
            <div className="flex justify-center gap-2" dir="ltr">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={6}
                  value={d}
                  onChange={(e) => setOtpAt(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text").replace(/\D/g, "");
                    if (text.length > 1) {
                      e.preventDefault();
                      setOtpAt(0, text);
                    }
                  }}
                  disabled={loading || lockMs > 0}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg outline-none transition-colors"
                  style={{
                    background: "#faf6ef",
                    border: `2px solid ${d ? "#006c35" : "#e6dcc8"}`,
                    color: "#006c35",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOtp(otpString)}
              disabled={loading || !isOtpComplete || lockMs > 0}
              className="w-full py-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "#006c35" }}
            >
              {loading
                ? (isAr ? "جارِ التحقق..." : "Verifying...")
                : (isAr ? "تأكيد ودخول" : "Verify & continue")}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); }}
                className="font-bold"
                style={{ color: "#006c35" }}
              >
                {isAr ? "← تغيير الرقم" : "← Change number"}
              </button>
              <button
                type="button"
                disabled={resendIn > 0 || loading || lockMs > 0}
                onClick={handleRequestOtp}
                className="font-bold disabled:opacity-50"
                style={{ color: "#006c35" }}
              >
                {resendIn > 0
                  ? (isAr ? `إعادة الإرسال خلال ${resendIn}s` : `Resend in ${resendIn}s`)
                  : (isAr ? "إعادة إرسال الرمز" : "Resend code")}
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-xs" style={{ color: "#7a8d7a" }}>
          {isAr ? "بالمتابعة فإنك توافق على " : "By continuing you agree to our "}
          <a href="/terms" className="underline" style={{ color: "#006c35" }}>
            {isAr ? "الشروط" : "Terms"}
          </a>
          {isAr ? " و " : " & "}
          <a href="/privacy" className="underline" style={{ color: "#006c35" }}>
            {isAr ? "الخصوصية" : "Privacy"}
          </a>
        </div>
      </div>
    </div>
  );
}
