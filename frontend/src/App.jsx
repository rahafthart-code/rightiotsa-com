import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPortal from "./pages/AdminPortal";
import CheckoutPage from "./pages/CheckoutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import GuestView from "./pages/GuestView";
import CEODashboard from "./pages/CEODashboard";
import PassportPage from "./pages/PassportPage";
import DigitalPassport from "./pages/DigitalPassport";
import OwnerDashboard from "./pages/OwnerDashboard";
import Dashboard from "./pages/Dashboard";
import AssetPassport from "./pages/AssetPassport";
import AssetsListPage from "./pages/AssetsListPage";
import AddAsset from "./pages/AddAsset";
import HealthReportsPage from "./pages/HealthReportsPage";
import NewHealthReportPage from "./pages/NewHealthReportPage";
import HealthReportDetailPage from "./pages/HealthReportDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import logoImage from "./assets/logo-transparent.png";
import WhatsAppWidget from "./components/WhatsAppWidget";
import PushOptInBanner from "./components/PushOptInBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import { ensureMockUser } from "./utils/mockData";

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

function AdminRoute({ children }) {
  ensureMockUser();
  return children;
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
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
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
  const { isAuthenticated } = useLocalAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <>
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
        <Route path="/guest/:token" element={<GuestView />} />
        <Route path="/passport/:id" element={<PassportPage />} />
        <Route path="/digital-passport/:id" element={<DigitalPassport />} />

        {/* Protected routes inside the dark-green sidebar layout */}
        <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<AssetsListPage />} />
          <Route path="/assets/new" element={<AddAsset />} />
          <Route path="/asset/:id" element={<AssetPassport />} />
          <Route path="/asset-passport/:id" element={<AssetPassport />} />
          <Route path="/reports" element={<HealthReportsPage />} />
          <Route path="/reports/new" element={<NewHealthReportPage />} />
          <Route path="/reports/:id" element={<HealthReportDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/ceo" element={<CEODashboard />} />
        </Route>

        <Route path="/admin-portal" element={<AdminRoute><AppShell><AdminPortal /></AppShell></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <WhatsAppWidget />
      <PushOptInBanner />
    </>
  );
}
