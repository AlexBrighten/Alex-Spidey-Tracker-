// src/components/AuthScreen.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background is handled by index.css (retro blue) */}

      <div
        className="pixel-card w-full max-w-sm relative flex flex-col items-center text-center p-8"
      >
        <div className="pixel-header w-full absolute top-0 inset-x-0">
          Sign In
        </div>

        {/* Spacer for absolute header */}
        <div className="mt-8"></div>

        {/* Logo */}
        <div className="w-20 h-20 bg-[#111] mb-6 border-4 border-black p-0.5 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
          <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-[14px] text-white mb-2 text-shadow uppercase">Spidey Tracker</h1>
        <p className="text-[#93c5fd] text-[8px] mb-6 uppercase">800 Hrs · Mission</p>

        <p className="text-white text-[9px] mb-8 leading-relaxed px-4">
          Authenticate to access your mission logs.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn-ghost w-full flex items-center justify-center gap-3 py-4 text-[10px]"
        >
          {loading ? (
            <div className="text-[10px] animate-pulse">Loading...</div>
          ) : (
            <>
              <GoogleIcon />
              Continue
            </>
          )}
        </button>

        {error && (
          <div
            className="flex items-center gap-3 text-[#ef4444] text-[8px] bg-black border-4 border-[#ef4444] p-3 mt-4 w-full text-left"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-[#666] text-[7px] mt-8 uppercase">
          Private link established
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function friendlyError(code) {
  const map = {
    'auth/popup-closed-by-user':    'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':           'Popup was blocked by your browser. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/network-request-failed':  'Network error. Check your connection and try again.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
