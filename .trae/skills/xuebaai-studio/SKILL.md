---
name: xuebaai-studio
description: 为「学爸学AI」频道一站式产出文章外发版 Markdown 和人物一致的插画——全家设定图做参考图加固定皮克斯 3D 风格加火山引擎 Seedream 出图，正文自然内嵌 gutast.com 产品链接（Claude Code 充值、IP 风控检测）。只要用户要写学爸学AI 系列文章、外发版、知乎/掘金/公众号稿，给文章配封面头图场景图，或提到"学爸""学AI 第几篇""脸一致""风格统一""统一人物"，就用这个 skill，哪怕没说"skill"。不用于：学爸智划小程序插画（用 xbplan-illustrator）、gutast.com 官网 UI 截图、数据图表。
---

# 学爸学AI 工作室

「学爸学AI」是不懂代码的学爸记录自己学习 Claude Code、ChatGPT Codex 的频道，文章发到知乎 / 掘金 / 公众号等平台，把读者引到 gutast.com（免费工具 + 产品页），**只做内容分享型外链：不销售话术、不加微信、不拉群**。

每次产出两样东西：**文章外发版 Markdown** + **1 张封面配图**（每篇只出一张，省生成成本，够用）。

## 文章怎么写

按周更新系列，第 NN 篇。写作规则、结构模板、gutast.com 可用链接清单、各平台发布要点，全部在 `references/article-playbook.md`，写之前先读它。几条铁律先记住：

- **第一人称"我" = 学爸（爸爸）**，不懂代码的普通人视角，真实、可复现，敢写踩坑；
- **产品推荐只走"自然内嵌"**：正文讲到的场景里顺势给链接（如"我用的检测工具"），结尾不堆链接列表；
- **按 blocks 思维写**：xbplan /buyai 博客正文是白名单块渲染（p/h2/h3/ul/ol/code/image/quote/callout），Markdown 的每个结构直接对应一个 block，写作时就按这个结构分段（映射表见 playbook），转 post JSON 时不用重排，能明显提速；
- **合规红线**：不承诺"100% 防封"，不引导加微信/加群，不贬低竞品，配图与正文都要符合中国备案网站的审核要求。

## 为什么脸能一致（照做，别省）

模型记不住人脸，一致性来自三道保险，缺哪道都会松：

1. **参考图**：每张有人物的图都带上 `assets/character-sheet.jpg`（全家六人设定图，与 xbplan-illustrator 共用同一张，跨项目脸一致）。这是最硬的一道。
2. **文字锚点**：每个人每次都用同一组外貌词（"戴黑框眼镜、穿浅蓝衬衫的爸爸"），再写"参考图中的人物形象保持一致"。外貌词让模型知道"参考图里的哪一个"，不写会把人对错位。
3. **限定人数**：写明"画面中只有这N个人"。不写，背景会冒出路人，路人脸不受约束，一致感就破了。

风格同理：每张图都追加同一条皮克斯风格后缀。`scripts/gen.py` 把这些全部自动带上，所以**优先用脚本出图，别手拼提示词**。

## 怎么出图

出图前确认能跑：`python scripts/gen.py --list` 会打印人物占位词、构图预设、设定图路径和 volc-image-gen 的位置。单张约 10–20 秒，默认 2560x1440。

单张：
```bash
python .trae/skills/xuebaai-studio/scripts/gen.py --scene "{爸爸}深夜坐在书桌前，跟着笔记本电脑屏幕里的终端学 Claude Code" --out ./02-cover.jpg --dry-run
```
`--dry-run` 只打印最终提示词不出图，先看一眼再去掉它真出。

批量（推荐，最终提示词自动留档到输出目录的 `_prompts.json`，之后能重出）：
```bash
python .trae/skills/xuebaai-studio/scripts/gen.py jobs.json <输出目录>   # --force 覆盖，--dry-run 只看词
```
```json
[{"name": "02-cover.jpg", "layout": "cover",
  "scene": "{爸爸}和{男孩}并肩坐在书桌前，一起看着发光的笔记本屏幕，屏幕散发柔和的蓝光，两个人都笑着；温暖的书房，台灯暖光"}]
```
字段：`scene` 用 `{爸爸} {妈妈} {爷爷} {奶奶} {男孩} {女孩}` 占位；`layout` 构图预设（`cover` 左 1/3 留白放标题 / `cover-wide` 左 4 成留白 / `bubbles` 上角留白叠气泡）；`ref` 参考图，`"none"` 强制不用（纯物件图）；`size` 默认 2560x1440；`n` 候选张数；`crowd: true` 允许路人。

**3 人以上是"抽签"**：1–2 人基本一次成；3 人以上直接 `--n 3`，看图挑人数对、衣服对的那张，别在提示词上反复纠缠。写 scene 的配方和更多见 `references/prompt-library.md`（找最像的已验证提示词改，比从头写稳）。

## 出完图必做的核对

用 Read 把每张图看一遍（别只信"OK"）：
- 人数对不对（有没有多出路人）；谁是谁（爸爸别变成爷爷）；衣服颜色、发型、眼镜是否对得上设定图；
- 手、脸有没有明显崩；有没有乱码文字（图里不该有任何字，要字就后期 HTML 叠加）；留白是不是真的空；
- 不满意就改词重出（`--force`），换一张通常比反复改词快。不同张之间脸的细微差别是正常的，"一眼是同一家人"即可。

## 存放约定（开源笔记库 buyai_notes）

- 交付目录：`buyai_notes/<slug>/`，每篇一个 slug 目录（小写字母/数字/连字符；slug 由 xbplan 侧统一分配，先用候选名占位，回填后若变再改名目录并同步索引链接），内含：
  - `README.md`：文章正文，文首加一行 `> 本篇是「学爸学AI」系列第 NN 篇 · [返回总目录](../README.md)`；
  - `images/`：文章引用的配图（webp）；
- **索引**：每新增一篇，在 `buyai_notes/README.md` 的「文章目录」表加一行（编号、标题链接、一句话简介），「相关资源」保留 gutast.com 链接——本仓库将开源，README 是 SEO 外链载体；
- 工作区 `doc/xueba-ai/`：jpg 母版、`_prompts.json`（gen.py 自动留档）、备用图、`avatars/` 头像，均不进 buyai_notes；
- Markdown 里图片引用一律写 `images/xxx.webp`（与 xbplan blocks 的 image src 前缀一致，转 post JSON 时路径可直接复用）；
- 出完图跑 `python scripts/jpg2webp.py <目录>/images` 压成 webp（体积约省 87%），文章只引用 `.webp`；
- 头像素材：`python scripts/faces.py <输出目录>` 从设定图裁六个圆形头像（网站、视频、文章作者栏共用）。

## 别碰的红线

- **水印保留**：API 水印"AI生成"是 2025-09 起的 AI 内容标识要求，脚本已默认开启，别裁掉、别关；发布时平台里仍要勾选 AI 生成声明。
- **密钥不外露**：Seedream 密钥在 volc-image-gen 目录里，别打印到对话、别写进其他文件、别提交或外发。本 skill 不读取、不打印密钥。
- **人物跨项目统一**：设定图与外貌词和 xbplan-illustrator 保持逐字一致。若那边重出了设定图，把新图复制过来覆盖 `assets/character-sheet.jpg`，两边同步，别在这边单独重出（会出现两个版本的爸爸）。
- 提示词里不写孩子真名，只用角色（男孩 / 女孩）。
