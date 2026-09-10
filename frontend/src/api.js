// In local dev, .env sets VITE_API_URL explicitly (backend runs on a
// different port). In production (e.g. Hugging Face Spaces), the frontend
// is served by the same FastAPI app as the API, so no env var is set and
// this falls back to '' — relative URLs resolve against the current origin.
const API_URL = import.meta.env.VITE_API_URL || '';

function extractErrorMessage(detail, fallback) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join('; ') || fallback;
  }
  return fallback;
}

// /tts returns JSON with base64-encoded audio (not raw bytes), so the
// response shape matches /stt. Decode it back into a playable blob: URL.
function base64ToBlobUrl(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export async function generateSpeech(text, voice = 'am_adam') {
  if (!text.trim()) {
    throw new Error('Text cannot be empty');
  }

  const response = await fetch(`${API_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(extractErrorMessage(data.detail, 'Failed to generate speech'));
  }

  return base64ToBlobUrl(data.audio_base64, 'audio/wav');
}

export async function transcribeAudio(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');

  const response = await fetch(`${API_URL}/stt`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(extractErrorMessage(error.detail, 'Failed to transcribe audio'));
  }

  const data = await response.json();
  return data.text;
}
