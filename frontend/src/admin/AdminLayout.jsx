import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Cpu, CreditCard, BarChart3, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoImage from '../assets/logo-transparent.png';
import {
  ADMIN_BG, ADMIN_PANEL, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_RED_DIM,
} from './theme';

const NAV = [
  { to: '/admin/customers', label: 'العملاء', icon: Users },
  { to: '/admin/devices', label: 'الأجهزة', icon: Cpu },
  { to: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard },
  { to: '/admin/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مسؤول';

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: ADMIN_BG, color: ADMIN_TEXT, fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* Sidebar (right side in RTL) */}
      <aside
        className="w-64 shrink-0 flex flex-col"
        style={{
          background: ADMIN_PANEL,
          borderInlineStart: `1px solid ${ADMIN_BORDER}`,
          borderInlineEnd: `3px solid ${ADMIN_RED}`,
        }}
      >
        {/* Logo / brand */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${ADMIN_BORDER}` }}>
          <img src={logoImage} alt="InsurTech" className="h-9 w-auto" style={{ objectFit: 'contain' }} />
          <div className="leading-tight">
            <div className="text-sm font-bold" style={{ color: ADMIN_TEXT }}>InsurTech</div>
            <div className="text-xs font-bold flex items-center gap-1" style={{ color: ADMIN_RED }}>
              <ShieldAlert className="w-3 h-3" />
              لوحة الإدارة
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="block"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? ADMIN_RED : ADMIN_MUTED,
                background: isActive ? ADMIN_RED_DIM : 'transparent',
                borderInlineEnd: isActive ? `3px solid ${ADMIN_RED}` : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: `1px solid ${ADMIN_BORDER}` }}>
          <div className="text-xs mb-2" style={{ color: ADMIN_MUTED }}>{adminName}</div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'transparent', color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
