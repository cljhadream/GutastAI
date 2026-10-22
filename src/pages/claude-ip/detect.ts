/**
 * Browser-side detection helpers for the Claude IP risk check page.
 * Plain async functions, no React. Every source fails independently with
 * its own timeout so one blocked endpoint never blocks the others (R9).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed `/cdn-cgi/trace` payload: `loc` is an upper-case ISO-2 code. */
export interface Trace {
  ip: string;
  loc: string | null;
}

export interface DomesticIp {
  ip: string;
  location: string | null; // 归属地 text from my.ip.cn
}

export type ClaudeStatus = 'none' | 'minor' | 'major' | 'critical' | 'maintenance';

/** Mirror of the /api/ip response schema (R24). */
export interface IpInfo {
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
  company: {
    name: string | null;
    domain: string | null;
    type: string | null;
    abuserScore: string | null;
  } | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: string | null;
  isMobile: boolean;
  isSatellite: boolean;
  isAnycast: boolean;
  datacenterName: string | null;
  type: 'residential' | 'datacenter' | 'mobile' | 'other' | 'unknown';
  risk: {
    datacenter: boolean;
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    abuser: boolean;
    crawler: boolean;
  } | null;
  score: number | null;
}

export interface HistoryEntry {
  ip: string;
  cc: string | null;
  t: string; // ISO timestamp
}

export interface EnvironmentInfo {
  timeZone: string;
  offsetMinutes: number;
  languages: readonly string[];
  os: string;
  browser: string;
  webglRenderer: string | null;
  cookiesEnabled: boolean;
  canvasFingerprint: string | null;
  webglFingerprint: string | null;
}

// ---------------------------------------------------------------------------
// Endpoints (constants: change here when a third-party host changes)
// ---------------------------------------------------------------------------

const TRACE_TIMEOUT_MS = 8000;
const STATUS_TIMEOUT_MS = 5000;
const WEBRTC_COLLECT_MS = 5000;
const DOMESTIC_TIMEOUT_MS = 8000;

const DOMESTIC_ECHO_URL = 'https://my.ip.cn/';
const DOMESTIC_ECHO_FALLBACK_URL = 'https://2026.ip138.com/';
const CLAUDE_STATUS_URL = 'https://status.claude.com/api/v2/summary.json';

export const CLAUDE_HOST = 'claude.ai';
export const API_HOST = 'api.anthropic.com';
export const CF_HOST = '1.1.1.1';

// ---------------------------------------------------------------------------
// Prerender / automation guard (task 3.3)
// ---------------------------------------------------------------------------

/** True under Puppeteer/prerender (and most headless automation): skip all detection. */
export function isAutomation(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

// ---------------------------------------------------------------------------
// /cdn-cgi/trace (R6, R7, R14, R15)
// ---------------------------------------------------------------------------

/**
 * Fetch a Cloudflare trace endpoint and parse `ip=` / `loc=`. The browser's
 * proxy rules pick the route for each host, so the reported IP is the exit
 * that host's edge sees.
 */
export async function fetchTrace(
  host: 'claude.ai' | 'api.anthropic.com' | '1.1.1.1',
): Promise<Trace> {
  const res = await fetch(`https://${host}/cdn-cgi/trace`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TRACE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`trace ${host} HTTP ${res.status}`);
  const map = parseKeyValueBody(await res.text());
  const ip = map.get('ip');
  if (!ip) throw new Error(`trace ${host} missing ip`);
  const loc = map.get('loc');
  return { ip, loc: loc ? loc.toUpperCase() : null };
}

/** Parse a `key=value` line body into a map. */
function parseKeyValueBody(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of body.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
  }
  return map;
}

/**
 * Time one trace request after the connection is warm: issues a warm-up
 * request (ignoring errors) and measures the next one, so the number is
 * roughly one round trip to the Cloudflare edge instead of DNS+TCP+TLS.
 */
export async function timeTrace(
  host: 'claude.ai' | 'api.anthropic.com',
): Promise<number> {
  try {
    await fetch(`https://${host}/cdn-cgi/trace`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TRACE_TIMEOUT_MS),
    });
  } catch {
    // Warm-up failure does not matter; the timed request reports the error.
  }
  const start = performance.now();
  const res = await fetch(`https://${host}/cdn-cgi/trace`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TRACE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`trace ${host} HTTP ${res.status}`);
  // Drain the body so timing includes the full transfer.
  await res.text();
  return Math.round(performance.now() - start);
}

// ---------------------------------------------------------------------------
// Domestic exit IP (R8)
// ---------------------------------------------------------------------------

