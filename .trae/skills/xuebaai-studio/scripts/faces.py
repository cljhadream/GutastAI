#!/usr/bin/env python3
"""从全家设定图裁圆形头像（文章头像素材、网站侧边栏、视频聊天头像共用）。

用法: python faces.py <输出目录> [--size 512]
输出: av-dad.png av-mom.png av-grandpa.png av-grandma.png av-boy.png av-girl.png（透明底圆形）
坐标 = 设定图缩到 2000 宽后的 (脸中心 x, y, 半边长)，再 x1.28 还原到 2560 宽的原图。
与 xbplan-illustrator 的 faces.py 同源：两边共用同一张设定图，裁出的头像一致。
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw

SHEET = Path(__file__).resolve().parent.parent / "assets" / "character-sheet.jpg"
FACES = {"dad": (585, 190, 150), "mom": (855, 300, 150), "grandpa": (1160, 255, 160),
         "grandma": (1480, 300, 175), "boy": (935, 715, 150), "girl": (1215, 800, 135)}

ap = argparse.ArgumentParser()
ap.add_argument("outdir")
ap.add_argument("--size", type=int, default=512)
a = ap.parse_args()
out = Path(a.outdir)
out.mkdir(parents=True, exist_ok=True)
sheet = Image.open(SHEET).convert("RGB")
for name, (cx, cy, half) in FACES.items():
    s, x, y = int(half * 1.28), int(cx * 1.28), int(cy * 1.28)
    im = sheet.crop((x - s, y - s, x + s, y + s)).resize((a.size, a.size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, a.size - 1, a.size - 1), fill=255)
    im.putalpha(m)
    im.save(out / f"av-{name}.png")
    print("av-" + name + ".png")
