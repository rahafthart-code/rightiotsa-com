import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import {
  fetchAnimals,
  fetchLatestTelemetry,
  fetchTelemetryHistory,
} from "../api";
import { getConnectivityStatus, getConnectivityColors } from "../utils/connectivity";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export default function DashboardLayout({ speciesFilter, title }) {
  const { t } = useTranslation();
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const animalsRes = await fetchAnimals();
        let list = animalsRes.data || [];
        
        // Filter by species if specified
        if (speciesFilter) {
          list = list.filter(a => a.species === speciesFilter);
        }
        
        setAnimals(list);
        if (list.length > 0) {
          setSelectedAnimalId(list[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.detail || t('failedToLoad'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [speciesFilter, t]);

  useEffect(() => {
    async function loadTelemetry() {
      if (!selectedAnimalId) return;
      try {
        const [latestRes, historyRes] = await Promise.all([
          fetchLatestTelemetry(selectedAnimalId),
          fetchTelemetryHistory(selectedAnimalId, 10),
        ]);
        setLatestTelemetry(latestRes.data);
        setHistory(historyRes.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || t('failedToLoad'));
      }
    }
    loadTelemetry();
  }, [selectedAnimalId, t]);

  useEffect(() => {
    if (!mapContainerRef.current || !latestTelemetry || !mapboxgl.accessToken) return;

    const { lat, lng } = latestTelemetry;

    try {
      if (!mapRef.current) {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/outdoors-v12",
          center: [lng, lat],
          zoom: 10,
        });
        mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      } else {
        mapRef.current.setCenter([lng, lat]);
      }

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }

      setMapError("");
    } catch (err) {
      console.error("Mapbox error", err);
      setMapError(t('setMapboxToken'));
    }

    return () => {};
  }, [latestTelemetry, t]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    },
    [],
  );

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) || null;
  const connectivityStatus = latestTelemetry ? getConnectivityStatus(latestTelemetry.timestamp) : 'removed';

  return (
    <div className="grid gap-6 md:grid-cols-[260px,1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            {title || t('yourAnimals')}
          </h2>
          {loading ? (
            <p className="text-xs text-slate-400">{t('loading')}</p>
          ) : animals.length === 0 ? (
            <p className="text-xs text-slate-400">
              {t('noAnimals')}
            </p>
          ) : (
            <ul className="space-y-1">
              {animals.map((animal) => {
                const animalStatus = animal.last_seen_at ? getConnectivityStatus(animal.last_seen_at) : 'removed';
                const statusColors = getConnectivityColors(animalStatus);
                
                return (
                  <li key={animal.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAnimalId(animal.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${
                        selectedAnimalId === animal.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-100"
                          : "bg-slate-900/70 border-slate-800 text-slate-200 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{animal.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {t(animal.species.toLowerCase())}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {t('imei')} {animal.device_imei}
                      </div>
                      <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-medium border ${statusColors}`}>
                        {t(animalStatus)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
          <div className="font-semibold text-slate-200 mb-1">
            {t('telemetryOverview')}
          </div>
          <p>
            {t('telemetryOverviewText')}
          </p>
        </div>
      </aside>

      <section className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)] items-stretch">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  {t('location')}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {t('mapView')}
                </p>
              </div>
              {!mapboxgl.accessToken && (
                <span className="text-[10px] text-amber-400">
                  {t('setMapboxToken')}
                </span>
              )}
            </div>
            <div className="h-[260px] md:h-[320px]">
              <div
                ref={mapContainerRef}
                className="h-full w-full"
              />
              {mapError && (
                <div className="px-4 py-2 text-[11px] text-amber-300 bg-slate-950/70 border-t border-slate-800">
                  {mapError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  {t('battery')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {latestTelemetry
                    ? new Date(latestTelemetry.timestamp).toLocaleTimeString()
                    : "—"}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-emerald-400">
                  {latestTelemetry?.battery ?? "—"}
                  {latestTelemetry?.battery != null && (
                    <span className="text-sm text-emerald-300 ml-0.5">%</span>
                  )}
                </div>
                <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{
                      width: `${
                        latestTelemetry?.battery != null
                          ? Math.min(Math.max(latestTelemetry.battery, 0), 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  {t('activity')}
                </span>
              </div>
              <div className="text-sm text-slate-100">
                {latestTelemetry?.status ? (t(latestTelemetry.status) || latestTelemetry.status) : t('noRecentActivity')}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {t('statusInfo')}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  {t('connectivityStatus')}
                </span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getConnectivityColors(connectivityStatus)}`}>
                {t(connectivityStatus)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                {t('lastMovements')}
              </h2>
              {selectedAnimal && (
                <p className="text-[11px] text-slate-400">
                  {selectedAnimal.name} · {t('imei')} {selectedAnimal.device_imei}
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">{t('time')}</th>
                  <th className="px-4 py-2 text-left font-medium">{t('lat')}</th>
                  <th className="px-4 py-2 text-left font-medium">{t('lng')}</th>
                  <th className="px-4 py-2 text-left font-medium">{t('battery')}</th>
                  <th className="px-4 py-2 text-left font-medium">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-slate-500"
                    >
                      {t('noTelemetryFrames')}
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="px-4 py-2 text-slate-200">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-slate-100">
                        {item.lat.toFixed(5)}
                      </td>
                      <td className="px-4 py-2 text-slate-100">
                        {item.lng.toFixed(5)}
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
        </div>
      </section>
    </div>
  );
}
