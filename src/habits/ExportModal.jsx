// src/habits/ExportModal.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import { generateTextReport } from '../lib/habitExport';

export default function ExportModal({ dayData, userName, tomorrowTargets, onClose }) {
  const [copied, setCopied] = useState(false);
  const report = dayData ? generateTextReport(dayData, userName, tomorrowTargets) : '';
  const hasReport = report.trim().length > 0;

  const handleCopy = async () => {
    if (!hasReport) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      try {
        const ta = document.createElement('textarea');
        ta.value = report;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8
                   w-full sm:max-w-lg z-50"
      >
        <div className="glass-card rounded-t-2xl sm:rounded-2xl border border-white/10 p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30
                            flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-base font-bold text-white flex-1">Export Daily Report</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center
                         text-white/40 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Report preview */}
          {hasReport ? (
            <pre className="text-xs text-white/60 font-mono leading-relaxed bg-black/30 border border-white/6
                            rounded-xl p-4 overflow-y-auto max-h-64 whitespace-pre-wrap break-words mb-4">
              {report}
            </pre>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 mb-4 bg-black/20 border border-white/6 rounded-xl">
              <AlertCircle className="w-8 h-8 text-orange-400/60" />
              <p className="text-white/40 text-sm text-center">
                No habit data loaded yet.<br />
                <span className="text-white/25 text-xs">Check your Firestore security rules.</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <motion.button
            whileHover={{ scale: hasReport ? 1.02 : 1 }}
            whileTap={{ scale: hasReport ? 0.98 : 1 }}
            onClick={handleCopy}
            disabled={!hasReport}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied
              ? <><Check className="w-4 h-4" /> Copied to clipboard!</>
              : <><Copy className="w-4 h-4" /> Copy Report</>}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
