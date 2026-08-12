// src/analytics/FocusByDay.jsx
// Bar chart: focus hours per day for the last 30 days, stacked by category

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

const CATEGORY_COLORS = {
  'Core Java & DSA':   '#3b82f6',
  'MERN Backend':      '#22c55e',
  'CS Fundamentals':   '#a855f7',
  'System Design':     '#f59e0b',
};
const DEFAULT_COLOR = '#6366f1';

function buildData(sessions) {
  // Last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const byDay = {};
  sessions.forEach(s => {
    const date = s.timestamp?.toDate?.() ?? new Date(s.timestamp);
    const key  = format(date, 'yyyy-MM-dd');
    byDay[key] = (byDay[key] || 0) + s.durationMinutes / 60;
  });

  return days.map(d => ({
    label: format(parseISO(d), 'd MMM'),
    hours: parseFloat((byDay[d] || 0).toFixed(2)),
    date:  d,
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length || !payload[0].value) return null;
  return (
    <div className="bg-black border-4 border-white p-3 shadow-[4px_4px_0px_#ef4444]">
      <p className="text-[#93c5fd] text-[8px] uppercase mb-2">{label}</p>
      <p className="text-white font-bold text-[8px] uppercase">{payload[0].value}H FOCUSED</p>
    </div>
  );
};

export default function FocusByDay({ sessions }) {
  const data = buildData(sessions);
  const hasData = data.some(d => d.hours > 0);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Focus Hours — Last 30 Days</h3>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Daily time invested</p>
      </div>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={12}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }}
              axisLine={false} tickLine={false}
              interval={4}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
            <Bar dataKey="hours" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.hours > 0 ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[180px] text-white/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-[8px] uppercase">No sessions logged</p>
    </div>
  );
}
