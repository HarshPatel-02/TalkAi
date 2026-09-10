"""
Quick manual test for the TTS/STT API — prints readable metadata instead
of dumping the full base64 audio blob to the terminal.

Usage:
    .venv\\Scripts\\python.exe backend\\cli\\test_api.py tts "hello world" am_adam
    .venv\\Scripts\\python.exe backend\\cli\\test_api.py stt path\\to\\audio.wav
    .venv\\Scripts\\python.exe backend\\cli\\test_api.py verify "hello world" am_adam
        (generates speech, then transcribes it back — no audio playback needed
        to confirm it worked, just compares the text you typed vs. the text
        that came back out)
"""
import sys
import base64
import httpx

BASE_URL = "https://localhost:8000"


def generate_tts(text: str, voice: str = "am_adam") -> bytes:
    """Calls /tts and returns the decoded audio bytes, or raises on error."""
    r = httpx.post(f"{BASE_URL}/tts", json={"text": text, "voice": voice}, verify=False, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"TTS failed ({r.status_code}): {r.json()}")
    data = r.json()
    return base64.b64decode(data["audio_base64"])


def transcribe(audio_bytes: bytes, filename: str = "audio.wav") -> dict:
    """Calls /stt and returns the JSON result, or raises on error."""
    r = httpx.post(
        f"{BASE_URL}/stt",
        files={"file": (filename, audio_bytes, "audio/wav")},
        verify=False,
        timeout=60,
    )
    if r.status_code != 200:
        raise RuntimeError(f"STT failed ({r.status_code}): {r.json()}")
    return r.json()


def test_tts(text: str, voice: str = "am_adam"):
    r = httpx.post(f"{BASE_URL}/tts", json={"text": text, "voice": voice}, verify=False, timeout=30)
    print(f"Status: {r.status_code}")

    if r.status_code != 200:
        print("Error:", r.json())
        return

    data = r.json()
    audio_bytes = base64.b64decode(data["audio_base64"])

    print("text:        ", data["text"])
    print("voice:       ", data["voice"])
    print("audio_format:", data["audio_format"])
    print(f"audio_base64: <{len(data['audio_base64'])} chars, truncated> "
          f"{data['audio_base64'][:40]}...")
    print(f"decoded audio: {len(audio_bytes)} bytes")

    with open("test_output.wav", "wb") as f:
        f.write(audio_bytes)
    print("Saved playable audio to test_output.wav")


def test_stt(file_path: str):
    with open(file_path, "rb") as f:
        r = httpx.post(f"{BASE_URL}/stt", files={"file": f}, verify=False, timeout=60)

    print(f"Status: {r.status_code}")
    print(r.json())


def verify(text: str, voice: str = "am_adam"):
    """No audio playback needed — generates speech, transcribes it back,
    and shows input text vs. output text side by side so you can confirm
    it worked purely by reading."""
    print(f"Input text:  {text!r}")
    print(f"Voice:       {voice}")
    print()

    print("Generating speech...")
    audio_bytes = generate_tts(text, voice)
    print(f"  -> {len(audio_bytes)} bytes of audio generated")

    print("Transcribing it back...")
    result = transcribe(audio_bytes)
    heard_text = result["text"]
    print(f"  -> heard: {heard_text!r}  (language: {result['language']})")
    print()

    # Simple case-insensitive comparison, ignoring trailing punctuation
    normalize = lambda s: s.strip().rstrip(".!?").lower()
    if normalize(text) == normalize(heard_text):
        print("MATCH - the audio says what you typed.")
    else:
        print("DIFFERENT - the audio doesn't exactly match your input.")
        print("(This can be normal: TTS/STT round-trips aren't always word-for-word,")
        print(" especially with punctuation, numbers, or unusual words.)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "tts":
        text = sys.argv[2] if len(sys.argv) > 2 else "hello world"
        voice = sys.argv[3] if len(sys.argv) > 3 else "am_adam"
        test_tts(text, voice)
    elif command == "stt":
        if len(sys.argv) < 3:
            print("Usage: test_api.py stt <path-to-audio-file>")
            sys.exit(1)
        test_stt(sys.argv[2])
    elif command == "verify":
        text = sys.argv[2] if len(sys.argv) > 2 else "hello world"
        voice = sys.argv[3] if len(sys.argv) > 3 else "am_adam"
        verify(text, voice)
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
