import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sun, CloudSun, Cloud, MapPin } from "lucide-react";

const ICONS = { Sunny: Sun, Clear: CloudSun, "Partly Cloudy": Cloud };

export default function WeatherWidget({ lat, lng }) {
  const { i18n } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    const simulateWeather = () => {
      const conditions = [
        { temp: 28, condition: "Sunny", condition_ar: "مشمس" },
        { temp: 32, condition: "Clear", condition_ar: "صافٍ" },
        { temp: 25, condition: "Partly Cloudy", condition_ar: "غيوم متفرقة" },
      ];
      const randomWeather = conditions[Math.floor(Math.random() * conditions.length)];
      setWeather(randomWeather);
      setLoading(false);
    };

    simulateWeather();
  }, [lat, lng]);

  if (loading || !weather) return null;

  const Icon = ICONS[weather.condition] || Sun;

  return (
    <div
      className="rounded-xl p-3 hover-lift"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center animate-float"
          style={{
            background: "linear-gradient(135deg, rgba(197,165,90,0.2), rgba(0,108,53,0.1))",
            color: "var(--color-desert-gold-dark)",
          }}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {weather.temp}°C
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {i18n.language === "ar" ? weather.condition_ar : weather.condition}
          </div>
        </div>
      </div>
      <div
        className="text-[10px] mt-2 inline-flex items-center gap-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        <MapPin size={11} />
        {i18n.language === "ar"
          ? `الموقع: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
          : `Location: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`}
      </div>
    </div>
  );
}
