import io
import uuid
import pymupdf as fitz
import imagehash
import numpy as np
import pytest
from PIL import Image
from unittest.mock import AsyncMock, MagicMock, patch
from app.frames.detector import SlideBoardDetector
from app.frames.presentation import extract_key_terms, process_presentation_pdf
from app.models.lesson import Lesson
from app.models.slide import LessonSlide


def create_sample_pdf_bytes() -> bytes:
    """Creates a 2-page test PDF in memory using PyMuPDF."""
    doc = fitz.open()
    # Page 1
    p1 = doc.new_page(width=800, height=600)
    p1.insert_text((50, 50), "Quantum mechanics: Schrodinger equation and wave function.", fontsize=18)

    # Page 2
    p2 = doc.new_page(width=800, height=600)
    p2.insert_text((50, 50), "Photoelectric effect: photon energy, frequency and Planck constant.", fontsize=18)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_process_presentation_pdf():
    lesson_id = uuid.uuid4()
    pdf_bytes = create_sample_pdf_bytes()

    with patch("app.frames.presentation.upload_bytes", new_callable=AsyncMock) as mock_upload:
        slides, terms = await process_presentation_pdf(
            file_bytes=pdf_bytes,
            lesson_id=lesson_id,
            dpi=72,
        )

        assert len(slides) == 2
        assert mock_upload.call_count == 2
        assert slides[0].slide_idx == 1
        assert slides[1].slide_idx == 2
        assert "quantum" in slides[0].extracted_text.lower() or "schrodinger" in slides[0].extracted_text.lower()
        assert len(slides[0].phash) > 0

        # Verify extracted terms
        terms_lower = [t.lower() for t in terms]
        assert any("quantum" in t or "mechanics" in t or "schrodinger" in t for t in terms_lower)


def test_slide_board_detector_zero_cost_matching():
    detector = SlideBoardDetector()

    # Create a synthetic image
    img = Image.new("RGB", (640, 480), color=(200, 200, 200))
    img_phash = imagehash.phash(img)
    phash_str = str(img_phash)

    # Preload presentation slides
    detector.set_presentation_slides([
        {
            "slide_idx": 3,
            "phash": phash_str,
            "s3_key": "lessons/xyz/slides/slide_3.webp",
            "extracted_text": "Текст слайда номер три",
        }
    ])

    # Send first frame to initialize detector
    img_np = np.array(img)
    detector.process_frame(img_np, 1000)

    # Advance time and send second frame matching the slide
    candidate = detector.process_frame(img_np, 6000)

    assert candidate is not None
    assert candidate.matched_slide_idx == 3
    assert candidate.matched_slide_s3_key == "lessons/xyz/slides/slide_3.webp"
    assert candidate.matched_slide_text == "Текст слайда номер три"
