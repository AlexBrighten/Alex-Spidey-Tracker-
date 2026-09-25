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
          <div className="w-12 h-12 bg-white border-[3px] border-black p-0.5 shadow-[2px_2px_0px_#000]">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black leading-none uppercase">Spidey Tracker</h1>
            <p className="text-black/60 text-xs mt-1 uppercase font-bold">Mission Log</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white border-[3px] border-black px-3 py-1 shadow-[2px_2px_0px_#000]">
            <span className="text-black font-bold text-xs uppercase">{user.email}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-ghost flex items-center gap-2 text-xs px-3 py-2 ${showSettings ? 'bg-[#f9a8d4]' : ''}`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="btn-ghost flex items-center gap-2 text-xs px-3 py-2"
          >
            <LogOut className="w-4 h-4" />
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
                <div className="border-b-[3px] border-black/10 pb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-black" />
                      <div>
                        <p className="text-sm font-bold text-black uppercase">Desktop Notifications</p>
                        <p className="text-xs text-black/60 uppercase mt-1 font-bold">
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
                        className="btn-ghost px-3 py-2 text-xs"
                      >
                        Enable
                      </button>
                      <button
                        onClick={() => sendNotification('Test Notification', { body: 'Notifications are working! 🎉' })}
                        className="btn-ghost px-3 py-2 text-xs"
                      >
                        Test Alert
                      </button>
                    </div>
                  </div>
                </div>
                {/* Master Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-black" />
                    <div>
                      <p className="text-sm font-bold text-black uppercase">Enable Site Pinning</p>
                      <p className="text-xs text-black/60 uppercase mt-1 font-bold">
                        Lock specific categories to specific sites
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSitePinEnabled(!sitePinEnabled)}
                    className={`w-14 h-7 border-[3px] border-black flex items-center transition-none relative
                      ${sitePinEnabled ? 'bg-[#10b981]' : 'bg-gray-200'}`}
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    <div className={`w-5 h-5 bg-white border-[3px] border-black absolute transition-none
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
                      <span className="text-xs text-black/60 uppercase">Abort after:</span>
                      <div className="flex gap-1.5">
                        {[2, 3, 4, 5].map(t => (
                          <button
                            key={t}
                            onClick={() => setSitePinTimeout(t)}
                            className={`preset-btn text-xs px-3 py-2
                              ${sitePinTimeout === t ? 'preset-btn-active' : 'preset-btn-inactive'}`}
                          >
                            {t} min
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current site pins */}
                    <div>
                      <p className="text-xs text-black/60 uppercase mb-3">Pinned Sites:</p>
                      {Object.keys(sitePins).length === 0 ? (
                        <p className="text-xs text-black/30 uppercase">No sites pinned yet</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(sitePins).map(([cat, url]) => (
                            <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-[3px] border-black/10">
                              <Pin className="w-3 h-3 text-[#ea580c] flex-shrink-0" />
                              <span className="text-xs text-black/80 uppercase flex-shrink-0">{cat}</span>
                              <span className="text-xs text-[#93c5fd] truncate flex-1">→ {url}</span>
                              <button
                                onClick={() => setSitePin(cat, null)}
                                className="text-black/30 hover:text-[#dc2626] transition-none flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add new pin */}
                    <div className="border-t-[3px] border-black/10 pt-4">
                      <p className="text-xs text-black/60 uppercase mb-3">Add New Pin:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={newPinCategory}
                            onChange={e => setNewPinCategory(e.target.value)}
                            className="input-base appearance-none cursor-pointer pr-8 text-xs"
                          >
                            <option value="" className="bg-white">Select category...</option>
                            {CATEGORIES.filter(c => !sitePins[c]).map(c => (
                              <option key={c} value={c} className="bg-white">{c}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-black/30 pointer-events-none" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g., scrimba.com"
                          value={newPinUrl}
                          onChange={e => setNewPinUrl(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSitePin(); }}
                          className="input-base flex-1 text-xs"
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
                    <div className="text-xs text-black/30 uppercase border-t-[3px] border-black/10 pt-3 space-y-1">
                      <p>📌 <strong className="text-black/50">How it works:</strong></p>
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
            <label className="text-sm font-bold text-black mb-3 block uppercase">Duration</label>
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
            <label className="text-sm font-bold text-black mb-3 block uppercase">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-base appearance-none cursor-pointer pr-10"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white text-black font-bold">{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
            </div>

            {/* Show pin indicator for selected category */}
            {selectedCategoryPin && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-orange-50 border-[3px] border-[#ea580c]/30 rounded-xl">
                <Pin className="w-3 h-3 text-[#ea580c]" />
                <span className="text-xs text-[#ea580c] uppercase font-bold">
                  Pinned to {selectedCategoryPin} — will auto-open on start
                </span>
              </div>
            )}
          </div>

          {/* Intended Goal */}
          <div>
            <label className="text-sm font-bold text-black mb-3 block uppercase">
              Intended Goal
              <span className="text-red-500 ml-2">*</span>
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
            <p className="text-[#dc2626] text-sm bg-red-50 border-[3px] border-[#dc2626] rounded-xl font-bold px-3 py-3 uppercase">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-4 py-5 text-sm"
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
            <span className="text-xs text-black/50">{sessions.length} SESSIONS</span>
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
