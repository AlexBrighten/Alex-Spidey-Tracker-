// src/components/TimerView.jsx
// Full-screen distraction-free countdown UI

import { motion } from 'framer-motion';
import { Pause, Play, XCircle } from 'lucide-react';

const RADIUS       = 130;
const STROKE       = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerView({ timerState, timeLeft, sessionMeta, totalSeconds, onPause, onResume, onAbort }) {
  const progress   = totalSeconds > 0 ? timeLeft / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const isPaused = timerState === 'paused';

  const handleAbort = () => {
    if (window.confirm('Are you sure you want to kill this session? Progress will not be logged.')) {
      onAbort();
    }
  };

  return (
    <motion.div
      key="timer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4"
    >
      {/* Retro scanlines overlay instead of background blobs */}
      <div className="pointer-events-none fixed inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }} />

      <div className="flex flex-col items-center gap-10 relative z-10 w-full max-w-sm">
        
        {/* Logo at the top */}
        <div className="w-16 h-16 mb-2">
          <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-xl shadow-2xl" />
        </div>

        {/* Session metadata */}
        <div className="text-center space-y-3 pixel-card p-4 w-full">
          <div className="inline-flex items-center gap-3 px-3 py-2 bg-[#ef4444] border-4 border-black text-white text-[8px] uppercase font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            <span className={`w-3 h-3 border-2 border-black ${isPaused ? 'bg-yellow-400' : 'bg-black animate-pulse'}`} />
            {isPaused ? 'PAUSED' : 'DEEP WORK ACTIVE'}
          </div>
          <h2 className="text-[12px] font-bold text-white uppercase text-shadow mt-4">{sessionMeta?.category}</h2>
          <p className="text-[#93c5fd] text-[8px] uppercase">{sessionMeta?.intendedGoal}</p>
        </div>

        {/* SVG Ring + Timer */}
        <div className="relative flex items-center justify-center">
          {/* Glow */}
          <motion.div
            animate={{ opacity: isPaused ? 0.2 : [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)' }}
          />

          <svg
            width={300}
            height={300}
            viewBox={`0 0 ${(RADIUS + STROKE) * 2 + 4} ${(RADIUS + STROKE) * 2 + 4}`}
            className="rotate-[-90deg]"
          >
            {/* Track */}
            <circle
              cx={RADIUS + STROKE + 2}
              cy={RADIUS + STROKE + 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <motion.circle
              cx={RADIUS + STROKE + 2}
              cy={RADIUS + STROKE + 2}
              r={RADIUS}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#06b6d4" />
                <stop offset="50%"  stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={`${mm}:${ss}`}
              className="font-mono text-6xl font-black text-white timer-glow tabular-nums"
              animate={{ scale: isPaused ? [1, 0.97, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isPaused ? Infinity : 0 }}
            >
              {mm}:{ss}
            </motion.span>
            <span className="text-white/30 text-sm mt-1">
              {Math.round(progress * 100)}% remaining
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 w-full">
          <button
            onClick={isPaused ? onResume : onPause}
            className="btn-primary flex items-center gap-3 px-6 py-4 text-[10px] flex-1 justify-center"
          >
            {isPaused
              ? <><Play className="w-5 h-5 fill-current" /> RESUME</>
              : <><Pause className="w-5 h-5 fill-current" /> PAUSE</>}
          </button>

          <button
            onClick={handleAbort}
            className="flex items-center justify-center gap-3 px-6 py-4 border-4 border-[#ef4444] text-[#ef4444]
                       bg-black hover:bg-[#ef4444] hover:text-black transition-none font-bold text-[10px] uppercase shadow-[4px_4px_0px_#ef4444]"
          >
            <XCircle className="w-5 h-5" />
            ABORT
          </button>
        </div>

        {/* Progress text */}
        <p className="text-[#93c5fd] text-[7px] text-center uppercase mt-4">
          STAY FOCUSED. EVERY MINUTE IS PROOF OF WORK.
        </p>
      </div>
    </motion.div>
  );
}
