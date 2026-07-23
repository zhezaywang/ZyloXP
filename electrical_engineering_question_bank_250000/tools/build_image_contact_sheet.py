#!/usr/bin/env python3
"""Rasterize one SVG per question template and build a visual QA contact sheet."""

from __future__ import annotations

import csv
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PACKAGE_DIR = Path(__file__).resolve().parents[1]
IMAGE_CSV = PACKAGE_DIR / "image_database.csv"
OUTPUT_PNG = PACKAGE_DIR / "latex_image_contact_sheet.png"


def main() -> None:
    selected: list[dict[str, str]] = []
    seen: set[str] = set()
    with IMAGE_CSV.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row["template_id"] not in seen:
                seen.add(row["template_id"])
                selected.append(row)

    if len(selected) != 100:
        raise RuntimeError(f"Expected 100 template samples, found {len(selected)}")

    with tempfile.TemporaryDirectory(prefix="zyloxp-svg-qa-") as temp_name:
        temp_dir = Path(temp_name)
        paths = [PACKAGE_DIR / row["relative_path"] for row in selected]
        for path in paths:
            preview_path = temp_dir / f"{path.name}.png"
            result = subprocess.run(
                ["sips", "-s", "format", "png", str(path), "--out", str(preview_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode:
                raise RuntimeError(result.stderr or result.stdout)

        tile_w = 480
        tile_h = 330
        cols = 5
        rows = 20
        canvas = Image.new("RGB", (cols * tile_w, rows * tile_h), "white")
        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)
        except OSError:
            font = ImageFont.load_default()

        for index, row in enumerate(selected):
            preview_path = temp_dir / f"{Path(row['relative_path']).name}.png"
            if not preview_path.exists():
                raise RuntimeError(f"Missing Quick Look preview for {row['image_id']}")
            preview = Image.open(preview_path).convert("RGB")
            preview.thumbnail((tile_w - 12, tile_h - 32), Image.Resampling.LANCZOS)
            x = (index % cols) * tile_w
            y = (index // cols) * tile_h
            px = x + (tile_w - preview.width) // 2
            py = y + 24 + (tile_h - 28 - preview.height) // 2
            canvas.paste(preview, (px, py))
            draw.text(
                (x + 8, y + 5),
                f"{row['template_id']}  {row['subtopic']}",
                fill="#1F2933",
                font=font,
            )
            draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline="#D9E2E7", width=1)

        canvas.save(OUTPUT_PNG, quality=92)
    print(f"Wrote {OUTPUT_PNG}")


if __name__ == "__main__":
    main()
