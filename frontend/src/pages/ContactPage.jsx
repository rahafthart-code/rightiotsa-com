import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "../assets/logo-transparent.png";

export default function ContactPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submission (in production, send to backend)
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
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
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">
            {i18n.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-slate-400 text-lg">
            {i18n.language === 'ar' 
              ? 'نحن هنا لمساعدتك - تواصل معنا في أي وقت'
              : 'We are here to help - contact us anytime'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {i18n.language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}
            </h2>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">
                  {i18n.language === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent Successfully!'}
                </h3>
                <p className="text-emerald-300 text-sm">
                  {i18n.language === 'ar' 
                    ? 'سنقوم بالرد عليك خلال 24 ساعة'
                    : 'We will respond to you within 24 hours'
                  }
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {i18n.language === 'ar' ? 'الاسم' : 'Name'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={i18n.language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={i18n.language === 'ar' ? 'email@example.com' : 'email@example.com'}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {i18n.language === 'ar' ? 'الموضوع' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={i18n.language === 'ar' ? 'موضوع الرسالة' : 'Message subject'}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {i18n.language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    placeholder={i18n.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105"
                >
                  {i18n.language === 'ar' ? '📤 إرسال الرسالة' : '📤 Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Email Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">
                    {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </h3>
                  <p className="text-slate-400 text-sm mb-2">
                    {i18n.language === 'ar' 
                      ? 'راسلنا في أي وقت - نرد خلال 24 ساعة'
                      : 'Email us anytime - we respond within 24 hours'
                    }
                  </p>
                  <a href="mailto:support@right.app" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    support@right.app
                  </a>
                </div>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">
                    {i18n.language === 'ar' ? 'واتساب (24/7)' : 'WhatsApp (24/7)'}
                  </h3>
                  <p className="text-slate-400 text-sm mb-2">
                    {i18n.language === 'ar' 
                      ? 'دعم فوري على مدار الساعة'
                      : 'Instant support around the clock'
                    }
                  </p>
                  <button className="text-green-400 hover:text-green-300 transition-colors font-medium">
                    {i18n.language === 'ar' ? 'ابدأ المحادثة' : 'Start Chat'}
                  </button>
                </div>
              </div>
            </div>

            {/* Office Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">
                    {i18n.language === 'ar' ? 'المكتب الرئيسي' : 'Main Office'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {i18n.language === 'ar' 
                      ? 'الرياض، المملكة العربية السعودية'
                      : 'Riyadh, Saudi Arabia'
                    }
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {i18n.language === 'ar' 
                      ? 'ساعات العمل: 9 صباحاً - 6 مساءً (السبت-الخميس)'
                      : 'Business Hours: 9 AM - 6 PM (Sat-Thu)'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">
                {i18n.language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/faq')}
                  className="w-full text-left px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  📚 {i18n.language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}
                </button>
                <button 
                  onClick={() => navigate('/terms')}
                  className="w-full text-left px-4 py-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  📜 {i18n.language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </button>
                <button 
                  onClick={() => navigate('/privacy')}
                  className="w-full text-left px-4 py-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                >
                  🔒 {i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
