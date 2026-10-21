# Technical Design: Claude IP Risk Check Page

## Architecture Overview

A static landing page (same Vite MPA + build-time prerender pipeline as the
other pages) plus one Cloudflare Pages Function. Almost every check runs in
the visitor's browser; the backend only enriches the Claude exit IP.

```
Browser: www.gutast.com/claude-risk-check
 ├─ https://claude.ai/cdn-cgi/trace ............ Claude exit IP + loc (same proxy rule as Claude)
 ├─ https://api.anthropic.com/cdn-cgi/trace .... reachability + exit consistency (Claude Code host)
 ├─ https://1.1.1.1/cdn-cgi/trace .............. Cloudflare default exit IP + loc
 ├─ https://my.ip.cn/ (→ 2026.ip138.com) ....... domestic direct exit IP + 归属地
 ├─ https://status.claude.com/api/v2/summary.json  official status
 ├─ STUN stun.l.google.com / stun.cloudflare.com  WebRTC candidate IPs
 └─ /api/ip/<Claude exit IP> ── Pages Function ──► https://api.ipapi.is/?q=<ip>&key=<IPAPI_KEY>
                                     └─ Cache API, 24 h per IP
```

Why each source works: all `/cdn-cgi/trace` endpoints, `my.ip.cn`, ip138 and
the Statuspage JSON return `Access-Control-Allow-Origin: *` (verified
2026-10-21), so the page can read them cross-origin. A request to `claude.ai`
matches the visitor's proxy rules exactly like real Claude traffic, so its
trace shows the exit Claude sees. `1.1.1.1` is an IP literal (domain rules
cannot match it) and shows the default route. `my.ip.cn` is a mainland site
that split rules usually send direct, so it shows the real domestic IP.

## Component Changes

### New files

| File | Purpose |
| :--- | :--- |
| `claude-risk-check/index.html` | Page template: title, description, canonical, OG/Twitter, JSON-LD `@graph` (`Organization`, `WebApplication`, `BreadcrumbList`, `FAQPage`); mounts `main.tsx`. Same structure as `faq/index.html` |
| `src/pages/claude-risk-check/main.tsx` | Entry: `mountPage(ClaudeRiskCheckPage)` |
| `src/pages/claude-risk-check/ClaudeRiskCheckPage.tsx` | UI inside `AppShell`: hero, cards, explanation, FAQ, CTA. Starts the checks in one `useEffect` and renders results progressively |
| `src/pages/claude-risk-check/detect.ts` | Browser-side checks as plain async functions (no React): traces, domestic IP, timing, status, WebRTC, environment, history, IP masking |
| `src/pages/claude-risk-check/supportedRegions.ts` | ISO 3166-1 alpha-2 allowlist from Anthropic's supported-regions page, with source URL and retrieval date |
| `functions/api/ip/[ip].ts` | Pages Function `GET /api/ip/:ip` |

### Modified files

| File | Change |
| :--- | :--- |
| `vite.config.ts` | Register `claude-risk-check` in `rollupOptions.input`, `landingPageIndexes([...])` and the prerender `routes` |
| `src/shared/AppShell.tsx` | Add `'claude-risk-check'` to `PageId`; add `{ href: '/claude-risk-check', label: 'Claude IP 检测' }` to `NAV_LINKS`. The file has uncommitted owner edits: additive lines only |
| `public/sitemap.xml` | Add the page with `lastmod` = ship date |
| `tsconfig.json` | `include: ["src", "functions"]` so `npm run build` type-checks the function (it uses only standard Web APIs covered by the DOM lib) |
| `.gitignore` | Add `.dev.vars` (local secret) and `.wrangler/` (local dev state); neither is ignored today |
| `public/privacy-policy.html` | New section on the IP check tool (R28). Wording reviewed by the owner |
| `doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md` | Secret setup, WAF rule, local test, post-deploy checks (R29) |

No new npm dependencies.

## Browser Detection (`detect.ts`)

