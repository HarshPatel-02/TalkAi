# 🎙️ TalkAI — Voice AI

> **TalkAI** is a local, production-ready Voice AI application that combines **Text-to-Speech (TTS)** and **Speech-to-Text (STT)** in a single interface.

Type text and hear it spoken using **Kokoro TTS**, or record/upload audio and get an instant transcription using **Whisper**.

The application runs **fully offline**, so your audio and text stay on your machine.

---

## ✨ Features

### 🎤 Text-to-Speech

* Convert text into natural-sounding speech
* Powered by **Kokoro TTS**
* 7 available voices
* Male, female, and British voice options
* 500-character input limit
* Real-time waveform visualization
* Play generated audio instantly
* Download generated audio

### 🎙️ Speech-to-Text

* Record audio directly from your microphone
* Upload existing audio files
* Speech transcription using **Whisper**
* Multilingual speech recognition
* Fast local processing
* No audio uploaded to external services

### 🎨 User Interface

* 🌙 Dark / Light mode
* 📱 Responsive design
* ⚡ React + Vite frontend
* 📊 Real-time audio waveform
* 💾 Local theme persistence using `localStorage`
* 🔌 REST API architecture

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │     + Vite           │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │   Kokoro TTS    │        │     Whisper     │
        │ Text → Speech   │        │ Speech → Text   │
        └─────────────────┘        └─────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

| Technology       | Purpose                |
| ---------------- | ---------------------- |
| **Python 3.12+** | Backend runtime        |
| **FastAPI**      | REST API               |
| **Kokoro**       | Text-to-Speech         |
| **Whisper**      | Speech-to-Text         |
| **uv**           | Python package manager |
| **SlowAPI**      | Rate limiting          |
| **Uvicorn**      | ASGI server            |

### Frontend

| Technology       | Purpose             |
| ---------------- | ------------------- |
| **React 18**     | UI framework        |
| **Vite**         | Frontend build tool |
| **JavaScript**   | Application logic   |
| **CSS**          | Styling             |
| **localStorage** | Theme persistence   |

---

# 🚀 Quick Start

## Prerequisites

Make sure you have the following installed:

* Python **3.12+**
* Node.js **18+**
* npm
* uv
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/HarshPatel-02/TalkAi.git

cd TalkAi
```

---

## 2. Create Python Environment

Using `uv`:

```bash
uv venv
```

Activate the environment on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
uv sync
```

---

# 🔐 HTTPS Setup

HTTPS is required for microphone access when accessing the application from devices other than `localhost`.

For example:

```text
PC → localhost
PC → phone using LAN IP
```

The browser requires a secure context for `getUserMedia()` microphone access.

## Generate Self-Signed Certificate

Run this once from the project root:

```bash
python -c "
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime
import ipaddress

key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

subject = issuer = x509.Name([
    x509.NameAttribute(
        NameOID.COMMON_NAME,
        u'localhost'
    )
])

cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.datetime.utcnow())
    .not_valid_after(
        datetime.datetime.utcnow() +
        datetime.timedelta(days=3650)
    )
    .add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(u'localhost'),
            x509.IPAddress(
                ipaddress.ip_address(u'127.0.0.1')
            ),
        ]),
        critical=False,
    )
    .sign(
        key,
        hashes.SHA256()
    )
)

open('key.pem', 'wb').write(
    key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
)

open('cert.pem', 'wb').write(
    cert.public_bytes(serialization.Encoding.PEM)
)

print('Certificate generated!')
"
```

This creates:

```text
key.pem
cert.pem
```

These files should **not** be committed to Git.

Add them to `.gitignore`:

```gitignore
key.pem
cert.pem
```

---

# ▶️ Run the Application

## Terminal 1 — Backend

From the project root:

```powershell
uv run uvicorn backend.main:app --reload --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem
```

Backend:

```text
https://localhost:8000
```

Health check:

```text
https://localhost:8000/health
```

API documentation:

```text
https://localhost:8000/docs
```

---

## Terminal 2 — Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
https://localhost:5173
```

Open the application:

```text
https://localhost:5173
```

Because the certificate is self-signed, your browser may display a security warning.

Select:

```text
Advanced → Proceed
```

You may need to accept the certificate warning for both:

```text
https://localhost:8000
https://localhost:5173
```

---

# 📱 Access From Your Phone

To access TalkAI from a phone connected to the same Wi-Fi network:

### 1. Find your PC's LAN IP

Windows:

```powershell
ipconfig
```

Look for:

```text
IPv4 Address
```

For example:

```text
192.168.1.10
```

### 2. Add the IP to the certificate

Add your LAN IP to:

```python
x509.SubjectAlternativeName([
    x509.DNSName(u'localhost'),
    x509.IPAddress(
        ipaddress.ip_address(u'127.0.0.1')
    ),
    x509.IPAddress(
        ipaddress.ip_address(u'192.168.1.10')
    ),
])
```

Regenerate the certificate.

### 3. Start the backend

```powershell
uv run uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --ssl-keyfile key.pem \
    --ssl-certfile cert.pem
