
# خطة التطوير الشاملة لإطلاق rightiotsa.com

هذه خطة كبيرة تغطي 5 محاور. سأقسّمها على مراحل قابلة للمراجعة، وأنفّذها بالترتيب بعد موافقتك. الكود الحالي يستخدم بالفعل Supabase Auth + Lovable Cloud + جداول `assets/devices/sensor_readings/subscriptions/payments` — سأبني عليها بدل إعادة الاختراع.

---

## المرحلة 1 — مصادقة OTP بالجوال السعودي

**التغييرات:**
- إضافة Edge Function جديدة `phone-otp` (request/verify) أو توسعة `secure-otp` الحالية لقصر القناة على `phone` فقط مع تحقق صارم من نمط `+9665XXXXXXXX`.
- Rate limiting موجود (`check_and_increment_rate_limit`) — سأضيف مفتاح `otp_phone:{msisdn}` بحد 3 محاولات / 10 دقائق + قفل 10 دقائق بعد 3 إخفاقات (تسجيل في `security_events` ومنع جديد).
- صفحة `/login` جديدة (أو إعادة تصميم الحالية):
  - حقل واحد لرقم الجوال مع بادئة `+966` ثابتة وقناع إدخال 9 أرقام.
  - شاشة OTP بـ 6 خانات منفصلة: انتقال تلقائي، دعم Paste، Backspace ذكي، عدّاد 60 ثانية لإعادة الإرسال، رسالة قفل عند تجاوز الحد.
- بعد التحقق: استدعاء `supabase.auth.verifyOtp({ phone, token, type:'sms' })` ثم تخزين الجلسة عبر العميل الرسمي.

**ملاحظة هامة:** تفعيل Phone Auth في Supabase يتطلب موفّر SMS (Twilio/MessageBird/Vonage) — سأضيف الواجهة والمنطق، وسأطلب منك مفتاح الموفّر عند الوصول للاختبار الفعلي. حتى ذلك الحين يعمل في وضع التطوير.

---

## المرحلة 2 — دورة الدفع الكاملة

**التغييرات:**
- صفحة `/subscribe` جديدة بثلاث خطط (Starter / Pro / Enterprise) ببطاقات بهوية Cyber-Heritage، تعرض الأسعار، الميزات، حد الأجهزة (`max_devices`)، وأزرار "اشترك الآن".
- Edge Function `create-payment` (Moyasar — أبسط للسوق السعودي ولا يحتاج بطاقة تجارية معقّدة):
  - ينشئ صف `payments` بحالة `pending` ويعيد رابط بوابة Moyasar.
- Edge Function `verify-payment` (تستدعى من callback أو من واجهة `/subscribe/success`):
  - تتحقق من Moyasar API بمعرّف الدفعة.
  - عند النجاح: تحدّث `payments.status='paid'`، تحدّث/تنشئ `subscriptions` (plan, status='active', current_period_end = +30 يوم, max_devices/max_assets/max_stables بحسب الخطة).
- Hook `useSubscription()` في الواجهة يقرأ خطة المستخدم النشطة ويُمرَّر لـ `ProtectedRoute` لتعطيل الوصول عند انتهاء الاشتراك.

**يلزم منك:** مفتاحَي `MOYASAR_PUBLISHABLE_KEY` و `MOYASAR_SECRET_KEY` (سأطلبهما عبر إضافة الأسرار عند الوصول للمرحلة).

---

## المرحلة 3 — لوحة IoT حية

**التغييرات:**
- مكوّن `SensorHealthPanel` موجود جزئياً — سأكمله ليعرض لكل جهاز:
  - البطارية (`devices.battery_level`) مع لون تدريجي.
  - قوة الإشارة (`signal_strength`) كأشرطة.
  - حالة Online/Offline مبنية على `last_seen_at` (عتبة 5 دقائق).
