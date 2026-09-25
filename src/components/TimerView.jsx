// src/components/TimerView.jsx
// Full-screen distraction-free countdown UI with site-pin warnings

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, XCircle, ExternalLink, Pin, AlertTriangle } from 'lucide-react';

const RADIUS       = 130;
const STROKE       = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerView({
  timerState, timeLeft, sessionMeta, totalSeconds, onPause, onResume, onAbort,
  activeSitePin, sitePinWarning, sitePinTimeout,
}) {
  const [portalContainer, setPortalContainer] = useState(null);
  const pipWindowRef = useRef(null);

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

  const handleGoBackToPin = () => {
    if (activeSitePin) {
      const url = activeSitePin.startsWith('http') ? activeSitePin : `https://${activeSitePin}`;
      window.open(url, '_blank');
    }
  };

  const handlePopOut = async () => {
    let newWindow = null;
    try {
      if ('documentPictureInPicture' in window) {
        newWindow = await window.documentPictureInPicture.requestWindow({
          width: 400,
          height: 600,
        });
        
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            newWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            newWindow.document.head.appendChild(link);
          }
        });

        newWindow.addEventListener('pagehide', () => {
          setPortalContainer(null);
          pipWindowRef.current = null;
        });
      }
    } catch (err) {
      console.warn('PiP failed', err);
    }

    if (!newWindow) {
      newWindow = window.open('', '', 'width=400,height=600,left=200,top=200,menubar=no,toolbar=no,location=no,status=no');
      if (!newWindow) {
        alert('Please allow popups for this site to use the pop-out feature.');
        return;
      }
      Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(style => {
        newWindow.document.head.appendChild(style.cloneNode(true));
      });
      newWindow.addEventListener('beforeunload', () => {
        setPortalContainer(null);
        pipWindowRef.current = null;
      });
    }

    newWindow.document.body.className = "bg-[#020617] m-0 overflow-hidden";
    const div = newWindow.document.createElement('div');
    newWindow.document.body.appendChild(div);
    pipWindowRef.current = newWindow;
    setPortalContainer(div);
  };

  const handlePullBack = () => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
    }
  };

  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  const timerContent = (
    <div className="flex flex-col items-center gap-8 relative z-10 w-full max-w-sm mx-auto h-full justify-center py-8">
      
      {/* Logo at the top */}
      <div className="w-16 h-16 mb-2 shrink-0">
          <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-xl shadow-2xl" />
        </div>

        {/* Site Pin Warning Banner — flashing danger */}
        <AnimatePresence>
          {sitePinWarning && activeSitePin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div className="bg-[#ef4444] border-[3px] border-black p-4 text-center space-y-3"
                   style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5 text-black" />
                  <span className="text-sm font-bold text-black uppercase">
                    ⚠️ You left your pinned site!
                  </span>
                </motion.div>
                <p className="text-xs text-black/80 uppercase">
                  Session will auto-abort in {sitePinTimeout} min if you stay here
                </p>
                <button
                  onClick={handleGoBackToPin}
                  className="bg-black text-white px-4 py-2 border-[3px] border-white text-sm uppercase font-bold
                             hover:bg-white hover:text-black transition-none"
                  style={{ boxShadow: '2px 2px 0px rgba(255,255,255,0.3)' }}
                >
                  ↩ GO BACK TO {new URL(activeSitePin.startsWith('http') ? activeSitePin : `https://${activeSitePin}`).hostname.toUpperCase()}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session metadata */}
        <div className="text-center space-y-3 pixel-card p-4 w-full">
          <div className="inline-flex items-center gap-3 px-3 py-2 bg-[#ef4444] border-[3px] border-black text-white text-xs uppercase font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            <span className={`w-3 h-3 border-[3px] border-black ${isPaused ? 'bg-yellow-400' : 'bg-black animate-pulse'}`} />
            {isPaused ? 'PAUSED' : 'DEEP WORK ACTIVE'}
          </div>
          <h2 className="text-lg font-bold text-white uppercase mt-4">{sessionMeta?.category}</h2>
          <p className="text-white/60 text-sm uppercase font-bold">{sessionMeta?.intendedGoal}</p>
        </div>

        {/* Site Pin Status (non-warning) */}
        {activeSitePin && !sitePinWarning && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#22c55e]/20 border-2 border-[#22c55e]/40">
            <Pin className="w-3 h-3 text-[#22c55e]" />
            <span className="text-xs text-[#22c55e] uppercase font-bold">
              Pinned to {new URL(activeSitePin.startsWith('http') ? activeSitePin : `https://${activeSitePin}`).hostname}
            </span>
          </div>
        )}

        {/* SVG Ring + Timer */}
        <div className="relative flex items-center justify-center">
          {/* Glow */}
          <motion.div
            animate={{ opacity: isPaused ? 0.2 : sitePinWarning ? [0.5, 0.8, 0.5] : [0.3, 0.6, 0.3] }}
            transition={{ duration: sitePinWarning ? 0.5 : 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full blur-3xl"
            style={{ background: sitePinWarning
              ? 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)'
            }}
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
              stroke={sitePinWarning ? 'url(#warningGradient)' : 'url(#timerGradient)'}
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
              <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#ef4444" />
                <stop offset="50%"  stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={`${mm}:${ss}`}
              className={`font-mono text-6xl font-black tabular-nums
                ${sitePinWarning ? 'text-[#ef4444]' : 'text-white'} timer-glow`}
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
            className="btn-primary flex items-center gap-3 px-6 py-4 text-sm flex-1 justify-center"
          >
            {isPaused
              ? <><Play className="w-5 h-5 fill-current" /> RESUME</>
              : <><Pause className="w-5 h-5 fill-current" /> PAUSE</>}
          </button>

          <button
            onClick={handleAbort}
            className="flex items-center justify-center gap-3 px-6 py-4 border-4 border-[#ef4444] text-[#ef4444]
                       bg-black hover:bg-[#ef4444] hover:text-black transition-none font-bold text-sm uppercase shadow-[4px_4px_0px_#ef4444]"
          >
            <XCircle className="w-5 h-5" />
            ABORT
          </button>
        </div>

        <p className="text-white/50 text-xs text-center uppercase font-bold mt-4">
          STAY FOCUSED. EVERY MINUTE IS PROOF OF WORK.
        </p>
      </div>
  );

  return (
    <>
      {!portalContainer ? (
        <motion.div
          key="timer-main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-y-auto"
        >
          <div className="pointer-events-none fixed inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }} />

          <button 
            onClick={handlePopOut}
            className="absolute top-6 right-6 text-white/50 hover:text-[#93c5fd] flex items-center gap-2 text-sm uppercase transition-colors z-20"
            title="Pop out timer"
          >
            <ExternalLink className="w-4 h-4" /> POP OUT
          </button>

          {timerContent}
        </motion.div>
      ) : (
        <motion.div
          key="timer-placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen flex flex-col items-center justify-center px-4 relative"
        >
          <div className="pointer-events-none fixed inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }} />
          
          <div className="text-center space-y-6 pixel-card p-8">
            <h2 className="text-white text-[12px] font-bold uppercase text-shadow">Timer Popped Out</h2>
            <p className="text-white/60 text-sm uppercase font-bold">Your session is running in a mini-window.</p>
            <button 
              onClick={handlePullBack}
              className="btn-primary px-6 py-4 text-sm"
            >
              BRING BACK HERE
            </button>
          </div>
        </motion.div>
      )}

      {portalContainer && createPortal(
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-[#020617] text-white overflow-y-auto">
          <div className="pointer-events-none fixed inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }} />
          {timerContent}
        </div>,
        portalContainer
      )}
    </>
  );
}
