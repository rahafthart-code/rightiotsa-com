import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User, ArrowLeft, ArrowRight, CheckCircle2, LogOut,
  LayoutDashboard, Sparkles, Mail, Phone, MapPin, IdCard,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logoImage from "../assets/logo-transparent.png";

const GREEN = "#006c35";
const GREEN_DARK = "#004d25";
const GOLD = "#c5a55a";
const CREAM = "#faf6ef";
const CARD = "#ffffff";
const BORDER = "rgba(197,165,90,0.45)";
const TEXT = "#1a2e1a";
const MUTED = "#5a6b5a";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [profileData, setProfileData] = useState(null);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [savingDigest, setSavingDigest] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile');
    const user = localStorage.getItem('user');
    if (userProfile) {
      setProfileData(JSON.parse(userProfile));
    } else if (user) {
      const userData = JSON.parse(user);
      setProfileData({
        fullName: userData.full_name || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        city: userData.city || '',
      });
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from('profiles')
        .select('daily_digest_enabled')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data && typeof data.daily_digest_enabled === 'boolean') {
        setDigestEnabled(data.daily_digest_enabled);
      }
    })();
  }, []);

  const toggleDigest = async () => {
    if (!userId || savingDigest) return;
    const next = !digestEnabled;
    setDigestEnabled(next);
    setSavingDigest(true);
    const { error } = await supabase
      .from('profiles')
      .update({ daily_digest_enabled: next })
      .eq('user_id', userId);
    if (error) setDigestEnabled(!next);
    setSavingDigest(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const Field = ({ icon: Icon, label, value }) => (
    <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <label className="flex items-center gap-2 text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: GREEN }}>
        <Icon size={14} />
        {label}
      </label>
      <p className="text-lg font-semibold" style={{ color: TEXT }}>
        {value || (isAr ? 'غير متوفر' : 'Not available')}
      </p>
    </div>
  );

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: TEXT }} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-20 backdrop-blur" style={{ background: 'rgba(250,246,239,0.85)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src={logoImage} alt="Right" className="h-10 w-auto" style={{ objectFit: 'contain' }} />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ color: GREEN, border: `1px solid ${BORDER}`, background: CARD }}
          >
            <BackIcon size={16} />
            <span>{isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 8px 24px -12px rgba(0,108,53,0.15)' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})` }}>
              <User size={32} color="#fff" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: GREEN }}>
                {isAr ? 'الملف الشخصي' : 'Profile'}
              </h1>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {isAr ? 'بياناتك الشخصية ومعلومات الحساب' : 'Your personal data and account information'}
              </p>
            </div>
          </div>

          {profileData ? (
            <div className="space-y-4">
              <Field icon={User}    label={isAr ? 'الاسم الكامل' : 'Full Name'}        value={profileData.fullName} />
              <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <label className="flex items-center gap-2 text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: GREEN }}>
                  <Mail size={14} />
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <p className="text-lg font-semibold flex items-center gap-2" style={{ color: TEXT }}>
                  {profileData.email || (isAr ? 'غير متوفر' : 'Not available')}
                  <CheckCircle2 size={18} style={{ color: GREEN }} />
                </p>
                <p className="text-xs mt-1 font-bold" style={{ color: GREEN }}>
                  {isAr ? 'تم التحقق' : 'Verified'}
                </p>
              </div>
              <Field icon={IdCard}  label={isAr ? 'رقم الهوية الوطنية' : 'National ID'} value={profileData.nationalId} />
              <Field icon={Phone}   label={isAr ? 'رقم الجوال' : 'Mobile Number'}      value={profileData.mobile} />
              <Field icon={MapPin}  label={isAr ? 'المدينة/المنطقة' : 'City/Region'}    value={profileData.city} />

              <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} style={{ color: GOLD }} />
                      <p className="text-base font-bold" style={{ color: TEXT }}>
                        {isAr ? 'رسائل الطمأنينة اليومية' : 'Daily Reassurance Messages'}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                      {isAr
                        ? 'تلقَّ تنبيهاً يومياً يطمئنك على حلالك ومؤشرات استقراره عندما لا تتفقد التطبيق لعدة أيام.'
                        : "Receive a daily notification reassuring you about your livestock and their stability when you haven't checked the app for a few days."}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={digestEnabled}
                    onClick={toggleDigest}
                    disabled={savingDigest || !userId}
                    className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
                    style={{ background: digestEnabled ? GREEN : '#cbd1c6' }}
                  >
                    <span
                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                      style={{ transform: digestEnabled ? 'translateX(-22px)' : 'translateX(-2px)' }}
                    />
                  </button>
                </div>
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(0,108,53,0.06)', border: `1px solid ${GREEN}33` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: GREEN }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: GREEN }}>
                      {isAr ? 'الحساب نشط' : 'Account Active'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      {isAr ? 'يمكنك الوصول إلى جميع الميزات' : 'Full access to all features'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <User size={56} className="mx-auto mb-4" style={{ color: GOLD }} />
              <p style={{ color: MUTED }}>
                {isAr ? 'لا توجد بيانات متوفرة' : 'No profile data available'}
              </p>
            </div>
          )}

          <div className="mt-8 pt-8 space-y-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-white"
              style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})` }}
            >
              <LayoutDashboard size={18} />
              {isAr ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
              <LogOut size={18} />
              {isAr ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
