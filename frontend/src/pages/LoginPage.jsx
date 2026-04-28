import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { devTestLogin, requestOtp, verifyOtp } from "../api";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState("email"); // "email" or "mobile"
  const [agreementChecked, setAgreementChecked] = useState(
    !!localStorage.getItem("dataAgreementAccepted"),
  );

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const isFirstLogin = !localStorage.getItem("dataAgreementAccepted");
  
  // Auto-detect input type
  const handleInputChange = (value) => {
    setEmailOrMobile(value);
    // Auto-detect: if contains @, it's email; if starts with 05 or 966, it's mobile
    if (value.includes('@')) {
      setInputType('email');
    } else if (value.startsWith('05') || value.startsWith('966') || value.startsWith('+966')) {
      setInputType('mobile');
    }
  };

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestOtp({ email_or_mobile: emailOrMobile });
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.detail || t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");

    if (isFirstLogin && !agreementChecked) {
      setError(t('dataAgreement') + ' ' + t('dataAgreementName'));
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(emailOrMobile, code);
      if (isFirstLogin && agreementChecked) {
        localStorage.setItem("dataAgreementAccepted", "true");
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || t('invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    setError("");
    setLoading(true);
    try {
      await devTestLogin();
      if (isFirstLogin && agreementChecked) {
        localStorage.setItem("dataAgreementAccepted", "true");
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-xl shadow-emerald-500/10 p-6">
        <h1 className="text-xl font-semibold text-slate-50 mb-2">
          {t('signInTitle')}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {t('signInSubtitle')}
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {error}
          </div>
        )}

        {step === "email" && (
          <>
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {i18n.language === 'ar' ? 'البريد الإلكتروني أو رقم الجوال' : 'Email or Mobile Number'}
                </label>
                <input
                  type="text"
                  value={emailOrMobile}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                  placeholder={i18n.language === 'ar' ? 'you@farm.co أو 0501234567' : 'you@farm.co or 0501234567'}
                  required
                  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                />
                {emailOrMobile && (
                  <p className="mt-1 text-xs text-slate-500">
                    {inputType === 'email' 
                      ? (i18n.language === 'ar' ? '📧 سيتم إرسال الرمز إلى البريد الإلكتروني' : '📧 Code will be sent to email')
                      : (i18n.language === 'ar' ? '📱 سيتم إرسال الرمز إلى رقم الجوال' : '📱 Code will be sent to mobile')
                    }
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('sendingCode') : t('sendLoginCode')}
              </button>
            </form>
            
            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                {t('noAccount') || (i18n.language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?")}
                {' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  {i18n.language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
                </button>
              </p>
            </div>
            
            {import.meta.env.DEV && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-dashed border-emerald-500/60 bg-slate-950/60 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {t('devTestLogin')}
                </button>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t('devTestLoginInfo')}{" "}
                  <span className="font-mono text-emerald-300">
                    test@example.com
                  </span>{" "}
                  {t('devTestLoginEmail')}
                </p>
              </div>
            )}
          </>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('sixDigitCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-full tracking-[0.4em] text-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-lg font-semibold text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('codePlaceholder')}
                required
              />
            </div>

            {isFirstLogin && (
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                <input
                  id="agreement"
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/70"
                />
                <label htmlFor="agreement" className="text-xs text-slate-300">
                  {t('dataAgreement')}{" "}
                  <span className="font-medium text-emerald-300">
                    {t('dataAgreementName')}
                  </span>
                  {t('dataAgreementText')}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isFirstLogin && !agreementChecked)}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('verifying') : t('verifyAndContinue')}
            </button>
          </form>
        )}

        {step === "code" && (
          <button
            type="button"
            className="mt-4 text-xs text-slate-400 hover:text-slate-200"
            onClick={() => {
              setCode("");
              setStep("email");
            }}
          >
            {t('useDifferentEmail')}
          </button>
        )}
      </div>
    </div>
  );
}