/**
 * Domestic direct exit: `my.ip.cn` returns plain text like
 * `ip：1.2.3.4 归属地：广东省深圳市 电信`. Falls back to the ip138 page
 * (title `您的IP地址是：<IP>`), taking the first IPv4 in the HTML.
 */
export async function fetchDomesticIp(): Promise<DomesticIp> {
  try {
    const res = await fetch(DOMESTIC_ECHO_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(DOMESTIC_TIMEOUT_MS),
    });
    if (res.ok) {
      const text = await res.text();
      const ipMatch = /ip[:：]\s*([0-9a-fA-F:.]+)/.exec(text);
      if (ipMatch) {
        const locMatch = /归属地[:：]\s*([^\n\r]+)/.exec(text);
        return { ip: ipMatch[1], location: locMatch ? locMatch[1].trim() : null };
      }
    }
  } catch {
    // Fall through to the ip138 fallback.
  }

  const res = await fetch(DOMESTIC_ECHO_FALLBACK_URL, {
    cache: 'no-store',
    signal: AbortSignal.timeout(DOMESTIC_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`domestic echo HTTP ${res.status}`);
  const html = await res.text();
  const m = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/.exec(stripTags(html));
  if (!m) throw new Error('domestic echo: no IPv4 found');
  return { ip: m[1], location: null };
}

/** Remove HTML tags so the IPv4 regex cannot match markup like `<title>`. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

// ---------------------------------------------------------------------------
// Official service status (R16)
// ---------------------------------------------------------------------------

const STATUS_INDICATORS: Record<string, ClaudeStatus> = {
  none: 'none',
  minor: 'minor',
  major: 'major',
  critical: 'critical',
  maintenance: 'maintenance',
};

/** Claude's official Statuspage summary; throws when unreachable. */
export async function fetchClaudeStatus(): Promise<ClaudeStatus> {
  const res = await fetch(CLAUDE_STATUS_URL, {
    cache: 'no-store',
    signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`status HTTP ${res.status}`);
  const data = (await res.json()) as { status?: { indicator?: string } };
  const indicator = STATUS_INDICATORS[data.status?.indicator ?? ''];
  // Unknown values must not read as "all operational": treat as unavailable.
  if (!indicator) throw new Error('status: unknown indicator');
  return indicator;
}

// ---------------------------------------------------------------------------
// WebRTC UDP candidates (R17)
// ---------------------------------------------------------------------------

const STUN_SERVERS = ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'];

/**
 * Collect public ICE candidate addresses via STUN for up to 5 s. Returns
 * null when RTCPeerConnection is unavailable (WebRTC disabled), an array
 * (possibly empty) of public addresses otherwise. mDNS `.local` names and
 * private addresses are excluded here.
 */
export function collectWebRtcIps(): Promise<string[] | null> {
  if (typeof RTCPeerConnection === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const found: string[] = [];
    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVERS }] });
    } catch {
      resolve(null);
      return;
    }

    const finish = () => {
      pc.close();
      resolve(found);
    };
    const timer = setTimeout(finish, WEBRTC_COLLECT_MS);

    pc.onicecandidate = (event) => {
      const addr = event.candidate?.address ?? null;
      // `.local` mDNS names have no dot-separated IP form; address is null
      // for end-of-candidates events.
      if (addr && isPublicIp(addr) && !found.includes(addr)) {
        found.push(addr);
      }
      if (!event.candidate) {
        clearTimeout(timer);
        finish();
      }
    };
    pc.onicecandidateerror = () => {
      /* STUN server failure: keep collecting until the timer fires */
    };

    // Empty data channel: gathers candidates without sending anything.
    pc.createDataChannel('probe');
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        clearTimeout(timer);
        finish();
      });
  });
}

// ---------------------------------------------------------------------------
// IP helpers
// ---------------------------------------------------------------------------

/**
 * True for globally routable addresses only. Excludes IPv4 loopback /
 * private / CGNAT / benchmarking / link-local / multicast / reserved, IPv6
 * loopback / unspecified / ULA / link-local / multicast, and mDNS names.
 */
