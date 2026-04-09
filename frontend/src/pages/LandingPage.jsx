import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as api from "../api";
import logoImage from "../assets/logo-transparent.png";
import TermsModal from "../components/TermsModal";
import OrderDeviceModal from "../components/OrderDeviceModal";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('access_token');

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
        console.log("Fetched subscription plans:", data);
        setPlans(data);
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan) => {
    // Step 1: Show Terms & Conditions modal
    setSelectedPlan(plan);
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    // Step 2: Close terms modal and navigate to checkout
    setShowTerms(false);
    if (selectedPlan) {
      navigate('/checkout', { state: { plan: selectedPlan } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Terms Modal */}
      {showTerms && selectedPlan && (
        <TermsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={handleTermsAccept}
          planName={i18n.language === 'ar' ? selectedPlan.name_ar : selectedPlan.name_en}
        />
      )}

      {/* Order Device Modal */}
      <OrderDeviceModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
      />

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Right Logo" className="h-12 w-auto" style={{ objectFit: 'contain', background: 'transparent' }} />
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {i18n.language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  {i18n.language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  {t('login')}
                </button>
              </>
            )}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-emerald-300 transition-colors"
            >
              {i18n.language === 'ar' ? 'EN' : 'ع'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-100 mb-6 leading-tight">
            {i18n.language === 'ar' ? (
              <>
                إدارة احترافية للأصول الحيوانية
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">عالية القيمة</span>
              </>
            ) : (
              <>
                Professional Management for
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">High-Value Livestock Assets</span>
              </>
            )}
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            {i18n.language === 'ar' 
              ? 'لأن أصولك الحيوانية استثمار وليست مجرد ملكية. مراقبة استباقية وتنبيهات فورية لاتخاذ قرارات مبنية على بيانات دقيقة لضمان سلامة حلالك.'
              : 'Because your livestock assets are investments, not just property. Proactive monitoring and instant alerts for data-driven decisions to ensure the safety of your assets.'
            }
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105"
            >
              {i18n.language === 'ar' ? '📋 اطلب عرضًا مخصصًا' : '📋 Request Custom Quote'}
            </button>
            <button
              onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-slate-600 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 font-semibold rounded-xl transition-all"
            >
              {i18n.language === 'ar' ? 'الباقات' : 'Plans'}
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-slate-600 hover:border-blue-500 text-slate-200 hover:text-blue-300 font-semibold rounded-xl transition-all"
            >
              {i18n.language === 'ar' ? 'المزايا' : 'Features'}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-100 mb-16">
            {i18n.language === 'ar' ? 'المزايا الرئيسية' : 'Key Features'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: GPS */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:border-emerald-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">
                {i18n.language === 'ar' ? 'تتبع جغرافي لحظي' : 'Real-time GPS Tracking'}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'راقب موقع حيواناتك في الوقت الفعلي مع خرائط تفاعلية عالية الدقة'
                  : 'Monitor your animals\' location in real-time with high-precision interactive maps'
                }
              </p>
            </div>

            {/* Feature 2: Health */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:border-blue-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">
                {i18n.language === 'ar' ? 'مراقبة صحية' : 'Health Monitoring'}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'احصل على تقارير صحية دورية وتنبيهات فورية لأي تغيرات غير طبيعية'
                  : 'Get periodic health reports and instant alerts for any abnormal changes'
                }
              </p>
            </div>

            {/* Feature 3: Multi-species */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:border-purple-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                <div className="text-2xl">🐪🐴🦅</div>
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">
                {i18n.language === 'ar' ? 'دعم متعدد الأنواع' : 'Multi-species Support'}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'إدارة موحدة للإبل والخيل والصقور من منصة واحدة'
                  : 'Unified management for camels, horses, and falcons from one platform'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-100 mb-4">
            {i18n.language === 'ar' ? 'الباقات السنوية' : 'Annual Subscription Plans'}
          </h2>
          <p className="text-center text-slate-400 mb-6 text-lg">
            {i18n.language === 'ar' ? 'اختر الباقة المناسبة لنوع ثروتك الحيوانية' : 'Choose the right plan for your livestock type'}
          </p>
          
          {/* Order Devices CTA */}
          <div className="flex justify-center mb-16">
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 transition-all transform hover:scale-105 flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {i18n.language === 'ar' ? 'اطلب أجهزة التتبع الآن' : 'Order Tracking Devices Now'}
            </button>
          </div>
          
          {loading && (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
              <p>{i18n.language === 'ar' ? 'جاري تحميل الباقات...' : 'Loading plans...'}</p>
            </div>
          )}
          
          {!loading && plans.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              <p>{i18n.language === 'ar' ? 'لا توجد باقات متاحة حالياً' : 'No plans available at the moment'}</p>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.plan_id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden hover:scale-105 transition-transform"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    {i18n.language === 'ar' ? plan.name_ar : plan.name_en}
                  </h3>
                  <div className={`text-4xl font-bold mb-6 ${
                    plan.plan_id === 'HORSE_ANNUAL' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {plan.price_sar} <span className="text-lg text-slate-400">{i18n.language === 'ar' ? 'ر.س/سنة' : 'SAR/year'}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {(i18n.language === 'ar' ? plan.features_ar : plan.features_en).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          plan.plan_id === 'HORSE_ANNUAL' ? 'text-blue-400' : 'text-emerald-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.plan_id}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      plan.plan_id === 'HORSE_ANNUAL'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {subscribing === plan.plan_id ? (
                      <span>{i18n.language === 'ar' ? 'جاري الاشتراك...' : 'Subscribing...'}</span>
                    ) : (
                      <span>{i18n.language === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-slate-100 font-bold mb-4">
                {i18n.language === 'ar' ? 'عن المنصة' : 'About Platform'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'منصة رايت - الحل الأمثل لتتبع وإدارة الثروة الحيوانية باستخدام تقنيات GPS المتقدمة'
                  : 'Right Platform - The optimal solution for livestock tracking and management using advanced GPS technology'
                }
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-slate-100 font-bold mb-4">
                {i18n.language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'الباقات السنوية' : 'Annual Plans'}
                </button>
                <button 
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'المزايا' : 'Features'}
                </button>
                <button 
                  onClick={() => navigate('/faq')}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}
                </button>
                <button 
                  onClick={() => navigate('/contact')}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                </button>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-slate-100 font-bold mb-4">
                {i18n.language === 'ar' ? 'قانوني' : 'Legal'}
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/privacy')}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </button>
                <button 
                  onClick={() => navigate('/terms')}
                  className="block text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  {i18n.language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </button>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-slate-100 font-bold mb-4">
                {i18n.language === 'ar' ? 'تواصل' : 'Contact'}
              </h3>
              <div className="space-y-3">
                <a 
                  href="mailto:support@right.app" 
                  className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@right.app
                </a>
                <button className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {i18n.language === 'ar' ? 'واتساب (24/7)' : 'WhatsApp (24/7)'}
                </button>
                <p className="text-slate-500 text-xs">
                  {i18n.language === 'ar' 
                    ? 'الرياض، المملكة العربية السعودية'
                    : 'Riyadh, Saudi Arabia'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 mb-2">
              {i18n.language === 'ar' 
                ? '© 2026 رايت - جميع الحقوق محفوظة'
                : '© 2026 Right - All rights reserved'
              }
            </p>
            <p className="text-slate-500 text-sm">
              {i18n.language === 'ar' 
                ? 'منصة رايت لتتبع الثروة الحيوانية والوقاية'
                : 'Right Platform - Livestock Monitoring & Protection'
              }
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
