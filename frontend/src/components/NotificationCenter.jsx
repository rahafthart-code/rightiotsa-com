import React from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellRing, AlertTriangle, CheckCircle2, X, Trash2, Siren } from "lucide-react";

/**
 * Slide-out notification center listing recent geofence alerts.
 * Active (most recent, unresolved) alerts pulse in red.
 */
export default function NotificationCenter({ open, onClose, alerts, onClear }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Panel — slides from the inline-start side (right in RTL) */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-[88vw] sm:w-96 flex flex-col transition-transform duration-300 ease-out ${
          isAr ? "left-0" : "right-0"
        } ${
          open
            ? "translate-x-0"
            : isAr
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
        style={{
          background: "var(--color-bg-card)",
          borderInlineEnd: isAr ? "1px solid var(--color-border)" : undefined,
          borderInlineStart: !isAr ? "1px solid var(--color-border)" : undefined,
          boxShadow: "0 0 30px rgba(0,0,0,0.15)",
        }}
        aria-hidden={!open}
      >
        <header
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background:
              "linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))",
            borderBottom: "3px solid var(--color-desert-gold)",
          }}
        >
          <div className="flex items-center gap-2">
            <BellRing size={22} className="text-white animate-wiggle" />
            <div>
              <h2 className="text-sm font-bold text-white">
                {isAr ? "مركز التنبيهات" : "Notification Center"}
              </h2>
              <p
                className="text-[10px]"
                style={{ color: "var(--color-desert-gold-light)" }}
              >
                {isAr
                  ? `${alerts.length} تنبيه مسجَّل`
                  : `${alerts.length} alerts logged`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 icon-pop"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {alerts.length === 0 ? (
            <div
              className="text-center py-12 px-4 rounded-xl"
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-muted)",
              }}
            >
              <CheckCircle2 size={48} className="mx-auto mb-2" style={{ color: "var(--color-royal-green)" }} />
              <p className="text-sm font-medium">
                {isAr ? "لا توجد تنبيهات" : "No alerts"}
              </p>
              <p className="text-xs mt-1">
                {isAr
                  ? "جميع الأصول داخل مناطقها الآمنة"
                  : "All assets are inside their safe zones"}
              </p>
            </div>
          ) : (
            alerts.map((a, i) => {
              const isActive = a.active && i === 0;
              return (
                <div
                  key={a.id}
                  className={`rounded-xl p-3 border transition-all ${
                    isActive ? "animate-alert-pulse" : ""
                  }`}
                  style={
                    isActive
                      ? {
                          background: "var(--color-danger-bg)",
                          borderColor: "var(--color-danger)",
                        }
                      : {
                          background: "var(--color-bg-secondary)",
                          borderColor: "var(--color-border)",
                        }
                  }
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isActive
                          ? "var(--color-danger)"
                          : "var(--color-text-muted)",
                        color: "white",
                      }}
                    >
                      <AlertTriangle size={16} strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold"
                        style={{
                          color: isActive
                            ? "var(--color-danger)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {isAr
                          ? `الأصل ${a.animalName} غادر المنطقة الآمنة`
                          : `Asset ${a.animalName} left safe zone`}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {isAr ? "الوقت" : "Time"}:{" "}
                        {new Date(a.timestamp).toLocaleTimeString(
                          isAr ? "ar-SA" : "en-US",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        · {a.distanceKm.toFixed(1)} {isAr ? "كم" : "km"}
                      </p>
                      {isActive && (
                        <span
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white animate-glow"
                          style={{ background: "var(--color-danger)" }}
                        >
                          <Siren size={10} strokeWidth={2.5} />
                          {isAr ? "طارئ نشط" : "Active emergency"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {alerts.length > 0 && (
          <div
            className="p-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              onClick={onClear}
              className="w-full py-2 text-xs font-semibold rounded-lg transition-all hover-lift inline-flex items-center justify-center gap-2"
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Trash2 size={14} />
              {isAr ? "مسح كل التنبيهات" : "Clear all alerts"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