```

Then access:

```text
https://192.168.1.10:5173
```

> Make sure Windows Firewall allows the required ports.

---

# 📂 Project Structure

```text
TalkAi/
│
├── backend/
│   ├── main.py
│   ├── rate_limit.py
│   │
│   ├── routes/
│   │   ├── health.py
│   │   ├── tts.py
│   │   └── stt.py
│   │
│   ├── services/
│   │   ├── tts_service.py
│   │   └── stt_service.py
│   │
│   └── cli/
│       ├── sst.py
│       ├── tts.py
│       └── test_api.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   │
│   │   └── components/
│   │       ├── TTSPanel.jsx
│   │       ├── STTPanel.jsx
│   │       └── Waveform.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── pyproject.toml
├── uv.lock
├── Dockerfile
├── .gitignore
└── README.md
```

---

# 🔌 API Endpoints

| Method | Endpoint  | Description               |
| ------ | --------- | ------------------------- |
| `GET`  | `/health` | Check API health          |
| `POST` | `/tts`    | Convert text to speech    |
| `POST` | `/stt`    | Transcribe audio          |
| `GET`  | `/docs`   | Swagger API documentation |

---

## 🎤 TTS API

### Request

```http
POST /tts
Content-Type: application/json
```

Example:

```json
{
  "text": "Hello, welcome to TalkAI.",
  "voice": "af_heart"
}
```

### Response

The API returns generated audio data that can be played or downloaded by the frontend.

---

## 🎙️ STT API

### Request

```http
POST /stt
Content-Type: multipart/form-data
```

Upload an audio file and the API returns the transcription.

Example response:

```json
{
  "text": "Hello, this is a test of TalkAI."
}
```

---

# 🧪 Testing

## Full Stack Test

### TTS

1. Open TalkAI.
2. Enter text.
3. Select a voice.
4. Click **Generate Speech**.
5. Verify the generated audio.
6. Verify the waveform.
7. Download the generated audio.

### STT

1. Open the STT panel.
2. Click **Start Recording**.
3. Speak into the microphone.
4. Click **Stop Recording**.
5. Verify the generated transcription.

### Upload Test

1. Select an audio file.
2. Upload it.
3. Wait for transcription.
4. Verify the returned text.

---

# 🖥️ Development

## Backend

Run the backend:

```bash
uv run uvicorn backend.main:app --reload
```

## Frontend

Run the development server:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🐳 Docker

TalkAI includes a production Dockerfile that builds the React frontend and serves the application through FastAPI.

Build the image:

```bash
docker build -t talkai .
```

Run the container:

```bash
docker run -p 7860:7860 talkai
```

Application:

```text
http://localhost:7860
```

---

# ☁️ Deployment

TalkAI can be deployed to Docker-compatible platforms.

Possible deployment targets include:

* Hugging Face Spaces
* Railway
* Fly.io
* Google Cloud Run
* Any Docker-compatible server

For production deployment, HTTPS should be provided by the hosting platform or a reverse proxy rather than using the development self-signed certificate.

---

# ⚡ Performance

Approximate local performance:

| Metric                | Result                      |
| --------------------- | --------------------------- |
| First TTS request     | ~1–2 seconds                |
| Subsequent requests   | Faster due to model caching |
| Production frontend   | Optimized with Vite         |
| Audio processing      | Local                       |
| External audio upload | None                        |

Performance depends on the CPU, available memory, model configuration, and audio length.

---

# 🔒 Privacy

TalkAI is designed to run locally.

```text
Your Text
   │
   ▼
TalkAI
   │
   ├── Kokoro → Audio
   │
   └── Whisper → Transcription
```

Audio processing happens on your machine.

**Audio is not sent to an external cloud API by TalkAI.**

> Note: If you modify the application to use external APIs or deploy it as a hosted service, this privacy model changes.

---

# 🗺️ Roadmap

* [x] Text-to-Speech
* [x] Speech-to-Text
* [x] Kokoro integration
* [x] Whisper integration
* [x] Multiple voices
* [x] Audio waveform
* [x] Dark / Light mode
* [x] Responsive UI
* [x] REST API
* [x] Docker support
* [ ] Authentication
* [ ] Recording history
* [ ] Batch processing
* [ ] Voice preview
* [ ] Streaming TTS
* [ ] User accounts
* [ ] Production monitoring

---

# 📸 Screenshots

Add screenshots of your application here:

```text
docs/
├── screenshot-dashboard.png
├── screenshot-tts.png
└── screenshot-stt.png
```

Then add them to the README:

```markdown
## 📸 Screenshots

### Dashboard

![TalkAI Dashboard](docs/screenshot-dashboard.png)

### Text-to-Speech

![TalkAI TTS](docs/screenshot-tts.png)

### Speech-to-Text

![TalkAI STT](docs/screenshot-stt.png)
```

---

# 🤝 Contributing

Contributions are welcome.

### 1. Fork the repository

```bash
git clone https://github.com/HarshPatel-02/TalkAi.git
```

### 2. Create a branch

```bash
git checkout -b feature/my-feature
```

### 3. Make your changes

### 4. Commit

```bash
git add .
git commit -m "feat: add my feature"
```

### 5. Push

```bash
git push origin feature/my-feature
```

### 6. Open a Pull Request

---

# 📄 License

Add your preferred open-source license here.

For example:

```text
MIT License
```

---

# 👨‍💻 Author

**Harsh Patel**

GitHub:
https://github.com/HarshPatel-02

---

# ⭐ Support

If you find TalkAI useful, consider giving the repository a ⭐ on GitHub.

---

## 🎙️ TalkAI

**Speak. Listen. Transcribe. Locally.**

Built with:

**FastAPI + React + Kokoro + Whisper + uv**

🚀 **Ready to ship.**
