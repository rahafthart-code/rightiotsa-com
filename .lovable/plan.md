# خطة التنفيذ النهائية - Right IoT Operational System

تحويل المنصة إلى نظام تشغيل متكامل عبر 5 محاور.

## 1. الجواز الرقمي (Digital Passport PDF)
- إضافة زر **"تصدير الجواز الرقمي"** في صفحة `AssetDetailsPage` / `AssetPassport`.
- استخدام `jspdf` + `jspdf-autotable` + `qrcode` لتوليد PDF من جانب العميل (RTL، خط Cairo).
- محتوى PDF:
  - رأس بالشعار + اسم الأصل + رقم الجواز
  - صورة الأصل (من `image_url`)
  - بيانات المالك (من `profiles`)
  - بيانات الجواز (`asset_passports`: السلالة، تاريخ الميلاد، رقم الشريحة...)
  - آخر 5 قراءات حيوية (`sensor_readings`)
  - حالة التأمين والاشتراك
  - QR Code يشير إلى `https://rightiotsa.com/verify/{asset_id}`
- إنشاء صفحة عامة `/verify/:assetId` للتحقق (بيانات أساسية فقط، بدون مصادقة).

## 2. الوسائط والأداء (Media & Performance)
- استخدام **Supabase Storage** (الباكت `asset-images` موجود) بدلاً من Cloudinary لتجنب الإعتماد على خدمة خارجية.
- إنشاء Edge Function `optimize-image`:
  - يستقبل ملفاً → يصغره (max 1280px) ويولد thumbnail (320px) عبر `imagescript` أو `deno-image`
  - يرفع نسختين: `{id}/full.webp` و `{id}/thumb.webp`
  - يعيد الـ signed URLs
- تحديث `AssetForm` لاستخدام الـ Function الجديدة + استخدام `thumb` في القوائم/البطاقات و`full` في صفحة التفاصيل.
- إصلاح تسريبات Realtime: مراجعة كل `useEffect` يستخدم `supabase.channel()` للتأكد من `supabase.removeChannel(channel)` في الـ cleanup (خاصة `GeofenceBreachToast`، `LiveVitalsChart`، `Dashboard`).

## 3. مراقب استقرار الأجهزة (Sensor Watchdog)
- إنشاء Edge Function `device-watchdog` (مجدولة عبر `pg_cron` كل 5 دقائق):
  - تحديث `sensor_devices.status='offline'` لكل جهاز `last_seen_at < now() - interval '30 minutes'`
  - إنشاء `notifications` نوع `device_offline` للمالك (مع throttle 6 ساعات لتجنب الإزعاج)
- إضافة جدول `edge_function_errors` لتسجيل أخطاء 500.
- إنشاء Edge Function `log-error` يستقبل (function_name, error, context) ويسجل + ينشئ `security_event` بـ severity=critical إذا تجاوزت الأخطاء 5 في 15 دقيقة.
- تعديل الـ Edge Functions الحالية (`create-payment`, `verify-payment`, `secure-otp`) لاستدعاء `log-error` في الـ catch.

## 4. لمسات UX النهائية
- مراجعة شاملة لـ `dir="rtl"` في `index.html` + `App.jsx`.
- فحص جميع classes الموجودة لاستبدال `ml-*`/`mr-*`/`text-left`/`text-right` بـ `ms-*`/`me-*`/`text-start`/`text-end`.
- إضافة مكون `<SystemHealthPanel />` في `/admin`:
  - عدد الأجهزة `online` / `offline` / `total`
  - عدد المستخدمين النشطين (آخر 24 ساعة)
  - حالة بوابة الدفع (Edfapay - "قيد الربط")
  - عدد الأخطاء الحرجة في آخر ساعة (من `security_events`)
  - عدد الإشعارات المرسلة اليوم
  - يستخدم Realtime للتحديث الحي

## 5. تنظيف الأمان
- بحث شامل عن `console.log` في `frontend/src/` و`supabase/functions/` وإزالة أي شيء يكشف:
  - tokens, session data, API keys, OTP codes, phone numbers, payment details
- الإبقاء على `console.error` للأخطاء العامة فقط (بدون بيانات حساسة).
- التأكد من أن سياسات Storage على `asset-images` و`reports` تطبق `auth.uid()::text = (storage.foldername(name))[1]`.
- إضافة Migration لسياسات Storage إذا كانت ناقصة.

## ترتيب التنفيذ
1. Migrations (جدول `edge_function_errors` + سياسات Storage + pg_cron)
2. Edge Functions (`optimize-image`, `device-watchdog`, `log-error`)
3. مكونات Frontend (PDF Export، SystemHealthPanel، صفحة /verify)
4. تنظيف console.log و RTL audit

## الحزم المطلوبة (npm)
- `jspdf`, `jspdf-autotable`, `qrcode`

## ملاحظة
سأبدأ التنفيذ مباشرة بعد موافقتك. لن أحتاج أي مفاتيح خارجية - سنستخدم Supabase Storage بدلاً من Cloudinary.
