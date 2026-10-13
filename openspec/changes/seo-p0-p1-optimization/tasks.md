# Implementation Tasks

## 1. P0: Crawlable content (R1)

- [x] 1.1 Install `@prerenderer/rollup-plugin` + `puppeteer` (dev deps) and wire it into `vite.config.ts` to prerender `/`
- [x] 1.2 Build and verify `dist/index.html` contains H1, pricing (¥145/¥680/¥1280), comparison table, 3-step flow and footer without JS
- [ ] 1.3 (Only if 1.1 is blocked in the build environment) Add a hand-maintained static semantic mirror inside `<div id="root">` — not needed: prerendering works; fallback documented in the deployment guide

## 2. P0: Crawler guidance (R2, R3)

- [x] 2.1 Create `public/robots.txt` (allow all + sitemap reference)
- [x] 2.2 Create `public/sitemap.xml` (single URL entry + lastmod)

## 3. P0: Structured data (R4)

- [x] 3.1 Add JSON-LD `@graph` with `Organization` and `WebSite` to `index.html`
- [x] 3.2 Add `Product` with three `Offer`s (¥145 / ¥680 / ¥1280, CNY, InStock)
- [x] 3.3 Add `FAQPage` (after task 5.1, mirroring the visible FAQ)

## 4. P0: Social sharing (R5)

- [x] 4.1 Generate `public/UI/og-cover.png` (1200x630, branded cover) and a `video-poster.webp` still — delivered as `video-poster.png` (1280x720) to match the video poster usage
- [x] 4.2 Update `og:image` / `twitter:image` to the new cover; add `og:image:width/height/alt`

## 5. P1: Content & keywords (R6, R7)

- [x] 5.1 Add FAQ section (5–6 Q&As, semantic `h3` + `p`) above the footer; add "常见问题" anchor to header + footer nav
- [x] 5.2 Rework the semantic H1 to include core keywords ("ChatGPT Plus / Codex 官方代充 · Claude Code 终端直连"), keeping the current tagline visually via CSS order

## 6. P1: Metadata & icons (R9)

- [x] 6.1 Add `meta robots`, `og:site_name`, `og:locale`, `theme-color` (light/dark)
- [x] 6.2 Add `apple-touch-icon` (180x180 PNG) + PNG/ICO favicon fallback

## 7. P1: Performance (R8)

- [x] 7.1 Add `poster` + `preload="metadata"` to the hero video; confirm LCP element is the hero text — LCP confirmation via Lighthouse deferred to post-deploy (task 8.4)

## 8. Verification (R1–R10)

- [x] 8.1 Fetch built `index.html` without JS: assert title, description, H1 keywords, prices and FAQ are present — verified against `dist/index.html` (H1 keywords, ¥145/¥680/¥1280, 3-step flow, FAQ, footer, JSON-LD, poster all present)
- [ ] 8.2 Validate JSON-LD with Schema Markup Validator / Google Rich Results Test — local parse check passed (4 graph nodes, 3 offers, 6 questions); online validator run deferred to post-deploy
- [ ] 8.3 Verify `robots.txt` and `sitemap.xml` are reachable after deploy; submit sitemap to Google Search Console + 百度搜索资源平台
- [ ] 8.4 Run Lighthouse SEO audit (target ≥ 95) and mobile share-link preview check (Slack/Telegram/X)
- [x] 8.5 Document the www 301 redirect requirement and JSON-LD price-sync note in `doc/TECH/Xbplan_Web_DEPLOYMENT_GUIDE.md` — that file belongs to the Xbplan project; documented in `doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md` instead (includes prerender CI requirements + post-deploy checklist)
