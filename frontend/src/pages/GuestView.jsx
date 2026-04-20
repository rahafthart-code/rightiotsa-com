import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import logoImage from "../assets/logo-transparent.png";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function GuestView() {
  const { token } = useParams();
  const [isAr, setIsAr] = useState(true);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const payload = useMemo(() => {
    try {
      const decoded = decodeURIComponent(token);
      const json = decodeURIComponent(escape(atob(decoded)));
      const parsed = JSON.parse(json);
      if (parsed.exp && Date.now() > parsed.exp) return { expired: true };
      return parsed;
    } catch {
      return { invalid: true };
    }
  }, [token]);

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = isAr ? 'ar' : 'en';
  }, [isAr]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || !payload?.lat || !payload?.lng) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [payload.lng, payload.lat],
      zoom: 13,
      interactive: true,
    });
    new mapboxgl.Marker({ color: '#006c35' }).setLngLat([payload.lng, payload.lat]).addTo(map);
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;
    return () => { try { map.remove(); } catch {} mapRef.current = null; };
  }, [payload]);

  if (payload.invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'رابط غير صالح' : 'Invalid link'}
          </h1>
        </div>
      </div>
    );
  }

  if (payload.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">⏳</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'انتهت صلاحية الرابط' : 'This link has expired'}
          </h1>
          <Link
            to="/"
            className="inline-block mt-4 px-4 py-2 text-xs font-bold rounded-lg text-white"
            style={{ background: 'var(--color-royal-green)' }}
          >
            {isAr ? 'تتبع قطيعك مع رايت' : 'Track your own herd with Right'}
          </Link>
        </div>
      </div>
    );
  }

  const speciesEmoji = { Camel: '🐪', Horse: '🐴', Falcon: '🦅' }[payload.s] || '📍';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="shadow-sm" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Right" className="h-8 w-auto" />
            <div>
              <div className="text-sm font-bold text-white">{isAr ? 'رايت' : 'Right'}</div>
              <div className="text-[10px]" style={{ color: 'var(--color-desert-gold-light)' }}>
                {isAr ? 'تتبع مباشر للضيف' : 'Live Guest Tracking'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAr(!isAr)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg"
            style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        <div
          className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(0,108,53,0.1), rgba(197,165,90,0.1))' }}
            >
              {speciesEmoji}
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {payload.n}
              </h1>
              <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                IMEI: {payload.i}
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1 text-[11px] font-bold rounded-full"
            style={{ background: 'rgba(0,108,53,0.1)', color: 'var(--color-royal-green)', border: '1px solid rgba(0,108,53,0.3)' }}
          >
            👁️ {isAr ? 'عرض للقراءة فقط' : 'Read-only View'}
          </span>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          {!MAPBOX_TOKEN ? (
            <div className="h-80 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm">Mapbox token not configured</p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="h-80 sm:h-[420px] w-full" />
          )}
          <div className="px-4 py-3 text-[11px] flex flex-wrap gap-3 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>📍 {payload.lat?.toFixed(5)}, {payload.lng?.toFixed(5)}</span>
            {payload.ts && <span>🕐 {new Date(payload.ts).toLocaleString(isAr ? 'ar-SA' : 'en')}</span>}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))',
            border: '2px solid var(--color-desert-gold)',
          }}
        >
          <p className="text-white text-sm font-semibold mb-3">
            {isAr ? 'هل تريد حماية وتتبع حلالك أيضاً؟' : 'Want to protect and track your own herd?'}
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 text-sm font-bold rounded-xl"
            style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
          >
            {isAr ? '🐪 تتبع قطيعك مع رايت' : '🐪 Track your own herd'}
          </Link>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        {isAr ? 'مدعوم بواسطة' : 'Powered by'}{' '}
        <span className="font-bold" style={{ color: 'var(--color-royal-green)' }}>
          Right InsurTech
        </span>
      </footer>
    </div>
  );
}
