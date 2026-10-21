# Requirements: Claude IP Risk Check Page

## Page, SEO & Navigation

- [ ] R1: A new landing page is served at
      `https://www.gutast.com/claude-risk-check`, built like the existing
      landing pages (`claude-risk-check/index.html` +
      `src/pages/claude-risk-check/`) and rendered inside `AppShell`
      (header, footer, theme switch, WeChat modal).
- [ ] R2: The page has its own `<title>`, meta description, canonical URL,
      Open Graph / Twitter tags and a JSON-LD `@graph` with `Organization`
      (same `@id` as the other pages), `WebApplication`, `BreadcrumbList` and
      `FAQPage`. The FAQ JSON-LD mirrors the visible FAQ verbatim. The page is
      listed in `public/sitemap.xml`.
- [ ] R3: The prerendered `dist/claude-risk-check/index.html` contains the H1,
      the explanation of every check and the FAQ, and contains no IP address
      or detection result from the build machine.
- [ ] R4: Header and footer navigation contain a "Claude IP 检测" link to the
      page; the link is marked active on the page itself.
- [ ] R5: The page ends with the shared WeChat consultation CTA (opens the
      `AppShell` modal).

## Exit IP Detection (browser)

- [ ] R6: Claude exit: `GET https://claude.ai/cdn-cgi/trace`; parse `ip` and
      `loc`; show the IP with the country name (Chinese, from `loc`).
- [ ] R7: Cloudflare default exit: `GET https://1.1.1.1/cdn-cgi/trace`; parse
      `ip` and `loc`; show the IP with the country name.
- [ ] R8: Domestic direct exit: `GET https://my.ip.cn/`; parse the IP and the
      `归属地` text. On failure fall back to `GET https://2026.ip138.com/`
      (IP only).
- [ ] R9: Every source has its own timeout (≤ 8 s) and fails independently:
      a failed source shows "获取失败" and never blocks other cards.
- [ ] R10: When the Claude exit IP differs from the Cloudflare default exit
      IP, show an informational note that Claude traffic uses a separate
      route. When all three IPs are identical, note that all traffic leaves
      through one exit (global mode or no proxy).

## Risk Assessment (Claude exit IP)

- [ ] R11: Supported-region check: compare the claude.ai trace `loc` with an
      ISO 3166-1 alpha-2 allowlist taken from Anthropic's official page
      (`https://www.anthropic.com/legal/supported-regions`). Not in the list →
      red warning "当前出口不在 Claude 支持地区" and the score is forced to 0.
      `loc` missing → region status "未知".
- [ ] R12: The page calls `GET /api/ip/<claude exit IP>` and shows region and
      city, IP type (家庭宽带 / 机房 IP / 移动网络 / 其他 / 未知), ASN and
      organisation, and the flags VPN / 代理 / Tor / 滥用记录 / 爬虫, each as
      是 / 否 / 未知.
- [ ] R13: The risk score (0–100, computed by the API) is shown with a label:
      ≥ 80 "低风险", 50–79 "中风险", < 50 "高风险", and the note
      "估算值，仅供参考，以 Claude 实际风控为准". When the API returns no risk
      data (no key, quota exhausted, upstream error), the score shows
      "暂无数据" and the flags show "未知"; geo data is still shown when
      available.

## Connectivity & Leaks (browser)

- [ ] R14: Reachability: for `claude.ai` and `api.anthropic.com`, time one
      `/cdn-cgi/trace` request made after the connection is warm. Show
      "正常" (< 500 ms), "较慢" (≥ 500 ms) or "无法访问" (error / timeout),
      with the measured milliseconds.
- [ ] R15: When the `api.anthropic.com` trace `ip` differs from the Claude
      exit IP, show "api.anthropic.com 出口与 claude.ai 不一致" (Claude Code
      and the web app would appear from different IPs).
- [ ] R16: Official status: `GET https://status.claude.com/api/v2/summary.json`;
      map `status.indicator` to 全部正常 (none) / 轻微故障 (minor) /
      重大故障 (major) / 严重故障 (critical) / 维护中 (maintenance), linked to
      `https://status.claude.com`. On failure the row is hidden.
- [ ] R17: WebRTC leak: create an `RTCPeerConnection` with the STUN servers
      `stun:stun.l.google.com:19302` and `stun:stun.cloudflare.com:3478`,
      collect ICE candidate addresses for ≤ 5 s and keep public addresses only
      (exclude RFC 1918, 100.64.0.0/10, 198.18.0.0/15, loopback, link-local
      and mDNS `.local` names). A public address different from the Claude
      exit IP is a leak; if it equals the domestic exit IP, say that it
      exposes the real domestic IP. No public candidate → "未检测到泄露";
      `RTCPeerConnection` unavailable → "WebRTC 已禁用".

## Environment & History (local only)

- [ ] R18: Time zone: compare the browser's current UTC offset with the
      Claude exit time zone (`timezone` from the API). A difference > 1 h →
      "时区与出口不一致". A browser zone of `Asia/Shanghai` / `Asia/Urumqi` with
      a non-CN exit gets a specific hint. No exit time zone → "未知".
