import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, MapPin, Heart, Thermometer, AlertTriangle, CheckCheck } from 'lucide-react';

const TYPE_META = {
  danger_alert:  { icon: AlertTriangle, color: '#dc2626' },
  warning_alert: { icon: Thermometer,   color: '#f59e0b' },
  zone_breach:   { icon: MapPin,        color: '#d4af37' },
  vital_alert:   { icon: Heart,         color: '#ef4444' },
};

function timeAgo(iso, isAr) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return isAr ? 'الآن' : 'just now';
  if (diff < 3600)  return isAr ? `قبل ${Math.floor(diff / 60)} د`   : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return isAr ? `قبل ${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
  return isAr ? `قبل ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
}

/**
 * NotificationBell — gold-themed bell with sliding side panel.
 *
 * Props:
 *   notifications: Array<{ id, type, title, body, created_at, is_read, asset_id }>
 *   unreadCount?: number  (defaults to count where !is_read)
 *   onMarkRead?:    (id) => void
 *   onMarkAllRead?: () => void
 *   onItemClick?:   (n) => void
 */
export default function NotificationBell({
  notifications = [],
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onItemClick,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [open, setOpen] = useState(false);
  const count = typeof unreadCount === 'number'
    ? unreadCount
    : notifications.filter((n) => !n.is_read).length;

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sideClose = isAr ? 'left-0' : 'right-0';
  const slideHidden = isAr ? '-translate-x-full' : 'translate-x-full';

  const handleItemClick = (n) => {
    if (!n.is_read) onMarkRead?.(n.id);
    onItemClick?.(n);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isAr ? 'الإشعارات' : 'Notifications'}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: '#0a1020',
          border: '1px solid #1c2640',
        }}
      >
        <Bell size={18} style={{ color: '#d4af37' }} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{
              background: '#d4af37',
              color: '#1a1408',
              boxShadow: '0 0 0 2px #090d17',
              animation: 'nb-pop 1.6s ease-in-out infinite',
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(8,8,12,0.6)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        dir={isAr ? 'rtl' : 'ltr'}
        className={`fixed top-0 ${sideClose} bottom-0 z-50 w-full sm:w-[380px] transition-transform duration-300 ${
          open ? 'translate-x-0' : slideHidden
        }`}
        style={{
          background: '#0f1626',
          borderInlineStart: '1px solid #1c2640',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '1px solid #1c2640',
            background: 'linear-gradient(180deg, #11182a 0%, #0f1626 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: '#d4af37' }} />
            <h3 className="text-sm font-bold" style={{ color: '#d4af37' }}>
              {isAr ? 'الإشعارات' : 'Notifications'}
            </h3>
            {count > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#d4af3722', color: '#d4af37' }}
              >
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {count > 0 && onMarkAllRead && (
              <button
                onClick={onMarkAllRead}
                className="px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1"
                style={{ color: '#7d8499' }}
              >
                <CheckCheck size={12} />
                {isAr ? 'تحديد الكل' : 'Mark all'}
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ color: '#7d8499' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 53px)' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Bell size={32} style={{ color: '#1c2640' }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: '#7d8499' }}>
                {isAr ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <ul className="p-2 space-y-2">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.warning_alert;
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className="w-full text-right rounded-xl p-3 transition-all flex gap-3"
                      style={{
                        background: n.is_read ? '#0a1020' : 'rgba(212,175,55,0.06)',
                        border: `1px solid ${n.is_read ? '#1c2640' : '#d4af3744'}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: `${meta.color}1f`,
                          border: `1px solid ${meta.color}55`,
                        }}
                      >
                        <Icon size={16} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold truncate" style={{ color: '#f2efe3' }}>
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: '#d4af37' }} />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs mt-1" style={{ color: '#a8aec1' }}>
                            {n.body}
                          </p>
                        )}
                        <div className="text-[10px] mt-1.5" style={{ color: '#7d8499' }}>
                          {timeAgo(n.created_at, isAr)}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes nb-pop {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.15); }
        }
      `}</style>
    </>
  );
}
