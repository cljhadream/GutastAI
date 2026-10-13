# Requirements

## P0 — Crawlability & Indexing

- [ ] R1: All commercial content (H1, section headings, pricing cards with prices
      ¥145 / ¥680 / ¥1280, Claude Code block, comparison table, 3-step flow,
      FAQ, footer) must exist as static HTML inside `index.html` at build time,
      so crawlers without JavaScript see the complete page.
- [ ] R2: `public/robots.txt` must exist: allow all user agents (explicitly
      harmless for Baiduspider/Googlebot), reference the sitemap URL
      `https://www.gutast.com/sitemap.xml`.
- [ ] R3: `public/sitemap.xml` must exist and list `https://www.gutast.com/`
      with `lastmod`, `changefreq` and `priority`.
- [ ] R4: JSON-LD structured data must be embedded in `index.html` as a single
      `@graph` containing:
  - `Organization` (name: Gutast AI, url, logo);
  - `WebSite` (name, url, inLanguage: zh-CN);
  - `Product` "ChatGPT Plus / Codex 代充" with three `Offer`s
    (¥145, ¥680, ¥1280, priceCurrency: CNY, availability);
  - `FAQPage` mirroring the visible FAQ block (shipped together with R7).
- [ ] R5: A dedicated social cover image `public/UI/og-cover.png` at
      1200x630 must be created and referenced by `og:image` and
      `twitter:image`, including `og:image:width`, `og:image:height`,
      `og:image:alt`.

## P1 — Keywords, Content, Performance, Metadata

- [ ] R6: The visible H1 must contain the core commercial keywords
      ("ChatGPT Plus / Codex 官方代充" and "Claude Code"), while the current
      marketing tagline is preserved visually (demoted to a styled line above
      the H1; final rendering must look equivalent to the current design).
- [ ] R7: An FAQ section with at least 5 Q&As must be added above the footer,
      targeting long-tail queries: safety ("代充安全吗"), password requirement,
      delivery time, invoice support, renewal policy, Claude Code tier
      selection. Questions/answers must be real visible content (not
      schema-only).
- [ ] R8: The hero video must not be the LCP element: add `poster` image and
      `preload="metadata"` (keep autoplay UX unchanged visually); the LCP
      element must remain the hero text block.
- [ ] R9: Metadata completeness in `index.html`:
  - `<meta name="robots" content="index, follow">`;
  - `og:site_name` ("Gutast AI") and `og:locale` ("zh_CN");
  - `apple-touch-icon` (180x180 PNG);
  - PNG/ICO favicon fallback in addition to the existing webp icon;
  - `theme-color` for light and dark schemes.
- [ ] R10: Canonical stays `https://www.gutast.com/`; the deployment guide must
      document a hosting-level 301 redirect from the non-www host to www
      (implementation outside this change set).

## User Scenarios

1. Baiduspider fetches `/` without executing JS and sees full title,
   description, H1 keywords, pricing and FAQ — page gets indexed.
2. A developer shares the URL in Slack/Telegram/X — the link card renders a
   branded 1200x630 cover with correct title and description.
3. Google renders the page — Product/Offer and FAQPage structured data make it
   eligible for rich results; prices are machine-readable.
4. A mobile visitor on slow 4G — hero text renders instantly and the video
   does not delay LCP.
