// src/components/DayGoals.jsx
// Daily goal setting and tracking UI
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, Target, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useDayGoals } from '../hooks/useDayGoals';

export default function DayGoals({ user }) {
  const {
    goals, loading, addGoal, toggleGoal, removeGoal, editGoal,
    completedCount, totalCount, completionPct, allDone,
  } = useDayGoals(user?.uid);

  const [newGoalText, setNewGoalText] = useState('');
  const [expanded, setExpanded]       = useState(true);
  const [editingId, setEditingId]     = useState(null);
  const [editText, setEditText]       = useState('');

  const handleAdd = () => {
    if (newGoalText.trim()) {
      addGoal(newGoalText.trim());
      setNewGoalText('');
    }
  };

  const handleStartEdit = (goal) => {
    setEditingId(goal.id);
    setEditText(goal.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingId) {
      editGoal(editingId, editText.trim());
      setEditingId(null);
      setEditText('');
    }
  };

  if (loading) {
    return <div className="pixel-card animate-pulse h-24 mb-6" />;
  }

  return (
    <div className="pixel-card mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="pixel-header flex items-center gap-3 w-full text-left p-3 border-none hover:bg-[#111] focus:outline-none"
      >
        <Target className="w-4 h-4 text-[#ef4444]" />
        <div className="flex-1">
          <p className="text-[10px] font-bold text-white uppercase text-shadow">Day Goals</p>
          <p className="text-[7px] text-[#93c5fd] mt-1">Set & track today's goals</p>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${allDone ? 'text-[#22c55e]' : 'text-white/50'}`}>
                {completedCount}/{totalCount}
              </span>
              {/* Mini progress bar */}
              <div className="w-16 h-2 bg-black border-2 border-white/30">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${completionPct}%`,
                    backgroundColor: allDone ? '#22c55e' : '#ef4444',
                  }}
                />
              </div>
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t-4 border-black space-y-3">
              {/* Goals list */}
              {goals.length === 0 && (
                <p className="text-[8px] text-white/40 uppercase text-center py-4">
                  No goals set yet. Add one below!
                </p>
              )}

              <AnimatePresence initial={false}>
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-4 transition-none
                      ${goal.done
                        ? 'bg-[#22c55e] border-black text-black'
                        : 'bg-[#111] border-white/20 text-white/80'}`}
                    style={goal.done ? { boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' } : {}}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-6 h-6 border-4 flex items-center justify-center flex-shrink-0 cursor-pointer
                        ${goal.done ? 'bg-black border-black' : 'border-white/40 hover:border-white/60'}`}
                    >
                      {goal.done && <Check className="w-4 h-4 text-[#22c55e]" strokeWidth={4} />}
                    </div>

                    {/* Goal text / edit mode */}
                    {editingId === goal.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                          className="input-base flex-1 py-1"
                          autoFocus
                        />
                        <button onClick={handleSaveEdit} className="btn-primary px-2 py-1 text-[8px]">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost px-2 py-1 text-[8px]">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          onClick={() => toggleGoal(goal.id)}
                          className={`text-[9px] flex-1 uppercase cursor-pointer ${goal.done ? 'line-through' : ''}`}
                        >
                          {goal.text}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!goal.done && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartEdit(goal); }}
                              className="p-1 text-white/30 hover:text-[#93c5fd] transition-none"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); }}
                            className={`p-1 transition-none ${goal.done ? 'text-black/40 hover:text-black' : 'text-white/30 hover:text-[#ef4444]'}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* All done banner */}
              {allDone && totalCount > 0 && (
                <div className="text-center text-[8px] text-black font-bold uppercase py-2 bg-[#22c55e] border-4 border-black"
                     style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                  🎯 All day goals achieved!
                </div>
              )}

              {/* Add new goal */}
              <div className="flex gap-3 pt-2">
                <input
                  type="text"
                  placeholder="ADD A GOAL FOR TODAY..."
                  value={newGoalText}
                  onChange={e => setNewGoalText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                  className="input-base flex-1"
                  maxLength={200}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newGoalText.trim()}
                  className="btn-primary px-4 py-0 disabled:opacity-30"
                >
                  <Plus className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
