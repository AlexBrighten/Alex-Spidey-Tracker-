// src/hooks/useTimer.js
// Drift-free timer using a fixed wall-clock endTime.
// Handles background-tab throttling via visibilitychange.
// Persists session to localStorage so accidental refresh restores it.

import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'pow_active_session';

export function useTimer() {
  const [timerState, setTimerState] = useState(null); // null | 'running' | 'paused' | 'done'
  const [timeLeft, setTimeLeft] = useState(0);        // seconds
  const [sessionMeta, setSessionMeta] = useState(null);

  const endTimeRef    = useRef(null); // wall-clock ms when session ends
  const pauseLeftRef  = useRef(null); // seconds left when paused
  const rafRef        = useRef(null); // requestAnimationFrame id
  const audioCtxRef   = useRef(null); // AudioContext for chime
  const onDoneRef     = useRef(null); // callback when timer finishes

  // ── Audio ─────────────────────────────────────────────────────────────────
  // Called on "Start" click to unlock autoplay, then triggered on completion.
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type      = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.25);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.25 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.6);

      oscillator.start(ctx.currentTime + i * 0.25);
      oscillator.stop(ctx.currentTime + i * 0.25 + 0.7);
    });
  }, []);

  // ── Tick loop ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    setTimeLeft(remaining);

    // Update tab title
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const meta = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    const cat  = meta?.category ?? 'Focus';
    document.title = remaining > 0
      ? `(${mm}:${ss}) ${cat} | Focus Tracker`
      : 'Session Complete! | Focus Tracker';

    if (remaining <= 0) {
      setTimerState('done');
      localStorage.removeItem(LS_KEY);
      playChime();
      if (onDoneRef.current) onDoneRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [playChime]);

  // ── Visibility change: recalculate immediately on tab focus ────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && timerState === 'running') {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerState, tick]);

  // ── Restore session from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (Date.now() < data.endTime) {
        endTimeRef.current = data.endTime;
        setSessionMeta({ category: data.category, intendedGoal: data.intendedGoal, durationMinutes: data.durationMinutes });
        setTimeLeft(Math.round((data.endTime - Date.now()) / 1000));
        setTimerState('running');
        rafRef.current = requestAnimationFrame(tick);
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      localStorage.removeItem(LS_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────
  const start = useCallback(({ durationMinutes, category, intendedGoal, onDone }) => {
    initAudio();
    onDoneRef.current = onDone;
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    endTimeRef.current = endTime;

    const meta = { endTime, durationMinutes, category, intendedGoal };
    localStorage.setItem(LS_KEY, JSON.stringify(meta));

    setSessionMeta({ category, intendedGoal, durationMinutes });
    setTimeLeft(durationMinutes * 60);
    setTimerState('running');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [initAudio, tick]);

  const pause = useCallback(() => {
    if (timerState !== 'running') return;
    cancelAnimationFrame(rafRef.current);
    pauseLeftRef.current = Math.round((endTimeRef.current - Date.now()) / 1000);
    endTimeRef.current = null;
    setTimerState('paused');
    document.title = 'Paused | Focus Tracker';
  }, [timerState]);

  const resume = useCallback(() => {
    if (timerState !== 'paused') return;
    endTimeRef.current = Date.now() + pauseLeftRef.current * 1000;

    // Update localStorage with new endTime
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      localStorage.setItem(LS_KEY, JSON.stringify({ ...data, endTime: endTimeRef.current }));
    }

    setTimerState('running');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [timerState, tick]);

  const abort = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    endTimeRef.current   = null;
    pauseLeftRef.current = null;
    localStorage.removeItem(LS_KEY);
    setTimerState(null);
    setTimeLeft(0);
    setSessionMeta(null);
    document.title = 'Focus Tracker';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.title = 'Focus Tracker';
    };
  }, []);

  return { timerState, timeLeft, sessionMeta, start, pause, resume, abort };
}
