// src/analytics/DayGoalsAnalytics.jsx
// Shows day goals completion stats across time
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { format, subDays, parseISO } from 'date-fns';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';

async function fetchGoalDays(uid, days = 30) {
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');
  
  const q = query(
    collection(db, 'dayGoals'),
    where('uid', '==', uid),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date));
}

export default function DayGoalsAnalytics({ uid }) {
  const [goalDays, setGoalDays] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!uid) return;
    fetchGoalDays(uid).then(data => {
      setGoalDays(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [uid]);

  if (loading) return <div className="pixel-card animate-pulse h-32" />;

  const daysWithGoals = goalDays.filter(d => d.goals?.length > 0);
  const totalGoals = daysWithGoals.reduce((sum, d) => sum + (d.goals?.length || 0), 0);
  const completedGoals = daysWithGoals.reduce((sum, d) =>
    sum + (d.goals?.filter(g => g.done)?.length || 0), 0
  );
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const perfectDays = daysWithGoals.filter(d => {
    const goals = d.goals || [];
    return goals.length > 0 && goals.every(g => g.done);
  }).length;

  if (daysWithGoals.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-[#ef4444]" />
          <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Day Goals Tracker</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[100px] text-white/40">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-[8px] uppercase">Start setting day goals to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#ef4444]" />
        <div>
          <h3 className="text-[10px] font-bold text-white uppercase text-shadow">Day Goals Tracker</h3>
          <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Last 30 days performance</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-black border-2 border-white/20 p-3 text-center">
          <p className="text-[14px] font-bold text-[#ef4444] text-shadow">{completionRate}%</p>
          <p className="text-[6px] text-white/40 uppercase mt-1">Completion</p>
        </div>
        <div className="bg-black border-2 border-white/20 p-3 text-center">
          <p className="text-[14px] font-bold text-[#22c55e] text-shadow">{perfectDays}</p>
          <p className="text-[6px] text-white/40 uppercase mt-1">Perfect Days</p>
        </div>
        <div className="bg-black border-2 border-white/20 p-3 text-center">
          <p className="text-[14px] font-bold text-[#93c5fd] text-shadow">{completedGoals}/{totalGoals}</p>
          <p className="text-[6px] text-white/40 uppercase mt-1">Goals Done</p>
        </div>
      </div>

      {/* Mini timeline of last 14 days */}
      <div className="flex gap-1">
        {Array.from({ length: 14 }, (_, i) => {
          const dateStr = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
          const dayData = goalDays.find(d => d.date === dateStr);
          const goals = dayData?.goals || [];
          const total = goals.length;
          const done = goals.filter(g => g.done).length;
          const pct = total > 0 ? done / total : 0;
          
          let color = 'rgba(255,255,255,0.04)';
          if (total > 0) {
            if (pct >= 1) color = '#22c55e';
            else if (pct >= 0.5) color = '#f59e0b';
            else color = '#ef4444';
          }
          
          return (
            <div
              key={i}
              className="flex-1 h-3 border border-black/50"
              title={`${format(parseISO(dateStr), 'MMM d')}: ${done}/${total} goals`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[5px] text-white/30 uppercase">14 days ago</span>
        <span className="text-[5px] text-white/30 uppercase">Today</span>
      </div>
    </div>
  );
}
