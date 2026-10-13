# Technical Design

## Architecture

Static-first single page: keep React for interactivity, but guarantee
crawler-visible content in the shipped HTML.

### Chosen approach: build-time prerendering

Use `@prerenderer/rollup-plugin` (Vite-compatible; maintained fork of
`vite-plugin-prerender`) to snapshot the rendered DOM of `/` into
`dist/index.html` during `vite build`.

- No framework migration; the HTML a crawler sees equals exactly what React
  renders (no content drift between a hand-written mirror and the app).
- Build pipeline stays `tsc && vite build`; the plugin hooks into the Vite
  build lifecycle (no ordering change needed).
- Puppeter is required by the plugin at build time only — it never ships to
  production.

Fallback (zero-dependency alternative, only if the build environment cannot
run a headless browser): hand-maintain a static semantic HTML mirror inside
`<div id="root">` (H1, sections, pricing, FAQ). React's `createRoot().render()`
replaces it on mount. Rejected as first choice because of content-drift risk.

## New files

| File | Purpose |
| :--- | :--- |
| `public/robots.txt` | `User-agent: *` / `Allow: /` / `Sitemap: https://www.gutast.com/sitemap.xml` |
| `public/sitemap.xml` | Single `<url>` entry for `https://www.gutast.com/` with `lastmod` |
| `public/UI/og-cover.png` | 1200x630 branded share cover (dark-space bg + ignition-orange gradient + logo + headline "ChatGPT/Codex 官方代充 ¥145 起 · Claude Code 直连 ¥11 起") |
| `public/UI/apple-touch-icon.png` | 180x180 PNG icon for iOS |
| `public/favicon.ico` or `public/UI/favicon.png` | Fallback icon for browsers without webp favicon support |

## JSON-LD structured data

Single `<script type="application/ld+json">` with `@graph`:

- `Organization`: name "Gutast AI", url `https://www.gutast.com/`,
  logo `https://www.gutast.com/UI/logo/300_300.webp`.
- `WebSite`: name, url, `inLanguage: "zh-CN"`.
- `Product` "ChatGPT Plus / Codex 官方代充（Gutast AI）" with
  `brand: Organization` and three `Offer`s:
  - Codex Plus — price 145, CNY;
  - Codex Pro 5X — price 680, CNY;
  - Codex Pro 20X — price 1280, CNY;
  each with `availability: https://schema.org/InStock` and
  `url: https://www.gutast.com/#chatgpt-section`.
- `FAQPage`: `mainEntity` mirrors the visible FAQ items from R7 (kept in sync
  manually; sync check is an explicit task).

Notes:
- No `Review` / `AggregateRating` markup (the "1,665 customers" figure is not
  a verifiable review source; fake-review markup risks manual actions).
- `keywords` meta is kept as-is (harmless; Google ignores it, some Chinese
  engines still read it).

## H1 & FAQ content design

- Current visual: eyebrow trust badge → H1 (two lines) → subtitle.
- New semantic order (same visual design via CSS): keep the existing two-line
  tagline as a `<p>` / styled div, then render the real `<h1>` as:
  `ChatGPT Plus / Codex 官方代充 · Claude Code 终端直连 — Gutast AI`
  (font-size tuned so visual weight stays close to current; the tagline keeps
  its gradient-text treatment).
- FAQ section (`id="faq-section"`, anchor added to header/footer nav):
  5–6 semantic `<h3>` questions + `<p>` answers, content sourced from the PRD
  trust framework:
  1. 代充安全吗？会不会封号？ (official channel vs black-card risk)
  2. 办理需要提供账号密码吗？ (no password required)
  3. 付款后多久到账？ (usually minutes)
  4. 可以开发票吗？ (invoice supported)
  5. 到期后可以续费吗？ (renewal supported, full-cycle guarantee)
  6. Claude Code 七档套餐怎么选？ (¥11 起，按天/周/月)

## Video loading strategy

```html
<video src="..." poster="/UI/video-poster.webp" preload="metadata"
       autoPlay loop muted playsInline ...>
```

- `poster` gives instant paint of the first frame (new asset, exported still
  of the video, ~40 KB webp).
- `preload="metadata"` prevents full download before interaction; autoplay
  still starts playback per current UX.
- The hero text block remains the LCP element (verified via Lighthouse).

## Metadata additions (`index.html`)

- `<meta name="robots" content="index, follow">`
- `og:site_name` = "Gutast AI"; `og:locale` = "zh_CN"
- `og:image:width` = 1200; `og:image:height` = 630; `og:image:alt`
- `<link rel="apple-touch-icon" href="/UI/apple-touch-icon.png">`
- `<link rel="icon" type="image/png" ...>` fallback alongside the webp icon
- `<meta name="theme-color" media="(prefers-color-scheme: light)" ...>` and
  dark equivalent

## Data Model

No application data changes. Plan prices stay single-sourced in
`src/App.tsx` (`CHATGPT_PLANS`); the JSON-LD offers are authored in
`index.html` and must be updated if prices change (release checklist item).
FAQ answers live once in the React FAQ section and are mirrored into JSON-LD.

## API Changes

None.

## Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| Prerender plugin needs a headless browser in CI | Document Node/Puppeteer requirement in the deployment guide; fallback to static mirror block if CI cannot run it |
| JSON-LD FAQ drifting from visible FAQ | Explicit sync task in `tasks.md`; FAQ content authored once and copy-pasted |
| Price changes not propagated to JSON-LD | Release checklist: update `CHATGPT_PLANS` + JSON-LD together |
| Non-www host serves duplicate content | Canonical already set; hosting 301 documented in R10 (outside this change set) |
