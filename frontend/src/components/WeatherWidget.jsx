import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function WeatherWidget({ lat, lng }) {
  const { i18n } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    // Simulate weather data (in production, use OpenWeather API)
    const simulateWeather = () => {
      // Riyadh area typical conditions
      const conditions = [
        { temp: 28, condition: "Sunny", condition_ar: "مشمس", icon: "☀️" },
        { temp: 32, condition: "Clear", condition_ar: "صافٍ", icon: "🌤️" },
        { temp: 25, condition: "Partly Cloudy", condition_ar: "غيوم متفرقة", icon: "⛅" }
      ];
      
      const randomWeather = conditions[Math.floor(Math.random() * conditions.length)];
      setWeather(randomWeather);
      setLoading(false);
    };

    simulateWeather();
  }, [lat, lng]);

  if (loading || !weather) {
    return null;
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{weather.icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-100">{weather.temp}°C</div>
          <div className="text-xs text-slate-400">
            {i18n.language === 'ar' ? weather.condition_ar : weather.condition}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500 mt-2">
        {i18n.language === 'ar' 
          ? `📍 الموقع: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
          : `📍 Location: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
        }
      </div>
    </div>
  );
}
