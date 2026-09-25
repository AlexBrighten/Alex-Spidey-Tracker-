// src/habits/StreakBadge.jsx
import { Flame, Trophy } from 'lucide-react';

export default function StreakBadge({ current, longest }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                       bg-[#dc2626] border-[2px] border-black text-white shadow-[2px_2px_0px_#000]">
        <Flame className="w-3.5 h-3.5" />
        {current} day{current !== 1 ? 's' : ''}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                       bg-[#f59e0b] border-[2px] border-black text-black shadow-[2px_2px_0px_#000]">
        <Trophy className="w-3.5 h-3.5" />
        Best: {longest}
      </span>
    </div>
  );
}
