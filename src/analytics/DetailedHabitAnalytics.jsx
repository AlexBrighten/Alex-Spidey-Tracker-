// src/analytics/DetailedHabitAnalytics.jsx
// Per-habit insights: completion rate, streaks, mini heatmap, relapse details

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Shield } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { HABITS, HABIT_CATEGORIES, getHabitsByCategory } from '../lib/habits';
import { calculateCleanStreak } from '../lib/habitUtils';

// Build per-habit stats from last N days of data
function buildHabitStats(habitDays, habit, days = 30) {
  const recent = habitDays.slice(-days);
  if (!recent.length) return { completionRate: 0, daysCompleted: 0, daysMissed: 0, streak: 0, bestStreak: 0, lastDone: null };

  let daysCompleted = 0, daysMissed = 0;
  let currentStreak = 0, bestStreak = 0, tempStreak = 0;
  let lastDone = null;

  // Sorted oldest to newest
  const sorted = [...recent].sort((a, b) => a.date.localeCompare(b.date));

  for (const day of sorted) {
    const done = day.habits?.[habit.id]?.done || false;
    // For relapse habits, "done" means they relapsed which is bad
    // For normal habits, "done" means they completed it which is good
    const isGood = habit.isRelapse ? !done : done;

    if (isGood) {
      daysCompleted++;
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
      if (!habit.isRelapse) {
        lastDone = day.date;
      }
    } else {
      daysMissed++;
      tempStreak = 0;
      if (habit.isRelapse && done) {
        lastDone = day.date; // Last relapse date
      }
    }
  }

  // Current streak: count backwards from most recent
  const reversed = [...sorted].reverse();
  currentStreak = 0;
  for (const day of reversed) {
    const done = day.habits?.[habit.id]?.done || false;
    const isGood = habit.isRelapse ? !done : done;
    if (isGood) currentStreak++;
    else break;
  }

  const completionRate = Math.round((daysCompleted / recent.length) * 100);

  return { completionRate, daysCompleted, daysMissed, streak: currentStreak, bestStreak, lastDone };
}

// Build 14-day mini heatmap data
function buildMiniHeatmap(habitDays, habit) {
  const byDay = {};
  habitDays.forEach(d => { byDay[d.date] = d; });

  return Array.from({ length: 14 }, (_, i) => {
    const dateStr = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
    const day = byDay[dateStr];
    const done = day?.habits?.[habit.id]?.done || false;
    const hasData = !!day;
    const isGood = habit.isRelapse ? !done : done;
    return { date: dateStr, label: format(parseISO(dateStr), 'd'), hasData, isGood, done };
  });
}

// Extract relapse triggers from habit data
function extractTriggers(habitDays, habitId) {
  const triggers = [];
  for (const day of habitDays) {
    if (day.habits?.[habitId]?.done && day.habits?.[habitId]?.details?.trigger) {
      triggers.push({
        date: day.date,
        dateDisplay: format(parseISO(day.date), 'EEE, d MMM'),
        trigger: day.habits[habitId].details.trigger,
      });
    }
  }
  return triggers.reverse(); // Most recent first
}

function MiniHeatmap({ data, isRelapse }) {
  return (
    <div className="flex gap-0.5">
      {data.map((d, i) => (
        <div
          key={i}
          className="w-3.5 h-3.5 border border-black/50 relative group"
          title={`${format(parseISO(d.date), 'MMM d')} — ${!d.hasData ? 'No data' : d.isGood ? (isRelapse ? 'Clean' : 'Done') : (isRelapse ? 'Relapsed' : 'Missed')}`}
          style={{
            backgroundColor: !d.hasData
              ? 'rgba(255,255,255,0.04)'
              : d.isGood
                ? (isRelapse ? '#22c55e' : '#22c55e')
                : (isRelapse ? '#ef4444' : 'rgba(255,255,255,0.06)'),
          }}
        />
      ))}
    </div>
  );
}

