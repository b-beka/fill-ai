import wave
import io
from app.asr.groq_whisper import pcm16_to_wav


def test_pcm16_to_wav_conversion():
    # 1 second of 16kHz mono 16-bit silence
    pcm_bytes = b"\x00\x00" * 16000
    wav_bytes = pcm16_to_wav(pcm_bytes, sample_rate=16000)

    assert wav_bytes.startswith(b"RIFF")
    assert b"WAVE" in wav_bytes[:16]

    # Verify wave file can be parsed
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == 16000
        assert wf.getnframes() == 16000
