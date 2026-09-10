import { useState, useRef } from 'react';
import { transcribeAudio } from '../api';
import { LiveWaveform } from './Waveform';
import './STTPanel.css';

export default function STTPanel() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeStream, setActiveStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleStartRecording = async () => {
    try {
      setError('');
      setTranscript('');
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      setError(`Microphone unavailable — ${err.message}`);
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach((track) => track.stop());
    setActiveStream(null);
    clearInterval(durationIntervalRef.current);
    setRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/wav' });

      setLoading(true);
      try {
        const text = await transcribeAudio(blob);
        setTranscript(text);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setTranscript('');
    setLoading(true);

    try {
      const text = await transcribeAudio(file);
      setTranscript(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="channel">
      <div className="channel-header">
        <div className="channel-kicker">
          <span className="channel-dot rx" />
          <span className="channel-label">CH.02 — Receive</span>
        </div>
        <h2 className="channel-title">Speech to Text</h2>
      </div>

      <div className="channel-body">
        {recording && (
          <div className="level-meter">
            {activeStream && <LiveWaveform stream={activeStream} color="#e5484d" bars={40} />}
            <span className="rec-label">
              <span className="rec-dot" /> Recording
            </span>
            <span className="duration">{formatDuration(duration)}</span>
          </div>
        )}

        <div className="button-row">
          {!recording ? (
            <button onClick={handleStartRecording} className="btn-rx">
              Start recording
            </button>
          ) : (
            <button onClick={handleStopRecording} className="btn-stop">
              Stop recording
            </button>
          )}
        </div>

        {loading && (
          <div className="transcribing-row">
            <span className="spinner" /> Transcribing…
          </div>
        )}

        <div className="divider-row">or</div>

        <label className="upload-zone" htmlFor="audio-file">
          <span className="upload-zone-label">Upload an audio file</span>
          <input
            ref={fileInputRef}
            id="audio-file"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="file-input"
            disabled={recording}
          />
          <span className="upload-hint">wav · mp3 · webm · ogg · m4a</span>
        </label>

        {error && <div className="error-box">{error}</div>}

        {transcript && (
          <div className="transcript-block">
            <div className="transcript-status">Transcribed</div>
            <p className="transcript-text">{transcript}</p>
            <div className="transcript-actions">
              <button onClick={handleCopy} className="btn-ghost">
                {copied ? 'Copied' : 'Copy text'}
              </button>
              <button
                onClick={() => {
                  setTranscript('');
                  setDuration(0);
                }}
                className="btn-ghost"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <p className="info-strip">
          Speak clearly, close to the mic, minimal background noise any language.
        </p>
      </div>
    </section>
  );
}
