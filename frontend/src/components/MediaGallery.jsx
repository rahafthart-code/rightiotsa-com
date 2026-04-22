import React, { useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'right_gallery_';

function loadPhotos(imei) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + imei);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePhotos(imei, photos) {
  try {
    localStorage.setItem(STORAGE_PREFIX + imei, JSON.stringify(photos));
  } catch (e) {
    // localStorage may overflow with many large images
    console.warn('Gallery save failed', e);
  }
}

export default function MediaGallery({ animal, isAr }) {
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (animal?.device_imei) setPhotos(loadPhotos(animal.device_imei));
  }, [animal?.device_imei]);

  if (!animal) return null;

  const handleFiles = async (files) => {
    const list = Array.from(files || []).slice(0, 8);
    const next = [...photos];
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      next.unshift({ id: `${Date.now()}-${file.name}`, src: dataUrl, name: file.name, ts: Date.now() });
    }
    const trimmed = next.slice(0, 24);
    setPhotos(trimmed);
    savePhotos(animal.device_imei, trimmed);
  };

  const removePhoto = (id) => {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    savePhotos(animal.device_imei, next);
  };

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            🖼️ {isAr ? 'سجل الصور' : 'Media Gallery'}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'صور الأصل والعلامات المميزة (تُحفظ على جهازك)' : 'Photos of the asset and distinctive marks (stored locally)'}
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--color-royal-green)', border: '1px solid var(--color-desert-gold)' }}
        >
          ＋ {isAr ? 'إضافة صور' : 'Add Photos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ background: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          {isAr ? 'لا توجد صور بعد. أضف صورًا للتوثيق.' : 'No photos yet. Add some to document this asset.'}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              style={{ border: '1px solid var(--color-border)' }}
              onClick={() => setPreview(p)}
            >
              <img src={p.src} alt={p.name} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                className="absolute top-1 end-1 w-6 h-6 rounded-full text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition"
                style={{ background: 'rgba(220,38,38,0.85)' }}
                aria-label="Remove"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
        >
          <img src={preview.src} alt={preview.name} className="max-h-[85vh] max-w-full rounded-xl" style={{ border: '3px solid var(--color-desert-gold)' }} />
        </div>
      )}
    </section>
  );
}
