import uuid
from app.ai.window_manager import WindowManager


def test_window_manager_conditions():
    wm = WindowManager(lesson_id=uuid.uuid4(), initial_start_ms=0)
    wm.update_slide_title("Введение")

    # 1. 50 seconds: should not close
    assert wm.should_close_window(current_ms=50000) is False

    # 2. 130 seconds with same slide title: should not close
    assert wm.should_close_window(current_ms=130000, new_slide_title="Введение") is False

    # 3. 130 seconds with NEW slide title: should close (>= 120s)
    assert wm.should_close_window(current_ms=130000, new_slide_title="Основная теорема") is True

    # 4. 250 seconds without sentence boundary: should not close
    assert wm.should_close_window(current_ms=250000, is_sentence_boundary=False) is False

    # 5. 250 seconds with sentence boundary: should close (>= 240s)
    assert wm.should_close_window(current_ms=250000, is_sentence_boundary=True) is True

    # 6. 370 seconds: force close (>= 360s)
    assert wm.should_close_window(current_ms=370000) is True

    # 7. Lesson ended: should close immediately even at 10s
    assert wm.should_close_window(current_ms=10000, is_lesson_ended=True) is True
