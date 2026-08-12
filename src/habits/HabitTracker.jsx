// src/habits/HabitTracker.jsx
// Full habit tracking page — score, streaks, targets, habits by category, export

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { HABITS, HABIT_CATEGORIES, getHabitsByCategory } from '../lib/habits';
import {
  getDayData, toggleHabit, updateHabitDetails,
  getDaysInRange, getTargets, saveTargets, toggleTargetDone,
} from '../lib/habitFirestore';
import {
  getTodayString, getTomorrowString, formatDateDisplay,
  calculatePercentage, getLastNDays, calculateStreak,
} from '../lib/habitUtils';

import DayScore      from './DayScore';
import StreakBadge   from './StreakBadge';
import HabitCard     from './HabitCard';
import TargetsSection from './TargetsSection';
import ExportModal   from './ExportModal';
import SpacedRepetition from './SpacedRepetition';

// Categories that are NOT relapses (rendered normally)
const NORMAL_CATEGORIES = HABIT_CATEGORIES.filter(c => c.id !== 'relapses');
const RELAPSE_CATEGORY  = HABIT_CATEGORIES.find(c => c.id === 'relapses');

export default function HabitTracker({ user }) {
  const [dayData,          setDayData]          = useState(null);
  const [streaks,          setStreaks]           = useState({ current: 0, longest: 0 });
  const [loading,          setLoading]           = useState(true);
  const [showExport,       setShowExport]        = useState(false);
  const [tomorrowTargets,  setTomorrowTargets]   = useState([]);
  const saveTimers = useRef({});
  const today      = getTodayString();

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data     = await getDayData(user.uid, today);
      setDayData(data);

      const last30   = getLastNDays(30);
      const allDays  = await getDaysInRange(user.uid, last30[0], last30[last30.length - 1]);
      setStreaks(calculateStreak(allDays));

      const tmrw     = getTomorrowString();
      const targets  = await getTargets(user.uid, tmrw);
      setTomorrowTargets(targets);
    } catch (err) {
      console.error('loadData error:', err);
      toast.error('Failed to load habit data');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Habit handlers ────────────────────────────────────────────────────────
  const handleToggle = async (habitId, currentState) => {
    // Optimistic update
    setDayData(prev => {
      const habits  = { ...prev.habits };
      habits[habitId] = { ...habits[habitId], done: !currentState, timestamp: !currentState ? new Date().toISOString() : null };
      return { ...prev, habits, score: Object.values(habits).filter(h => h.done).length };
    });
    try {
      await toggleHabit(user.uid, today, habitId, currentState);
      const habit = HABITS.find(h => h.id === habitId);
      if (!currentState) {
        if (habit?.isRelapse) {
          toast('Relapse logged. Stay strong 💪', { icon: '⚠️', duration: 2000 });
        } else {
          toast.success(`${habit?.emoji} Done!`, { duration: 1200 });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
      loadData();
    }
  };

  const handleUpdateDetails = useCallback((habitId, details) => {
    setDayData(prev => ({
      ...prev,
      habits: { ...prev.habits, [habitId]: { ...prev.habits[habitId], details } },
    }));
    if (saveTimers.current[habitId]) clearTimeout(saveTimers.current[habitId]);
    saveTimers.current[habitId] = setTimeout(async () => {
      try { await updateHabitDetails(user.uid, today, habitId, details); }
      catch (err) { console.error(err); }
    }, 1000);
  }, [user, today]);

  // ── Target handlers ───────────────────────────────────────────────────────
  const handleToggleTarget = async (index) => {
    setDayData(prev => {
      const targets = [...(prev.targets || [])];
      targets[index] = { ...targets[index], done: !targets[index].done };
      return { ...prev, targets };
    });
    try { await toggleTargetDone(user.uid, today, index); }
    catch (err) { console.error(err); loadData(); }
  };

  const handleAddTomorrowTarget = async (text) => {
    const tomorrow   = getTomorrowString();
    const newTargets = [...tomorrowTargets, { text, done: false }];
    setTomorrowTargets(newTargets);
    try {
      await saveTargets(user.uid, tomorrow, newTargets);
      toast.success('Target added!', { duration: 1200 });
    } catch (err) {
      console.error(err);
      setTomorrowTargets(tomorrowTargets);
      toast.error('Failed to save');
    }
  };

  const handleRemoveTomorrowTarget = async (index) => {
    const tomorrow   = getTomorrowString();
    const prev       = [...tomorrowTargets];
    const newTargets = tomorrowTargets.filter((_, i) => i !== index);
    setTomorrowTargets(newTargets);
    try { await saveTargets(user.uid, tomorrow, newTargets); }
    catch (err) { console.error(err); setTomorrowTargets(prev); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const score      = dayData?.score || 0;
  const percentage = calculatePercentage(score);
  const isAllDone  = score === HABITS.length;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // Relapse data for the separate section
  const relapseHabits = RELAPSE_CATEGORY ? getHabitsByCategory(RELAPSE_CATEGORY.id) : [];
  const relapseCount  = relapseHabits.filter(h => dayData?.habits?.[h.id]?.done).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="habits"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 pt-8 pb-24 max-w-2xl mx-auto"
    >
      {/* Header */}
      <header className="mb-6 pixel-card p-4 text-center">
        <p className="text-[#93c5fd] text-[8px] uppercase">{greeting()}, {user?.displayName?.split(' ')[0]} 👋</p>
        <h1 className="text-[12px] font-bold text-white text-shadow uppercase mt-1">{formatDateDisplay(today)}</h1>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[120, 100, 80, 80, 80].map((h, i) => (
            <div key={i} className="pixel-card animate-pulse"
                 style={{ height: h }} />
          ))}
        </div>
      ) : (
        <>
          {/* Score Card */}
          <div className="pixel-card p-5 mb-6">
            <div className="flex items-center gap-5">
              <DayScore score={score} total={HABITS.length} size={88} />
              <div>
                <p className={`text-[20px] font-black leading-none text-shadow
                  ${isAllDone ? 'text-[#22c55e]' : percentage >= 50 ? 'text-[#ef4444]' : 'text-white'}`}>
                  {percentage}%
                </p>
                <p className="text-[#93c5fd] text-[8px] mt-2 uppercase">{score} / {HABITS.length} DONE</p>
                <div className="mt-2">
                  <StreakBadge current={streaks.current} longest={streaks.longest} />
                </div>
              </div>
            </div>

            {isAllDone && (
              <div
                className="mt-4 flex items-center gap-3 px-4 py-3
                           bg-[#22c55e] border-4 border-black text-black"
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}
              >
                <span className="text-[14px]">🎉</span>
                <div>
                  <p className="font-bold text-[8px] uppercase">Mission Accomplished!</p>
                  <p className="text-[7px] uppercase mt-1">All {HABITS.length} habits completed.</p>
                </div>
              </div>
            )}
          </div>

          {/* Targets */}
          <TargetsSection
            todayTargets={dayData?.targets || []}
            tomorrowTargets={tomorrowTargets}
            onToggleTarget={handleToggleTarget}
            onAddTomorrowTarget={handleAddTomorrowTarget}
            onRemoveTomorrowTarget={handleRemoveTomorrowTarget}
          />

          {/* Spaced Repetition — Weekend Problem Review */}
          <SpacedRepetition user={user} />

          {/* Normal Habit Categories */}
          {NORMAL_CATEGORIES.map((category, catIdx) => {
            const categoryHabits = getHabitsByCategory(category.id);
            const catDone        = categoryHabits.filter(h => dayData?.habits?.[h.id]?.done).length;
            const catPct         = Math.round((catDone / categoryHabits.length) * 100);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.07 }}
                className="mb-5"
              >
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 border-2 border-black flex-shrink-0"
                       style={{ backgroundColor: category.color, boxShadow: `2px 2px 0px rgba(0,0,0,0.5)` }} />
                  <span className="text-[9px] font-bold text-white uppercase text-shadow">
                    {category.name}
                  </span>
                  <span className="text-[8px] text-white/50 ml-auto uppercase">{catDone} / {categoryHabits.length}</span>
                </div>

                {/* Category progress bar */}
                <div className="h-4 bg-black border-4 border-white mb-4 p-0.5" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${catPct}%`, backgroundColor: category.color }}
                  />
                </div>

                {/* Habit cards */}
                <div className="space-y-1.5">
                  {categoryHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      data={dayData?.habits?.[habit.id]}
                      onToggle={handleToggle}
                      onUpdateDetails={handleUpdateDetails}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* ── Relapse / Accountability Section ── */}
          {RELAPSE_CATEGORY && relapseHabits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NORMAL_CATEGORIES.length * 0.07 }}
              className="mb-5"
            >
              {/* Danger header */}
              <div className="pixel-card mb-4"
                   style={{ borderColor: '#991b1b', boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.5), inset 4px 4px 0px rgba(255,255,255,0.05), 4px 4px 0px #7f1d1d' }}>
                <div className="flex items-center gap-3 px-4 py-3 bg-red-900/40 border-b-4 border-red-950">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-[9px] font-bold text-red-400 uppercase text-shadow">
                    Accountability Tracker
                  </span>
                  {relapseCount === 0 && (
                    <span className="ml-auto text-[7px] text-emerald-400 uppercase font-bold px-2 py-1 bg-emerald-500/10 border border-emerald-500/30">
                      ✓ Clean Today
                    </span>
                  )}
                  {relapseCount > 0 && (
                    <span className="ml-auto text-[7px] text-red-400 uppercase font-bold px-2 py-1 bg-red-500/10 border border-red-500/30">
                      {relapseCount} relapse{relapseCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <p className="text-[7px] text-white/40 uppercase mb-3">
                    Log relapses honestly. Unchecked = Clean Day ✓
                  </p>
                  {relapseHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      data={dayData?.habits?.[habit.id]}
                      onToggle={handleToggle}
                      onUpdateDetails={handleUpdateDetails}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Export button */}
          <button
            onClick={() => setShowExport(true)}
            className="btn-ghost w-full flex items-center justify-center gap-3 mt-6 text-[10px]"
          >
            <FileText className="w-5 h-5" />
            EXPORT DAILY REPORT
          </button>
        </>
      )}

      {/* Export modal */}
      <AnimatePresence>
        {showExport && (
          <ExportModal
            key="export"
            dayData={dayData}
            userName={user?.displayName}
            tomorrowTargets={tomorrowTargets}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
