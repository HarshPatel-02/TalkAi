"""Whisper speech-to-text transcription."""
from faster_whisper import WhisperModel

whisper_model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


def transcribe(tmp_path: str) -> dict:
    """Blocking Whisper transcription - call via run_in_threadpool from a route.
    Uses: backend/cli/sst.py logic
    """
    segments, info = whisper_model.transcribe(
        tmp_path,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    text = ""
    for segment in segments:
        text += segment.text

    return {"text": text.strip(), "language": info.language}
