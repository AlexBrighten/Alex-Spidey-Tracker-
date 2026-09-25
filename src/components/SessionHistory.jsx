// src/components/SessionHistory.jsx

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Clock, BookOpen, Cpu, Code2, Layers } from 'lucide-react';

const CATEGORY_META = {
  'Core Java & DSA': {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    icon: <Code2 className="w-3 h-3" />,
  },
  'MERN Backend': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    icon: <Layers className="w-3 h-3" />,
  },
  'CS Fundamentals': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
    icon: <Cpu className="w-3 h-3" />,
  },
  'System Design': {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    icon: <BookOpen className="w-3 h-3" />,
  },
  'Product Management': {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/25',
    icon: <BookOpen className="w-3 h-3" />,
  },
};

const DEFAULT_META = {
  color: 'text-brand-400',
  bg: 'bg-brand-500/10',
  border: 'border-brand-500/25',
  icon: <BookOpen className="w-3 h-3" />,
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] ?? DEFAULT_META;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionHistory({ sessions }) {
  if (!sessions.length) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="text-5xl mb-4">🎯</div>
        <p className="text-black/50 text-sm">No sessions yet. Start your first deep work session!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {sessions.map((session, idx) => {
          const meta = getCategoryMeta(session.category);
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, delay: idx < 5 ? idx * 0.05 : 0 }}
              className="glass-card rounded-xl p-5 border-[3px] border-black hover:shadow-[6px_6px_0px_#000] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {/* Category badge */}
                    <span className={`badge ${meta.bg} ${meta.border} ${meta.color}`}>
                      {meta.icon}
                      {session.category}
                    </span>
                    {/* Duration badge */}
                    <span className="badge bg-white/5 border-black/10 text-black/50">
                      <Clock className="w-3 h-3" />
                      {session.durationMinutes} min
                    </span>
                  </div>

                  {/* Intended Goal */}
                  {session.intendedGoal && (
                    <p className="text-black/40 text-xs mb-1 truncate">
                      <span className="text-black/25">Goal: </span>{session.intendedGoal}
                    </p>
                  )}

                  {/* Actual Outcome */}
                  <p className="text-black/80 text-sm leading-relaxed">
                    {session.actualOutcome}
                  </p>

                  {/* Proof URL */}
                  {session.proofUrl && (
                    <a
                      href={session.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Proof
                    </a>
                  )}
                </div>

                {/* Right — timestamp */}
                <div className="text-right flex-shrink-0">
                  <p className="text-black/25 text-xs">{formatDate(session.timestamp)}</p>
                  <p className={`text-sm font-bold mt-1 ${meta.color}`}>
                    +{(session.durationMinutes / 60).toFixed(2)}h
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
