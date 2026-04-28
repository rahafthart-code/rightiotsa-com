import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ICONS = [
  { id: 'stable', emoji: '🌴', labelAr: 'عزبة', labelEn: 'Stable' },
  { id: 'farm', emoji: '🌾', labelAr: 'مزرعة', labelEn: 'Farm' },
  { id: 'ranch', emoji: '🐎', labelAr: 'إسطبل', labelEn: 'Ranch' },
  { id: 'desert', emoji: '⛺', labelAr: 'مخيم', labelEn: 'Desert' },
];

const COLORS = ['#1D9E75', '#c5a55a', '#3b82f6', '#0ea5e9', '#d97706', '#ef4444'];

export default function AddStableModal({ open, onClose, ownerId, onCreated, onSubmit, isAr }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('stable');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#1D9E75');
  const [lat, setLat] = useState(24.7136);
  const [lng, setLng] = useState(46.6753);
  const [radius, setRadius] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const dLat = radius / 111;
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
  const dLng = radius / (111 * cosLat);
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].join(',');
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  // Adjust pin coords based on click position inside the iframe overlay
  function handleOverlayClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const newLng = lng - dLng + x * dLng * 2;
    const newLat = lat + dLat - y * dLat * 2;
    setLat(Number(newLat.toFixed(6)));
    setLng(Number(newLng.toFixed(6)));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      icon,
      location_name: location.trim() || null,
      color,
      center_lat: lat,
      center_lng: lng,
      radius_km: radius,
      is_active: true,
    };

    try {
      let data;
      if (onSubmit) {
        // Preferred: delegate to parent (e.g. useStables.createStable)
        data = await onSubmit(payload);
      } else {
        if (!ownerId) throw new Error('No owner');
        const { data: row, error: err } = await supabase
          .from('stables')
          .insert({ ...payload, owner_id: ownerId })
          .select()
          .single();
        if (err) throw err;
        data = row;
      }
      setSaving(false);
      onCreated?.(data);
      onClose();
      // reset
      setName(''); setLocation(''); setIcon('stable'); setColor('#1D9E75'); setRadius(5);
    } catch (e) {
      setSaving(false);
      setError(e.message ?? String(e));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#FDFAF4', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1D9E75, #006c35)', color: '#fff' }}
        >
          <div className="font-bold flex items-center gap-2">🌴 {isAr ? 'إضافة عزبة جديدة' : 'Add Stable'}</div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Name */}
          <div>
            <Label>{isAr ? 'اسم العزبة' : 'Stable name'}</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'مثال: عزبة رماح' : 'e.g. Rummah Stable'}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ background: '#fff', border: '1px solid #1D9E7533' }}
            />
          </div>

          {/* Icon */}
          <div>
            <Label>{isAr ? 'الأيقونة' : 'Icon'}</Label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIcon(ic.id)}
                  className="rounded-lg py-2 text-center transition-all"
                  style={{
                    background: icon === ic.id ? '#1D9E75' : '#fff',
                    color: icon === ic.id ? '#fff' : '#1a1a1a',
                    border: `1px solid ${icon === ic.id ? '#1D9E75' : '#e5e1d4'}`,
                  }}
                >
                  <div className="text-xl">{ic.emoji}</div>
                  <div className="text-[10px] mt-0.5 font-bold">{isAr ? ic.labelAr : ic.labelEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label>{isAr ? 'المنطقة / المدينة' : 'Region / City'}</Label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={isAr ? 'الخالدية، الرياض' : 'Khalidiyah, Riyadh'}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ background: '#fff', border: '1px solid #1D9E7533' }}
            />
          </div>

          {/* Color */}
          <div>
            <Label>{isAr ? 'لون العزبة' : 'Color'}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Map pin */}
          <div>
            <Label>{isAr ? 'حدد المركز على الخريطة' : 'Pin center on map'}</Label>
            <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #1D9E7533' }}>
              <iframe
                title="add-stable-map"
                src={mapSrc}
                style={{ width: '100%', height: 200, border: 0, display: 'block' }}
              />
              <div
                onClick={handleOverlayClick}
                className="absolute inset-0 cursor-crosshair"
                title={isAr ? 'اضغط لتحديد المركز' : 'Click to set pin'}
                style={{ background: 'transparent' }}
              />
              <div
                className="absolute bottom-2 px-2 py-1 rounded text-[10px] font-mono"
                style={{
                  [isAr ? 'right' : 'left']: 8,
                  background: 'rgba(255,255,255,0.92)',
                  color: '#1D9E75',
                }}
              >
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Radius */}
          <div>
            <Label>{isAr ? `النطاق: ${radius} كم` : `Radius: ${radius} km`}</Label>
            <input
              type="range"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: color }}
            />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#b91c1c' }}>
              {error}
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 flex items-center justify-end gap-2"
          style={{ background: '#fff', borderTop: '1px solid #e5e1d4' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: 'transparent', color: '#6b6b6b' }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ background: '#1D9E75' }}
          >
            {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ العزبة' : 'Save Stable')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b6b6b' }}>
      {children}
    </div>
  );
}
