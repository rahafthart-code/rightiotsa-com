import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";

export default function SimulationControl() {
  const { t, i18n } = useTranslation();
  const [isSimulating, setIsSimulating] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  const invokeSimulateMovement = async () => {
    const { data, error } = await supabase.functions.invoke("simulate-movement", {
      body: {},
    });
    if (error) throw error;
    return data;
  };

  const startSimulation = async () => {
    try {
      // Verify admin access + run the first tick immediately.
      await invokeSimulateMovement();

      setIsSimulating(true);
      setUpdateCount(0);

      // Update location every 10 seconds
      const id = setInterval(async () => {
        try {
          const result = await invokeSimulateMovement();
          setUpdateCount(prev => prev + 1);

          // Show notification
          if (Notification.permission === "granted" && result.animals) {
            result.animals.forEach(animal => {
              new Notification(`${animal.animal} ${i18n.language === 'ar' ? 'تتحرك' : 'moved'}`, {
                body: `${i18n.language === 'ar' ? 'موقع جديد:' : 'New location:'} ${animal.new_location.lat.toFixed(5)}, ${animal.new_location.lng.toFixed(5)}`,
                icon: '/favicon.ico'
              });
            });
          }
        } catch (err) {
          console.error("Simulation update error:", err);
        }
      }, 10000);

      setIntervalId(id);
    } catch (err) {
      console.error("Failed to start simulation:", err);
      alert(t("simulationError") || "Failed to start simulation");
    }
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsSimulating(false);
    setUpdateCount(0);
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        alert(i18n.language === 'ar' ? 'تم تفعيل الإشعارات!' : 'Notifications enabled!');
      }
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl">
      <h3 className="text-xl font-bold text-slate-100 mb-4">
        {i18n.language === 'ar' ? '🎮 وضع المحاكاة (عرض حي)' : '🎮 Simulation Mode (Live Demo)'}
      </h3>
      
      <p className="text-slate-300 text-sm mb-6">
        {i18n.language === 'ar' 
          ? 'يقوم بتحديث إحداثيات GPS تلقائياً كل 10 ثوانٍ لإظهار الحركة المباشرة على الخريطة'
          : 'Automatically updates GPS coordinates every 10 seconds to show live movement on the map'
        }
      </p>

      <div className="space-y-4">
        {!isSimulating ? (
          <button
            onClick={startSimulation}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/25 transition-all"
          >
            {i18n.language === 'ar' ? '▶️ تشغيل المحاكاة' : '▶️ Start Simulation'}
          </button>
        ) : (
          <>
            <button
              onClick={stopSimulation}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
            >
              {i18n.language === 'ar' ? '⏹️ إيقاف المحاكاة' : '⏹️ Stop Simulation'}
            </button>
            <div className="bg-slate-900/50 px-4 py-3 rounded-lg border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">
                  {i18n.language === 'ar' ? '🟢 المحاكاة نشطة' : '🟢 Simulation Active'}
                </span>
                <span className="text-slate-400 text-sm">
                  {updateCount} {i18n.language === 'ar' ? 'تحديث' : 'updates'}
                </span>
              </div>
            </div>
          </>
        )}

        {Notification.permission !== "granted" && (
          <button
            onClick={requestNotificationPermission}
            className="w-full px-4 py-2 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-blue-300 text-sm rounded-lg transition-all"
          >
            {i18n.language === 'ar' ? 'تفعيل إشعارات المتصفح' : 'Enable Browser Notifications'}
          </button>
        )}
      </div>

      {isSimulating && (
        <div className="mt-4 text-xs text-slate-500 text-center">
          {i18n.language === 'ar' 
            ? '💡 افتح لوحة التحكم لمشاهدة الحركة المباشرة على الخريطة'
            : '💡 Open the dashboard to see live movement on the map'
          }
        </div>
      )}
    </div>
  );
}
