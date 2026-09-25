// src/analytics/CategoryBars.jsx
// Horizontal bar chart: avg habit completion % per category (last 30 tracked days)

import { HABIT_CATEGORIES, HABITS } from '../lib/habits';

function buildData(habitDays) {
  const recentDays = habitDays.slice(-30);
  if (!recentDays.length) return [];

  return HABIT_CATEGORIES.map(cat => {
    const catHabits = HABITS.filter(h => h.category === cat.id);
    const total     = catHabits.length;

    const avgPct = recentDays.reduce((sum, day) => {
      const done = catHabits.filter(h => {
        const data = day.habits?.[h.id];
        if (!data) return false;
        return data.done;
      }).length;
      return sum + (done / total) * 100;
    }, 0) / recentDays.length;

    return {
      name: cat.name,
      icon: cat.icon,
      pct: Math.round(avgPct),
    };
  });
}

export default function CategoryBars({ habitDays }) {
  const data    = buildData(habitDays);
  const hasData = habitDays.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-bold text-black uppercase">Habit Category Averages</h3>
        <p className="text-xs text-black/50 uppercase mt-1 font-bold">Avg completion % (last 30 days)</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[120px] text-black/40">
          <p className="text-3xl mb-2">👾</p>
          <p className="text-xs uppercase">No habit data yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(cat => (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-black font-bold uppercase">
                  {cat.name}
                </span>
                <span className="text-sm font-bold tabular-nums"
                      style={{ color: cat.color }}>
                  {cat.pct}%
                </span>
              </div>
              <div className="h-5 bg-gray-100 border-[3px] border-black rounded-full p-0.5" style={{ boxShadow: '2px 2px 0px #000' }}>
                <div
                  className="h-full transition-none"
                  style={{
                    width: `${cat.pct}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
