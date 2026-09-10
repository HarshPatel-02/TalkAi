import { useState, useEffect } from 'react';
import TTSPanel from './components/TTSPanel';
import STTPanel from './components/STTPanel';
import './App.css';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('darkMode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', darkMode);
    } catch {
      /* ignore */
    }
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">TalkAI</h1>
          <p className="app-subtitle">Turn text into speech, or speech into text.</p>
        </div>

        <div className="header-controls">
          <button
            className="theme-switch"
            data-on={darkMode}
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle dark mode"
            role="switch"
            aria-checked={darkMode}
          >
            <span className="theme-switch-track">
              <span className="theme-switch-icon theme-switch-icon-day"><SunIcon /></span>
              <span className="theme-switch-icon theme-switch-icon-night"><MoonIcon /></span>
              <span className="theme-switch-thumb" />
            </span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="console-frame">
            <div className="panels-grid">
              <TTSPanel />
              <STTPanel />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-status">
            <span className="footer-status-dot" /> Local inference
          </span>
          <span className="footer-sep">·</span>
          <span>
            <strong>Kokoro</strong> TTS
          </span>
          <span className="footer-sep">·</span>
          <span>
            <strong>Whisper</strong> STT
          </span>
          <span className="footer-sep">·</span>
          <span className="footer-muted">audio never leaves this machine</span>
        </div>
      </footer>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}
