import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const ICONS = {
  danger_alert: '🚨',
  warning_alert: '⚠️',
  zone_breach: '📍',
  re_engagement: '🌟',
  health_report: '🩺',
};

function timeAgo(iso, isAr) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return isAr ? 'الآن' : 'just now';
  if (diff < 3600) return isAr ? `قبل ${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return isAr ? `قبل ${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
  return isAr ? `قبل ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(ownerId);

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.asset_id) navigate(`/asset/${n.asset_id}`);
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            {unreadCount > 0
              ? (isAr ? `${unreadCount} غير مقروء` : `${unreadCount} unread`)
              : (isAr ? 'كل شيء محدّث' : 'All caught up')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(0,108,53,0.08)',
              color: '#006c35',
              border: '1px solid rgba(0,108,53,0.2)',
            }}
          >
            <CheckCheck size={14} />
            {isAr ? 'تعليم الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: '#fff', border: '1px dashed rgba(0,108,53,0.3)' }}
        >
          <Bell size={40} style={{ color: '#006c35' }} className="mx-auto mb-3" />
          <p style={{ color: '#6b6b6b' }} className="text-sm">
            {isAr ? 'لا توجد إشعارات' : 'No notifications'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className="w-full text-start rounded-xl p-4 flex items-start gap-3 transition-all hover:shadow-md"
              style={{
                background: n.is_read ? '#fff' : 'rgba(0,108,53,0.04)',
                border: `1px solid ${n.is_read ? 'rgba(0,0,0,0.06)' : 'rgba(0,108,53,0.25)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'rgba(197,165,90,0.18)' }}
              >
                {ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold truncate" style={{ color: '#1a1a1a' }}>
                    {n.title}
                  </h3>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full" style={{ background: '#006c35' }} />
                  )}
                </div>
                {n.body && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6b6b6b' }}>
                    {n.body}
                  </p>
                )}
                <div className="text-[11px] mt-1" style={{ color: '#8a8a8a' }}>
                  {timeAgo(n.created_at, isAr)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
