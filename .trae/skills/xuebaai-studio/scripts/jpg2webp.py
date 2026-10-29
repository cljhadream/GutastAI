"""Convert generated illustrations from JPG to WebP for web performance.

Usage:
    python jpg2webp.py <file_or_dir> [file_or_dir ...]

- JPG/JPEG files are converted to WebP in place (same directory, same stem).
- Directories are walked recursively. PNG (avatars with alpha) are skipped.
- Original JPGs are kept as masters; callers update article links to .webp.
"""

import sys
from pathlib import Path

from PIL import Image

QUALITY = 85        # WebP quality, visually lossless enough for articles
METHOD = 6          # slowest = best compression


def convert(src: Path) -> None:
    dst = src.with_suffix(".webp")
    if dst.exists():
        print("skip", dst.name, "(exists)")
        return
    img = Image.open(src)
    img.save(dst, "WEBP", quality=QUALITY, method=METHOD)
    before, after = src.stat().st_size / 1024, dst.stat().st_size / 1024
    print(f"OK   {dst.name}  {before:.0f}KB -> {after:.0f}KB  ({100 - after / before * 100:.0f}% smaller)")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.is_dir():
            targets = sorted(p.rglob("*"))
        else:
            targets = [p]
        for t in targets:
            if t.suffix.lower() in (".jpg", ".jpeg"):
                convert(t)


if __name__ == "__main__":
    main()
