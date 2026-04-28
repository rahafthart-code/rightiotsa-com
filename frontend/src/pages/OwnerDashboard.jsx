import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAssets } from '../hooks/useAssets';
import { useNotifications } from '../hooks/useNotifications';
import AssetCard from '../components/AssetCard';
import DangerAlert from '../components/DangerAlert';
import NotificationBell from '../components/NotificationBell';
import NotificationPanel from '../components/NotificationPanel';
import logoImage from '../assets/logo-transparent.png';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dangerAsset, setDangerAsset] = useState(null);
  const dismissedRef = useRef(new Set()); // assets the user already closed

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { assets, loading } = useAssets(userId);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);

  // Auto-open DangerAlert when any asset enters 'danger' (once per asset)
  const dangerAssets = useMemo(() => assets.filter((a) => a.status === 'danger'), [assets]);
  useEffect(() => {
    if (dangerAsset) return;
    const fresh = dangerAssets.find((a) => !dismissedRef.current.has(a.id));
    if (fresh) setDangerAsset(fresh);
  }, [dangerAssets, dangerAsset]);

  // Listen for cross-component danger events (from useNotifications)
  useEffect(() => {
    const onDanger = (e) => {
      const assetId = e.detail?.asset_id;
      const found = assets.find((a) => a.id === assetId);
      if (found && !dismissedRef.current.has(found.id)) setDangerAsset(found);
    };
    window.addEventListener('danger-alert', onDanger);
    return () => window.removeEventListener('danger-alert', onDanger);
  }, [assets]);

  const closeDanger = () => {
    if (dangerAsset) dismissedRef.current.add(dangerAsset.id);
    setDangerAsset(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        {isAr ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
        <div>
          <p className="mb-4">{isAr ? 'يرجى تسجيل الدخول لعرض لوحة التحكم' : 'Please sign in to view your dashboard'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-white font-semibold"
          >
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Right" className="h-9 w-auto" style={{ objectFit: 'contain' }} />
            <h1 className="text-base sm:text-lg font-bold text-slate-100">
              {isAr ? 'لوحة المالك' : 'Owner Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadCount} onClick={() => setPanelOpen(true)} />
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="hidden sm:inline-flex px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:border-emerald-500/50"
            >
              {isAr ? 'الملف الشخصي' : 'Profile'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {isAr ? 'أصولك' : 'Your Assets'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'محدّث لحظياً' : 'Live updates'} · {assets.length} {isAr ? 'أصل' : 'assets'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="text-5xl mb-3">🐪</div>
            <p className="text-slate-400 text-sm">
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
