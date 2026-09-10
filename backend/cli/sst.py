import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel

SAMPLE_RATE = 16000

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

frames = []

def audio_callback(indata, status):
    if status:
        print(f"Audio status: {status}")
    frames.append(indata.copy())


print("Press Enter to start recording...")
input()

print("Recording... Press Enter to stop.")

with sd.InputStream(
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype="float32",
    callback=audio_callback,
):
    input()

print("Recording finished.")

if frames:
    audio = np.concatenate(frames, axis=0).flatten()
    segments, info = model.transcribe(audio)

    text = ""
    for segment in segments:
        text += segment.text

    print("You said:", text)
else:
    print("No audio recorded.")