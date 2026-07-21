import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "./assets/logo-transparent.png";
import WhatsAppWidget from "./components/WhatsAppWidget";
import PushOptInBanner from "./components/PushOptInBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import RootErrorBoundary from "./components/RootErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner";
import { ensureMockUser } from "./utils/mockData";

// Direct imports for critical / recently-added pages to guarantee they land in the main bundle.
import CheckoutPage from "./pages/CheckoutPage";
import SecurityDashboard from "./pages/SecurityDashboard";
import MfaEnrollPage from "./pages/MfaEnrollPage";
import MfaRequired from "./pages/MfaRequired";
import AuthGuard from "./components/AuthGuard";
import GeofenceBreachToast from "./components/GeofenceBreachToast";
import SubscribePage from "./pages/SubscribePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";

// Lazy-load every page so the initial bundle stays small.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsConditionsPage = lazy(() => import("./pages/TermsConditionsPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const GuestView = lazy(() => import("./pages/GuestView"));
const CEODashboard = lazy(() => import("./pages/CEODashboard"));
const PassportPage = lazy(() => import("./pages/PassportPage"));
const DigitalPassport = lazy(() => import("./pages/DigitalPassport"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AssetPassport = lazy(() => import("./pages/AssetPassport"));
const AssetsListPage = lazy(() => import("./pages/AssetsListPage"));
const AddAsset = lazy(() => import("./pages/AddAsset"));
const HealthReportsPage = lazy(() => import("./pages/HealthReportsPage"));
const NewHealthReportPage = lazy(() => import("./pages/NewHealthReportPage"));
const HealthReportDetailPage = lazy(() => import("./pages/HealthReportDetailPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const OwnerDashboardDark = lazy(() => import("./pages/OwnerDashboardDark"));
const StableDashboard = lazy(() => import("./pages/StableDashboard"));

// Admin Panel
const AdminGuard = lazy(() => import("./admin/AdminGuard"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminCustomersPage = lazy(() => import("./admin/pages/CustomersPage"));
const AdminDevicesPage = lazy(() => import("./admin/pages/DevicesPage"));
const AdminSubscriptionsPage = lazy(() => import("./admin/pages/SubscriptionsPage"));
const AdminPlaceholderPage = lazy(() => import("./admin/pages/PlaceholderPage"));
const AdminSystemHealthPage = lazy(() => import("./admin/pages/SystemHealthPage"));
const VerifyAssetPage = lazy(() => import("./pages/VerifyAssetPage"));

// Preview/demo mode: seed a mock session so the dashboard remains accessible
// without a real login during development. Real auth still works via /login.
ensureMockUser();

function useLocalAuth() {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return { isAuthenticated: false, isAdmin: false, user: null };
  try {
    const user = JSON.parse(userRaw);
    return { isAuthenticated: true, isAdmin: !!user.is_admin, user };
  } catch {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useLocalAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  React.useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#006c35] font-cairo" style={{ background: "#F5F5DC", color: "#006c35", fontFamily: "Cairo, Tajawal, sans-serif" }}>
      <header className="sticky top-0 z-20 shadow-sm" style={{ background: "var(--color-royal-green)", borderBottom: "3px solid var(--color-desert-gold)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
            <img src={logoImage} alt="Right Logo" className="h-8 w-auto" style={{ objectFit: "contain" }} />
            <div>
              <div className="text-sm font-bold tracking-wide text-white">{t("appName")}</div>
              <div className="text-[11px]" style={{ color: "var(--color-desert-gold-light)" }}>{t("tagline")}</div>
            </div>
          </div>
          <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors" style={{ background: "var(--color-desert-gold)", color: "var(--color-royal-green-dark)" }}>
            {i18n.language === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function RootRedirect() {
  // Always show the landing page first when opening the site root.
  return <Navigate to="/landing" replace />;
}

export default function App() {
  return (
    <RootErrorBoundary>
      <ConnectionStatusBanner />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Root: route based on auth */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/guest/:token" element={<GuestView />} />
          <Route path="/passport/:id" element={<PassportPage />} />
          <Route path="/digital-passport/:id" element={<DigitalPassport />} />
          <Route path="/verify/:id" element={<VerifyAssetPage />} />

          {/* /dashboard uses its own dark layout (with embedded sidebar) */}
          <Route path="/dashboard" element={<ProtectedRoute><OwnerDashboardDark /></ProtectedRoute>} />

          {/* Other protected routes inside the green sidebar layout */}
          <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
            <Route path="/dashboard-legacy" element={<StableDashboard />} />
            <Route path="/stables" element={<StableDashboard />} />
            <Route path="/assets" element={<AssetsListPage />} />
            <Route path="/assets/new" element={<AddAsset />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/asset/:id" element={<AssetPassport />} />
            <Route path="/asset-passport/:id" element={<AssetPassport />} />
            <Route path="/reports" element={<HealthReportsPage />} />
            <Route path="/reports/new" element={<NewHealthReportPage />} />
            <Route path="/reports/:id" element={<HealthReportDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/ceo" element={<CEODashboard />} />
            <Route path="/security/mfa-required" element={<MfaRequired />} />
            <Route path="/security/mfa-enroll" element={<MfaEnrollPage />} />
            <Route
              path="/security"
              element={
                <AuthGuard allowedRoles={["admin"]}>
                  <SecurityDashboard />
                </AuthGuard>
              }
            />
          </Route>

          {/* Admin Panel — only accessible to users with the 'admin' role */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="customers" replace />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="devices" element={<AdminDevicesPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="system" element={<AdminSystemHealthPage />} />
            <Route path="reports" element={<AdminPlaceholderPage title="التقارير" subtitle="تقارير تفصيلية للعملاء والاشتراكات والأجهزة." />} />
            <Route path="settings" element={<AdminPlaceholderPage title="الإعدادات" subtitle="إعدادات لوحة الإدارة." />} />
          </Route>

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
      <WhatsAppWidget />
      <PushOptInBanner />
      <GeofenceBreachToast />
    </RootErrorBoundary>
  );
}