```ts
type Trace = { ip: string; loc: string | null };   // loc: ISO-2, upper case

fetchTrace(host: 'claude.ai' | 'api.anthropic.com' | '1.1.1.1'): Promise<Trace>
timeTrace(host: 'claude.ai' | 'api.anthropic.com'): Promise<number>   // ms, warm connection
fetchDomesticIp(): Promise<{ ip: string; location: string | null }>
fetchClaudeStatus(): Promise<'none' | 'minor' | 'major' | 'critical' | 'maintenance'>
collectWebRtcIps(): Promise<string[] | null>      // null = RTCPeerConnection unavailable
lookupIp(ip: string): Promise<IpInfo | null>      // GET /api/ip/:ip; null on any non-200
readEnvironment(): { timeZone, offsetMinutes, languages, os, browser, webglRenderer }
loadHistory() / recordHistory(ip, cc) / clearHistory()
maskIp(ip: string): string
isPublicIp(ip: string): boolean
```

- Trace body is `key=value` lines; parse into a map and read `ip` and `loc`.
- `my.ip.cn` returns plain text `ip：<IP> 归属地：<text>`; take the IP and the
  text after `归属地：`. ip138 fallback: first IPv4 in the HTML (the page title
  is `您的IP地址是：<IP>`).
- `timeTrace` issues a second trace request after `fetchTrace` resolved, so the
  measured time is roughly one round trip to the Cloudflare edge instead of
  DNS + TCP + TLS setup.
- WebRTC: one `RTCPeerConnection` with both STUN servers and an empty data
  channel; read addresses from `onicecandidate` for ≤ 5 s; keep
  `isPublicIp` addresses (mDNS `.local` names are skipped).
- Every network call uses `AbortSignal.timeout` (8 s for traces and echo
  sites, 5 s for status) and `cache: 'no-store'` for traces.
- Country names in Chinese come from
  `new Intl.DisplayNames(['zh-CN'], { type: 'region' })`; no lookup tables.

Prerender guard: the page skips all detection when `navigator.webdriver` is
`true` (set by Puppeteer during `vite build`), so the snapshot contains only
static content and "检测中…" placeholders. `AppShell` already dispatches
`render-event` on mount, so the prerender timing is unchanged.

Ordering: the Claude trace, Cloudflare trace, domestic IP, status and WebRTC
start in parallel. The API lookup, region check, timing and the exit/leak
comparisons start once the IPs they depend on resolve.

## API: `functions/api/ip/[ip].ts`

- One `onRequest` handler: non-GET → 405. Typed with a local context
  interface (`{ request, env, params, waitUntil }`); no
  `@cloudflare/workers-types` dependency. Uses `fetch`, `Request`,
  `Response`, `URL` and `caches.open()` only.
- Validation, before any upstream call:
  - IPv4: dotted quad, octets 0–255, no leading zeros.
  - IPv6: parsed with `new URL('http://[' + ip + ']')` (throws when invalid);
    the normalised hostname becomes the cache key and the upstream query.
  - Rejected ranges: IPv4 `0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`,
    `172.16/12`, `192.0.0/24`, `192.0.2/24`, `192.168/16`, `198.18/15`,
    `198.51.100/24`, `203.0.113/24`, `224/4`, `240/4`; IPv6 `::`, `::1`,
    `::ffff:0:0/96`, `fc00::/7`, `fe80::/10`, `ff00::/8`, `2001:db8::/32`.
  - Upstream `is_bogon: true` → 400 as a backstop.
- Upstream: `GET https://api.ipapi.is/?q=<ip>` plus `&key=<IPAPI_KEY>` when the
  secret is set; `AbortSignal.timeout(5000)`.
- Response mapping:

