from app.asr.soniox_stream import AudioRingBuffer


def test_ring_buffer_retention():
    max_bytes = 1000
    rb = AudioRingBuffer(max_bytes=max_bytes)

    # Add 600 bytes
    chunk1 = b"A" * 600
    rb.append(chunk1)
    assert len(rb.get_buffered_audio()) == 600
    assert rb.get_buffered_audio() == chunk1

    # Add another 600 bytes (total 1200 > 1000)
    chunk2 = b"B" * 600
    rb.append(chunk2)

    buffered = rb.get_buffered_audio()
    assert len(buffered) == 1000
    # First 200 bytes of chunk1 should have dropped out
    assert buffered == (b"A" * 400 + b"B" * 600)


def test_ring_buffer_clear():
    rb = AudioRingBuffer(max_bytes=500)
    rb.append(b"XYZ" * 50)
    assert len(rb.get_buffered_audio()) > 0
    rb.clear()
    assert len(rb.get_buffered_audio()) == 0
