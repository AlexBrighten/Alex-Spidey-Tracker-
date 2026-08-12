// src/analytics/Analytics.jsx
// Analytics tab — live progress dashboard for Focus + Habits, with drill-down detail views

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { differenceInDays } from 'date-fns';
import { getLastNDays, calculateStreak, calculatePercentage, calculateCleanStreak } from '../lib/habitUtils';
import { getDaysInRange } from '../lib/habitFirestore';
import { HABITS, getRelapseHabits } from '../lib/habits';
import { ChevronRight, Shield } from 'lucide-react';

import StatCard      from './StatCard';
import GoalChart     from './GoalChart';
import FocusByDay    from './FocusByDay';
import CategoryDonut from './CategoryDonut';
import HabitTrend    from './HabitTrend';
import CategoryBars  from './CategoryBars';
import HeatmapGrid   from './HeatmapGrid';
import DetailedHabitAnalytics from './DetailedHabitAnalytics';
import DetailedFocusAnalytics from './DetailedFocusAnalytics';

const GOAL       = 800;
const DEADLINE   = new Date('2027-01-01T00:00:00');
const TOTAL_HABITS = HABITS.length;

async function fetchAllSessions(uid) {
  const q = query(
    collection(db, 'sessions'),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return docs.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeA - timeB;
  });
}

