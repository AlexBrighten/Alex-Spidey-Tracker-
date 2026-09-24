// src/components/Dashboard.jsx
// Main dashboard: setup form + master ring + day goals + history feed + site pin settings

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Play, LogOut, ChevronDown, History, Pin, PinOff, Settings, X, Plus, Globe, Bell } from 'lucide-react';
import MasterRing from './MasterRing';
import SessionHistory from './SessionHistory';
import DayGoals from './DayGoals';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';

const CATEGORIES = [
  'Core Java & DSA',
  'MERN Backend',
  'CS Fundamentals',
  'System Design',
  'Product Management',
];

const PRESETS = [30, 45, 60, 90];

export default function Dashboard({
  user, stats, sessions, loading, onStart,
  sitePinEnabled, setSitePinEnabled, sitePinTimeout, setSitePinTimeout,
  sitePins, setSitePin,
}) {
  const [duration, setDuration]       = useState(45);
  const [customDur, setCustomDur]     = useState('');
  const [useCustom, setUseCustom]     = useState(false);
  const [category, setCategory]       = useState(CATEGORIES[0]);
  const [intendedGoal, setIntendedGoal] = useState('');
  const [formError, setFormError]     = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newPinCategory, setNewPinCategory] = useState('');
  const [newPinUrl, setNewPinUrl]     = useState('');

  const effectiveDuration = useCustom
    ? parseInt(customDur, 10) || 0
    : duration;

  // Check if selected category has a site pin
  const selectedCategoryPin = sitePinEnabled ? sitePins[category] : null;

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

  const handleAddSitePin = () => {
    if (newPinCategory && newPinUrl.trim()) {
      const url = newPinUrl.trim().startsWith('http') ? newPinUrl.trim() : `https://${newPinUrl.trim()}`;
      setSitePin(newPinCategory, url);
      setNewPinCategory('');
      setNewPinUrl('');
    }
  };

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
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-ghost flex items-center gap-2 text-[8px] px-3 py-2 ${showSettings ? 'text-[#ef4444]' : ''}`}
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={handleSignOut}
            className="btn-ghost flex items-center gap-2 text-[8px] px-3 py-2"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </header>

      {/* Settings Panel — Site Pinning */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="pixel-card">
              <div className="pixel-header flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#93c5fd]" />
                Site Pinning Settings
              </div>
              <div className="p-5 space-y-5">
                {/* Notifications Settings */}
                <div className="border-b-2 border-white/10 pb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#ef4444]" />
                      <div>
                        <p className="text-[9px] font-bold text-white uppercase">Desktop Notifications</p>
                        <p className="text-[7px] text-white/40 uppercase mt-1">
                          Alerts for session completion & auto-aborts
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={async () => {
                          const status = await requestNotificationPermission();
                          if (status === 'granted') {
                            alert('Notifications are enabled!');
                          } else {
                            alert(`Notification permission: ${status}`);
                          }
                        }}
                        className="btn-ghost px-3 py-2 text-[7px]"
                      >
                        Enable
                      </button>
                      <button
                        onClick={() => sendNotification('Test Notification', { body: 'Notifications are working! 🎉' })}
                        className="btn-ghost px-3 py-2 text-[7px]"
                      >
                        Test Alert
                      </button>
                    </div>
                  </div>
                </div>
                {/* Master Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#ef4444]" />
                    <div>
                      <p className="text-[9px] font-bold text-white uppercase">Enable Site Pinning</p>
                      <p className="text-[7px] text-white/40 uppercase mt-1">
                        Lock specific categories to specific sites
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSitePinEnabled(!sitePinEnabled)}
                    className={`w-14 h-7 border-4 border-black flex items-center transition-none relative
                      ${sitePinEnabled ? 'bg-[#22c55e]' : 'bg-[#333]'}`}
                    style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
                  >
                    <div className={`w-5 h-5 bg-white border-2 border-black absolute transition-none
                      ${sitePinEnabled ? 'right-0' : 'left-0'}`}
                    />
                  </button>
                </div>

                {sitePinEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    {/* Abort timeout */}
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] text-white/60 uppercase">Abort after:</span>
                      <div className="flex gap-1.5">
                        {[2, 3, 4, 5].map(t => (
                          <button
                            key={t}
                            onClick={() => setSitePinTimeout(t)}
                            className={`preset-btn text-[8px] px-3 py-2
                              ${sitePinTimeout === t ? 'preset-btn-active' : 'preset-btn-inactive'}`}
                          >
                            {t} min
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current site pins */}
                    <div>
                      <p className="text-[8px] text-white/60 uppercase mb-3">Pinned Sites:</p>
                      {Object.keys(sitePins).length === 0 ? (
                        <p className="text-[7px] text-white/30 uppercase">No sites pinned yet</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(sitePins).map(([cat, url]) => (
                            <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-[#111] border-2 border-white/10">
                              <Pin className="w-3 h-3 text-[#f59e0b] flex-shrink-0" />
                              <span className="text-[8px] text-white/80 uppercase flex-shrink-0">{cat}</span>
                              <span className="text-[7px] text-[#93c5fd] truncate flex-1">→ {url}</span>
                              <button
                                onClick={() => setSitePin(cat, null)}
                                className="text-white/30 hover:text-[#ef4444] transition-none flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add new pin */}
                    <div className="border-t-2 border-white/10 pt-4">
                      <p className="text-[8px] text-white/60 uppercase mb-3">Add New Pin:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={newPinCategory}
                            onChange={e => setNewPinCategory(e.target.value)}
                            className="input-base appearance-none cursor-pointer pr-8 text-[8px]"
                          >
                            <option value="" className="bg-[#1a1a2e]">Select category...</option>
                            {CATEGORIES.filter(c => !sitePins[c]).map(c => (
                              <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g., scrimba.com"
                          value={newPinUrl}
                          onChange={e => setNewPinUrl(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSitePin(); }}
                          className="input-base flex-1 text-[8px]"
                        />
                        <button
                          onClick={handleAddSitePin}
                          disabled={!newPinCategory || !newPinUrl.trim()}
                          className="btn-primary px-3 py-0 disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="text-[7px] text-white/30 uppercase border-t-2 border-white/10 pt-3 space-y-1">
                      <p>📌 <strong className="text-white/50">How it works:</strong></p>
                      <p>• When you start a session for a pinned category, the pinned site opens automatically.</p>
                      <p>• If you come back to this tracker tab for longer than the timeout, the session auto-aborts.</p>
                      <p>• Categories without a pin have no restrictions — you can move freely across sites.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Day Goals */}
      <DayGoals user={user} />

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

            {/* Show pin indicator for selected category */}
            {selectedCategoryPin && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#f59e0b]/10 border-2 border-[#f59e0b]/30">
                <Pin className="w-3 h-3 text-[#f59e0b]" />
                <span className="text-[7px] text-[#f59e0b] uppercase font-bold">
                  Pinned to {selectedCategoryPin} — will auto-open on start
                </span>
              </div>
            )}
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
            {selectedCategoryPin ? 'START & OPEN PINNED SITE' : 'START DEEP WORK'}
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
