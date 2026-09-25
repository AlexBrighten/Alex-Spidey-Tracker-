// src/analytics/Analytics.jsx
// Analytics tab — fully reorganized with sections: Overview → Focus → Habits → Goals
// Drill-down detail views for habits and focus

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { differenceInDays, format, subDays } from 'date-fns';
import { getLastNDays, calculateStreak, calculatePercentage } from '../lib/habitUtils';
import { getDaysInRange } from '../lib/habitFirestore';
import { HABITS } from '../lib/habits';
import { ChevronRight, Zap, CheckSquare, Target, BarChart2, TrendingUp, RefreshCw } from 'lucide-react';

import StatCard         from './StatCard';
import GoalChart        from './GoalChart';
import FocusByDay       from './FocusByDay';
import CategoryDonut    from './CategoryDonut';
import HabitTrend       from './HabitTrend';
import CategoryBars     from './CategoryBars';
import HeatmapGrid      from './HeatmapGrid';
import WeeklyComparison from './WeeklyComparison';
import SessionStreakChart from './SessionStreakChart';
import DayGoalsAnalytics from './DayGoalsAnalytics';
import DetailedHabitAnalytics from './DetailedHabitAnalytics';
import DetailedFocusAnalytics from './DetailedFocusAnalytics';

const GOAL       = 800;
const DEADLINE   = new Date('2027-01-01T00:00:00');
const TOTAL_HABITS = HABITS.length;

