// src/habits/HabitCard.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

export default function HabitCard({ habit, data, onToggle, onUpdateDetails }) {
  const isDone        = data?.done || false;
  const isRelapse     = habit.isRelapse || false;
  const [showDetails, setShowDetails] = useState(false);
  const [tagInput,    setTagInput]    = useState('');
  const inputRef = useRef(null);

  const timestamp = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Auto-expand details section when habit is completed
  useEffect(() => {
    if (isDone && habit.hasDetails) setShowDetails(true);
  }, [isDone, habit.hasDetails]);

  // Auto-focus detail input on expand
  useEffect(() => {
    if (showDetails && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [showDetails]);

  const handleCheck = () => {
    onToggle(habit.id, isDone);
    if (isDone) setShowDetails(false);
  };

  const handleDetailChange = useCallback((value) => {
    const key = habit.detailField?.key;
    if (key) onUpdateDetails(habit.id, { [key]: value });
  }, [habit.id, habit.detailField, onUpdateDetails]);

  const isTagsType   = habit.detailField?.type === 'tags';
  const detailValue  = data?.details?.[habit.detailField?.key] || '';
  const tags         = isTagsType
    ? (typeof detailValue === 'string' ? detailValue : '').split('||').filter(t => t.trim().length > 0)
    : [];
  const hasContent   = isTagsType ? tags.length > 0 : !!detailValue;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    handleDetailChange([...tags, trimmed].join('||'));
    setTagInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRemoveTag = (i) => handleDetailChange(tags.filter((_, idx) => idx !== i).join('||'));

  // Relapse-specific styles
  const cardBg = isRelapse
    ? isDone
      ? 'bg-red-500/10 border-red-500/30'                           // Relapsed — danger glow
      : 'bg-white/[0.02] border-white/6 hover:border-white/10 hover:bg-white/[0.04]' // Clean
    : isDone
      ? 'bg-white/6 border-white/12'
      : 'bg-white/[0.02] border-white/6 hover:border-white/10 hover:bg-white/[0.04]';

  const checkboxStyle = isRelapse
    ? isDone
      ? 'bg-red-600 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
      : 'border-white/20'
    : isDone
      ? 'bg-brand-500 border-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
      : 'border-white/20';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${cardBg}`}>

      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={handleCheck}
      >
        {/* Checkbox */}
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
          ${checkboxStyle}`}>
          {isDone && (isRelapse
            ? <AlertTriangle className="w-3 h-3 text-white" strokeWidth={3} />
            : <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </div>

        <span className="text-lg leading-none select-none">{habit.emoji}</span>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-all duration-150
            ${isRelapse
              ? isDone ? 'text-red-400' : 'text-white/85'
              : isDone ? 'text-white/50 line-through' : 'text-white/85'}`}>
            {habit.name}
          </p>
          {timestamp && <p className="text-xs text-white/30 mt-0.5">{timestamp}</p>}
        </div>

        {/* Relapse badge or detail content indicator */}
        {isRelapse && isDone ? (
          <span className="text-[8px] px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex-shrink-0 uppercase font-bold">
            Relapsed
          </span>
        ) : habit.hasDetails && hasContent && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 flex-shrink-0">
            {isTagsType ? `${tags.length}` : '📝'}
          </span>
        )}
      </div>

      {/* Expandable detail section */}
      {habit.hasDetails && showDetails && (
        <div className={`px-4 pb-3 pt-3 ${isRelapse && isDone ? 'border-t border-red-500/20' : 'border-t border-white/5'}`}>
          <label className={`text-xs mb-2 block font-medium ${isRelapse ? 'text-red-400/70' : 'text-white/40'}`}>
            {habit.detailField.label}
          </label>

          {isTagsType ? (
            <div onClick={e => e.stopPropagation()}>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                             bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs">
                      {tag}
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveTag(i); }}
                        className="text-brand-400/60 hover:text-brand-300 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={habit.detailField.placeholder}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  className="input-base py-2 text-sm flex-1"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="btn-primary px-3 py-2 text-sm disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            </div>
          ) : habit.detailField.multiline ? (
            <textarea
              ref={inputRef}
              className={`input-base text-sm resize-none ${isRelapse ? 'border-red-500/30 focus:border-red-500' : ''}`}
              placeholder={habit.detailField.placeholder}
              value={detailValue}
              onChange={e => handleDetailChange(e.target.value)}
              rows={2}
              onClick={e => e.stopPropagation()}
            />
          ) : habit.detailField.type === 'time' ? (
            <input
              ref={inputRef}
              type="time"
              className="input-base text-sm w-36"
              value={detailValue}
              onChange={e => handleDetailChange(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              className="input-base text-sm"
              placeholder={habit.detailField.placeholder}
              value={detailValue}
              onChange={e => handleDetailChange(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
