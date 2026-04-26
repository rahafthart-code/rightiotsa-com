import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import AdminPortal from "./pages/AdminPortal";
import CheckoutPage from "./pages/CheckoutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import GuestView from "./pages/GuestView";
import logoImage from "./assets/logo-transparent.png";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { ensureMockUser } from "./utils/mockData";

// Preview/demo mode: skip the login screen entirely and seed a mock session.
ensureMockUser();

function useAuth() {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return { isAuthenticated: true, isAdmin: true, user: null };
  try {
    const user = JSON.parse(userRaw);
    return { isAuthenticated: true, isAdmin: !!user.is_admin, user };
  } catch {
    return { isAuthenticated: true, isAdmin: true, user: null };
  }
}

// In preview/demo mode all routes are accessible without authentication.
function ProtectedRoute({ children }) {
  ensureMockUser();
  return children;
}

function AdminRoute({ children }) {
  ensureMockUser();
  return children;
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  React.useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <header className="sticky top-0 z-20 shadow-sm" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
            <img src={logoImage} alt="Right Logo" className="h-8 w-auto" style={{ objectFit: 'contain' }} />
            <div>
              <div className="text-sm font-bold tracking-wide text-white">{t('appName')}</div>
              <div className="text-[11px]" style={{ color: 'var(--color-desert-gold-light)' }}>{t('tagline')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <button onClick={() => navigate('/dashboard')} className="text-xs text-white/80 hover:text-white transition-colors font-medium">
                  {t('dashboard')}
                </button>
                {useAuth().isAdmin && (
                  <button onClick={() => navigate('/admin-portal')} className="text-xs text-white/80 hover:text-white transition-colors font-medium">
                    {t('adminPortal')}
                  </button>
                )}
              </>
            )}
            <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function DashboardShell() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="z-20 shadow-sm" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-full mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3 cursor-pointer hover-lift" onClick={() => navigate("/dashboard")}>
            <img src={logoImage} alt="Right Logo" className="h-10 w-auto animate-float" style={{ objectFit: 'contain' }} />
            <div>
              <span className="text-sm font-bold text-white">{t('appName')}</span>
              <span className="text-[10px] block" style={{ color: 'var(--color-desert-gold-light)' }}>
                {i18n.language === 'ar' ? 'إدارة وتتبع الأصول الذكية' : 'Smart Herd Management & Tracking'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => navigate('/admin-portal')} className="text-xs text-white/80 hover:text-white transition-colors font-medium icon-pop">
                {t('adminPortal')}
              </button>
            )}
            <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover-lift" style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}>
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <UnifiedDashboard />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Demo mode: open straight to the dashboard. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/guest/:token" element={<GuestView />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>} />
        <Route path="/admin-portal" element={<AdminRoute><AppShell><AdminPortal /></AppShell></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <WhatsAppWidget />
    </>
  );
}
