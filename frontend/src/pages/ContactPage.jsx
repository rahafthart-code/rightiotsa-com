import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicPageShell from "../components/PublicPageShell";

export default function ContactPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  
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

  const inputStyle = {
    background: "#faf6ef",
    border: "1px solid #e6dcc8",
    color: "#1a2e1a",
  };

  return (
    <PublicPageShell
      title={isAr ? "تواصل معنا" : "Contact Us"}
      subtitle={isAr ? "نحن هنا لمساعدتك — تواصل معنا في أي وقت" : "We are here to help — contact us anytime"}
      maxWidth="max-w-6xl"
    >
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {/* Contact Form */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: "#ffffff", border: "1px solid #e6dcc8", boxShadow: "0 4px 20px rgba(0,108,53,0.06)" }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: "#006c35" }}>
            ✉ {isAr ? "أرسل رسالة" : "Send a Message"}
          </h2>

          {submitted ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "#f0fdf4", border: "1px solid #006c35" }}>
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#006c35" }}>
                {isAr ? "تم الإرسال بنجاح!" : "Sent Successfully!"}
              </h3>
              <p className="text-sm" style={{ color: "#4a5d4a" }}>
                {isAr ? "سنقوم بالرد عليك خلال 24 ساعة" : "We will respond within 24 hours"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#006c35" }}>
                  {isAr ? "الاسم" : "Name"}
                </label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{ ...inputStyle, '--tw-ring-color': '#006c35' }}
                  placeholder={isAr ? "أدخل اسمك" : "Enter your name"}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#006c35" }}>
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#006c35" }}>
                  {isAr ? "الموضوع" : "Subject"}
                </label>
                <input
                  type="text" name="subject" value={formData.subject} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder={isAr ? "موضوع الرسالة" : "Message subject"}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#006c35" }}>
                  {isAr ? "الرسالة" : "Message"}
                </label>
                <textarea
                  name="message" value={formData.message} onChange={handleChange} required rows="5"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={inputStyle}
                  placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 text-white text-base font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                style={{ background: "#006c35" }}
              >
                📤 {isAr ? "إرسال الرسالة" : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e6dcc8" }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#006c35" }}>
              📧 {isAr ? "البريد الإلكتروني" : "Email"}
            </h3>
            <p className="text-sm mb-2" style={{ color: "#4a5d4a" }}>
              {isAr ? "راسلنا في أي وقت — نرد خلال 24 ساعة" : "Email us anytime — we respond within 24 hours"}
            </p>
            <a href="mailto:support@right.app" className="font-bold" style={{ color: "#006c35" }}>
              support@right.app
            </a>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e6dcc8" }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#006c35" }}>
              💬 {isAr ? "واتساب (24/7)" : "WhatsApp (24/7)"}
            </h3>
            <p className="text-sm" style={{ color: "#4a5d4a" }}>
              {isAr ? "دعم فوري على مدار الساعة" : "Instant support around the clock"}
            </p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e6dcc8" }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#006c35" }}>
              📍 {isAr ? "المكتب الرئيسي" : "Main Office"}
            </h3>
            <p className="text-sm" style={{ color: "#4a5d4a" }}>
              {isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#7a8d7a" }}>
              {isAr ? "ساعات العمل: 9 صباحاً - 6 مساءً (السبت-الخميس)" : "Hours: 9 AM - 6 PM (Sat-Thu)"}
            </p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "#faf6ef", border: "1px dashed #c5a55a" }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: "#006c35" }}>
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/faq')} className="block w-full text-start px-3 py-2 rounded-lg transition-colors hover:bg-white" style={{ color: "#006c35" }}>
                📚 {isAr ? "الأسئلة الشائعة" : "FAQs"}
              </button>
              <button onClick={() => navigate('/terms')} className="block w-full text-start px-3 py-2 rounded-lg transition-colors hover:bg-white" style={{ color: "#006c35" }}>
                📜 {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </button>
              <button onClick={() => navigate('/privacy')} className="block w-full text-start px-3 py-2 rounded-lg transition-colors hover:bg-white" style={{ color: "#006c35" }}>
                🔒 {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
