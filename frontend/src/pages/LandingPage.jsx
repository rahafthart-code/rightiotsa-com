import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, MapPin, Activity, Bell, Package, FileText,
  CheckCircle2, Mail, PlayCircle, Crown,
} from "lucide-react";
import * as api from "../api";
import { supabase } from "../lib/supabaseClient";
import { enableDemoMode } from "../utils/mockData";
import logoImage from "../assets/logo-transparent.png";
import TermsModal from "../components/TermsModal";
import OrderDeviceModal from "../components/OrderDeviceModal";

// Cyber-Heritage line art glyphs — full-body silhouettes in royal green.
const CamelIcon = ({ size = 28, color = "#006c35" }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none"
       stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
       aria-label="Camel">
    {/* legs */}
    <path d="M28 78 V62 M40 78 V62 M58 78 V62 M70 78 V62" />
    {/* body underline */}
    <path d="M22 62 H76" />
    {/* body + two humps */}
    <path d="M22 62 C 22 50, 28 46, 34 46 C 38 36, 46 36, 50 46 C 54 36, 62 36, 66 46 C 72 46, 76 50, 76 56" />
    {/* neck rising */}
    <path d="M70 50 C 74 38, 78 28, 80 18" />
    {/* head */}
    <path d="M80 18 C 86 16, 90 20, 88 26 C 86 30, 82 30, 80 28 Z" />
    {/* tail */}
    <path d="M22 58 C 18 60, 16 64, 18 68" />
    {/* eye */}
    <circle cx="84" cy="22" r="0.9" fill={color} />
  </svg>
);

const HorseIcon = ({ size = 28, color = "#006c35" }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none"
       stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
       aria-label="Horse">
    {/* legs */}
    <path d="M22 78 V60 M34 78 V60 M58 78 V60 M70 78 V60" />
    {/* body */}
    <path d="M20 60 C 20 50, 26 44, 36 44 H 60 C 68 44, 74 50, 74 60" />
    {/* chest + neck arch */}
    <path d="M74 50 C 80 44, 82 32, 78 22" />
    {/* head */}
    <path d="M78 22 C 84 18, 90 22, 90 28 C 90 34, 84 36, 80 34 L 76 38" />
    {/* mane */}
    <path d="M72 36 L 70 30 M68 40 L 64 34 M64 42 L 60 36" />
    {/* tail */}
    <path d="M20 56 C 14 58, 12 66, 16 72" />
    {/* eye */}
    <circle cx="86" cy="26" r="0.9" fill={color} />
  </svg>
);

const FalconIcon = ({ size = 28, color = "#006c35" }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none"
       stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
       aria-label="Falcon">
    {/* head */}
    <path d="M52 24 C 60 22, 68 26, 68 34 C 68 38, 64 40, 62 40" />
    {/* hooked beak */}
    <path d="M68 32 L 76 32 L 72 36" />
    {/* eye */}
    <circle cx="62" cy="30" r="1.1" fill={color} />
    {/* body */}
    <path d="M50 40 C 42 44, 36 54, 38 64 C 40 72, 50 76, 58 72" />
    {/* tucked wing with feather lines */}
    <path d="M44 46 C 38 50, 30 60, 28 70" />
    <path d="M48 50 L 32 64 M50 56 L 36 70 M52 62 L 42 72" />
    {/* tail feathers */}
    <path d="M58 72 L 70 80 M58 72 L 64 82 M58 72 L 56 84" />
    {/* perched legs */}
    <path d="M48 70 V 80 M54 70 V 80" />
    {/* talons / perch */}
    <path d="M44 80 H 58 M50 80 H 60" />
  </svg>
);


