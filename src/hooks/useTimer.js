// src/hooks/useTimer.js
// Drift-free timer using a fixed wall-clock endTime.
// Handles background-tab throttling via visibilitychange.
// Persists session to localStorage so accidental refresh restores it.
// Supports site-pinning: per-category pinned URLs that auto-abort if user leaves the pinned site.
// Uses Web Worker for accurate background ticking.

import { useState, useEffect, useRef, useCallback } from 'react';
import { sendNotification, requestNotificationPermission } from '../lib/notifications';

const LS_KEY = 'pow_active_session';
const LS_SETTINGS_KEY = 'pow_timer_settings';

// Default site pins — users can customize
const DEFAULT_SITE_PINS = {
  'MERN Backend': 'https://scrimba.com',
};

// Load persisted settings
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY));
    return {
      sitePinEnabled: s?.sitePinEnabled ?? true,
      sitePinTimeout: s?.sitePinTimeout ?? 3, // minutes before abort
      sitePins: s?.sitePins ?? DEFAULT_SITE_PINS,
    };
  } catch {
    return { sitePinEnabled: true, sitePinTimeout: 3, sitePins: DEFAULT_SITE_PINS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
}

// Create a Web Worker blob for background ticking
function createWorkerBlob() {
  const workerCode = `
    let intervalId = null;
    self.onmessage = function(e) {
      if (e.data === 'start') {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => { self.postMessage('tick'); }, 1000);
      } else if (e.data === 'stop') {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      }
    };
  `;
  return new Blob([workerCode], { type: 'application/javascript' });
}

export function useTimer() {
  const [timerState, setTimerState] = useState(null); // null | 'running' | 'paused' | 'done'
  const [timeLeft, setTimeLeft] = useState(0);        // seconds
  const [sessionMeta, setSessionMeta] = useState(null);

  // Site pinning settings
  const [sitePinEnabled, setSitePinEnabled] = useState(() => loadSettings().sitePinEnabled);
  const [sitePinTimeout, setSitePinTimeout] = useState(() => loadSettings().sitePinTimeout);
  const [sitePins, setSitePins]             = useState(() => loadSettings().sitePins);

  // Runtime: is the current session site-pinned?
  const [activeSitePin, setActiveSitePin] = useState(null); // null or URL string
  const [sitePinWarning, setSitePinWarning] = useState(false); // true when user is back on tracker during a pinned session

  const endTimeRef        = useRef(null);
  const pauseLeftRef      = useRef(null);
  const rafRef            = useRef(null);
  const audioCtxRef       = useRef(null);
  const onDoneRef         = useRef(null);
  const workerRef         = useRef(null);
  const sitePinTimerRef   = useRef(null); // timeout for site-pin auto-abort
  const visibleSinceRef   = useRef(null); // when tracker tab became visible during site-pin

  // Persist settings
  useEffect(() => {
    saveSettings({ sitePinEnabled, sitePinTimeout, sitePins });
  }, [sitePinEnabled, sitePinTimeout, sitePins]);

  // Helper: update a single site pin
  const setSitePin = useCallback((category, url) => {
    setSitePins(prev => {
      const next = { ...prev };
      if (url) {
        next[category] = url;
      } else {
        delete next[category];
      }
      return next;
    });
  }, []);

  // ── Web Worker lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const blob = createWorkerBlob();
      const url = URL.createObjectURL(blob);
      workerRef.current = new Worker(url);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Web Worker creation failed, falling back to rAF only', e);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.25);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.25 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.6);

      oscillator.start(ctx.currentTime + i * 0.25);
      oscillator.stop(ctx.currentTime + i * 0.25 + 0.7);
    });
  }, []);

  // ── Tick logic ────────────────────────────────────────────────────────────
  const doTick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    setTimeLeft(remaining);

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
      if (workerRef.current) workerRef.current.postMessage('stop');
      sendNotification('🎉 Session Complete!', {
        body: `Your ${cat} session is done. Time to log your progress!`,
      });
      if (onDoneRef.current) onDoneRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(doTick);
  }, [playChime]);

  // ── Worker message handler ────────────────────────────────────────────────
  useEffect(() => {
    if (!workerRef.current) return;
    const handleMsg = () => {
      if (endTimeRef.current && document.visibilityState === 'hidden') {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setTimerState('done');
          localStorage.removeItem(LS_KEY);
          playChime();
          workerRef.current?.postMessage('stop');
          sendNotification('🎉 Session Complete!', {
            body: 'Your focus session is done!',
          });
          if (onDoneRef.current) onDoneRef.current();
        }
      }
    };
    workerRef.current.onmessage = handleMsg;
  }, [playChime]);

  // ── Force abort (used by site-pin auto-abort) ─────────────────────────────
  const forceAbort = useCallback((reason) => {
    cancelAnimationFrame(rafRef.current);
    if (workerRef.current) workerRef.current.postMessage('stop');
    if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
    endTimeRef.current   = null;
    pauseLeftRef.current = null;
    localStorage.removeItem(LS_KEY);
    setTimerState(null);
    setTimeLeft(0);
    setSessionMeta(null);
    setActiveSitePin(null);
    setSitePinWarning(false);
    visibleSinceRef.current = null;
    document.title = 'Focus Tracker';
    sendNotification('⏸️ Session Auto-Aborted', {
      body: reason || 'Session was stopped.',
    });
  }, []);

  // ── Site-Pin visibility handler ───────────────────────────────────────────
  // For site-pinned sessions: the tracker tab should be HIDDEN (user on pinned site).
  // If tracker becomes VISIBLE, start countdown to abort.
  useEffect(() => {
    const handleVisibility = () => {
      const isRunning = timerState === 'running';

      if (document.visibilityState === 'visible') {
        // Tab became visible
        if (isRunning) {
          // Recalculate timer immediately
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(doTick);
        }

        // If we have an active site pin, user came BACK to tracker = they left the pinned site
        if (isRunning && activeSitePin) {
          visibleSinceRef.current = Date.now();
          setSitePinWarning(true);

          // Start abort countdown
          const timeoutMs = sitePinTimeout * 60 * 1000;
          if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
          sitePinTimerRef.current = setTimeout(() => {
            forceAbort(`You left ${activeSitePin} for more than ${sitePinTimeout} min. Session aborted.`);
          }, timeoutMs);
        }
      } else if (document.visibilityState === 'hidden') {
        // Tab became hidden — start worker for background ticking
        if (isRunning && workerRef.current) {
          workerRef.current.postMessage('start');
        }

        // If site-pinned, user went back to the pinned site — cancel abort timer
        if (activeSitePin) {
          visibleSinceRef.current = null;
          setSitePinWarning(false);
          if (sitePinTimerRef.current) {
            clearTimeout(sitePinTimerRef.current);
            sitePinTimerRef.current = null;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
    };
  }, [timerState, doTick, activeSitePin, sitePinTimeout, forceAbort]);

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
        rafRef.current = requestAnimationFrame(doTick);
        if (workerRef.current) workerRef.current.postMessage('start');
        // Restore site pin if applicable
        if (data.activeSitePin) {
          setActiveSitePin(data.activeSitePin);
        }
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      localStorage.removeItem(LS_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Request notification permission on mount ───────────────────────────────
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────
  const start = useCallback(({ durationMinutes, category, intendedGoal, onDone }) => {
    initAudio();
    onDoneRef.current = onDone;
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    endTimeRef.current = endTime;

    // Check if this category has a site pin
    const pinnedUrl = sitePinEnabled ? sitePins[category] : null;

    const meta = { endTime, durationMinutes, category, intendedGoal, activeSitePin: pinnedUrl || null };
    localStorage.setItem(LS_KEY, JSON.stringify(meta));

    setSessionMeta({ category, intendedGoal, durationMinutes });
    setTimeLeft(durationMinutes * 60);
    setTimerState('running');
    setActiveSitePin(pinnedUrl || null);
    setSitePinWarning(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(doTick);
    if (workerRef.current) workerRef.current.postMessage('start');

    // Auto-open the pinned site in a new tab
    if (pinnedUrl) {
      const url = pinnedUrl.startsWith('http') ? pinnedUrl : `https://${pinnedUrl}`;
      window.open(url, '_blank');
    }
  }, [initAudio, doTick, sitePinEnabled, sitePins]);

  const pause = useCallback(() => {
    if (timerState !== 'running') return;
    cancelAnimationFrame(rafRef.current);
    if (workerRef.current) workerRef.current.postMessage('stop');
    if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
    pauseLeftRef.current = Math.round((endTimeRef.current - Date.now()) / 1000);
    endTimeRef.current = null;
    setTimerState('paused');
    setSitePinWarning(false);
    document.title = 'Paused | Focus Tracker';
  }, [timerState]);

  const resume = useCallback(() => {
    if (timerState !== 'paused') return;
    endTimeRef.current = Date.now() + pauseLeftRef.current * 1000;

    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      localStorage.setItem(LS_KEY, JSON.stringify({ ...data, endTime: endTimeRef.current }));
    }

    setTimerState('running');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(doTick);
    if (workerRef.current) workerRef.current.postMessage('start');

    // If site-pinned, re-open the pinned site
    if (activeSitePin) {
      const url = activeSitePin.startsWith('http') ? activeSitePin : `https://${activeSitePin}`;
      window.open(url, '_blank');
    }
  }, [timerState, doTick, activeSitePin]);

  const abort = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (workerRef.current) workerRef.current.postMessage('stop');
    if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
    endTimeRef.current   = null;
    pauseLeftRef.current = null;
    localStorage.removeItem(LS_KEY);
    setTimerState(null);
    setTimeLeft(0);
    setSessionMeta(null);
    setActiveSitePin(null);
    setSitePinWarning(false);
    visibleSinceRef.current = null;
    document.title = 'Focus Tracker';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (workerRef.current) workerRef.current.postMessage('stop');
      if (sitePinTimerRef.current) clearTimeout(sitePinTimerRef.current);
      document.title = 'Focus Tracker';
    };
  }, []);

  return {
    timerState, timeLeft, sessionMeta,
    start, pause, resume, abort,
    // Site pin settings
    sitePinEnabled, setSitePinEnabled,
    sitePinTimeout, setSitePinTimeout,
    sitePins, setSitePin,
    // Runtime site-pin state
    activeSitePin, sitePinWarning,
  };
}
