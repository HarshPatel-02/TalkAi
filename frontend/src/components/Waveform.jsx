import { useEffect, useRef } from 'react';

/**
 * Canvas fillStyle can't parse `var(--token)` directly (that's CSS-only
 * syntax) — it silently falls back to black. Resolve it to the actual
 * computed color so the waveform follows the current theme correctly.
 */
function resolveColor(color, el) {
  if (typeof color === 'string' && color.trim().startsWith('var(')) {
    const varName = color.trim().slice(4, -1).trim();
    const resolved = getComputedStyle(el || document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return resolved || '#888888';
  }
  return color;
}

/**
 * Live input waveform — draws real-time amplitude bars from a MediaStream
 * via the Web Audio API AnalyserNode. Used while recording.
 */
export function LiveWaveform({ stream, color = '#0f766e', bars = 48 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const resolvedColor = resolveColor(color, canvas);
      const barWidth = width / bars;
      const step = Math.floor(dataArray.length / bars);

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(2, value * height);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        ctx.fillStyle = resolvedColor;
        ctx.globalAlpha = 0.55 + value * 0.45;
        const w = Math.max(1.5, barWidth * 0.5);
        const r = Math.min(w / 2, 2);
        roundRect(ctx, x + (barWidth - w) / 2, y, w, barHeight, r);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
    };
  }, [stream, color, bars]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}

/**
 * Static output waveform — decodes an audio URL once into a peak envelope
 * and renders it, with a playhead that tracks the given <audio> element.
 */
export function OutputWaveform({ audioUrl, audioRef, color = '#d97706', bars = 64 }) {
  const canvasRef = useRef(null);
  const peaksRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(audioUrl);
        const buf = await res.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(buf);
        const channel = decoded.getChannelData(0);
        const blockSize = Math.floor(channel.length / bars);
        const peaks = new Array(bars).fill(0).map((_, i) => {
          const start = i * blockSize;
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            const v = Math.abs(channel[start + j] || 0);
            if (v > max) max = v;
          }
          return max;
        });
        if (!cancelled) {
          peaksRef.current = peaks;
        }
        audioCtx.close().catch(() => {});
      } catch {
        peaksRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, bars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const peaks = peaksRef.current;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!peaks) return;

      const audioEl = audioRef.current;
      const progress =
        audioEl && audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;

      const resolvedColor = resolveColor(color, canvas);
      const barWidth = width / bars;
      for (let i = 0; i < bars; i++) {
        const value = peaks[i];
        const barHeight = Math.max(2, value * height * 3.2);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        const played = i / bars < progress;
        ctx.fillStyle = resolvedColor;
        ctx.globalAlpha = played ? 0.95 : 0.28;
        const w = Math.max(1.5, barWidth * 0.55);
        const r = Math.min(w / 2, 2);
        roundRect(ctx, x + (barWidth - w) / 2, y, w, barHeight, r);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioRef, color, bars]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
