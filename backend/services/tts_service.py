"""Kokoro text-to-speech generation."""
import tempfile
from pathlib import Path

from kokoro import KPipeline
import soundfile as sf

# repo_id passed explicitly to suppress Kokoro's "Defaulting repo_id" notice
pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")


def generate_speech(text: str, voice: str) -> bytes:
    """Blocking Kokoro TTS generation - call via run_in_threadpool from a route.
    Uses: backend/cli/tts.py logic
    """
    generator = pipeline(text, voice=voice)

    sr = 24000
    audio_data = None

    # Generator yields (_, _, audio) tuples - your original pattern
    for _, _, audio in generator:
        audio_data = audio
        break

    if audio_data is None:
        raise ValueError("No audio generated")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        sf.write(tmp.name, audio_data, sr)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            return f.read()
    finally:
        Path(tmp_path).unlink(missing_ok=True)
