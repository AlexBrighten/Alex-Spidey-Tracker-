// src/analytics/HeatmapGrid.jsx
// 12-week calendar heatmap of daily habit scores (Mon–Sun columns)

import { useState } from 'react';
import { format, subDays, startOfWeek, addDays, parseISO } from 'date-fns';
import { HABITS } from '../lib/habits';

const TOTAL     = HABITS.length;
const WEEKS     = 12;
const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getColor(score, hasData) {
  if (!hasData) return 'rgba(255,255,255,0.04)';
  if (score === 0)              return 'rgba(255,255,255,0.06)';
  const pct = score / TOTAL;
  if (pct >= 0.85)  return '#22c55e';  // green
  if (pct >= 0.65)  return '#a855f7';  // purple
  if (pct >= 0.40)  return '#f59e0b';  // amber
  return '#ef4444';                      // red
}

function buildGrid(habitDays) {
  const byDay = {};
  habitDays.forEach(d => { byDay[d.date] = d.score ?? 0; });

  // Find the Monday 12 weeks ago
  const today      = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const startDay   = addDays(thisMonday, -(WEEKS - 1) * 7);

  // Build weeks × days grid
  const grid = [];
  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date    = addDays(startDay, w * 7 + d);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isFuture = date > today;
      week.push({
        date:    dateStr,
        display: format(date, 'MMM d'),
        score:   byDay[dateStr] ?? 0,
        hasData: dateStr in byDay,
        isFuture,
      });
    }
    grid.push(week);
  }
  return { grid, startDay };
}

export default function HeatmapGrid({ habitDays }) {
  const [tooltip, setTooltip] = useState(null);
  const { grid, startDay } = buildGrid(habitDays);

  // Month labels: find which weeks start a new month
  const monthLabels = [];
  grid.forEach((week, wi) => {
    const monthStr = format(parseISO(week[0].date), 'MMM');
    if (wi === 0 || monthStr !== format(parseISO(grid[wi - 1][0].date), 'MMM')) {
      monthLabels.push({ wi, label: monthStr });
    }
  });

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-white uppercase text-shadow">12-Week Habit Heatmap</h3>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Daily consistency</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 pl-5">
            {grid.map((week, wi) => {
              const ml = monthLabels.find(m => m.wi === wi);
              return (
                <div key={wi} className="w-4 text-center">
                  {ml && <span className="text-[6px] uppercase text-white/50">{ml.label}</span>}
                </div>
              );
            })}
          </div>

          {/* Day rows */}
          {Array.from({ length: 7 }, (_, di) => (
            <div key={di} className="flex items-center gap-1">
              <span className="text-[6px] uppercase text-white/40 w-4 text-right">{DAY_NAMES[di]}</span>
              {grid.map((week, wi) => {
                const cell = week[di];
                if (!cell) return <div key={wi} className="w-4 h-4" />;
                const color = getColor(cell.score, cell.hasData);
                const opacity = cell.isFuture ? 0 : 1;
                return (
                  <div
                    key={wi}
                    className="w-4 h-4 cursor-pointer transition-none hover:border hover:border-white relative"
                    style={{ backgroundColor: color, opacity }}
                    onMouseEnter={(e) => setTooltip({ cell, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 pt-3 pl-5">
            <span className="text-[6px] uppercase text-white/40">Less</span>
            {['rgba(255,255,255,0.06)', '#ef4444', '#f59e0b', '#a855f7', '#22c55e'].map((c, i) => (
              <div key={i} className="w-3 h-3 border border-black" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[6px] uppercase text-white/40">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-black border-4 border-white p-2 shadow-[4px_4px_0px_#ef4444]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 48 }}
        >
          <p className="text-[#93c5fd] text-[7px] uppercase">{tooltip.cell.display}</p>
          {tooltip.cell.hasData
            ? <p className="text-white font-bold mt-1 text-[7px] uppercase">{tooltip.cell.score}/{TOTAL} HABITS</p>
            : <p className="text-white/40 mt-1 text-[7px] uppercase">NO DATA</p>}
        </div>
      )}
    </div>
  );
}
