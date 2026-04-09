import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsModal({ isOpen, onClose, onAccept, planName }) {
  const { i18n } = useTranslation();

  if (!isOpen) return null;

  const termsAr = [
    {
      title: "الالتزام باللوائح المحلية",
      content: "تلتزم منصة رايت بجميع لوائح وأنظمة الثروة الحيوانية المحلية في المملكة العربية السعودية، بما في ذلك قوانين تتبع الحيوانات والرعاية الصحية."
    },
    {
      title: "خصوصية البيانات والموافقة على التتبع",
      content: "بالاشتراك في الخدمة، فإنك توافق على جمع ومعالجة بيانات موقع GPS لحيواناتك، والبيانات الصحية، وبيانات الحركة. جميع البيانات مشفرة ومحمية وفقاً لأعلى معايير الأمان."
    },
    {
      title: "شروط الاشتراك والدفع",
      content: "الاشتراك سنوي وغير قابل للاسترداد بعد 14 يوماً من تاريخ الشراء. يتم تجديد الاشتراك تلقائياً ما لم يتم إلغاؤه قبل 30 يوماً من تاريخ التجديد."
    },
    {
      title: "استخدام الخدمة",
      content: "يحظر استخدام المنصة لأغراض غير قانونية أو مخالفة للآداب العامة. نحتفظ بالحق في إيقاف الحسابات المخالفة دون سابق إنذار."
    },
    {
      title: "المسؤولية",
      content: "منصة رايت توفر أدوات التتبع والمراقبة كخدمة معلوماتية. المسؤولية النهائية عن صحة وسلامة الحيوانات تقع على عاتق المالك."
    },
    {
      title: "الدعم الفني",
      content: "نوفر دعم فني على مدار الساعة عبر الواتساب والبريد الإلكتروني لجميع المشتركين."
    }
  ];

  const termsEn = [
    {
      title: "Compliance with Local Regulations",
      content: "Right platform complies with all local livestock regulations in Saudi Arabia, including animal tracking and healthcare laws."
    },
    {
      title: "Data Privacy and Tracking Consent",
      content: "By subscribing, you consent to the collection and processing of GPS location data, health metrics, and movement data for your animals. All data is encrypted and protected according to the highest security standards."
    },
    {
      title: "Subscription and Payment Terms",
      content: "Subscriptions are annual and non-refundable after 14 days from purchase date. Auto-renewal occurs unless cancelled 30 days before renewal date."
    },
    {
      title: "Service Usage",
      content: "Use of the platform for illegal purposes or activities violating public morals is prohibited. We reserve the right to suspend violating accounts without notice."
    },
    {
      title: "Liability",
      content: "Right platform provides tracking and monitoring tools as an information service. Ultimate responsibility for animal health and safety rests with the owner."
    },
    {
      title: "Technical Support",
      content: "We provide 24/7 technical support via WhatsApp and email for all subscribers."
    }
  ];

  const terms = i18n.language === 'ar' ? termsAr : termsEn;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 border-b border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {i18n.language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {planName}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {terms.map((term, idx) => (
              <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  {term.title}
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {term.content}
                </p>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-200 text-sm">
                {i18n.language === 'ar' 
                  ? 'بالنقر على "موافق وإكمال الدفع"، فإنك توافق على جميع الشروط والأحكام المذكورة أعلاه.'
                  : 'By clicking "Accept & Continue to Payment", you agree to all the terms and conditions listed above.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-all"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/25 transition-all"
          >
            {i18n.language === 'ar' ? 'موافق وإكمال الدفع' : 'Accept & Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
