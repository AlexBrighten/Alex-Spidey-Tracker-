// src/habits/SpacedRepetition.jsx
// Weekend problem review — surfaces Leetcode problems solved during the week

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getDaysInRange } from '../lib/habitFirestore';
import { getCurrentWeekWeekdays, isWeekend, getTodayString } from '../lib/habitUtils';
import { format, parseISO } from 'date-fns';

/**
 * Collects all Leetcode problems from this week's weekday habit data.
 * Returns: [{ problem, date, dateDisplay }]
 */
function extractProblems(weekdayData) {
  const problems = [];
  for (const day of weekdayData) {
    const leetcodeDetails = day.habits?.leetcode?.details?.problems;
    if (!leetcodeDetails || typeof leetcodeDetails !== 'string') continue;
    const tags = leetcodeDetails.split('||').filter(t => t.trim().length > 0);
    for (const tag of tags) {
      problems.push({
        problem: tag.trim(),
        date: day.date,
        dateDisplay: format(parseISO(day.date), 'EEE, d MMM'),
      });
    }
  }
  return problems;
}

/**
 * Load review status from Firestore for this week.
 * Stored at: users/{uid}/weeklyReviews/{weekId}
 */
async function loadReviewStatus(uid, weekId) {
  const ref = doc(db, 'users', uid, 'weeklyReviews', weekId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data().reviewed || {};
  return {};
}

async function saveReviewStatus(uid, weekId, reviewed) {
  const ref = doc(db, 'users', uid, 'weeklyReviews', weekId);
  await setDoc(ref, { reviewed, updatedAt: serverTimestamp() }, { merge: true });
}

export default function SpacedRepetition({ user }) {
  const [problems, setProblems]   = useState([]);
  const [reviewed, setReviewed]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(true);

  const today      = getTodayString();
  const weekend    = isWeekend();
  const weekdays   = getCurrentWeekWeekdays();
  const weekId     = weekdays[0]; // Monday date as week identifier

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dayData, status] = await Promise.all([
        getDaysInRange(user.uid, weekdays[0], weekdays[weekdays.length - 1]),
        loadReviewStatus(user.uid, weekId),
      ]);
      setProblems(extractProblems(dayData));
      setReviewed(status);
    } catch (err) {
      console.error('SpacedRepetition load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, weekdays[0], weekId]);

  useEffect(() => { load(); }, [load]);

  const toggleReview = async (index) => {
    const key = `p${index}`;
    const newReviewed = { ...reviewed, [key]: !reviewed[key] };
    setReviewed(newReviewed);
    try {
      await saveReviewStatus(user.uid, weekId, newReviewed);
    } catch (err) {
      console.error(err);
    }
  };

  // Don't show if no problems this week (regardless of day)
  if (!loading && problems.length === 0) return null;

  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const totalCount    = problems.length;
  const allReviewed   = reviewedCount >= totalCount && totalCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <div className="pixel-card"
           style={{
             borderColor: weekend ? '#7c3aed' : '#4b5563',
             boxShadow: weekend
               ? 'inset -4px -4px 0px rgba(0,0,0,0.5), inset 4px 4px 0px rgba(255,255,255,0.05), 4px 4px 0px #5b21b6'
               : 'inset -4px -4px 0px rgba(0,0,0,0.5), inset 4px 4px 0px rgba(255,255,255,0.1), 4px 4px 0px rgba(0,0,0,0.3)',
           }}>
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-purple-900/30 border-b-4 border-purple-950/50"
        >
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-[9px] font-bold text-purple-300 uppercase text-shadow">
            {weekend ? '🧠 Weekend Review' : '🧩 Problems This Week'}
          </span>
          {!loading && totalCount > 0 && (
            <span className={`ml-auto text-[7px] uppercase font-bold px-2 py-1 border
              ${allReviewed
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-purple-300 bg-purple-500/10 border-purple-500/30'}`}>
              {reviewedCount}/{totalCount} reviewed
            </span>
          )}
          {expanded ? <ChevronUp className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-[7px] text-white/40 uppercase mb-3">
                      {weekend
                        ? 'Review the problems you solved this week. Tap to mark as reviewed.'
                        : 'Problems you solved this week — review them on the weekend!'}
                    </p>

                    <div className="space-y-2">
                      {problems.map((p, i) => {
                        const key = `p${i}`;
                        const isReviewed = reviewed[key] || false;
                        return (
                          <div
                            key={i}
                            onClick={weekend ? () => toggleReview(i) : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150
                              ${weekend ? 'cursor-pointer' : 'cursor-default'}
                              ${isReviewed
                                ? 'bg-emerald-500/10 border-emerald-500/25'
                                : 'bg-white/[0.02] border-white/8 hover:border-white/15'}`}
                          >
                            {/* Review checkbox (weekend only) */}
                            {weekend && (
                              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
                                ${isReviewed
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-white/20'}`}>
                                {isReviewed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium ${isReviewed ? 'text-white/50 line-through' : 'text-white/85'}`}>
                                🧩 {p.problem}
                              </p>
                            </div>

                            <span className="text-[7px] text-white/30 uppercase flex-shrink-0">
                              {p.dateDisplay}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {allReviewed && weekend && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <span className="text-[10px]">🎉</span>
                        <p className="text-[7px] text-emerald-400 uppercase font-bold">All problems reviewed! Great job!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
