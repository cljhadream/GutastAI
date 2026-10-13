# Gutast AI (gutast.com) 部署指南

**文档状态：** 已实施 V1.0（SEO P0/P1 优化：构建时预渲染、robots/sitemap、JSON-LD、社交分享图、FAQ）
**更新日期：** 2026年10月12日
**部署目标：** https://www.gutast.com/
**关联变更集：** `openspec/changes/seo-p0-p1-optimization/`

## 1. 构建与预渲染

本项目为 React 18 + Vite 5 CSR 单页应用，通过 `@prerenderer/rollup-plugin` + Puppeteer 在**构建时**将 `/` 的完整渲染 DOM 快照进 `dist/index.html`，爬虫无需执行 JavaScript 即可抓取 H1、定价（¥145 / ¥680 / ¥1280）、对比表、3 步流程、FAQ 与 footer。

```bash
npm ci
npm run build    # tsc && vite build（预渲染已内置于 vite build 生命周期）
```

- 渲染完成信号：`src/App.tsx` 首次 commit 后 `document.dispatchEvent(new Event('render-event'))`，`vite.config.ts` 的 `rendererOptions.renderAfterDocumentEvent` 监听同一事件。
- 构建后自检（无 JS 内容断言）：

```bash
node -e "const s=require('fs').readFileSync('dist/index.html','utf8'); console.log(['官方代充','¥145','faq-section','极简 3 步交付流程'].every(k=>s.includes(k)))"
```

输出应为 `true`（长度约 35 kB，若为 CSR 空壳则仅 ~2 kB）。

### 1.1 构建环境要求（CI）

- Node 18+；Puppeteer 构建期需要可运行的**无头 Chromium**（`npm ci` 时自动下载到 `~/.cache/puppeteer`，仅 dev 依赖，不进生产产物）。
- Linux CI（如 GitHub Actions ubuntu-latest）需安装 Chromium 系统依赖，或在 job 中使用 `puppeteer browsers install chrome` 前置步骤；Windows 本地构建无需额外配置。
- 若构建环境**无法运行无头浏览器**（部分受限 CI）：预渲染会失败。备选方案为在 `<div id="root">` 内手写静态语义镜像（React mount 后替换），但存在内容漂移风险，仅作应急。

## 2. 域名与 301 重定向（R10）

- **canonical 域名为 `https://www.gutast.com/`**（index.html、sitemap.xml、JSON-LD、og:url 全部使用 www 主机）。
- 托管层必须配置：**裸域 `gutast.com` → `https://www.gutast.com/` 301 永久重定向**，避免双主机重复内容稀释权重。若托管于 Vercel/Netlify，在域名设置中将 apex domain 重定向到 www（Vercel: Domains → Redirect to www.gutast.com，选择 308/301 Permanent）。
- HTTP → HTTPS 301 亦为必须项。
- 验证：`curl -sI https://gutast.com/ | grep -i location` 应返回 `https://www.gutast.com/`。

## 3. JSON-LD 价格同步（发布检查清单）

结构化数据中的价格**手工维护在 `index.html`** 的 `<script type="application/ld+json">`（Product.offers），与 `src/App.tsx` 的 `CHATGPT_PLANS` 是两个来源：

| Offer | 价格（CNY） |
| --- | --- |
| Codex Plus | 145 |
| Codex Pro 5X | 680 |
| Codex Pro 20X | 1280 |

**改价时必须同步两处**：`src/App.tsx` `CHATGPT_PLANS` + `index.html` JSON-LD offers，并检查首屏价格锚点文案与 og-cover.png 上的价格角标是否过期。
**FAQ 同步**：`src/App.tsx` `FAQ_ITEMS` 与 `index.html` FAQPage.mainEntity 需逐字镜像（当前 6 条已同步）。
改完后本地校验 JSON-LD 语法：构建后在 `dist/index.html` 提取 `application/ld+json` 用任意 JSON parser 验证，或部署后用 Google Rich Results Test / Schema Markup Validator 在线复检。

## 4. 部署后验证清单

1. **爬虫可见性**：`curl -s https://www.gutast.com/ | grep -c "官方代充"` ≥ 1（0 = CSR 空壳上线，检查构建日志中预渲染是否被跳过）。
2. **robots.txt 可达**：`https://www.gutast.com/robots.txt` 返回 200，含 `Sitemap: https://www.gutast.com/sitemap.xml`。
3. **sitemap.xml 可达**：`https://www.gutast.com/sitemap.xml` 返回 200。
4. **搜索引擎提交**：Google Search Console 提交 sitemap；百度搜索资源平台提交链接（可配合 API/手动推送）。
5. **Lighthouse SEO 审计**：目标 ≥ 95；同时确认 LCP 元素为首屏文字块而非视频（已通过 video `poster` + `preload="metadata"` 将视频移出 LCP 路径）。
6. **分享卡片预览**：Slack / Telegram / X 贴链接，确认 1200x630 og-cover.png 与标题正常展示（分享缓存可用各平台 Post Inspector / Card Validator 刷新）。

## 5. 静态资产索引

| 文件 | 规格 | 用途 |
| --- | --- | --- |
| `public/UI/og-cover.png` | 1200x630 | og:image / twitter:image 分享封面 |
| `public/UI/video-poster.webp` | 1280x720 | 首屏视频封面（LCP 优化，WebP ~16 KB） |
| `public/UI/apple-touch-icon.png` | 180x180 | iOS 桌面图标 |
| `public/UI/favicon-48.png` | 48x48 | PNG favicon 回退（webp 之外的浏览器） |
| `public/robots.txt` / `public/sitemap.xml` | — | 爬虫指引；lastmod 随内容更新手动维护 |
