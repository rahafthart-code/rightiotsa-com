import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as api from "../api";
import logoImage from "../assets/logo-transparent.png";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  
  const { plan } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    if (!plan) {
      navigate('/');
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

  const VAT_RATE = 0.15; // 15% VAT in Saudi Arabia
  const subtotal = plan.price_sar;
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create subscription
      const subscription = await api.createSubscription(plan.plan_id);
      
      // Create invoice data
      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        customerEmail: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : '',
        planName: i18n.language === 'ar' ? plan.name_ar : plan.name_en,
        subtotal: subtotal,
        vat: vatAmount,
        total: total,
        subscriptionId: subscription.id
      };
      
      setInvoiceData(invoice);
      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      console.error("Payment error:", err);
      alert(i18n.language === 'ar' ? 'فشل الدفع. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const downloadInvoice = () => {
    // Simple text-based invoice (in production, use PDF library like jsPDF)
    const invoiceText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RIGHT PLATFORM
        INVOICE / الفاتورة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: ${invoiceData.invoiceNumber}
Date: ${new Date(invoiceData.date).toLocaleDateString()}
Customer: ${invoiceData.customerEmail}

PLAN / الباقة:
${invoiceData.planName}

CHARGES / الرسوم:
Subtotal:        ${subtotal.toFixed(2)} SAR
VAT (15%):       ${vatAmount.toFixed(2)} SAR
──────────────────────────────
TOTAL:           ${total.toFixed(2)} SAR

Thank you for choosing Right!
شكراً لاختيارك منصة رايت!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Right_Invoice_${invoiceData.invoiceNumber}.txt`;
    a.click();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Success Animation */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-emerald-400 mb-3">
              {i18n.language === 'ar' ? 'نجح الدفع!' : 'Payment Successful!'}
            </h2>
            
            <p className="text-slate-300 mb-6">
              {i18n.language === 'ar' 
                ? 'اشتراكك الآن نشط. جاري التحويل إلى لوحة التحكم...'
                : 'Your subscription is now active. Redirecting to dashboard...'
              }
            </p>

            {invoiceData && (
              <button
                onClick={downloadInvoice}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {i18n.language === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {i18n.language === 'ar' ? 'جاري معالجة الدفع...' : 'Processing Payment...'}
          </h2>
          <p className="text-slate-400">
            {i18n.language === 'ar' ? 'يرجى الانتظار' : 'Please wait'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Right Logo" className="h-10 w-auto" style={{ objectFit: 'contain', background: 'transparent' }} />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            {i18n.language === 'ar' ? 'إتمام الدفع' : 'Secure Checkout'}
          </h1>
          <p className="text-slate-400">
            {i18n.language === 'ar' ? 'مراجعة طلبك وإكمال عملية الدفع الآمنة' : 'Review your order and complete secure payment'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {i18n.language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">
                  {i18n.language === 'ar' ? 'الباقة' : 'Plan'}
                </div>
                <div className="text-lg font-semibold text-slate-100">
                  {i18n.language === 'ar' ? plan.name_ar : plan.name_en}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-slate-300">
                  <span>{i18n.language === 'ar' ? 'المبلغ الأساسي' : 'Subtotal'}</span>
                  <span className="font-medium">{subtotal.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{i18n.language === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                  <span className="font-medium">{vatAmount.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-emerald-400 pt-3 border-t border-slate-600">
                  <span>{i18n.language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span>{total.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                <p className="text-blue-200 text-sm">
                  {i18n.language === 'ar' 
                    ? '✓ اشتراك سنوي (365 يوم)'
                    : '✓ Annual subscription (365 days)'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {i18n.language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </h2>

            <div className="space-y-6">
              {/* Apple Pay Button */}
              <button
                onClick={handlePayment}
                className="w-full px-6 py-4 bg-black hover:bg-gray-900 text-white text-lg font-medium rounded-xl border border-gray-800 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-xl"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>{i18n.language === 'ar' ? 'الدفع بواسطة Apple Pay' : 'Pay with Apple Pay'}</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-400">
                    {i18n.language === 'ar' ? 'أو' : 'OR'}
                  </span>
                </div>
              </div>

              {/* Credit Card Form */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">
                    {i18n.language === 'ar' ? 'بطاقة الائتمان' : 'Credit Card'}
                  </h3>
                  <div className="flex gap-2">
                    <svg className="w-10 h-7" viewBox="0 0 48 32" fill="none">
                      <rect width="48" height="32" rx="4" fill="#EB001B"/>
                      <rect x="16" width="16" height="32" rx="4" fill="#F79E1B" fillOpacity="0.8"/>
                    </svg>
                    <svg className="w-10 h-7" viewBox="0 0 48 32" fill="none">
                      <rect width="48" height="32" rx="4" fill="#0066CC"/>
                    </svg>
                  </div>
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    {i18n.language === 'ar' ? 'رقم البطاقة' : 'Card Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      {i18n.language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength="3"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    {i18n.language === 'ar' ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={i18n.language === 'ar' ? 'الاسم كما يظهر على البطاقة' : 'Name as it appears on card'}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Secure Payment Notice */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium text-sm">
                    {i18n.language === 'ar' ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  {i18n.language === 'ar' 
                    ? 'جميع المعاملات محمية بتشفير SSL 256-bit'
                    : 'All transactions protected with 256-bit SSL encryption'
                  }
                </p>
              </div>

              {/* Pay with Credit Card Button */}
              <button
                onClick={handlePayment}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-2xl shadow-emerald-500/25 transition-all transform hover:scale-105"
              >
                {i18n.language === 'ar' ? `💳 ادفع ${total.toFixed(2)} ر.س` : `💳 Pay ${total.toFixed(2)} SAR`}
              </button>

              <p className="text-center text-slate-500 text-xs">
                {i18n.language === 'ar' 
                  ? 'بالنقر على "ادفع"، فإنك توافق على الشروط والأحكام'
                  : 'By clicking "Pay", you agree to the Terms & Conditions'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
