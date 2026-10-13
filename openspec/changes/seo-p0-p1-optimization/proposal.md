# Proposal: SEO P0/P1 Optimization for gutast.com

## Context

`gutast.com` is a single-page React (Vite CSR) landing page that sells
ChatGPT Plus / Codex recharge and Claude Code direct-connection services to
Chinese developers (pricing in CNY, conversion via WeChat Work QR code).

The current `index.html` already has reasonable basics (title, meta
description, keywords, canonical, Open Graph, Twitter card). However, the SEO
audit found the following gaps:

### P0 — Blocking / severe

| # | Issue | Impact |
| :-- | :--- | :--- |
| P0-1 | Pure client-side rendering: crawlers that do not execute JS (Baiduspider, many AI crawlers, social scrapers) see an empty `<div id="root">`. All commercial content (H1, pricing, comparison, steps) is invisible. | Fatal for Baidu, where the target audience searches. Weakens Google indexing confidence. |
| P0-2 | No `robots.txt` and no `sitemap.xml` in `public/`. | Crawlers get no guidance; sitemap cannot be submitted to Search Console / Baidu Ziyuan. |
| P0-3 | No structured data (JSON-LD): no Organization, WebSite, Product/Offer, FAQPage. | No rich-result eligibility; price/brand not machine-readable. |
| P0-4 | `og:image` / `twitter:image` point to a 300x300 logo while `twitter:card` declares `summary_large_image`. | Broken/ugly share cards on Slack, Telegram, X, Discord. |

### P1 — Significant

| # | Issue | Impact |
| :-- | :--- | :--- |
| P1-1 | H1 ("原生算力不卡脖子 / 官方定价 · 3分钟点火直充") contains none of the core commercial keywords that exist in `<title>`. | Weakens on-page keyword relevance for "ChatGPT 代充 / Claude Code 直连". |
| P1-2 | No FAQ content block. | Misses long-tail queries ("ChatGPT Plus 代充安全吗", "代充需要密码吗", "可以开发票吗"). |
| P1-3 | Autoplay video with no `poster`, no `preload` hint. | LCP/performance risk on slow networks; the video is the largest above-the-fold asset. |
| P1-4 | Metadata gaps: no `meta robots`, `og:site_name`, `og:locale`; favicon is webp-only (no `apple-touch-icon`, no PNG/ICO fallback); no `theme-color`. | Incomplete indexing directives, iOS home-screen icon missing, favicon invisible in some browsers, browser chrome color mismatch. |

## Goals

- Make 100% of landing-page content crawlable without JS execution (Google, Bing, Baidu, AI crawlers).
- Ship crawler guidance: `robots.txt` + `sitemap.xml`.
- Add rich-result-eligible structured data (Organization, WebSite, Product + Offers, FAQPage).
- Fix social share preview with a proper 1200x630 OG cover image.
- Embed core commercial keywords into the visible H1 without breaking the current visual design.
- Add a keyword-rich FAQ section covering trust/objection long-tail queries.
- Remove the video from the LCP path (poster + preload strategy).
- Complete metadata: robots directives, OG completeness, icons, theme-color.

## Non-Goals

- No multi-page routing and no new URLs (site stays a single page).
- No framework migration (no Next.js / SSR rewrite).
- No hreflang / i18n (site is zh-CN only for now).
- No off-page SEO work (backlinks, external campaigns).
- No hosting/DNS changes in this change set (www 301 redirect is documented as a deployment note only).
