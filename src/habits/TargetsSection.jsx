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
              <span className="text-[14px]">🎯</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-white uppercase text-shadow">Today's Targets</p>
                <p className="text-[7px] text-[#93c5fd] mt-1">Set yesterday</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold
              ${allAchieved ? 'text-[#22c55e]' : 'text-white/50'}`}>
              {todayDone}/{todayTargets.length}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {todayTargets.map((target, i) => (
              <div
                key={i}
                onClick={() => onToggleTarget(i)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-4 transition-none
                  ${target.done
                    ? 'bg-[#22c55e] border-black text-black'
                    : 'bg-[#111] border-white/20 text-white/80'}`}
                style={target.done ? { boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' } : {}}
              >
                <div className={`w-6 h-6 border-4 flex items-center justify-center flex-shrink-0
                  ${target.done ? 'bg-black border-black' : 'border-white/40'}`}>
                  {target.done && <Check className="w-4 h-4 text-[#22c55e]" strokeWidth={4} />}
                </div>
                <span className={`text-[9px] flex-1 uppercase ${target.done ? 'line-through' : ''}`}>
                  {target.text}
                </span>
              </div>
            ))}
            
            {allAchieved && (
              <p className="text-center text-[8px] text-black font-bold uppercase mt-4 py-2 bg-[#22c55e] border-4 border-black" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
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
          className="pixel-header flex items-center gap-3 w-full text-left p-3 border-none hover:bg-[#111] focus:outline-none"
        >
          <span className="text-[14px]">📋</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-white uppercase text-shadow">Tomorrow's Targets</p>
            <p className="text-[7px] text-[#93c5fd] mt-1">Plan ahead</p>
          </div>
          <div className="flex items-center gap-3">
            {tomorrowTargets.length > 0 && (
              <span className="px-2 py-1 bg-[#ef4444] border-2 border-black text-white text-[8px] font-bold text-shadow">
                {tomorrowTargets.length}
              </span>
            )}
            {showTomorrow ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
          </div>
        </button>

        {showTomorrow && (
          <div className="p-4 border-t-4 border-black">
            <div className="space-y-3">
              {tomorrowTargets.map((target, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 bg-[#111] border-4 border-white/20">
                  <span className="text-white/30 text-[10px]">•</span>
                  <span className="text-[9px] text-white/80 flex-1 uppercase">{target.text}</span>
                  <button
                    onClick={() => onRemoveTomorrowTarget(i)}
                    className="text-white/40 hover:text-[#ef4444] transition-none"
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