export function isPublicIp(ip: string): boolean {
  if (!ip || ip.endsWith('.local')) return false;

  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return false;
    const octets = parts.map(Number);
    if (octets.some((o) => o > 255)) return false;
    const value =
      ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    // >>> 0: bitwise AND yields a signed int32, which never equals an unsigned
    // network literal >= 0x80000000 (172.16/12, 192.168/16, ...).
    const inRange = (network: number, mask: number) => ((value & mask) >>> 0) === network;
    return !(
      inRange(0x00000000, 0xff000000) || // 0/8
      inRange(0x0a000000, 0xff000000) || // 10/8 private
      inRange(0x64400000, 0xffc00000) || // 100.64/10 CGNAT
      inRange(0x7f000000, 0xff000000) || // 127/8 loopback
      inRange(0xa9fe0000, 0xffff0000) || // 169.254/16 link-local
      inRange(0xac100000, 0xfff00000) || // 172.16/12 private
      inRange(0xc0000200, 0xffffff00) || // 192.0.2/24 TEST-NET-1
      inRange(0xc0a80000, 0xffff0000) || // 192.168/16 private
      inRange(0xc6120000, 0xfffe0000) || // 198.18/15 benchmarking
      inRange(0xc6336400, 0xffffff00) || // 198.51.100/24 TEST-NET-2
      inRange(0xcb007100, 0xffffff00) || // 203.0.113/24 TEST-NET-3
      inRange(0xe0000000, 0xf0000000) || // 224/4 multicast
      inRange(0xf0000000, 0xf0000000) // 240/4 reserved
    );
  }

  if (ip.includes(':')) {
    const expanded = expandIpv6(ip);
    if (!expanded) return false;
    const g = expanded.split(':').map((x) => parseInt(x, 16));
    // ::, ::1
    if (g.every((x) => x === 0)) return false;
    if (g.every((x, i) => x === (i === 7 ? 1 : 0))) return false;
    // IPv4-mapped ::ffff:0:0/96 — judge the embedded IPv4 instead
    if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
      const v4 = `${(g[6] >> 8) & 0xff}.${g[6] & 0xff}.${(g[7] >> 8) & 0xff}.${g[7] & 0xff}`;
      return isPublicIp(v4);
    }
    if ((g[0] & 0xfe00) === 0xfc00) return false; // fc00::/7 ULA
    if ((g[0] & 0xffc0) === 0xfe80) return false; // fe80::/10 link-local
    if ((g[0] & 0xff00) === 0xff00) return false; // ff00::/8 multicast
    return true;
  }

  return false;
}

/** Expand an IPv6 literal to the full 8-group form; null when unparseable. */
function expandIpv6(ip: string): string | null {
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const tail = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const all = halves.length === 2 ? [...head, ...Array(missing).fill('0'), ...tail] : head;
  if (all.length !== 8 || all.some((x) => !/^[0-9a-fA-F]{1,4}$/.test(x))) return null;
  return all.join(':');
}

/** Mask an IP for screenshots (R22): IPv4 `a.b.*.*`, IPv6 first two groups + `:*`. */
export function maskIp(ip: string): string {
  if (ip.includes(':')) {
    const groups = ip.split(':').filter(Boolean);
    const head = groups.slice(0, 2).join(':');
    return `${head}:*`;
  }
  const parts = ip.split('.');
  if (parts.length !== 4) return '*.*.*.*';
  return `${parts[0]}.${parts[1]}.*.*`;
}

// ---------------------------------------------------------------------------
// Our API (R12, R13)
// ---------------------------------------------------------------------------

