import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SUPPORTED_REGIONS } from './supportedRegions';
import {
  API_HOST,
  CF_HOST,
  CLAUDE_HOST,
  COUNTRY_LANGUAGES,
  clearHistory,
  collectWebRtcIps,
  fetchClaudeStatus,
  fetchDomesticIp,
  fetchTrace,
  isAutomation,
  loadHistory,
  lookupIp,
  maskIp,
  readEnvironment,
  recordHistory,
  regionName,
  timeTrace,
  type ClaudeStatus,
  type DomesticIp,
  type EnvironmentInfo,
  type HistoryEntry,
  type IpInfo,
  type Trace,
} from './detect';

// ---------------------------------------------------------------------------
// Standalone shell (viral distribution)
//
// This page is designed to be shared as a standalone tool, so it deliberately
// skips the marketing AppShell (nav links, WeChat CTA, floating bars). It
// keeps only: theme switching, the prerender "render-event" signal and a
// minimal footer linking back to the main site.
// ---------------------------------------------------------------------------

// Scoped styles: particle grid, flowing gradient text. Keyframes are prefixed
// with `xa-` to avoid collisions with global CSS. Subset of AppShell's CSS.
const SHELL_CSS = `
  .xa-root {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI',
      Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  .xa-grid {
    background-size: 32px 32px;
    background-image:
      linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
  }
  .dark .xa-grid,
  .dark.xa-grid {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  @keyframes xa-text-flow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .xa-gradient-text {
    background-size: 200% 200%;
    animation: xa-text-flow 4s ease infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .xa-gradient-text { animation: none; }
  }
  /* Blend the native scrollbar into the page surface.
     The scroll container is the document element, so this must live on <html>. */
  html.xa-page.xa-dark {
    color-scheme: dark;
    scrollbar-color: #1f2436 #06070b;
  }
  html.xa-page.xa-dark::-webkit-scrollbar { width: 12px; }
  html.xa-page.xa-dark::-webkit-scrollbar-track { background: #06070b; }
  html.xa-page.xa-dark::-webkit-scrollbar-thumb {
    background: #1f2436;
    border-radius: 8px;
    border: 3px solid #06070b;
  }
`;

type Theme = 'dark' | 'light';

function StandaloneShell({ children }: { children: ReactNode }) {
  // Initial theme: saved manual choice wins, otherwise follow the OS preference.
  // Shares the AppShell "xa-theme" key so the choice carries across pages.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('xa-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // Signal the build-time prerenderer that React has committed the full DOM,
  // so the crawler-visible HTML snapshot is captured after render (SEO R1).
  useEffect(() => {
    document.dispatchEvent(new Event('render-event'));
  }, []);

  // Tag <html> while the page is mounted so the native scrollbar blends with
  // the page theme.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('xa-page');
    if (theme === 'dark') html.classList.add('xa-dark');
    return () => {
      html.classList.remove('xa-page');
      html.classList.remove('xa-dark');
    };
  }, [theme]);

  // Persist the theme choice for repeat visits.
  useEffect(() => {
    window.localStorage.setItem('xa-theme', theme);
  }, [theme]);

  // The outer div only carries the `dark` class: Tailwind's class-based dark
  // mode compiles to descendant selectors, so the theme carrier must be an
  // ancestor of the styled root, never the same element.
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="xa-root xa-grid isolate relative min-h-screen overflow-x-hidden bg-hyper-lightBg text-slate-900 transition-colors duration-300 selection:bg-hyper-orange selection:text-white dark:bg-hyper-darkBg dark:text-slate-100">
        <style>{SHELL_CSS}</style>

        {/* Hero radial aura behind the first screen */}
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[350px] w-[700px] -translate-x-1/2 bg-gradient-to-b from-hyper-orange/20 via-hyper-indigo/15 to-transparent blur-[120px]" />

        {/* Minimal header: brand only — no nav links, no conversion buttons */}
        <header className="sticky top-0 z-40 border-b border-hyper-lightBorder bg-hyper-lightBg/80 backdrop-blur-xl transition-colors dark:border-hyper-darkBorder dark:bg-hyper-darkBg/80">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <a href="https://www.gutast.com" className="group flex items-center gap-3" aria-label="Gutast AI 官网">
              <span className="relative flex items-center justify-center">
                <span className="absolute h-9 w-9 animate-ping rounded-full bg-hyper-orange opacity-20" />
                <img
                  src="/UI/logo/300_300.webp"
                  alt="Gutast AI Logo"
                  className="relative h-8 w-8 rounded-lg object-contain transition group-hover:scale-105"
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text whitespace-nowrap text-lg font-black tracking-tight text-transparent dark:from-white dark:to-slate-300">
                  Gutast AI
                </span>
                <span className="hidden text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase sm:block dark:text-slate-500">
                  Good Taste, Top AI
                </span>
              </span>
            </a>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-hyper-lightBorder p-2.5 text-slate-600 shadow-sm transition hover:border-hyper-orange/50 active:scale-95 dark:border-hyper-darkBorder dark:text-slate-300"
              title="切换深浅模式"
              aria-label="切换深浅模式"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <main>{children}</main>

        {/* Minimal footer: single link back to the main site */}
        <footer className="border-t border-hyper-lightBorder py-8 text-xs text-slate-400 dark:border-hyper-darkBorder">
          <div className="flex flex-wrap items-center justify-center gap-2 px-6">
            <span>© 2026 Gutast AI</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.gutast.com"
              className="font-semibold transition hover:text-hyper-orange"
            >
              访问官网
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

// Card pattern shared with FaqPage (light/dark tokens).
const CARD_CLS =
  'rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard p-6 shadow-sm dark:border-hyper-darkBorder dark:bg-hyper-darkCard';

type Tone = 'good' | 'warn' | 'bad' | 'muted';

