/**
 * Cloudflare Pages Function: GET /api/ip/:ip
 *
 * Enriches one public IP address (the visitor's Claude exit IP) with geo +
 * risk data from ipapi.is. The API key (IPAPI_KEY secret) never leaves the
 * server side. Successful lookups are cached at the edge for 24 h; error
 * responses are never cached. No CORS headers (same-origin use only) and no
 * logging of queried IPs.
 *
 * Covers tasks 2.1-2.4 (R23-R27).
 */

// ---------------------------------------------------------------------------
// Scoring weights (task 2.3): tune these constants to recalibrate the score.
// score = 100; tor => 0; otherwise subtract each penalty and clamp to 0..100.
// ---------------------------------------------------------------------------
const SCORE_PENALTIES = {
  // 40: a datacenter IP alone scores 60 (一般, yellow); the page's 8-item
  // check still marks "机房 IP" red.
  datacenter: 40,
  vpn: 25,
  proxy: 25,
  abuser: 15,
  crawler: 10,
} as const;

const UPSTREAM_TIMEOUT_MS = 10000;
const EDGE_CACHE_TTL_SECONDS = 86400; // 24 h edge cache per IP
const BROWSER_CACHE_TTL_SECONDS = 3600; // 1 h browser cache
const CACHE_NAMESPACE = 'ip-lookup';
// Bump when the response schema or scoring changes so stale entries are skipped.
const CACHE_VERSION = 6;
// Partial results (registration country missing, usually a transient RIPEstat
// failure) are cached briefly at both layers so they are retried soon.
const PARTIAL_TTL_SECONDS = 600;
// RIR registration country of the IP block (RIR delegation statistics via
// RIPEstat): the "注册地" behind the page's 原生 IP check.
const RIPESTAT_URL = 'https://stat.ripe.net/data/rir-stats-country/data.json';
const RIPESTAT_TIMEOUT_MS = 8000;

// Typed locally: no @cloudflare/workers-types dependency. The function only
// uses standard Web APIs covered by the DOM lib (fetch/Request/Response/URL/
// caches) plus the env + params + waitUntil bindings Pages provides.
interface FunctionContext {
  request: Request;
  env: { IPAPI_KEY?: string };
  params: { ip: string | string[] };
  waitUntil(promise: Promise<unknown>): void;
}

// ---------------------------------------------------------------------------
// Response schema (R24)
// ---------------------------------------------------------------------------
type IpType = 'residential' | 'datacenter' | 'mobile' | 'other' | 'unknown';

interface IpRisk {
  datacenter: boolean;
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  abuser: boolean;
  crawler: boolean;
}

interface IpCompany {
  name: string | null;
  domain: string | null;
  type: string | null;
  abuserScore: string | null;
}

interface IpInfo {
  ip: string;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  asn: number | null;
  org: string | null;
  asnDomain: string | null;
  asnCountry: string | null; // ASN registration country (ISO-2, upper case)
  registeredCountry: string | null; // RIR registration country of the IP block (ISO-2)
  company: IpCompany | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: string | null;
  isMobile: boolean;
  isSatellite: boolean;
  isAnycast: boolean;
  datacenterName: string | null;
  type: IpType;
  risk: IpRisk | null;
  score: number | null;
}

