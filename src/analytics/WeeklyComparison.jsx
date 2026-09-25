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
    <div className="bg-gray-100 border-[3px] border-black p-3 shadow-[4px_4px_0px_#dc2626]">
      <p className="text-black/50 text-xs uppercase mb-2">{label}</p>
      <p className="text-black font-bold text-xs uppercase">{payload[0].value}H focused</p>
    </div>
  );
};

export default function WeeklyComparison({ sessions }) {
  const data = buildData(sessions);
  const hasData = data.some(d => d.hours > 0);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-black uppercase ">Weekly Comparison</h3>
        <p className="text-xs text-black/50 uppercase mt-1">Last 4 weeks • Focus hours</p>
      </div>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 6, fontFamily: '"Press Start 2P", monospace' }}
              axisLine={false} tickLine={false}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: '"Press Start 2P", monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="hours" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isCurrentWeek ? '#dc2626' : '#3b82f6'}
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
    <div className="flex flex-col items-center justify-center h-[160px] text-black/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-xs uppercase">No weekly data yet</p>
    </div>
  );
}
