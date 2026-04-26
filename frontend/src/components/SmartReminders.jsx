import React, { useMemo, useState } from 'react';
import { Syringe, Satellite, Stethoscope, BellRing, PartyPopper } from 'lucide-react';

function daysFromNow(d) {
  const ms = new Date(d).getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function buildDefaultReminders(isAr) {
  const today = new Date();
  const mk = (offset) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  return [
    {
      id: 'vac-1',
      Icon: Syringe,
      type: isAr ? 'تطعيم' : 'Vaccination',
      title: isAr ? 'موعد تطعيم الجدري للإبل' : 'Camel pox vaccination',
      due: mk(3),
      tone: 'green',
    },
    {
      id: 'iot-1',
      Icon: Satellite,
      type: isAr ? 'صيانة الجهاز' : 'IoT Maintenance',
      title: isAr ? 'فحص جهاز التتبع وتحديث البرنامج' : 'Tracker device check & firmware update',
      due: mk(10),
      tone: 'gold',
    },
    {
      id: 'vet-1',
      Icon: Stethoscope,
      type: isAr ? 'فحص دوري' : 'Health Checkup',
      title: isAr ? 'كشف بيطري دوري للقطيع' : 'Routine veterinary checkup',
      due: mk(21),
      tone: 'green',
    },
  ];
}

function toneStyles(tone, days) {
  if (days < 0) {
    return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)' };
  }
  if (days <= 7) {
    return { color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.3)' };
  }
  if (tone === 'gold') {
    return { color: 'var(--color-desert-gold-dark)', bg: 'rgba(197,165,90,0.08)', border: 'rgba(197,165,90,0.3)' };
  }
  return { color: 'var(--color-royal-green)', bg: 'rgba(0,108,53,0.08)', border: 'rgba(0,108,53,0.3)' };
}

export default function SmartReminders({ isAr }) {
  const [items, setItems] = useState(() => buildDefaultReminders(isAr));

  // Re-translate on language switch
  useMemo(() => setItems(buildDefaultReminders(isAr)), [isAr]); // eslint-disable-line

  const formatDue = (date, days) => {
    const dStr = new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
    if (days < 0) return isAr ? `متأخر ${Math.abs(days)} يوم` : `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return isAr ? 'اليوم' : 'Today';
    if (days === 1) return isAr ? 'غدًا' : 'Tomorrow';
    return isAr ? `بعد ${days} يوم • ${dStr}` : `In ${days} days • ${dStr}`;
  };

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <BellRing size={18} className="animate-wiggle" style={{ color: 'var(--color-royal-green)' }} />
            {isAr ? 'المساعد الذكي للتذكيرات' : 'Smart Reminders'}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {isAr ? 'تطعيمات، صيانة الأجهزة، وفحوصات صحية' : 'Vaccinations, device maintenance, and health checkups'}
          </p>
        </div>
        <span
          className="px-2.5 py-1 text-[11px] font-bold rounded-full"
          style={{ background: 'var(--color-desert-gold)', color: 'var(--color-royal-green-dark)' }}
        >
          {items.length} {isAr ? 'تذكير' : 'items'}
        </span>
      </div>

      <ul className="space-y-2.5">
        {items.map((it) => {
          const days = daysFromNow(it.due);
          const s = toneStyles(it.tone, days);
          return (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                <it.Icon size={18} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
                  {it.type}
                </div>
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {it.title}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDue(it.due, days)}
                </div>
              </div>
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                className="text-[11px] px-2.5 py-1 rounded-lg font-semibold"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {isAr ? 'تم' : 'Done'}
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="flex items-center justify-center gap-2 text-sm py-6" style={{ color: 'var(--color-text-muted)' }}>
            <PartyPopper size={18} />
            {isAr ? 'لا توجد تذكيرات حالياً' : 'No active reminders'}
          </li>
        )}
      </ul>
    </section>
  );
}