// Every status is conveyed by text as well as colour (NFR-4).
const TONE_CLS: Record<Tone, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  bad: 'bg-red-500/10 text-red-600 dark:text-red-400',
  muted: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
};

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE_CLS[tone]}`}>
      {children}
    </span>
  );
}

function Pending() {
  return <span className="font-sans text-slate-400">检测中…</span>;
}

function Failed() {
  return <span className="font-sans text-slate-400">获取失败</span>;
}

/** Label / value row used inside the result cards. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hyper-lightBorder/60 py-2.5 text-sm last:border-b-0 dark:border-hyper-darkBorder/60">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static copy
// ---------------------------------------------------------------------------

// FAQ copy mirrors the FAQPage JSON-LD in claude-ip/index.html
// VERBATIM (Google requires marked-up Q&A to be visible) — edit both together.
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: '检测的是哪个 IP？',
    a: '浏览器访问 claude.ai 时实际使用的出口 IP。走代理时是代理节点的 IP，直连时是本机宽带的公网 IP。',
  },
  {
    q: '为什么会显示三个不同的 IP？',
    a: '代理软件通常按规则分流：国内网站直连、Claude 走代理。三个 IP 分别对应国内直连、Cloudflare 默认线路和 Claude 线路。',
  },
  {
    q: '风险评分准吗？',
    a: '评分根据第三方 IP 情报（机房、VPN、代理、Tor、滥用记录）估算，仅供参考；Claude 的实际风控规则不公开。',
  },
  {
    q: 'IP 会影响 Claude 封号吗？',
    a: 'IP 是风控参考的因素之一：出口不在支持地区、被标记为 VPN / 代理 / 滥用，或与浏览器时区、语言明显不一致，都会增加风险。账号的注册方式、付款方式和使用行为同样重要，本页只检测网络环境，结果仅供参考。',
  },
  {
    q: '什么是原生 IP？',
    a: '出口 IP 的注册国家或地区与机房实际所在地一致，即为原生 IP；跨地区广播使用的属于广播 IP，部分平台对广播 IP 风控更严。本页按该 IP 在区域互联网注册机构（RIR）登记的国家与定位国家是否一致来判定。',
  },
  {
    q: '住宅 IP 和机房 IP 有什么区别？',
    a: '住宅 IP（家庭宽带 IP）由运营商分配给家庭用户；机房 IP 属于云服务器和 IDC，常被代理、爬虫和自动化程序使用，各平台对它的风控通常更严，本页把机房 IP 记为风险项。',
  },
  {
    q: '风控值多少算安全？',
    a: '业界通行参考：15% 以内为极度纯净，25% 以内为纯净，40% 以内为中性，50% 以上风险较高，70% 以上多数平台会直接拦截。评分仅供参考，以 Claude 实际风控为准。',
  },
  {
    q: '检测会记录我的 IP 吗？',
    a: '只有 Claude 出口 IP 会发送到本站接口查询 IP 情报，查询结果缓存 24 小时、不做其他保存；国内 IP 不会发送到本站，历史记录只保存在你的浏览器里。',
  },
  {
    q: 'Claude Code 也走这个出口吗？',
    a: '不一定。本页测的是浏览器的线路；Claude Code 命令行默认不读系统代理，需要设置 HTTPS_PROXY 或使用 TUN 模式才会走同一出口。',
  },
];

// "检测原理" section: one short paragraph per check, prerendered for crawlers.
const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: '检测结论怎么判定',
    body: '出口地区、IP 类型、风险标记、原生 IP、分流一致、WebRTC、时区和语言 8 项核心检测全部通过，才会显示「全部通过：未发现已知风险」；机房 IP 按风险处理，任一项未完成都会显示检测不完整。延迟、ASN、指纹等信息只作参考，不计入结论。',
  },
  {
    title: '出口 IP 是怎么测的',
    body: '浏览器向 claude.ai、api.anthropic.com 和 1.1.1.1 的 /cdn-cgi/trace 发起请求，Cloudflare 在响应中返回它看到的来源 IP 和国家。代理软件按域名分流，所以三个请求可能走三条不同的线路；my.ip.cn 是国内站点、通常直连，用它看到真实的国内出口。',
  },
  {
    title: '风险评分是怎么算的',
    body: '只有 Claude 出口 IP 会被发送到本站 /api/ip 接口，由接口查询第三方 IP 情报（ipapi.is）的机房、VPN、代理、Tor、滥用与爬虫标记并扣分，并通过 RIPEstat 查询该 IP 的 RIR 注册国家用于原生 IP 判定；查询结果在边缘缓存 24 小时，本站不做其他保存。',
  },
  {
    title: '连接延迟是怎么测的',
    body: '对 claude.ai 和 api.anthropic.com 各发两次 /cdn-cgi/trace，第一次预热连接，第二次计时，测得的大约是到 Cloudflare 边缘节点的一个往返延迟，不代表模型响应速度。',
  },
  {
    title: 'WebRTC 泄露是怎么测的',
    body: '向 Google 与 Cloudflare 的 STUN 服务器发起 ICE 探测，收集最多 5 秒内的公网候选地址。若出现与 Claude 出口不同的公网地址（尤其是真实国内 IP），说明 UDP 流量绕过了代理。',
  },
  {
    title: '环境信息会外发吗',
    body: '时区、语言、操作系统、浏览器、Cookie 状态与 Canvas / WebGL 指纹都只在你的浏览器本地读取，用于核对环境指纹与出口是否一致，不会发送到任何服务器。',
  },
];

const STATUS_LABELS: Record<ClaudeStatus, string> = {
  none: '全部正常',
  minor: '轻微故障',
  major: '重大故障',
  critical: '严重故障',
  maintenance: '维护中',
};

// ipapi.is company.abuser_score level → Chinese labels.
const ABUSER_LEVEL_LABELS: Record<string, string> = {
  'Very Low': '极低',
  Low: '低',
  Elevated: '偏高',
  High: '高',
  'Very High': '极高',
};

// ipapi.is location.accuracy → human-readable Chinese labels.
const ACCURACY_LABELS: Record<string, string> = {
  VERY_HIGH: '极高',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

// R12 flags (datacenter is conveyed through the IP type row instead).
const FLAGS: { key: keyof NonNullable<IpInfo['risk']>; label: string }[] = [
  { key: 'vpn', label: 'VPN' },
  { key: 'proxy', label: '代理' },
  { key: 'tor', label: 'Tor' },
  { key: 'abuser', label: '滥用记录' },
  { key: 'crawler', label: '爬虫' },
];

// ---------------------------------------------------------------------------
// Pure helpers for the derived verdicts (all run in the browser only)
// ---------------------------------------------------------------------------

// ok-phase data may still be null (e.g. collectWebRtcIps → null when
// RTCPeerConnection is unavailable); read sites null-check explicitly.
type CheckState<T> =
  | { phase: 'pending' | 'failed'; data: null }
  | { phase: 'ok'; data: T | null };

/** Current UTC offset of an IANA time zone in minutes (standard tz-offset trick). */
function tzOffsetMinutes(timeZone: string): number | null {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    return Math.round((asUtc - now.getTime()) / 60000);
  } catch {
    return null;
  }
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

// ipapi.is abuser_score comes as "0.0195 (Elevated)" — a ratio plus a level tag
// (which may contain a space, e.g. "Very Low"). Convert the ratio to a percentage.
function abuserScoreView(raw: string): { pct: number; level: string | null } | null {
  const m = /^([\d.]+)(?:\s*\(([^)]+)\))?$/.exec(raw.trim());
  if (!m) return null;
  const ratio = Number(m[1]);
  if (!Number.isFinite(ratio)) return null;
  return { pct: Math.round(ratio * 1000) / 10, level: m[2] ?? null };
}

// Current wall-clock time in an IANA time zone, computed in the browser so it
// never goes stale behind the API cache (e.g. "2026/10/21 17:53:14").
function timeInZone(timeZone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

// 原生 IP: the IP block's RIR registration country matches where the IP is
// located; otherwise it is a broadcast IP (registered in one country,
// announced in another). The ASN's country is not used: leased blocks and
// multinational operators would be misjudged. Null when either side is unknown.
function nativeVerdict(
  registeredCountry: string | null,
  geoCountry: string | null,
): { text: string; tone: Tone } | null {
  if (!registeredCountry || !geoCountry) return null;
  if (registeredCountry === geoCountry.toUpperCase()) return { text: '原生 IP', tone: 'good' };
  return { text: `广播 IP（注册地：${regionName(registeredCountry) ?? registeredCountry}）`, tone: 'warn' };
}

/** Human-readable direction, e.g. "Claude 慢 15 小时" when the exit lags local time. */
function tzDiffLabel(localOffset: number, exitOffset: number): string {
  const hours = Math.round((exitOffset - localOffset) / 60);
  if (hours === 0) return '与本地时区相同';
  return hours < 0 ? `Claude 慢 ${Math.abs(hours)} 小时` : `Claude 快 ${hours} 小时`;
}

// R18: compare the browser's current UTC offset with the Claude exit time zone.
function timezoneVerdict(
  env: EnvironmentInfo,
  exitTimezone: string | null,
  exitCc: string | null,
): { text: string; tone: Tone } | null {
  if (!exitTimezone) return null;
  const exitOffset = tzOffsetMinutes(exitTimezone);
  if (exitOffset === null) return null;
  const diff = Math.abs(env.offsetMinutes - exitOffset);
  if (diff <= 60) return { text: '与出口一致', tone: 'good' };
  const isCnBrowser = env.timeZone === 'Asia/Shanghai' || env.timeZone === 'Asia/Urumqi';
  const hours = Math.round(diff / 60);
  if (isCnBrowser && exitCc !== 'CN') {
    return { text: `浏览器为北京时间，与出口地区不一致（相差约 ${hours} 小时）`, tone: 'bad' };
  }
  return { text: `与出口不一致（相差约 ${hours} 小时）`, tone: 'bad' };
}

// R19: compare the primary language subtag with the exit country's languages.
function languageVerdict(
  languages: readonly string[],
  exitCc: string | null,
): { text: string; tone: Tone } | null {
  const common = exitCc ? COUNTRY_LANGUAGES[exitCc] : undefined;
  if (!common) return null;
  const primary = languages[0]?.split('-')[0]?.toLowerCase() ?? '';
  if (!primary) return null;
  return common.includes(primary)
    ? { text: '与出口匹配', tone: 'good' }
    : { text: '与出口常用语言不一致', tone: 'warn' };
}

// R17: interpret the collected WebRTC candidate addresses.
function webrtcVerdict(
  ips: string[] | null,
  claudeIp: string | null,
  domesticIp: string | null,
): { text: string; tone: Tone } | null {
  // Disabled WebRTC cannot leak, so it passes.
  if (ips === null) return { text: 'WebRTC 已禁用（不会泄露）', tone: 'good' };
  // Without the Claude exit IP only an exposed domestic IP is a certain leak.
  if (claudeIp === null) {
    return domesticIp !== null && ips.includes(domesticIp)
      ? { text: '检测到泄露：UDP 直连暴露了真实国内 IP', tone: 'bad' }
      : { text: '无法判定：未获取到 Claude 出口 IP', tone: 'muted' };
  }
  const leaked = ips.filter((ip) => ip !== claudeIp);
  if (leaked.length === 0) return { text: '未检测到泄露', tone: 'good' };
  const exposesDomestic = domesticIp !== null && leaked.includes(domesticIp);
  return {
    text: exposesDomestic
      ? '检测到泄露：UDP 直连暴露了真实国内 IP'
      : '检测到泄露：存在与出口不同的公网地址',
    tone: 'bad',
  };
}

// ---------------------------------------------------------------------------
// Core checks behind the summary verdict ("全部通过：未发现已知风险")
// ---------------------------------------------------------------------------

type Verdict = { text: string; tone: Tone };

type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown' | 'pending';

interface CoreCheck {
  label: string;
  status: CheckStatus;
  result: string;
  fix: string | null; // how to turn the check green; set for warn / fail only
}

const TONE_STATUS: Record<Tone, CheckStatus> = {
  good: 'pass',
  warn: 'warn',
  bad: 'fail',
  muted: 'unknown',
};

/** One core check from its verdict; a null verdict means it could not be determined. */
function coreCheck(label: string, pending: boolean, verdict: Verdict | null, fix: string): CoreCheck {
  if (pending) return { label, status: 'pending', result: '检测中…', fix: null };
  if (!verdict) return { label, status: 'unknown', result: '无法检测', fix: null };
  const status = TONE_STATUS[verdict.tone];
  return { label, status, result: verdict.text, fix: status === 'warn' || status === 'fail' ? fix : null };
}

// R11: supported-region verdict from the claude.ai trace `loc`.
function regionVerdict(loc: string | null): Verdict | null {
  if (!loc) return null;
  const name = regionName(loc) ?? loc;
  return SUPPORTED_REGIONS.has(loc)
    ? { text: `在 Claude 支持地区（${name}）`, tone: 'good' }
    : { text: `不在 Claude 支持地区（${name}）`, tone: 'bad' };
}

// 机房 IP is a red risk; residential and mobile networks pass.
function ipTypeVerdict(type: IpInfo['type']): Verdict | null {
  switch (type) {
    case 'residential':
      return { text: '家庭宽带', tone: 'good' };
    case 'mobile':
      return { text: '移动网络', tone: 'good' };
    case 'datacenter':
      return { text: '机房 IP', tone: 'bad' };
    case 'other':
      return { text: '其他网络（企业、教育等）', tone: 'warn' };
    default:
      return null;
  }
}

function flagsVerdict(risk: IpInfo['risk']): Verdict | null {
  if (!risk) return null;
  const hits = FLAGS.filter((flag) => risk[flag.key]).map((flag) => flag.label);
  return hits.length === 0
    ? { text: 'VPN、代理、Tor、滥用、爬虫均未命中', tone: 'good' }
    : { text: `命中：${hits.join('、')}`, tone: 'bad' };
}

// R15: claude.ai and api.anthropic.com should leave through the same exit.
function routeVerdict(claudeIp: string | null, apiIp: string | null): Verdict | null {
  if (!claudeIp || !apiIp) return null;
  return claudeIp === apiIp
    ? { text: 'claude.ai 与 api.anthropic.com 同一出口', tone: 'good' }
    : { text: 'claude.ai 与 api.anthropic.com 出口不同', tone: 'warn' };
}

/** Flag emoji from an ISO-2 code (falls back to the two-letter code on Windows fonts). */
function flagEmoji(cc: string | null | undefined): string {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

// The domestic echo services only return a Chinese-language location text
// (the exit IP itself is never sent to our API — privacy promise), so the
// flag is derived from that text and shown only when it clearly means China.
function domesticFlag(location: string | null | undefined): string {
  return location && location.includes('中国') ? flagEmoji('CN') : '';
}

/** Environment card row: bold label left, mono value right. */
function EnvRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
      <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      <span className="text-right font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
        {children}
      </span>
    </div>
  );
}

/** IP protocol version label from the address shape ('v6' addresses contain ':'). */
function ipVersion(ip: string): 'IPv4' | 'IPv6' | null {
  if (!ip) return null;
  if (ip.includes(':')) return 'IPv6';
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) ? 'IPv4' : null;
}

/** Exit-IP card: title, masked-or-full IP, country / location note. */
function ExitCard({
  title,
  hint,
  phase,
  ip,
  note,
  hideIp,
  highlight,
  flag,
}: {
  title: string;
  hint: string;
  phase: 'pending' | 'ok' | 'failed';
  ip: string | null;
  note: string | null;
  hideIp: boolean;
  highlight?: boolean;
  flag?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? 'border-hyper-orange/50 bg-hyper-lightCard dark:bg-hyper-darkCard'
          : 'border-hyper-lightBorder bg-hyper-lightCard dark:border-hyper-darkBorder dark:bg-hyper-darkCard'
      }`}
    >
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="font-mono text-lg font-black break-all text-slate-900 dark:text-white">
        {phase === 'ok' && flag && <span className="mr-1.5">{flag}</span>}
        {phase === 'ok' && ip && !hideIp && ipVersion(ip) && (
          <span className="mr-1.5 rounded bg-slate-200/80 px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {ipVersion(ip)}
          </span>
        )}
        {phase === 'pending' ? <Pending /> : phase === 'failed' ? <Failed /> : hideIp ? maskIp(ip ?? '') : (ip ?? '—')}
      </div>
      <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {phase === 'ok' ? (note ?? '') : hint}
      </div>
    </div>
  );
}

