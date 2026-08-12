// src/analytics/StatCard.jsx
export default function StatCard({ icon, label, value, unit, sub, color = 'brand' }) {
  const colorMap = {
    brand:   { border: 'border-[#ef4444]', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]' },
    blue:    { border: 'border-[#3b82f6]', text: 'text-[#93c5fd]', bg: 'bg-[#3b82f6]' },
    emerald: { border: 'border-[#22c55e]', text: 'text-[#4ade80]', bg: 'bg-[#22c55e]' },
    purple:  { border: 'border-[#a855f7]', text: 'text-[#d8b4fe]', bg: 'bg-[#a855f7]' },
    orange:  { border: 'border-[#f97316]', text: 'text-[#fdba74]', bg: 'bg-[#f97316]' },
    cyan:    { border: 'border-[#06b6d4]', text: 'text-[#67e8f9]', bg: 'bg-[#06b6d4]' },
  };
  const c = colorMap[color] ?? colorMap.brand;

  return (
    <div className={`bg-black border-4 border-white p-4 flex flex-col`} style={{ boxShadow: `4px 4px 0px ${c.bg.replace('bg-[', '').replace(']', '')}` }}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 border-4 border-black ${c.bg} flex items-center justify-center text-[12px] text-white shadow-[2px_2px_0px_#000]`}>
          {icon}
        </div>
        <p className="text-white/50 text-[8px] uppercase leading-tight font-bold">{label}</p>
      </div>
      
      <div className="flex items-end gap-2 mt-auto">
        <span className={`text-[16px] font-bold ${c.text} text-shadow`}>{value}</span>
        {unit && <span className="text-white/40 text-[7px] uppercase mb-1">{unit}</span>}
      </div>
      
      {sub && <p className="text-white/30 text-[7px] uppercase mt-2">{sub}</p>}
    </div>
  );
}
