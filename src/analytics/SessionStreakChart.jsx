// src/analytics/SessionStreakChart.jsx
// Shows daily study streak with a heatmap-style bar chart for the last 30 days
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

function buildData(sessions) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const label = format(d, 'd');
    
    const daySessions = sessions.filter(s => {
      const sd = s.timestamp?.toDate?.() ?? new Date(s.timestamp);
      return format(sd, 'yyyy-MM-dd') === dateStr;
    });
    
    const sessionCount = daySessions.length;
    const totalMin = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    
    days.push({ label, date: dateStr, sessions: sessionCount, minutes: totalMin });
  }
  return days;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-100 border-[3px] border-black p-3 shadow-[4px_4px_0px_#dc2626]">
      <p className="text-black/50 text-xs uppercase mb-2">{d.date}</p>
      <p className="text-black font-bold text-xs uppercase">{d.sessions} sessions</p>
      <p className="text-black/60 text-xs uppercase">{d.minutes} min total</p>
    </div>
  );
};

export default function SessionStreakChart({ sessions }) {
  const data = buildData(sessions);
  const hasData = data.some(d => d.sessions > 0);

  // Calculate current streak
  let currentStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].sessions > 0) currentStreak++;
    else break;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-black uppercase ">Daily Activity</h3>
          <p className="text-xs text-black/50 uppercase mt-1">Sessions per day • 30 days</p>
        </div>
        {currentStreak > 0 && (
          <span className="text-xs font-bold px-2 py-1 bg-[#22c55e] border-2 border-black text-black uppercase"
                style={{ boxShadow: '2px 2px 0px #000' }}>
            🔥 {currentStreak}d streak
          </span>
        )}
      </div>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[120px] text-black/40">
          <p className="text-3xl mb-2">👾</p>
          <p className="text-xs uppercase">No activity yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 5, right: 0, left: -30, bottom: 0 }} barSize={6}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 6, fontFamily: '"Press Start 2P", monospace' }}
              axisLine={false} tickLine={false}
              interval={4}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="sessions" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.sessions === 0 ? 'rgba(0,0,0,0.06)' :
                        entry.sessions >= 3 ? '#22c55e' :
                        entry.sessions >= 2 ? '#a855f7' : '#3b82f6'}
                  stroke="#000"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
