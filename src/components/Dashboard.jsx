// src/components/Dashboard.jsx
// Main dashboard: setup form + master ring + history feed

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Play, LogOut, ChevronDown, History } from 'lucide-react';
import MasterRing from './MasterRing';
import SessionHistory from './SessionHistory';

const CATEGORIES = [
  'Core Java & DSA',
  'MERN Backend',
  'CS Fundamentals',
  'System Design',
];

const PRESETS = [30, 45, 60, 90];

export default function Dashboard({ user, stats, sessions, loading, onStart }) {
  const [duration, setDuration]       = useState(45);
  const [customDur, setCustomDur]     = useState('');
  const [useCustom, setUseCustom]     = useState(false);
  const [category, setCategory]       = useState(CATEGORIES[0]);
  const [intendedGoal, setIntendedGoal] = useState('');
  const [formError, setFormError]     = useState('');

  const effectiveDuration = useCustom
    ? parseInt(customDur, 10) || 0
    : duration;

  const handleStart = (e) => {
    e.preventDefault();
    if (!intendedGoal.trim()) {
      setFormError('Please set an intended goal for this session.');
      return;
    }
    if (effectiveDuration < 5 || effectiveDuration > 480) {
      setFormError('Duration must be between 5 and 480 minutes.');
      return;
    }
    setFormError('');
    onStart({ durationMinutes: effectiveDuration, category, intendedGoal: intendedGoal.trim() });
  };

  const handleSignOut = () => signOut(auth);

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-8 pb-24 max-w-2xl mx-auto"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-10 pixel-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black border-4 border-white p-0.5 shadow-[4px_4px_0px_#ef4444]">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-[12px] font-bold text-white leading-none text-shadow">Spidey Tracker</h1>
            <p className="text-[#93c5fd] text-[7px] mt-1 uppercase">Mission Log</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-black border-2 border-white px-2 py-1">
            <span className="text-[#93c5fd] text-[8px] uppercase">{user.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-ghost flex items-center gap-2 text-[8px] px-3 py-2"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </header>

      {/* Master Ring */}
      <section className="pixel-card mb-8">
        <div className="pixel-header">
          Progress to 800 Hours
        </div>
        <div className="p-8">
        {loading
          ? <div className="flex justify-center py-16"><Spinner /></div>
          : <MasterRing stats={stats} />}
        </div>
      </section>

      {/* Setup Form */}
      <section className="pixel-card mb-8">
        <div className="pixel-header">
          New Session
        </div>
        <div className="p-6">

        <form onSubmit={handleStart} className="space-y-5">
          {/* Duration presets */}
          <div>
            <label className="text-[9px] text-white/80 mb-3 block uppercase">Duration</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setDuration(p); setUseCustom(false); setFormError(''); }}
                  className={`preset-btn ${!useCustom && duration === p ? 'preset-btn-active' : 'preset-btn-inactive'}`}
                >
                  {p} min
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setUseCustom(true); setFormError(''); }}
                className={`preset-btn ${useCustom ? 'preset-btn-active' : 'preset-btn-inactive'}`}
              >
                Custom
              </button>
            </div>

            {useCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <input
                  type="number"
                  min={5}
                  max={480}
                  placeholder="Enter minutes (5–480)"
                  value={customDur}
                  onChange={(e) => { setCustomDur(e.target.value); setFormError(''); }}
                  className="input-base w-48"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-[9px] text-white/80 mb-3 block uppercase">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-base appearance-none cursor-pointer pr-10"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Intended Goal */}
          <div>
            <label className="text-[9px] text-white/80 mb-3 block uppercase">
              Intended Goal
              <span className="text-red-400 ml-2">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Solve 3 medium DP problems on LeetCode"
              value={intendedGoal}
              onChange={(e) => { setIntendedGoal(e.target.value); setFormError(''); }}
              className="input-base"
              maxLength={200}
            />
          </div>

          {formError && (
            <p className="text-red-400 text-[8px] bg-black border-4 border-red-500 px-3 py-3 uppercase">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-4 py-5 text-[10px]"
          >
            <Play className="w-5 h-5 fill-current" />
            START DEEP WORK
          </button>
        </form>
        </div>
      </section>

      {/* History Feed */}
      <section className="pixel-card mt-8">
        <div className="pixel-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-[#93c5fd]" />
            Session History
          </div>
          {sessions.length > 0 && (
            <span className="text-[8px] text-white/50">{sessions.length} SESSIONS</span>
          )}
        </div>
        <div className="p-4">
        {loading
          ? <div className="flex justify-center py-10"><Spinner /></div>
          : <SessionHistory sessions={sessions} />}
        </div>
      </section>
    </motion.div>
  );
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full"
    />
  );
}
