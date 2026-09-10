import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, File, UploadFile, Request
from starlette.concurrency import run_in_threadpool

from backend.rate_limit import limiter
from backend.services.stt_service import transcribe

router = APIRouter()


@router.post("/stt")
@limiter.limit("10/minute")
async def speech_to_text(request: Request, file: UploadFile = File(...)):
    """Speech-to-Text endpoint"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        # Accept any audio format (webm, wav, mp3, etc)
        # Get file extension from filename, default to webm
        file_ext = Path(file.filename).suffix or ".webm"

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Run blocking model inference in a thread pool so it doesn't
            # block the event loop for other concurrent requests
            result = await run_in_threadpool(transcribe, tmp_path)
            return result

        finally:
            Path(tmp_path).unlink(missing_ok=True)

    except Exception as e:
        print(f"STT Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")
