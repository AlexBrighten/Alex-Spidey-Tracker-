// src/App.jsx
// Root: Auth gate → tab bar (Focus | Habits) ↔ TimerView ↔ PostSessionModal

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { Zap, CheckSquare, BarChart2 } from 'lucide-react';
import { auth } from './firebase';
import { useTimer }    from './hooks/useTimer';
import { useSessions } from './hooks/useSessions';
import AuthScreen      from './components/AuthScreen';
import Dashboard       from './components/Dashboard';
import TimerView       from './components/TimerView';
import PostSessionModal from './components/PostSessionModal';
import HabitTracker    from './habits/HabitTracker';
import Analytics       from './analytics/Analytics';
import { playSfx }     from './lib/sfx';

const TABS = [
  { id: 'focus',     label: 'Focus',     icon: Zap },
  { id: 'habits',    label: 'Habits',    icon: CheckSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function App() {
  const [user,      setUser]      = useState(undefined); // undefined = loading
  const [tab,       setTab]       = useState('focus');
  const [showModal, setShowModal] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const { timerState, timeLeft, sessionMeta, start, pause, resume, abort } = useTimer();
  const { sessions, stats, loading, logSession } = useSessions(user?.uid);

  // Trigger modal when timer finishes
  useEffect(() => {
    if (timerState === 'done') setShowModal(true);
  }, [timerState]);

  const handleStart = ({ durationMinutes, category, intendedGoal }) => {
    start({ durationMinutes, category, intendedGoal, onDone: () => setShowModal(true) });
  };

  const handleLog = async ({ actualOutcome, proofUrl }) => {
    await logSession({
      uid: user.uid,
      durationMinutes: sessionMeta.durationMinutes,
      category: sessionMeta.category,
      intendedGoal: sessionMeta.intendedGoal,
      actualOutcome,
      proofUrl,
    });
    setShowModal(false);
    abort();
    document.title = 'Focus Tracker';
  };

  // Loading splash
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const isTimerActive = timerState === 'running' || timerState === 'paused';
  const totalSeconds  = (sessionMeta?.durationMinutes ?? 0) * 60;

  return (
    <>
      {/* Toast notifications for habits */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '4px solid #000',
            borderRadius: '0',
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
          },
        }}
      />
      {/* Main views */}
      <AnimatePresence mode="wait">
        {isTimerActive ? (
          <TimerView
            key="timer"
            timerState={timerState}
            timeLeft={timeLeft}
            sessionMeta={sessionMeta}
            totalSeconds={totalSeconds}
            onPause={pause}
            onResume={resume}
            onAbort={abort}
          />
        ) : tab === 'focus' ? (
          <Dashboard
            key="dashboard"
            user={user}
            stats={stats}
            sessions={sessions}
            loading={loading}
            onStart={handleStart}
          />
        ) : tab === 'habits' ? (
          <HabitTracker key="habits" user={user} />
        ) : (
          <Analytics key="analytics" user={user} />
        )}
      </AnimatePresence>

      {/* Post-session modal */}
      <AnimatePresence>
        {showModal && sessionMeta && (
          <PostSessionModal
            key="modal"
            sessionMeta={sessionMeta}
            onLog={handleLog}
          />
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar — hidden during active timer */}
      {!isTimerActive && (
        <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around
                        bg-[#020617] border-t-4 border-black px-2
                        pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { playSfx(); setTab(id); }}
                className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-none
                  ${active ? 'text-[#ef4444]' : 'text-white/40 hover:text-white/70'}`}
              >
                <div className={`relative p-1.5 transition-none border-4 ${active ? 'bg-[#2a2a35] border-black' : 'border-transparent'}`}>
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ef4444] border-2 border-black" />
                  )}
                </div>
                <span className="text-[7px] uppercase">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
