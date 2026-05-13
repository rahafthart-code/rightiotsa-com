import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function OrderDeviceModal({ isOpen, onClose }) {
  const { i18n } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    animalType: '',
    quantity: '',
    location: '',
    dataRequired: {
      tracking: false,
      health: false,
      geofence: false
    },
    contactNumber: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        dataRequired: {
          ...formData.dataRequired,
          [name]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submission (in production, send to backend). Do not log PII.
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        animalType: '',
        quantity: '',
        location: '',
        dataRequired: { tracking: false, health: false, geofence: false },
        contactNumber: '',
        email: ''
      });
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 border-b border-emerald-500/30 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {i18n.language === 'ar' ? 'اطلب أجهزة التتبع الآن' : 'Order Tracking Devices Now'}
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {i18n.language === 'ar' 
                  ? 'املأ النموذج وسنتواصل معك لتحديد التفاصيل الفنية'
                  : 'Fill out the form and we will contact you for technical details'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-3">
                {i18n.language === 'ar' ? 'تم الإرسال بنجاح!' : 'Submitted Successfully!'}
              </h3>
              <p className="text-slate-300">
                {i18n.language === 'ar' 
                  ? 'سوف نقوم بالتواصل معك خلال 24 ساعة لتحديد بقية التفاصيل التقنية والفنية'
                  : 'We will contact you within 24 hours to determine the remaining technical details'
                }
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Animal Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'نوع الحيوان *' : 'Animal Type *'}
                </label>
                <select
                  name="animalType"
                  value={formData.animalType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">
                    {i18n.language === 'ar' ? 'اختر نوع الحيوان' : 'Select animal type'}
                  </option>
                  <option value="camel">{i18n.language === 'ar' ? 'إبل' : 'Camels'}</option>
                  <option value="horse">{i18n.language === 'ar' ? 'خيل' : 'Horses'}</option>
                  <option value="falcon">{i18n.language === 'ar' ? 'صقور' : 'Falcons'}</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'العدد *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder={i18n.language === 'ar' ? 'عدد الأجهزة المطلوبة' : 'Number of devices'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'الموقع/المنطقة *' : 'Location/Region *'}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder={i18n.language === 'ar' ? 'الرياض، جدة، المدينة...' : 'Riyadh, Jeddah, Medina...'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Data Required */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {i18n.language === 'ar' ? 'نوع البيانات المطلوب *' : 'Data Required *'}
                </label>
                <div className="space-y-3 bg-slate-950 border border-slate-700 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="tracking"
                      checked={formData.dataRequired.tracking}
                      onChange={handleChange}
                      className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <span className="text-slate-300 group-hover:text-slate-100 transition-colors">
                      {i18n.language === 'ar' ? 'تتبع موقع GPS' : 'GPS Location Tracking'}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="health"
                      checked={formData.dataRequired.health}
                      onChange={handleChange}
                      className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <span className="text-slate-300 group-hover:text-slate-100 transition-colors">
                      {i18n.language === 'ar' ? 'مؤشرات صحية (نبض، حرارة)' : 'Health Metrics (Heart Rate, Temperature)'}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="geofence"
                      checked={formData.dataRequired.geofence}
                      onChange={handleChange}
                      className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <span className="text-slate-300 group-hover:text-slate-100 transition-colors">
                      {i18n.language === 'ar' ? 'تنبيهات سياج جغرافي' : 'Geo-fence Alerts'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'رقم التواصل *' : 'Contact Number *'}
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  placeholder={i18n.language === 'ar' ? '05xxxxxxxx' : '05xxxxxxxx'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {i18n.language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder={i18n.language === 'ar' ? 'email@example.com' : 'email@example.com'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Privacy Trust Note */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-emerald-300 text-sm">
                    {i18n.language === 'ar' 
                      ? 'بيانات تحركات حلالك مشفرة ومحفوظة وفق أعلى معايير الخصوصية'
                      : 'Your livestock movement data is encrypted and stored according to the highest privacy standards'
                    }
                  </p>
                </div>
              </div>

              {/* Technical Specs Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-1">
                      {i18n.language === 'ar' ? 'المواصفات التقنية:' : 'Technical Specifications:'}
                    </p>
                    <ul className="text-blue-300 space-y-1 text-xs">
                      <li>• {i18n.language === 'ar' ? 'عمر بطارية استثنائي يصل إلى 5 سنوات دون الحاجة لشحن (سعة 19Ah)' : 'Exceptional battery life up to 5 years without charging (19Ah capacity)'}</li>
                      <li>• {i18n.language === 'ar' ? 'تصنيف IP67 مقاوم بالكامل للماء والغبار والظروف الصحراوية القاسية حتى 70 درجة مئوية' : 'IP67 rated - fully resistant to water, dust, and harsh desert conditions up to 70°C'}</li>
                      <li>• {i18n.language === 'ar' ? 'يعمل بتقنية Sigfox 0G في الصحراء العميقة والمناطق التي لا تصلها شبكة الجوال التقليدية' : 'Works with Sigfox 0G in deep desert and areas unreachable by traditional cellular networks'}</li>
                      <li>• {i18n.language === 'ar' ? 'الجهاز ملك لصاحبه' : 'Device is owned by the customer'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">
                  {i18n.language === 'ar' 
                    ? 'سوف نقوم بالتواصل معك لتحديد بقية التفاصيل التقنية والفنية'
                    : 'We will contact you to determine the remaining technical and functional details'
                  }
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-2xl shadow-emerald-500/25 transition-all transform hover:scale-105"
              >
                {i18n.language === 'ar' ? '📤 إرسال الطلب' : '📤 Submit Order'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
