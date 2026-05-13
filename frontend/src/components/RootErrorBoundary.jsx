import React from 'react';
import { toast } from 'sonner';

/**
 * Silent root error boundary.
 *
 * Per product requirement: do NOT show a full "Unexpected error" page.
 * Instead, surface the error as a non-blocking toast and render a minimal
 * cream-themed inline notice with a "Back to home" link, so the user keeps
 * browsing the site.
 */
export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[RootErrorBoundary]', error, info);
    try {
      toast.error('حدث خلل بسيط — تم تجاهله، يمكنك متابعة التصفح');
    } catch {
      /* toast unavailable — ignore */
    }
  }

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/landing';
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: '#F5F5DC',
          color: '#006c35',
          fontFamily: "'Cairo', 'Tajawal', sans-serif",
        }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 text-center"
          style={{
            background: '#ffffff',
            border: '1px solid #e6dcc8',
            boxShadow: '0 6px 20px rgba(0,108,53,0.08)',
          }}
        >
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#4a5d4a' }}>
            تعذّر تحميل هذا الجزء من الصفحة. يمكنك العودة للصفحة الرئيسية ومتابعة التصفح بشكل طبيعي.
          </p>
          <button
            onClick={this.handleHome}
            className="px-5 py-2.5 rounded-xl font-bold transition-transform hover:scale-[1.02]"
            style={{ background: '#006c35', color: '#ffffff' }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }
}
