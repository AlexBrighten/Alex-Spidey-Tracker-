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

  const {
    timerState, timeLeft, sessionMeta, start, pause, resume, abort,
    sitePinEnabled, setSitePinEnabled,
    sitePinTimeout, setSitePinTimeout,
    sitePins, setSitePin,
    activeSitePin, sitePinWarning,
  } = useTimer();
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
        <div className="text-black/40 text-sm animate-pulse font-bold">Loading…</div>
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
            background: '#fff',
            color: '#000',
            border: '3px solid #000',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: '"Space Grotesk", sans-serif',
            boxShadow: '4px 4px 0px #000',
            fontWeight: 'bold',
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
            activeSitePin={activeSitePin}
            sitePinWarning={sitePinWarning}
            sitePinTimeout={sitePinTimeout}
          />
        ) : tab === 'focus' ? (
          <Dashboard
            key="dashboard"
            user={user}
            stats={stats}
            sessions={sessions}
            loading={loading}
            onStart={handleStart}
            sitePinEnabled={sitePinEnabled}
            setSitePinEnabled={setSitePinEnabled}
            sitePinTimeout={sitePinTimeout}
            setSitePinTimeout={setSitePinTimeout}
            sitePins={sitePins}
            setSitePin={setSitePin}
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
                        bg-white border-t-[3px] border-black px-2
                        pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { playSfx(); setTab(id); }}
                className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-none
                  ${active ? 'text-black' : 'text-black/40 hover:text-black/70'}`}
              >
                <div className={`relative p-1.5 transition-none rounded-lg border-[3px] ${active ? 'bg-[#f9a8d4] border-black shadow-[2px_2px_0px_#000]' : 'border-transparent'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
