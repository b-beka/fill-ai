import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.ai.faithfulness import FaithfulnessOutput, verify_block_faithfulness
from app.ai.schemas import CalloutItem, NoteBlockOutput
from app.media.egress import get_recording_playback_url, start_room_recording
from app.models.lesson import Lesson


@pytest.mark.asyncio
async def test_faithfulness_verification_faithful():
    mock_provider = AsyncMock()
    mock_provider.generate.return_value = FaithfulnessOutput(
        is_faithful=True,
        unfaithful_claims=[],
        corrected_body_md=None,
        factuality_score=1.0,
    )

    initial_output = NoteBlockOutput(
        title="Основы термодинамики",
        summary="Первое начало",
        body_md="Теплота передается телу и расходуется на изменение внутренней энергии.",
        key_terms=[],
        callouts=[],
        frame_refs=[],
        uncertain=[],
    )

    res = await verify_block_faithfulness(
        output=initial_output,
        transcript_text="Сегодня обсуждаем первое начало термодинамики: Q равно дельта U плюс A.",
        slide_text=None,
        provider=mock_provider,
    )

    assert res.body_md == "Теплота передается телу и расходуется на изменение внутренней энергии."
    assert len(res.uncertain) == 0
    assert len(res.callouts) == 0


@pytest.mark.asyncio
async def test_faithfulness_verification_unfaithful_correction():
    mock_provider = AsyncMock()
    mock_provider.generate.return_value = FaithfulnessOutput(
        is_faithful=False,
        unfaithful_claims=["Теорема доказана в 1850 году"],
        corrected_body_md="Внутренняя энергия идеального газа зависит только от температуры.",
        factuality_score=0.6,
    )

    initial_output = NoteBlockOutput(
        title="Основы термодинамики",
        summary="Первое начало",
        body_md="Теорема доказана в 1850 году. Внутренняя энергия зависит от температуры.",
        key_terms=[],
        callouts=[],
        frame_refs=[],
        uncertain=[],
    )

    res = await verify_block_faithfulness(
        output=initial_output,
        transcript_text="Внутренняя энергия зависит только от температуры газа.",
        slide_text=None,
        provider=mock_provider,
    )

    assert res.body_md == "Внутренняя энергия идеального газа зависит только от температуры."
    assert "Теорема доказана в 1850 году" in res.uncertain
    assert any(c.kind == "warning" for c in res.callouts)


@pytest.mark.asyncio
async def test_recording_egress_and_endpoint():
    from app.api.routes.lessons import get_lesson_recording

    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id

    # Test start_room_recording fallback
    rec_id = await start_room_recording("test_room", lesson_id)
    assert rec_id is not None

    # Test playback url
    with patch("app.media.egress.get_presigned_url", new_callable=AsyncMock) as mock_p_url:
        mock_p_url.return_value = "https://s3.example.com/recording.mp4?sig=xyz"
        resp = await get_lesson_recording(lesson=mock_lesson)
        assert resp["lesson_id"] == str(lesson_id)
        assert resp["recording_url"] == "https://s3.example.com/recording.mp4?sig=xyz"
        assert resp["format"] == "mp4"