// ---------------------------------------------------------------------------
// Upstream response shape. Keyed responses nest data under `location` /
// `asn` (object) / `company` (object); the keyless tier returns flat fields
// with `asn` as a "AS15169 Google LLC" string and `company` as a plain
// string (design table). Modeled with union field types.
// ---------------------------------------------------------------------------
interface Upstream {
  is_bogon?: boolean;
  is_datacenter?: boolean;
  is_mobile?: boolean;
  is_satellite?: boolean;
  is_anycast?: boolean;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_abuser?: boolean;
  is_crawler?: boolean | string; // false, or the crawler's name
  location?: {
    country_code?: string;
    country?: string;
    state?: string;
    city?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: string;
  };
  asn?: number | string | { asn?: number; org?: string; domain?: string; country?: string };
  company?:
    | string
    | {
        name?: string;
        type?: string;
        domain?: string;
        abuser_score?: string;
      };
  // Keyed-only nested datacenter block (e.g. "ipxo.com").
  datacenter?: { datacenter?: string } | null;
  // Keyless flat geo fields
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

// ---------------------------------------------------------------------------
// IP validation (task 2.1). Rejects malformed input and every private /
// reserved / bogon range before any upstream call.
// ---------------------------------------------------------------------------

/** Reject these IPv4 CIDR ranges (special-use addresses, RFC 5735 et al.). */
const REJECTED_IPV4_RANGES: [number, number][] = [
  // Each entry: [network int, mask int]
  [0x00000000, 0xff000000], // 0.0.0.0/8        "this network"
  [0x0a000000, 0xff000000], // 10.0.0.0/8       private
  [0x64400000, 0xffc00000], // 100.64.0.0/10    CGNAT
  [0x7f000000, 0xff000000], // 127.0.0.0/8      loopback
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16   link-local
  [0xac100000, 0xfff00000], // 172.16.0.0/12    private
  [0xc0000000, 0xffffff00], // 192.0.0.0/24     IETF protocol assignments
  [0xc0000200, 0xffffff00], // 192.0.2.0/24     TEST-NET-1
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16   private
  [0xc6120000, 0xfffe0000], // 198.18.0.0/15    benchmarking
  [0xc6336400, 0xffffff00], // 198.51.100.0/24  TEST-NET-2
  [0xcb007100, 0xffffff00], // 203.0.113.0/24   TEST-NET-3
  [0xe0000000, 0xf0000000], // 224.0.0.0/4      multicast
  [0xf0000000, 0xf0000000], // 240.0.0.0/4      reserved / broadcast
];

/**
 * Validate and normalise the path segment as a public IP literal.
 * Returns the normalised IP string (the cache key and upstream query),
 * or null when the input is malformed or in a rejected range.
 */
function validateIp(raw: string): string | null {
  // IPv4: dotted quad, octets 0-255, no leading zeros.
  if (raw.includes('.')) {
    const parts = raw.split('.');
    if (parts.length !== 4) return null;
    for (const part of parts) {
      if (!/^\d{1,3}$/.test(part)) return null;
      if (part.length > 1 && part[0] === '0') return null; // no leading zeros
      if (Number(part) > 255) return null;
    }
    const value =
      ((Number(parts[0]) << 24) |
        (Number(parts[1]) << 16) |
        (Number(parts[2]) << 8) |
        Number(parts[3])) >>>
      0; // unsigned
    for (const [network, mask] of REJECTED_IPV4_RANGES) {
      // >>> 0: JS bitwise ops return signed int32, so for first octet >= 128
      // the AND result is negative and would never equal the unsigned
      // network literal — normalise back to unsigned before comparing.
      if (((value & mask) >>> 0) === network) return null;
    }
    return raw;
  }

  // IPv6: URL parsing throws on invalid literals; the normalised hostname
  // (lowercase, compressed) becomes the cache key / upstream query.
  if (raw.includes(':')) {
    let host: string;
    try {
      // URL.hostname serialises IPv6 with brackets ("[2001:db8::1]"); strip
      // them so the range checks and the upstream query get the bare address.
      host = new URL(`http://[${raw}]`).hostname.slice(1, -1);
    } catch {
      return null;
    }
    if (isRejectedIpv6(host)) return null;
    return host;
  }

  return null;
}

/** Reject IPv6 unspecified/loopback, IPv4-mapped, ULA, link-local, multicast and documentation ranges. */
function isRejectedIpv6(normalisedHost: string): boolean {
  // Expand the address to eight 16-bit groups for prefix comparisons.
  const expanded = expandIpv6(normalisedHost);
  if (!expanded) return true; // unparseable -> treat as rejected
  const groups = expanded.split(':').map((g) => parseInt(g, 16));

  // :: and ::1
  if (groups.every((g) => g === 0)) return true;
  if (groups.every((g, i) => g === (i === 7 ? 1 : 0))) return true;
  // ::ffff:0:0/96 IPv4-mapped
  if (groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0xffff) return true;
  // fc00::/7 unique local
  if ((groups[0] & 0xfe00) === 0xfc00) return true;
  // fe80::/10 link-local
  if ((groups[0] & 0xffc0) === 0xfe80) return true;
  // ff00::/8 multicast
  if ((groups[0] & 0xff00) === 0xff00) return true;
  // 2001:db8::/32 documentation
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true;

  return false;
}

/** Expand an IPv6 address (from URL.hostname) to the full 8-group form. */
function expandIpv6(host: string): string | null {
  const halves = host.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const tail = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const all = halves.length === 2 ? [...head, ...Array(missing).fill('0'), ...tail] : head;
  if (all.length !== 8) return null;
  return all.join(':');
}

// ---------------------------------------------------------------------------
// Upstream call + response mapping (task 2.2, 2.3)
// ---------------------------------------------------------------------------

const json = (body: unknown, status: number, cacheControl: string): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cacheControl },
  });

