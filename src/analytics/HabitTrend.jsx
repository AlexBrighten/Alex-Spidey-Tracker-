// src/analytics/HabitTrend.jsx
// Area chart: daily habit score % over last 14 days

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { HABITS } from '../lib/habits';

const TOTAL = HABITS.length;

function buildData(habitDays) {
  const last14 = Array.from({ length: 14 }, (_, i) =>
    format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
  );

  const byDay = {};
  habitDays.forEach(d => { byDay[d.date] = d; });

  return last14.map(d => ({
    label: format(parseISO(d), 'd MMM'),
    score: byDay[d]?.score ?? null,
    pct:   byDay[d] != null ? Math.round((byDay[d].score / TOTAL) * 100) : null,
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-black border-4 border-white p-3 shadow-[4px_4px_0px_#ef4444]">
      <p className="text-[#93c5fd] text-[8px] uppercase mb-2">{label}</p>
      {v != null
        ? <><p className="text-white font-bold text-[8px] uppercase">{v}%</p><p className="text-white/80 text-[7px] mt-1">{payload[0].payload.score}/{TOTAL} HABITS</p></>
        : <p className="text-white/40 text-[7px] uppercase">NO DATA</p>}
    </div>
  );
};

export default function HabitTrend({ habitDays }) {
  const data    = buildData(habitDays);
  const hasData = data.some(d => d.pct != null);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Habit Score — Last 14 Days</h3>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Daily completion</p>
      </div>
      {!hasData ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false}
                   tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Area
              type="stepAfter" dataKey="pct"
              stroke="#22c55e" strokeWidth={3}
              fill="#22c55e" fillOpacity={0.4}
              dot={false}
              activeDot={{ r: 0 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[170px] text-white/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-[8px] uppercase">No habit data</p>
    </div>
  );
}
