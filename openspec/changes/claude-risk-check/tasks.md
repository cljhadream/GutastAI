# Implementation Tasks

## 1. Setup (R30)

- [ ] 1.1 Add `.dev.vars` and `.wrangler/` to `.gitignore`
- [ ] 1.2 Change `tsconfig.json` `include` to `["src", "functions"]` so `npm run build` type-checks the API

## 2. Backend API (R23–R27)

- [ ] 2.1 Create `functions/api/ip/[ip].ts` with one `onRequest` handler: non-GET → 405; IPv4 / IPv6 validation and private / reserved range rejection → 400
- [ ] 2.2 Call ipapi.is (keyed when `IPAPI_KEY` is set, keyless otherwise) with a 5 s timeout; map both response shapes to the R24 schema; `is_bogon` → 400; upstream failure → 502
- [ ] 2.3 Derive `type` and compute `score` with the weights from design §Scoring (constants at the top of the file)
- [ ] 2.4 Edge cache successful lookups for 24 h via `caches.open('ip-lookup')`; browser `max-age=3600`; errors `no-store`; no CORS headers
- [ ] 2.5 Verify under `npm run build && npx wrangler pages dev dist`: `/api/ip/8.8.8.8` → 200 with geo; `/api/ip/10.0.0.1`, `/api/ip/abc`, `/api/ip/::1` → 400; POST → 405; a repeated call is served from cache; with `IPAPI_KEY` in `.dev.vars` the response includes `risk` and `score`

## 3. Detection module (R6–R11, R14–R22)

- [ ] 3.1 Generate `src/pages/claude-risk-check/supportedRegions.ts` from `https://www.anthropic.com/legal/supported-regions` (ISO-2 allowlist, source URL + retrieval date in a comment); confirm CN, HK, MO, RU, BY, IR, KP, SY, CU, VE are absent and US, JP, SG, TW are present
- [ ] 3.2 Write `src/pages/claude-risk-check/detect.ts`: trace fetch / parse, domestic IP (`my.ip.cn` → ip138), warm-connection timing, status summary, WebRTC candidates with `isPublicIp`, environment info, history helpers, `maskIp`
- [ ] 3.3 Skip all detection when `navigator.webdriver` is `true` (prerender guard)

## 4. Page (R1, R2, R5, R10–R22)

- [ ] 4.1 Create `claude-risk-check/index.html` (meta, canonical, OG / Twitter, JSON-LD `@graph`) and `src/pages/claude-risk-check/main.tsx`
- [ ] 4.2 Create `ClaudeRiskCheckPage.tsx`: hero + hide-IP toggle, three exit-IP cards + route note, risk card, connectivity card, WebRTC card, environment card, history, "检测原理" section, FAQ, WeChat CTA; light / dark themes; single column on mobile
- [ ] 4.3 Make the `FAQPage` JSON-LD mirror the visible FAQ verbatim

## 5. Site integration (R2–R4)

- [ ] 5.1 `vite.config.ts`: add `claude-risk-check` to `rollupOptions.input`, `landingPageIndexes([...])` and the prerender `routes`
- [ ] 5.2 `src/shared/AppShell.tsx`: add `'claude-risk-check'` to `PageId` and the "Claude IP 检测" entry to `NAV_LINKS` (additive lines only; the file has uncommitted owner edits)
- [ ] 5.3 `public/sitemap.xml`: add `https://www.gutast.com/claude-risk-check` with `lastmod`

## 6. Verification (R3, R6–R22, NFR)

- [ ] 6.1 `npm run build` passes (tsc incl. `functions/`, vite build, prerender)
- [ ] 6.2 `dist/claude-risk-check/index.html` contains the H1, the "检测原理" text and the FAQ, and no IPv4 / IPv6 address
- [ ] 6.3 Under `wrangler pages dev`, open the page in a browser: every card ends in a result or an explicit failure state, no console errors; check light / dark and a mobile width
- [ ] 6.4 Failure paths: without `IPAPI_KEY` the risk card shows "暂无数据" while other cards work; with a blocked third-party endpoint only that card shows "获取失败"
- [ ] 6.5 Header / footer show the new link (active on the page); the other landing pages still build and render unchanged

## 7. Docs & privacy (R28, R29)

- [ ] 7.1 Add the IP check section to `public/privacy-policy.html` (owner reviews the wording)
- [ ] 7.2 Update `doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md`: `IPAPI_KEY` secret (production + `.dev.vars`), WAF rate-limit rule for `/api/ip/*`, local test command, post-deploy checks
- [ ] 7.3 (Owner, at deploy) Register the ipapi.is account and set `IPAPI_KEY`; create the WAF rule; deploy; run the post-deploy checks; submit the new URL to Google Search Console and 百度搜索资源平台
