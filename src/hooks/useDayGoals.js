// src/hooks/useDayGoals.js
// Day goals: set goals for today and log completion status
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getTodayString } from '../lib/habitUtils';

const GOALS_COLLECTION = 'dayGoals';

export function useDayGoals(uid) {
  const [goals, setGoals]     = useState([]);
  const [loading, setLoading] = useState(true);
  const today = getTodayString();

  const docRef = uid ? doc(db, GOALS_COLLECTION, `${uid}_${today}`) : null;

  // Load goals for today
  const loadGoals = useCallback(async () => {
    if (!uid || !docRef) return;
    setLoading(true);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setGoals(snap.data().goals || []);
      } else {
        setGoals([]);
      }
    } catch (err) {
      console.error('Failed to load day goals:', err);
    } finally {
      setLoading(false);
    }
  }, [uid, today]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  // Save goals helper
  const persist = async (updatedGoals) => {
    if (!docRef) return;
    try {
      await setDoc(docRef, {
        uid,
        date: today,
        goals: updatedGoals,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save day goals:', err);
    }
  };

  // Add a new goal
  const addGoal = async (text) => {
    const newGoal = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    await persist(updated);
    return newGoal;
  };

  // Toggle goal completion
  const toggleGoal = async (goalId) => {
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, done: !g.done, completedAt: !g.done ? new Date().toISOString() : null } : g
    );
    setGoals(updated);
    await persist(updated);
  };

  // Remove a goal
  const removeGoal = async (goalId) => {
    const updated = goals.filter(g => g.id !== goalId);
    setGoals(updated);
    await persist(updated);
  };

  // Edit a goal text
  const editGoal = async (goalId, newText) => {
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, text: newText } : g
    );
    setGoals(updated);
    await persist(updated);
  };

  // Computed
  const completedCount = goals.filter(g => g.done).length;
  const totalCount = goals.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return {
    goals,
    loading,
    addGoal,
    toggleGoal,
    removeGoal,
    editGoal,
    completedCount,
    totalCount,
    completionPct,
    allDone,
  };
}
