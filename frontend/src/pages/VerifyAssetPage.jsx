import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import logoImage from "../assets/logo-transparent.png";

// Public, anonymous-accessible verification page.
// Shows only safe identification fields via the get_public_asset_verify RPC.
export default function VerifyAssetPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    supabase
      .rpc("get_public_asset_verify", { _asset_id: id })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setData(Array.isArray(data) ? data[0] : data);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-start justify-center px-4 py-10"
      style={{
        background: "linear-gradient(180deg,#F5F5DC 0%,#f3ecd8 100%)",
        fontFamily: "Cairo, Tajawal, sans-serif",
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-xl overflow-hidden bg-white"
        style={{ border: "1px solid rgba(197,165,90,0.4)" }}
      >
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg,#006c35,#003f1f)",
            borderBottom: "3px solid #c5a55a",
            color: "#fff",
          }}
        >
          <img src={logoImage} alt="Right" className="h-10 w-auto" style={{ objectFit: "contain" }} />
          <div>
            <div className="text-[11px] tracking-widest" style={{ color: "#f4e4bc" }}>
              التحقق من الجواز الرقمي
            </div>
            <div className="text-lg font-extrabold">Right IoT — Asset Verification</div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-10 text-sm text-slate-500">…جارٍ التحقق</div>
          ) : error || !data ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">❌</div>
              <div className="font-bold text-slate-800 mb-1">تعذّر التحقق</div>
              <div className="text-xs text-slate-500">
                لا يوجد أصل نشط بهذا المعرّف، أو أن الرابط غير صالح.
              </div>
            </div>
          ) : (
            <>
              <div
                className="rounded-xl p-4 mb-5 text-center"
                style={{ background: "rgba(0,108,53,0.08)", border: "1px solid rgba(0,108,53,0.25)" }}
              >
                <div className="text-2xl mb-1"></div>
                <div className="text-sm font-bold" style={{ color: "#006c35" }}>
                  وثيقة موثّقة من Right IoT
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  تم التحقق من البيانات الأساسية لهذا الأصل
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="اسم الأصل" value={data.name} />
                <Field label="النوع" value={data.species} />
                <Field label="رقم التسجيل" value={data.registration_no} />
                <Field label="رقم الجواز" value={data.passport_no} />
                <Field label="السلالة" value={data.bloodline} />
                <Field label="الشريحة" value={data.microchip_id} mono />
                <Field label="جهة الإصدار" value={data.issuing_authority} />
                <Field
                  label="تاريخ الميلاد"
                  value={data.birth_date ? new Date(data.birth_date).toLocaleDateString("ar-SA") : "—"}
                />
                <Field
                  label="تاريخ التسجيل"
                  value={data.registered_at ? new Date(data.registered_at).toLocaleDateString("ar-SA") : "—"}
                />
                <Field
                  label="انتهاء الجواز"
                  value={data.expires_at ? new Date(data.expires_at).toLocaleDateString("ar-SA") : "—"}
                />
              </div>

              <div className="mt-6 text-[11px] text-slate-500 text-center leading-relaxed">
                المعرّف العام: <span className="font-mono">{data.id}</span>
                <br />
                للمزيد عن النظام: <Link to="/" className="text-[#006c35] font-bold">rightiotsa.com</Link>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 text-center text-[10px] text-slate-500" style={{ borderTop: "1px solid #eee" }}>
          © {new Date().getFullYear()} Right IoT — جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "#faf7f0", border: "1px solid #eee" }}>
      <div className="text-[10px] text-slate-500 font-semibold mb-1">{label}</div>
      <div className={`text-sm font-bold text-slate-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}
