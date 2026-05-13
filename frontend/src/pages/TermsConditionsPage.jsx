import React from "react";
import { useTranslation } from "react-i18next";
import PublicPageShell from "../components/PublicPageShell";

export default function TermsConditionsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

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
    <PublicPageShell
      title={isAr ? "الشروط والأحكام" : "Terms & Conditions"}
      subtitle={isAr ? "الشروط القانونية لاستخدام منصة رايت" : "Legal terms for using Right platform"}
      lastUpdated={isAr ? "آخر تحديث: 9 فبراير 2026" : "Last updated: February 9, 2026"}
    >
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#fffbeb", border: "1px solid #f0d894" }}
      >
        <h3 className="font-bold mb-1" style={{ color: "#a88932" }}>
          {isAr ? "تنويه قانوني" : "Legal Notice"}
        </h3>
        <p className="text-sm" style={{ color: "#4a5d4a" }}>
          {isAr
            ? "يرجى قراءة هذه الشروط بعناية قبل استخدام الخدمة. استخدامك للمنصة يعني موافقتك الكاملة على جميع البنود."
            : "Please read these terms carefully before using the service. Your use of the platform means your full acceptance of all terms."}
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e6dcc8", boxShadow: "0 4px 20px rgba(0,108,53,0.06)" }}
      >
        <div className="px-6 sm:px-8 py-4" style={{ background: "#006c35" }}>
          <p className="text-white text-sm">
            {isAr ? "📜 الشروط والأحكام — منصة رايت للثروة الحيوانية" : "📜 Terms & Conditions — Right Livestock Platform"}
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="pb-5 last:pb-0" style={{ borderBottom: "1px solid #e6dcc8" }}>
              <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "#006c35" }}>
                {section.title}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#1a2e1a" }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-8 rounded-xl p-6 text-center"
        style={{ background: "#faf6ef", border: "1px dashed #c5a55a" }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: "#006c35" }}>
          {isAr ? "بحاجة للمساعدة؟" : "Need Help?"}
        </h3>
        <a href="mailto:support@right.app" className="font-bold" style={{ color: "#006c35" }}>
          📧 support@right.app
        </a>
      </div>
    </PublicPageShell>
  );
}