| Field | Keyed response | Keyless response |
| :--- | :--- | :--- |
| `countryCode` | `location.country_code` | `null` |
| `country` | `location.country` | `country` |
| `region` | `location.state` | `region` |
| `city` | `location.city` | `city` |
| `timezone` | `location.timezone` | `timezone` |
| `asn` | `asn.asn` | number parsed from `"AS15169 Google LLC"` |
| `org` | `asn.org ?? company.name` | `company` (a string in keyless mode) |
| `type` | `datacenter` if `is_datacenter`; `mobile` if `is_mobile`; `residential` if `company.type === 'isp'`; else `other` | `unknown` |
| `risk` | `{ datacenter: is_datacenter, vpn: is_vpn, proxy: is_proxy, tor: is_tor, abuser: is_abuser, crawler: is_crawler !== false }` | `null` |
| `score` | see Scoring | `null` |

- Caching: `caches.open('ip-lookup')`, key `new URL('/api/ip/' + normalisedIp, request.url)`.
  The stored entry carries `Cache-Control: public, max-age=86400` (24 h TTL).
  The browser response is rebuilt from the cached body with
  `Cache-Control: public, max-age=3600`. Writes use `waitUntil`. Errors are
  never cached and carry `Cache-Control: no-store`. The Cache API is per data
  center: worst case one upstream lookup per IP per colo per day.
- No CORS headers, no logging of queried IPs, the key never leaves `env`.

## Scoring

```
score = 100
if tor: score = 0
else:
  if datacenter: score -= 40
  if vpn:        score -= 25
  if proxy:      score -= 25
  if abuser:     score -= 15
  if crawler:    score -= 10
score = clamp(score, 0, 100)
```

Examples: clean residential 100; datacenter only 60 (中风险); datacenter + VPN
35 (高风险); datacenter + VPN + abuse 20.

