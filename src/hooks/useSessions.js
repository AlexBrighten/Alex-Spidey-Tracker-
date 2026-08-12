// src/hooks/useSessions.js
// Firestore real-time listener + write logic for focus sessions.

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const GOAL_HOURS = 800;
const GOAL_DATE  = new Date('2027-01-01T00:00:00');

function computeStats(sessions) {
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHours   = totalMinutes / 60;
  const hoursLeft    = Math.max(0, GOAL_HOURS - totalHours);

  const now          = new Date();
  const msLeft       = GOAL_DATE - now;
  const daysLeft     = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const requiredHoursPerDay = hoursLeft / daysLeft;

  return {
    totalHours,
    totalMinutes,
    hoursLeft,
    daysLeft,
    requiredHoursPerDay,
    progressPercent: Math.min(100, (totalHours / GOAL_HOURS) * 100),
  };
}

export function useSessions(uid) {
  const [sessions, setSessions]   = useState([]);
  const [stats, setStats]         = useState(computeStats([]));
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Sort descending by timestamp client-side
      docs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setSessions(docs);
      setStats(computeStats(docs));
      setLoading(false);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const logSession = async ({ uid, durationMinutes, category, intendedGoal, actualOutcome, proofUrl }) => {
    await addDoc(collection(db, 'sessions'), {
      uid,
      durationMinutes,
      category,
      intendedGoal,
      actualOutcome,
      proofUrl: proofUrl || '',
      timestamp: serverTimestamp(),
    });
  };

  return { sessions, stats, loading, logSession };
}

export { GOAL_HOURS, GOAL_DATE };