/** Timing cell for the connectivity card (R14). */
function TimingCell({ state }: { state: CheckState<number> }) {
  if (state.phase === 'pending') return <Pending />;
  if (state.phase === 'failed' || state.data === null) return <Badge tone="bad">无法访问</Badge>;
  const slow = state.data >= 500;
  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={slow ? 'warn' : 'good'}>{slow ? '较慢' : '正常'}</Badge>
      <span>{state.data} ms</span>
    </span>
  );
}

// Severity order: problems first once every check has finished.
const STATUS_ORDER: CheckStatus[] = ['fail', 'warn', 'unknown', 'pass', 'pending'];

const STATUS_STYLE: Record<CheckStatus, { glyph: string; label: string; icon: string; text: string; bar: string }> = {
  pass: { glyph: '✓', label: '通过', icon: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  warn: { glyph: '!', label: '注意', icon: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  fail: { glyph: '✕', label: '风险', icon: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
  unknown: { glyph: '?', label: '未知', icon: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bar: 'bg-slate-400' },
  pending: { glyph: '…', label: '检测中', icon: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-400', bar: 'bg-slate-200 dark:bg-slate-700' },
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      role="img"
      aria-label={style.label}
      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white ${style.icon}`}
    >
      {style.glyph}
    </span>
  );
}

/** Collapsed block for informational rows that never affect the verdict. */
function Details({ children }: { children: ReactNode }) {
  return (
    <details className="group/details mt-2 border-t border-hyper-lightBorder/60 pt-1 dark:border-hyper-darkBorder/60">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-sm font-bold text-slate-500 dark:text-slate-400 [&::-webkit-details-marker]:hidden">
        详细信息（不计入检测结论）
        <span className="font-mono text-lg text-hyper-orange transition group-open/details:rotate-45">＋</span>
      </summary>
      {children}
    </details>
  );
}

/** Headline verdict over the eight core checks, with a fix tip for every non-green item. */
function CheckSummary({
  checks,
  checkedAt,
  onRecheck,
}: {
  checks: CoreCheck[];
  checkedAt: Date | null;
  onRecheck: () => void;
}) {
  const count = (status: CheckStatus) => checks.filter((check) => check.status === status).length;
  const pass = count('pass');
  const warn = count('warn');
  const fail = count('fail');
  const unknown = count('unknown');
  const pending = count('pending');

  // "全部通过" only when every core check passed; anything unfinished or
  // undeterminable keeps the verdict away from green.
  const headline =
    pending > 0
      ? { text: `检测中 ${checks.length - pending}/${checks.length}`, cls: 'text-slate-500 dark:text-slate-400' }
      : fail > 0
        ? { text: `${fail + warn} 项需处理，处理前不建议登录 Claude`, cls: STATUS_STYLE.fail.text }
        : warn > 0
          ? { text: `${warn} 项需注意`, cls: STATUS_STYLE.warn.text }
          : unknown > 0
            ? { text: `检测不完整：${unknown} 项未能完成`, cls: STATUS_STYLE.unknown.text }
            : { text: '全部通过：未发现已知风险', cls: STATUS_STYLE.pass.text };

  // Keep the fixed order while running so rows don't jump around.
  const rows =
    pending > 0
      ? checks
      : [...checks].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <section className={CARD_CLS} aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black tracking-tight md:text-2xl ${headline.cls}`}>{headline.text}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {checks.length} 项核心检测：{pass} 项通过 · {warn} 项注意 · {fail} 项风险
            {unknown > 0 && ` · ${unknown} 项未完成`}
            {checkedAt && ` · ${checkedAt.toLocaleTimeString('zh-CN', { hour12: false })} 检测`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRecheck}
          className="shrink-0 rounded-xl border border-hyper-lightBorder px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-hyper-orange/50 hover:text-hyper-orange active:scale-95 dark:border-hyper-darkBorder dark:text-slate-300"
        >
          重新检测
        </button>
      </div>

      <div className="mt-4 flex gap-1" aria-hidden="true">
        {rows.map((check) => (
          <div key={check.label} className={`h-1.5 flex-1 rounded-full ${STATUS_STYLE[check.status].bar}`} />
        ))}
      </div>

      <ul className="mt-3 divide-y divide-hyper-lightBorder/60 dark:divide-hyper-darkBorder/60">
        {rows.map((check) => (
          <li key={check.label} className="grid grid-cols-[1.25rem_5rem_minmax(0,1fr)] gap-3 py-3 text-sm">
            <StatusIcon status={check.status} />
            <span className="text-slate-500 dark:text-slate-400">{check.label}</span>
            <div>
              <span className={check.status === 'pass' ? 'text-slate-900 dark:text-slate-100' : STATUS_STYLE[check.status].text}>
                {check.status === 'warn' || check.status === 'fail' || check.status === 'unknown'
                  ? `${STATUS_STYLE[check.status].label} · ${check.result}`
                  : check.result}
              </span>
              {check.fix && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">怎么变绿：{check.fix}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        全部通过表示当前网络环境未命中已知风险项，不代表 Claude 官方判定；账号的注册、支付与使用方式同样会影响风控。
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Claude IP risk check landing page ("/claude-ip"): three exit IPs,
 * risk assessment of the Claude exit, connectivity, WebRTC leak, local
 * environment, history — plus static explainer + FAQ for SEO.
 */
export default function ClaudeRiskCheckPage() {
  const [hideIp, setHideIp] = useState(false);
  const [claudeTrace, setClaudeTrace] = useState<CheckState<Trace>>({ phase: 'pending', data: null });
  const [cfTrace, setCfTrace] = useState<CheckState<Trace>>({ phase: 'pending', data: null });
  const [apiTrace, setApiTrace] = useState<CheckState<Trace>>({ phase: 'pending', data: null });
  const [domestic, setDomestic] = useState<CheckState<DomesticIp>>({ phase: 'pending', data: null });
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [ipInfoPhase, setIpInfoPhase] = useState<'pending' | 'ok'>('pending');
  const [claudeTiming, setClaudeTiming] = useState<CheckState<number>>({ phase: 'pending', data: null });
  const [apiTiming, setApiTiming] = useState<CheckState<number>>({ phase: 'pending', data: null });
  const [status, setStatus] = useState<CheckState<ClaudeStatus>>({ phase: 'pending', data: null });
  const [webrtc, setWebrtc] = useState<CheckState<string[]>>({ phase: 'pending', data: null });
  // Environment and history are local-only reads; skipped under automation so
  // the prerendered snapshot never carries build-machine data (R3).
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  // Bumped on every (re-)run; results from an older run are dropped so a
  // re-check never mixes data from two runs.
  const runRef = useRef(0);

  const runChecks = useCallback(() => {
    const run = ++runRef.current;
    const live = () => runRef.current === run;
    const pending = { phase: 'pending' as const, data: null };

    setClaudeTrace(pending);
    setCfTrace(pending);
    setApiTrace(pending);
    setDomestic(pending);
    setIpInfo(null);
    setIpInfoPhase('pending');
    setClaudeTiming(pending);
    setApiTiming(pending);
    setStatus(pending);
    setWebrtc(pending);
    setEnv(readEnvironment());
    setHistory(loadHistory());
    setCheckedAt(new Date());

    // Independent checks start in parallel (NFR-1); each fails on its own (R9).
    fetchTrace(CLAUDE_HOST).then(
      (trace) => {
        if (!live()) return;
        setClaudeTrace({ phase: 'ok', data: trace });
        // History is localStorage-only, never sent anywhere (R21).
        setHistory(recordHistory(trace.ip, trace.loc));
        // The only server call: enrich the Claude exit IP (R12).
        lookupIp(trace.ip).then((info) => {
          if (!live()) return;
          setIpInfo(info);
          setIpInfoPhase('ok');
        });
      },
      () => live() && setClaudeTrace({ phase: 'failed', data: null }),
    );

    fetchTrace(CF_HOST).then(
      (trace) => live() && setCfTrace({ phase: 'ok', data: trace }),
      () => live() && setCfTrace({ phase: 'failed', data: null }),
    );

    fetchDomesticIp().then(
      (data) => live() && setDomestic({ phase: 'ok', data }),
      () => live() && setDomestic({ phase: 'failed', data: null }),
    );

    fetchTrace(API_HOST).then(
      (trace) => live() && setApiTrace({ phase: 'ok', data: trace }),
      () => live() && setApiTrace({ phase: 'failed', data: null }),
    );

    timeTrace(CLAUDE_HOST).then(
      (ms) => live() && setClaudeTiming({ phase: 'ok', data: ms }),
      () => live() && setClaudeTiming({ phase: 'failed', data: null }),
    );

    timeTrace(API_HOST).then(
      (ms) => live() && setApiTiming({ phase: 'ok', data: ms }),
      () => live() && setApiTiming({ phase: 'failed', data: null }),
    );

    // R16: the row is hidden when the status endpoint fails.
    fetchClaudeStatus().then(
      (indicator) => live() && setStatus({ phase: 'ok', data: indicator }),
      () => live() && setStatus({ phase: 'failed', data: null }),
    );

    collectWebRtcIps().then(
      (ips) => live() && setWebrtc({ phase: 'ok', data: ips }),
      () => live() && setWebrtc({ phase: 'failed', data: null }),
    );
  }, []);

  useEffect(() => {
    // Prerender / automation: placeholders only, no detection runs (R3).
    if (isAutomation()) return;
    runChecks();
  }, [runChecks]);

  // ----------------------------- Derived state -----------------------------

  const claudeIp = claudeTrace.data?.ip ?? null;
  const claudeLoc = claudeTrace.data?.loc ?? null;
  const cfIp = cfTrace.data?.ip ?? null;
  const apiIp = apiTrace.data?.ip ?? null;
  const domesticIp = domestic.data?.ip ?? null;
  const exitTz = ipInfo?.timezone ?? null;
  const exitOffset = exitTz ? tzOffsetMinutes(exitTz) : null;
  const native = ipInfo ? nativeVerdict(ipInfo.registeredCountry, ipInfo.countryCode) : null;
  const typeVerdict = ipInfo ? ipTypeVerdict(ipInfo.type) : null;

  // R11: supported-region verdict from the trace `loc` (null = unknown).
  const regionSupported: boolean | null =
    claudeTrace.phase !== 'ok' || claudeLoc === null ? null : SUPPORTED_REGIONS.has(claudeLoc);

  // R13 + R11: API score, forced to 0 when the exit region is unsupported.
  const apiScore = ipInfo?.score ?? null;
  const score = apiScore !== null && regionSupported === false ? 0 : apiScore;
  const scoreLabel =
    score === null ? null : score >= 80 ? '低风险' : score >= 50 ? '中风险' : '高风险';

  // R10: route note across the three exits.
  let routeNote: string | null = null;
  if (claudeIp && cfIp && claudeIp !== cfIp) {
    routeNote = 'Claude 出口与 Cloudflare 默认出口不同：Claude 流量走了单独的分流线路。';
  } else if (claudeIp && cfIp && domesticIp && claudeIp === domesticIp) {
    routeNote = '三个出口相同：当前所有流量都从同一个出口出去（全局代理模式或未开代理）。';
  }

  // R15: api.anthropic.com exit consistency with the claude.ai exit.
  const apiMismatch = claudeIp !== null && apiIp !== null && apiIp !== claudeIp;

  const tzVerdict = env && claudeTrace.phase === 'ok' ? timezoneVerdict(env, exitTz, claudeLoc) : null;
  const langVerdict = env && claudeLoc ? languageVerdict(env.languages, claudeLoc) : null;
  const wbVerdict =
    webrtc.phase === 'ok' ? webrtcVerdict(webrtc.data, claudeIp, domesticIp) : null;

  const risk = ipInfo?.risk ?? null;

  // The eight core checks behind the summary verdict. Informational rows
  // (ASN domain, company, coordinates, fingerprints, latency) never count.
  const exitPending =
    claudeTrace.phase === 'pending' || (claudeTrace.phase === 'ok' && ipInfoPhase === 'pending');
  const exitLangs = claudeLoc ? COUNTRY_LANGUAGES[claudeLoc] : undefined;
  const checks: CoreCheck[] = [
    coreCheck(
      '出口地区',
      claudeTrace.phase === 'pending',
      regionVerdict(claudeLoc),
      '换用美国、日本、新加坡等支持地区的节点（香港节点不在支持范围）',
    ),
    coreCheck('IP 类型', exitPending, typeVerdict, '换用家庭宽带或原生住宅 IP 节点'),
    coreCheck('风险标记', exitPending, flagsVerdict(risk), '该 IP 已被 IP 情报库标记，建议更换节点'),
    coreCheck('原生 IP', exitPending, native, '选择注册地与出口地一致的节点'),
    coreCheck(
      '分流一致',
      claudeTrace.phase === 'pending' || apiTrace.phase === 'pending',
      routeVerdict(claudeIp, apiIp),
      '把 claude.ai 与 anthropic.com 放进同一条代理规则',
    ),
    coreCheck(
      'WebRTC',
      webrtc.phase === 'pending' || claudeTrace.phase === 'pending' || domestic.phase === 'pending',
      wbVerdict,
      '在浏览器中禁用 WebRTC，或改用 TUN 模式让 UDP 流量也走代理',
    ),
    coreCheck(
      '时区',
      !env || exitPending,
      tzVerdict,
      `把系统时区改成出口所在地时区${exitTz ? `（${exitTz}）` : ''}`,
    ),
    coreCheck(
      '语言',
      !env || claudeTrace.phase === 'pending',
      langVerdict,
      `把浏览器首选语言改成出口所在地常用语言${exitLangs ? `（${exitLangs.join(' / ')}）` : ''}`,
    ),
  ];

  // ------------------------------- Render ---------------------------------

  return (
    <StandaloneShell>
      {/* ================= Hero ================= */}
      <section className="relative mx-auto max-w-4xl px-6 pb-8 pt-14 text-center">
        {/* Single-topic H1: this page targets "Claude IP 检测 / IP 纯净度" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet bg-clip-text text-transparent">
            Claude IP 风险检测
          </span>
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          免费检测 Claude 出口 IP 质量：风控值与纯净度评分、原生 IP 判定、机房还是家庭宽带、VPN /
          代理 / Tor 风险与 WebRTC 泄露，无需登录。
        </p>

        {/* R22: hide-IP toggle, default off, not persisted */}
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span className="relative inline-block">
            <input
              type="checkbox"
              checked={hideIp}
              onChange={(e) => setHideIp(e.target.checked)}
              className="peer sr-only"
            />
            <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-hyper-orange dark:bg-slate-600" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
          隐藏 IP
        </label>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-6 pb-16">
        {/* ================= Summary verdict over the core checks ================= */}
        <CheckSummary checks={checks} checkedAt={checkedAt} onRecheck={runChecks} />

        {/* ================= Three exit IPs (R6, R7, R8, R10) ================= */}
        <section className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <ExitCard
              title="国内直连出口"
              hint="国内回显站，通常不经过代理"
              phase={domestic.phase}
              ip={domestic.data?.ip ?? null}
              note={domestic.data?.location ?? null}
              hideIp={hideIp}
              flag={domesticFlag(domestic.data?.location)}
            />
            <ExitCard
              title="Cloudflare 默认出口"
              hint="IP 直连，不匹配域名分流规则"
              phase={cfTrace.phase}
              ip={cfIp}
              note={cfTrace.data?.loc ? (regionName(cfTrace.data.loc) ?? cfTrace.data.loc) : null}
              hideIp={hideIp}
              flag={flagEmoji(cfTrace.data?.loc)}
            />
            <ExitCard
              title="Claude 出口"
              hint="与访问 claude.ai 同一条线路"
              phase={claudeTrace.phase}
              ip={claudeIp}
              note={claudeLoc ? (regionName(claudeLoc) ?? claudeLoc) : null}
              hideIp={hideIp}
              highlight
              flag={flagEmoji(claudeLoc)}
            />
          </div>
          {routeNote && (
            <p className="rounded-xl bg-hyper-indigo/10 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
              {routeNote}
            </p>
          )}
        </section>

        {/* ================= Risk card (R11, R12, R13) ================= */}
        <section className={CARD_CLS}>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-black tracking-tight">
            <span className="h-4 w-1 rounded-full bg-hyper-orange" />
            Claude 出口风险评估
          </h2>

          {claudeTrace.phase === 'failed' && (
            <p className="mb-4 rounded-xl bg-slate-500/10 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              无法检测：获取 Claude 出口 IP 失败。
            </p>
          )}

          {regionSupported === false && (
            <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
              当前出口不在 Claude 支持地区
              {claudeLoc ? `（${regionName(claudeLoc) ?? claudeLoc}）` : ''}，评分已按最高风险处理。
            </p>
          )}

          {/* Score + label + estimate note */}
          <div className="mb-1 flex items-baseline gap-3">
            {claudeTrace.phase === 'pending' ? (
              <span className="text-2xl font-black">
                <Pending />
              </span>
            ) : claudeTrace.phase === 'failed' ? (
              <span className="text-2xl font-black text-slate-400">无法检测</span>
            ) : ipInfoPhase === 'pending' ? (
              <span className="text-2xl font-black">
                <Pending />
              </span>
            ) : score === null ? (
              <span className="text-2xl font-black text-slate-400">暂无数据</span>
            ) : (
              <>
                <span
                  className={`text-5xl font-black ${
                    score >= 80
                      ? 'text-emerald-500'
                      : score >= 50
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  {score}
                </span>
                <Badge tone={score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad'}>
                  {scoreLabel}
                </Badge>
              </>
            )}
          </div>
          {score !== null && (
            <>
              {/* One-line verdict under the score, competitor-style. */}
              <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {score >= 80 ? '该 IP 风险较低' : score >= 50 ? '该 IP 存在一定风险' : '该 IP 风险较高'}
              </p>
              {/* Gradient risk gauge: red (0, risky) to green (100, trusted). */}
              <div className="mb-1">
                <div className="relative h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
                  <div
                    className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10"
                    style={{ left: `calc(${Math.min(Math.max(score, 0), 100)}% - 3px)` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>0 高危</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100 可信</span>
                </div>
              </div>
            </>
          )}
          <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
            估算值，仅供参考，以 Claude 实际风控为准
          </p>

          <div>
            <Row label="支持地区">
              {regionSupported === null ? (
                <Badge tone="muted">未知</Badge>
              ) : regionSupported ? (
                <Badge tone="good">在支持地区</Badge>
              ) : (
                <Badge tone="bad">不支持</Badge>
              )}
            </Row>
            <Row label="地区 / 城市">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo && (ipInfo.countryCode || ipInfo.region || ipInfo.city) ? (
                <span>
                  {flagEmoji(ipInfo.countryCode)}{' '}
                  {[ipInfo.country, ipInfo.region, ipInfo.city].filter(Boolean).join(' · ') || '—'}
                </span>
              ) : (
                '—'
              )}
            </Row>
            <Row label="IP 类型">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : typeVerdict ? (
                <Badge tone={typeVerdict.tone}>{typeVerdict.text}</Badge>
              ) : (
                <Badge tone="muted">未知</Badge>
              )}
            </Row>
            <Row label="ASN / 组织">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo && (ipInfo.asn !== null || ipInfo.org) ? (
                `${ipInfo.asn !== null ? `AS${ipInfo.asn}` : '—'}${
                  ipInfo.org ? ` · ${ipInfo.org}` : ''
                }`
              ) : (
                '—'
              )}
            </Row>
            <Row label="原生 IP">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : native ? (
                <Badge tone={native.tone}>{native.text}</Badge>
              ) : (
                <Badge tone="muted">未知</Badge>
              )}
            </Row>
            {FLAGS.map((flag) => (
              <Row key={flag.key} label={flag.label}>
                {risk ? (
                  <Badge tone={risk[flag.key] ? 'bad' : 'good'}>{risk[flag.key] ? '是' : '否'}</Badge>
                ) : (
                  <Badge tone="muted">未知</Badge>
                )}
              </Row>
            ))}
          </div>

          {/* Informational rows: shown on demand, never coloured, never counted */}
          <Details>
            <Row label="ASN 注册地">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.asnCountry ? (
                regionName(ipInfo.asnCountry) ?? ipInfo.asnCountry
              ) : (
                '—'
              )}
            </Row>
            <Row label="ASN 域名">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.asnDomain ? (
                <a
                  href={`https://${ipInfo.asnDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-400/50 underline-offset-4 transition hover:text-hyper-orange"
                >
                  {ipInfo.asnDomain}
                </a>
              ) : (
                '—'
              )}
            </Row>
            <Row label="企业">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.company?.name ? (
                `${ipInfo.company.name}${
                  ipInfo.company.type ? ` (${ipInfo.company.type})` : ''
                }`
              ) : (
                '—'
              )}
            </Row>
            <Row label="企业域名">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.company?.domain ? (
                ipInfo.company.domain
              ) : (
                '—'
              )}
            </Row>
            <Row label="企业风控值">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.company?.abuserScore ? (
                (() => {
                  // Render the ratio as a percentage with ipapi.is's own level, e.g. "2%（偏高）".
                  const view = abuserScoreView(ipInfo.company.abuserScore);
                  if (!view) return ipInfo.company.abuserScore;
                  const level = view.level ? (ABUSER_LEVEL_LABELS[view.level] ?? view.level) : null;
                  return `${view.pct}%${level ? `（${level}）` : ''}`;
                })()
              ) : (
                '—'
              )}
            </Row>
            <Row label="IDC">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.datacenterName ? (
                ipInfo.datacenterName
              ) : (
                '—'
              )}
            </Row>
            <Row label="连接类型">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo ? (
                ipInfo.isMobile
                  ? '移动网络'
                  : ipInfo.isSatellite
                    ? '卫星网络'
                    : ipInfo.isAnycast
                      ? 'Anycast'
                      : '—'
              ) : (
                '—'
              )}
            </Row>
            <Row label="置信度">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo?.accuracy ? (
                ACCURACY_LABELS[ipInfo.accuracy] ?? ipInfo.accuracy
              ) : (
                '—'
              )}
            </Row>
            <Row label="经纬度">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : ipInfo && ipInfo.latitude !== null && ipInfo.longitude !== null ? (
                `${ipInfo.latitude.toFixed(4)}, ${ipInfo.longitude.toFixed(4)}`
              ) : (
                '—'
              )}
            </Row>
            <Row label="出口当地时间">
              {claudeTrace.phase === 'pending' ? (
                <Pending />
              ) : exitTz && exitOffset !== null ? (
                `${timeInZone(exitTz)} ${formatOffset(exitOffset)}（${tzDiffLabel(
                  -new Date().getTimezoneOffset(),
                  exitOffset,
                )}）`
              ) : (
                '—'
              )}
            </Row>
          </Details>
        </section>

        {/* ================= Connectivity (R14, R15, R16) ================= */}
        <section className={CARD_CLS}>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-black tracking-tight">
            <span className="h-4 w-1 rounded-full bg-hyper-indigo" />
            连通性
          </h2>
          <div>
            <Row label="claude.ai 连接延迟">
              <TimingCell state={claudeTiming} />
            </Row>
            <Row label="api.anthropic.com 连接延迟">
              <TimingCell state={apiTiming} />
            </Row>
            {/* R16: the row is hidden when the status endpoint fails */}
            {status.phase !== 'failed' && (
              <Row label="Claude 官方状态">
                {status.phase === 'pending' || status.data === null ? (
                  <Pending />
                ) : (
                  <a
                    href="https://status.claude.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-slate-400/50 underline-offset-4 transition hover:text-hyper-orange"
                  >
                    <Badge
                      tone={
                        status.data === 'none'
                          ? 'good'
                          : status.data === 'maintenance'
                            ? 'muted'
                            : status.data === 'minor'
                              ? 'warn'
                              : 'bad'
                      }
                    >
                      {STATUS_LABELS[status.data]}
                    </Badge>
                  </a>
                )}
              </Row>
            )}
          </div>
          {apiMismatch && (
            <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              api.anthropic.com 出口与 claude.ai 不一致：Claude Code 与网页版可能从不同 IP 访问。
            </p>
          )}
        </section>

        {/* ================= WebRTC leak (R17) ================= */}
        <section className={CARD_CLS}>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-black tracking-tight">
            <span className="h-4 w-1 rounded-full bg-red-500" />
            WebRTC 泄露检测
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {webrtc.phase === 'pending' ? (
              <Pending />
            ) : webrtc.phase === 'failed' ? (
              <Failed />
            ) : (
              <Badge tone={wbVerdict?.tone ?? 'muted'}>{wbVerdict?.text ?? '未知'}</Badge>
            )}
            {webrtc.phase === 'ok' && webrtc.data && webrtc.data.length > 0 && (
              <span className="font-mono text-xs break-all text-slate-500 dark:text-slate-400">
                候选地址：
                {webrtc.data.map((ip, i) => (
                  <span key={`${ip}-${i}`}>
                    {i > 0 && '，'}
                    <span className="font-sans text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      [{ipVersion(ip) ?? '?'}]
                    </span>
                    {hideIp ? maskIp(ip) : ip}
                  </span>
                ))}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            系统代理模式通常只代理 TCP 流量；若 STUN 探测到国内 IP，说明 Claude 网页之外的
            UDP 请求绕过了代理，可能暴露真实地址。
          </p>
        </section>

        {/* ================= Environment (R18, R19, R20) ================= */}
        <section className={CARD_CLS}>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-black tracking-tight">
            <span className="h-4 w-1 rounded-full bg-emerald-500" />
            本地环境
          </h2>
          <div className="divide-y divide-hyper-lightBorder/60 dark:divide-hyper-darkBorder/60">
            {/* Time zone — competitor-style comparison block. */}
            <div className="py-3 first:pt-0">
              <div className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">时区</div>
              <div className="mb-2">
                {tzVerdict ? (
                  <Badge tone={tzVerdict.tone}>{tzVerdict.text}</Badge>
                ) : (
                  <Badge tone="muted">未知</Badge>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>本地：{env ? `${env.timeZone} (${formatOffset(env.offsetMinutes)})` : '检测中…'}</div>
                <div>
                  Claude 出口：
                  {exitTz
                    ? `${exitTz} (${formatOffset(tzOffsetMinutes(exitTz) ?? 0)})${
                        env ? ` — ${tzDiffLabel(env.offsetMinutes, tzOffsetMinutes(exitTz) ?? 0)}` : ''
                      }`
                    : '未知'}
                </div>
              </div>
            </div>
            {/* Language — same comparison style. */}
            <div className="py-3">
              <div className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">语言</div>
              <div className="mb-2">
                {langVerdict ? (
                  <Badge tone={langVerdict.tone}>{langVerdict.text}</Badge>
                ) : (
                  <Badge tone="muted">未知</Badge>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>本地：{env ? env.languages.join('，') : '检测中…'}</div>
                {claudeLoc && COUNTRY_LANGUAGES[claudeLoc] && (
                  <div>Claude 出口所在地常用：{COUNTRY_LANGUAGES[claudeLoc].join('、')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Informational rows: shown on demand, never counted */}
          <Details>
            <div className="divide-y divide-hyper-lightBorder/60 dark:divide-hyper-darkBorder/60">
              <EnvRow label="操作系统 / 浏览器">
                {env ? `${env.os} / ${env.browser}` : <Pending />}
              </EnvRow>
              <EnvRow label="Cookie">
                {env ? (env.cookiesEnabled ? '已启用' : '已禁用') : <Pending />}
              </EnvRow>
              <EnvRow label="WebGL 渲染器">
                {env ? (env.webglRenderer ?? '不支持') : <Pending />}
              </EnvRow>
              <EnvRow label="Canvas 指纹">
                {env ? (env.canvasFingerprint ?? '不支持') : <Pending />}
              </EnvRow>
              <EnvRow label="WebGL 指纹">
                {env ? (env.webglFingerprint ?? '不支持') : <Pending />}
              </EnvRow>
            </div>
          </Details>
        </section>

        {/* ================= History (R21) ================= */}
        <section className={CARD_CLS}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight">
              <span className="h-4 w-1 rounded-full bg-slate-400" />
              检测历史
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory(clearHistory())}
                className="rounded-xl border border-hyper-lightBorder px-3.5 py-1.5 text-xs font-bold text-slate-500 transition hover:border-red-400/60 hover:text-red-500 dark:border-hyper-darkBorder dark:text-slate-400"
              >
                清除
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">暂无记录。历史只保存在你的浏览器里，不会发送到任何服务器。</p>
          ) : (
            <ul className="divide-y divide-hyper-lightBorder/60 dark:divide-hyper-darkBorder/60">
              {history.map((entry) => (
                <li key={entry.t} className="flex flex-wrap items-center justify-between gap-x-4 py-2.5 text-sm">
                  <span className="font-mono font-semibold">
                    {hideIp ? maskIp(entry.ip) : entry.ip}
                    {entry.cc ? (
                      <span className="ml-2 font-sans text-xs text-slate-400">
                        {flagEmoji(entry.cc)} {regionName(entry.cc) ?? entry.cc}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {new Date(entry.t).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== How it works (static, prerendered; collapsed by default — text-heavy) ===== */}
        <details className={`group/principles ${CARD_CLS}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight">
              <span className="h-4 w-1 rounded-full bg-hyper-violet" />
              检测原理
            </h2>
            <span className="font-mono text-lg text-hyper-orange transition group-open/principles:rotate-45">＋</span>
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.title}>
                <h3 className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </details>

        {/* ================= FAQ (mirrors the JSON-LD verbatim) ================= */}
        <section>
          <h2 className="mb-5 flex items-center gap-2.5 text-xl font-black tracking-tight">
            <span className="h-4 w-1 rounded-full bg-hyper-orange" />
            <span className="text-hyper-orange">常见问题</span>
          </h2>
          <div className="grid gap-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard px-6 py-4 shadow-sm transition open:border-hyper-orange/40 dark:border-hyper-darkBorder dark:bg-hyper-darkCard"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="font-mono text-lg text-hyper-orange transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
          {/* Related deep-dive guides: internal links to the blog articles
              covering IPv6 proxy bypass and the timezone risk check. */}
          <div className="mt-5 rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard px-6 py-4 text-sm leading-relaxed shadow-sm dark:border-hyper-darkBorder dark:bg-hyper-darkCard">
            <span className="font-bold text-slate-900 dark:text-white">相关阅读：</span>
            <a href="/blog/claude-code-ipv6-issue" className="ml-2 text-hyper-orange hover:underline">
              Claude Code 关闭 IPv6 指南
            </a>
            <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
            <a href="/blog/claude-code-timezone-risk-check" className="text-hyper-orange hover:underline">
              Claude Code 时区自查指南
            </a>
          </div>
        </section>

      </div>
    </StandaloneShell>
  );
}