/** GET /api/ip/:ip; null on any non-200 (invalid, quota, upstream error). */
export async function lookupIp(ip: string): Promise<IpInfo | null> {
  try {
    const res = await fetch(`/api/ip/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as IpInfo;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Environment (R18, R19, R20)
// ---------------------------------------------------------------------------

/** Common languages of the main exit countries; unmapped countries get no verdict. */
export const COUNTRY_LANGUAGES: Record<string, readonly string[]> = {
  US: ['en'],
  GB: ['en'],
  CA: ['en', 'fr'],
  AU: ['en'],
  NZ: ['en'],
  IE: ['en'],
  SG: ['en', 'zh', 'ms', 'ta'],
  JP: ['ja'],
  KR: ['ko'],
  TW: ['zh'],
  HK: ['zh'],
  MO: ['zh'],
  CN: ['zh'],
  DE: ['de'],
  AT: ['de'],
  CH: ['de', 'fr', 'it'],
  FR: ['fr'],
  BE: ['nl', 'fr', 'de'],
  NL: ['nl'],
  ES: ['es'],
  MX: ['es'],
  AR: ['es'],
  CL: ['es'],
  CO: ['es'],
  IT: ['it'],
  PT: ['pt'],
  BR: ['pt'],
  RU: ['ru'],
  UA: ['uk', 'ru'],
  PL: ['pl'],
  CZ: ['cs'],
  SE: ['sv'],
  NO: ['no', 'nb', 'nn'],
  DK: ['da'],
  FI: ['fi', 'sv'],
  TR: ['tr'],
  AE: ['ar'],
  SA: ['ar'],
  IL: ['he', 'ar'],
  IN: ['hi', 'en'],
  TH: ['th'],
  VN: ['vi'],
  PH: ['en', 'fil'],
  ID: ['id'],
  MY: ['ms', 'en'],
};

/** Local browser environment: time zone, languages, OS/browser UA, WebGL renderer, local fingerprints. */
export function readEnvironment(): EnvironmentInfo {
  return {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '未知',
    offsetMinutes: -new Date().getTimezoneOffset(),
    languages: navigator.languages ?? [navigator.language],
    os: parseOs(navigator.userAgent),
    browser: parseBrowser(navigator.userAgent),
    webglRenderer: readWebglRenderer(),
    cookiesEnabled: navigator.cookieEnabled,
    canvasFingerprint: readCanvasFingerprint(),
    webglFingerprint: readWebglFingerprint(),
  };
}

function parseOs(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return '未知系统';
}

function parseBrowser(ua: string): string {
  // Order matters: Chromium forks carry other engines' tokens too.
  const version = (re: RegExp) => re.exec(ua)?.[1];
  if (/Edg\//.test(ua)) return `Edge ${version(/Edg\/([\d.]+)/) ?? ''}`.trim();
  if (/OPR\//.test(ua)) return `Opera ${version(/OPR\/([\d.]+)/) ?? ''}`.trim();
  if (/Firefox\//.test(ua)) return `Firefox ${version(/Firefox\/([\d.]+)/) ?? ''}`.trim();
  if (/Chrome\//.test(ua)) return `Chrome ${version(/Chrome\/([\d.]+)/) ?? ''}`.trim();
  if (/Safari\//.test(ua)) return `Safari ${version(/Version\/([\d.]+)/) ?? ''}`.trim();
  return '未知浏览器';
}

/** UNMASKED_RENDERER_WEBGL via the debug extension; null when unavailable. */
function readWebglRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return gl.getParameter(gl.RENDERER) as string;
    return (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) ?? null;
  } catch {
    return null;
  }
}

/** FNV-1a 32-bit hash as 8 uppercase hex chars (stable, synchronous). */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Canvas 2D fingerprint: draw text with layered colours and hash the pixel
 * output — rendering varies with GPU / driver / font stack. Local read only,
 * never sent anywhere.
 */
function readCanvasFingerprint(): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 120, 30);
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = '#069';
    ctx.fillText('Gutast Claude IP check \u{1F600}', 2, 18);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Gutast Claude IP check \u{1F600}', 4, 22);
    return fnv1aHex(canvas.toDataURL());
  } catch {
    return null;
  }
}

/**
 * WebGL fingerprint: render a gradient triangle with a tiny shader pair and
 * hash the pixel output (varies with GPU / driver / shader compiler).
 * Local read only, never sent anywhere.
 */
function readWebglFingerprint(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
    }) as WebGLRenderingContext | null;
    if (!gl) return null;
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('shader');
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('compile');
      return shader;
    };
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(
      program,
      compile(
        gl.VERTEX_SHADER,
        'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }',
      ),
    );
    gl.attachShader(
      program,
      compile(
        gl.FRAGMENT_SHADER,
        'precision mediump float; void main() { gl_FragColor = vec4(gl_FragCoord.x / 300.0, gl_FragCoord.y / 150.0, 0.5, 1.0); }',
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 0, 1]), gl.STATIC_DRAW);
    const attr = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return fnv1aHex(canvas.toDataURL());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Country names (zh-CN, from Intl — no lookup tables)
// ---------------------------------------------------------------------------

/** Chinese country name for an ISO-2 code; null when unknown. */
export function regionName(cc: string): string | null {
  try {
    return new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(cc.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Local history (R21) — localStorage only, never sent anywhere
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'gutast-claude-ip-history';
const HISTORY_MAX = 6;
const HISTORY_DEDUPE_MS = 24 * 60 * 60 * 1000;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Add an entry (newest first, max 6). Skips when the latest entry has the same IP and is < 24 h old. */
export function recordHistory(ip: string, cc: string | null): HistoryEntry[] {
  const history = loadHistory();
  const latest = history[0];
  if (
    latest &&
    latest.ip === ip &&
    latest.t &&
    Date.now() - new Date(latest.t).getTime() < HISTORY_DEDUPE_MS
  ) {
    return history;
  }
  const next = [{ ip, cc, t: new Date().toISOString() }, ...history].slice(0, HISTORY_MAX);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Storage full / disabled: history is best-effort.
  }
  return next;
}

export function clearHistory(): HistoryEntry[] {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore storage errors.
  }
  return [];
}
