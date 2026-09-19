import numpy as np
from app.frames.detector import SlideBoardDetector


def test_detector_roi_crop():
    detector = SlideBoardDetector(roi=[0.1, 0.2, 0.5, 0.6])
    img = np.zeros((1000, 1000, 3), dtype=np.uint8)

    cropped = detector.apply_roi(img)
    # y: 200..800 (height 600), x: 100..600 (width 500)
    assert cropped.shape == (600, 500, 3)


def test_detector_blur_check():
    # Uniform solid image has variance of Laplacian = 0 (blurry)
    solid_gray = np.ones((300, 300), dtype=np.uint8) * 128
    assert SlideBoardDetector.is_blurry(solid_gray, min_var=60.0) is True

    # High frequency noise has high variance
    np.random.seed(42)
    noisy_gray = np.random.randint(0, 255, (300, 300), dtype=np.uint8)
    assert SlideBoardDetector.is_blurry(noisy_gray, min_var=60.0) is False


def test_detector_slide_transition():
    detector = SlideBoardDetector()

    # Initial frame
    img_slide1 = np.ones((720, 1280, 3), dtype=np.uint8) * 20
    # Add high contrast pattern so it's not blurry
    img_slide1[::10, ::10] = 255
    res0 = detector.process_frame(img_slide1, t_ms=0)
    assert res0 is None  # Initial frame sets baseline

    # Changing frame (different slide)
    img_slide2 = np.ones((720, 1280, 3), dtype=np.uint8) * 200
    img_slide2[::10, ::10] = 0
    res1 = detector.process_frame(img_slide2, t_ms=1000)
    assert detector.state == "changing"

    # Frame remains stable for 1s
    res2 = detector.process_frame(img_slide2, t_ms=2000)
    assert detector.state == "changing"

    # Frame remains stable for another 1s (total 2s >= STABLE_SECONDS)
    # Give t_ms gap >= 4.0s (min_frame_gap_sec)
    res3 = detector.process_frame(img_slide2, t_ms=5000)
    assert detector.state == "stable"
    assert res3 is not None
    assert res3.width == 1280
    assert res3.height == 720