function HabitInsightCard({ habit, stats, heatmapData }) {
  const isRelapse = habit.isRelapse || false;

  return (
    <div className={`px-4 py-3 border-b last:border-b-0 ${isRelapse ? 'border-red-500/10' : 'border-white/5'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-base leading-none">{habit.emoji}</span>
        <p className="text-[9px] font-bold text-white/85 uppercase flex-1">{habit.name}</p>
        <span className={`text-[10px] font-bold tabular-nums
          ${stats.completionRate >= 80 ? 'text-[#22c55e]'
          : stats.completionRate >= 50 ? 'text-[#f59e0b]'
          : 'text-[#ef4444]'}`}>
          {stats.completionRate}%
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-2 text-[7px] text-white/50 uppercase">
        <span>🔥 {stats.streak}d streak</span>
        <span>🏆 Best: {stats.bestStreak}d</span>
        <span>✅ {stats.daysCompleted}/{stats.daysCompleted + stats.daysMissed}</span>
      </div>

      {/* Mini heatmap */}
      <div className="flex items-center gap-2">
        <span className="text-[6px] text-white/30 uppercase">14d:</span>
        <MiniHeatmap data={heatmapData} isRelapse={isRelapse} />
      </div>
    </div>
  );
}

function RelapseInsightCard({ habit, stats, heatmapData, triggers }) {
  const [showTriggers, setShowTriggers] = useState(false);

  return (
    <div className="border-b border-red-500/10 last:border-b-0">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-base leading-none">{habit.emoji}</span>
          <p className="text-[9px] font-bold text-red-300 uppercase flex-1">{habit.name}</p>
          {stats.streak > 0 ? (
            <span className="text-[8px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 uppercase">
              {stats.streak}d clean
            </span>
          ) : (
            <span className="text-[8px] font-bold text-red-400 px-2 py-0.5 bg-red-500/10 border border-red-500/25 uppercase">
              Relapsed today
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-2 text-[7px] text-white/50 uppercase">
          <span><Shield className="w-3 h-3 inline mr-1 text-emerald-400" />Best: {stats.bestStreak}d clean</span>
          <span className="text-red-400">⚠ {stats.daysMissed} relapses</span>
          <span>Clean rate: {stats.completionRate}%</span>
        </div>

        {/* Mini heatmap */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[6px] text-white/30 uppercase">14d:</span>
          <MiniHeatmap data={heatmapData} isRelapse={true} />
        </div>

        {/* Trigger history toggle */}
        {triggers.length > 0 && (
          <button
            onClick={() => setShowTriggers(!showTriggers)}
            className="flex items-center gap-1 text-[7px] text-red-400/60 hover:text-red-400 uppercase mt-1"
          >
            {showTriggers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {triggers.length} trigger{triggers.length > 1 ? 's' : ''} logged
          </button>
        )}
      </div>

      {/* Triggers list */}
      <AnimatePresence>
        {showTriggers && triggers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5">
              {triggers.map((t, i) => (
                <div key={i} className="flex gap-2 items-start px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <span className="text-[7px] text-red-400/50 uppercase flex-shrink-0 mt-0.5">{t.dateDisplay}</span>
                  <p className="text-[8px] text-white/60 leading-relaxed">{t.trigger}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DetailedHabitAnalytics({ habitDays, onBack }) {
  const [expandedCat, setExpandedCat] = useState(() => {
    const map = {};
    HABIT_CATEGORIES.forEach(c => { map[c.id] = true; });
    return map;
  });

  const toggleCat = (id) => setExpandedCat(prev => ({ ...prev, [id]: !prev[id] }));

  const normalCategories = HABIT_CATEGORIES.filter(c => c.id !== 'relapses');
  const relapseCategory  = HABIT_CATEGORIES.find(c => c.id === 'relapses');
  const relapseHabits    = getHabitsByCategory('relapses');

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
    >
      {/* Back button + header */}
      <button onClick={onBack} className="btn-ghost text-[8px] px-3 py-2 mb-4">
        ← Back to Overview
      </button>

      <div className="pixel-card p-4 mb-5">
        <h2 className="text-[11px] font-bold text-white uppercase text-shadow">Detailed Habit Insights</h2>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Per-habit breakdown — Last 30 tracked days</p>
      </div>

      {/* Normal habit categories */}
      {normalCategories.map(category => {
        const categoryHabits = getHabitsByCategory(category.id);
        const isExpanded     = expandedCat[category.id];

        return (
          <div key={category.id} className="pixel-card mb-4 overflow-hidden">
            <button
              onClick={() => toggleCat(category.id)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-black/30 border-b-4 border-black"
            >
              <div className="w-3 h-3 border-2 border-black flex-shrink-0"
                   style={{ backgroundColor: category.color, boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }} />
              <span className="text-[9px] font-bold text-white uppercase text-shadow flex-1 text-left">
                {category.name}
              </span>
              <span className="text-[7px] text-white/40 uppercase mr-2">
                {categoryHabits.length} habits
              </span>
              {isExpanded ? <ChevronUp className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {categoryHabits.map(habit => (
                    <HabitInsightCard
                      key={habit.id}
                      habit={habit}
                      stats={buildHabitStats(habitDays, habit)}
                      heatmapData={buildMiniHeatmap(habitDays, habit)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Relapse / Accountability section */}
      {relapseCategory && relapseHabits.length > 0 && (
        <div className="pixel-card mb-4 overflow-hidden"
             style={{ borderColor: '#991b1b', boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.5), inset 4px 4px 0px rgba(255,255,255,0.05), 4px 4px 0px #7f1d1d' }}>
          <button
            onClick={() => toggleCat('relapses')}
            className="w-full flex items-center gap-2 px-4 py-3 bg-red-900/30 border-b-4 border-red-950"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-[9px] font-bold text-red-400 uppercase text-shadow flex-1 text-left">
              Accountability
            </span>
            {expandedCat['relapses']
              ? <ChevronUp className="w-3 h-3 text-red-400/40" />
              : <ChevronDown className="w-3 h-3 text-red-400/40" />}
          </button>

          <AnimatePresence>
            {expandedCat['relapses'] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {relapseHabits.map(habit => {
                  const cleanStreak = calculateCleanStreak(habitDays, habit.id);
                  const stats = buildHabitStats(habitDays, habit);
                  return (
                    <RelapseInsightCard
                      key={habit.id}
                      habit={habit}
                      stats={{ ...stats, daysMissed: cleanStreak.totalRelapses }}
                      heatmapData={buildMiniHeatmap(habitDays, habit)}
                      triggers={extractTriggers(habitDays, habit.id)}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
