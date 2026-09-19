import io
from typing import Any
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# High-contrast palette for annotations
PALETTE = [
    (255, 59, 48),    # Red
    (0, 122, 255),    # Blue
    (52, 199, 89),    # Green
    (255, 149, 0),    # Orange
    (175, 82, 222),   # Purple
    (255, 204, 0),    # Yellow
]


def scale_coords_to_pixels(box_2d: list[int], width: int, height: int) -> tuple[int, int, int, int]:
    """
    Converts normalized 0-1000 coordinates [ymin, xmin, ymax, xmax] to pixel [x1, y1, x2, y2].
    Section 4.2 of TZ.
    """
    ymin, xmin, ymax, xmax = box_2d
    x1 = int((xmin / 1000.0) * width)
    y1 = int((ymin / 1000.0) * height)
    x2 = int((xmax / 1000.0) * width)
    y2 = int((ymax / 1000.0) * height)
    return max(0, x1), max(0, y1), min(width, x2), min(height, y2)


def scale_point_to_pixels(point_2d: list[int], width: int, height: int) -> tuple[int, int]:
    """Converts normalized 0-1000 coordinates [y, x] to pixel (px, py)."""
    y, x = point_2d
    px = int((x / 1000.0) * width)
    py = int((y / 1000.0) * height)
    return max(0, min(width, px)), max(0, min(height, py))


def render_annotations_on_image(
    image_rgb: np.ndarray,
    annotations: list[dict[str, Any]],
) -> Image.Image:
    """
    Renders visual annotations on a frame using Pillow according to Section 9 of TZ:
    - Outline box (scaled thickness based on resolution).
    - Numbered badge circle at the corner.
    - Arrow pointing to point_2d.
    - Highlight with 0.25 alpha overlay.
    - No textual labels on image (labels are passed to frontend for legend).
    """
    base_img = Image.fromarray(image_rgb).convert("RGBA")
    width, height = base_img.size

    # Scale line thickness (3px for 1080p height)
    scale_factor = height / 1080.0
    line_thickness = max(2, int(3 * scale_factor))
    badge_radius = max(10, int(16 * scale_factor))

    # Overlay for transparent highlights
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_base = ImageDraw.Draw(base_img)

    badge_positions: list[tuple[int, int]] = []

    for idx, ann in enumerate(annotations):
        color_rgb = PALETTE[idx % len(PALETTE)]
        ann_type = ann.get("type", "box")
        badge_id = str(ann.get("id", idx + 1))

        box = ann.get("box_2d")
        if box and len(box) == 4:
            x1, y1, x2, y2 = scale_coords_to_pixels(box, width, height)

            # Highlight translucent fill (alpha 0.25 = 64)
            if ann_type == "highlight":
                draw_overlay.rectangle([x1, y1, x2, y2], fill=(*color_rgb, 64))

            # Box outline
            draw_base.rectangle([x1, y1, x2, y2], outline=(*color_rgb, 255), width=line_thickness)

            # Badge circle position (top-left of box by default)
            bx = x1
            by = y1

            # Collision avoidance: shift badge if overlapping previous badges
            for prev_bx, prev_by in badge_positions:
                if abs(bx - prev_bx) < badge_radius * 2 and abs(by - prev_by) < badge_radius * 2:
                    # Shift to top-right of box
                    bx = x2 - badge_radius * 2
                    break

            badge_positions.append((bx, by))

            # Draw circle badge with number
            circle_bbox = [bx - badge_radius, by - badge_radius, bx + badge_radius, by + badge_radius]
            draw_base.ellipse(circle_bbox, fill=(*color_rgb, 255), outline=(255, 255, 255, 255), width=2)
            draw_base.text((bx, by), badge_id, fill=(255, 255, 255, 255), anchor="mm")

        # Arrow
        point = ann.get("point_2d")
        if ann_type == "arrow" and point and len(point) == 2:
            px, py = scale_point_to_pixels(point, width, height)
            start_x = px - int(40 * scale_factor)
            start_y = py - int(40 * scale_factor)
            draw_base.line([(start_x, start_y), (px, py)], fill=(*color_rgb, 255), width=line_thickness + 1)
            # Arrow tip
            draw_base.regular_polygon((px, py, int(8 * scale_factor)), 3, rotation=45, fill=(*color_rgb, 255))

    # Composite overlay onto base image
    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    return final_img


def encode_image_to_webp(image: Image.Image, quality: int = 90) -> bytes:
    """Encodes PIL image to WebP bytes."""
    buf = io.BytesIO()
    image.save(buf, format="WEBP", quality=quality)
    return buf.getvalue()