- في `AssetPassport`: إضافة `LiveVitalsChart` يستخدم `recharts` ويشترك في `supabase.realtime` على جدول `sensor_readings` مفلتراً بـ `asset_id`، يحتفظ بآخر 50 قراءة لعرض نبض/حرارة. تحديث أقل من 5 ثوانٍ.
- مكوّن `GeofenceBreachToast`: يستمع للقناة الـ realtime على `notifications` بنوع `zone_breach` ويعرض toast فوري + صوت تنبيه (`alert.mp3` موجود).
- تفعيل realtime على `sensor_readings` و `notifications` عبر migration.

---

## المرحلة 4 — الصفحات العامة

**التغييرات:**
- `LandingPage` بسبعة أقسام: Hero / المشكلة / الحل (3 أنواع: إبل، خيل، صقور) / كيف يعمل (4 خطوات) / الباقات / تقييمات/شركاء / CTA + Footer. كلها بـ Cyber-Heritage و RTL.
- `/faq` بنظام أكورديون مقسّم لثلاث فئات:
  - الأجهزة (التركيب، البطارية، التغطية).
  - الاشتراكات (الباقات، الإلغاء، الفوترة).
  - التقنية (الخصوصية، الدقة، التكامل).
- `/contact` (تحديث الموجود): أزرار واتساب لكل غرض مع رسائل مسبقة التجهيز عبر `wa.me/966XXXXXXXXX?text=...`:
  - دعم فني.
  - مبيعات/استفسار باقات.
  - تفعيل جهاز.

**يلزم منك:** رقم واتساب الأعمال (سأستخدم placeholder قابل للاستبدال إن لم يُتاح الآن).

---

## المرحلة 5 — تثبيت الإنتاج

**التغييرات:**
- `ProtectedRoute` (موجود) — إضافة فحص اشتراك نشط: لو `subscriptions.status NOT IN ('active','trial')` أو منتهي → إعادة توجيه إلى `/subscribe` مع رسالة.
- `AdminRoute` جديدة (أو تعزيز `AdminGuard` الموجود) تتحقق من `has_role(uid,'admin')` عبر `user_roles` وترفض الباقي إلى `/dashboard`.
- استبدال كل `Spinner` في الصفحات الرئيسية (Dashboard, AssetsList, AssetPassport, HealthReports, Notifications) بـ `Skeleton` متناسق مع الهوية (موجود `PageSkeleton.jsx` كأساس).
- توسعة `RootErrorBoundary` ليلتقط أخطاء كل route عبر `<Route errorElement>` في `App.jsx`، مع شاشة سقوط أنيقة بدل الشاشة السوداء.
- تأكيد `_redirects` و `_headers` للنشر على Lovable.

---

## ترتيب التنفيذ المقترح

```text
المرحلة 1 (OTP) → المرحلة 5 (Guards + Skeletons) → المرحلة 3 (Live IoT)
                                                         ↓
المرحلة 4 (الصفحات العامة) ← المرحلة 2 (الدفع)
```

السبب: المصادقة + الحماية أساس لأي شيء آخر، ثم اللوحة الحية لأنها قلب المنتج، ثم الدفع (يحتاج مفاتيح Moyasar منك)، ثم الصفحات العامة (تربط CTA بـ `/subscribe`).

---

## الأسرار المطلوبة منك (سأطلبها في وقتها)

| الأسرار | المرحلة | الغرض |
|---|---|---|
| موفّر SMS (Twilio عبر إعدادات Supabase) | 1 | إرسال OTP فعلي |
| `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_SECRET_KEY` | 2 | بوابة الدفع |
| رقم واتساب الأعمال | 4 | روابط `wa.me` |

---

## نطاق هذه الموافقة

أطلب الموافقة على الخطة كاملة. سأبدأ تنفيذ **المرحلة 1 + المرحلة 5** في أول جولة (لأنهما متشابكتان: تسجيل الدخول وحراسة المسارات)، ثم سأتابع باقي المراحل في جولات منفصلة لتسهيل المراجعة.

هل تريد أن أبدأ؟ أم تفضّل تعديل ترتيب المراحل أو إسقاط/إضافة شيء؟