The unsupported-region override (score → 0) is applied in the page, not the
API, because it uses the trace `loc` (the country Claude's edge assigns)
rather than ipapi.is geolocation. Weights are constants at the top of the
function file so the owner can tune them.

## Supported Regions

`supportedRegions.ts` exports `SUPPORTED_REGIONS: ReadonlySet<string>`. The
official page (`https://www.anthropic.com/legal/supported-regions`) listed 187
countries and regions on 2026-10-21. Mainland China, Hong Kong, Macau,
Russia, Belarus, Iran, North Korea, Syria, Cuba and Venezuela are not on it.
At implementation the English names are converted to ISO codes once (reverse
lookup through `Intl.DisplayNames('en', { type: 'region' })`, then manual
fixes for unmatched names); the resulting list is reviewed in the diff. A
code comment records the source URL and retrieval date.

## Page Layout (UI)

1. Hero: H1 "Claude IP 风险检测", one-line explanation, "隐藏 IP" toggle.
2. Three exit-IP cards (国内直连出口 / Cloudflare 默认出口 / Claude 出口) and
   the route note (R10).
3. Risk card: score + label + estimate note, region status, region/city,
   IP type, ASN/org, five flags.
4. Connectivity card: claude.ai and api.anthropic.com latency, exit
   consistency note, official status.
5. WebRTC leak card.
6. Environment card: time zone, language, OS / browser, WebGL renderer.
7. History list with "清除".
8. "检测原理" section (static, prerendered): one short paragraph per check.
9. FAQ (static, mirrored in JSON-LD).
10. CTA: shared WeChat modal ("办理前先测一测" style copy).

Styling reuses the existing tokens and card patterns (`rounded-2xl border
border-hyper-lightBorder bg-hyper-lightCard … dark:border-hyper-darkBorder
dark:bg-hyper-darkCard`), as in `FaqPage.tsx`. Single column below `md`.

Draft copy (owner may edit):

- Title: `Claude IP 检测 - 出口 IP 风险与纯净度检测｜Gutast AI`
- Description: `免费检测访问 Claude 的出口 IP：是否在支持地区、机房或家庭宽带、VPN/代理/Tor 风险与 WebRTC 泄露，无需登录。`
- FAQ:
  1. 检测的是哪个 IP？— 浏览器访问 claude.ai 时实际使用的出口 IP。走代理时是代理节点的 IP，直连时是本机宽带的公网 IP。
  2. 为什么会显示三个不同的 IP？— 代理软件通常按规则分流：国内网站直连、Claude 走代理。三个 IP 分别对应国内直连、Cloudflare 默认线路和 Claude 线路。
  3. 风险评分准吗？— 评分根据第三方 IP 情报（机房、VPN、代理、Tor、滥用记录）估算，仅供参考；Claude 的实际风控规则不公开。
  4. 检测会记录我的 IP 吗？— 只有 Claude 出口 IP 会发送到本站接口查询 IP 情报，查询结果缓存 24 小时、不做其他保存；国内 IP 不会发送到本站，历史记录只保存在你的浏览器里。
  5. Claude Code 也走这个出口吗？— 不一定。本页测的是浏览器的线路；Claude Code 命令行默认不读系统代理，需要设置 `HTTPS_PROXY` 或使用 TUN 模式才会走同一出口。

## Data Model

- `localStorage["gutast-claude-ip-history"]`:
  `Array<{ ip: string; cc: string | null; t: string }>` (ISO time), newest
  first, max 6 entries.
- Edge cache: per-IP API JSON, 24 h.
- No database, no server-side persistence.

## API / Interface Changes

```
GET /api/ip/{ip}

200 {"ip":"8.8.8.8","countryCode":"US","country":"United States","region":"California",
     "city":"Mountain View","timezone":"America/Los_Angeles","asn":15169,"org":"Google LLC",
     "type":"datacenter","risk":{"datacenter":true,"vpn":false,"proxy":false,"tor":false,
     "abuser":false,"crawler":false},"score":60}
400 {"error":"invalid_ip"}
405 {"error":"method_not_allowed"}
502 {"error":"upstream_unavailable"}
```

Configuration: Pages secret `IPAPI_KEY` (production); `.dev.vars` with
`IPAPI_KEY=...` for local `wrangler pages dev`.

## Local Development & Verification

- `npm run dev` (Vite) does not run Pages Functions: the page works, the
  `/api/ip` call fails and the risk card shows "暂无数据".
- Full stack: `npm run build && npx wrangler pages dev dist` serves `dist/` and
  compiles `functions/` on port 8788, reading secrets from `.dev.vars`.
- The repo has no test framework; verification uses the build, curl against
  `wrangler pages dev`, a grep of the prerendered HTML, and a browser pass
  (tasks §6).

## Risks & Trade-offs

| Risk | Mitigation |
| :--- | :--- |
| Third-party endpoints change (trace CORS, `my.ip.cn` format, ip138's year-based host `2026.ip138.com`) | Each check isolated with its own timeout; failure shows "获取失败"; endpoint URLs kept as constants in `detect.ts` |
| ipapi.is quota (1,000/day) exhausted | Only the Claude exit IP is looked up; 24 h edge cache; 502 → "暂无数据"; paid plan if traffic grows |
| Others use our API as a free ipapi.is proxy | No CORS headers, strict validation, WAF rate limit (e.g. 10 requests / 10 s per client IP), cache |
| Visitors read the score as Claude's verdict | "估算" label, FAQ answer, no guarantee wording |
| Supported-region list drifts | Source URL + retrieval date in code; re-check when Anthropic updates the page |
| Prerender snapshot captures the build machine's IP | `navigator.webdriver` guard; verification greps the built HTML for IP addresses |
| Browser route ≠ Claude Code CLI route | FAQ 5; the api.anthropic.com trace shows the browser-side route to the API host |
| Latency measures the path to Cloudflare's edge, not Anthropic's origin | Labelled "连接延迟"; no claims about model response speed |
| Automation users (`navigator.webdriver`) get no results | Acceptable; placeholders explain that detection runs in a normal browser |
| `src/shared/AppShell.tsx` has uncommitted owner edits | Additive two-line change; owner commits it separately |
