import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoImage from "../assets/logo-transparent.png";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Load profile data from localStorage
    const userProfile = localStorage.getItem('userProfile');
    const user = localStorage.getItem('user');
    
    if (userProfile) {
      setProfileData(JSON.parse(userProfile));
    } else if (user) {
      // Fallback to user data from auth
      const userData = JSON.parse(user);
      setProfileData({
        fullName: userData.full_name || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        city: userData.city || ''
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src={logoImage} alt="Right Logo" className="h-10 w-auto" style={{ objectFit: 'contain', background: 'transparent' }} />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">{i18n.language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/10 p-8">
          {/* Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                {i18n.language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </h1>
              <p className="text-slate-400 text-sm">
                {i18n.language === 'ar' ? 'بياناتك الشخصية ومعلومات الحساب' : 'Your personal data and account information'}
              </p>
            </div>
          </div>

          {/* Profile Data */}
          {profileData ? (
            <div className="space-y-6">
              {/* Full Name */}
              <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <p className="text-lg font-semibold text-slate-100">
                  {profileData.fullName || (i18n.language === 'ar' ? 'غير متوفر' : 'Not available')}
                </p>
              </div>

              {/* Email */}
              <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <p className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  {profileData.email || (i18n.language === 'ar' ? 'غير متوفر' : 'Not available')}
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </p>
                <p className="text-xs text-emerald-400 mt-1">
                  {i18n.language === 'ar' ? 'تم التحقق' : 'Verified'}
                </p>
              </div>

              {/* National ID */}
              <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {i18n.language === 'ar' ? 'رقم الهوية الوطنية' : 'National ID'}
                </label>
                <p className="text-lg font-semibold text-slate-100">
                  {profileData.nationalId || (i18n.language === 'ar' ? 'غير متوفر' : 'Not available')}
                </p>
              </div>

              {/* Mobile */}
              <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {i18n.language === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
                </label>
                <p className="text-lg font-semibold text-slate-100">
                  {profileData.mobile || (i18n.language === 'ar' ? 'غير متوفر' : 'Not available')}
                </p>
              </div>

              {/* City */}
              <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {i18n.language === 'ar' ? 'المدينة/المنطقة' : 'City/Region'}
                </label>
                <p className="text-lg font-semibold text-slate-100">
                  {profileData.city || (i18n.language === 'ar' ? 'غير متوفر' : 'Not available')}
                </p>
              </div>

              {/* Account Status */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      {i18n.language === 'ar' ? 'الحساب نشط' : 'Account Active'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {i18n.language === 'ar' ? 'يمكنك الوصول إلى جميع الميزات' : 'Full access to all features'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-slate-400">
                {i18n.language === 'ar' ? 'لا توجد بيانات متوفرة' : 'No profile data available'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {i18n.language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
