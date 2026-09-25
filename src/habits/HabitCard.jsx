// src/habits/HabitCard.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';

export default function HabitCard({ habit, data, onToggle, onUpdateDetails }) {
  const isDone        = data?.done || false;
  const [showDetails, setShowDetails] = useState(false);
  const [tagInput,    setTagInput]    = useState('');
  const [draftText,   setDraftText]   = useState('');
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

  // Normal styling
  const cardBg = isDone
      ? 'bg-[#a7f3d0] border-black'
      : 'bg-white border-black hover:bg-gray-50';

  const checkboxStyle = isDone
      ? 'bg-[#10b981] border-black shadow-[2px_2px_0px_#000]'
      : 'bg-white border-black shadow-[2px_2px_0px_#000]';

  return (
    <div className={`rounded-lg border-[3px] transition-all duration-200 ${cardBg}`}>

      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={handleCheck}
      >
        {/* Checkbox */}
        <div className={`w-6 h-6 rounded-md border-[3px] flex items-center justify-center flex-shrink-0 transition-all duration-150
          ${checkboxStyle}`}>
          {isDone && <Check className="w-4 h-4 text-white font-bold" strokeWidth={4} />}
        </div>

        <span className="text-xl leading-none select-none">{habit.emoji}</span>

        <div className="flex-1 min-w-0">
          <p className={`text-base font-bold transition-all duration-150
            ${isDone ? 'text-black/60 line-through' : 'text-black'}`}>
            {habit.name}
          </p>
          {timestamp && <p className="text-xs text-black/50 mt-0.5 font-bold uppercase">{timestamp}</p>}
        </div>

        {/* Detail content indicator */}
        {habit.hasDetails && hasContent && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border-[2px] border-black text-black flex-shrink-0 shadow-[2px_2px_0px_#000]">
            {isTagsType ? `${tags.length}` : '📝'}
          </span>
        )}
      </div>

      {/* Expandable detail section */}
      {habit.hasDetails && showDetails && (
        <div className="px-4 pb-4 pt-3 border-t-[3px] border-black bg-gray-50">
          <label className="text-xs mb-2 block font-bold uppercase text-black/70">
            {habit.detailField.label}
          </label>

          {isTagsType ? (
            <div onClick={e => e.stopPropagation()}>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex font-bold items-center gap-1 px-3 py-1 rounded-full
                                             bg-white border-[2px] border-black text-black text-xs shadow-[2px_2px_0px_#000]">
                      {tag}
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveTag(i); }}
                        className="text-black/60 hover:text-black transition-colors ml-1"
                      >
                        <X className="w-3 h-3" strokeWidth={3} />
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
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-30 shadow-[2px_2px_0px_#000]"
                >
                  Add
                </button>
              </div>
            </div>
          ) : habit.detailField.type === 'time' ? (
            <input
              ref={inputRef}
              type="time"
              className="input-base text-sm w-36"
              value={detailValue}
              onChange={e => handleDetailChange(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          ) : detailValue ? (
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg border-[3px] border-black bg-white shadow-[2px_2px_0px_#000]">
              <p className="text-sm font-bold whitespace-pre-wrap flex-1 text-black">{detailValue}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDetailChange(''); }}
                className="text-black/40 hover:text-red-500 transition-colors p-1"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {habit.detailField.multiline ? (
                <textarea
                  ref={inputRef}
                  className="input-base text-sm resize-none"
                  placeholder={habit.detailField.placeholder}
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  rows={2}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  className="input-base text-sm"
                  placeholder={habit.detailField.placeholder}
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (draftText.trim()) handleDetailChange(draftText.trim()); } }}
                  onClick={e => e.stopPropagation()}
                />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (draftText.trim()) { handleDetailChange(draftText.trim()); setDraftText(''); } }}
                disabled={!draftText.trim()}
                className="btn-primary self-end px-4 py-2 text-xs disabled:opacity-30 shadow-[2px_2px_0px_#000]"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
