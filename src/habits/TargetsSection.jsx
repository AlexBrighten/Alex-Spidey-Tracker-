// src/habits/TargetsSection.jsx
import { useState } from 'react';
import { Check, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TargetsSection({
  todayTargets = [],
  tomorrowTargets = [],
  onToggleTarget,
  onAddTomorrowTarget,
  onRemoveTomorrowTarget,
}) {
  const [newTarget,    setNewTarget]    = useState('');
  const [showTomorrow, setShowTomorrow] = useState(true);

  const handleAdd = () => {
    if (newTarget.trim()) {
      onAddTomorrowTarget(newTarget.trim());
      setNewTarget('');
    }
  };

  const todayDone  = todayTargets.filter(t => t.done).length;
  const allAchieved = todayDone === todayTargets.length && todayTargets.length > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Today's Targets */}
      {todayTargets.length > 0 && (
        <div className="pixel-card">
          <div className="pixel-header flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div className="text-left">
                <p className="text-sm font-bold text-black uppercase">Today's Targets</p>
                <p className="text-xs text-black/50 mt-1">Set yesterday</p>
              </div>
            </div>
            <span className={`text-sm font-bold
              ${allAchieved ? 'text-[#22c55e]' : 'text-black/50'}`}>
              {todayDone}/{todayTargets.length}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {todayTargets.map((target, i) => (
              <div
                key={i}
                onClick={() => onToggleTarget(i)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-[3px] transition-none
                  ${target.done
                    ? 'bg-[#22c55e] border-black text-black'
                    : 'bg-gray-50 border-black/15 text-black/80'}`}
                style={target.done ? { boxShadow: '4px 4px 0px #000' } : {}}
              >
                <div className={`w-6 h-6 border-[3px] flex items-center justify-center flex-shrink-0
                  ${target.done ? 'bg-black border-black' : 'border-black/30'}`}>
                  {target.done && <Check className="w-4 h-4 text-[#22c55e]" strokeWidth={4} />}
                </div>
                <span className={`text-sm flex-1 uppercase ${target.done ? 'line-through' : ''}`}>
                  {target.text}
                </span>
              </div>
            ))}
            
            {allAchieved && (
              <p className="text-center text-xs text-black font-bold uppercase mt-4 py-2 bg-[#22c55e] border-[3px] border-black" style={{ boxShadow: '4px 4px 0px #000' }}>
                ✨ All targets achieved!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tomorrow's Targets */}
      <div className="pixel-card">
        <button
          onClick={() => setShowTomorrow(!showTomorrow)}
          className="pixel-header flex items-center gap-3 w-full text-left p-3 border-none hover:bg-gray-50 focus:outline-none"
        >
          <span className="text-xl">📋</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-black uppercase">Tomorrow's Targets</p>
            <p className="text-xs text-black/50 mt-1">Plan ahead</p>
          </div>
          <div className="flex items-center gap-3">
            {tomorrowTargets.length > 0 && (
              <span className="px-2 py-1 bg-[#ef4444] border-2 border-black text-black text-xs font-bold ">
                {tomorrowTargets.length}
              </span>
            )}
            {showTomorrow ? <ChevronUp className="w-5 h-5 text-black" /> : <ChevronDown className="w-5 h-5 text-black" />}
          </div>
        </button>

        {showTomorrow && (
          <div className="p-4 border-t-[3px] border-black">
            <div className="space-y-3">
              {tomorrowTargets.map((target, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 bg-gray-50 border-[3px] border-black/15">
                  <span className="text-black/30 text-sm">•</span>
                  <span className="text-sm text-black/80 flex-1 uppercase">{target.text}</span>
                  <button
                    onClick={() => onRemoveTomorrowTarget(i)}
                    className="text-black/40 hover:text-[#ef4444] transition-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <input
                  type="text"
                  placeholder="ADD A TARGET..."
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                  className="input-base flex-1"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTarget.trim()}
                  className="btn-primary px-4 py-0 disabled:opacity-30"
                >
                  <Plus className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
