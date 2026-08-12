// src/components/PostSessionModal.jsx
// Slide-up modal triggered when timer completes

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Link2, FileText, Loader2 } from 'lucide-react';

export default function PostSessionModal({ sessionMeta, onLog }) {
  const [actualOutcome, setActualOutcome] = useState('');
  const [proofUrl, setProofUrl]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualOutcome.trim()) {
      setError('Please describe what you actually accomplished.');
      return;
    }
    setLoading(true);
    try {
      await onLog({ actualOutcome: actualOutcome.trim(), proofUrl: proofUrl.trim() });
    } catch (err) {
      console.error(err);
      setError('Failed to save session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8
                   w-full sm:max-w-lg z-50"
      >
        <div className="glass-card rounded-t-2xl sm:rounded-2xl border border-white/10 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30
                            flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Session Complete! 🎉</h2>
              <p className="text-white/40 text-sm mt-0.5">
                {sessionMeta?.durationMinutes} min · {sessionMeta?.category}
              </p>
            </div>
          </div>

          {/* Intended goal recap */}
          {sessionMeta?.intendedGoal && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
              <p className="text-white/30 text-xs mb-0.5">You set out to:</p>
              <p className="text-white/70 text-sm">{sessionMeta.intendedGoal}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Actual Outcome */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <FileText className="w-3.5 h-3.5" />
                What did you actually accomplish?
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              <textarea
                value={actualOutcome}
                onChange={(e) => { setActualOutcome(e.target.value); setError(''); }}
                placeholder="e.g. Solved 3 medium DP problems, reviewed sliding window patterns..."
                rows={4}
                className="input-base resize-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Proof URL */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <Link2 className="w-3.5 h-3.5" />
                Proof URL
                <span className="text-white/25 text-xs ml-1">(optional)</span>
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://github.com/... or https://leetcode.com/..."
                className="input-base"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging Session…</>
                : <><CheckCircle2 className="w-4 h-4" /> Log Session &amp; Continue</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
