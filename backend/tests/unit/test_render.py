import numpy as np
from PIL import Image
from app.frames.render import (
    render_annotations_on_image,
    scale_coords_to_pixels,
    scale_point_to_pixels,
)
from app.workers.ai_worker import filter_annotation_areas


def test_scale_coords():
    # [ymin, xmin, ymax, xmax] = [100, 200, 500, 800] on a 1920x1080 image
    box = [100, 200, 500, 800]
    x1, y1, x2, y2 = scale_coords_to_pixels(box, width=1920, height=1080)
    assert x1 == 384  # (200 / 1000) * 1920
    assert y1 == 108  # (100 / 1000) * 1080
    assert x2 == 1536 # (800 / 1000) * 1920
    assert y2 == 540  # (500 / 1000) * 1080


def test_scale_point():
    point = [500, 250]  # [y, x]
    px, py = scale_point_to_pixels(point, width=1000, height=1000)
    assert px == 250
    assert py == 500


def test_render_annotations():
    base_img = np.ones((720, 1280, 3), dtype=np.uint8) * 240
    annotations = [
        {
            "id": 1,
            "type": "box",
            "box_2d": [100, 100, 400, 400],
            "label": "Заголовок темы",
        },
        {
            "id": 2,
            "type": "highlight",
            "box_2d": [500, 500, 700, 900],
            "label": "Ключевая формула",
        },
        {
            "id": 3,
            "type": "arrow",
            "box_2d": [100, 600, 300, 800],
            "point_2d": [200, 700],
            "label": "Стрелка к блоку",
        },
    ]

    rendered_img = render_annotations_on_image(base_img, annotations)
    assert isinstance(rendered_img, Image.Image)
    assert rendered_img.size == (1280, 720)


def test_filter_annotation_areas():
    # Area = (ymax - ymin) * (xmax - xmin)
    # Total canvas is 1000x1000 = 1,000,000
    # Minimum valid area = 2,000 (0.2%)
    # Maximum valid area = 900,000 (90%)
    annotations = [
        {"id": 1, "box_2d": [0, 0, 10, 10]},       # Area = 100 (< 2000) -> DISCARD
        {"id": 2, "box_2d": [100, 100, 300, 300]}, # Area = 40,000 (4%) -> KEEP
        {"id": 3, "box_2d": [0, 0, 1000, 950]},    # Area = 950,000 (95%) -> DISCARD
    ]

    filtered = filter_annotation_areas(annotations)
    assert len(filtered) == 1
    assert filtered[0]["id"] == 2
