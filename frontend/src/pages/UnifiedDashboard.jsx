import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import * as api from "../api";
import { getConnectivityStatus, getConnectivityColors } from "../utils/connectivity";
import WeatherWidget from "../components/WeatherWidget";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [selectedSpecies, setSelectedSpecies] = useState("Camel");
  const [allAnimals, setAllAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [telemetryRecords, setTelemetryRecords] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [markerInstance, setMarkerInstance] = useState(null);
  const [satelliteView, setSatelliteView] = useState(true);
  const [healthData, setHealthData] = useState(null);

  const species = [
    { value: "Camel", label: t("camels"), emoji: "🐪", color: "from-[#006c35] to-[#34d399]" },
    { value: "Horse", label: t("horses"), emoji: "🐴", color: "from-[#b08040] to-[#d4b37a]" },
    { value: "Falcon", label: t("falcons"), emoji: "🦅", color: "from-[#6b4d27] to-[#c49a5c]" }
  ];

  // Fetch all animals
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const data = await api.listMyAnimals();
        setAllAnimals(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching animals:", err);
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else {
          setError(t("loadingAnimals"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimals();
    const interval = setInterval(fetchAnimals, 10000);
    return () => clearInterval(interval);
  }, [navigate, t]);

  // Filter animals by selected species
  useEffect(() => {
    const filtered = allAnimals.filter(animal => animal.species === selectedSpecies);
    setFilteredAnimals(filtered);
    if (filtered.length > 0) {
      setSelectedAnimal(filtered[0]);
    } else {
      setSelectedAnimal(null);
    }
  }, [selectedSpecies, allAnimals]);

  // Fetch telemetry for selected animal
  useEffect(() => {
    if (!selectedAnimal) {
      setTelemetryRecords([]);
      setLatestTelemetry(null);
      setHealthData(null);
      return;
    }

    const fetchTelemetry = async () => {
      try {
        const data = await api.getTelemetryByIMEI(selectedAnimal.device_imei);
        setTelemetryRecords(data);
        if (data.length > 0) {
          setLatestTelemetry(data[0]);
        } else {
          setLatestTelemetry(null);
        }
      } catch (err) {
        console.error("Error fetching telemetry:", err);
      }
    };

    const fetchHealth = async () => {
      try {
        const data = await api.getLatestHealth(selectedAnimal.device_imei);
        setHealthData(data);
      } catch (err) {
        console.error("Error fetching health:", err);
      }
    };

    fetchTelemetry();
    fetchHealth();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedAnimal, i18n.language]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!latestTelemetry || !MAPBOX_TOKEN) return;
    
    const initMap = () => {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        if (typeof mapboxgl.setRTLTextPlugin === 'function') {
          try {
            const status = mapboxgl.getRTLTextPluginStatus();
            if (status === 'unavailable') {
              mapboxgl.setRTLTextPlugin(
                'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
                (error) => { if (error) console.error('RTL plugin error:', error); },
                true
              );
            }
          } catch (e) {
            console.warn('RTL plugin initialization:', e);
          }
        }
        
        const userLang = i18n.language || navigator.language?.split('-')[0] || 'ar';
        const isArabic = userLang === 'ar';
        
        const map = new mapboxgl.Map({
          container: "map",
          style: satelliteView ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12",
          center: [latestTelemetry.lng, latestTelemetry.lat],
          zoom: 12
        });

        map.on('load', () => {
          const layers = map.getStyle().layers;
          const nameField = isArabic ? 'name_ar' : 'name_en';
          const fallbackField = isArabic ? 'name' : 'name_en';
          
          layers.forEach(layer => {
            if (layer.id.includes('label') && layer.layout && layer.layout['text-field']) {
              try {
                map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', nameField], ['get', fallbackField], ['get', 'name']]);
              } catch (e) {}
            }
          });
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        const marker = new mapboxgl.Marker({ color: "#006c35" })
          .setLngLat([latestTelemetry.lng, latestTelemetry.lat])
          .addTo(map);

        setMapInstance(map);
        setMarkerInstance(marker);

        return () => {
          marker.remove();
          map.remove();
        };
      } catch (err) {
        console.error("Mapbox initialization error:", err);
      }
    };

    const cleanup = initMap();
    return cleanup;
  }, [latestTelemetry, i18n.language, satelliteView]);

  useEffect(() => {
    if (markerInstance && latestTelemetry && mapInstance) {
      const newPos = [latestTelemetry.lng, latestTelemetry.lat];
      markerInstance.setLngLat(newPos);
      mapInstance.flyTo({ center: newPos, zoom: 12 });
    }
  }, [latestTelemetry, markerInstance, mapInstance]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleGoHome = () => navigate('/');
  const handleProfile = () => navigate('/profile');

  const currentSpecies = species.find(s => s.value === selectedSpecies);

  return (
    <div className="flex h-full" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-72 flex flex-col border-r" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        {/* Header with Saudi green accent */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, rgba(0,108,53,0.15), rgba(176,128,64,0.1))' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#34d399' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{i18n.language === 'ar' ? 'اشتراك نشط' : 'Active Subscription'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleProfile} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" title={i18n.language === 'ar' ? 'الملف الشخصي' : 'Profile'}>
                <svg className="w-4 h-4 text-slate-400 hover:text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button onClick={handleLogout} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title={i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
                <svg className="w-4 h-4 text-slate-400 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">365 {i18n.language === 'ar' ? 'يوم' : 'days'}</div>
          <div className="text-xs text-slate-400 mt-1">{i18n.language === 'ar' ? 'متبقي في اشتراكك' : 'remaining in your subscription'}</div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="space-y-2">
            <button onClick={handleGoHome} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#006c35]/10 hover:text-[#34d399] rounded-lg transition-all group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium">{i18n.language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#b08040]/10 hover:text-[#d4b37a] rounded-lg transition-all group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-sm font-medium">{i18n.language === 'ar' ? 'أصولي' : 'My Assets'}</span>
            </button>
          </div>
        </div>

        {/* Species Tabs - Saudi Heritage themed */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
            {i18n.language === 'ar' ? 'نوع الأصول' : 'Asset Type'}
          </div>
          <div className="flex gap-2">
            {species.map((sp) => (
              <button
                key={sp.value}
                onClick={() => setSelectedSpecies(sp.value)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedSpecies === sp.value
                    ? `bg-gradient-to-br ${sp.color} text-white shadow-lg`
                    : "text-slate-300 hover:bg-white/5"
                }`}
                style={selectedSpecies !== sp.value ? { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' } : {}}
              >
                <span className="block text-lg">{sp.emoji}</span>
                <span className="block text-[10px] mt-1">{sp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animals List */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-4 text-center text-slate-400">{t("loading")}</div>}
          {error && <div className="p-4 text-sm text-red-400">{error}</div>}
          
          {!loading && !error && filteredAnimals.length === 0 && (
            <div className="p-4 space-y-3">
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,108,53,0.08)', border: '1px solid rgba(0,108,53,0.2)' }}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium mb-1" style={{ color: '#a7f3d0' }}>
                      {i18n.language === 'ar' ? 'لا توجد أجهزة مسجلة لهذا النوع' : 'No devices registered for this species'}
                    </p>
                    <p className="text-xs" style={{ color: '#6ee7b7' }}>
                      {i18n.language === 'ar' ? 'جرّب النوع الآخر أو تواصل مع المدير' : 'Try another species or contact admin'}
                    </p>
                  </div>
                </div>
              </div>
              {allAnimals.length > 0 && (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(176,128,64,0.08)', border: '1px solid rgba(176,128,64,0.2)' }}>
                  <p className="text-sm" style={{ color: '#d4b37a' }}>
                    {i18n.language === 'ar' ? '💡 لديك أجهزة مسجلة من أنواع أخرى' : '💡 You have devices for other species'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {filteredAnimals.map((animal) => {
            const status = getConnectivityStatus(animal.last_seen_at);
            const colors = getConnectivityColors(status);
            
            return (
              <div
                key={animal.id}
                onClick={() => setSelectedAnimal(animal)}
                className={`p-4 cursor-pointer transition-all border-b`}
                style={{
                  borderColor: 'var(--color-border)',
                  background: selectedAnimal?.id === animal.id ? 'rgba(0,108,53,0.1)' : 'transparent',
                  borderLeft: selectedAnimal?.id === animal.id ? '3px solid #006c35' : '3px solid transparent',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-100">{t(animal.name) || animal.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{animal.device_imei}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${colors}`}>{t(status)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedAnimal && allAnimals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full rounded-2xl p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, rgba(0,108,53,0.2), rgba(176,128,64,0.2))' }}>
                <svg className="w-10 h-10" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3">
                {i18n.language === 'ar' ? 'نظام العرض التوضيحي التفاعلي' : 'Interactive Demo System'}
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'لا توجد أجهزة مسجلة حالياً. شاهد عرضاً توضيحياً تفاعلياً لإمكانيات النظام.'
                  : 'No devices registered yet. Watch an interactive demo of the system capabilities.'}
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: "📍", label: i18n.language === 'ar' ? 'تتبع GPS' : 'GPS Tracking' },
                  { icon: "❤️", label: i18n.language === 'ar' ? 'المؤشرات الحيوية' : 'Vital Signs' },
                  { icon: "🔔", label: i18n.language === 'ar' ? 'تنبيهات فورية' : 'Instant Alerts' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !selectedAnimal ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">{t("selectAnimal")}</div>
        ) : (
          <>
            {/* Animal Header */}
            <header className="p-6 border-b" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,108,53,0.2), rgba(176,128,64,0.15))' }}>
                    {currentSpecies?.emoji}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                      {t(selectedAnimal.name) || selectedAnimal.name}
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {currentSpecies?.label} • {selectedAnimal.device_imei}
                      {healthData?.heart_rate && <span className="ml-2">• ❤️ {healthData.heart_rate} bpm</span>}
                    </p>
                  </div>
                  {healthData?.status === "excellent" && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ background: 'rgba(0,108,53,0.15)', border: '1px solid rgba(0,108,53,0.3)', color: '#34d399' }}>
                      ✓ {t('excellent')}
                    </span>
                  )}
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(176,128,64,0.08)', border: '1px solid rgba(176,128,64,0.2)' }}>
                  <div className="text-xs space-y-1" style={{ color: '#d4b37a' }}>
                    <div className="flex items-center gap-2"><span>🔋</span><span>{t('battery')}: 5 {i18n.language === 'ar' ? 'سنوات' : 'Years'}</span></div>
                    <div className="flex items-center gap-2"><span>📡</span><span>{t('network')}: Sigfox 0G</span></div>
                    <div className="flex items-center gap-2"><span>✅</span><span>{t('status')}: {i18n.language === 'ar' ? 'نشط' : 'Active'}</span></div>
                  </div>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ background: 'var(--color-bg-primary)' }}>
              {/* Map */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">{t("location")}</h2>
                  {latestTelemetry && MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("placeholder") && (
                    <button
                      onClick={() => setSatelliteView(!satelliteView)}
                      className="px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: '#e2e8f0' }}
                    >
                      {satelliteView ? '🗺️' : '🛰️'}
                      <span>{i18n.language === 'ar' ? (satelliteView ? 'خريطة عادية' : 'الأقمار الصناعية') : (satelliteView ? 'Map View' : 'Satellite View')}</span>
                    </button>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  {!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("placeholder") ? (
                    <div className="h-96 flex items-center justify-center text-slate-500" style={{ background: 'var(--color-bg-primary)' }}>
                      <div className="text-center"><div className="text-4xl mb-2">🗺️</div><p>Mapbox token not configured</p></div>
                    </div>
                  ) : !latestTelemetry ? (
                    <div className="h-96 flex items-center justify-center text-slate-500" style={{ background: 'var(--color-bg-primary)' }}>No location data available</div>
                  ) : (
                    <div id="map" className="h-96 w-full" />
                  )}
                </div>
              </section>

              {/* Weather Widget */}
              {latestTelemetry && (
                <section className="mb-4">
                  <WeatherWidget lat={latestTelemetry.lat} lng={latestTelemetry.lng} />
                </section>
              )}

              {/* Status Cards */}
              <section className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("battery")}</div>
                  <div className="text-2xl font-bold" style={{ color: '#34d399' }}>
                    {latestTelemetry?.battery != null ? `${latestTelemetry.battery}%` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{t("batteryInfo")}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("activity")}</div>
                  <div className="text-sm text-slate-100">{latestTelemetry?.status ? (t(latestTelemetry.status) || latestTelemetry.status) : t("noRecentActivity")}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{t("statusInfo")}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("connectivityStatus")}</div>
                  {(() => {
                    const status = getConnectivityStatus(selectedAnimal.last_seen_at);
                    const colors = getConnectivityColors(status);
                    return <div className={`inline-block px-2 py-1 text-sm rounded-full ${colors}`}>{t(status)}</div>;
                  })()}
                </div>
              </section>

              {/* Movements Table */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">{t("lastMovements")}</h2>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['Timestamp', 'Latitude', 'Longitude', 'Battery', 'Status'],
                        ...telemetryRecords.map(t => [new Date(t.timestamp).toISOString(), t.lat, t.lng, t.battery, t.status])
                      ].map(row => row.join(',')).join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedAnimal.name}_telemetry_${new Date().toISOString()}.csv`;
                      a.click();
                    }}
                    className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all"
                    style={{ background: 'linear-gradient(135deg, #006c35, #005a2c)' }}
                  >
                    {i18n.language === 'ar' ? '📥 تصدير التقرير' : '📥 Export Report'}
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <table className="w-full">
                    <thead style={{ background: 'var(--color-bg-secondary)' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase text-slate-400">{t("time")}</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-slate-400">{t("location")}</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-slate-400">{t("battery")}</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-slate-400">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetryRecords.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">{t("noTelemetryFrames")}</td></tr>
                      ) : (
                        telemetryRecords.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <td className="px-4 py-2 text-slate-300 text-sm">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-2 text-slate-400 text-sm font-mono">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</td>
                            <td className="px-4 py-2 text-slate-100">{item.battery != null ? `${item.battery}%` : "—"}</td>
                            <td className="px-4 py-2 text-slate-200">{item.status ? (t(item.status) || item.status) : "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
