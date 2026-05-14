import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Send,
  Phone,
  User,
  MapPin,
  Hash,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

/**
 * Cyber-Heritage themed order form (creamy bg + royal green + desert gold + Cairo).
 * Replaces the previous dark slate variant. Asks for: name, phone, asset type,
 * device quantity, and optional region.
 */
export default function OrderDeviceModal({ isOpen, onClose }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    animalType: "",
    quantity: "",
    region: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ fullName: "", contactNumber: "", animalType: "", quantity: "", region: "" });
      onClose();
    }, 3500);
  };

  if (!isOpen) return null;

  const labelStyle = { color: "#0d3b1f" };
  const inputBase =
    "w-full px-4 py-3 rounded-xl outline-none transition-all text-base";
  const inputStyle = {
    background: "#faf6ef",
    border: "1.5px solid #d8c89b",
    color: "#0d3b1f",
    fontFamily: "Cairo, Tajawal, sans-serif",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13, 59, 31, 0.55)", backdropFilter: "blur(4px)" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{
          background: "#fbf7ec",
          border: "2px solid #c5a55a",
          fontFamily: "Cairo, Tajawal, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 sticky top-0 z-10 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #006c35 0%, #004d25 100%)",
            borderBottom: "3px solid #c5a55a",
          }}
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {isAr ? "اطلب أجهزة التتبع الآن" : "Order Tracking Devices"}
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "#e6d5a8" }}>
              {isAr
                ? "املأ النموذج وسيتواصل معك فريقنا خلال 24 ساعة"
                : "Fill the form and our team will reach out within 24 hours"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-10">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(0,108,53,0.12)", border: "2px solid #006c35" }}
              >
                <CheckCircle2 size={42} style={{ color: "#006c35" }} />
              </div>
              <h3 className="text-2xl font-extrabold mb-2" style={{ color: "#006c35" }}>
                {isAr ? "تم إرسال طلبك بنجاح" : "Request submitted"}
              </h3>
              <p className="text-sm" style={{ color: "#5b6b5b" }}>
                {isAr
                  ? "سوف نتواصل معك خلال 24 ساعة لتحديد التفاصيل الفنية والتسعير"
                  : "We will contact you within 24 hours with technical details and pricing"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2" style={labelStyle}>
                  <User size={16} style={{ color: "#006c35" }} />
                  {isAr ? "الاسم الكامل *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder={isAr ? "محمد بن عبدالله" : "Your full name"}
                  className={inputBase}
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2" style={labelStyle}>
                  <Phone size={16} style={{ color: "#006c35" }} />
                  {isAr ? "رقم الجوال *" : "Mobile Number *"}
                </label>
                <div
                  className="flex items-stretch rounded-xl overflow-hidden"
                  style={{ border: "1.5px solid #d8c89b", background: "#faf6ef" }}
                  dir="ltr"
                >
                  <span
                    className="px-3 flex items-center text-sm font-bold"
                    style={{ background: "#006c35", color: "#fff" }}
                  >
                    +966
                  </span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    placeholder="5XXXXXXXX"
                    maxLength={10}
                    className="flex-1 px-3 py-3 bg-transparent outline-none tracking-wider"
                    style={{ color: "#0d3b1f", fontFamily: "Cairo, Tajawal, sans-serif" }}
                  />
                </div>
              </div>

              {/* Asset type */}
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2" style={labelStyle}>
                  <ShieldCheck size={16} style={{ color: "#006c35" }} />
                  {isAr ? "نوع الأصول *" : "Asset Type *"}
                </label>
                <select
                  name="animalType"
                  value={formData.animalType}
                  onChange={handleChange}
                  required
                  className={inputBase}
                  style={inputStyle}
                >
                  <option value="">{isAr ? "اختر النوع" : "Select type"}</option>
                  <option value="camel">{isAr ? "إبل" : "Camels"}</option>
                  <option value="horse">{isAr ? "خيل" : "Horses"}</option>
                  <option value="falcon">{isAr ? "صقور" : "Falcons"}</option>
                  <option value="mixed">{isAr ? "متنوع" : "Mixed"}</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2" style={labelStyle}>
                  <Hash size={16} style={{ color: "#006c35" }} />
                  {isAr ? "عدد الأجهزة المطلوبة *" : "Number of Devices *"}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder={isAr ? "مثال: 25" : "e.g. 25"}
                  className={inputBase}
                  style={inputStyle}
                />
              </div>

              {/* Region (optional) */}
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2" style={labelStyle}>
                  <MapPin size={16} style={{ color: "#006c35" }} />
                  {isAr ? "المنطقة (اختياري)" : "Region (optional)"}
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder={isAr ? "الرياض، القصيم، حائل..." : "Riyadh, Qassim, Hail..."}
                  className={inputBase}
                  style={inputStyle}
                />
              </div>

              {/* Trust note */}
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(197,165,90,0.12)", border: "1px solid #d8c89b" }}
              >
                <Info size={18} style={{ color: "#8a6d2c", flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm leading-relaxed" style={{ color: "#5e4a1a" }}>
                  {isAr
                    ? "بياناتك محمية وفق أعلى معايير الخصوصية، وسيتم استخدامها فقط للتواصل بشأن طلبك."
                    : "Your data is protected and will only be used to follow up on this order."}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-extrabold text-base shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #006c35 0%, #004d25 100%)",
                  color: "#fff",
                  border: "1px solid #c5a55a",
                }}
              >
                <Send size={18} />
                {isAr ? "إرسال الطلب" : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
