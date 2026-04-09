import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Branding
      "appName": "Right",
      "tagline": "Livestock Telemetry & Health",
      
      // Navigation
      "dashboard": "Dashboard",
      "adminPortal": "Admin Portal",
      "login": "Login",
      "logout": "Logout",
      
      // Login Page
      "signInTitle": "Sign in to Right",
      "signInSubtitle": "Secure, passwordless access to your livestock telemetry and health insights.",
      "emailAddress": "Email address",
      "emailOrMobile": "Email or Mobile Number",
      "emailPlaceholder": "you@farm.co",
      "sendLoginCode": "Send login code",
      "sendingCode": "Sending code...",
      "sixDigitCode": "6-digit code",
      "codePlaceholder": "••••••",
      "verifyAndContinue": "Verify & continue",
      "verifying": "Verifying...",
      "dataAgreement": "I agree to the",
      "dataAgreementName": "Data Management Agreement",
      "dataAgreementText": ", including responsible handling of animal telemetry and herd performance insights.",
      "useDifferentEmail": "Use a different email",
      "devTestLogin": "Dev: Log in as test user",
      "devTestLoginInfo": "For local testing only. Logs you in as",
      "devTestLoginEmail": "without sending an email.",
      
      // Dashboard - Common
      "yourAnimals": "Your animals",
      "noAnimals": "No animals yet. An admin must register your devices.",
      "selectAnimal": "Select an animal from the sidebar to view details",
      "loading": "Loading...",
      "telemetryOverview": "Telemetry overview",
      "telemetryOverviewText": "View live locations, battery state, and recent movement alerts for each tagged animal in your herd.",
      
      // Dashboard - Species specific
      "yourCamels": "Your Camels",
      "yourHorses": "Your Horses",
      "yourFalcons": "Your Falcons",
      
      // Dashboard - Map & Cards
      "location": "Location",
      "mapView": "Mapbox view of the selected animal",
      "setMapboxToken": "Set VITE_MAPBOX_ACCESS_TOKEN",
      "battery": "Battery",
      "batteryInfo": "Current battery level from device",
      "activity": "Activity",
      "noRecentActivity": "No recent activity reported.",
      "statusInfo": "Status reflects the last telemetry frame from the IoT device.",
      
      // Dashboard - Movements Table
      "lastMovements": "Last 10 movements & alerts",
      "time": "Time",
      "lat": "Lat",
      "lng": "Lng",
      "status": "Status",
      "noTelemetryFrames": "No telemetry frames yet.",
      
      // Status Values (from IoT devices)
      "Moving": "Moving",
      "Resting": "Resting",
      "normal": "Normal",
      "excellent": "Excellent Health",
      "warning": "Warning",
      "alert": "Alert",
      
      // Technical Specs
      "signal": "Signal",
      "temperature": "Temperature",
      "network": "Network",
      "protection": "Protection",
      "active": "Active",
      
      // Navigation
      "home": "Home",
      "myAssets": "My Assets",
      "profile": "Profile",
      
      // Connectivity Status
      "online": "Online",
      "offline": "Offline",
      "removed": "Removed",
      "connectivityStatus": "Connectivity Status",
      
      // Species
      "species": {
        "camel": "Camel",
        "horse": "Horse",
        "falcon": "Falcon"
      },
      "camel": "Camel",
      "horse": "Horse",
      "falcon": "Falcon",
      "camels": "Camels",
      "horses": "Horses",
      "falcons": "Falcons",
      
      // Animal Names (with Arabic in parentheses for reference)
      "Khozama": "Khozama",
      "Al-Adiyat": "Al-Adiyat",
      "Shaheen": "Shaheen",
      
      // Subscription & Landing Page
      "subscriptionSuccess": "Subscription successful! Welcome to Right.",
      "subscriptionError": "Subscription failed. Please try again.",
      
      // Simulation & Advanced Features
      "simulationError": "Failed to start simulation",
      "exportReport": "Export Report",
      "weatherAt": "Weather at location",
      "satelliteView": "Satellite View",
      "mapView": "Map View",
      "highStress": "High Stress",
      "healthAlert": "Health Alert",
      
      // Admin Portal
      "adminPortalTitle": "Admin Portal",
      "adminPortalSubtitle": "Restricted route for managing Right users, animals, and devices.",
      "addNewUser": "Add new user",
      "fullName": "Full name",
      "fullNamePlaceholder": "Dr. Amal Rahman",
      "nationalId": "National ID",
      "nationalIdPlaceholder": "1234567890",
      "email": "Email",
      "emailPlaceholderAdmin": "vet@ranch.co",
      "activeAccount": "Active account",
      "createUser": "Create user",
      "userCreated": "User created",
      
      "registerDeviceAnimal": "Register device & animal",
      "ownerEmail": "Owner email",
      "ownerEmailPlaceholder": "herd-manager@farm.co",
      "animalName": "Animal name",
      "animalNamePlaceholder": "Khozama",
      "species": "Species",
      "deviceIMEI": "Device IMEI",
      "deviceIMEIPlaceholder": "359881234567890",
      "registerDevice": "Register device",
      "deviceRegistered": "Device registered",
      
      "activeDevices": "Active devices",
      "activeDevicesSubtitle": "All registered IMEIs with their last seen telemetry.",
      "refreshing": "Refreshing…",
      "imei": "IMEI",
      "animal": "Animal",
      "owner": "Owner",
      "lastStatus": "Last status",
      "lastSeen": "Last seen",
      "never": "Never",
      "noDevices": "No devices registered yet.",
      
      // Errors
      "failedToLoad": "Failed to load",
      "failedToCreate": "Failed to create",
      "failedToRegister": "Failed to register",
      "loadingAnimals": "Failed to load animals. Please try again.",
      
      // Map
      "map": {
        "location": "Location",
        "noData": "No location data available",
        "tokenMissing": "Mapbox token not configured"
      },
      "invalidCode": "Invalid or expired code",
      "userNotFound": "User not found",
    }
  },
  ar: {
    translation: {
      // Branding
      "appName": "رايت",
      "tagline": "تتبع وصحة الثروة الحيوانية",
      
      // Navigation
      "dashboard": "لوحة التحكم",
      "adminPortal": "بوابة المسؤول",
      "login": "تسجيل الدخول",
      "logout": "تسجيل الخروج",
      
      // Login Page
      "signInTitle": "تسجيل الدخول إلى رايت",
      "signInSubtitle": "وصول آمن بدون كلمة مرور إلى بيانات الثروة الحيوانية والرؤى الصحية.",
      "emailAddress": "البريد الإلكتروني",
      "emailOrMobile": "البريد الإلكتروني أو رقم الجوال",
      "emailPlaceholder": "you@farm.co",
      "sendLoginCode": "إرسال رمز الدخول",
      "sendingCode": "جاري الإرسال...",
      "sixDigitCode": "رمز مكون من 6 أرقام",
      "codePlaceholder": "••••••",
      "verifyAndContinue": "تحقق ومتابعة",
      "verifying": "جاري التحقق...",
      "dataAgreement": "أوافق على",
      "dataAgreementName": "اتفاقية إدارة البيانات",
      "dataAgreementText": "، بما في ذلك التعامل المسؤول مع بيانات الثروة الحيوانية ورؤى أداء القطيع.",
      "useDifferentEmail": "استخدام بريد إلكتروني مختلف",
      "devTestLogin": "تطوير: تسجيل دخول تجريبي",
      "devTestLoginInfo": "للاختبار المحلي فقط. يسجل دخولك كـ",
      "devTestLoginEmail": "بدون إرسال بريد إلكتروني.",
      
      // Dashboard - Common
      "yourAnimals": "حيواناتك",
      "noAnimals": "لا توجد حيوانات بعد. يجب على المسؤول تسجيل أجهزتك.",
      "selectAnimal": "اختر حيوانًا من الشريط الجانبي لعرض التفاصيل",
      "loading": "جاري التحميل...",
      "telemetryOverview": "نظرة عامة على القياسات",
      "telemetryOverviewText": "عرض المواقع المباشرة وحالة البطارية وتنبيهات الحركة الأخيرة لكل حيوان معلّم في قطيعك.",
      
      // Dashboard - Species specific
      "yourCamels": "إبلك",
      "yourHorses": "خيولك",
      "yourFalcons": "صقورك",
      
      // Dashboard - Map & Cards
      "location": "الموقع",
      "mapView": "عرض الخريطة للحيوان المحدد",
      "setMapboxToken": "تعيين VITE_MAPBOX_ACCESS_TOKEN",
      "battery": "البطارية",
      "batteryInfo": "مستوى البطارية الحالي من الجهاز",
      "activity": "النشاط",
      "noRecentActivity": "لا يوجد نشاط حديث مُبلّغ عنه.",
      "statusInfo": "تعكس الحالة آخر إطار قياسات من جهاز إنترنت الأشياء.",
      
      // Dashboard - Movements Table
      "lastMovements": "آخر 10 حركات وتنبيهات",
      "time": "الوقت",
      "lat": "خط العرض",
      "lng": "خط الطول",
      "status": "الحالة",
      "noTelemetryFrames": "لا توجد إطارات قياسات بعد.",
      
      // Status Values (from IoT devices)
      "Moving": "يتحرك",
      "Resting": "مرتاحة",
      "normal": "طبيعي",
      "excellent": "حالة ممتازة",
      "warning": "تنبيه",
      "alert": "تنبيه",
      
      // Technical Specs
      "signal": "قوة الإشارة",
      "temperature": "درجة الحرارة",
      "network": "الشبكة",
      "protection": "الحماية",
      "active": "نشط",
      
      // Navigation
      "home": "الرئيسية",
      "myAssets": "أصولي",
      "profile": "الملف الشخصي",
      
      // Connectivity Status
      "online": "متصل",
      "offline": "غير متصل",
      "removed": "محذوف",
      "connectivityStatus": "حالة الاتصال",
      
      // Species
      "species": {
        "camel": "جمل",
        "horse": "حصان",
        "falcon": "صقر"
      },
      "camel": "جمل",
      "horse": "حصان",
      "falcon": "صقر",
      "camels": "الإبل",
      "horses": "الخيل",
      "falcons": "الصقور",
      
      // Animal Names (Arabic)
      "Khozama": "خزامة",
      "Al-Adiyat": "العاديات",
      "Shaheen": "شاهين",
      
      // Subscription & Landing Page
      "subscriptionSuccess": "تم الاشتراك بنجاح! مرحباً بك في رايت.",
      "subscriptionError": "فشل الاشتراك. يرجى المحاولة مرة أخرى.",
      
      // Simulation & Advanced Features
      "simulationError": "فشل بدء المحاكاة",
      "exportReport": "تصدير التقرير",
      "weatherAt": "الطقس في الموقع",
      "satelliteView": "الأقمار الصناعية",
      "mapView": "خريطة عادية",
      "highStress": "إجهاد عالٍ",
      "healthAlert": "تنبيه صحي",
      
      // Admin Portal
      "adminPortalTitle": "بوابة المسؤول",
      "adminPortalSubtitle": "مسار مقيد لإدارة مستخدمي رايت والحيوانات والأجهزة.",
      "addNewUser": "إضافة مستخدم جديد",
      "fullName": "الاسم الكامل",
      "fullNamePlaceholder": "د. أمل رحمن",
      "nationalId": "رقم الهوية الوطنية",
      "nationalIdPlaceholder": "1234567890",
      "email": "البريد الإلكتروني",
      "emailPlaceholderAdmin": "vet@ranch.co",
      "activeAccount": "حساب نشط",
      "createUser": "إنشاء مستخدم",
      "userCreated": "تم إنشاء المستخدم",
      
      "registerDeviceAnimal": "تسجيل جهاز وحيوان",
      "ownerEmail": "بريد المالك الإلكتروني",
      "ownerEmailPlaceholder": "herd-manager@farm.co",
      "animalName": "اسم الحيوان",
      "animalNamePlaceholder": "خزامة",
      "species": "النوع",
      "deviceIMEI": "IMEI الجهاز",
      "deviceIMEIPlaceholder": "359881234567890",
      "registerDevice": "تسجيل الجهاز",
      "deviceRegistered": "تم تسجيل الجهاز",
      
      "activeDevices": "الأجهزة النشطة",
      "activeDevicesSubtitle": "جميع IMEIs المسجلة مع آخر قياسات مشاهدة.",
      "refreshing": "جاري التحديث…",
      "imei": "IMEI",
      "animal": "الحيوان",
      "owner": "المالك",
      "lastStatus": "آخر حالة",
      "lastSeen": "آخر ظهور",
      "never": "أبداً",
      "noDevices": "لا توجد أجهزة مسجلة بعد.",
      
      // Errors
      "failedToLoad": "فشل التحميل",
      "failedToCreate": "فشل الإنشاء",
      "failedToRegister": "فشل التسجيل",
      "loadingAnimals": "فشل تحميل الحيوانات. يرجى المحاولة مرة أخرى.",
      
      // Map
      "map": {
        "location": "الموقع",
        "noData": "لا توجد بيانات موقع متاحة",
        "tokenMissing": "رمز Mapbox غير مُعد"
      },
      "invalidCode": "رمز غير صالح أو منتهي الصلاحية",
      "userNotFound": "المستخدم غير موجود",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
