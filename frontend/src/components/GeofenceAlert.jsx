import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, MapPin, X } from "lucide-react";

/**
 * Geofence alert component - checks if animal is outside safe zone
 * and displays a prominent visual notification.
 */
export default function GeofenceAlert({ animal, latestTelemetry, geofence }) {
  const { t, i18n } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [isOutside, setIsOutside] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!latestTelemetry || !geofence) {
      setIsOutside(false);
      return;
    }

    const d = haversineDistance(
      geofence.center_lat, geofence.center_lng,
      latestTelemetry.lat, latestTelemetry.lng
    );
    setDistance(d);
    setIsOutside(d > geofence.radius_km);
    setDismissed(false);
  }, [latestTelemetry, geofence]);

  if (!isOutside || dismissed || !geofence) return null;

  const isAr = i18n.language === 'ar';

  return (
    <div className="animate-pulse-slow rounded-xl p-4 mb-4 border-2"
      style={{
        background: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
        borderColor: '#dc2626',
        boxShadow: '0 0 20px rgba(220, 38, 38, 0.15)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-glow"
            style={{ background: '#dc2626', color: 'white' }}
          >
            <AlertTriangle size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-sm inline-flex items-center gap-1.5">
              <AlertTriangle size={14} strokeWidth={2.4} />
              {isAr ? 'تنبيه: خروج من المنطقة الآمنة!' : 'Geofence Alert: Outside Safe Zone!'}
            </h3>
            <p className="text-red-700 text-xs mt-1">
              {isAr
                ? `${animal?.name || ''} على بعد ${distance.toFixed(1)} كم من المنطقة الآمنة (الحد: ${geofence.radius_km} كم)`
                : `${animal?.name || ''} is ${distance.toFixed(1)} km from safe zone center (limit: ${geofence.radius_km} km)`
              }
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: '#dc2626', color: 'white' }}
              >
                <MapPin size={10} strokeWidth={2.4} />
                {latestTelemetry?.lat?.toFixed(4)}, {latestTelemetry?.lng?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-400 hover:text-red-600 p-1 flex-shrink-0 icon-pop"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Haversine formula - distance in km between two lat/lng points */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
