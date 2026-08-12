// src/lib/habitUtils.js
import { format, subDays, addDays, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { HABITS } from './habits';

// Day boundary at 3 AM — between midnight and 3 AM it's still "yesterday"
export function getEffectiveNow() {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

export function getTodayString()    { return format(getEffectiveNow(), 'yyyy-MM-dd'); }
export function getTomorrowString() { return format(addDays(getEffectiveNow(), 1), 'yyyy-MM-dd'); }

export function formatDateDisplay(dateStr) {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
}

export function getLastNDays(n) {
  const days = [];
  const effective = getEffectiveNow();
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(effective, i), 'yyyy-MM-dd'));
  }
  return days;
}

/**
 * Calculate daily habit score.
 * Normal habits: done === true → +1
 * Relapse habits (isRelapse): done === false → +1 (staying clean is the goal)
 */
export function calculateScore(habits) {
  if (!habits) return 0;
  let score = 0;
  for (const habit of HABITS) {
    const data = habits[habit.id];
    if (!data) continue;
    if (habit.isRelapse) {
      // Inverse: NOT checking (staying clean) = +1
      if (!data.done) score++;
    } else {
      // Normal: checking (completed) = +1
      if (data.done) score++;
    }
  }
  return score;
}

export function calculatePercentage(score, total = HABITS.length) {
  return Math.round((score / total) * 100);
}

export function calculateStreak(daysData) {
  if (!daysData || daysData.length === 0) return { current: 0, longest: 0 };

  const sorted  = [...daysData].sort((a, b) => b.date.localeCompare(a.date));
  const effective = getEffectiveNow();
  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    const expected = format(subDays(effective, i), 'yyyy-MM-dd');
    if (sorted[i].date === expected && sorted[i].score > 0) {
      current++;
    } else { break; }
  }

  for (const day of sorted) {
    if (day.score > 0) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else { tempStreak = 0; }
  }

  return { current, longest };
}

/**
 * Calculate "days clean" streak for a specific relapse habit.
 * A clean day = the habit was NOT checked (done === false or absent).
 */
export function calculateCleanStreak(daysData, habitId) {
  if (!daysData || daysData.length === 0) return { current: 0, longest: 0, totalRelapses: 0 };

  const sorted = [...daysData].sort((a, b) => b.date.localeCompare(a.date));
  const effective = getEffectiveNow();
  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let totalRelapses = 0;

  // Current streak
  for (let i = 0; i < sorted.length; i++) {
    const expected = format(subDays(effective, i), 'yyyy-MM-dd');
    if (sorted[i].date === expected && !sorted[i].habits?.[habitId]?.done) {
      current++;
    } else { break; }
  }

  // Longest streak + total relapses
  for (const day of sorted) {
    if (!day.habits?.[habitId]?.done) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
      totalRelapses++;
    }
  }

  return { current, longest, totalRelapses };
}

export function getCategoryScore(habits, categoryId) {
  if (!habits) return { done: 0, total: 0 };
  const categoryHabits = HABITS.filter(h => h.category === categoryId);
  const done = categoryHabits.filter(h => {
    const data = habits[h.id];
    if (!data) return false;
    if (h.isRelapse) return !data.done; // Clean = good
    return data.done;
  }).length;
  return { done, total: categoryHabits.length };
}

export function getCompletionColor(percentage) {
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 60) return '#a855f7';
  if (percentage >= 40) return '#f59e0b';
  return '#ef4444';
}

/**
 * Get the current ISO week's weekday dates (Mon-Fri).
 */
export function getCurrentWeekWeekdays() {
  const effective = getEffectiveNow();
  const weekStart = startOfWeek(effective, { weekStartsOn: 1 }); // Monday
  const days = [];
  for (let i = 0; i < 5; i++) {
    days.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
  }
  return days;
}

/**
 * Check if today is a weekend (Sat or Sun).
 */
export function isWeekend() {
  const day = getEffectiveNow().getDay();
  return day === 0 || day === 6;
}
