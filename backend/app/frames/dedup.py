from collections import deque
import imagehash
from app.core.config import get_settings

settings = get_settings()


class FrameDeduplicator:
    """
    Maintains a rolling window of recent accepted perceptual hashes (pHash)
    and checks if candidate frames are duplicates within Hamming distance <= 4.
    """

    def __init__(self, max_history: int = settings.DEDUP_LAST_N):
        self.max_history = max_history
        self.history: deque[imagehash.ImageHash] = deque(maxlen=max_history)

    def is_duplicate(self, phash: imagehash.ImageHash | str, threshold: int = 4) -> bool:
        if isinstance(phash, str):
            phash = imagehash.hex_to_hash(phash)

        for prev_hash in self.history:
            distance = phash - prev_hash
            if distance <= threshold:
                return True
        return False

    def add(self, phash: imagehash.ImageHash | str) -> None:
        if isinstance(phash, str):
            phash = imagehash.hex_to_hash(phash)
        self.history.append(phash)

    def clear(self) -> None:
        self.history.clear()
