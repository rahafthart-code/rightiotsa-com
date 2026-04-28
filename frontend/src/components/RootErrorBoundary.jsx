import React from 'react';

/**
 * Root error boundary — replaces the white crash screen with a
 * gold "حدث خطأ" card and a retry button.
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
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Soft reload to recover lazy chunks etc.
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#090d17', color: '#fff', fontFamily: "'Cairo', sans-serif" }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1320 100%)',
            border: '2px solid #c5a55a',
            boxShadow: '0 20px 60px rgba(197,165,90,0.25)',
          }}
        >
          <div
            className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'rgba(197,165,90,0.15)', border: '1px solid #c5a55a' }}
          >
            ⚠️
          </div>
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: '#c5a55a', fontFamily: "'Amiri', 'Playfair Display', serif" }}
          >
            حدث خطأ
          </h1>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">
            عذراً، حدث خطأ غير متوقع أثناء تشغيل التطبيق. يمكنك المحاولة مرة أخرى.
          </p>
          {this.state.error?.message && (
            <pre
              className="text-[11px] text-left rtl:text-right mb-6 p-3 rounded-lg overflow-auto max-h-24 opacity-60"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#c5a55a', direction: 'ltr' }}
            >
              {String(this.state.error.message)}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="w-full py-3 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c5a55a 0%, #b8924a 100%)',
              color: '#090d17',
              boxShadow: '0 6px 20px rgba(197,165,90,0.4)',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
}
