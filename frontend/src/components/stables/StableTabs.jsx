import React from 'react';

const TABS = [
  { id: 'all', icon: '🌍', labelAr: 'الكل', labelEn: 'All' },
];

export default function StableTabs({
  stables,
  selectedId,           // 'all' | stable.id
  onSelect,
  onAdd,
  isAr,
}) {
  const allTab = (
    <button
      key="all"
      type="button"
      onClick={() => onSelect('all')}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap"
      style={{
        background: selectedId === 'all' ? '#1D9E75' : '#fff',
        color: selectedId === 'all' ? '#fff' : '#1D9E75',
        border: '1px solid #1D9E7544',
        boxShadow: selectedId === 'all' ? '0 4px 12px rgba(29,158,117,0.25)' : 'none',
      }}
    >
      🌍 {isAr ? 'الكل' : 'All'}
    </button>
  );

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: 'thin' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {allTab}
      {stables.map((s) => {
        const active = selectedId === s.id;
        const accent = s.color || '#1D9E75';
        const icon = s.icon === 'farm' ? '🌾'
          : s.icon === 'ranch' ? '•'
          : s.icon === 'desert' ? '⛺'
          : '🌴';
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap"
            style={{
              background: active ? accent : '#fff',
              color: active ? '#fff' : accent,
              border: `1px solid ${accent}55`,
              boxShadow: active ? `0 4px 12px ${accent}40` : 'none',
            }}
          >
            {icon} {isAr ? s.name : (s.name_en || s.name)}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap"
        style={{
          background: 'transparent',
          color: '#1D9E75',
          border: '1.5px dashed #1D9E7588',
        }}
      >
        + {isAr ? 'إضافة عزبة' : 'Add Stable'}
      </button>
    </div>
  );
}
