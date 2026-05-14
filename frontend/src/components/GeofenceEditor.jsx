import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Compact controls for editing a geofence: radius slider + click-to-set hint.
 * The actual map click handling lives in UnifiedDashboard so it can mutate
 * the same geofence state used by the map effect.
 */
export default function GeofenceEditor({
  radiusKm,
  onRadiusChange,
  editing,
  onToggleEdit,
  centerLat,
  centerLng,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div
      className="rounded-xl p-3 sm:p-4 mb-3"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🛡️</span>
          <h3
            className="text-xs sm:text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isAr ? "محرر المنطقة الآمنة" : "Safe Zone Editor"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onToggleEdit}
          className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all"
          style={
            editing
              ? {
                  background: "var(--color-desert-gold)",
                  color: "var(--color-royal-green-dark)",
                  boxShadow: "0 2px 6px rgba(197,165,90,0.4)",
                }
              : {
                  background: "var(--color-royal-green)",
                  color: "white",
                }
          }
        >
          {editing
            ? isAr
              ? "✓ إنهاء التحرير"
              : "✓ Done editing"
            : isAr
            ? "✏️ تحرير المنطقة"
            : "✏️ Edit zone"}
        </button>
      </div>

      {editing && (
        <div
          className="text-[10px] sm:text-[11px] mb-2 p-2 rounded-lg"
          style={{
            background: "rgba(197,165,90,0.12)",
            color: "var(--color-desert-gold-dark)",
            border: "1px dashed var(--color-desert-gold)",
          }}
        >
          {isAr
            ? "👆 انقر على الخريطة لتحديد مركز جديد للمنطقة الآمنة"
            : "👆 Tap on the map to set a new safe-zone center"}
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <label
          className="text-[11px] sm:text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {isAr ? "نصف القطر" : "Radius"}
        </label>
        <span
          className="text-xs sm:text-sm font-bold"
          style={{ color: "var(--color-royal-green)" }}
        >
          {radiusKm.toFixed(1)} {isAr ? "كم" : "km"}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="20"
        step="0.5"
        value={radiusKm}
        onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-700"
        style={{ accentColor: "var(--color-royal-green)" }}
      />
      <div
        className="flex justify-between text-[10px] mt-0.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>1 {isAr ? "كم" : "km"}</span>
        <span>20 {isAr ? "كم" : "km"}</span>
      </div>

      {centerLat != null && centerLng != null && (
        <div
          className="mt-2 text-[10px] font-mono"
          style={{ color: "var(--color-text-muted)" }}
        >
          {centerLat.toFixed(5)}, {centerLng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
