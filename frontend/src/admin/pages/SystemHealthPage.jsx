import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Activity, Cpu, AlertTriangle, Bell, CreditCard, Users } from "lucide-react";

// Real-time admin dashboard tile group: device status, daily notifications,
// recent critical errors, payment-gateway readiness, active users.
export default function SystemHealthPanel() {
  const [stats, setStats] = useState({
    devicesOnline: 0,
    devicesOffline: 0,
    devicesTotal: 0,
    activeUsers24h: 0,
    notificationsToday: 0,
    criticalErrorsHour: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const [devTotal, devOnline, devOffline, activeUsers, notifs, errs, sysErrs, payments] = await Promise.all([
      supabase.from("sensor_devices").select("id", { count: "exact", head: true }),
      supabase.from("sensor_devices").select("id", { count: "exact", head: true }).eq("status", "online"),
      supabase.from("sensor_devices").select("id", { count: "exact", head: true }).eq("status", "offline"),
      supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("last_seen_at", dayAgo),
      supabase.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
      supabase.from("edge_function_errors").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
      supabase.from("error_log").select("id", { count: "exact", head: true }).eq("resolved", false).gte("created_at", hourAgo),
      supabase.from("payments_log").select("id", { count: "exact", head: true }).gte("paid_at", startOfDay.toISOString()),
    ]);

    setStats({
      devicesTotal: devTotal.count ?? 0,
      devicesOnline: devOnline.count ?? 0,
      devicesOffline: devOffline.count ?? 0,
      activeUsers24h: activeUsers.count ?? 0,
      notificationsToday: notifs.count ?? 0,
      criticalErrorsHour: (errs.count ?? 0) + (sysErrs.count ?? 0),
      paymentsToday: payments.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Poll every 30s + realtime on sensor_devices
    const interval = setInterval(refresh, 30000);
    const ch = supabase
      .channel("admin-system-health")
      .on("postgres_changes", { event: "*", schema: "public", table: "sensor_devices" }, refresh)
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, []);

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
      sub: "دفعات اليوم — Edfapay/ClickPay",
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
        {loading ? (
          <span className="text-xs text-slate-400">…تحميل</span>
        ) : (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            متصل
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
