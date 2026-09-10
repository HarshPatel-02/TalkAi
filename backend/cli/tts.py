from kokoro import KPipeline
import soundfile as sf

pipeline =KPipeline(lang_code="a")


text=input("Enter Text:")

if not text.strip():
    print("Please enter again text")
    exit()

genrator=pipeline(text,voice="am_adam")

for _, _, audio in genrator:
    sf.write(
        "hello.wav",
        audio,
        24000
    )

    print("Speech generated successfully!")
    print("Saved as hello.wav")

    break