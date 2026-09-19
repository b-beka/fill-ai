from dataclasses import dataclass
from typing import Any
import cv2
import imagehash
import numpy as np
from PIL import Image
from app.core.config import get_settings
from app.frames.dedup import FrameDeduplicator

settings = get_settings()


@dataclass
class CandidateFrame:
    t_ms: int
    image_rgb: np.ndarray
    phash: str
    width: int
    height: int


class SlideBoardDetector:
    """
    Detector for slide changes and board writing accumulation (Section 7.2 of TZ).
    Processes video frames sampled at 1 fps.
    """

    def __init__(
        self,
        roi: list[float] | None = None,  # [x, y, w, h] in normalized fractions (0.0 - 1.0)
        deduplicator: FrameDeduplicator | None = None,
    ):
        self.roi = roi
        self.dedup = deduplicator or FrameDeduplicator()

        # Thresholds
        self.change_diff_threshold = settings.CHANGE_DIFF_THRESHOLD
        self.stable_diff_threshold = settings.STABLE_DIFF_THRESHOLD
        self.stable_seconds = settings.STABLE_SECONDS
        self.min_laplacian_var = settings.MIN_LAPLACIAN_VAR
        self.min_frame_gap_sec = settings.MIN_FRAME_GAP_SEC
        self.max_frames_per_lesson = settings.MAX_FRAMES_PER_LESSON
        self.board_accumulation_min_area = settings.BOARD_ACCUMULATION_MIN_AREA

        # State tracking
        self.prev_gray_small: np.ndarray | None = None
        self.prev_phash: imagehash.ImageHash | None = None
        self.last_accepted_gray: np.ndarray | None = None
        self.last_accepted_t_ms: int = -100000

        self.state = "stable"  # "stable" | "changing"
        self.stable_timer_sec = 0.0
        self.accepted_count = 0
        self.window_accepted_count = 0

    def apply_roi(self, img_rgb: np.ndarray) -> np.ndarray:
        if not self.roi or len(self.roi) != 4:
            return img_rgb
        h, w = img_rgb.shape[:2]
        rx, ry, rw, rh = self.roi
        x1 = max(0, int(rx * w))
        y1 = max(0, int(ry * h))
        x2 = min(w, int((rx + rw) * w))
        y2 = min(h, int((ry + rh) * h))
        if x2 > x1 and y2 > y1:
            return img_rgb[y1:y2, x1:x2]
        return img_rgb

    @staticmethod
    def is_blurry(gray_img: np.ndarray, min_var: float = 60.0) -> bool:
        """Calculates variance of Laplacian to detect motion blur or out-of-focus frames."""
        var = float(cv2.Laplacian(gray_img, cv2.CV_64F).var())
        return bool(var < min_var)

    def reset_window_counter(self) -> None:
        self.window_accepted_count = 0

    def process_frame(
        self,
        full_frame_rgb: np.ndarray,
        t_ms: int,
        dt_sec: float = 1.0,
    ) -> CandidateFrame | None:
        """
        Processes an incoming frame at timestamp t_ms.
        Returns a CandidateFrame if a stable slide transition or accumulated board drawing was detected.
        """
        if self.accepted_count >= self.max_frames_per_lesson:
            return None
        if self.window_accepted_count >= settings.MAX_FRAMES_PER_WINDOW:
            return None

        # 1. Apply ROI
        cropped_rgb = self.apply_roi(full_frame_rgb)
        h, w = cropped_rgb.shape[:2]

        # 2. Downscale to 320px width in grayscale for fast detection
        scale = 320.0 / w
        small_w, small_h = 320, max(1, int(h * scale))
        gray_small = cv2.cvtColor(cropped_rgb, cv2.COLOR_RGB2GRAY)
        gray_small = cv2.resize(gray_small, (small_w, small_h), interpolation=cv2.INTER_AREA)

        pil_img = Image.fromarray(gray_small)
        current_phash = imagehash.phash(pil_img)

        # Initial frame handling
        if self.prev_gray_small is None:
            self.prev_gray_small = gray_small
            self.prev_phash = current_phash
            self.last_accepted_gray = gray_small
            return None

        # 3. Calculate diff and pHash distance
        diff = float(np.mean(np.abs(gray_small.astype(np.float32) - self.prev_gray_small.astype(np.float32))) / 255.0)
        phash_dist = current_phash - self.prev_phash

        self.prev_gray_small = gray_small
        self.prev_phash = current_phash

        # 4. State transitions: changing vs stable
        is_changing_sample = (diff > self.change_diff_threshold) or (phash_dist > 6)
        is_stable_sample = diff < self.stable_diff_threshold

        candidate_detected = False

        if is_changing_sample:
            self.state = "changing"
            self.stable_timer_sec = 0.0
        elif self.state == "changing" and is_stable_sample:
            self.stable_timer_sec += dt_sec
            if self.stable_timer_sec >= self.stable_seconds:
                # Transition from changing to stable!
                self.state = "stable"
                candidate_detected = True
        elif self.state == "stable" and is_stable_sample:
            # 5. Check handwriting accumulation on board
            if self.last_accepted_gray is not None:
                board_diff = np.abs(gray_small.astype(np.float32) - self.last_accepted_gray.astype(np.float32)) / 255.0
                changed_pixels_fraction = float(np.count_nonzero(board_diff > 0.08) / (small_w * small_h))
                if changed_pixels_fraction >= self.board_accumulation_min_area:
                    candidate_detected = True

        if not candidate_detected:
            return None

        # 6. Apply candidate filters
        # Anti-spam gap filter
        time_since_last_accepted = (t_ms - self.last_accepted_t_ms) / 1000.0
        if time_since_last_accepted < self.min_frame_gap_sec:
            return None

        # Blur filter
        if self.is_blurry(gray_small, self.min_laplacian_var):
            return None

        # Deduplication against recent accepted frames
        if self.dedup.is_duplicate(current_phash, threshold=4):
            return None

        # 7. Accept candidate
        self.dedup.add(current_phash)
        self.last_accepted_gray = gray_small
        self.last_accepted_t_ms = t_ms
        self.accepted_count += 1
        self.window_accepted_count += 1

        return CandidateFrame(
            t_ms=t_ms,
            image_rgb=cropped_rgb,
            phash=str(current_phash),
            width=w,
            height=h,
        )
