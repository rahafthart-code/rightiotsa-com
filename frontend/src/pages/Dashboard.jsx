import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useNotifications } from '../hooks/useNotifications';
import AssetCard from '../components/AssetCard';
import DangerAlert from '../components/DangerAlert';
import NotificationBell from '../components/NotificationBell';
import NotificationPanel from '../components/NotificationPanel';
import PortfolioGauge from '../components/PortfolioGauge';
import logoImage from '../assets/logo-transparent.png';

/**
 * Realtime Owner Dashboard — Saudi Royal Green identity.
 * Live assets + notifications + half-circle portfolio gauge + danger overlay.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { user, loading: authLoading, signOut } = useAuth();
  const ownerId = user?.id ?? '';

  const {
    assets,
    loading,
    portfolioIndex,
    dangerCount,
    warningCount,
    stableCount,
  } = useAssets(ownerId);

  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(ownerId);

  const [panelOpen, setPanelOpen] = useState(false);
  const [dangerAsset, setDangerAsset] = useState(null);
  const dismissedRef = useRef(new Set());

  // Auto-open DangerAlert for first un-dismissed danger asset
  const dangerAssets = useMemo(
    () => assets.filter((a) => a.status === 'danger'),
    [assets]
  );
  useEffect(() => {
    if (dangerAsset) return;
    const fresh = dangerAssets.find((a) => !dismissedRef.current.has(a.id));
    if (fresh) setDangerAsset(fresh);
  }, [dangerAssets, dangerAsset]);

  // Cross-component danger events
  useEffect(() => {
    const onDanger = (e) => {
      const id = e.detail?.asset_id ?? e.detail?.id;
      const found = assets.find((a) => a.id === id) || e.detail;
      if (found && !dismissedRef.current.has(found.id)) setDangerAsset(found);
    };
    window.addEventListener('danger-alert', onDanger);
    window.addEventListener('asset-danger', onDanger);
    return () => {
      window.removeEventListener('danger-alert', onDanger);
      window.removeEventListener('asset-danger', onDanger);
    };
  }, [assets]);

  const closeDanger = () => {
    if (dangerAsset) dismissedRef.current.add(dangerAsset.id);
    setDangerAsset(null);
  };

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary, #faf7f0)' }}
      >
        <div
          className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-royal-green, #006c35)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

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
      {/* ─── Header ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{
          background: 'var(--color-royal-green, #006c35)',
          borderBottom: '3px solid var(--color-desert-gold, #c5a55a)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img
              src={logoImage}
              alt="Right"
              className="h-9 w-auto"
              style={{ objectFit: 'contain' }}
            />
            <div>
              <div className="text-sm font-bold text-white tracking-wide">
                {t('appName') || 'Right'}
              </div>
              <div
                className="text-[11px]"
                style={{ color: 'var(--color-desert-gold-light, #e6d5a8)' }}
              >
                {isAr ? 'لوحة المالك — لحظية' : 'Owner Dashboard — Live'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-white">
              <NotificationBell
                count={unreadCount}
                onClick={() => setPanelOpen(true)}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {isAr ? 'الملف الشخصي' : 'Profile'}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => signOut().then(() => navigate('/login'))}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                style={{
                  background: 'var(--color-desert-gold, #c5a55a)',
                  color: 'var(--color-royal-green-dark, #004d25)',
                }}
              >
                {isAr ? 'خروج' : 'Sign out'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ─── Top row: Gauge + summary ────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <PortfolioGauge
              value={portfolioIndex}
              dangerCount={dangerCount}
              warningCount={warningCount}
              stableCount={stableCount}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SummaryTile
              label={isAr ? 'إجمالي الأصول' : 'Total Assets'}
              value={assets.length}
              accent="#006c35"
            />
            <SummaryTile
              label={isAr ? 'إشعارات جديدة' : 'New Alerts'}
              value={unreadCount}
              accent="#c5a55a"
            />
            <SummaryTile
              label={isAr ? 'حالات حرجة' : 'Critical'}
              value={dangerCount}
              accent="#b91c1c"
            />
            <div
              className="col-span-2 sm:col-span-3 rounded-2xl p-5 shadow-sm"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-royal-green, #006c35) 0%, var(--color-royal-green-dark, #004d25) 100%)',
                color: '#fff',
                border: '1px solid rgba(197,165,90,0.4)',
              }}
            >
              <div className="text-[11px] uppercase tracking-widest" style={{ color: '#e6d5a8' }}>
                {isAr ? 'حالة المنظومة' : 'System Status'}
              </div>
              <div className="text-lg font-bold mt-1">
                {dangerCount > 0
                  ? (isAr ? '⚠️ تنبيه فوري مطلوب' : '⚠️ Immediate attention required')
                  : warningCount > 0
                  ? (isAr ? '👀 مراقبة متيقظة' : '👀 Monitor closely')
                  : (isAr ? '✅ جميع الأصول مستقرة' : '✅ All assets stable')}
              </div>
              <div className="text-xs mt-1 opacity-80">
                {isAr
                  ? 'يتم تحديث المؤشرات لحظياً من المستشعرات'
                  : 'Indicators update live from sensors'}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Asset grid ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--color-royal-green, #006c35)' }}
              >
                {isAr ? 'أصولك' : 'Your Assets'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
                {isAr ? 'مرتبة حسب الأولوية' : 'Sorted by priority'} · {assets.length}{' '}
                {isAr ? 'أصل' : 'assets'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ color: '#6b6b6b' }}>
              {isAr ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : assets.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl"
              style={{
                background: '#fff',
                border: '1px dashed rgba(0,108,53,0.3)',
              }}
            >
              <div className="text-5xl mb-3">🐪</div>
              <p style={{ color: '#6b6b6b' }} className="text-sm">
                {isAr ? 'لا توجد أصول مسجلة بعد' : 'No assets registered yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => navigate(`/passport/${asset.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {dangerAsset && <DangerAlert asset={dangerAsset} onClose={closeDanger} />}
    </div>
  );
}

function SummaryTile({ label, value, accent }) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[90px]"
      style={{
        background: '#fff',
        border: `1px solid ${accent}33`,
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6b6b6b' }}>
        {label}
      </div>
      <div className="text-3xl font-black" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
