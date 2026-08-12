// src/analytics/CategoryDonut.jsx
// Donut chart: total focus hours per category

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORIES = [
  { key: 'Core Java & DSA',  color: '#3b82f6' },
  { key: 'MERN Backend',     color: '#22c55e' },
  { key: 'CS Fundamentals',  color: '#a855f7' },
  { key: 'System Design',    color: '#f59e0b' },
];

function buildData(sessions) {
  const totals = {};
  sessions.forEach(s => {
    totals[s.category] = (totals[s.category] || 0) + s.durationMinutes / 60;
  });

  return CATEGORIES
    .map(c => ({ name: c.key, value: parseFloat((totals[c.key] || 0).toFixed(2)), color: c.color }))
    .filter(c => c.value > 0);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-black border-4 border-white p-3 shadow-[4px_4px_0px_#ef4444]">
      <p className="text-[#93c5fd] text-[8px] uppercase mb-2">{name}</p>
      <p className="text-white font-bold text-[8px] uppercase">{value}H</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r     = innerRadius + (outerRadius - innerRadius) * 0.5;
  const rads  = (-midAngle * Math.PI) / 180;
  const x     = cx + r * Math.cos(rads);
  const y     = cy + r * Math.sin(rads);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={7} fontFamily='"Press Start 2P", monospace'>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function CategoryDonut({ sessions }) {
  const data = buildData(sessions);
  if (!data.length) return <EmptyState />;
  const total = data.reduce((a, c) => a + c.value, 0);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Focus by Category</h3>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Total: {total.toFixed(1)} hours</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={75}
                paddingAngle={0}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#000" strokeWidth={4} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 min-w-0">
          {data.map(c => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-black flex-shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" style={{ background: c.color }} />
              <span className="text-white/80 text-[7px] uppercase truncate flex-1">{c.name}</span>
              <span className="text-white font-bold text-[8px] uppercase tabular-nums">{c.value}H</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[160px] text-white/40">
      <p className="text-3xl mb-2">👾</p>
      <p className="text-[8px] uppercase">No category data</p>
    </div>
  );
}
