import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Bell icon with unread count badge.
 */
export default function NotificationBell({ count = 0, onClick }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isAr ? 'الإشعارات' : 'Notifications'}
      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-800"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: '#dc2626' }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
