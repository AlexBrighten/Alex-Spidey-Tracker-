// src/lib/habitFirestore.js
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, orderBy, getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getEmptyDayData, HABITS } from './habits';
import { calculateScore } from './habitUtils';

// ── Day document ────────────────────────────────────────────────────────────

export async function getDayData(userId, dateStr) {
  const dayRef  = doc(db, 'users', userId, 'days', dateStr);
  const daySnap = await getDoc(dayRef);
  if (daySnap.exists()) return { id: daySnap.id, ...daySnap.data() };

  const newDay = {
    date: dateStr,
    habits: getEmptyDayData(),
    score: 0,
    totalHabits: HABITS.length,
    targets: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(dayRef, newDay);
  return { id: dateStr, ...newDay };
}

export async function toggleHabit(userId, dateStr, habitId, currentState) {
  const dayRef  = doc(db, 'users', userId, 'days', dateStr);
  let daySnap   = await getDoc(dayRef);
  if (!daySnap.exists()) await getDayData(userId, dateStr);
  daySnap       = await getDoc(dayRef);

  const habits = { ...daySnap.data().habits };
  habits[habitId] = {
    ...habits[habitId],
    done: !currentState,
    timestamp: !currentState ? new Date().toISOString() : null,
  };
  const score = calculateScore(habits);
  await updateDoc(dayRef, { habits, score, updatedAt: serverTimestamp() });
  return { habits, score };
}

export async function updateHabitDetails(userId, dateStr, habitId, details) {
  const dayRef  = doc(db, 'users', userId, 'days', dateStr);
  let daySnap   = await getDoc(dayRef);
  if (!daySnap.exists()) await getDayData(userId, dateStr);
  daySnap       = await getDoc(dayRef);

  const habits = { ...daySnap.data().habits };
  habits[habitId] = { ...habits[habitId], details: { ...habits[habitId]?.details, ...details } };
  await updateDoc(dayRef, { habits, updatedAt: serverTimestamp() });
  return habits;
}

export async function getDaysInRange(userId, startDate, endDate) {
  const q = query(
    collection(db, 'users', userId, 'days'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Targets ─────────────────────────────────────────────────────────────────

export async function getTargets(userId, dateStr) {
  const dayRef  = doc(db, 'users', userId, 'days', dateStr);
  const daySnap = await getDoc(dayRef);
  if (!daySnap.exists()) return [];
  return daySnap.data().targets || [];
}

export async function saveTargets(userId, dateStr, targets) {
  const dayRef = doc(db, 'users', userId, 'days', dateStr);
  await setDoc(dayRef, { date: dateStr, targets, updatedAt: serverTimestamp() }, { merge: true });
}

export async function toggleTargetDone(userId, dateStr, targetIndex) {
  const dayRef  = doc(db, 'users', userId, 'days', dateStr);
  const daySnap = await getDoc(dayRef);
  if (!daySnap.exists()) return [];

  const targets = [...(daySnap.data().targets || [])];
  if (targets[targetIndex]) {
    targets[targetIndex] = { ...targets[targetIndex], done: !targets[targetIndex].done };
  }
  await updateDoc(dayRef, { targets, updatedAt: serverTimestamp() });
  return targets;
}
