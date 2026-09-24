// src/analytics/WeeklyComparison.jsx
// Week-over-week focus hours comparison bar chart
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfWeek, addDays, differenceInDays } from 'date-fns';

function buildData(sessions) {
  const today = new Date();
  const weeks = [];
  
  for (let w = 3; w >= 0; w--) {
    const weekStart = startOfWeek(subDays(today, w * 7), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const label = `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM')}`;
    
    const weekHours = sessions.reduce((sum, s) => {
      const d = s.timestamp?.toDate?.() ?? new Date(s.timestamp);
      if (d >= weekStart && d <= addDays(weekEnd, 1)) {
        return sum + (s.durationMinutes || 0) / 60;
      }
      return sum;
    }, 0);
    
    weeks.push({ label, hours: parseFloat(weekHours.toFixed(1)), isCurrentWeek: w === 0 });
  }
  
  return weeks;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border-4 border-white p-3 shadow-[4px_4px_0px_#ef4444]">
      <p className="text-[#93c5fd] text-[7px] uppercase mb-2">{label}</p>
      <p className="text-white font-bold text-[8px] uppercase">{payload[0].value}H focused</p>
    </div>
  );
};

export default function WeeklyComparison({ sessions }) {
  const data = buildData(sessions);
  const hasData = data.some(d => d.hours > 0);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Weekly Comparison</h3>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Last 4 weeks • Focus hours</p>
      </div>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 6, fontFamily: '"Press Start 2P", monospace' }}
              axisLine={false} tickLine={false}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="hours" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isCurrentWeek ? '#ef4444' : '#3b82f6'}
                  stroke="#000"
                  strokeWidth={2}
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
    <div className="flex flex-col items-center justify-center h-[160px] text-white/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-[8px] uppercase">No weekly data yet</p>
    </div>
  );
}
