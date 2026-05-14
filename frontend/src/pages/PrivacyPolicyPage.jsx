import React from "react";
import { useTranslation } from "react-i18next";
import PublicPageShell from "../components/PublicPageShell";

export default function PrivacyPolicyPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

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
    <PublicPageShell
      title={isAr ? "سياسة الخصوصية" : "Privacy Policy"}
      subtitle={isAr ? "التزامنا بحماية بياناتك وخصوصيتك" : "Our commitment to protecting your data and privacy"}
      lastUpdated={isAr ? "آخر تحديث: 9 فبراير 2026" : "Last updated: February 9, 2026"}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e6dcc8", boxShadow: "0 4px 20px rgba(0,108,53,0.06)" }}
      >
        <div className="px-6 sm:px-8 py-4" style={{ background: "#006c35" }}>
          <p className="text-white text-sm">
            {isAr
              ? "منصة رايت ملتزمة بأعلى معايير أمان البيانات وحماية الخصوصية"
              : "Right platform is committed to the highest data security and privacy protection standards"}
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
          {isAr ? "لديك أسئلة؟" : "Have Questions?"}
        </h3>
        <p className="text-sm mb-3" style={{ color: "#4a5d4a" }}>
          {isAr ? "فريقنا متاح للإجابة على جميع استفساراتك المتعلقة بالخصوصية" : "Our team is available to answer all your privacy-related inquiries"}
        </p>
        <a href="mailto:privacy@right.app" className="font-bold" style={{ color: "#006c35" }}>
          📧 privacy@right.app
        </a>
      </div>
    </PublicPageShell>
  );
}
