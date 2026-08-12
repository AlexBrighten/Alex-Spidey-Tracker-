// src/lib/habits.js
export const HABIT_CATEGORIES = [
  { id: 'spiritual', name: 'Spiritual',          icon: '🙏', color: '#a855f7' },
  { id: 'health',   name: 'Health & Discipline', icon: '💪', color: '#22c55e' },
  { id: 'career',   name: 'Career & Growth',     icon: '💻', color: '#3b82f6' },
  { id: 'relapses', name: 'Accountability',       icon: '⚠️', color: '#dc2626' },
];

export const HABITS = [
  // ── Spiritual ──────────────────────────────────────────────────────────────
  { id: 'morningPrayer', name: 'Morning Prayer',           category: 'spiritual', emoji: '🌅', hasDetails: false },
  {
    id: 'bibleReading',  name: 'Bible Reading',             category: 'spiritual', emoji: '📖', hasDetails: true,
    detailField: { key: 'chapter',    label: 'What did you read?',       placeholder: 'e.g., Psalm 23',   type: 'tags' },
  },
  {
    id: 'memoryVerse',   name: 'Memory Verse',              category: 'spiritual', emoji: '✍️', hasDetails: true,
    detailField: { key: 'verse',      label: 'Which verse?',             placeholder: 'e.g., John 3:16',  type: 'tags' },
  },
  {
    id: 'nightPrayer',   name: 'Night Prayer & Reflection', category: 'spiritual', emoji: '🌙', hasDetails: true,
    detailField: { key: 'reflection', label: 'Reflection notes',         placeholder: 'What are you grateful for today?', multiline: true },
  },

  // ── Health & Discipline ────────────────────────────────────────────────────
  { id: 'hydrated',           name: 'Hydrated',                 category: 'health', emoji: '💧', hasDetails: false },
  { id: 'didntSkipMeal',      name: "Didn't Skip a Meal",       category: 'health', emoji: '🍽️', hasDetails: false },
  { id: 'enoughSleep',        name: 'Enough Sleep',              category: 'health', emoji: '😴', hasDetails: false },
  {
    id: 'wokeUpEarly',        name: 'Woke Up Early',             category: 'health', emoji: '⏰', hasDetails: true,
    detailField: { key: 'wakeTime',  label: 'Wake time',               placeholder: '', type: 'time' },
  },
  { id: 'noMindlessScrolling',name: 'No Mindless Scrolling',    category: 'health', emoji: '📵', hasDetails: false },

  // ── Career & Growth ────────────────────────────────────────────────────────
  {
    id: 'leetcode',     name: 'Leetcode',        category: 'career', emoji: '🧩', hasDetails: true,
    detailField: { key: 'problems',  label: 'Problems solved',         placeholder: 'e.g., Two Sum (Easy)', type: 'tags' },
  },
  {
    id: 'mernStack',    name: 'MERN Stack',      category: 'career', emoji: '⚛️', hasDetails: true,
    detailField: { key: 'topics',    label: 'What did you cover?',     placeholder: 'e.g., REST API with Express', type: 'tags' },
  },
  {
    id: 'techJournal',  name: 'Tech Journal',    category: 'career', emoji: '📓', hasDetails: true,
    detailField: { key: 'entry',     label: "Today's entry",           placeholder: 'What technical insights did you gain?', multiline: true },
  },
  {
    id: 'csFundamentals',name: 'CS Fundamentals',category: 'career', emoji: '🎓', hasDetails: true,
    detailField: { key: 'topic',     label: 'Topic covered',           placeholder: 'e.g., Binary Search Trees', type: 'tags' },
  },
  {
    id: 'linkedinPost', name: 'LinkedIn Post',   category: 'career', emoji: '💼', hasDetails: true,
    detailField: { key: 'postTopic', label: 'What did you post about?',placeholder: 'e.g., React hooks journey', type: 'tags' },
  },

  // ── Accountability (Relapse Trackers) ──────────────────────────────────────
  // These are INVERSE habits: checking = relapse (bad). NOT checking = clean day (good).
  {
    id: 'masturbationRelapse', name: 'Masturbation', category: 'relapses', emoji: '🍆', hasDetails: true, isRelapse: true,
    detailField: { key: 'trigger', label: 'What triggered this?', placeholder: 'e.g., Boredom, stress, late night scrolling...', multiline: true },
  },
  {
    id: 'pornRelapse', name: 'Porn', category: 'relapses', emoji: '🔞', hasDetails: true, isRelapse: true,
    detailField: { key: 'trigger', label: 'What triggered this?', placeholder: 'e.g., Instagram reels, alone at home...', multiline: true },
  },
];

export function getHabitById(id)         { return HABITS.find(h => h.id === id); }
export function getHabitsByCategory(cat) { return HABITS.filter(h => h.category === cat); }
export function getCategoryById(id)      { return HABIT_CATEGORIES.find(c => c.id === id); }
export function getRelapseHabits()       { return HABITS.filter(h => h.isRelapse); }
export function getNonRelapseHabits()    { return HABITS.filter(h => !h.isRelapse); }

export function getEmptyDayData() {
  const habits = {};
  HABITS.forEach(habit => {
    habits[habit.id] = { done: false, timestamp: null, ...(habit.hasDetails ? { details: {} } : {}) };
  });
  return habits;
}
