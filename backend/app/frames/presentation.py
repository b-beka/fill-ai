import io
import re
import uuid
from typing import Any
import pymupdf as fitz
import imagehash
from PIL import Image
from app.core.logging import get_logger
from app.core.s3 import upload_bytes
from app.models.slide import LessonSlide

logger = get_logger("frames.presentation")

# Basic term extractor for slides
STOP_WORDS = {
    "это", "как", "так", "для", "или", "что", "при", "все", "его", "она", "они",
    "the", "and", "for", "with", "this", "that", "from", "are", "was", "were",
}


def extract_key_terms(text: str) -> list[str]:
    """Extracts candidate scientific or domain terms from slide text."""
    words = re.findall(r"\b[A-Za-zА-Яа-яЁё-]{4,}\b", text)
    terms = []
    seen = set()
    for w in words:
        w_lower = w.lower()
        if w_lower not in STOP_WORDS and len(w_lower) > 3 and w_lower not in seen:
            seen.add(w_lower)
            terms.append(w)
    return terms[:30]


async def process_presentation_pdf(
    file_bytes: bytes,
    lesson_id: uuid.UUID,
    dpi: int = 150,
) -> tuple[list[LessonSlide], list[str]]:
    """
    Renders each PDF page into a high-res WebP image, computes pHash,
    extracts vector text and key terms, and uploads to S3.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    slides: list[LessonSlide] = []
    all_accumulated_terms: list[str] = []
    seen_terms_global: set[str] = set()

    for idx, page in enumerate(doc):
        page_num = idx + 1
        text = page.get_text() or ""
        terms = extract_key_terms(text)

        for t in terms:
            if t.lower() not in seen_terms_global:
                seen_terms_global.add(t.lower())
                all_accumulated_terms.append(t)

        # Render page to pixmap
        pix = page.get_pixmap(dpi=dpi)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

        # Compute pHash
        phash_val = str(imagehash.phash(img))

        # Convert to WebP bytes
        webp_buf = io.BytesIO()
        img.save(webp_buf, format="WEBP", quality=90)
        webp_bytes = webp_buf.getvalue()

        # Upload to S3
        s3_key = f"lessons/{lesson_id}/slides/slide_{page_num}.webp"
        await upload_bytes(
            key=s3_key,
            data=webp_bytes,
            content_type="image/webp",
        )

        slide = LessonSlide(
            id=uuid.uuid4(),
            lesson_id=lesson_id,
            slide_idx=page_num,
            s3_key=s3_key,
            phash=phash_val,
            extracted_text=text.strip(),
            terms=terms,
            width=pix.width,
            height=pix.height,
        )
        slides.append(slide)

    logger.info(
        "presentation_processed",
        lesson_id=str(lesson_id),
        total_slides=len(slides),
        extracted_terms=len(all_accumulated_terms),
    )
    return slides, all_accumulated_terms