// Analytics section tabs
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'focus',    label: 'Focus',    icon: Zap },
  { id: 'habits',   label: 'Habits',   icon: CheckSquare },
  { id: 'goals',    label: 'Goals',    icon: Target },
];

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
    <div className={`pixel-card p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTab({ section, active, onClick }) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 border-[3px] text-sm uppercase font-bold transition-none
        ${active
          ? 'bg-[#dc2626] border-black text-white shadow-[4px_4px_0px_#000] rounded-xl'
          : 'bg-white border-black text-black/60 hover:text-black rounded-xl shadow-[2px_2px_0px_#000]'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {section.label}
    </button>
  );
}

export default function Analytics({ user }) {
  const [sessions,   setSessions]   = useState([]);
  const [habitDays,  setHabitDays]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [section,    setSection]    = useState('overview');
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

  // Today's stats
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter(s => {
    const d = s.timestamp?.toDate?.() ?? new Date(s.timestamp);
    return format(d, 'yyyy-MM-dd') === todayStr;
  });
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const todayHours = todayMinutes / 60;

  // This week stats
  const weekAgo = subDays(new Date(), 7);
  const thisWeekSessions = sessions.filter(s => {
    const d = s.timestamp?.toDate?.() ?? new Date(s.timestamp);
    return d >= weekAgo;
  });
  const thisWeekHours = thisWeekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60;

  // Average session length
  const avgSessionMin = sessions.length > 0
    ? Math.round(totalMinutes / sessions.length)
    : 0;

  if (loading) return <LoadingState />;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="pixel-card p-8 text-center max-w-sm">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-black/60 text-sm uppercase">Failed to load analytics</p>
        <p className="text-[#ef4444] text-sm mt-2 uppercase">{error}</p>
        <button onClick={load} className="btn-ghost mt-6 text-sm px-4 py-3">Try again</button>
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
      <header className="mb-5 pixel-card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black  uppercase">Analytics HQ</h1>
          <p className="text-black/60 text-xs mt-1 uppercase">Live Progress Dashboard</p>
        </div>
        <button onClick={load} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
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
            key="main-analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {/* Section Tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {SECTIONS.map(s => (
                <SectionTab
                  key={s.id}
                  section={s}
                  active={section === s.id}
                  onClick={() => setSection(s.id)}
                />
              ))}
            </div>

            {/* ────────────────────────────────────────────────────────────────── */}
            {/*                        OVERVIEW SECTION                          */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {section === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Hero Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon="⚡" label="Total Focus"      value={totalHours.toFixed(1)} unit="hrs"      color="brand"   />
                  <StatCard icon="📋" label="Sessions"         value={sessions.length}                         color="blue"    />
                  <StatCard icon="🔥" label="Habit Streak"     value={streaks.current}        unit="days"      color="orange"  />
                  <StatCard icon="🏆" label="Best Streak"      value={streaks.longest}        unit="days"      color="purple"  />
                </div>

                {/* Today + This Week highlight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border-[3px] border-black p-4 flex flex-col" style={{ boxShadow: '4px 4px 0px #000' }}>
                    <p className="text-black/50 text-xs uppercase font-bold mb-2">Today</p>
                    <div className="flex items-end gap-2 mt-auto">
                      <span className="text-2xl font-bold text-[#22c55e] ">{todayHours.toFixed(1)}</span>
                      <span className="text-black/40 text-xs uppercase mb-1">hrs • {todaySessions.length} sessions</span>
                    </div>
                  </div>
                  <div className="bg-white border-[3px] border-black p-4 flex flex-col" style={{ boxShadow: '4px 4px 0px #000' }}>
                    <p className="text-black/50 text-xs uppercase font-bold mb-2">This Week</p>
                    <div className="flex items-end gap-2 mt-auto">
                      <span className="text-2xl font-bold text-black/60 ">{thisWeekHours.toFixed(1)}</span>
                      <span className="text-black/40 text-xs uppercase mb-1">hrs • {thisWeekSessions.length} sessions</span>
                    </div>
                  </div>
                </div>

                {/* Pace + Needed/Day */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon="📈"
                    label="Needed / Day"
                    value={requiredPerDay.toFixed(2)}
                    unit="hrs/day"
                    color={requiredPerDay <= 4 ? 'emerald' : 'orange'}
                    sub={`${daysLeft} days to goal`}
                  />
                  <StatCard
                    icon="⏱️"
                    label="Avg Session"
                    value={avgSessionMin}
                    unit="min"
                    color="cyan"
                  />
                </div>

                {/* 800hr Goal Chart */}
                <Card>
                  <GoalChart sessions={sessions} />
                </Card>

                {/* Drill-down navigation */}
                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => setDetailView('habits')}
                    className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="text-lg">📊</span>
                    <div className="flex-1 text-left">
                      <p className="text-base font-bold text-black uppercase ">Detailed Habit Insights</p>
                      <p className="text-xs text-black/60 uppercase mt-0.5">Per-habit breakdown, streaks & relapse analysis</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-black/40 group-hover:text-black" />
                  </button>

                  <button
                    onClick={() => setDetailView('focus')}
                    className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="text-lg">⏱️</span>
                    <div className="flex-1 text-left">
                      <p className="text-base font-bold text-black uppercase ">Focus Session Log</p>
                      <p className="text-xs text-black/60 uppercase mt-0.5">Topics covered, session history by date</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-black/40 group-hover:text-black" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/*                         FOCUS SECTION                            */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {section === 'focus' && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Focus hero stats */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard icon="⚡" label="Total"    value={totalHours.toFixed(1)} unit="hrs"  color="brand" />
                  <StatCard icon="📋" label="Sessions" value={sessions.length}                    color="blue"  />
                  <StatCard icon="⏱️" label="Avg"      value={avgSessionMin}          unit="min"  color="cyan"  />
                </div>

                {/* 800hr Goal Chart */}
                <Card>
                  <GoalChart sessions={sessions} />
                </Card>

                {/* Weekly Comparison */}
                <Card>
                  <WeeklyComparison sessions={sessions} />
                </Card>

                {/* Focus by Day */}
                <Card>
                  <FocusByDay sessions={sessions} />
                </Card>

                {/* Category Donut */}
                <Card>
                  <CategoryDonut sessions={sessions} />
                </Card>

                {/* Session Activity Streak */}
                <Card>
                  <SessionStreakChart sessions={sessions} />
                </Card>

                {/* Drill-down to full session log */}
                <button
                  onClick={() => setDetailView('focus')}
                  className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="text-lg">📝</span>
                  <div className="flex-1 text-left">
                    <p className="text-base font-bold text-black uppercase ">Full Session Log</p>
                    <p className="text-xs text-black/60 uppercase mt-0.5">Browse all sessions by date & category</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/40 group-hover:text-black" />
                </button>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/*                        HABITS SECTION                            */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {section === 'habits' && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Habit hero stats */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon="🔥" label="Current Streak" value={streaks.current} unit="days"  color="orange" />
                  <StatCard icon="🏆" label="Best Streak"    value={streaks.longest} unit="days"  color="purple" />
                  <StatCard icon="✅" label="Days Tracked"   value={daysTracked}     unit="days"  color="emerald" />
                  <StatCard icon="📊" label="Avg Score"      value={`${avgHabitPct}%`}              color="blue" />
                </div>

                {/* Habit Trend */}
                <Card>
                  <HabitTrend habitDays={habitDays} />
                </Card>

                {/* Category Averages */}
                <Card>
                  <CategoryBars habitDays={habitDays} />
                </Card>

                {/* 12-Week Heatmap */}
                <Card>
                  <HeatmapGrid habitDays={habitDays} />
                </Card>

                {/* Drill-down to detailed habits */}
                <button
                  onClick={() => setDetailView('habits')}
                  className="w-full pixel-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-none group"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="text-lg">🔍</span>
                  <div className="flex-1 text-left">
                    <p className="text-base font-bold text-black uppercase ">Per-Habit Breakdown</p>
                    <p className="text-xs text-black/60 uppercase mt-0.5">Individual habit stats, mini heatmaps & triggers</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/40 group-hover:text-black" />
                </button>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────────────── */}
            {/*                         GOALS SECTION                            */}
            {/* ────────────────────────────────────────────────────────────────── */}
            {section === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Day Goals Analytics */}
                <Card>
                  <DayGoalsAnalytics uid={user.uid} />
                </Card>

                {/* 800hr Progress summary */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon="🎯"
                    label="800hr Progress"
                    value={`${Math.round((totalHours / GOAL) * 100)}%`}
                    color="brand"
                    sub={`${totalHours.toFixed(1)} / ${GOAL} hrs`}
                  />
                  <StatCard
                    icon="📈"
                    label="Pace Required"
                    value={requiredPerDay.toFixed(2)}
                    unit="hrs/day"
                    color={requiredPerDay <= 4 ? 'emerald' : 'orange'}
                    sub={`${daysLeft} days remaining`}
                  />
                </div>

                {/* Habit completion overview */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                    <div>
                      <h3 className="text-sm font-bold text-black uppercase ">Goal Summary</h3>
                      <p className="text-xs text-black/60 uppercase mt-1">How you're tracking</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Focus hours goal */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-black/80 uppercase">800 Hours Focus</span>
                        <span className="text-base font-bold text-[#ef4444]">{totalHours.toFixed(1)}h / 800h</span>
                      </div>
                      <div className="h-4 bg-white border-[3px] border-white p-0.5" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                        <div className="h-full bg-[#ef4444] transition-all duration-500"
                             style={{ width: `${Math.min(100, (totalHours / GOAL) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Habit consistency goal */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-black/80 uppercase">Habit Consistency</span>
                        <span className="text-base font-bold text-[#22c55e]">{avgHabitPct}% avg</span>
                      </div>
                      <div className="h-4 bg-white border-[3px] border-white p-0.5" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                        <div className="h-full bg-[#22c55e] transition-all duration-500"
                             style={{ width: `${avgHabitPct}%` }} />
                      </div>
                    </div>

                    {/* Streak goal */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-black/80 uppercase">Current Streak</span>
                        <span className="text-base font-bold text-[#f59e0b]">{streaks.current} days</span>
                      </div>
                      <div className="h-4 bg-white border-[3px] border-white p-0.5" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                        <div className="h-full bg-[#f59e0b] transition-all duration-500"
                             style={{ width: `${Math.min(100, (streaks.current / 30) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-black/30 uppercase mt-1">Target: 30-day streak</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
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
      <div className="flex gap-2 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 pixel-card animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="pixel-card animate-pulse h-24" />
        ))}
      </div>
      {[220, 180, 180].map((h, i) => (
        <div key={i} className="pixel-card animate-pulse mb-5"
             style={{ height: h }} />
      ))}
    </div>
  );
}