/**
 * Fetch and map the ipapi.is payload. Returns 'bogon' when upstream flags the
 * address as reserved, null on any upstream failure.
 */
async function lookupIp(ip: string, env: FunctionContext['env']): Promise<IpInfo | 'bogon' | null> {
  const url = new URL('https://api.ipapi.is/');
  url.searchParams.set('q', ip);
  if (env.IPAPI_KEY) url.searchParams.set('key', env.IPAPI_KEY);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data: Upstream;
  try {
    data = (await res.json()) as Upstream;
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  // Bogon backstop: upstream also flags reserved addresses.
  if (data.is_bogon) return 'bogon';

  // Narrow the union `asn` / `company` fields by runtime type.
  const asnObj = typeof data.asn === 'object' && data.asn !== null ? data.asn : null;
  const asnStr = typeof data.asn === 'string' ? data.asn : null;
  const companyObj =
    typeof data.company === 'object' && data.company !== null ? data.company : null;
  const companyStr = typeof data.company === 'string' ? data.company : null;

  // Keyed responses nest geo data under `location`; the keyless tier has no
  // `location` object (its `asn` is a string in both shapes, so `location`
  // is the discriminator).
  const keyed = data.location !== undefined;
  const info: IpInfo = {
    ip,
    countryCode: data.location?.country_code ?? null,
    country: data.location?.country ?? data.country ?? null,
    region: data.location?.state ?? data.region ?? null,
    city: data.location?.city ?? data.city ?? null,
    timezone: data.location?.timezone ?? data.timezone ?? null,
    asn: keyed ? (asnObj?.asn ?? null) : parseAsnNumber(asnStr),
    org: keyed
      ? (asnObj?.org ?? companyObj?.name ?? null)
      : (companyStr ?? null),
    asnDomain: keyed ? (asnObj?.domain ?? null) : null,
    asnCountry: keyed ? (asnObj?.country?.toUpperCase() ?? null) : null,
    registeredCountry: null, // filled from RIPEstat by the handler
    company: keyed
      ? {
          name: companyObj?.name ?? null,
          domain: companyObj?.domain ?? null,
          type: companyObj?.type ?? null,
          abuserScore: companyObj?.abuser_score ?? null,
        }
      : null,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    accuracy: data.location?.accuracy ?? null,
    isMobile: data.is_mobile === true,
    isSatellite: data.is_satellite === true,
    isAnycast: data.is_anycast === true,
    datacenterName: data.datacenter?.datacenter ?? null,
    type: keyed ? deriveType(data, companyObj) : 'unknown',
    risk: keyed
      ? {
          datacenter: data.is_datacenter === true,
          vpn: data.is_vpn === true,
          proxy: data.is_proxy === true,
          tor: data.is_tor === true,
          abuser: data.is_abuser === true,
          crawler: Boolean(data.is_crawler),
        }
      : null,
    score: keyed ? computeScore(data) : null,
  };
  return info;
}

/**
 * RIR registration country of the IP block (from RIR delegation statistics,
 * via RIPEstat), e.g. "US" for ARIN space allocated in the US. Null on any
 * failure: the page then shows the 原生 IP check as unknown.
 */
async function lookupRegisteredCountry(ip: string): Promise<string | null> {
  const url = new URL(RIPESTAT_URL);
  url.searchParams.set('resource', ip);
  url.searchParams.set('sourceapp', 'gutast-ip-check');
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(RIPESTAT_TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { located_resources?: { location?: string }[] };
    };
    const location = data.data?.located_resources?.[0]?.location;
    return location && /^[A-Za-z]{2}$/.test(location) ? location.toUpperCase() : null;
  } catch {
    return null;
  }
}

