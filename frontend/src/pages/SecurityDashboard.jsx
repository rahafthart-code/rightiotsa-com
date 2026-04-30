// L7: Admin-only Security Dashboard.
// Reads the `security_dashboard` view (admin-only via underlying RLS).
// Cyber-Heritage style: dark hero with crimson accents on the creamy bg.

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const SEV_STYLES = {
  low:      { bg: "#E1F5EE", fg: "#085041", label: "منخفض" },
  medium:   { bg: "#FAEEDA", fg: "#633806", label: "متوسط" },
  high:     { bg: "#FCEBEB", fg: "#791F1F", label: "مرتفع" },
  critical: { bg: "#3D0E0E", fg: "#FCEBEB", label: "حرج" },
};

export default function SecurityDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("security_dashboard")
        .select("*")
        .limit(200);
      if (cancelled) return;
      if (error) setError(error.message);
      else setRows(data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "Cairo, Tajawal, sans-serif" }}>
      <div
        style={{
          background: "linear-gradient(135deg,#1A0A0A,#3D0E0E)",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid rgba(226,75,74,.3)",
        }}
      >
        <div style={{ fontSize: 10, color: "#F09595", letterSpacing: ".06em", marginBottom: 4 }}>
          نظام المراقبة الأمنية · 7 طبقات حماية
        </div>
        <div style={{ fontSize: 17, color: "#FCEBEB", marginBottom: 4 }}>
          لوحة الأمان — Security Dashboard
        </div>
        <div style={{ fontSize: 12, color: "#F09595" }}>
          أحدث الأحداث الأمنية خلال آخر 7 أيام
        </div>
      </div>

      {loading && <p style={{ color: "#666" }}>جارٍ التحميل…</p>}
      {error && (
        <div style={{ background: "#FCEBEB", color: "#791F1F", padding: 12, borderRadius: 8 }}>
          تعذر تحميل البيانات: {error}. تأكد من أنك مستخدم بصلاحية مدير.
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{ background: "#E1F5EE", color: "#085041", padding: 16, borderRadius: 8, borderRight: "2px solid #1D9E75" }}>
          ✅ لا توجد أحداث أمنية مسجلة في آخر 7 أيام.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #eee" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#FAF7F0" }}>
              <tr>
                <th style={th}>الساعة</th>
                <th style={th}>نوع الحدث</th>
                <th style={th}>الخطورة</th>
                <th style={th}>عدد الأحداث</th>
                <th style={th}>مستخدمون فريدون</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const sev = SEV_STYLES[r.severity] || SEV_STYLES.medium;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={td}>{new Date(r.hour).toLocaleString("ar-SA")}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{r.event_type}</td>
                    <td style={td}>
                      <span style={{ background: sev.bg, color: sev.fg, padding: "2px 9px", borderRadius: 10, fontSize: 11 }}>
                        {sev.label}
                      </span>
                    </td>
                    <td style={td}>{r.event_count}</td>
                    <td style={td}>{r.unique_users}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#444" };
const td = { padding: "10px 12px", color: "#222" };
