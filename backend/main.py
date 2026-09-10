"""
FastAPI app entrypoint - assembles middleware, routers, and static file
serving. Route handlers live in backend/routes/, model logic in
backend/services/. Run with: uvicorn backend.main:app
"""
import os
import warnings

# Quiet noisy-but-harmless library warnings before importing anything that
# triggers them (must happen before backend.routes -> backend.services
# imports Kokoro/Whisper, which is where these warnings actually fire):
# - HF Hub's "unauthenticated requests" notice (we only download public models)
# - PyTorch UserWarning/FutureWarning emitted from inside Kokoro's own model code
os.environ.setdefault("HF_HUB_VERBOSITY", "error")
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.rate_limit import limiter
from backend.routes import health, tts, stt

app = FastAPI(title="Voice AI API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(tts.router)
app.include_router(stt.router)

# Serve the built frontend (production only - frontend/dist won't exist
# in local dev, where you run the Vite dev server separately instead)
_frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")
