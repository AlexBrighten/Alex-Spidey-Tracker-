// src/habits/DayScore.jsx
// Animated SVG ring showing today's habit completion score

export default function DayScore({ score, total = 15, size = 96 }) {
  const percentage      = total > 0 ? Math.round((score / total) * 100) : 0;
  const strokeW         = 5;
  const radius          = (size - strokeW * 2) / 2;
  const circumference   = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80 ? '#22c55e' :
    percentage >= 60 ? '#a855f7' :
    percentage >= 40 ? '#f59e0b' :
    percentage > 0   ? '#ef4444' : '#2a2a3a';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white leading-none tabular-nums"
              style={{ fontSize: size * 0.26 }}>
          {score}
        </span>
        <span className="text-white/30 font-medium leading-none"
              style={{ fontSize: size * 0.12 }}>
          of {total}
        </span>
      </div>
    </div>
  );
}
