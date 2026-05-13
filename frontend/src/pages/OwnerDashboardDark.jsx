import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, FileText, Bell, User as UserIcon,
  LogOut, Heart, Thermometer, MapPin, Plus, Cpu,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useNotifications } from '../hooks/useNotifications';
import { useLatestReading } from '../hooks/useLatestReading';
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';
import UsageBar from '../components/UsageBar';
import logoImage from '../assets/logo-transparent.png';

/* ─── Dark theme tokens (scoped) ─────────────────────── */
const BG = '#090d17';
const PANEL = '#0f1626';
const BORDER = '#1c2640';
const TEXT = '#f2efe3';
const MUTED = '#7d8499';
const GOLD = '#d4af37';
const GOLD_BG = 'rgba(212,175,55,0.12)';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED = '#ef4444';

const statusColor = (s) =>
  s === 'danger' ? RED : s === 'warning' ? AMBER : GREEN;

export default function OwnerDashboardDark() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }

  const { assets, loading, portfolioIndex, dangerCount, warningCount, stableCount } =
    useAssets(ownerId);
  const { unreadCount } = useNotifications(ownerId);

  // Track which asset ids just changed → trigger flash animation
  const [flashIds, setFlashIds] = useState(new Set());
  const prevSnapshotRef = useRef(new Map());
  useEffect(() => {
    const next = new Set();
    assets.forEach((a) => {
      const prev = prevSnapshotRef.current.get(a.id);
      if (prev && (prev.stability_index !== a.stability_index || prev.status !== a.status)) {
        next.add(a.id);
      }
      prevSnapshotRef.current.set(a.id, {
        stability_index: a.stability_index,
        status: a.status,
      });
    });
    if (next.size) {
      setFlashIds(next);
      const t = setTimeout(() => setFlashIds(new Set()), 400);
      return () => clearTimeout(t);
    }
  }, [assets]);

  const sortedAssets = useMemo(() => {
    const rank = { danger: 0, warning: 1, stable: 2 };
    return [...assets].sort((a, b) => {
      const ra = rank[a.status] ?? 3, rb = rank[b.status] ?? 3;
      return ra !== rb ? ra - rb
        : (a.stability_index ?? 100) - (b.stability_index ?? 100);
    });
  }, [assets]);

  const ownerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مالك';

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div dir="rtl" style={{ background: BG, color: TEXT, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulseRed {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%     { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes pulseDot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%     { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes ecgDash {
          to { stroke-dashoffset: -1000; }
        }
        @keyframes flash {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
        .od-pulse-red { animation: pulseRed 1.6s ease-out infinite; }
        .od-pulse-dot { animation: pulseDot 1.2s ease-in-out infinite; }
        .od-ecg-line  { stroke-dasharray: 8 6; animation: ecgDash 30s linear infinite; }
        .od-flash     { animation: flash 0.3s ease-in-out; }
      `}</style>

      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: 220, background: PANEL,
            borderInlineStart: `1px solid ${BORDER}`,
          }}
        >
          <div className="px-5 py-5 flex items-center gap-2"
               style={{ borderBottom: `1px solid ${BORDER}` }}>
            <img src={logoImage} alt="Right" className="h-8 w-auto" />
            <div>
              <div className="text-sm font-bold" style={{ color: GOLD }}>Right</div>
              <div className="text-[10px]" style={{ color: MUTED }}>InsurTech</div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <SideLink to="/dashboard" icon={LayoutDashboard} label="لوحة التحكم" end />
            <SideLink to="/assets" icon={Layers} label="إدارة الأصول" />
            <SideLink to="/stables" icon={Cpu} label="مركز عمليات IoT" />
            <SideLink to="/reports" icon={FileText} label="التقارير الصحية" />
            <SideLink to="/notifications" icon={Bell} label="الإشعارات" badge={unreadCount} />
            <SideLink to="/profile" icon={UserIcon} label="الملف" />
          </nav>

          <button
            onClick={handleSignOut}
            className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
            style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header
            className="flex items-center justify-between px-5 sm:px-8 py-4"
            style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}
          >
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              aria-label="الإشعارات"
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: '#0a1020', border: `1px solid ${BORDER}` }}
            >
              <Bell size={18} style={{ color: GOLD }} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: GOLD, color: '#1a1408' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="text-right">
              <div className="text-xs" style={{ color: MUTED }}>أهلاً بك</div>
              <div className="text-sm font-bold" style={{ color: TEXT }}>{ownerName}</div>
            </div>
          </header>

          <main className="p-5 sm:p-8 space-y-6 overflow-y-auto">
            {/* Stat row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="إجمالي الأصول" value={assets.length} dotColor={GOLD} />
              <StatCard label="مستقرة" value={stableCount} dotColor={GREEN} />
              <StatCard label="تنبيهات" value={warningCount} dotColor={AMBER} />
              <StatCard label="خطر" value={dangerCount} dotColor={RED} pulse />
            </div>

            {/* Portfolio index */}
            <section
              className="rounded-2xl p-6"
              style={{ background: PANEL, border: `1px solid ${BORDER}` }}
            >
              <div className="flex flex-col items-center gap-3">
                <PortfolioGaugeGold value={portfolioIndex} />
                <div className="text-xs font-bold" style={{ color: MUTED }}>
                  مؤشر المحفظة الكلي
                </div>
              </div>

              {/* ECG line */}
              <div className="mt-5">
                <svg viewBox="0 0 1000 60" preserveAspectRatio="none"
                     className="w-full h-12">
                  <path
                    className="od-ecg-line"
                    d="M0 30 L120 30 L140 10 L160 50 L180 30 L320 30 L340 14 L360 46 L380 30 L520 30 L540 8 L560 52 L580 30 L720 30 L740 12 L760 48 L780 30 L1000 30"
                    fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Quick navigation shortcuts */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <QuickNav onClick={() => navigate('/assets')} icon={Layers} label="الأصول" />
                <QuickNav onClick={() => navigate('/stables')} icon={Cpu} label="عمليات IoT" />
                <QuickNav onClick={() => navigate('/reports')} icon={FileText} label="التقارير" />
                <QuickNav onClick={() => navigate('/notifications')} icon={Bell} label="الإشعارات" />
              </div>
            </section>

            {/* Assets */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold" style={{ color: GOLD }}>أصولي</h2>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: GOLD, color: '#1a1408' }}
                >
                  <Plus size={14} /> أصل جديد
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-sm" style={{ color: MUTED }}>
                  جارٍ التحميل…
                </div>
              ) : assets.length === 0 ? (
                <EmptyState onAdd={() => navigate('/onboarding')} />
              ) : (
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                  {sortedAssets.map((a) => (
                    <AssetTile
                      key={a.id}
                      asset={a}
                      flash={flashIds.has(a.id)}
                      onPassport={() => navigate(`/asset/${a.id}`)}
                      onClaim={() => navigate(`/reports/new?asset=${a.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────── */

function SideLink({ to, icon: Icon, label, badge, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
      style={({ isActive }) => ({
        background: isActive ? GOLD_BG : 'transparent',
        color: isActive ? GOLD : MUTED,
        borderInlineStart: `2px solid ${isActive ? GOLD : 'transparent'}`,
      })}
    >
      <Icon size={16} />
      <span className="flex-1 text-right">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className="min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
          style={{ background: GOLD, color: '#1a1408' }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}

function QuickNav({ onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.03]"
      style={{ background: '#0a1020', border: `1px solid ${BORDER}`, color: GOLD }}
    >
      <Icon size={18} />
      <span style={{ color: TEXT }}>{label}</span>
    </button>
  );
}

function StatCard({ label, value, dotColor, pulse }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${pulse ? 'od-pulse-dot' : ''}`}
          style={{ background: dotColor }}
        />
        <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-black" style={{ color: TEXT }}>{value}</div>
    </div>
  );
}

function PortfolioGaugeGold({ value }) {
  const size = 160;
  const r = 68;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
                stroke={BORDER} strokeWidth="10" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={GOLD} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 800ms ease',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            filter: `drop-shadow(0 0 6px ${GOLD}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-black" style={{ color: GOLD }}>{pct}</div>
        <div className="text-[10px] font-bold" style={{ color: MUTED }}>%</div>
      </div>
    </div>
  );
}

const AssetTile = React.memo(function AssetTile({ asset, flash, onPassport, onClaim }) {
  const reading = useLatestReading(asset.id);
  const isDanger = asset.status === 'danger';
  const isWarning = asset.status === 'warning';
  const color = statusColor(asset.status);
  const pct = Math.round(Number(asset.stability_index ?? 100));
  const speciesEmoji = asset.species === 'Horse' ? '🐎'
    : asset.species === 'Falcon' ? '🦅' : '🐪';
  const speciesLabel = asset.species === 'Horse' ? 'خيل'
    : asset.species === 'Falcon' ? 'صقر' : 'إبل';

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col ${isDanger ? 'od-pulse-red' : ''} ${flash ? 'od-flash' : ''}`}
      style={{
        background: PANEL,
        border: `${isDanger ? 2 : 1}px solid ${color}`,
      }}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0"
          style={{ background: '#0a1020', border: `1px solid ${BORDER}` }}
        >
          {asset.image_url || asset.photo_url ? (
            <img src={asset.image_url || asset.photo_url} alt={asset.name}
                 className="w-full h-full object-cover" loading="lazy" />
          ) : speciesEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: TEXT }}>
            {asset.name}
          </div>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: GOLD_BG, color: GOLD }}
          >
            {speciesLabel}
          </span>
        </div>
        <CircularGauge value={pct} color={color} />
      </div>

      <div className="px-4 pb-3 grid grid-cols-4 gap-2 text-[11px]">
        <ReadingChip
          icon={<Heart size={12} style={{ color: RED }} />}
          value={reading?.heart_rate != null ? `${Math.round(reading.heart_rate)}` : '—'}
          unit="bpm"
        />
        <ReadingChip
          icon={<Thermometer size={12} style={{ color: AMBER }} />}
          value={reading?.temperature != null ? `${Number(reading.temperature).toFixed(1)}` : '—'}
          unit="°C"
        />
        <ReadingChip
          icon={
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: reading?.is_in_zone === false ? RED : GREEN }}
            />
          }
          value={reading?.is_in_zone === false ? 'خارج' : 'داخل'}
          unit="النطاق"
          textIcon
        />
        <ReadingChip
          icon={<span className="inline-block w-2 h-2 rounded-full" style={{ background: GOLD }} />}
          value={asset.health_score != null ? Math.round(Number(asset.health_score)) : '—'}
          unit="صحة"
          textIcon
        />
      </div>

      <div className="flex" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={onPassport}
          className="flex-1 py-2.5 text-xs font-bold transition-colors"
          style={{ color: GOLD }}
        >
          عرض الجواز
        </button>
        <div style={{ width: 1, background: BORDER }} />
        <button
          onClick={onClaim}
          className="flex-1 py-2.5 text-xs font-bold transition-colors"
          style={{ color: MUTED }}
        >
          مطالبة
        </button>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.flash === next.flash &&
  prev.onPassport === next.onPassport &&
  prev.onClaim === next.onClaim &&
  prev.asset.id === next.asset.id &&
  prev.asset.name === next.asset.name &&
  prev.asset.status === next.asset.status &&
  prev.asset.stability_index === next.asset.stability_index &&
  prev.asset.image_url === next.asset.image_url
);

function CircularGauge({ value, color }) {
  const size = 50, r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r}
                stroke={BORDER} strokeWidth="4" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 600ms ease',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black"
           style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ReadingChip({ icon, value, unit }) {
  return (
    <div
      className="rounded-lg px-2 py-1.5 flex items-center gap-1.5"
      style={{ background: '#0a1020', border: `1px solid ${BORDER}` }}
    >
      {icon}
      <div className="leading-tight">
        <div className="font-bold" style={{ color: TEXT }}>{value}</div>
        <div className="text-[9px]" style={{ color: MUTED }}>{unit}</div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div
      className="rounded-2xl py-16 px-6 flex flex-col items-center text-center"
      style={{ background: PANEL, border: `1px dashed ${GOLD}66` }}
    >
      <div className="text-6xl mb-3">🐎</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: GOLD }}>
        أضف أصلك الأول
      </h3>
      <p className="text-xs mb-5" style={{ color: MUTED }}>
        ابدأ بتسجيل أصلك لمتابعة حالته الصحية والموقع لحظياً
      </p>
      <button
        onClick={onAdd}
        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
        style={{ background: GOLD, color: '#1a1408',
                 boxShadow: `0 4px 18px ${GOLD}55` }}
      >
        + أضف أصلاً
      </button>
    </div>
  );
}
