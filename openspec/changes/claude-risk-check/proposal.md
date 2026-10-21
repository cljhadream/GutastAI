# Proposal: Claude IP Risk Check Page (`/claude-risk-check`)

## Context

Gutast AI sells Claude Pro / Max recharge to Chinese developers. Most of them
reach Claude through a proxy, and a frequent pre-sales question is "will my
network get the account banned?". The site already has articles on ban risk
(`/blog/claude-ban-risk-guide`, `/blog/claude-account-safety-faq`) but no tool
that checks the visitor's own connection.

Third-party sites offer such a check. We analysed one of them
(`ip.net.coffee/claude/`, 2026-10-21). Its mechanism is simple and fully
reproducible with our own code:

- Cloudflare serves `/cdn-cgi/trace` on every proxied hostname with
  `Access-Control-Allow-Origin: *`. `claude.ai` and `api.anthropic.com` are
  behind Cloudflare, so a browser `fetch` to
  `https://claude.ai/cdn-cgi/trace` follows the same proxy rule as real Claude
  traffic; the returned `ip=` and `loc=` are the exit IP and country that
  Claude's edge sees.
- An IP-literal Cloudflare endpoint (`https://1.1.1.1/cdn-cgi/trace`) and a
  domestic echo site (`https://my.ip.cn/`) reveal the other routes of a
  split-tunnel setup (default route vs. direct domestic route).
- IP reputation (datacenter / VPN / proxy / Tor / abuse) comes from a
  commercial IP intelligence API behind the site's own backend (its field
  names and formats match ipapi.is).

We write our own implementation, copy and backend. We do not copy the
reference site's source, design or text, and we do not call its APIs.

## Goals

- Add a landing page `/claude-risk-check` (no login) that shows:
  - three exit IPs: domestic direct exit, Cloudflare default exit, Claude exit;
  - for the Claude exit IP: supported-region check against Anthropic's
    official list, an estimated risk score, IP type
    (residential / datacenter / mobile), ASN and organisation, and risk flags
    (VPN, proxy, Tor, abuse record, crawler);
  - reachability of `claude.ai` and `api.anthropic.com` (the host Claude Code
    uses), plus Claude's official service status;
  - WebRTC (UDP) leak detection;
  - environment consistency: browser time zone and language vs. the Claude
    exit location, plus OS / browser and WebGL renderer info;
  - a local-only history of recent Claude exit IPs and a "hide IP" toggle for
    screenshots.
- Add one Pages Function `GET /api/ip/:ip` that returns geo + risk data for
  the Claude exit IP through ipapi.is, keeping the API key server-side, with
  input validation and edge caching.
- Keep the page crawlable (prerendered H1, explanations and FAQ), list it in
  the header/footer navigation and the sitemap, and end it with the existing
  WeChat consultation CTA.

## Non-Goals

- DNS leak detection. It needs a self-hosted authoritative DNS server on a
  VPS; Cloudflare Workers cannot serve DNS. Planned as a separate change.
- A self-hosted domestic IP echo service. It would need a mainland server
  with ICP filing; we keep using public echo endpoints.
- Canvas / WebGL fingerprint hashes. A bare hash gives visitors nothing
  actionable.
- Server-side logging or reporting of visitor IPs. The reference site
  silently POSTs all three IPs to `/api/session`; we will not.
- Offline IP databases (GeoLite2 City etc. exceed the Worker bundle limit)
  and home-grown VPN / proxy detection data.
- Claiming Claude's real risk decision. The score is our heuristic and is
  labelled as an estimate.

## Dependencies

- An ipapi.is account API key (free tier: 1,000 lookups per day, commercial
  use allowed), stored as the Pages secret `IPAPI_KEY`. The owner registers
  the account. Without the key the API still returns geo / ASN (keyless tier,
  low daily limit) but no risk flags and no score.
- A Cloudflare WAF rate-limiting rule for `/api/ip/*`, configured in the
  dashboard at deploy time.
- Third-party endpoints called from the visitor's browser, outside our
  control (the HTTP ones were verified to allow cross-origin reads on
  2026-10-21):
  - `https://claude.ai/cdn-cgi/trace`, `https://api.anthropic.com/cdn-cgi/trace`,
    `https://1.1.1.1/cdn-cgi/trace`;
  - `https://my.ip.cn/` (fallback `https://2026.ip138.com/`);
  - `https://status.claude.com/api/v2/summary.json`;
  - public STUN servers `stun.l.google.com:19302` and
    `stun.cloudflare.com:3478`.
- Privacy policy update: it currently states the site is a static page; the
  new tool sends the Claude exit IP to our API and to ipapi.is.
