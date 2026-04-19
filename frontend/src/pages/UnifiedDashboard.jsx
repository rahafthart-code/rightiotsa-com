import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import * as api from "../api";
import { getConnectivityStatus, getConnectivityColors } from "../utils/connectivity";
import { timeAgo } from "../utils/timeAgo";
import SensorCard from "../components/SensorCard";
import GeofenceAlert from "../components/GeofenceAlert";
import GeofenceEditor from "../components/GeofenceEditor";
import NotificationCenter from "../components/NotificationCenter";
import InstallPrompt from "../components/InstallPrompt";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [selectedSpecies, setSelectedSpecies] = useState("Camel");
  const [allAnimals, setAllAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [telemetryRecords, setTelemetryRecords] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [satelliteView, setSatelliteView] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Phase-1 interactive state
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [editingGeofence, setEditingGeofence] = useState(false);
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(5);
  const [geofenceCenter, setGeofenceCenter] = useState(null); // {lat,lng}
  const lastAlertedRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geofenceSourceRef = useRef(null);

  const species = [
    { value: "Camel", label: t("camels"), emoji: "🐪" },
    { value: "Horse", label: t("horses"), emoji: "🐴" },
    { value: "Falcon", label: t("falcons"), emoji: "🦅" },
  ];

  // Active geofence: user-edited center wins, else falls back to current position
  const demoGeofence = selectedAnimal && (geofenceCenter || latestTelemetry) ? {
    center_lat: geofenceCenter?.lat ?? latestTelemetry.lat,
    center_lng: geofenceCenter?.lng ?? latestTelemetry.lng,
    radius_km: geofenceRadiusKm,
    is_active: true,
  } : null;

  // Fetch all animals
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const data = await api.listMyAnimals();
        setAllAnimals(data);
        setError(null);
      } catch (err) {
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

  // Filter by species
  useEffect(() => {
    const filtered = allAnimals.filter(a => a.species === selectedSpecies);
    setFilteredAnimals(filtered);
    setSelectedAnimal(filtered.length > 0 ? filtered[0] : null);
  }, [selectedSpecies, allAnimals]);

  // Reset geofence when animal changes (use device location as default)
  useEffect(() => {
    setGeofenceCenter(null);
    setGeofenceRadiusKm(5);
    setEditingGeofence(false);
    lastAlertedRef.current = null;
  }, [selectedAnimal?.id]);

  // Search-filtered list (by name or IMEI)
  const visibleAnimals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredAnimals;
    return filteredAnimals.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.device_imei || "").toLowerCase().includes(q),
    );
  }, [filteredAnimals, searchQuery]);

  // Detect geofence breach and push alert
  useEffect(() => {
    if (!selectedAnimal || !latestTelemetry || !demoGeofence) return;
    const d = haversineKm(
      demoGeofence.center_lat,
      demoGeofence.center_lng,
      latestTelemetry.lat,
      latestTelemetry.lng,
    );
    if (d > demoGeofence.radius_km) {
      const key = `${selectedAnimal.id}:${latestTelemetry.timestamp}`;
      if (lastAlertedRef.current !== key) {
        lastAlertedRef.current = key;
        setAlerts((prev) => [
          {
            id: `${Date.now()}-${selectedAnimal.id}`,
            animalId: selectedAnimal.id,
            animalName: t(selectedAnimal.name) || selectedAnimal.name,
            timestamp: latestTelemetry.timestamp || new Date().toISOString(),
            distanceKm: d,
            active: true,
          },
          ...prev,
        ].slice(0, 50));
      }
    }
  }, [selectedAnimal, latestTelemetry, demoGeofence, t]);

  // Fetch telemetry + health
  useEffect(() => {
    if (!selectedAnimal) {
      setTelemetryRecords([]);
      setLatestTelemetry(null);
      setHealthData(null);
      return;
    }
    const fetch = async () => {
      try {
        const data = await api.getTelemetryByIMEI(selectedAnimal.device_imei);
        setTelemetryRecords(data);
        setLatestTelemetry(data.length > 0 ? data[0] : null);
      } catch (err) { console.error(err); }
      try {
        const data = await api.getLatestHealth(selectedAnimal.device_imei);
        setHealthData(data);
      } catch (err) { console.error(err); }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [selectedAnimal]);

  // Build a circle polygon (lat/lng) around a center
  const buildCircle = (lat, lng, km, points = 64) => {
    const coords = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dy = km * Math.sin(angle);
      const dx = km * Math.cos(angle);
      const cLat = lat + dy / 111.32;
      const cLng = lng + dx / (111.32 * Math.cos((lat * Math.PI) / 180));
      coords.push([cLng, cLat]);
    }
    return coords;
  };

  // Map — created once per (animal, satelliteView, language)
  useEffect(() => {
    if (!latestTelemetry || !MAPBOX_TOKEN || !mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (typeof mapboxgl.setRTLTextPlugin === 'function') {
        try {
          if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
            mapboxgl.setRTLTextPlugin(
              'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
              (e) => { if (e) console.error('RTL plugin:', e); },
              true
            );
          }
        } catch (e) { /* ignore */ }
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        geofenceSourceRef.current = null;
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: satelliteView ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12",
        center: [latestTelemetry.lng, latestTelemetry.lat],
        zoom: 12,
      });

      map.on('load', () => {
        const nameField = isAr ? 'name_ar' : 'name_en';
        map.getStyle().layers.forEach(layer => {
          if (layer.id.includes('label') && layer.layout?.['text-field']) {
            try { map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', nameField], ['get', 'name']]); } catch (e) {}
          }
        });

        // Initial geofence
        const cLat = geofenceCenter?.lat ?? latestTelemetry.lat;
        const cLng = geofenceCenter?.lng ?? latestTelemetry.lng;
        const ring = buildCircle(cLat, cLng, geofenceRadiusKm);
        map.addSource('geofence', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } }
        });
        map.addLayer({
          id: 'geofence-fill', type: 'fill', source: 'geofence',
          paint: { 'fill-color': '#006c35', 'fill-opacity': 0.1 }
        });
        map.addLayer({
          id: 'geofence-line', type: 'line', source: 'geofence',
          paint: { 'line-color': '#006c35', 'line-width': 2, 'line-dasharray': [3, 2] }
        });
        geofenceSourceRef.current = map.getSource('geofence');
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      const marker = new mapboxgl.Marker({ color: "#006c35" })
        .setLngLat([latestTelemetry.lng, latestTelemetry.lat])
        .addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    } catch (err) {
      console.error("Map error:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        geofenceSourceRef.current = null;
      }
    };
  }, [selectedAnimal?.id, satelliteView, isAr, MAPBOX_TOKEN ? !!latestTelemetry : false]);

  // Sync animal marker position when telemetry updates (without rebuilding map)
  useEffect(() => {
    if (mapRef.current && markerRef.current && latestTelemetry) {
      markerRef.current.setLngLat([latestTelemetry.lng, latestTelemetry.lat]);
    }
  }, [latestTelemetry?.lat, latestTelemetry?.lng]);

  // Sync geofence circle when center or radius changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !demoGeofence) return;
    const apply = () => {
      const src = map.getSource('geofence');
      if (!src) return;
      const ring = buildCircle(demoGeofence.center_lat, demoGeofence.center_lng, demoGeofence.radius_km);
      src.setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } });
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [demoGeofence?.center_lat, demoGeofence?.center_lng, demoGeofence?.radius_km]);

  // Click-to-set center while editing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e) => {
      if (!editingGeofence) return;
      setGeofenceCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };
    map.on('click', handler);
    map.getCanvas().style.cursor = editingGeofence ? 'crosshair' : '';
    return () => {
      try { map.off('click', handler); } catch (e) {}
      try { map.getCanvas().style.cursor = ''; } catch (e) {}
    };
  }, [editingGeofence, mapRef.current]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };
  const handleProfile = () => navigate('/profile');
  const currentSpecies = species.find(s => s.value === selectedSpecies);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentHistory = telemetryRecords.filter(r => new Date(r.timestamp) >= twentyFourHoursAgo);

  return (
    <div className="flex h-full relative" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ background: 'var(--color-royal-green)' }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        fixed md:static inset-y-0 right-0 md:right-auto z-20
        w-72 flex flex-col border-l md:border-l-0 md:border-r
        transition-transform duration-300 ease-in-out
      `} style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        {/* Sidebar Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, rgba(0,108,53,0.06), rgba(197,165,90,0.06))' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-royal-green)' }}>
              ✓ {isAr ? 'اشتراك نشط' : 'Active Subscription'}
            </span>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                title={isAr ? 'مركز التنبيهات' : 'Notification center'}
              >
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {alerts.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-alert-pulse"
                    style={{ background: 'var(--color-danger)' }}
                  >
                    {alerts.length > 9 ? '9+' : alerts.length}
                  </span>
                )}
              </button>
              <button onClick={handleProfile} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title={isAr ? 'الملف الشخصي' : 'Profile'}>
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title={isAr ? 'تسجيل الخروج' : 'Logout'}>
                <svg className="w-4 h-4 text-red-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Species Tabs */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'نوع الأصول' : 'Asset Type'}
          </div>
          <div className="flex gap-2">
            {species.map((sp) => (
              <button
                key={sp.value}
                onClick={() => { setSelectedSpecies(sp.value); setSidebarOpen(false); }}
                className="flex-1 px-2 py-2 rounded-xl text-center transition-all"
                style={selectedSpecies === sp.value
                  ? { background: 'var(--color-royal-green)', color: 'white', boxShadow: '0 2px 8px rgba(0,108,53,0.3)' }
                  : { background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                }
              >
                <span className="block text-lg">{sp.emoji}</span>
                <span className="block text-[10px] mt-0.5 font-medium">{sp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animals List */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>{t("loading")}</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}

          {!loading && !error && filteredAnimals.length === 0 && (
            <div className="p-4">
              <div className="rounded-xl p-4" style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(0,108,53,0.2)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-royal-green)' }}>
                  {isAr ? 'لا توجد أجهزة مسجلة لهذا النوع' : 'No devices for this species'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {isAr ? 'جرّب النوع الآخر أو تواصل مع المدير' : 'Try another species or contact admin'}
                </p>
              </div>
            </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو IMEI…' : 'Search by name or IMEI…'}
              className="w-full px-3 py-2 ps-9 text-xs rounded-lg outline-none transition-all"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              aria-label={isAr ? 'بحث عن أصل' : 'Search assets'}
            />
            <svg
              className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                color: 'var(--color-text-muted)',
                [isAr ? 'right' : 'left']: '0.625rem',
              }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 text-xs"
                style={{
                  color: 'var(--color-text-muted)',
                  [isAr ? 'left' : 'right']: '0.5rem',
                }}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                ✕
              </button>
            )}
          </div>
            const status = getConnectivityStatus(animal.last_seen_at);
            const isSelected = selectedAnimal?.id === animal.id;

            return (
              <div
                key={animal.id}
                onClick={() => { setSelectedAnimal(animal); setSidebarOpen(false); }}
                className="p-4 cursor-pointer transition-all border-b"
                style={{
                  borderColor: 'var(--color-border)',
                  background: isSelected ? 'rgba(0,108,53,0.06)' : 'transparent',
                  borderRight: isSelected ? '3px solid var(--color-royal-green)' : '3px solid transparent',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{t(animal.name) || animal.name}</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{animal.device_imei}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                    style={status === 'online'
                      ? { background: 'rgba(0,108,53,0.1)', color: 'var(--color-royal-green)', border: '1px solid rgba(0,108,53,0.3)' }
                      : { background: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid rgba(217,119,6,0.3)' }
                    }
                  >
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
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-lg w-full rounded-2xl p-6 sm:p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6" style={{ background: 'linear-gradient(135deg, rgba(0,108,53,0.1), rgba(197,165,90,0.1))' }}>
                <span className="text-3xl sm:text-4xl">🐪</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'نظام التتبع الذكي' : 'Smart Tracking System'}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {isAr ? 'لا توجد أجهزة مسجلة. سجّل جهازك الأول لبدء التتبع.' : 'No devices registered. Register your first device to start tracking.'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "📍", label: isAr ? 'تتبع GPS' : 'GPS Tracking' },
                  { icon: "🌡️", label: isAr ? 'مراقبة حرارية' : 'Temperature' },
                  { icon: "🔔", label: isAr ? 'تنبيهات سياج' : 'Geofence Alerts' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !selectedAnimal ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>{t("selectAnimal")}</div>
        ) : (
          <>
            {/* Animal Header */}
            <header className="p-4 sm:p-5 border-b" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,108,53,0.1), rgba(197,165,90,0.1))' }}>
                    {currentSpecies?.emoji}
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {t(selectedAnimal.name) || selectedAnimal.name}
                    </h1>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {currentSpecies?.label} • {selectedAnimal.device_imei}
                    </p>
                  </div>
                  {healthData?.status === "excellent" && (
                    <span className="hidden sm:inline-flex px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'rgba(0,108,53,0.1)', color: 'var(--color-royal-green)', border: '1px solid rgba(0,108,53,0.25)' }}>
                      ✓ {t('excellent')}
                    </span>
                  )}
                </div>
                <div className="rounded-xl px-3 sm:px-4 py-2" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  <div className="text-[10px] sm:text-[11px] space-y-0.5" style={{ color: 'var(--color-desert-gold-dark)' }}>
                    <div>🔋 {t('battery')}: 5 {isAr ? 'سنوات' : 'Years'}</div>
                    <div>📡 {t('network')}: Sigfox 0G</div>
                  </div>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" style={{ background: 'var(--color-bg-primary)' }}>
              <GeofenceAlert animal={selectedAnimal} latestTelemetry={latestTelemetry} geofence={demoGeofence} />

              {/* Sensor Cards Row */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <SensorCard
                  icon="🌡️"
                  label={isAr ? 'درجة الحرارة' : 'Temperature'}
                  value={healthData?.temperature ?? latestTelemetry?.temperature ?? '34.0'}
                  unit="°C"
                  subtitle={isAr ? 'درجة حرارة الجسم' : 'Body temperature'}
                  color="var(--color-royal-green)"
                />
                <SensorCard
                  icon="🏃"
                  label={isAr ? 'مستوى النشاط' : 'Activity Level'}
                  value={latestTelemetry?.status ? (t(latestTelemetry.status) || latestTelemetry.status) : (isAr ? 'طبيعي' : 'Normal')}
                  subtitle={isAr ? 'آخر تحديث من الجهاز' : 'Last device update'}
                  color="var(--color-desert-gold-dark)"
                />
                <SensorCard
                  icon="🔋"
                  label={isAr ? 'البطارية' : 'Battery'}
                  value={latestTelemetry?.battery ?? '—'}
                  unit={latestTelemetry?.battery != null ? '%' : ''}
                  subtitle={isAr ? 'مستوى شحن الجهاز' : 'Device charge level'}
                  color={latestTelemetry?.battery > 20 ? 'var(--color-royal-green)' : 'var(--color-danger)'}
                />
                <SensorCard
                  icon="📡"
                  label={isAr ? 'حالة الاتصال' : 'Connectivity'}
                  value={t(getConnectivityStatus(selectedAnimal.last_seen_at))}
                  subtitle={latestTelemetry ? new Date(latestTelemetry.timestamp).toLocaleTimeString() : '—'}
                  color="var(--color-royal-green)"
                />
              </section>

              {/* Map Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    📍 {isAr ? 'التتبع المباشر' : 'Live Tracking'}
                  </h2>
                  {latestTelemetry && MAPBOX_TOKEN && (
                    <button
                      onClick={() => setSatelliteView(!satelliteView)}
                      className="px-3 py-1.5 text-xs rounded-lg transition-all font-medium"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      {satelliteView ? '🗺️' : '🛰️'} {isAr ? (satelliteView ? 'خريطة' : 'أقمار') : (satelliteView ? 'Map' : 'Satellite')}
                    </button>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  {!MAPBOX_TOKEN ? (
                    <div className="h-60 sm:h-80 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="text-center"><div className="text-4xl mb-2">🗺️</div><p className="text-sm">Mapbox token not configured</p></div>
                    </div>
                  ) : !latestTelemetry ? (
                    <div className="h-60 sm:h-80 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                      <p className="text-sm">{isAr ? 'لا توجد بيانات موقع' : 'No location data'}</p>
                    </div>
                  ) : (
                    <div ref={mapContainerRef} className="h-60 sm:h-80 w-full" />
                  )}
                </div>
                {latestTelemetry && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <span>📍 {latestTelemetry.lat.toFixed(5)}, {latestTelemetry.lng.toFixed(5)}</span>
                    <span>🕐 {new Date(latestTelemetry.timestamp).toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--color-royal-green)' }} />
                      {isAr ? 'منطقة آمنة (5 كم)' : 'Safe zone (5 km)'}
                    </span>
                  </div>
                )}
              </section>

              {/* Movement History */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    📋 {isAr ? 'سجل الحركة (24 ساعة)' : 'Movement History (24h)'}
                  </h2>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['Timestamp', 'Latitude', 'Longitude', 'Battery', 'Status'],
                        ...telemetryRecords.map(r => [new Date(r.timestamp).toISOString(), r.lat, r.lng, r.battery, r.status])
                      ].map(row => row.join(',')).join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedAnimal.name}_history_${new Date().toISOString()}.csv`;
                      a.click();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-white"
                    style={{ background: 'var(--color-royal-green)' }}
                  >
                    📥 {isAr ? 'تصدير' : 'Export'}
                  </button>
                </div>
                <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr style={{ background: 'var(--color-bg-secondary)' }}>
                        <th className="px-3 sm:px-4 py-3 text-right text-[10px] sm:text-[11px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{t("time")}</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-[10px] sm:text-[11px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{t("location")}</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-[10px] sm:text-[11px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{t("battery")}</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-[10px] sm:text-[11px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentHistory.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>{t("noTelemetryFrames")}</td></tr>
                      ) : (
                        recentHistory.slice(0, 20).map((item, idx) => (
                          <tr key={idx} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <td className="px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs" style={{ color: 'var(--color-text-secondary)' }}>{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs" style={{ color: 'var(--color-text-primary)' }}>{item.battery != null ? `${item.battery}%` : "—"}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {item.alert_status === 'out_of_range'
                                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>⚠️ {isAr ? 'خارج النطاق' : 'Out of Range'}</span>
                                : (item.status ? (t(item.status) || item.status) : "—")
                              }
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
