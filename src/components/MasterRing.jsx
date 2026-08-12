// src/components/MasterRing.jsx
// Main SVG progress ring + pace indicator cards

import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { TrendingUp, Clock, Calendar, Target } from 'lucide-react';
import { GOAL_HOURS } from '../hooks/useSessions';

const RADIUS    = 90;
const STROKE    = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MasterRing({ stats }) {
  const {
    totalHours,
    hoursLeft,
    daysLeft,
    requiredHoursPerDay,
    progressPercent,
  } = stats;

  const prevPercent = useRef(0);

  // Animate strokeDashoffset
  const dashOffset = useMotionValue(CIRCUMFERENCE);
  const smoothDash = useSpring(dashOffset, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const target = CIRCUMFERENCE - (progressPercent / 100) * CIRCUMFERENCE;
    animate(dashOffset, target, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    prevPercent.current = progressPercent;
  }, [progressPercent, dashOffset]);

  const isOnTrack = requiredHoursPerDay <= 4;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Retro Health Bar Progress */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[8px] text-[#93c5fd] uppercase">Progress</span>
          <span className="text-[8px] text-white uppercase">{totalHours.toFixed(1)} / {GOAL_HOURS} HRS</span>
        </div>
        
        <div className="w-full h-8 bg-black border-4 border-white p-1" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
          <div 
            className="h-full bg-[#ef4444] transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Grid pattern overlay for segments */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          </div>
        </div>
        <div className="text-center mt-2 text-[10px] text-[#ef4444] text-shadow">
          {progressPercent.toFixed(1)}% COMPLETE
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <StatCard
          label="Hours Left"
          value={hoursLeft.toFixed(1)}
          unit="hrs"
          color="text-[#93c5fd]"
        />
        <StatCard
          label="Days Left"
          value={daysLeft}
          unit="days"
          color="text-[#a855f7]"
        />
        <StatCard
          label="Needed/Day"
          value={requiredHoursPerDay.toFixed(2)}
          unit="hrs/d"
          color={isOnTrack ? 'text-[#22c55e]' : 'text-[#f97316]'}
        />
        <StatCard
          label="Goal"
          value="Jan 1"
          unit="2027"
          color="text-[#ef4444]"
        />
      </div>

      {/* Pace banner */}
      <div className={`w-full border-4 border-black p-4 text-[9px] uppercase text-center
        ${isOnTrack
          ? 'bg-[#22c55e] text-black'
          : 'bg-[#f97316] text-black'}`}
        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}
      >
        {isOnTrack
          ? `ON TRACK: ${requiredHoursPerDay.toFixed(2)} HRS/DAY NEEDED`
          : `BEHIND: ${requiredHoursPerDay.toFixed(2)} HRS/DAY NEEDED`}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className={`bg-[#2a2a35] border-4 border-black p-4 flex flex-col items-center justify-center`} style={{ boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.5), inset 2px 2px 0px rgba(255,255,255,0.1), 4px 4px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-[7px] text-white/50 uppercase mb-2 text-center">{label}</div>
      <div className={`text-[12px] font-bold ${color} text-shadow text-center`}>{value}</div>
      <div className="text-[7px] text-white/30 uppercase mt-1 text-center">{unit}</div>
    </div>
  );
}
