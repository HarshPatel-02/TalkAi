TalkAi
TalkAI — A local voice console pairing text-to-speech and speech-to-text in one app. Type text and hear it spoken with Kokoro TTS across 7 voices, or record/upload audio and get instant transcription via Whisper. FastAPI backend, React frontend, real-time waveforms, dark mode. Runs fully offline — no audio ever leaves your machine.
title: TalkAI emoji: 🎙️ colorFrom: yellow colorTo: teal sdk: docker app_port: 7860 pinned: false
🎤 Voice AI — TTS & STT
Production-grade Voice AI API with Text-to-Speech and Speech-to-Text capabilities.

Live UI + API + CLI tools. Ready to deploy.

🚀 Quick Start
0. Generate HTTPS certificates (one-time setup)
The app requires HTTPS — the browser only allows microphone access (getUserMedia) on a secure context, which is needed for Speech-to-Text to work from any device other than localhost (e.g. testing from your phone via your PC's LAN IP). Generate a self-signed cert once:

cd c:\Work\Learning\TTS
python -c "
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime, ipaddress

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, u'localhost')])
cert = x509.CertificateBuilder().subject_name(subject).issuer_name(issuer).public_key(
    key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(
    datetime.datetime.utcnow()).not_valid_after(
    datetime.datetime.utcnow() + datetime.timedelta(days=3650)).add_extension(
    x509.SubjectAlternativeName([
        x509.DNSName(u'localhost'),
        x509.IPAddress(ipaddress.ip_address(u'127.0.0.1')),
    ]), critical=False).sign(key, hashes.SHA256())

open('key.pem', 'wb').write(key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()))
open('cert.pem', 'wb').write(cert.public_bytes(serialization.Encoding.PEM))
print('Certificate generated!')
"

This creates key.pem and cert.pem in the project root (gitignored — each developer generates their own). To also allow access from your phone on the same network, add your PC's LAN IP as an extra x509.IPAddress(...) entry before running.

1. Start Backend (Terminal 1)
cd c:\Work\Learning\TTS
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem

2. Start Frontend (Terminal 2)
cd c:\Work\Learning\TTS\frontend
npm run dev

3. Open Browser
https://localhost:5173

Accept the self-signed certificate warning on first visit (Advanced → Proceed) — for both https://localhost:8000/health and https://localhost:5173, since they're separate origins.

🎯 Features
Text-to-Speech (TTS)
📝 Type any text (500 char limit)
🎤 7 voice options (male, female, British)
🎵 Generate & play audio instantly, with a real waveform visualization
💾 Download audio files
Speech-to-Text (STT)
🎙️ Record directly from microphone, or upload an audio file
📄 Instant transcription
✨ Accurate, multilingual speech recognition (Whisper)
UI/UX
🌙 Dark / light mode toggle
📱 Responsive design (desktop & mobile)
⚡ React + Vite
🏗️ Tech Stack
Backend:

FastAPI (web framework)
Whisper (speech-to-text)
Kokoro (text-to-speech)
Python 3.12+
uv package manager
Frontend:

React 18
Vite (build tool)
Plain CSS (no framework)
localStorage (dark/light mode persistence)
📂 Project Structure
.
├── backend/
│   ├── main.py               ← FastAPI app entrypoint (middleware, routers, static serving)
│   ├── rate_limit.py          ← Shared slowapi Limiter instance
│   ├── routes/                ← HTTP layer — one file per endpoint
│   │   ├── health.py           (GET /health)
│   │   ├── tts.py               (POST /tts)
│   │   └── stt.py                (POST /stt)
│   ├── services/               ← Model logic, no HTTP concerns
│   │   ├── tts_service.py       (Kokoro pipeline)
│   │   └── stt_service.py       (Whisper model)
│   └── cli/                   ← Standalone CLI tools (sst.py, tts.py, test_api.py)
├── frontend/                ← React + Vite UI
│   ├── src/
│   │   ├── App.jsx          ← Main layout, theme toggle
│   │   ├── api.js           ← API communication
│   │   └── components/      ← TTSPanel, STTPanel, Waveform (+ co-located CSS)
│   ├── vite.config.js
│   └── package.json
├── pyproject.toml           ← Python dependencies
├── uv.lock
├── Dockerfile                ← Production build (Hugging Face Spaces / any Docker host)
├── key.pem / cert.pem        ← Local-only HTTPS certs (gitignored, generated per machine)
└── README.md

🧪 Testing
Full Stack Test:

Type text in TTS panel

Click "Generate Speech"

Hear it play ✓

Click "Start Recording" in STT panel

Speak into microphone

Click "Stop Recording"

See transcription ✓

📊 API Endpoints
GET  /health              → Check if API is running
POST /tts                 → Generate speech from text (JSON, base64 audio)
POST /stt                 → Transcribe audio to text
GET  /docs                → Interactive API documentation

🎨 UI Features
Dark / Light Mode — toggle switch in header, persisted in browser
Responsive — works on desktop & mobile
🚢 Deployment
Single Dockerfile builds the frontend and serves it from the same FastAPI app (same-origin — no CORS/mixed-content issues, real HTTPS provided by the host).

Hugging Face Spaces (recommended, free CPU tier): push this repo to a Docker-SDK Space
Any Docker host (Fly.io, Google Cloud Run, Railway, etc.): docker build -t talkai . && docker run -p 7860:7860 talkai
⚡ Performance
Frontend: 64 KB gzipped (React + Vite)
Backend: ~1-2 sec first request, then cached
Load Times: <500ms dev, <200ms production
🔧 Development
Install dependencies:

cd c:\Work\Learning\TTS
uv sync

cd frontend
npm install

Development commands:

# Backend
uv run uvicorn backend.main:app --reload

# Frontend
cd frontend
npm run dev      # Dev server
npm run build    # Production build
npm run preview  # Preview build

🎓 Next Steps
[ ] Run locally (TTS + STT working)
[ ] Test dark/light mode
[ ] Deploy to Hugging Face Spaces
[ ] Add authentication
[ ] Add recording history
[ ] Add batch processing

📞 Support
React docs: https://react.dev
Vite docs: https://vitejs.dev
FastAPI docs: https://fastapi.tiangolo.com
Whisper docs: https://github.com/openai/whisper
Built with 🎤 Voice AI. Ready to ship. 🚀
