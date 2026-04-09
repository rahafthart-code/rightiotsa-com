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
import logoImage from "./assets/logo-transparent.png";
import WhatsAppWidget from "./components/WhatsAppWidget";

function useAuth() {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return { isAuthenticated: false, isAdmin: false, user: null };
  try {
    const user = JSON.parse(userRaw);
    return { isAuthenticated: true, isAdmin: !!user.is_admin, user };
  } catch {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
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
    <div className="min-h-screen text-slate-100" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="backdrop-blur sticky top-0 z-20" style={{ background: 'rgba(10,22,40,0.85)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
          >
            <img 
              src={logoImage} 
              alt="Right Logo" 
              className="h-8 w-auto"
              style={{ objectFit: 'contain', background: 'transparent' }}
            />
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-100">
                {t('appName')}
              </div>
              <div className="text-[11px] text-slate-400">
                {t('tagline')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-slate-300 hover:text-[#34d399] transition-colors"
                >
                  {t('dashboard')}
                </button>
                {useAuth().isAdmin && (
                  <button
                    onClick={() => navigate('/admin-portal')}
                    className="text-xs text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    {t('adminPortal')}
                  </button>
                )}
              </>
            )}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-medium rounded border text-slate-300 transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
            >
              {i18n.language === 'ar' ? 'EN' : 'ع'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route
          path="/login"
          element={
            <AppShell>
              <LoginPage />
            </AppShell>
          }
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicyPage />}
        />
        <Route
          path="/terms"
          element={<TermsConditionsPage />}
        />
        <Route
          path="/faq"
          element={<FAQPage />}
        />
        <Route
          path="/contact"
          element={<ContactPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
            <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
               <header className="backdrop-blur z-20" style={{ background: 'rgba(10,22,40,0.85)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => window.location.href = "/dashboard"}
                  >
                    <img 
                      src={logoImage} 
                      alt="Right Logo" 
                      className="h-10 w-auto"
                      style={{ objectFit: 'contain', background: 'transparent' }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
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
                        <>
                          {isAdmin && (
                            <button
                              onClick={() => navigate('/admin-portal')}
                              className="text-xs text-slate-300 hover:text-emerald-400 transition-colors"
                            >
                              {t('adminPortal')}
                            </button>
                          )}
                          <button
                            onClick={toggleLanguage}
                            className="px-2 py-1 text-xs font-medium rounded border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-emerald-300 transition-colors"
                          >
                            {i18n.language === 'ar' ? 'EN' : 'ع'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </header>
              <div className="flex-1 overflow-hidden">
                <UnifiedDashboard />
              </div>
            </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-portal"
          element={
            <AdminRoute>
              <AppShell>
                <AdminPortal />
              </AppShell>
            </AdminRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
      <WhatsAppWidget />
    </>
  );
}