async function fetchHabitDays(uid) {
  const last90 = getLastNDays(90);
  return getDaysInRange(uid, last90[0], last90[last90.length - 1]);
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`pixel-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export default function Analytics({ user }) {
  const [sessions,   setSessions]   = useState([]);
  const [habitDays,  setHabitDays]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [detailView, setDetailView] = useState(null); // null | 'habits' | 'focus'

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [sess, days] = await Promise.all([
        fetchAllSessions(user.uid),
        fetchHabitDays(user.uid),
      ]);
      setSessions(sess);
      setHabitDays(days);
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalMinutes      = sessions.reduce((a, s) => a + (s.durationMinutes || 0), 0);
  const totalHours        = totalMinutes / 60;
  const hoursLeft         = Math.max(0, GOAL - totalHours);
  const daysLeft          = Math.max(1, differenceInDays(DEADLINE, new Date()));
  const requiredPerDay    = hoursLeft / daysLeft;
  const streaks           = calculateStreak(habitDays);
  const avgHabitScore     = habitDays.length
    ? Math.round(habitDays.reduce((a, d) => a + (d.score || 0), 0) / habitDays.length)
    : 0;
  const avgHabitPct       = calculatePercentage(avgHabitScore, TOTAL_HABITS);
  const daysTracked       = habitDays.filter(d => d.score > 0).length;

  // Relapse clean streaks
  const relapseHabits = getRelapseHabits();
  const cleanStreaks   = relapseHabits.map(h => ({
    habit: h,
    ...calculateCleanStreak(habitDays, h.id),
  }));

  if (loading) return <LoadingState />;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 text-center max-w-sm">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-white/60 text-[10px] uppercase">Failed to load analytics</p>
        <p className="text-[#ef4444] text-[8px] mt-2 uppercase">{error}</p>
        <button onClick={load} className="btn-ghost mt-6 text-[10px] px-4 py-3">Try again</button>
      </div>
    </div>
  );

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 pt-8 pb-28 max-w-2xl mx-auto"
    >
      {/* Header */}
      <header className="mb-6 pixel-card p-4">
        <h1 className="text-[12px] font-bold text-white text-shadow uppercase">Analytics Database</h1>
        <p className="text-[#93c5fd] text-[7px] mt-1 uppercase">Live Progress</p>
      </header>

      <AnimatePresence mode="wait">
        {detailView === 'habits' ? (
          <DetailedHabitAnalytics
            key="detail-habits"
            habitDays={habitDays}
            onBack={() => setDetailView(null)}
          />
        ) : detailView === 'focus' ? (
          <DetailedFocusAnalytics
            key="detail-focus"
            sessions={sessions}
            onBack={() => setDetailView(null)}
          />
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {/* ── Section 1: Hero Stats ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatCard icon="⚡" label="Total Focus Hours"  value={totalHours.toFixed(1)} unit="hrs"      color="brand"   delay={0.05} />
              <StatCard icon="📋" label="Sessions Logged"    value={sessions.length}                         color="blue"    delay={0.1}  />
              <StatCard icon="🔥" label="Current Streak"     value={streaks.current}        unit="days"      color="orange"  delay={0.15} />
              <StatCard icon="🏆" label="Best Streak"        value={streaks.longest}        unit="days"      color="purple"  delay={0.2}  />
              <StatCard icon="✅" label="Days Tracked"       value={daysTracked}            unit="days"      color="emerald" delay={0.25} />
              <StatCard
                icon="📈"
                label="Needed / Day"
                value={requiredPerDay.toFixed(2)}
                unit="hrs/day"
                color={requiredPerDay <= 4 ? 'emerald' : 'orange'}
                sub={`${daysLeft} days to goal`}
                delay={0.3}
              />
            </div>

            {/* ── Clean Streak Cards (Relapse Accountability) ─────────────────── */}
            {cleanStreaks.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {cleanStreaks.map(cs => (
                  <div key={cs.habit.id}
                       className="bg-black border-4 p-4 flex flex-col"
                       style={{
                         borderColor: cs.current > 7 ? '#22c55e' : '#991b1b',
                         boxShadow: `4px 4px 0px ${cs.current > 7 ? '#166534' : '#7f1d1d'}`,
                       }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className={`w-4 h-4 ${cs.current > 7 ? 'text-emerald-400' : 'text-red-400'}`} />
                      <p className="text-white/50 text-[7px] uppercase leading-tight font-bold">
                        {cs.habit.name}
                      </p>
                    </div>
                    <div className="flex items-end gap-2 mt-auto">
                      <span className={`text-[16px] font-bold text-shadow ${cs.current > 7 ? 'text-emerald-400' : cs.current > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {cs.current}
                      </span>
                      <span className="text-white/40 text-[7px] uppercase mb-1">days clean</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[6px] text-white/30 uppercase">
                      <span>Best: {cs.longest}d</span>
                      <span className="text-red-400/60">{cs.totalRelapses} relapses</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section 2: Goal Chart ─────────────────────────────────────────── */}
            <Card delay={0.1} className="mb-5">
              <GoalChart sessions={sessions} />
            </Card>

            {/* ── Section 3: Focus by Day + Category Donut ─── */}
            <div className="grid grid-cols-1 gap-5 mb-5 sm:grid-cols-2">
              <Card delay={0.15}>
                <FocusByDay sessions={sessions} />
              </Card>
              <Card delay={0.2}>
                <CategoryDonut sessions={sessions} />
              </Card>
            </div>

            {/* ── Section 4: Habit Trend ────────────────────────────────────────── */}
            <Card delay={0.25} className="mb-5">
              <HabitTrend habitDays={habitDays} />
            </Card>

            {/* ── Section 5: Category Bars ─────────────────────────────────────── */}
            <Card delay={0.3} className="mb-5">
              <CategoryBars habitDays={habitDays} />
            </Card>

            {/* ── Section 6: Heatmap ───────────────────────────────────────────── */}
            <Card delay={0.35} className="mb-5">
              <HeatmapGrid habitDays={habitDays} />
            </Card>

            {/* ── Drill-down navigation ────────────────────────────────────────── */}
            <div className="space-y-3 mb-5">
              <button
                onClick={() => setDetailView('habits')}
                className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-lg">📊</span>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-bold text-white uppercase text-shadow">Detailed Habit Insights</p>
                  <p className="text-[7px] text-[#93c5fd] uppercase mt-0.5">Per-habit breakdown, streaks & relapse analysis</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
              </button>

              <button
                onClick={() => setDetailView('focus')}
                className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-lg">⏱️</span>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-bold text-white uppercase text-shadow">Focus Session Log</p>
                  <p className="text-[7px] text-[#93c5fd] uppercase mt-0.5">Topics covered, session history by date</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen px-4 pt-8 pb-28 max-w-2xl mx-auto">
      <div className="mb-6 pixel-card p-4 h-16 animate-pulse" />
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="pixel-card animate-pulse h-24" />
        ))}
      </div>
      {[220, 180, 180, 130, 200].map((h, i) => (
        <div key={i} className="pixel-card animate-pulse mb-5"
             style={{ height: h }} />
      ))}
    </div>
  );
}
