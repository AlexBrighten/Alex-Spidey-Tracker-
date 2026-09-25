// src/analytics/StatCard.jsx
export default function StatCard({ icon, label, value, unit, sub, color = 'brand' }) {
  const colorMap = {
    brand:   { border: '#dc2626', text: 'text-[#dc2626]', bg: '#dc2626' },
    blue:    { border: '#2563eb', text: 'text-[#2563eb]', bg: '#2563eb' },
    emerald: { border: '#16a34a', text: 'text-[#16a34a]', bg: '#16a34a' },
    purple:  { border: '#7c3aed', text: 'text-[#7c3aed]', bg: '#7c3aed' },
    orange:  { border: '#ea580c', text: 'text-[#ea580c]', bg: '#ea580c' },
    cyan:    { border: '#0891b2', text: 'text-[#0891b2]', bg: '#0891b2' },
  };
  const c = colorMap[color] ?? colorMap.brand;

  return (
    <div
      className="bg-white border-[3px] border-black rounded-xl p-4 flex flex-col"
      style={{ boxShadow: `4px 4px 0px ${c.border}` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 border-[3px] border-black rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: c.bg + '22' }}
        >
          {icon}
        </div>
        <p className="text-black/50 text-xs uppercase font-bold leading-tight">{label}</p>
      </div>

      <div className="flex items-end gap-2 mt-auto">
        <span className={`text-2xl font-bold ${c.text}`}>{value}</span>
        {unit && <span className="text-black/40 text-xs uppercase mb-0.5 font-bold">{unit}</span>}
      </div>

      {sub && <p className="text-black/30 text-xs uppercase mt-2 font-bold">{sub}</p>}
    </div>
  );
}
