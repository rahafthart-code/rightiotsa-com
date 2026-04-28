import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useStables } from '../hooks/useStables';
import AssetCard from '../components/AssetCard';
import StableTabs from '../components/stables/StableTabs';
import StableStatsCard from '../components/stables/StableStatsCard';
import StableMap from '../components/stables/StableMap';
import AddStableModal from '../components/stables/AddStableModal';
import SensorHealthPanel from '../components/stables/SensorHealthPanel';

/**
 * Stable-driven Owner Dashboard.
 * Cream bg + royal-green (#1D9E75) accents.
 *
 * Layout:
 *  - StableTabs (filter)
 *  - StableStatsCard (when a specific stable is selected)
 *  - StableMap (geofence + status legend)
 *  - Asset grid (filtered by selected stable)
 *  - SensorHealthPanel (collapsible)
 */
export default function StableDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }

  const { assets, loading: assetsLoading } = useAssets(ownerId);
  const { stables, stats, refetch: refetchStables } = useStables(ownerId);

  const [selectedId, setSelectedId] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // If selected stable was deleted, fall back to 'all'
  useEffect(() => {
    if (selectedId === 'all') return;
    if (!stables.find((s) => s.id === selectedId)) setSelectedId('all');
  }, [stables, selectedId]);

  const stableMap = useMemo(() => {
    const m = new Map();
    stables.forEach((s) => m.set(s.id, s));
    return m;
  }, [stables]);

  const filteredAssets = useMemo(() => {
    if (selectedId === 'all') return assets;
    return assets.filter((a) => a.stable_id === selectedId);
  }, [assets, selectedId]);

  const selectedStable = selectedId !== 'all' ? stableMap.get(selectedId) : null;
  const selectedStat = selectedId !== 'all' ? stats.find((x) => x.stable_id === selectedId) : null;

  // For "all" view: aggregate stats
  const aggregateStat = useMemo(() => {
    if (selectedId !== 'all') return null;
    return stats.reduce(
      (acc, r) => ({
        total_assets: acc.total_assets + (Number(r.total_assets) || 0),
        stable_count: acc.stable_count + (Number(r.stable_count) || 0),
        warning_count: acc.warning_count + (Number(r.warning_count) || 0),
        danger_count: acc.danger_count + (Number(r.danger_count) || 0),
        sensors_online: acc.sensors_online + (Number(r.sensors_online) || 0),
        sensors_offline: acc.sensors_offline + (Number(r.sensors_offline) || 0),
      }),
      { total_assets: 0, stable_count: 0, warning_count: 0, danger_count: 0, sensors_online: 0, sensors_offline: 0 }
    );
  }, [stats, selectedId]);

  const allStablePseudo = useMemo(
    () => ({
      id: 'all',
      name: isAr ? 'جميع العزب' : 'All Stables',
      name_en: 'All Stables',
      icon: 'stable',
      color: '#1D9E75',
      location_name: isAr ? `${stables.length} عزبة` : `${stables.length} stables`,
    }),
    [stables.length, isAr]
  );

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-6"
      style={{ background: '#FDFAF4', color: '#1a1a1a' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Page header */}
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1D9E75' }}>
              🌴 {isAr ? 'إدارة العزب' : 'Stable Management'}
            </h1>
            <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
              {isAr ? 'عرض حسب العزبة مع متابعة حية لصحة الأجهزة' : 'Per-stable view with live device health'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/assets/new')}
            className="px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm"
            style={{ background: '#1D9E75' }}
          >
            + {isAr ? 'إضافة أصل' : 'Add Asset'}
          </button>
        </header>

        {/* Stable tabs */}
        <StableTabs
          stables={stables}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => setModalOpen(true)}
          isAr={isAr}
        />

        {/* Stats card */}
        <StableStatsCard
          stable={selectedStable || allStablePseudo}
          stat={selectedStat || aggregateStat}
          isAr={isAr}
        />

        {/* Map */}
        <StableMap stable={selectedStable} assets={filteredAssets} isAr={isAr} />

        {/* Asset grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: '#1D9E75' }}>
              {isAr ? 'الأصول' : 'Assets'}
              <span className="ms-2 text-xs font-semibold" style={{ color: '#6b6b6b' }}>
                · {filteredAssets.length}
              </span>
            </h2>
          </div>

          {assetsLoading ? (
            <div className="text-center py-12 text-sm" style={{ color: '#6b6b6b' }}>
              {isAr ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{ background: '#fff', border: '1px dashed rgba(29,158,117,0.3)' }}
            >
              <div className="text-5xl mb-2">🐪</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                {selectedId === 'all'
                  ? (isAr ? 'لا توجد أصول مسجلة بعد' : 'No assets registered yet')
                  : (isAr ? 'لا توجد أصول في هذه العزبة' : 'No assets in this stable')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  stable={asset.stable_id ? stableMap.get(asset.stable_id) : null}
                  onClick={() => navigate(`/asset/${asset.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sensor health panel */}
        <SensorHealthPanel
          ownerId={ownerId}
          stableId={selectedId}
          assets={assets}
          isAr={isAr}
        />
      </div>

      {modalOpen && (
        <AddStableModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ownerId={ownerId}
          isAr={isAr}
          onCreated={(s) => {
            refetchStables();
            setSelectedId(s.id);
          }}
        />
      )}
    </div>
  );
}
