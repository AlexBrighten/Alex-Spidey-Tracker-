// src/analytics/GoalChart.jsx
// Cumulative focus hours vs. required pace line toward 800hrs by Jan 1, 2027

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { differenceInDays, parseISO, startOfDay, addDays, format } from 'date-fns';

const GOAL     = 800;
const DEADLINE = new Date('2027-01-01T00:00:00');

function buildChartData(sessions) {
  if (!sessions.length) return [];

  const sorted = [...sessions].sort((a, b) => {
    const ta = a.timestamp?.toDate?.() ?? new Date(a.timestamp);
    const tb = b.timestamp?.toDate?.() ?? new Date(b.timestamp);
    return ta - tb;
  });

  const startDate = startOfDay(sorted[0].timestamp?.toDate?.() ?? new Date(sorted[0].timestamp));
  const totalDaysToDeadline = differenceInDays(DEADLINE, startDate) || 1; // avoid division by zero

  const dailyHours = {};
  sorted.forEach(s => {
    const d = startOfDay(s.timestamp?.toDate?.() ?? new Date(s.timestamp));
    const key = format(d, 'yyyy-MM-dd');
    dailyHours[key] = (dailyHours[key] || 0) + (s.durationMinutes / 60);
  });

  const lastDate = startOfDay(sorted[sorted.length - 1].timestamp?.toDate?.() ?? new Date(sorted[sorted.length - 1].timestamp));
  const today = startOfDay(new Date());
  const endDate = today > lastDate ? today : lastDate;
  
  const totalDaysElapsed = differenceInDays(endDate, startDate);

  let cumulative = 0;
  const data = [];

  for (let i = 0; i <= totalDaysElapsed; i++) {
    const current = addDays(startDate, i);
    const key = format(current, 'yyyy-MM-dd');
    
    cumulative += (dailyHours[key] || 0);
    const pace = parseFloat(((GOAL * i) / totalDaysToDeadline).toFixed(2));
    
    data.push({
      label: format(current, 'dd MMM'),
      actual: parseFloat(cumulative.toFixed(2)),
      pace: Math.min(pace, GOAL),
    });
  }

  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-100 border-[3px] border-black p-3 shadow-[4px_4px_0px_#dc2626]">
      <p className="text-black/50 text-xs uppercase mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mt-1 text-xs uppercase">
          <span className="w-2 h-2 border border-black" style={{ background: p.color }} />
          <span className="text-black/80">{p.name}:</span>
          <span className="text-black font-bold">{p.value}H</span>
        </div>
      ))}
    </div>
  );
};

export default function GoalChart({ sessions }) {
  const data = buildChartData(sessions);
  if (!data.length) return <EmptyState />;
  const currentHours = data[data.length - 1]?.actual ?? 0;
  const isAhead = data[data.length - 1]?.actual >= data[data.length - 1]?.pace;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-black uppercase ">800-Hour Goal Progress</h3>
          <p className="text-xs text-black/50 uppercase mt-1">Actual cumulative vs. pace</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 uppercase border-2 border-black
          ${isAhead
            ? 'bg-[#22c55e] text-black'
            : 'bg-[#f97316] text-black'}`}
          style={{ boxShadow: '2px 2px 0px #000' }}>
          {isAhead ? '▲ AHEAD' : '▼ BEHIND'} PACE
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} domain={[0, GOAL]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 2, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ fontSize: 8, color: '#fff', paddingTop: 8, fontFamily: '"Press Start 2P", monospace' }} />
          <ReferenceLine y={GOAL} stroke="#fff" strokeWidth={2} strokeDasharray="4 4" label={{ value: '800H GOAL', fill: '#fff', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} />
          <Area type="stepAfter" dataKey="pace"   name="Req. Pace" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.2} dot={false} />
          <Area type="stepAfter" dataKey="actual" name="Actual"  stroke="#dc2626" strokeWidth={3} fill="#dc2626" fillOpacity={0.5} dot={false} activeDot={{ r: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] text-black/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-xs uppercase">No data yet</p>
    </div>
  );
}
