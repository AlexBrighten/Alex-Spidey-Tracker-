// src/habits/StreakBadge.jsx
import { Flame, Trophy } from 'lucide-react';

export default function StreakBadge({ current, longest }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                       bg-purple-500/15 border border-purple-500/25 text-purple-300">
        <Flame className="w-3 h-3" />
        {current} day{current !== 1 ? 's' : ''}
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                       bg-orange-500/15 border border-orange-500/25 text-orange-300">
        <Trophy className="w-3 h-3" />
        Best: {longest}
      </span>
    </div>
  );
}
