import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import PublicPageShell from "../components/PublicPageShell";

export default function FAQPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = i18n.language === 'ar' ? [
    {
      category: "رحلة العميل",
      questions: [
        {
          question: "كيف أتابع حيواناتي بعد الدفع؟",
          answer: "بمجرد إتمام الدفع، سيتم تفعيل حسابك فوراً وتوجيهك للوحة التحكم لمتابعة مواقع حيواناتك عبر الخريطة الحية. ستجد جميع أصولك منظمة حسب النوع (إبل، خيل، صقور) مع إمكانية مراقبة كل حيوان على حدة."
        },
        {
          question: "هل البيانات آمنة؟",
          answer: "نعم، يتم تشفير كافة بيانات المواقع والمؤشرات الحيوية ولا يمكن لأحد رؤيتها سوى صاحب الحساب. نستخدم بروتوكولات تشفير عالمية متقدمة ونلتزم بأعلى معايير الخصوصية والأمان. بياناتك محفوظة في خوادم آمنة ومشفرة بالكامل."
        },
        {
          question: "كيف يتم ربط الجهاز بالمنصة؟",
          answer: "يتم ذلك تلقائياً عبر الرقم التسلسلي (IMEI) المرفق مع الجهاز عند الشراء. كل جهاز يأتي مسجلاً مسبقاً في النظام ومربوط بحسابك. ما عليك سوى تثبيت الجهاز على حيوانك وسيبدأ في إرسال البيانات تلقائياً إلى لوحة التحكم خلال دقائق."
        }
      ]
    },
    {
      category: "الأجهزة والبطارية",
      questions: [
        {
          question: "كم تدوم بطارية جهاز التتبع؟",
          answer: "عمر بطارية استثنائي يصل إلى 5 سنوات دون الحاجة لشحن (بسعة 19Ah). بفضل تقنية Sigfox 0G الموفرة للطاقة، لا حاجة للشحن أو تبديل البطارية خلال هذه الفترة. الأجهزة تستخدم تقنية استهلاك منخفض للغاية للطاقة مع إرسال بيانات دورية."
        },
        {
          question: "هل الجهاز مقاوم للظروف الجوية القاسية؟",
          answer: "نعم، الأجهزة حاصلة على تصنيف IP67 مقاومة بالكامل للماء والغبار والظروف الصحراوية القاسية حتى 70 درجة مئوية. مصممة خصيصاً لتحمل درجات الحرارة القاسية من -20°C وحتى 70°C، مما يجعلها مثالية للظروف الصحراوية والجبلية في المملكة."
        },
        {
          question: "هل الجهاز ملك لي أم إيجار؟",
          answer: "الجهاز ملك لصاحبه بالكامل عند الشراء. لا توجد رسوم إيجار شهرية للجهاز نفسه. الاشتراك السنوي (495، 695، أو 995 ر.س) يغطي فقط خدمات المنصة، التخزين السحابي، والدعم الفني."
        }
      ]
    },
    {
      category: "التتبع والدقة",
      questions: [
        {
          question: "ما هو نطاق التتبع (مدى الإشارة)؟",
          answer: "يعمل بتقنية Sigfox 0G في الصحراء العميقة والمناطق التي لا تصلها شبكة الجوال التقليدية. هذه التقنية العالمية عالية الأمان توفر تغطية واسعة حتى في المناطق النائية مع استهلاك طاقة أقل بكثير من شبكات 4G التقليدية. التغطية في المملكة تصل إلى 95% من المناطق المأهولة والمراعي."
        },
        {
          question: "ما مدى دقة تحديد الموقع؟",
          answer: "دقة GPS عادةً بين 3-10 أمتار في الأماكن المفتوحة. في المناطق الصحراوية، الدقة ممتازة (3-5 أمتار). في المناطق الجبلية أو الوديان، قد تنخفض الدقة إلى 10-15 متراً. نظام GLONASS المساعد يحسّن الدقة في الظروف الصعبة."
        },
        {
          question: "كم مرة يتم تحديث الموقع؟",
          answer: "في الوضع العادي: كل 5 دقائق. في وضع المحاكاة (للعروض التوضيحية): كل 10 ثوان. في وضع توفير الطاقة: كل 15 دقيقة. يمكنك تغيير وضع التتبع من لوحة التحكم حسب احتياجك."
        },
        {
          question: "هل يعمل التتبع داخل المباني؟",
          answer: "التتبع داخل المباني محدود لأن إشارة GPS تحتاج إلى رؤية واضحة للسماء. ومع ذلك، يمكن تحديد آخر موقع معروف قبل دخول المبنى. في حالة الحظائر المغلقة، يوصى بتفعيل وضع توفير الطاقة."
        }
      ]
    },
    {
      category: "المزايا والخدمات",
      questions: [
        {
          question: "ما الفرق بين الباقات الثلاث؟",
          answer: "باقة الإبل (495 ر.س): مناسبة للمراعي المفتوحة، تنبيهات السياج الجغرافي، تقارير دورية. باقة الخيل (695 ر.س): تشمل مراقبة نبض القلب، إحصائيات الأداء الرياضي. باقة الصقور (995 ر.س): تتبع ارتفاعات عالية، خرائط تضاريس 3D، دعم أولوية."
        },
        {
          question: "ما هو السياج الجغرافي وكيف يعمل؟",
          answer: "السياج الجغرافي منطقة افتراضية تحددها على الخريطة (دائرة بنصف قطر يصل إلى 10 كم). عند خروج الحيوان من هذه المنطقة، تتلقى تنبيهاً فورياً على الهاتف وعبر البريد الإلكتروني. يمكنك إنشاء حتى 5 أسوار جغرافية لكل حيوان."
        },
        {
          question: "هل يمكن تصدير البيانات والتقارير؟",
          answer: "نعم، يمكنك تصدير سجل الحركة، المؤشرات الصحية، وتقارير الأداء بصيغة CSV أو PDF. التصدير متاح من صفحة التفاصيل لكل حيوان عبر زر '📥 Export Report'."
        },
        {
          question: "كيف أفعّل وضع المحاكاة (Simulation Mode)؟",
          answer: "وضع المحاكاة متاح للمدراء فقط من خلال لوحة 'Admin Portal'. يُستخدم لعروض توضيحية واختبار المنصة. عند تفعيله، تتحرك الحيوانات تلقائياً على الخريطة كل 10 ثوان."
        }
      ]
    },
    {
      category: "الدعم والمساعدة",
      questions: [
        {
          question: "كيف يمكنني التواصل مع الدعم الفني؟",
          answer: "الدعم الفني متاح 24/7 عبر: (1) الواتساب: انقر على الزر الأخضر في أي صفحة، (2) البريد الإلكتروني: support@right.app، (3) لوحة التحكم: زر 'المساعدة'. متوسط وقت الاستجابة: ساعتين."
        },
        {
          question: "ماذا أفعل إذا فقد الجهاز الإشارة؟",
          answer: "إذا فقد الجهاز إشارة GPS أو الشبكة، سيتم عرض آخر موقع معروف على الخريطة مع وقت آخر تحديث. يوصى بالتحقق من البطارية والذهاب إلى مكان مفتوح. إذا استمرت المشكلة لأكثر من 24 ساعة، تواصل مع الدعم الفني."
        },
        {
          question: "هل يمكن استرداد الاشتراك؟",
          answer: "يمكن استرداد قيمة الاشتراك خلال 14 يوماً من تاريخ الشراء إذا لم يتم استخدام الخدمة. بعد 14 يوماً، الاشتراك غير قابل للاسترداد ولكن يمكنك إلغاء التجديد التلقائي في أي وقت."
        }
      ]
    }
  ] : [
    {
      category: "Customer Journey",
      questions: [
        {
          question: "How do I track my animals after payment?",
          answer: "Once payment is completed, your account will be activated immediately and you'll be directed to the dashboard to monitor your animals' locations via the live map. You'll find all your assets organized by type (Camels, Horses, Falcons) with the ability to monitor each animal individually."
        },
        {
          question: "Is my data secure?",
          answer: "Yes, all location data and vital signs are encrypted and can only be viewed by the account owner. We use advanced global encryption protocols and adhere to the highest privacy and security standards. Your data is stored on secure, fully encrypted servers."
        },
        {
          question: "How is the device linked to the platform?",
          answer: "This is done automatically via the serial number (IMEI) provided with the device at purchase. Each device comes pre-registered in the system and linked to your account. Simply attach the device to your animal and it will automatically start sending data to the dashboard within minutes."
        }
      ]
    },
    {
      category: "Devices and Battery",
      questions: [
        {
          question: "How long does the tracking device battery last?",
          answer: "Exceptional battery life up to 5 years without charging (19Ah capacity). Thanks to energy-efficient Sigfox 0G technology, no charging or battery replacement needed during this period. Devices use ultra-low power consumption with periodic data transmission."
        },
        {
          question: "Is the device resistant to harsh weather conditions?",
          answer: "Yes, IP67 rated - fully resistant to water, dust, and harsh desert conditions up to 70°C. Specifically designed to withstand extreme temperatures from -20°C to 70°C, making them ideal for desert and mountain conditions in Saudi Arabia."
        },
        {
          question: "Do I own the device or is it rental?",
          answer: "The device is owned by the customer upon purchase. There are no monthly rental fees for the device itself. The annual subscription (495, 695, or 995 SAR) only covers platform services, cloud storage, and technical support."
        }
      ]
    },
    {
      category: "Tracking and Accuracy",
      questions: [
        {
          question: "What is the tracking range (signal range)?",
          answer: "Works with Sigfox 0G technology in deep desert and areas unreachable by traditional cellular networks. This global high-security technology provides wide coverage even in remote areas with much lower power consumption than traditional 4G networks. Coverage in Saudi Arabia reaches 95% of populated areas and pastures."
        },
        {
          question: "How accurate is location detection?",
          answer: "GPS accuracy is typically between 3-10 meters in open areas. In desert areas, accuracy is excellent (3-5 meters). In mountainous or valley areas, accuracy may decrease to 10-15 meters. The auxiliary GLONASS system improves accuracy in difficult conditions."
        },
        {
          question: "How often is location updated?",
          answer: "In normal mode: every 5 minutes. In simulation mode (for demos): every 10 seconds. In power-saving mode: every 15 minutes. You can change tracking mode from the dashboard according to your needs."
        },
        {
          question: "Does tracking work indoors?",
          answer: "Indoor tracking is limited because GPS signal needs clear sky visibility. However, the last known location before entering the building can be determined. For closed barns, activating power-saving mode is recommended."
        }
      ]
    },
    {
      category: "Features and Services",
      questions: [
        {
          question: "What's the difference between the three plans?",
          answer: "Camel plan (495 SAR): Suitable for open pastures, geo-fence alerts, periodic reports. Horse plan (695 SAR): Includes heart rate monitoring, athletic performance statistics. Falcon plan (995 SAR): High-altitude tracking, 3D terrain maps, priority support."
        },
        {
          question: "What is geo-fencing and how does it work?",
          answer: "Geo-fencing is a virtual area you define on the map (circle with radius up to 10 km). When the animal exits this area, you receive an instant alert on your phone and via email. You can create up to 5 geo-fences per animal."
        },
        {
          question: "Can data and reports be exported?",
          answer: "Yes, you can export movement history, health metrics, and performance reports in CSV or PDF format. Export is available from each animal's details page via the '📥 Export Report' button."
        },
        {
          question: "How do I activate Simulation Mode?",
          answer: "Simulation Mode is available for admins only through the 'Admin Portal' dashboard. Used for demonstrations and platform testing. When activated, animals automatically move on the map every 10 seconds."
        }
      ]
    },
    {
      category: "Support and Help",
      questions: [
        {
          question: "How can I contact technical support?",
          answer: "Technical support is available 24/7 via: (1) WhatsApp: Click the green button on any page, (2) Email: support@right.app, (3) Dashboard: 'Help' button. Average response time: 2 hours."
        },
        {
          question: "What should I do if the device loses signal?",
          answer: "If the device loses GPS or network signal, the last known location will be displayed on the map with the time of last update. Check battery and move to an open area. If the problem persists for more than 24 hours, contact technical support."
        },
        {
          question: "Can subscriptions be refunded?",
          answer: "Subscriptions can be refunded within 14 days of purchase date if the service has not been used. After 14 days, subscriptions are non-refundable but you can cancel auto-renewal at any time."
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PublicPageShell
      title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
      subtitle={isAr ? "إجابات سريعة على الأسئلة الأكثر شيوعاً" : "Quick answers to the most common questions"}
    >
      <div className="space-y-6">
        {faqs.map((category, catIndex) => (
          <div
            key={catIndex}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e6dcc8", boxShadow: "0 4px 20px rgba(0,108,53,0.06)" }}
          >
            <div className="px-6 py-3" style={{ background: "#006c35" }}>
              <h2 className="text-white font-bold text-lg">{category.category}</h2>
            </div>

            <div className="p-4 sm:p-6 space-y-3">
              {category.questions.map((faq, qIndex) => {
                const index = `${catIndex}-${qIndex}`;
                const isOpen = openIndex === index;
                return (
                  <div key={qIndex} className="rounded-lg overflow-hidden" style={{ border: "1px solid #e6dcc8" }}>
                    <button
                      onClick={() => toggleQuestion(catIndex, qIndex)}
                      className="w-full px-5 py-3 flex items-center justify-between transition-colors"
                      style={{ background: "#faf6ef" }}
                    >
                      <span className="font-bold text-start" style={{ color: "#006c35" }}>
                        {faq.question}
                      </span>
                      <span
                        className="flex-shrink-0 transition-transform text-lg font-bold"
                        style={{ color: "#c5a55a", transform: isOpen ? "rotate(180deg)" : "none" }}
                      >
                        ▾
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 py-4" style={{ background: "#ffffff", borderTop: "1px solid #e6dcc8" }}>
                        <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#1a2e1a" }}>
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-10 rounded-xl p-6 text-center"
        style={{ background: "#faf6ef", border: "1px dashed #c5a55a" }}
      >
        <h3 className="text-xl font-bold mb-2" style={{ color: "#006c35" }}>
          {isAr ? "لم تجد إجابة لسؤالك؟" : "Didn't find an answer?"}
        </h3>
        <p className="text-sm mb-4" style={{ color: "#4a5d4a" }}>
          {isAr ? "فريق الدعم متاح على مدار الساعة لمساعدتك" : "Our support team is available 24/7 to help you"}
        </p>
        <a
          href="mailto:support@right.app"
          className="inline-block px-5 py-2.5 rounded-lg font-bold text-white transition-colors"
          style={{ background: "#006c35" }}
        >
          📧 {isAr ? "راسلنا" : "Email Us"}
        </a>
      </div>
    </PublicPageShell>
  );
}
