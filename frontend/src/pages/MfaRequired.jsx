// Shown by AuthGuard when a route requires AAL2 but the user is at AAL1.
// Provides a single CTA to enrol/verify a TOTP factor.

import React from "react";
import { useNavigate } from "react-router-dom";

export default function MfaRequired() {
  const navigate = useNavigate();
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Cairo, Tajawal, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: "#fff",
          border: "1px solid rgba(226,75,74,.3)",
          borderRadius: 12,
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}></div>
        <h1 style={{ fontSize: 18, color: "#791F1F", marginBottom: 8 }}>
          مطلوب تفعيل التحقق بخطوتين
        </h1>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 16 }}>
          هذه الصفحة تحتوي على بيانات حساسة وتتطلب تفعيل التحقق بخطوتين (MFA)
          من إعدادات الحساب قبل الوصول إليها.
        </p>
        <button
          onClick={() => navigate("/security/mfa-enroll")}
          style={{
            background: "#006c35",
            color: "#fff",
            border: 0,
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          تفعيل التحقق بخطوتين الآن
        </button>
      </div>
    </div>
  );
}
