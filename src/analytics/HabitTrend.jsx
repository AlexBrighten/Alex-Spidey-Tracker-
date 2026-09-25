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
    <div className="bg-gray-100 border-[3px] border-black p-3 shadow-[4px_4px_0px_#dc2626]">
      <p className="text-black/50 text-xs uppercase mb-2">{label}</p>
      {v != null
        ? <><p className="text-black font-bold text-xs uppercase">{v}%</p><p className="text-black/80 text-xs mt-1">{payload[0].payload.score}/{TOTAL} HABITS</p></>
        : <p className="text-black/40 text-xs uppercase">NO DATA</p>}
    </div>
  );
};

export default function HabitTrend({ habitDays }) {
  const data    = buildData(habitDays);
  const hasData = data.some(d => d.pct != null);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-black uppercase ">Habit Score — Last 14 Days</h3>
        <p className="text-xs text-black/50 uppercase mt-1">Daily completion</p>
      </div>
      {!hasData ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.08)" vertical={false} />
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
    <div className="flex flex-col items-center justify-center h-[170px] text-black/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-xs uppercase">No habit data</p>
    </div>
  );
}
