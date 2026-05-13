import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ListOrdered,
  FileHeart,
  Bell,
  LogOut,
  Menu,
  X,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import logoImage from '../assets/logo-transparent.png';

/**
 * Protected app layout — Saudi Royal Green sidebar (RTL-aware, collapsible on mobile).
 * Wraps all authenticated routes.
 */
export default function ProtectedLayout() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Use either the Supabase user id or the mock user id (demo mode).
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try {
      const raw = localStorage.getItem('user');
      if (raw) ownerId = JSON.parse(raw).id ?? '';
    } catch {}
  }
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(ownerId);

  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const BellButton = ({ className = '' }) => (
    <button
      type="button"
      onClick={() => setNotifOpen(true)}
      aria-label={isAr ? 'الإشعارات' : 'Notifications'}
      className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10 ${className}`}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: 'var(--color-desert-gold, #c5a55a)', color: '#004d25' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );

  const items = [
    { to: '/dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { to: '/assets', label: isAr ? 'إدارة الأصول' : 'Assets', icon: ListOrdered },
    { to: '/stables', label: isAr ? 'مركز عمليات IoT' : 'IoT Operations', icon: Cpu },
    { to: '/reports', label: isAr ? 'التقارير الصحية' : 'Health Reports', icon: FileHeart },
    {
      to: '/notifications',
      label: isAr ? 'الإشعارات' : 'Notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ];

  const toggleLanguage = () => {
    const newLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isAr, i18n.language]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const sidebarSide = isAr ? 'right-0' : 'left-0';
  const contentPad = isAr ? 'lg:pr-64' : 'lg:pl-64';

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, var(--color-bg-primary, #faf7f0) 0%, #f3ecd8 100%)',
        color: 'var(--color-text-primary, #1a1a1a)',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2 shadow-sm"
        style={{
          background: 'var(--color-royal-green, #006c35)',
          borderBottom: '3px solid var(--color-desert-gold, #c5a55a)',
        }}
      >
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Right" className="h-7 w-auto" />
          <span className="text-white text-sm font-bold">Right</span>
        </div>
        <div className="flex items-center gap-1">
          <BellButton />
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2 py-1 text-[11px] font-bold rounded-md"
            style={{ background: 'var(--color-desert-gold, #c5a55a)', color: '#004d25' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {/* ── Backdrop (mobile) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 ${sidebarSide} h-full w-64 z-50 transform transition-transform duration-300
          ${open ? 'translate-x-0' : isAr ? 'translate-x-full' : '-translate-x-full'}
          lg:translate-x-0`}
        style={{
          background:
            'linear-gradient(180deg, var(--color-royal-green, #006c35) 0%, var(--color-royal-green-dark, #004d25) 100%)',
          borderInlineEnd: '3px solid var(--color-desert-gold, #c5a55a)',
          color: '#fff',
        }}
        aria-label="Sidebar"
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              navigate('/dashboard');
              setOpen(false);
            }}
          >
            <img src={logoImage} alt="Right" className="h-8 w-auto" />
            <div>
              <div className="text-sm font-bold tracking-wide">Right</div>
              <div className="text-[10px]" style={{ color: 'var(--color-desert-gold-light, #e6d5a8)' }}>
                {isAr ? 'إدارة وتتبع الأصول' : 'Smart Asset Tracking'}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'}`
              }
              style={({ isActive }) =>
                isActive
                  ? { borderInlineStart: '3px solid var(--color-desert-gold, #c5a55a)' }
                  : { borderInlineStart: '3px solid transparent' }
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: 'var(--color-desert-gold, #c5a55a)',
                    color: '#004d25',
                  }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2"
             style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
            style={{
              background: 'var(--color-desert-gold, #c5a55a)',
              color: '#004d25',
            }}
          >
            {isAr ? 'English' : 'عربي'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white/90 hover:text-white"
            style={{ border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <LogOut size={14} />
            {isAr ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className={contentPad}>
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