/** Extract the AS number from a keyless "AS15169 Google LLC" string. */
function parseAsnNumber(asn: string | null): number | null {
  if (!asn) return null;
  const match = /^AS(\d+)\b/.exec(asn);
  return match ? Number(match[1]) : null;
}

/** Map the keyed response flags to the R24 IP type. */
function deriveType(data: Upstream, companyObj: { name?: string; type?: string } | null): IpType {
  if (data.is_datacenter) return 'datacenter';
  if (data.is_mobile) return 'mobile';
  if (companyObj?.type === 'isp') return 'residential';
  return 'other';
}

/** Score with the weights from design §Scoring; tor forces 0. */
function computeScore(data: Upstream): number {
  if (data.is_tor) return 0;
  let score = 100;
  if (data.is_datacenter) score -= SCORE_PENALTIES.datacenter;
  if (data.is_vpn) score -= SCORE_PENALTIES.vpn;
  if (data.is_proxy) score -= SCORE_PENALTIES.proxy;
  if (data.is_abuser) score -= SCORE_PENALTIES.abuser;
  if (data.is_crawler) score -= SCORE_PENALTIES.crawler;
  return Math.min(100, Math.max(0, score));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function onRequest(context: FunctionContext): Promise<Response> {
  const { request, env, params, waitUntil } = context;

  // Method guard: same-origin reads only.
  if (request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405, 'no-store');
  }

  // Path segment may arrive as string or string[] depending on the runtime.
  const raw = Array.isArray(params.ip) ? params.ip.join('/') : params.ip;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw ?? '');
  } catch {
    // Malformed percent-encoding (e.g. "%E0%A4%A").
    return json({ error: 'invalid_ip' }, 400, 'no-store');
  }
  const ip = validateIp(decoded);
  if (!ip) {
    return json({ error: 'invalid_ip' }, 400, 'no-store');
  }

  // Edge cache: successful lookups only, 24 h per normalised IP.
  const cache = await caches.open(CACHE_NAMESPACE);
  const cacheKey = new URL(`/api/ip/${ip}?v=${CACHE_VERSION}`, request.url);
  const cached = await cache.match(cacheKey);
  if (cached) {
    // Rebuild the response so the browser-facing TTL stays 1 h.
    const body = await cached.text();
    const cachedInfo = JSON.parse(body) as IpInfo;
    const browserTtl = cachedInfo.registeredCountry ? BROWSER_CACHE_TTL_SECONDS : PARTIAL_TTL_SECONDS;
    return json(cachedInfo, 200, `public, max-age=${browserTtl}`);
  }

  // Both upstreams in parallel; the registration country is optional.
  const [info, registeredCountry] = await Promise.all([
    lookupIp(ip, env),
    lookupRegisteredCountry(ip),
  ]);
  if (info === 'bogon') {
    return json({ error: 'invalid_ip' }, 400, 'no-store');
  }
  if (!info) {
    return json({ error: 'upstream_unavailable' }, 502, 'no-store');
  }
  info.registeredCountry = registeredCountry;

  // Store with the edge TTL; never block the response on the write.
  const partial = registeredCountry === null;
  const edgeTtl = partial ? PARTIAL_TTL_SECONDS : EDGE_CACHE_TTL_SECONDS;
  const browserTtl = partial ? PARTIAL_TTL_SECONDS : BROWSER_CACHE_TTL_SECONDS;
  const cacheRes = json(info, 200, `public, max-age=${edgeTtl}`);
  waitUntil(cache.put(cacheKey, cacheRes.clone()));

  return json(info, 200, `public, max-age=${browserTtl}`);
}