- [ ] R19: Language: compare the primary subtag of `navigator.languages[0]`
      with the common languages of the exit country (mapping for the main
      exit countries; unmapped country → no verdict). Informational only; not
      part of the score.
- [ ] R20: Show OS and browser (parsed from the user agent) and the WebGL
      renderer string. Informational only.
- [ ] R21: History: keep up to 6 entries `{ ip, cc, t }` of the Claude exit IP
      in `localStorage`; do not add an entry when the IP equals the latest
      entry and that entry is < 24 h old; provide a "清除" button. History is
      never sent to any server.
- [ ] R22: A "隐藏 IP" toggle masks every displayed IP (IPv4 → `a.b.*.*`,
      IPv6 → first two groups + `:*`). Default off, not persisted.

## Backend API (`functions/api/ip/[ip].ts`)

- [ ] R23: `GET /api/ip/:ip` accepts one public IPv4 or IPv6 literal. Malformed
      input and private / reserved / bogon addresses → 400
      `{ "error": "invalid_ip" }`. Methods other than GET → 405.
- [ ] R24: 200 response body:
      `{ ip, countryCode, country, region, city, timezone, asn, org, type, risk, score }`
      where `type` ∈ `residential | datacenter | mobile | other | unknown`,
      `risk` is `{ datacenter, vpn, proxy, tor, abuser, crawler }` (booleans)
      or `null`, and `score` is a number 0–100 or `null`.
- [ ] R25: Upstream is ipapi.is: with `key=IPAPI_KEY` when the secret is set,
      keyless otherwise (`risk: null`, `score: null`, `type: "unknown"`).
      Upstream timeout 5 s. Upstream failure (network error, non-2xx including
      429 quota errors, unparsable body) → 502
      `{ "error": "upstream_unavailable" }`.
- [ ] R26: Successful lookups are cached at the edge for 24 h per IP; error
      responses are never cached. Responses carry
      `Cache-Control: public, max-age=3600`.
- [ ] R27: The API sends no CORS headers (same-origin use only). The API key
      never appears in responses, logs or client code. The API does not log
      or store queried IPs beyond the 24 h lookup cache.

## Privacy & Operations

- [ ] R28: `public/privacy-policy.html` gains a section on the IP check tool:
      which third parties the browser contacts, that only the Claude exit IP
      is sent to our API and ipapi.is, the 24 h lookup cache, and that history
      stays in the browser.
- [ ] R29: `doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md` documents the
      `IPAPI_KEY` secret (production and local `.dev.vars`), the WAF
      rate-limit rule for `/api/ip/*`, the local test command and the
      post-deploy checks.
- [ ] R30: `.gitignore` excludes `.dev.vars` and `.wrangler/`.

## Non-Functional Requirements

- [ ] NFR-1 Performance: the Claude exit IP appears within 3 s on a normal
      connection; all checks run in parallel; no new npm runtime dependency.
- [ ] NFR-2 Cost: only the Claude exit IP is sent to the API; the domestic,
      Cloudflare-default and WebRTC IPs never leave the browser except to the
      endpoints that reveal them. At most one upstream lookup per distinct IP
      per 24 h per Cloudflare data center.
- [ ] NFR-3 Security: strict IP validation before any upstream call; the
      secret lives only in Pages environment variables; edge rate limiting.
- [ ] NFR-4 UX: light and dark themes; single-column layout on mobile; status
      conveyed by text as well as colour.
- [ ] NFR-5 Compatibility: current Chrome, Edge, Safari and Firefox. Missing
      browser features degrade the affected card to "不支持".

## User Scenarios

1. **Healthy residential exit**: Given a visitor whose proxy exits through a
   US residential IP, when the page loads, then all three IPs appear, the
   region is supported, the score is ≥ 80 and no leak is reported.
2. **Datacenter exit**: Given an exit on a hosting provider, when the page
   loads, then the type shows "机房 IP", the score is lowered and labelled,
   and the CTA invites a consultation.
3. **Unsupported region**: Given split rules that send claude.ai through a
   Hong Kong node, when the page loads, then the trace `loc` is `HK`, the red
   region warning shows and the score is 0.
4. **WebRTC leak**: Given a visitor using system-proxy mode (TCP only), when
   the page loads, then the STUN candidate reveals the domestic IP and the
   WebRTC card reports a leak of the real domestic IP.
5. **Quota exhausted**: Given ipapi.is answers 429, when the page loads, then
   the score shows "暂无数据" while every browser-side check still works.
6. **Crawler**: Given Baiduspider fetches `/claude-risk-check` without
   JavaScript, then it sees the H1, the explanations and the FAQ, and no IP.

## Edge Cases

- IPv6 exit IP: accepted by the API, masked correctly, displayed in full.
- claude.ai unreachable (trace fails): Claude card "获取失败", region and score
  "无法检测", reachability "无法访问"; other cards unaffected.
- `my.ip.cn` and ip138 both fail: domestic card "获取失败"; WebRTC still
  compares against the Claude exit IP.
- Exit IP is a bogon or the API returns 400 for it: risk card shows "暂无数据".
- Automation / prerender (`navigator.webdriver === true`): no detection runs;
  placeholders only.
- Visitor reloads repeatedly: the API is served from cache; history does not
  grow for the same IP within 24 h.
