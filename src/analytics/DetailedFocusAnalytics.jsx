// src/analytics/DetailedFocusAnalytics.jsx
// Focus session history with topics covered, grouped by date, filterable by category

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Filter, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { key: 'All',                 color: '#ef4444' },
  { key: 'Core Java & DSA',    color: '#3b82f6' },
  { key: 'MERN Backend',       color: '#22c55e' },
  { key: 'CS Fundamentals',    color: '#a855f7' },
  { key: 'System Design',      color: '#f59e0b' },
];

function formatSessionDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, 'yyyy-MM-dd');
}

function formatSessionTime(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, 'hh:mm a');
}

function formatDateDisplay(dateStr) {
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return format(date, 'EEEE, d MMM yyyy');
  } catch {
    return dateStr;
  }
}

export default function DetailedFocusAnalytics({ sessions, onBack }) {
  const [filter, setFilter] = useState('All');

  // Group sessions by date
  const grouped = useMemo(() => {
    const filtered = filter === 'All'
      ? sessions
      : sessions.filter(s => s.category === filter);

    const byDate = {};
    for (const s of filtered) {
      const dateKey = formatSessionDate(s.timestamp);
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(s);
    }

    // Sort dates descending
    return Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions, filter]);

  // Per-category totals
  const categoryTotals = useMemo(() => {
    const totals = {};
    for (const s of sessions) {
      totals[s.category] = (totals[s.category] || 0) + (s.durationMinutes || 0) / 60;
    }
    return totals;
  }, [sessions]);

  const filteredCount = grouped.reduce((sum, [, sess]) => sum + sess.length, 0);

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
        <h2 className="text-[11px] font-bold text-white uppercase text-shadow">Focus Session Log</h2>
        <p className="text-[7px] text-[#93c5fd] uppercase mt-1">Topics covered • {filteredCount} sessions</p>
      </div>

      {/* Category totals */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {CATEGORIES.filter(c => c.key !== 'All').map(cat => {
          const hours = categoryTotals[cat.key] || 0;
          return (
            <div key={cat.key} className="pixel-card p-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 border-2 border-black flex-shrink-0" style={{ backgroundColor: cat.color, boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[7px] text-white/60 uppercase truncate">{cat.key}</p>
                <p className="text-[9px] font-bold tabular-nums" style={{ color: cat.color }}>{hours.toFixed(1)}h</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-3 h-3 text-white/40" />
          <span className="text-[7px] text-white/40 uppercase">Filter by category</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`text-[7px] uppercase px-3 py-2 border-2 border-black transition-none
                ${filter === cat.key
                  ? 'text-white font-bold'
                  : 'bg-[#333] text-white/60'}`}
              style={filter === cat.key ? { backgroundColor: cat.color, boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' } : { boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
            >
              {cat.key}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions grouped by date */}
      {grouped.length === 0 ? (
        <div className="pixel-card p-8 text-center">
          <p className="text-3xl mb-2">👾</p>
          <p className="text-[8px] text-white/40 uppercase">No sessions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, daySessions]) => (
            <div key={dateKey} className="pixel-card overflow-hidden">
              {/* Date header */}
              <div className="px-4 py-2.5 bg-black/40 border-b-4 border-black flex items-center justify-between">
                <span className="text-[8px] font-bold text-[#93c5fd] uppercase">{formatDateDisplay(dateKey)}</span>
                <span className="text-[7px] text-white/40 uppercase">
                  {daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)} min total
                </span>
              </div>

              {/* Session cards for this date */}
              <div className="divide-y divide-white/5">
                {daySessions.map((session, i) => {
                  const catColor = CATEGORIES.find(c => c.key === session.category)?.color || '#6366f1';
                  return (
                    <div key={session.id || i} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Time + duration */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[8px] text-white/30">{formatSessionTime(session.timestamp)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-white/30" />
                            <span className="text-[8px] font-bold tabular-nums" style={{ color: catColor }}>
                              {session.durationMinutes}m
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Category badge */}
                          <span className="inline-flex items-center gap-1 text-[7px] uppercase px-2 py-1 border border-black/50 mb-1.5"
                                style={{ backgroundColor: catColor + '20', color: catColor }}>
                            <BookOpen className="w-2.5 h-2.5" />
                            {session.category}
                          </span>

                          {/* Goal */}
                          {session.intendedGoal && (
                            <p className="text-[8px] text-white/40 mb-1">
                              <span className="text-white/25">Goal: </span>{session.intendedGoal}
                            </p>
                          )}

                          {/* Outcome */}
                          {session.actualOutcome && (
                            <p className="text-[9px] text-white/80 leading-relaxed">
                              {session.actualOutcome}
                            </p>
                          )}

                          {/* Proof link */}
                          {session.proofUrl && (
                            <a
                              href={session.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[7px] uppercase text-brand-400 hover:text-brand-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
