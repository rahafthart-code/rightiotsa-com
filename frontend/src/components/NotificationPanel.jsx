import React from 'react';
import { useTranslation } from 'react-i18next';

function timeAgo(iso, isAr) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return isAr ? 'الآن' : 'just now';
  if (diff < 3600) return isAr ? `قبل ${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return isAr ? `قبل ${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
  return isAr ? `قبل ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
}

const ICONS = {
  danger_alert: '🚨',
  warning_alert: '⚠️',
  zone_breach: '',
  re_engagement: '🌟',
};

/**
 * Slide-in panel from the right showing all notifications, newest first.
 */
export default function NotificationPanel({ open, onClose, notifications, onMarkRead, onMarkAllRead }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 ${isAr ? 'left-0' : 'right-0'} bottom-0 z-50 w-full sm:w-96 transition-transform duration-300 ${
          open ? 'translate-x-0' : isAr ? '-translate-x-full' : 'translate-x-full'
        }`}
        style={{ background: '#0f172a', borderLeft: '1px solid rgb(30,41,59)' }}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100">
            {isAr ? 'الإشعارات' : 'Notifications'}
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {isAr ? 'تعليم الكل كمقروء' : 'Mark all read'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 text-lg"
            >
              ×
            </button>
          </div>
        </header>

        <div className="overflow-y-auto h-[calc(100%-49px)]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              {isAr ? 'لا توجد إشعارات' : 'No notifications yet'}
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && onMarkRead(n.id)}
                  className={`px-4 py-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-900 ${
                    !n.is_read ? 'bg-slate-900/60' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl shrink-0">{ICONS[n.type] || ''}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100 truncate">{n.title}</h3>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1">
                        {timeAgo(n.created_at, isAr)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
