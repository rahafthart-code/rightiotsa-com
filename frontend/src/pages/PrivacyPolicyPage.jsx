import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "../assets/logo-transparent.png";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const sections = i18n.language === 'ar' ? [
    {
      title: "1. جمع البيانات وتخزينها",
      content: "نقوم بجمع بيانات الموقع الجغرافي (GPS)، المؤشرات الصحية (نبض القلب، درجة الحرارة)، وبيانات الحركة للحيوانات المسجلة في نظامنا. يتم تخزين جميع البيانات على خوادم سحابية آمنة في مراكز بيانات معتمدة بتشفير AES-256."
    },
    {
      title: "2. استخدام البيانات",
      content: "نستخدم البيانات المجمعة حصرياً لتوفير خدمات التتبع والمراقبة الصحية والتنبيهات الفورية. لا نشارك بياناتك مع أطراف ثالثة للأغراض التسويقية أو الإعلانية."
    },
    {
      title: "3. أمان البيانات",
      content: "جميع الاتصالات بين الأجهزة والمنصة مشفرة باستخدام SSL/TLS. يتم إجراء نسخ احتياطي يومي للبيانات. الوصول إلى البيانات محمي بمصادقة ثنائية وأذونات صارمة."
    },
    {
      title: "4. الموقع الجغرافي وتتبع الحركة",
      content: "بيانات الموقع يتم جمعها كل 10 ثوانٍ (في وضع المحاكاة) أو كل 5 دقائق (في الوضع العادي). يمكنك مشاهدة سجل الحركة الكامل والتصدير إلى CSV في أي وقت."
    },
    {
      title: "5. حقوق المستخدم",
      content: "لك الحق في الوصول إلى بياناتك، تعديلها، أو حذفها في أي وقت من خلال لوحة التحكم. يمكنك طلب تصدير كامل لبياناتك بصيغة CSV أو JSON."
    },
    {
      title: "6. الاحتفاظ بالبيانات",
      content: "نحتفظ ببيانات التتبع لمدة 12 شهراً من تاريخ الاشتراك النشط. بعد انتهاء الاشتراك، يتم الاحتفاظ بالبيانات لمدة 90 يوماً إضافية ثم يتم حذفها نهائياً."
    },
    {
      title: "7. ملفات تعريف الارتباط (Cookies)",
      content: "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة (مثل المصادقة وحفظ تفضيلات اللغة). لا نستخدم ملفات تعريف ارتباط تتبع إعلانية."
    },
    {
      title: "8. التحديثات على السياسة",
      content: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إخطارك عبر البريد الإلكتروني بأي تغييرات جوهرية. استمرارك في استخدام الخدمة بعد التحديث يعني موافقتك على السياسة الجديدة."
    },
    {
      title: "9. الاتصال بنا",
      content: "لأي استفسارات أو طلبات تتعلق بالخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@right.app أو عبر الواتساب على الزر الأخضر الظاهر في الموقع."
    }
  ] : [
    {
      title: "1. Data Collection and Storage",
      content: "We collect GPS location data, health metrics (heart rate, temperature), and movement data for animals registered in our system. All data is stored on secure cloud servers in certified data centers with AES-256 encryption."
    },
    {
      title: "2. Data Usage",
      content: "We use collected data exclusively to provide tracking, health monitoring, and instant alert services. We do not share your data with third parties for marketing or advertising purposes."
    },
    {
      title: "3. Data Security",
      content: "All communications between devices and the platform are encrypted using SSL/TLS. Daily data backups are performed. Access to data is protected with two-factor authentication and strict permissions."
    },
    {
      title: "4. Location and Movement Tracking",
      content: "Location data is collected every 10 seconds (in simulation mode) or every 5 minutes (in normal mode). You can view complete movement history and export to CSV at any time."
    },
    {
      title: "5. User Rights",
      content: "You have the right to access, modify, or delete your data at any time through the dashboard. You can request a complete export of your data in CSV or JSON format."
    },
    {
      title: "6. Data Retention",
      content: "We retain tracking data for 12 months from the active subscription date. After subscription ends, data is kept for an additional 90 days then permanently deleted."
    },
    {
      title: "7. Cookies",
      content: "We use essential cookies necessary for platform operation (such as authentication and language preference storage). We do not use advertising tracking cookies."
    },
    {
      title: "8. Policy Updates",
      content: "We may update our privacy policy from time to time. You will be notified via email of any substantial changes. Your continued use of the service after an update means you accept the new policy."
    },
    {
      title: "9. Contact Us",
      content: "For any privacy-related inquiries or requests, you can contact us via email: privacy@right.app or via WhatsApp using the green button displayed on the site."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">
            {i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-slate-400 text-lg">
            {i18n.language === 'ar' 
              ? 'التزامنا بحماية بياناتك وخصوصيتك'
              : 'Our commitment to protecting your data and privacy'
            }
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {i18n.language === 'ar' ? 'آخر تحديث: 9 فبراير 2026' : 'Last updated: February 9, 2026'}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4">
            <p className="text-white text-sm">
              {i18n.language === 'ar' 
                ? '🔒 منصة رايت ملتزمة بأعلى معايير أمان البيانات وحماية الخصوصية'
                : '🔒 Right platform is committed to the highest data security and privacy protection standards'
              }
            </p>
          </div>

          <div className="p-8 space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="border-b border-slate-700 last:border-0 pb-6 last:pb-0">
                <h2 className="text-xl font-bold text-emerald-400 mb-3">
                  {section.title}
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">
            {i18n.language === 'ar' ? 'لديك أسئلة؟' : 'Have Questions?'}
          </h3>
          <p className="text-blue-300 text-sm mb-4">
            {i18n.language === 'ar' 
              ? 'فريقنا متاح للإجابة على جميع استفساراتك المتعلقة بالخصوصية'
              : 'Our team is available to answer all your privacy-related inquiries'
            }
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="mailto:privacy@right.app" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
            >
              📧 privacy@right.app
            </a>
            <span className="text-slate-600">|</span>
            <button className="text-green-400 hover:text-green-300 transition-colors text-sm">
              💬 {i18n.language === 'ar' ? 'واتساب (24/7)' : 'WhatsApp (24/7)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
