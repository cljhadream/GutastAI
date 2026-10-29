#!/usr/bin/env python3
"""学爸学AI 插画出图：固定风格 + 全家设定图做参考图 + 人物外貌词自动补全。

与 xbplan-illustrator 共用同一张 character-sheet.jpg 和同一组外貌词，
两边出的人物才能互相认得（跨 skill / 跨视频 / 跨网站统一）。改外貌词必须两边同步。

用法
  批量:  python gen.py jobs.json <输出目录> [--n 3] [--force] [--dry-run]
  单张:  python gen.py --scene "{爸爸}在书桌前跟着终端学 Claude Code" --out a.jpg [--layout cover] [--ref 图] [--size 2560x1440] [--n 3] [--force] [--dry-run]
  速查:  python gen.py --list

jobs.json（列表，每项一张图）:
  name      输出文件名，如 "02-cover.jpg"（必填）
  scene     场景描述（必填）。人物用 {爸爸} {妈妈} {爷爷} {奶奶} {男孩} {女孩} 占位，脚本会补上固定外貌词、
            自动追加"参考图中的人物形象保持一致""画面中只有这N个人""参考图里的其他人不要出现"
  layout    可选：cover（左 1/3 留白）/ cover-wide（左 4 成留白）/ bubbles（上角留白，便于叠气泡）
  composition  可选：自己写的构图要求，接在 layout 后面
  ref       可选：参考图路径。不写 = 有人物时用全家设定图，没人物时不用；"none" = 强制不用；
            想做同构图的变体，就把上一张成图的路径写在这里
  size      可选，默认 2560x1440（16:9）；竖版用 1440x2560（未验证，稳妥先出 16:9 再裁）
  n         可选：出几张候选（文件名加 -1 -2 -3），3 人以上的场景建议 3，看图挑一张；命令行用 --n
  crowd     可选 true：不追加"只有这N个人"和"其他人不要出现"（场景里本来就要有路人时用）
  style     可选：覆盖默认风格后缀（一般不要改，改了就和别的图不统一了）

--dry-run 只打印最终提示词，不调接口（出图前先看一眼，也方便存档）。
已存在的文件默认跳过；失败自动重试 2 次；每张成功后把最终提示词记到 <输出目录>/_prompts.json。
默认开启 API 水印（"AI生成"），符合 2025-09 起的 AI 生成内容标识要求；密钥只在 volc-image-gen 里，本脚本不读取、不打印。
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = Path(__file__).resolve().parent
SHEET = HERE.parent / "assets" / "character-sheet.jpg"

# volc-image-gen 的已知位置：环境变量优先，其次 trae-cn 全局 skill，再次 Kevin_skills
VOLC_CANDIDATES = [
    os.environ.get("VOLC_IMAGE_GEN_DIR"),
    "C:/Users/sunia/.trae-cn/skills/volc-image-gen",
    "C:/Documents/Myproject/Kevin_skills/volc-image-gen",
]

# 占位词 -> (首次出现的完整写法, 之后的简称)。外貌词与 xbplan-illustrator 逐字一致，别改——
# 脸的一致性一半靠设定图、一半靠这组词；两边不一致会出"两个版本的爸爸"。
CHARACTERS = {
    "爸爸": ("戴黑框眼镜、穿浅蓝衬衫的爸爸", "爸爸"),
    "妈妈": ("黑色及肩发、穿米色针织衫的妈妈", "妈妈"),
    "爷爷": ("短白发、白胡子、穿深蓝毛衣的爷爷", "爷爷"),
    "奶奶": ("银灰卷发、穿暖橙色开衫的奶奶", "奶奶"),
    "男孩": ("穿黄T恤的7岁小男孩", "小男孩"),
    "女孩": ("穿粉色连衣裙、扎两个丸子头的4岁小女孩", "小女孩"),
}
STYLE = "皮克斯风格3D卡通渲染插画，温暖柔和的光线，蓝色与暖橙色主色调，画面干净，细节丰富，高清"
SAME = "参考图中的人物形象保持一致"
NO_TEXT = "画面中没有任何文字、字母、数字"
NUM = {1: "一", 2: "两", 3: "三", 4: "四", 5: "五", 6: "六"}
LAYOUTS = {
    "cover": "构图：人物与主体位于画面右侧三分之二，左侧三分之一是干净柔和的留白背景，便于排版",
    "cover-wide": "构图：画面左侧约四成是空旷干净的背景（没有任何物体和人物），所有主体都集中在画面右侧六成区域内，便于排版",
    "bubbles": "构图：人物位于画面中下部，画面左上角和右上角是留白的墙面或天空，便于叠加对话气泡",
}
TOKEN = re.compile(r"\{([^{}]+)\}")
LIST_SEP = re.compile(r"\}(?:、|和|与|及|跟)\{")


def find_volc():
    for c in VOLC_CANDIDATES:
        if c and (Path(c) / "volc_image_gen.py").exists():
            return Path(c)
    sys.exit(
        "找不到 volc-image-gen，试过：\n"
        + "\n".join(f"  - {c}" for c in VOLC_CANDIDATES if c)
        + "\n可用环境变量 VOLC_IMAGE_GEN_DIR 指定它所在的目录。"
    )


def expand(scene):
    """把 {爸爸} 之类的占位词换成"外貌词 + 的 + 称呼"，返回 (场景文字, 出场人物列表)。"""
    cast = []
    # 人物之间一律用"，"隔开：外貌词里已经有"、"，再用"、/和"连人物，模型会把修饰语分错人（衣服穿反）
    scene = LIST_SEP.sub("}，{", scene)

    def sub(m):
        key = m.group(1)
        if key not in CHARACTERS:
            sys.exit(f"未知的人物占位词 {{{key}}}，可用：{'、'.join(CHARACTERS)}（新人物没有设定图，脸无法保持一致，请先商量）")
        full, short = CHARACTERS[key]
        if key in cast:
            return short
        cast.append(key)
        return full

    return TOKEN.sub(sub, scene), cast


def build_prompt(job):
    scene, cast = expand(job["scene"])
    parts = [scene.strip().rstrip("。，,；; ")]
    if cast:
        parts.append(SAME)
        if not job.get("crowd"):
            names = "、".join(CHARACTERS[k][1] for k in cast)
            tail = ""
            if len(cast) >= 2:      # 多人场景实测会"重复画同一个人"或"漏掉一个人"，明说一次
                tail = "，每人只出现一次"
            if len(cast) >= 3:
                tail += f"，{NUM[len(cast)]}个人都完整地出现在画面里"
            parts.append(f"画面中只有{names}这{NUM[len(cast)]}个人{tail}")
            others = [CHARACTERS[k][1] for k in CHARACTERS if k not in cast]
            if others:   # 设定图里有六个人，不点名排除，多余的人会"漏"进画面
                parts.append(f"参考图里的{'、'.join(others)}不要出现在画面里")
    if job.get("layout"):
        if job["layout"] not in LAYOUTS:
            sys.exit(f"未知的 layout {job['layout']}，可用：{'、'.join(LAYOUTS)}")
        parts.append(LAYOUTS[job["layout"]])
    if job.get("composition"):
        parts.append(job["composition"].strip().rstrip("。"))
    parts.append(NO_TEXT)
    return "。".join(parts), cast


def pick_ref(job, cast):
    ref = job.get("ref")
    if ref in ("none", "None", False):
        return None
    if ref in (None, "sheet"):
        return str(SHEET) if (cast or ref == "sheet") else None
    return str(Path(ref).resolve())


def load_generator():
    volc = find_volc()
    sys.path.insert(0, str(volc))
    from volc_image_gen import generate_image  # noqa: E402
    return generate_image


def record(outdir, name, entry):
    f = outdir / "_prompts.json"
    data = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    data[name] = entry
    f.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def run(jobs, outdir, force, dry, n_default=1):
    outdir = Path(outdir).resolve()   # 相对路径会让接口脚本的 makedirs('') 报错
    outdir.mkdir(parents=True, exist_ok=True)
    gen = None if dry else load_generator()
    for j in jobs:
        prompt, cast = build_prompt(j)
        ref = pick_ref(j, cast)
        size = j.get("size", "2560x1440")
        n = max(1, int(j.get("n", n_default)))
        stem, ext = os.path.splitext(j["name"])
        names = [j["name"]] if n == 1 else [f"{stem}-{i}{ext}" for i in range(1, n + 1)]
        if dry:
            print(f"== {', '.join(names)}  size={size}  ref={Path(ref).name if ref else '无'}\n{prompt}\n")
            continue
        for name in names:
            dst = outdir / name
            if dst.exists() and not force:
                print("skip", name)
                continue
            for attempt in range(3):
                r = gen(prompt=prompt, output_path=str(dst), style=j.get("style", STYLE), size=size,
                        watermark=True, use_base64=True, reference_image=ref)
                if r.get("success"):
                    print("OK  ", name, f"{r['size'] / 1024:.0f}KB", flush=True)
                    record(outdir, name, {"prompt": prompt, "ref": ref and Path(ref).name, "size": size})
                    break
                print("FAIL", name, str(r.get("error"))[:200], flush=True)
                time.sleep(3)
            else:
                print("GIVE UP", name, flush=True)


def main():
    ap = argparse.ArgumentParser(description="学爸学AI 插画出图")
    ap.add_argument("jobs", nargs="?", help="jobs.json 路径（批量）")
    ap.add_argument("outdir", nargs="?", help="输出目录（批量）")
    ap.add_argument("--scene", help="单张：场景描述")
    ap.add_argument("--out", help="单张：输出文件路径")
    ap.add_argument("--layout", help="单张：构图预设")
    ap.add_argument("--ref", help="单张：参考图（默认：有人物时用设定图）")
    ap.add_argument("--size", default="2560x1440")
    ap.add_argument("--n", type=int, default=1, help="每张图出几张候选（3 人以上的场景建议 3）")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--list", action="store_true", help="列出人物占位词和构图预设")
    a = ap.parse_args()

    if a.list:
        for k, (full, _) in CHARACTERS.items():
            print(f"{{{k}}} -> {full}")
        for k, v in LAYOUTS.items():
            print(f"layout {k}: {v}")
        print(f"设定图: {SHEET}")
        print(f"volc-image-gen: {find_volc()}")
        return
    if a.scene:
        if not a.out:
            ap.error("单张模式要写 --out")
        out = Path(a.out).resolve()
        job = {"name": out.name, "scene": a.scene, "size": a.size, "n": a.n}
        if a.layout:
            job["layout"] = a.layout
        if a.ref:
            job["ref"] = a.ref
        run([job], out.parent, a.force, a.dry_run)
        return
    if not (a.jobs and a.outdir):
        ap.error("批量模式要写 jobs.json 和输出目录；单张模式要写 --scene 和 --out")
    jobs = json.loads(Path(a.jobs).read_text(encoding="utf-8"))
    run(jobs, Path(a.outdir), a.force, a.dry_run, a.n)


if __name__ == "__main__":
    main()
