import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "../assets/logo-transparent.png";

export default function TermsConditionsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const sections = i18n.language === 'ar' ? [
    {
      title: "1. الموافقة على الشروط",
      content: "باستخدامك منصة رايت، فإنك توافق على جميع الشروط والأحكام المذكورة في هذه الوثيقة. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الخدمة."
    },
    {
      title: "2. الالتزام باللوائح المحلية",
      content: "تلتزم منصة رايت بجميع لوائح وأنظمة الثروة الحيوانية المحلية في المملكة العربية السعودية، بما في ذلك قوانين تتبع الحيوانات، الرعاية الصحية، ومعايير الرفق بالحيوان الصادرة عن وزارة البيئة والمياه والزراعة."
    },
    {
      title: "3. شروط الاشتراك والدفع",
      content: "الاشتراك سنوي ويبدأ من تاريخ إتمام عملية الدفع. الأسعار: باقة الإبل 495 ر.س، باقة الخيل 695 ر.س، باقة الصقور 995 ر.س (شاملة ضريبة القيمة المضافة 15%). الاشتراكات غير قابلة للاسترداد بعد 14 يوماً من تاريخ الشراء."
    },
    {
      title: "4. التجديد التلقائي",
      content: "يتم تجديد الاشتراك تلقائياً في نهاية السنة ما لم يتم إلغاؤه قبل 30 يوماً من تاريخ التجديد. سيتم إرسال تذكير بالبريد الإلكتروني قبل 7 أيام من التجديد."
    },
    {
      title: "5. متطلبات الأجهزة والتثبيت",
      content: "يجب استخدام أجهزة تتبع معتمدة من منصة رايت. يتم تثبيت الأجهزة بواسطة فنيين مرخصين. أي تلاعب أو تعديل على الجهاز قد يؤدي إلى إلغاء الضمان وإيقاف الخدمة."
    },
    {
      title: "6. دقة البيانات والإشارات",
      content: "نسعى لتوفير بيانات دقيقة، لكن دقة الموقع قد تتأثر بظروف الطقس، التضاريس، وقوة إشارة GPS. المنصة لا تضمن دقة 100% في جميع الظروف."
    },
    {
      title: "7. المسؤولية",
      content: "منصة رايت توفر أدوات التتبع والمراقبة كخدمة معلوماتية. المسؤولية النهائية عن صحة وسلامة الحيوانات تقع على عاتق المالك. المنصة ليست مسؤولة عن أي خسائر مباشرة أو غير مباشرة ناتجة عن فقدان إشارة أو عطل فني."
    },
    {
      title: "8. استخدام الخدمة",
      content: "يحظر استخدام المنصة لأغراض غير قانونية، التتبع غير المصرح به، أو أي نشاط مخالف للآداب العامة أو القوانين المحلية. نحتفظ بالحق في إيقاف الحسابات المخالفة دون سابق إنذار أو استرداد."
    },
    {
      title: "9. الملكية الفكرية",
      content: "جميع حقوق الملكية الفكرية للمنصة، بما في ذلك التصميم، الشعار، والكود البرمجي، محفوظة لصالح منصة رايت. يحظر نسخ أو إعادة إنتاج أي جزء من المنصة دون إذن كتابي."
    },
    {
      title: "10. الدعم الفني",
      content: "نوفر دعم فني على مدار الساعة (24/7) عبر الواتساب والبريد الإلكتروني. وقت الاستجابة المتوقع: خلال 2 ساعة للاستفسارات العاجلة، و24 ساعة للاستفسارات العامة."
    },
    {
      title: "11. إيقاف الخدمة",
      content: "نحتفظ بالحق في إيقاف الخدمة مؤقتاً للصيانة الدورية. سيتم إخطارك مسبقاً بأي توقف مخطط له. في حالات الطوارئ، قد يتم الإيقاف دون إشعار مسبق."
    },
    {
      title: "12. التعديلات على الشروط",
      content: "نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إخطارك بأي تعديلات جوهرية عبر البريد الإلكتروني. استمرارك في استخدام الخدمة بعد التعديل يعني موافقتك على الشروط الجديدة."
    },
    {
      title: "13. القانون الساري والاختصاص القضائي",
      content: "تخضع هذه الشروط والأحكام لأنظمة المملكة العربية السعودية. أي نزاع ينشأ عن استخدام الخدمة يخضع لاختصاص المحاكم السعودية المختصة."
    }
  ] : [
    {
      title: "1. Acceptance of Terms",
      content: "By using the Right platform, you agree to all terms and conditions mentioned in this document. If you do not agree with any of these terms, please do not use the service."
    },
    {
      title: "2. Compliance with Local Regulations",
      content: "Right platform complies with all local livestock regulations in Saudi Arabia, including animal tracking laws, healthcare standards, and animal welfare standards issued by the Ministry of Environment, Water, and Agriculture."
    },
    {
      title: "3. Subscription and Payment Terms",
      content: "Subscriptions are annual and begin from the payment completion date. Prices: Camel plan 495 SAR, Horse plan 695 SAR, Falcon plan 995 SAR (including 15% VAT). Subscriptions are non-refundable after 14 days from purchase date."
    },
    {
      title: "4. Auto-Renewal",
      content: "Subscriptions automatically renew at the end of the year unless cancelled 30 days before renewal date. An email reminder will be sent 7 days before renewal."
    },
    {
      title: "5. Device Requirements and Installation",
      content: "Only tracking devices certified by Right platform must be used. Devices are installed by licensed technicians. Any tampering or modification may void warranty and suspend service."
    },
    {
      title: "6. Data Accuracy and Signals",
      content: "We strive to provide accurate data, but location accuracy may be affected by weather conditions, terrain, and GPS signal strength. The platform does not guarantee 100% accuracy in all conditions."
    },
    {
      title: "7. Liability",
      content: "Right platform provides tracking and monitoring tools as an information service. Ultimate responsibility for animal health and safety rests with the owner. The platform is not liable for any direct or indirect losses resulting from signal loss or technical failure."
    },
    {
      title: "8. Service Usage",
      content: "Use of the platform for illegal purposes, unauthorized tracking, or any activity violating public morals or local laws is prohibited. We reserve the right to suspend violating accounts without notice or refund."
    },
    {
      title: "9. Intellectual Property",
      content: "All intellectual property rights for the platform, including design, logo, and code, are reserved for Right platform. Copying or reproducing any part of the platform without written permission is prohibited."
    },
    {
      title: "10. Technical Support",
      content: "We provide 24/7 technical support via WhatsApp and email. Expected response time: within 2 hours for urgent inquiries, and 24 hours for general inquiries."
    },
    {
      title: "11. Service Interruption",
      content: "We reserve the right to temporarily suspend service for routine maintenance. You will be notified in advance of any planned outage. In emergencies, suspension may occur without prior notice."
    },
    {
      title: "12. Amendments to Terms",
      content: "We reserve the right to modify these terms and conditions at any time. You will be notified of any substantial modifications via email. Your continued use of the service after modification means you accept the new terms."
    },
    {
      title: "13. Governing Law and Jurisdiction",
      content: "These terms and conditions are subject to the laws of Saudi Arabia. Any dispute arising from service use is subject to the jurisdiction of competent Saudi courts."
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
            {i18n.language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </h1>
          <p className="text-slate-400 text-lg">
            {i18n.language === 'ar' 
              ? 'الشروط القانونية لاستخدام منصة رايت'
              : 'Legal terms for using Right platform'
            }
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {i18n.language === 'ar' ? 'آخر تحديث: 9 فبراير 2026' : 'Last updated: February 9, 2026'}
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-yellow-200 font-semibold mb-1">
                {i18n.language === 'ar' ? 'تنويه قانوني' : 'Legal Notice'}
              </h3>
              <p className="text-yellow-300 text-sm">
                {i18n.language === 'ar' 
                  ? 'يرجى قراءة هذه الشروط بعناية قبل استخدام الخدمة. استخدامك للمنصة يعني موافقتك الكاملة على جميع البنود.'
                  : 'Please read these terms carefully before using the service. Your use of the platform means your full acceptance of all terms.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4">
            <p className="text-white text-sm">
              {i18n.language === 'ar' 
                ? '📜 الشروط والأحكام - منصة رايت للثروة الحيوانية'
                : '📜 Terms & Conditions - Right Livestock Platform'
              }
            </p>
          </div>

          <div className="p-8 space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="border-b border-slate-700 last:border-0 pb-6 last:pb-0">
                <h2 className="text-xl font-bold text-blue-400 mb-3">
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
        <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-emerald-200 mb-2">
            {i18n.language === 'ar' ? 'بحاجة للمساعدة؟' : 'Need Help?'}
          </h3>
          <p className="text-emerald-300 text-sm mb-4">
            {i18n.language === 'ar' 
              ? 'فريق الدعم متاح على مدار الساعة للإجابة على أسئلتك'
              : 'Support team is available 24/7 to answer your questions'
            }
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="mailto:support@right.app" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
            >
              📧 support@right.app
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
