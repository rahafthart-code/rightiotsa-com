import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDeviceHealth } from '../hooks/useDeviceHealth';

function timeAgo(ts, isAr) {
  if (!ts) return isAr ? 'غير معروف' : 'unknown';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return isAr ? 'الآن' : 'just now';
  if (diff < 3600) return isAr ? `منذ ${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return isAr ? `منذ ${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
  return isAr ? `منذ ${Math.floor(diff / 86400)} ي` : `${Math.floor(diff / 86400)}d ago`;
}

function statusMeta(status, isAr) {
  switch (status) {
    case 'online':
      return { color: '#10b981', label: isAr ? 'متصل' : 'Online' };
    case 'offline':
      return { color: '#6b7280', label: isAr ? 'غير متصل' : 'Offline' };
    case 'low_battery':
      return { color: '#d97706', label: isAr ? 'بطارية منخفضة' : 'Low Battery' };
    case 'error':
      return { color: '#b91c1c', label: isAr ? 'خطأ' : 'Error' };
    default:
      return { color: '#6b7280', label: isAr ? 'غير معروف' : 'Unknown' };
  }
}

export default function DeviceHealthBox({ assetId, isAr: forcedAr }) {
  const { i18n } = useTranslation();
  const isAr = forcedAr ?? i18n.language === 'ar';
  const { device, loading } = useDeviceHealth(assetId);

  if (loading) return null;
  if (!device) {
    return (
      <section
        className="rounded-2xl p-4"
        style={{
          background: 'var(--color-bg-card, #fff)',
          border: '1px dashed rgba(0,108,53,0.3)',
        }}
      >
        <div className="text-sm" style={{ color: '#6b6b6b' }}>
          {isAr ? 'لا يوجد حساس مرتبط بهذا الأصل' : 'No sensor device linked to this asset'}
        </div>
      </section>
    );
  }

  const meta = statusMeta(device.status, isAr);
  const battery = device.battery_pct;
  const batteryColor = battery == null ? '#9ca3af' : battery < 20 ? '#b91c1c' : battery < 40 ? '#d97706' : '#10b981';
  const signal = device.signal_strength; // dBm
  const signalPct = signal == null ? null : Math.max(0, Math.min(100, Math.round(((signal + 110) / 80) * 100)));

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-bg-card, #fff)',
        border: '1px solid var(--color-border, rgba(0,0,0,0.08))',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #006c35, #004d25)',
          borderBottom: '2px solid #c5a55a',
        }}
      >
        <div className="text-white text-sm font-bold flex items-center gap-2">
          <span>📡</span>
          {isAr ? 'صحة الجهاز' : 'Device Health'}
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: meta.color, color: '#fff' }}
        >
          ● {meta.label}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile
          label={isAr ? 'البطارية' : 'Battery'}
          value={battery != null ? `${battery}%` : '—'}
          color={batteryColor}
          bar={battery}
        />
        <Tile
          label={isAr ? 'قوة الإشارة' : 'Signal'}
          value={signal != null ? `${signal} dBm` : '—'}
          color="#1D9E75"
          bar={signalPct}
        />
        <Tile
          label={isAr ? 'نوع الجهاز' : 'Type'}
          value={device.device_type || '—'}
          color="#1a1a1a"
        />
        <Tile
          label={isAr ? 'آخر اتصال' : 'Last seen'}
          value={timeAgo(device.last_seen_at, isAr)}
          color="#1a1a1a"
        />
      </div>

      <div
        className="px-4 pb-3 text-[11px] font-mono flex items-center justify-between"
        style={{ color: '#6b6b6b' }}
      >
        <span>ID: {device.device_id}</span>
        {device.firmware_ver && <span>FW: {device.firmware_ver}</span>}
      </div>
    </section>
  );
}

function Tile({ label, value, color, bar }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--color-bg-secondary, #f7f5ee)',
        border: '1px solid var(--color-border, rgba(0,0,0,0.06))',
      }}
    >
      <div className="text-[10px] uppercase tracking-wide font-bold" style={{ color: '#6b6b6b' }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold" style={{ color }}>
        {value}
      </div>
      {bar != null && (
        <div
          className="mt-2 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.08)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, bar))}%`, background: color }}
          />
        </div>
      )}
    </div>
  );
}
