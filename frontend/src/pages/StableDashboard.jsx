import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useStables } from '../hooks/useStables';
import { useSensorHealth } from '../hooks/useSensorHealth';
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
 * Wired to useStables: selectedStable / setSelected / currentStats /
 * stableFilter / createStable. The asset list is fetched via useAssets(ownerId, stableFilter).
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

  const {
    stables,
    stableStats,
    selectedStable,
    setSelected,
    createStable,
    stableFilter,
    currentStats,
    totals,
  } = useStables(ownerId);

  // Pass the hook-provided filter directly to the assets hook
  const { assets, loading: assetsLoading } = useAssets(ownerId, stableFilter);

  // Page-level offline banner driven by useSensorHealth (scoped to current view)
  const { offlineAlert, devices: scopedDevices } = useSensorHealth(ownerId, selectedStable, isAr);

  const [modalOpen, setModalOpen] = useState(false);

  const stableMap = useMemo(() => {
    const m = new Map();
    stables.forEach((s) => m.set(s.id, s));
    return m;
  }, [stables]);

  const selectedStableObj = selectedStable !== 'all' ? stableMap.get(selectedStable) : null;

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

        {/* Stable selector — bound to selectedStable / setSelected */}
        <StableTabs
          stables={stables}
          selectedId={selectedStable}
          onSelect={setSelected}
          onAdd={() => setModalOpen(true)}
          isAr={isAr}
        />

        {/* Stats card — currentStats when a stable is selected, else aggregate totals */}
        <StableStatsCard
          stable={selectedStableObj || allStablePseudo}
          stat={currentStats || totals}
          isAr={isAr}
        />

        {/* Map */}
        <StableMap stable={selectedStableObj} assets={assets} isAr={isAr} />

        {/* Asset grid (already filtered server-side via stableFilter) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: '#1D9E75' }}>
              {isAr ? 'الأصول' : 'Assets'}
              <span className="ms-2 text-xs font-semibold" style={{ color: '#6b6b6b' }}>
                · {assets.length}
              </span>
            </h2>
          </div>

          {assetsLoading ? (
            <div className="text-center py-12 text-sm" style={{ color: '#6b6b6b' }}>
              {isAr ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : assets.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{ background: '#fff', border: '1px dashed rgba(29,158,117,0.3)' }}
            >
              <div className="text-5xl mb-2">🐪</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                {selectedStable === 'all'
                  ? (isAr ? 'لا توجد أصول مسجلة بعد' : 'No assets registered yet')
                  : (isAr ? 'لا توجد أصول في هذه العزبة' : 'No assets in this stable')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => (
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
          stableId={selectedStable}
          assets={assets}
          isAr={isAr}
        />
      </div>

      {modalOpen && (
        <AddStableModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ownerId={ownerId}
          onSubmit={createStable}
          isAr={isAr}
        />
      )}
    </div>
  );
}