export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Real Supabase session check (no more mock-token shortcut).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await api.getSubscriptionPlans();
        setPlans(Array.isArray(data) ? data : (data?.plans || data?.data || []));
      } catch (err) {
        console.error("Error fetching plans:", err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    if (selectedPlan) {
      navigate('/checkout', { state: { plan: selectedPlan } });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {showTerms && selectedPlan && (
        <TermsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={handleTermsAccept}
          planName={isAr ? selectedPlan.name_ar : selectedPlan.name_en}
        />
      )}
      <OrderDeviceModal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Right Logo" className="h-10 sm:h-12 w-auto" style={{ objectFit: 'contain' }} />
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white">{t('appName')}</div>
              <div className="text-[10px]" style={{ color: 'var(--color-desert-gold-light)' }}>
                {isAr ? 'إدارة وتتبع الأصول الذكية' : 'Smart Herd Management & Tracking'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <button onClick={() => navigate('/dashboard')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
                {isAr ? 'لوحة التحكم' : 'Dashboard'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { enableDemoMode(); navigate('/dashboard'); }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(197,165,90,0.5)' }}
                  title={isAr ? 'دخول تجريبي بدون OTP' : 'Demo login (no OTP)'}
                >
                  <PlayCircle size={14} />
                  {isAr ? 'دخول تجريبي' : 'Demo Login'}
                </button>
                <button onClick={() => navigate('/register')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg text-white transition-colors" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
                  {isAr ? 'إنشاء حساب' : 'Sign Up'}
                </button>
                <button onClick={() => navigate('/login')} className="px-3 py-2 text-xs sm:text-sm text-white/80 hover:text-white transition-colors">
                  {t('login')}
                </button>
              </>
            )}
            <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--color-desert-gold-light)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6" style={{ background: 'linear-gradient(170deg, var(--color-royal-green) 0%, var(--color-royal-green-dark) 50%, #002a15 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L55 30L30 55L5 30Z\' fill=\'none\' stroke=\'%23c5a55a\' stroke-width=\'0.5\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px' }} />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold" style={{ background: 'rgba(197,165,90,0.2)', color: 'var(--color-desert-gold-light)', border: '1px solid rgba(197,165,90,0.3)' }}>
            <Crown size={14} style={{ color: 'var(--color-desert-gold-light)' }} />
            {isAr ? 'منصة موثوقة لتتبع الأصول' : 'Trusted Asset Tracking Platform'}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            {isAr ? (
              <>إدارة احترافية للأصول الحيوانية<br /><span style={{ color: 'var(--color-desert-gold)' }}>عالية القيمة</span></>
            ) : (
              <>Professional Management for<br /><span style={{ color: 'var(--color-desert-gold)' }}>High-Value Livestock Assets</span></>
            )}
          </h1>
          <p className="text-base sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {isAr
              ? 'مراقبة استباقية وتنبيهات فورية لاتخاذ قرارات مبنية على بيانات دقيقة لضمان سلامة حلالك.'
              : 'Proactive monitoring and instant alerts for data-driven decisions to ensure the safety of your assets.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setShowOrderModal(true)} className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-base sm:text-lg rounded-xl shadow-xl transition-all transform hover:scale-105" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
              <FileText size={20} />
              {isAr ? 'اطلب عرضًا مخصصًا' : 'Request Custom Quote'}
            </button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 font-semibold rounded-xl transition-all" style={{ border: '2px solid rgba(197,165,90,0.5)', color: 'var(--color-desert-gold-light)' }}>
              {isAr ? 'عرض الباقات' : 'View Plans'}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'المزايا الرئيسية' : 'Key Features'}
          </h2>
          <p className="text-center mb-12 sm:mb-16" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'تقنيات متقدمة لإدارة الثروة الحيوانية' : 'Advanced technology for livestock management'}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { Icon: MapPin, titleAr: 'تتبع جغرافي لحظي', titleEn: 'Real-time GPS Tracking', descAr: 'راقب موقع حيواناتك في الوقت الفعلي مع خرائط تفاعلية عالية الدقة', descEn: "Monitor your animals' location in real-time with high-precision interactive maps", accent: 'var(--color-royal-green)' },
              { Icon: Activity, titleAr: 'مراقبة الحرارة والنشاط', titleEn: 'Temperature & Activity', descAr: 'احصل على تقارير صحية وتنبيهات فورية لأي تغيرات غير طبيعية', descEn: 'Get health reports and instant alerts for any abnormal changes', accent: 'var(--color-desert-gold-dark)' },
              { Icon: Bell, titleAr: 'تنبيهات السياج الجغرافي', titleEn: 'Geofence Alerts', descAr: 'تنبيهات فورية عند خروج الحيوان من المنطقة الآمنة', descEn: 'Instant alerts when an animal leaves the designated safe zone', accent: 'var(--color-royal-green)' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-6 sm:p-8 transition-all hover:shadow-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.accent}15`, color: f.accent }}>
                  <f.Icon size={26} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {isAr ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {isAr ? f.descAr : f.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Species Showcase */}
      <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'دعم متعدد الأنواع' : 'Multi-Species Support'}
          </h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto">
            {[
              { img: speciesCamel,  labelAr: 'الإبل',   labelEn: 'Camels'  },
              { img: speciesHorse,  labelAr: 'الخيل',   labelEn: 'Horses'  },
              { img: speciesFalcon, labelAr: 'الصقور',  labelEn: 'Falcons' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 sm:p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: 'var(--color-bg-card)', border: '2px solid #c5a55a' }}>
                <div className="mb-3 flex items-center justify-center h-32 sm:h-40">
                  <img
                    src={s.img}
                    alt={isAr ? s.labelAr : s.labelEn}
                    loading="lazy"
                    width={160}
                    height={160}
                    className="max-h-full w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 4px 10px rgba(0,108,53,0.18))' }}
                  />
                </div>
                <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-royal-green)' }}>
                  {isAr ? s.labelAr : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'الباقات السنوية' : 'Annual Plans'}
          </h2>
          <p className="text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'اختر الباقة المناسبة لنوع ثروتك الحيوانية' : 'Choose the right plan for your livestock type'}
          </p>
          <div className="flex justify-center mb-12">
            <button onClick={() => setShowOrderModal(true)} className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 text-white" style={{ background: 'var(--color-royal-green)' }}>
              <Package size={18} />
              {isAr ? 'اطلب أجهزة التتبع' : 'Order Tracking Devices'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#F5F5DC', border: '1px dashed #8B0000', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderBottom: '3px solid #8B0000', borderRight: '3px solid #006c35' }}></div>
              <p className="font-bold" style={{ color: '#8B0000' }}>{isAr ? 'جارٍ تحميل الباقات...' : 'Loading plans...'}</p>
            </div>
          )}

          {!loading && (!Array.isArray(plans) || plans.length === 0) && (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#F5F5DC', color: '#8B0000', border: '1px dashed #8B0000', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
              <p className="font-bold">{isAr ? 'لا توجد باقات متاحة حالياً' : 'No plans available at the moment'}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {(plans || [])?.map?.((plan) => (
              <div key={plan.plan_id} className="rounded-2xl overflow-hidden transition-transform hover:scale-[1.02]" style={{ background: 'var(--color-bg-card)', border: '2px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {isAr ? plan.name_ar : plan.name_en}
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--color-royal-green)' }}>
                    {plan.price_sar} <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{isAr ? 'ر.س/سنة' : 'SAR/year'}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {((isAr ? plan.features_ar : plan.features_en) || plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--color-royal-green)', flexShrink: 0, marginTop: 2 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleSubscribe(plan)} disabled={subscribing === plan.plan_id} className="w-full py-3 rounded-xl font-bold transition-all text-white disabled:opacity-50" style={{ background: 'var(--color-royal-green)' }}>
                    {subscribing === plan.plan_id ? (isAr ? 'جاري الاشتراك...' : 'Subscribing...') : (isAr ? 'اشترك الآن' : 'Subscribe Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6" style={{ background: 'var(--color-royal-green-dark)', color: 'rgba(255,255,255,0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 text-white">{isAr ? 'عن المنصة' : 'About'}</h3>
              <p className="text-sm leading-relaxed opacity-80">
                {isAr ? 'منصة رايت - الحل الأمثل لتتبع وإدارة الثروة الحيوانية' : 'Right Platform - The optimal solution for livestock tracking and management'}
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-white">{isAr ? 'روابط سريعة' : 'Quick Links'}</h3>
              <div className="space-y-2 text-sm">
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="block opacity-80 hover:opacity-100 transition-opacity">{isAr ? 'الباقات' : 'Plans'}</button>
                <button onClick={() => navigate('/faq')} className="block opacity-80 hover:opacity-100 transition-opacity">{isAr ? 'الأسئلة الشائعة' : 'FAQs'}</button>
                <button onClick={() => navigate('/contact')} className="block opacity-80 hover:opacity-100 transition-opacity">{isAr ? 'تواصل معنا' : 'Contact'}</button>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-white">{isAr ? 'قانوني' : 'Legal'}</h3>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/privacy')} className="block opacity-80 hover:opacity-100 transition-opacity">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</button>
                <button onClick={() => navigate('/terms')} className="block opacity-80 hover:opacity-100 transition-opacity">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</button>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-white">{isAr ? 'تواصل' : 'Contact'}</h3>
              <div className="space-y-2 text-sm">
                <a href="mailto:support@right.app" className="inline-flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"><Mail size={14} /> support@right.app</a>
                <p className="opacity-60 text-xs">{isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm opacity-60" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            {isAr ? '© 2026 رايت - جميع الحقوق محفوظة' : '© 2026 Right - All rights reserved'}
          </div>
        </div>
      </footer>
    </div>
  );
}
