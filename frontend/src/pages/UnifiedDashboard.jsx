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
    { value: "Camel", label: t("camels"), emoji: "🐪" },
    { value: "Horse", label: t("horses"), emoji: "🐴" },
    { value: "Falcon", label: t("falcons"), emoji: "🦅" }
  ];

  // Fetch all animals
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const data = await api.listMyAnimals();
        setAllAnimals(data);
        setError(null);
        
        // DISABLED: Notification permission request disabled for demo
        // if (Notification.permission === "default") {
        //   Notification.requestPermission();
        // }
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
    
    // Auto-refresh every 10 seconds for simulation mode
    const interval = setInterval(fetchAnimals, 10000);
    return () => clearInterval(interval);
  }, [navigate, t]);

  // Filter animals by selected species
  useEffect(() => {
    const filtered = allAnimals.filter(animal => animal.species === selectedSpecies);
    setFilteredAnimals(filtered);
    
    // Auto-select first animal of the species
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
        
        // MUTED: High stress alerts disabled for demo
        // if (data.status === "high_stress" && Notification.permission === "granted") {
        //   new Audio('/alert.mp3').play().catch(() => {});
        //   new Notification(
        //     i18n.language === 'ar' ? 'تنبيه صحي' : 'Health Alert',
        //     {
        //       body: i18n.language === 'ar' 
        //         ? `${selectedAnimal.name}: إجهاد عالٍ - نبض القلب ${data.heart_rate} bpm`
        //         : `${selectedAnimal.name}: High Stress - Heart rate ${data.heart_rate} bpm`,
        //       icon: '/favicon.ico'
        //     }
        //   );
        // }
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
        
        // CRITICAL: Enable RTL text rendering for Arabic BEFORE creating map
        if (typeof mapboxgl.setRTLTextPlugin === 'function') {
          try {
            const status = mapboxgl.getRTLTextPluginStatus();
            if (status === 'unavailable') {
              mapboxgl.setRTLTextPlugin(
                'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
                (error) => {
                  if (error) {
                    console.error('RTL plugin error:', error);
                  } else {
                    console.log('RTL plugin loaded successfully');
                  }
                },
                true // lazy load
              );
            }
          } catch (e) {
            console.warn('RTL plugin initialization:', e);
          }
        }
        
        // Detect user's browser language
        const userLang = i18n.language || navigator.language?.split('-')[0] || 'ar';
        const isArabic = userLang === 'ar';
        
        console.log('Map language detected:', userLang, 'isArabic:', isArabic);
        
        const map = new mapboxgl.Map({
          container: "map",
          style: satelliteView ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12",
          center: [latestTelemetry.lng, latestTelemetry.lat],
          zoom: 12
        });

        // Set map language dynamically based on browser/user preference
        map.on('load', () => {
          const layers = map.getStyle().layers;
          
          // Determine which language field to use
          const nameField = isArabic ? 'name_ar' : 'name_en';
          const fallbackField = isArabic ? 'name' : 'name_en';
          
          // Set specific label layers
          const labelLayers = [
            'country-label',
            'state-label', 
            'settlement-label',
            'settlement-subdivision-label',
            'settlement-minor-label'
          ];
          
          labelLayers.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                  layerId, 
                  'text-field', 
                  ['coalesce', ['get', nameField], ['get', fallbackField], ['get', 'name']]
                );
              }
            } catch (e) {
              // Layer doesn't exist or doesn't support text-field
            }
          });
          
          // Auto-detect and set all other label layers
          layers.forEach(layer => {
            if (layer.id.includes('label') && layer.layout && layer.layout['text-field']) {
              try {
                map.setLayoutProperty(
                  layer.id, 
                  'text-field', 
                  ['coalesce', ['get', nameField], ['get', fallbackField], ['get', 'name']]
                );
              } catch (e) {
                // Ignore errors for layers that don't support this
              }
            }
          });
          
          console.log(`Map labels set to: ${isArabic ? 'Arabic' : 'English'}`);
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        const marker = new mapboxgl.Marker({ color: "#10b981" })
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
  }, [latestTelemetry, i18n.language, satelliteView]); // Re-render when language or view changes

  // Update marker position when telemetry changes
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

  const handleGoHome = () => {
    navigate('/');
  };

  const handleProfile = () => {
    // Navigate to profile page
    navigate('/profile');
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Unified Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Navigation Header with Profile & Logout */}
        <div className="p-4 bg-gradient-to-r from-emerald-600/10 to-emerald-700/10 border-b border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{i18n.language === 'ar' ? 'اشتراك نشط' : 'Active Subscription'}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Profile Button */}
              <button
                onClick={handleProfile}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                title={i18n.language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              >
                <svg className="w-4 h-4 text-slate-400 hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                title={i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <svg className="w-4 h-4 text-slate-400 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            365 {i18n.language === 'ar' ? 'يوم' : 'days'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {i18n.language === 'ar' ? 'متبقي في اشتراكك' : 'remaining in your subscription'}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="space-y-2">
            {/* Home Button */}
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium">
                {i18n.language === 'ar' ? 'الرئيسية' : 'Home'}
              </span>
            </button>
            
            {/* My Assets Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-sm font-medium">
                {i18n.language === 'ar' ? 'أصولي' : 'My Assets'}
              </span>
            </button>
          </div>
        </div>

        {/* Species Tabs */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex gap-2">
            {species.map((sp) => (
              <button
                key={sp.value}
                onClick={() => setSelectedSpecies(sp.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSpecies === sp.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="block text-lg">{sp.emoji}</span>
                <span className="block text-xs mt-1">{sp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animals List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-slate-400">{t("loading")}</div>
          )}
          
          {error && (
            <div className="p-4 text-sm text-red-400">{error}</div>
          )}
          
          {!loading && !error && filteredAnimals.length === 0 && (
            <div className="p-4 space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-1">
                      {i18n.language === 'ar' ? 'لا توجد أجهزة مسجلة لهذا النوع' : 'No devices registered for this species'}
                    </p>
                    <p className="text-blue-300 text-xs">
                      {i18n.language === 'ar' 
                        ? 'جرّب النوع الآخر أو تواصل مع المدير لتسجيل أجهزة جديدة'
                        : 'Try another species or contact admin to register new devices'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Interactive Demo Preview */}
              {allAnimals.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-300 text-sm text-center">
                    {i18n.language === 'ar' 
                      ? '💡 لديك أجهزة مسجلة من أنواع أخرى - اختر النوع من الأعلى'
                      : '💡 You have devices registered for other species - select type above'
                    }
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
                className={`p-4 border-b border-slate-800 cursor-pointer transition-colors ${
                  selectedAnimal?.id === animal.id
                    ? "bg-slate-800"
                    : "hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-100">
                      {t(animal.name) || animal.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{animal.device_imei}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${colors}`}>
                    {t(status)}
                  </span>
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
            <div className="max-w-2xl w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3">
                {i18n.language === 'ar' ? 'نظام العرض التوضيحي التفاعلي' : 'Interactive Demo System'}
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {i18n.language === 'ar' 
                  ? 'لا توجد أجهزة مسجلة حالياً. شاهد عرضاً توضيحياً تفاعلياً لإمكانيات النظام مع بيانات محاكاة لـ "خزامة" (ناقة) مع مؤشرات صحية وتتبع حركة فوري.'
                  : 'No devices registered yet. Watch an interactive demo of the system capabilities with simulated data for "Khozama" (Camel) including health metrics and real-time movement tracking.'
                }
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">📍</div>
                  <div className="text-sm text-slate-400">{i18n.language === 'ar' ? 'تتبع GPS' : 'GPS Tracking'}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">❤️</div>
                  <div className="text-sm text-slate-400">{i18n.language === 'ar' ? 'المؤشرات الحيوية' : 'Vital Signs'}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔔</div>
                  <div className="text-sm text-slate-400">{i18n.language === 'ar' ? 'تنبيهات فورية' : 'Instant Alerts'}</div>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                {i18n.language === 'ar' 
                  ? 'تواصل مع فريق الدعم لطلب الأجهزة وتفعيل حسابك'
                  : 'Contact support team to order devices and activate your account'
                }
              </p>
            </div>
          </div>
        ) : !selectedAnimal ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            {t("selectAnimal")}
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="p-6 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">
                    {t(selectedAnimal.name) || selectedAnimal.name}
                  </h1>
                {healthData && healthData.status === "excellent" && (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-medium rounded-full">
                    ✓ {t('excellent')}
                  </span>
                )}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                  <div className="text-xs text-blue-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>🔋</span>
                      <span>{t('battery')}: 5 {i18n.language === 'ar' ? 'سنوات' : 'Years'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📡</span>
                      <span>{t('network')}: Sigfox 0G</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>{t('status')}: {i18n.language === 'ar' ? 'نشط' : 'Active'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {species.find(s => s.value === selectedAnimal.species)?.label} • {selectedAnimal.device_imei}
                {healthData && healthData.heart_rate && (
                  <span className="ml-2">
                    • ❤️ {healthData.heart_rate} bpm
                  </span>
                )}
              </p>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Map */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">
                    {t("location")}
                  </h2>
                  {latestTelemetry && MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("placeholder") && (
                    <button
                      onClick={() => setSatelliteView(!satelliteView)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg transition-all flex items-center gap-2"
                    >
                      {satelliteView ? '🗺️' : '🛰️'}
                      <span>{i18n.language === 'ar' ? (satelliteView ? 'خريطة عادية' : 'الأقمار الصناعية') : (satelliteView ? 'Map View' : 'Satellite View')}</span>
                    </button>
                  )}
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  {!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("placeholder") ? (
                    <div className="h-96 flex items-center justify-center bg-slate-950 text-slate-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🗺️</div>
                        <p>Mapbox token not configured</p>
                      </div>
                    </div>
                  ) : !latestTelemetry ? (
                    <div className="h-96 flex items-center justify-center bg-slate-950 text-slate-500">
                      No location data available
                    </div>
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
                {/* Battery */}
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    {t("battery")}
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {latestTelemetry?.battery != null ? `${latestTelemetry.battery}%` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {t("batteryInfo")}
                  </div>
                </div>

                {/* Activity */}
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    {t("activity")}
                  </div>
                  <div className="text-sm text-slate-100">
                    {latestTelemetry?.status ? (t(latestTelemetry.status) || latestTelemetry.status) : t("noRecentActivity")}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {t("statusInfo")}
                  </div>
                </div>

                {/* Connectivity */}
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    {t("connectivityStatus")}
                  </div>
                  {(() => {
                    const status = getConnectivityStatus(selectedAnimal.last_seen_at);
                    const colors = getConnectivityColors(status);
                    return (
                      <div className={`inline-block px-2 py-1 text-sm rounded ${colors}`}>
                        {t(status)}
                      </div>
                    );
                  })()}
                  <div className="mt-1 text-[11px] text-slate-500">
                    Last seen status
                  </div>
                </div>
              </section>

              {/* Movements Table */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">
                    {t("lastMovements")}
                  </h2>
                  <button
                    onClick={() => {
                      // Export telemetry data as CSV
                      const csvContent = [
                        ['Timestamp', 'Latitude', 'Longitude', 'Battery', 'Status'],
                        ...telemetryRecords.map(t => [
                          new Date(t.timestamp).toISOString(),
                          t.lat,
                          t.lng,
                          t.battery,
                          t.status
                        ])
                      ].map(row => row.join(',')).join('\n');
                      
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedAnimal.name}_telemetry_${new Date().toISOString()}.csv`;
                      a.click();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    {i18n.language === 'ar' ? '📥 تصدير التقرير' : '📥 Export Report'}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400">
                          {t("time")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400">
                          {t("location")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400">
                          {t("battery")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-slate-400">
                          {t("status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetryRecords.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                            {t("noTelemetryFrames")}
                          </td>
                        </tr>
                      ) : (
                        telemetryRecords.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="border-t border-slate-800">
                            <td className="px-4 py-2 text-slate-300 text-sm">
                              {new Date(item.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-sm font-mono">
                              {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                            </td>
                            <td className="px-4 py-2 text-slate-100">
                              {item.battery != null ? `${item.battery}%` : "—"}
                            </td>
                            <td className="px-4 py-2 text-slate-200">
                              {item.status ? (t(item.status) || item.status) : "—"}
                            </td>
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
