import base64

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from backend.rate_limit import limiter
from backend.services.tts_service import generate_speech

router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(..., max_length=500)
    voice: str = "am_adam"


@router.post("/tts")
@limiter.limit("10/minute")
async def text_to_speech(request: Request, body: TTSRequest):
    """
    Text-to-Speech endpoint

    Returns JSON with the audio base64-encoded, rather than raw bytes,
    so the response shape is consistent with /stt (both return JSON).
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # Run blocking model inference in a thread pool so it doesn't
        # block the event loop for other concurrent requests
        audio_content = await run_in_threadpool(
            generate_speech, body.text, body.voice
        )

        return {
            "text": body.text,
            "voice": body.voice,
            "audio_format": "wav",
            "audio_base64": base64.b64encode(audio_content).decode("ascii"),
        }

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")
