import React from "react";
import { Activity, Cpu, AlertTriangle, Bell, CreditCard, Users, BatteryLow, Radio } from "lucide-react";
import SimulationControl from "../../components/SimulationControl";
import { useSystemHealth } from "../hooks/useSystemHealth";

const REALTIME_LABEL = {
  connecting: { text: "جارِ الاتصال", color: "#94a3b8" },
  connected: { text: "متصل", color: "#22c55e" },
  closed: { text: "منقطع", color: "#94a3b8" },
  error: { text: "خطأ اتصال", color: "#ef4444" },
};

// Real-time admin dashboard tile group: device status/battery/response
// rate, daily notifications, recent critical errors, edge function health,
// payment-gateway readiness, active users.
export default function SystemHealthPanel() {
  const { stats, loading, realtimeStatus } = useSystemHealth();
  const rt = REALTIME_LABEL[realtimeStatus] ?? REALTIME_LABEL.connecting;

  const tiles = [
    {
      label: "أجهزة متصلة",
      value: stats.devicesOnline,
      sub: `من أصل ${stats.devicesTotal}`,
      color: "#22c55e",
      icon: Activity,
    },
    {
      label: "أجهزة غير متصلة",
      value: stats.devicesOffline,
      sub: stats.devicesOffline > 0 ? "تحتاج مراجعة" : "كل الأجهزة تعمل",
      color: stats.devicesOffline > 0 ? "#ef4444" : "#94a3b8",
      icon: Cpu,
    },
    {
      label: "بطارية منخفضة",
      value: stats.devicesLowBattery,
      sub: stats.devicesLowBattery > 0 ? "أقل من 20%" : "كل البطاريات جيدة",
      color: stats.devicesLowBattery > 0 ? "#f59e0b" : "#94a3b8",
      icon: BatteryLow,
    },
    {
      label: "معدل استجابة IoT",
      value: `${stats.responseRatePct}%`,
      sub: `${stats.devicesResponding} جهاز خلال 30 دقيقة`,
      color: stats.responseRatePct >= 80 ? "#22c55e" : stats.responseRatePct >= 50 ? "#f59e0b" : "#ef4444",
      icon: Radio,
    },
    {
      label: "مستخدمون نشطون (24س)",
      value: stats.activeUsers24h,
      sub: "آخر دخول مسجّل",
      color: "#0ea5e9",
      icon: Users,
    },
    {
      label: "إشعارات اليوم",
      value: stats.notificationsToday,
      sub: "تنبيهات النظام",
      color: "#a855f7",
      icon: Bell,
    },
    {
      label: "أخطاء حرجة (ساعة)",
      value: stats.criticalErrorsHour,
      sub: stats.criticalErrorsHour > 0 ? "ينبغي المراجعة فوراً" : "النظام مستقر",
      color: stats.criticalErrorsHour > 0 ? "#dc2626" : "#22c55e",
      icon: AlertTriangle,
    },
    {
      label: "بوابة الدفع",
      value: stats.paymentsToday ?? 0,
      sub: "دفعات ناجحة اليوم — Moyasar",
      color: "#c5a55a",
      icon: CreditCard,
    },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-white">حالة النظام</h1>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة حية للأجهزة، الإشعارات، الأخطاء وبوابة الدفع
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs flex items-center gap-1.5" style={{ color: rt.color }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: rt.color }} />
            Realtime: {rt.text}
          </span>
          {loading && <span className="text-xs text-slate-400">…تحديث</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-xl p-5"
              style={{
                background: "#1c2333",
                border: "1px solid #2a3346",
                borderInlineStart: `4px solid ${t.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-400 font-semibold">{t.label}</div>
                <Icon className="w-4 h-4" style={{ color: t.color }} />
              </div>
              <div className="text-3xl font-extrabold text-white">{t.value}</div>
              <div className="text-[11px] mt-1" style={{ color: t.color }}>{t.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl p-5" style={{ background: "#1c2333", border: "1px solid #2a3346" }}>
        <div className="text-sm font-bold text-white mb-3">حالة Edge Functions (آخر 24 ساعة)</div>
        {stats.edgeFunctionErrors.length === 0 ? (
          <div className="text-xs" style={{ color: "#22c55e" }}>لا توجد أخطاء مسجّلة — كل الدوال تعمل بسلاسة</div>
        ) : (
          <div className="space-y-2">
            {stats.edgeFunctionErrors.map((f) => (
              <div key={f.function_name} className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">{f.function_name}</span>
                <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.14)", color: "#ef4444" }}>
                  {f.count} خطأ
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <SimulationControl />
      </div>
    </div>
  );
}
