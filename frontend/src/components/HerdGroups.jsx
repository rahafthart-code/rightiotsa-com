import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'right_herd_groups_v1';

function loadGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveGroups(groups) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(groups)); } catch { /* ignore */ }
}

function defaultGroups(isAr) {
  return [
    { id: 'g1', name: isAr ? 'عزبة الشمال' : 'Northern Herd', imeis: [] },
    { id: 'g2', name: isAr ? 'عزبة الجنوب' : 'Southern Herd', imeis: [] },
  ];
}

export default function HerdGroups({ animals = [], healthByImei = {}, isAr }) {
  const [groups, setGroups] = useState(() => loadGroups() || defaultGroups(isAr));
  const [newName, setNewName] = useState('');
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id);

  useEffect(() => { saveGroups(groups); }, [groups]);

  const assignedSet = useMemo(() => {
    const s = new Set();
    groups.forEach((g) => g.imeis.forEach((i) => s.add(i)));
    return s;
  }, [groups]);

  const addGroup = () => {
    const name = newName.trim();
    if (!name) return;
    const g = { id: `g${Date.now()}`, name, imeis: [] };
    setGroups((prev) => [...prev, g]);
    setActiveGroupId(g.id);
    setNewName('');
  };

  const removeGroup = (id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleAssign = (groupId, imei) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.imeis.includes(imei);
        return { ...g, imeis: has ? g.imeis.filter((i) => i !== imei) : [...g.imeis, imei] };
      }),
    );
  };

  const groupStats = (g) => {
    const members = animals.filter((a) => g.imeis.includes(a.device_imei));
    const total = members.length;
    const stable = members.filter((a) => {
      const t = Number(healthByImei[a.device_imei]?.temperature);
      return !Number.isNaN(t) && t >= 37 && t <= 38.8;
    }).length;
    const discipline = total === 0 ? 100 : Math.round((stable / total) * 100);
    return { total, stable, discipline };
  };

  const active = groups.find((g) => g.id === activeGroupId);

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            🏡 {isAr ? 'إدارة العزب' : 'Herd Management'}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'جمّع أصولك في عزب لمتابعة أدائها مجتمعة' : 'Group your assets into herds to monitor them collectively'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            placeholder={isAr ? 'اسم العزبة الجديدة' : 'New herd name'}
            className="px-3 py-1.5 text-xs rounded-lg outline-none w-40"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={addGroup}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-white"
            style={{ background: 'var(--color-royal-green)', border: '1px solid var(--color-desert-gold)' }}
          >
            ＋ {isAr ? 'إنشاء' : 'Create'}
          </button>
        </div>
      </div>

      {/* Group summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((g) => {
          const stats = groupStats(g);
          const isActive = g.id === activeGroupId;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className="text-start rounded-xl p-3 transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0,108,53,0.08), rgba(197,165,90,0.08))'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${isActive ? 'var(--color-royal-green)' : 'var(--color-border)'}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  🏕️ {g.name}
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: stats.discipline >= 85 ? 'rgba(0,108,53,0.12)' : 'rgba(217,119,6,0.12)',
                    color: stats.discipline >= 85 ? 'var(--color-royal-green)' : '#d97706',
                  }}
                >
                  {stats.discipline}%
                </span>
              </div>
              <div className="mt-2 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                {isAr
                  ? `${stats.total} أصل • حالة الانضباط ${stats.discipline}%`
                  : `${stats.total} assets • Discipline ${stats.discipline}%`}
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${stats.discipline}%`,
                    background: 'linear-gradient(90deg, var(--color-royal-green), var(--color-desert-gold))',
                  }}
                />
              </div>
              {groups.length > 1 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeGroup(g.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeGroup(g.id); } }}
                  className="mt-2 text-[10px] font-semibold inline-block cursor-pointer"
                  style={{ color: '#dc2626' }}
                >
                  {isAr ? '🗑️ حذف العزبة' : '🗑️ Delete herd'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Member assignment */}
      {active && (
        <div className="mt-5">
          <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {isAr ? `أصول العزبة: ${active.name}` : `Members of: ${active.name}`}
          </div>
          {animals.length === 0 ? (
            <div className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              {isAr ? 'لا توجد أصول مسجلة بعد.' : 'No assets registered yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {animals.map((a) => {
                const checked = active.imeis.includes(a.device_imei);
                const elsewhere = !checked && assignedSet.has(a.device_imei);
                return (
                  <label
                    key={a.device_imei}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer text-xs"
                    style={{
                      background: checked ? 'rgba(0,108,53,0.08)' : 'var(--color-bg-secondary)',
                      border: `1px solid ${checked ? 'var(--color-royal-green)' : 'var(--color-border)'}`,
                      opacity: elsewhere ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssign(active.id, a.device_imei)}
                      className="accent-emerald-700"
                    />
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{a.name}</span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{a.device_imei}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
