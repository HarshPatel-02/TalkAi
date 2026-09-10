import { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../api';
import { OutputWaveform } from './Waveform';
import './TTSPanel.css';

const VOICES = [
  { id: 'am_adam', label: 'Adam — Male' },
  { id: 'am_michael', label: 'Michael — Male' },
  { id: 'af_heart', label: 'Heart — Female' },
  { id: 'af_bella', label: 'Bella — Female' },
  { id: 'af_nicole', label: 'Nicole — Female' },
  { id: 'bf_emma', label: 'Emma — UK, Female' },
  { id: 'bm_george', label: 'George — UK, Male' },
];

const MAX_CHARS = 500;

export default function TTSPanel() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('am_adam');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState('0:00');

  const audioRef = useRef(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Enter text to synthesize.');
      return;
    }

    setLoading(true);
    setError('');
    setAudioUrl(null);

    try {
      const url = await generateSpeech(text, voice);
      setAudioUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onTime = () => {
      const t = el.currentTime || 0;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      setTime(`${m}:${s}`);
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [audioUrl]);

  return (
    <section className="channel">
      <div className="channel-header">
        <div className="channel-kicker">
          <span className="channel-dot tx" />
          <span className="channel-label">CH.01 — Transmit</span>
        </div>
        <h2 className="channel-title">Text to Speech</h2>
      </div>

      <div className="channel-body">
        <div className="field">
          <label className="field-label" htmlFor="tts-text">Script</label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Type the line you want spoken…"
            rows="5"
            maxLength={MAX_CHARS}
            className="text-input"
          />
          <span className={`char-count${text.length >= MAX_CHARS ? ' char-count-limit' : ''}`}>
            {text.length} / {MAX_CHARS} chars
          </span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="voice-select">Voice</label>
          <div className="select-wrap">
            <select
              id="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="voice-select"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="select-chevron" />
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
          className="btn-tx"
        >
          {loading ? (
            <>
              <span className="spinner" /> Synthesizing…
            </>
          ) : (
            'Generate speech'
          )}
        </button>

        {audioUrl && (
          <div className="output-block">
            <div className="output-status">Ready</div>

            <div className="player">
              <button
                className="play-btn"
                onClick={togglePlay}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div className="player-wave">
                <OutputWaveform audioUrl={audioUrl} audioRef={audioRef} color="var(--tx-bright)" bars={56} />
              </div>
              <span className="player-time">{time}</span>
              <audio ref={audioRef} src={audioUrl} className="audio-hidden" />
            </div>

            <a
              href={audioUrl}
              download={`speech-${Date.now()}.wav`}
              className="btn-ghost"
            >
              Download .wav
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
      <path d="M0 0.8C0 0.1 0.8 -0.3 1.4 0.1L13.4 7.3C14 7.6 14 8.4 13.4 8.7L1.4 15.9C0.8 16.3 0 15.9 0 15.2V0.8Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
      <rect x="0" y="0" width="4.5" height="16" rx="1" />
      <rect x="9.5" y="0" width="4.5" height="16" rx="1" />
    </svg>
  );
}
