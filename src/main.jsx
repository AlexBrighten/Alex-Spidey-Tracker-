import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isConfigured } from './firebase.js'

// ── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <ErrorScreen message={this.state.error?.message} />;
    return this.props.children;
  }
}

// ── Missing config screen ──────────────────────────────────────────────────
function MissingConfigScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0b0b14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: '2rem',
    }}>
      <div style={{
        maxWidth: 480, background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
        padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Firebase not configured
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          The app is missing its Firebase credentials.<br />
          Open your <strong style={{ color: '#818cf8' }}>Vercel project → Settings → Environment Variables</strong>
          {' '}and add these keys:
        </p>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12,
          padding: '1rem', textAlign: 'left', fontSize: 11,
          color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)',
          overflowX: 'auto',
        }}>
{`VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID`}
        </pre>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 16 }}>
          Then redeploy. Check .env.example for the format.
        </p>
      </div>
    </div>
  );
}

// ── Generic error screen ───────────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0b0b14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: '2rem',
    }}>
      <div style={{
        maxWidth: 440, background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20,
        padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💥</div>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Something went wrong
        </h1>
        {message && (
          <pre style={{
            color: 'rgba(255,100,100,0.7)', fontSize: 11,
            background: 'rgba(0,0,0,0.3)', borderRadius: 8,
            padding: '0.75rem', textAlign: 'left', whiteSpace: 'pre-wrap',
            marginTop: 12,
          }}>{message}</pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16, padding: '10px 24px', borderRadius: 10,
            background: '#6366f1', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

// ── Mount ──────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isConfigured ? <App /> : <MissingConfigScreen />}
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
)
