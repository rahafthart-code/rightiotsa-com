import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { requestOtp, verifyOtp } from "../api";
import logoImage from "../assets/logo-transparent.png";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState("register"); // "register", "verify", or "welcome"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [nationalIdValid, setNationalIdValid] = useState(false);
  const [nationalIdTouched, setNationalIdTouched] = useState(false);
  const [mobileValid, setMobileValid] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  
  // Registration form data
  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    email: "",
    mobile: "",
    city: "",
    assetType: ""
  });
  
  // OTP code
  const [code, setCode] = useState("");
  
  const from = location.state?.from?.pathname || "/dashboard";
  
  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Email validation
    if (name === 'email') {
      setEmailTouched(true);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(value));
    }
    
    // National ID validation (exactly 10 digits)
    if (name === 'nationalId') {
      setNationalIdTouched(true);
      const nationalIdRegex = /^\d{10}$/;
      setNationalIdValid(nationalIdRegex.test(value));
    }
    
    // Mobile validation (Saudi format: 05xxxxxxxx or 9665xxxxxxxx)
    if (name === 'mobile') {
      setMobileTouched(true);
      const mobileRegex = /^(05\d{8}|9665\d{8}|\+9665\d{8})$/;
      setMobileValid(mobileRegex.test(value.replace(/\s/g, '')));
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.fullName || !formData.nationalId || !formData.email || !formData.mobile || !formData.city || !formData.assetType) {
      setError(i18n.language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    
    if (!emailValid) {
      setError(i18n.language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }
    
    if (!nationalIdValid) {
      setError(i18n.language === 'ar' ? 'يرجى إدخال رقم هوية وطنية صحيح (10 أرقام)' : 'Please enter a valid National ID (10 digits)');
      return;
    }
    
    if (!mobileValid) {
      setError(i18n.language === 'ar' ? 'يرجى إدخال رقم جوال سعودي صحيح (مثال: 0501234567)' : 'Please enter a valid Saudi mobile number (e.g., 0501234567)');
      return;
    }
    
    setLoading(true);
    try {
      await requestOtp({
        email: formData.email,
        full_name: formData.fullName,
        national_id: formData.nationalId,
        mobile: formData.mobile,
        city: formData.city,
        asset_type: formData.assetType
      });
      setStep("verify");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '';
      // Check if user already exists
      if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists')) {
        setError(i18n.language === 'ar' 
          ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' 
          : 'This email is already registered. Please login.');
      } else {
        setError(errorMsg || (i18n.language === 'ar' ? 'فشل إرسال الرمز' : 'Failed to send code'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    
    if (!code || code.length < 4) {
      setError(i18n.language === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter verification code');
      return;
    }
    
    setLoading(true);
    try {
      await verifyOtp(formData.email, code);
      localStorage.setItem("dataAgreementAccepted", "true");
      // Store user registration data for profile
      localStorage.setItem("userProfile", JSON.stringify({
        fullName: formData.fullName,
        nationalId: formData.nationalId,
        mobile: formData.mobile,
        email: formData.email,
        city: formData.city,
        assetType: formData.assetType
      }));
      
      // Show welcome message, then navigate to dashboard
      setStep("welcome");
      
      // Auto-navigate to dashboard after 4 seconds
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.detail || (i18n.language === 'ar' ? 'رمز خاطئ أو منتهي الصلاحية' : 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-submit when 4 digits entered
  const handleCodeChange = (value) => {
    setCode(value);
    if (value.length === 4 && !loading) {
      // Auto-submit after 4 digits
      setTimeout(() => {
        handleVerifyOtp(null);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      {/* Header Logo */}
      <div className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoImage} alt="Right Logo" className="h-10 w-auto" style={{ objectFit: 'contain', background: 'transparent' }} />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">{i18n.language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </button>
        </div>
      </div>

      {/* Registration Form */}
      <div className="w-full max-w-xl mt-20">
        {step === "welcome" ? (
          // Welcome Message Screen
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center space-y-6 animate-fade-in">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center animate-scale-in">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Welcome Title */}
            <h2 className="text-2xl font-bold text-emerald-400">
              {i18n.language === 'ar' ? '✨ مرحباً بك في عائلة رايت!' : '✨ Welcome to Right Family!'}
            </h2>

            {/* Welcome Message */}
            <p className="text-lg text-slate-300 leading-relaxed">
              {i18n.language === 'ar' 
                ? 'تم توثيق حسابك بنجاح. نحن الآن نجهز لك بيئة مراقبة ذكية لأصولك لضمان سلامتها واستدامة قيمتها وفق أعلى المعايير.'
                : 'Your account has been successfully verified. We are now preparing a smart monitoring environment for your assets to ensure their safety and sustainability according to the highest standards.'
              }
            </p>

            {/* Loading Animation */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            <p className="text-sm text-slate-500">
              {i18n.language === 'ar' ? 'جاري تحويلك إلى لوحة التحكم...' : 'Redirecting to your dashboard...'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/10 p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                {step === "register" 
                  ? (i18n.language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account')
                  : (i18n.language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email')
                }
              </h1>
              <p className="text-slate-400 text-sm">
                {step === "register"
                  ? (i18n.language === 'ar' ? 'أدخل بياناتك للبدء في تتبع أصولك الحيوانية' : 'Enter your details to start tracking your livestock')
                  : (i18n.language === 'ar' ? 'أدخل الرمز المرسل إلى بريدك الإلكتروني' : 'Enter the code sent to your email')
                }
              </p>
            </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {/* Step 1: Registration Form */}
          {step === "register" && (
            <form onSubmit={handleRequestOtp} className="std-form space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'الاسم الثنائي' : 'Full Name'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={i18n.language === 'ar' ? 'محمد أحمد' : 'Mohammed Ahmed'}
                />
              </div>

              {/* National ID with Validation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'رقم الهوية الوطنية' : 'National ID'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    maxLength={10}
                    required
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      nationalIdTouched 
                        ? nationalIdValid 
                          ? 'border-emerald-500 focus:ring-emerald-500' 
                          : 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder={i18n.language === 'ar' ? '1234567890' : '1234567890'}
                  />
                  {nationalIdTouched && nationalIdValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {nationalIdTouched && !nationalIdValid && formData.nationalId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {nationalIdTouched && !nationalIdValid && formData.nationalId && (
                  <p className="mt-1 text-xs text-red-400">
                    {i18n.language === 'ar' ? 'يجب أن يكون رقم الهوية 10 أرقام بالضبط' : 'National ID must be exactly 10 digits'}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {i18n.language === 'ar' ? 'الرقم المكون من 10 أرقام الموجود على بطاقة الهوية الوطنية' : '10-digit number on your National ID card'}
                </p>
              </div>

              {/* Mobile Number with Validation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      mobileTouched 
                        ? mobileValid 
                          ? 'border-emerald-500 focus:ring-emerald-500' 
                          : 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder={i18n.language === 'ar' ? '0501234567' : '0501234567'}
                  />
                  {mobileTouched && mobileValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {mobileTouched && !mobileValid && formData.mobile && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {mobileTouched && !mobileValid && formData.mobile && (
                  <p className="mt-1 text-xs text-red-400">
                    {i18n.language === 'ar' ? 'يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام' : 'Number must start with 05 and be 10 digits'}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {i18n.language === 'ar' ? 'مثال: 0501234567 أو 966501234567' : 'Example: 0501234567 or 966501234567'}
                </p>
              </div>

              {/* Email with Inline Validation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      emailTouched 
                        ? emailValid 
                          ? 'border-emerald-500 focus:ring-emerald-500' 
                          : 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder={i18n.language === 'ar' ? 'email@example.com' : 'email@example.com'}
                  />
                  {emailTouched && emailValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {emailTouched && !emailValid && formData.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {emailTouched && !emailValid && formData.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {i18n.language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'}
                  </p>
                )}
              </div>

              {/* City/Region */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'المدينة/المنطقة' : 'City/Region'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">{i18n.language === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
                  <option value="الرياض">الرياض (Riyadh)</option>
                  <option value="جدة">جدة (Jeddah)</option>
                  <option value="مكة">مكة (Makkah)</option>
                  <option value="المدينة">المدينة (Madinah)</option>
                  <option value="الدمام">الدمام (Dammam)</option>
                  <option value="الخبر">الخبر (Khobar)</option>
                  <option value="الطائف">الطائف (Taif)</option>
                  <option value="تبوك">تبوك (Tabuk)</option>
                  <option value="القصيم">القصيم (Qassim)</option>
                  <option value="حائل">حائل (Hail)</option>
                  <option value="أبها">أبها (Abha)</option>
                  <option value="جازان">جازان (Jazan)</option>
                  <option value="نجران">نجران (Najran)</option>
                  <option value="الباحة">الباحة (Baha)</option>
                  <option value="الجوف">الجوف (Jouf)</option>
                </select>
              </div>

              {/* Asset Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'نوع الأصول' : 'Asset Type'}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">{i18n.language === 'ar' ? 'اختر نوع الأصول' : 'Select Asset Type'}</option>
                  <option value="camel">🐪 {i18n.language === 'ar' ? 'إبل' : 'Camels'}</option>
                  <option value="horse">🐴 {i18n.language === 'ar' ? 'خيل' : 'Horses'}</option>
                  <option value="falcon">🦅 {i18n.language === 'ar' ? 'صقور' : 'Falcons'}</option>
                  <option value="mixed">{i18n.language === 'ar' ? 'متعدد (إبل وخيل وصقور)' : 'Mixed (All Types)'}</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  {i18n.language === 'ar' 
                    ? 'سيتم تفعيل الباقة المناسبة حسب اختيارك'
                    : 'Appropriate plan will be activated based on your selection'
                  }
                </p>
              </div>

              {/* Privacy Agreement */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {i18n.language === 'ar' 
                    ? 'بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية. بيانات تحركات حلالك مشفرة ومحفوظة وفق أعلى معايير الخصوصية.'
                    : 'By continuing, you agree to our Terms of Service and Privacy Policy. Your livestock movement data is encrypted and stored according to the highest privacy standards.'
                  }
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (i18n.language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                  : (i18n.language === 'ar' ? '📧 إرسال رمز التحقق' : '📧 Send Verification Code')
                }
              </button>
            </form>
          )}

          {/* Step 2: Verification */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="std-form space-y-5">
              {/* Code Sent Message */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 mb-6">
                <p className="text-sm text-emerald-300 text-center">
                  {i18n.language === 'ar' 
                    ? `تم إرسال رمز التحقق إلى ${emailOrMobile}`
                    : `Verification code sent to ${emailOrMobile}`
                  }
                </p>
                <p className="text-xs text-slate-400 text-center mt-2">
                  {i18n.language === 'ar' 
                    ? 'للاختبار، استخدم الرمز: 1234'
                    : 'For testing, use code: 1234'
                  }
                </p>
              </div>

              {/* OTP Input with Auto-Submit */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'رمز التحقق (4 أرقام)' : 'Verification Code (4 digits)'}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  required
                  disabled={loading}
                  className="w-full tracking-[0.8em] text-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-4 text-3xl font-bold text-slate-50 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-60"
                  placeholder="••••"
                  autoFocus
                />
                {code.length === 4 && !loading && (
                  <p className="mt-2 text-xs text-emerald-400 text-center animate-pulse">
                    {i18n.language === 'ar' ? '✓ جاري التحقق...' : '✓ Verifying...'}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (i18n.language === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                  : (i18n.language === 'ar' ? '✓ تحقق ومتابعة' : '✓ Verify and Continue')
                }
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep("register");
                  setCode("");
                  setError("");
                }}
                className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                {i18n.language === 'ar' ? '← تعديل البيانات' : '← Edit Information'}
              </button>
            </form>
          )}

          {/* Already have account? */}
          {step === "register" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                {i18n.language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                {' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
