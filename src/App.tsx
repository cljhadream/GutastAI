import { useEffect, useId, useRef, useState } from 'react';

/**
 * GutaskAI — standalone product landing page (site root).
 *
 * "Hyper Energy" design system: deep-space dark theme with an ignition-orange
 * accent, mono labels, particle grid background and glow elevation. Theme
 * defaults to the OS `prefers-color-scheme` and can be toggled manually via
 * a local `dark` class on the page wrapper.
 */

type Theme = 'dark' | 'light';

const VIDEO_SRC = 'https://boluoing.com/recharge-guide.mp4';
const QR_SRC = '/UI/wechat-qr-code.webp';

interface Plan {
  label: string;      // Eyebrow tag above the plan name
  name: string;
  price: number;      // Monthly price in CNY
  desc: string;
  cta: string;
  service: string;    // Service name passed to the modal
  featured?: boolean; // Recommended card (HOT, glow border)
  badge?: string;     // Floating badge on the featured card
}

const CHATGPT_PLANS: Plan[] = [
  {
    label: 'Daily Driver',
    name: 'Codex Plus',
    price: 145,
    desc: '官方标配独立算力，自用账号直接升级，零密码接入，日常高频写代码与架构思考助手。',
    cta: '添加企微 · 办理 Plus',
    service: 'Codex Plus（¥145/月）',
  },
  {
    label: 'Heavy Computing',
    name: 'Codex Pro 5X',
    price: 680,
    desc: '5 倍深度推理算力池，算法攻坚、微调代码库重度调用首选，全订阅周期硬核质保。',
    cta: '立即抢占 5X 算力',
    service: 'Codex Pro 5X（¥680/月）',
    featured: true,
    badge: '🔥 极客最爱 5X',
  },
  {
    label: 'Team & Enterprise',
    name: 'Codex Pro 20X',
    price: 1280,
    desc: '20 倍极限顶配算力专席，研发团队全天候无限制重度调度，支持对公打款与开具发票。',
    cta: '添加企微 · 咨询 20X 现席',
    service: 'Codex Pro 20X（¥1280/月）',
  },
];

const PROMISES = [
  { icon: '⚡', text: '自有账号办理' },
  { icon: '🛡️', text: '无需提供密码' },
  { icon: '🔄', text: '支持正常续费' },
  { icon: '💎', text: '全周期订阅保障' },
];

const STEPS = [
  { title: '选择套餐 / 准备账号', desc: '自有账号直接办理，无需提供账号密码。' },
  { title: '扫码接入 Gutask 企微', desc: '技术顾问 30 秒响应，沟通确认对应规格。' },
  { title: '通常几分钟内完成', desc: '官方正规渠道划扣激活，提供全周期订阅保障。' },
];

const COMPARE_LOW = [
  { dim: '采购成本', text: '明显低于官方 $20 美元成本（黑产 / 盗刷）' },
  { dim: '账号密码', text: '索要账号密码代登，存在隐私泄漏风险' },
  { dim: '账号寿命', text: '几天内被官方撤销会员、封号且客服失联' },
  { dim: '历史记录', text: '频繁换号，历史 Prompt 与工程记录全丢' },
];

const COMPARE_SAFE = [
  { dim: '采购成本', text: '100% 官方渠道划扣 $20 真实美金成本' },
  { dim: '账号密码', text: '办理过程中不需要向客服提供账号密码' },
  { dim: '账号寿命', text: '支持正常续费，提供全周期订阅保障服务' },
  { dim: '历史记录', text: '原有个人账号直接办理，数据资产 100% 保留' },
];

// Scoped styles: particle grid, flowing gradient text, ignite pulse, modal entrance.
// All keyframes are prefixed with `xa-` to avoid collisions with global CSS.
const SCOPED_CSS = `
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
  @keyframes xa-pulse-ignite-wechat {
    0%, 100% { transform: scale(1); box-shadow: 0 0 18px -2px rgba(7, 193, 96, 0.45); }
    50% { transform: scale(1.02); box-shadow: 0 0 32px 2px rgba(7, 193, 96, 0.7); }
  }
  .xa-btn-ignite-wechat { animation: xa-pulse-ignite-wechat 3s infinite ease-in-out; }
  @keyframes xa-scale-up {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  .xa-modal-card { animation: xa-scale-up 0.25s ease-out; }
  @media (prefers-reduced-motion: reduce) {
    .xa-gradient-text,
    .xa-btn-ignite-wechat,
    .xa-modal-card { animation: none; }
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

// WeChat double-bubble glyph drawn with pure SVG primitives: two rounded
// bubbles whose "eyes" are punched via a mask, so it renders crisply at any
// size on any background. Filled with `currentColor`.
const WechatIcon = ({ className }: { className?: string }) => {
  const maskId = useId();
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <mask id={maskId}>
        <rect width="24" height="24" fill="#fff" />
        {/* Eye holes: large bubble */}
        <circle cx="6.9" cy="7.6" r="1.1" fill="#000" />
        <circle cx="11.3" cy="7.6" r="1.1" fill="#000" />
        {/* Eye holes: small bubble */}
        <circle cx="13.7" cy="12.5" r="0.9" fill="#000" />
        <circle cx="17.3" cy="12.5" r="0.9" fill="#000" />
      </mask>
      <g mask={`url(#${maskId})`}>
        {/* Large bubble + tail */}
        <path d="M9.5 2.5C5.4 2.5 2 5.3 2 8.7c0 1.9 1 3.6 2.7 4.8L4 16.2l2.6-1.3c.9.3 1.9.4 2.9.4h.6a6.6 6.6 0 0 1-.6-2c0-3.4 3.3-6.1 7.5-6.1h.5C16.8 4.2 13.4 2.5 9.5 2.5Z" />
        {/* Small bubble + tail */}
        <path d="M22 13.4c0-3-2.9-5.4-6.5-5.4S9 10.4 9 13.4s2.9 5.4 6.5 5.4c.9 0 1.7-.1 2.5-.4l2.4 1.2-.6-1.7c1.3-1 2.2-2.6 2.2-4.5Z" />
      </g>
    </svg>
  );
};

export default function App() {
  // Initial theme: saved manual choice wins, otherwise follow the OS preference.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('xa-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  // Service name of the currently open modal; null = closed.
  const [modalService, setModalService] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep the video muted state in sync with the UI toggle.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Tag <html> while the page is mounted so the native scrollbar blends with
  // the page theme (a light scrollbar track reads as a blank strip on dark bg).
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('xa-page');
    if (theme === 'dark') html.classList.add('xa-dark');
    return () => {
      html.classList.remove('xa-page');
      html.classList.remove('xa-dark');
    };
  }, [theme]);

  // Show the desktop floating CTA after the visitor scrolls past the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Persist the theme choice for repeat visits.
  useEffect(() => {
    window.localStorage.setItem('xa-theme', theme);
  }, [theme]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!modalService) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalService]);

  // Close the modal with the Escape key.
  useEffect(() => {
    if (!modalService) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalService(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalService]);

  const openModal = (service: string) => setModalService(service);
  const closeModal = () => setModalService(null);

  // The outer div only carries the `dark` class: Tailwind's class-based dark
  // mode compiles to descendant selectors (`.dark .dark\:*`), so the theme
  // carrier must be an ancestor of the styled root, never the same element.
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div
        className="xa-root xa-grid isolate relative min-h-screen overflow-x-hidden bg-hyper-lightBg text-slate-900 transition-colors duration-300 selection:bg-hyper-orange selection:text-white dark:bg-hyper-darkBg dark:text-slate-100"
      >
        <style>{SCOPED_CSS}</style>

      {/* Hero radial aura behind the first screen */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[350px] w-[700px] -translate-x-1/2 bg-gradient-to-b from-hyper-orange/20 via-hyper-indigo/15 to-transparent blur-[120px]" />

      {/* ================= Header ================= */}
      <header className="sticky top-0 z-40 border-b border-hyper-lightBorder bg-hyper-lightBg/80 backdrop-blur-xl transition-colors dark:border-hyper-darkBorder dark:bg-hyper-darkBg/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Brand */}
          <a href="#" className="group flex items-center gap-3" aria-label="Gutask AI 首页">
            <span className="relative flex items-center justify-center">
              <span className="absolute h-9 w-9 animate-ping rounded-full bg-hyper-orange opacity-20" />
              <img
                src="/UI/logo/300_300.webp"
                alt="Gutask AI Logo"
                className="relative h-8 w-8 rounded-lg object-contain transition group-hover:scale-105"
              />
            </span>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text whitespace-nowrap text-lg font-black tracking-tight text-transparent dark:from-white dark:to-slate-300">
              Gutask AI
            </span>
          </a>

          {/* Anchor nav */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
            <a href="#chatgpt-section" className="transition hover:text-hyper-orange">ChatGPT 代充</a>
            <a href="#claude-section" className="flex items-center gap-1.5 transition hover:text-hyper-orange">
              <span>Claude Code 终端直连</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </a>
            <a href="#video-section" className="transition hover:text-hyper-orange">充值实录</a>
            <a href="#why-section" className="transition hover:text-hyper-orange">防坑保障</a>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border border-hyper-lightBorder p-2.5 text-slate-600 shadow-sm transition hover:border-hyper-orange/50 active:scale-95 dark:border-hyper-darkBorder dark:text-slate-300"
              title="切换深浅模式"
              aria-label="切换深浅模式"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            <button
              type="button"
              onClick={() => openModal('客服专席')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-wechat to-wechat-dark px-5 py-2.5 text-sm font-bold text-white shadow-glow-wechat transition hover:shadow-glow-wechat-lg active:scale-95"
            >
              <WechatIcon className="h-5 w-5" />
              <span>微信扫码咨询</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ================= Hero ================= */}
        <section className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center">
          {/* Trust badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-hyper-orange/30 bg-hyper-orange/5 px-4 py-2 font-mono text-xs shadow-sm backdrop-blur-md dark:bg-hyper-orange/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              官方正规渠道代充 <span className="mx-1.5 opacity-30">|</span>
              累计服务顾客 <strong className="font-bold font-mono text-hyper-orange">1,665</strong> 位 <span className="mx-1.5 opacity-30">|</span>
              <span className="font-bold text-hyper-orange">安全交易可开发票</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
            原生算力不卡脖子
            <br />
            <span className="xa-gradient-text bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet bg-clip-text text-transparent">
              官方定价 · 3分钟点火直充
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            使用您自己的 ChatGPT 账号开通会员，
            <strong className="rounded border border-hyper-orange/20 bg-hyper-orange/10 px-2 py-0.5 font-bold text-slate-900 dark:bg-hyper-orange/20 dark:text-white">
              办理过程中不需要向客服提供账号密码
            </strong>
            ，付款后通常几分钟完成。
          </p>

          {/* Four core promises */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3 font-mono text-xs font-semibold">
            {PROMISES.map((p) => (
              <div
                key={p.text}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-emerald-600 shadow-sm dark:text-emerald-400"
              >
                <span>{p.icon}</span> {p.text}
              </div>
            ))}
          </div>

          {/* Primary CTA row */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => openModal('快速办理通道')}
              className="xa-btn-ignite-wechat flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95 sm:w-auto"
            >
              <WechatIcon className="h-6 w-6" />
              <span>扫码添加企业微信办理</span>
              <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">几分钟到账 →</span>
            </button>

            <a
              href="#chatgpt-section"
              className="w-full rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/50 px-7 py-4 text-center text-sm font-bold shadow-sm backdrop-blur-md transition hover:border-hyper-orange hover:text-hyper-orange dark:border-hyper-darkBorder dark:bg-hyper-darkCard/50 sm:w-auto"
            >
              查看硬核定价表 ↓
            </a>
          </div>
        </section>

        {/* ================= Recharge demo video ================= */}
        <section id="video-section" className="mx-auto max-w-4xl scroll-mt-24 px-6 pb-20">
          <div className="group relative overflow-hidden rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard shadow-cyber transition duration-500 hover:border-hyper-orange/50 dark:border-hyper-darkBorder dark:bg-hyper-darkCard">
            {/* Glow hairline */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-hyper-orange to-transparent opacity-80" />

            {/* macOS-style title bar */}
            <div className="flex h-11 items-center justify-between border-b border-hyper-lightBorder bg-slate-100/80 px-5 dark:border-hyper-darkBorder dark:bg-[#0A0D14]">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#FF5F56]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#FFBD2E]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#27C93F]" />
              </div>
              <div className="mx-auto flex items-center gap-2 font-mono text-xs font-medium text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>极速无密码实录</span>
              </div>
            </div>

            {/* Video player */}
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border border-white/10 bg-black/75 px-4 py-2 font-mono text-xs text-white shadow-lg backdrop-blur-xl transition hover:bg-black/90 active:scale-95"
              >
                <span>{muted ? '🔇' : '🔊'}</span>
                <span className="font-medium">{muted ? '静音中 · 点击开启实录解说' : '声音已开启'}</span>
              </button>
            </div>

            {/* Trust notice bar */}
            <div className="flex items-center justify-center gap-2 border-t border-hyper-lightBorder bg-slate-50 px-6 py-3.5 text-center text-xs text-slate-500 dark:border-hyper-darkBorder dark:bg-[#07090E] dark:text-slate-400">
              <span className="font-bold text-hyper-orange">● 技术验证：</span>
              <span>
                直接将官方升级会话交由专席代付即可，
                <strong className="font-semibold text-slate-800 underline decoration-hyper-orange/50 dark:text-slate-100">
                  客服全程不索要任何密码
                </strong>
                。
              </span>
            </div>
          </div>
        </section>

        {/* ================= Pricing ================= */}
        <section className="mx-auto max-w-5xl px-6 py-8">
          {/* Module A: ChatGPT Plus / Codex */}
          <div id="chatgpt-section" className="mb-20 scroll-mt-24">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">
                  POWERED BY OFFICIAL BILLING
                </span>
                <h2 className="mb-2 mt-1 text-3xl font-extrabold tracking-tight">ChatGPT Plus / Codex 代充</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  多种套餐灵活选择，专业代充服务，安全快速开通（代充自己的账号 / 可购买独享账号）
                </p>
              </div>
              <div className="w-fit rounded-lg border border-hyper-lightBorder px-3 py-1.5 font-mono text-xs text-slate-500 dark:border-hyper-darkBorder">
                支持代充自有号 ｜ 现号交付
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {CHATGPT_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between rounded-3xl p-7 transition duration-300 ${
                    plan.featured
                      ? 'border-2 border-hyper-orange shadow-glow-orange hover:-translate-y-1'
                      : 'group border border-hyper-lightBorder bg-hyper-lightCard shadow-sm hover:border-hyper-orange/50 dark:border-hyper-darkBorder dark:bg-hyper-darkCard'
                  } ${plan.featured ? 'bg-hyper-lightCard dark:bg-hyper-darkCard' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-hyper-orange to-hyper-amber px-3 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                      {plan.badge}
                    </div>
                  )}
                  <div>
                    <div className={`mb-2 font-mono text-xs uppercase tracking-wider ${plan.featured ? 'font-bold text-hyper-orange' : 'text-slate-400'}`}>
                      {plan.label}
                    </div>
                    <h3 className={`text-xl transition ${plan.featured ? 'font-black' : 'font-bold group-hover:text-hyper-orange'}`}>
                      {plan.name}
                    </h3>
                    <div className="mb-3 mt-4 flex items-baseline gap-1">
                      <span className={`font-mono text-4xl font-black tracking-tight ${plan.featured ? 'text-hyper-orange' : ''}`}>
                        ¥{plan.price}
                      </span>
                      <span className="text-xs font-normal text-slate-400">/ 月</span>
                    </div>
                    <p className="mb-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{plan.desc}</p>
                  </div>
                  {plan.featured ? (
                    <button
                      type="button"
                      onClick={() => openModal(plan.service)}
                      className="w-full rounded-xl bg-gradient-to-r from-hyper-orange to-hyper-orangeGlow py-3.5 text-sm font-extrabold text-white shadow-glow-orange transition hover:to-hyper-amber active:scale-95"
                    >
                      ⚡ {plan.cta}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openModal(plan.service)}
                      className="w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold shadow-sm transition hover:border-hyper-orange hover:text-hyper-orange active:scale-95 dark:border-slate-800"
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Module B: Claude Code direct connection */}
          <div
            id="claude-section"
            className="relative mb-16 scroll-mt-24 overflow-hidden rounded-3xl border border-hyper-indigo/40 bg-gradient-to-br from-hyper-lightCard via-hyper-lightCard to-hyper-indigo/5 shadow-glow-card dark:from-hyper-darkCard dark:via-hyper-darkCard dark:to-hyper-indigo/15"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet" />

            <div className="relative z-10 flex flex-col justify-between gap-8 p-8 lg:flex-row lg:items-center md:p-10">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-hyper-indigo/20 bg-hyper-indigo/10 px-3 py-1 font-mono text-xs font-bold text-hyper-indigo dark:text-indigo-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-indigo" />
                  100% 官方客户端直连 · 非第三方降智镜像
                </div>
                <h2 className="mb-3 text-3xl font-black tracking-tight">Claude Code 代申请与环境接入</h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  每天请求 <strong className="font-bold font-mono text-hyper-orange">500 次</strong> 官方版非镜像（高频排查 Bug、自动化重构代码充沛有余）。
                  按天 / 周卡 / 多档月卡 <strong className="font-bold text-slate-900 underline decoration-hyper-orange dark:text-white">七档套餐灵活选择</strong>。
                </p>
              </div>

              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="text-left sm:text-right">
                  <div className="font-mono text-xs font-bold uppercase text-slate-400">灵活体验档位</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="font-mono text-xs font-medium">起价仅</span>
                    <span className="font-mono text-4xl font-black text-hyper-orange">¥11</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal('Claude Code 7 档套餐')}
                  className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-hyper-indigo to-hyper-violet px-7 py-4 text-sm font-bold text-white shadow-lg transition hover:from-hyper-violet hover:to-hyper-indigo hover:shadow-glow-card active:scale-95 sm:w-auto"
                >
                  <span>选档下单 · 立即连接终端</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Why our price is higher */}
          <div
            id="why-section"
            className="mb-16 scroll-mt-24 rounded-3xl border border-hyper-lightBorder bg-slate-100/60 p-8 shadow-sm dark:border-hyper-darkBorder dark:bg-[#0B0D14] md:p-10"
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex items-center gap-2.5 text-hyper-orange">
                <span className="text-xl">⚠️</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">为什么我们的价格比别人高？</h3>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                我们采用官网官方渠道充值，Plus 严格按官网{' '}
                <strong className="font-mono text-base font-bold text-hyper-orange">20 美元</strong>{' '}
                原价采购划扣。明显低于官方成本的充值（如某宝几十元的低价代充）可能存在黑卡盗刷、汇率套利等严重风险。平台对异常充值审核极其严格，一旦风控将直接导致{' '}
                <strong className="font-bold text-rose-500">会员被撤销或账号受限，个人代码和对话资产彻底丢失</strong>。
              </p>

              {/* Hard-core black & white comparison */}
              <div className="grid gap-4 font-mono text-xs sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-500/30 bg-white p-5 shadow-sm dark:bg-hyper-darkCard">
                  <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-rose-500">
                    <span>✕</span> 低价非正规代充
                  </div>
                  <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                    {COMPARE_LOW.map((row) => (
                      <li key={row.dim}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{row.dim}：</span>
                        {row.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border-2 border-emerald-500/40 bg-white p-5 shadow-sm dark:bg-hyper-darkCard">
                  <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                    <span>✓</span> Gutask AI 正规直充
                  </div>
                  <ul className="space-y-2 text-slate-700 dark:text-slate-200">
                    {COMPARE_SAFE.map((row) => (
                      <li key={row.dim}>
                        <span className="font-bold">{row.dim}：</span>
                        {row.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 3-step delivery flow */}
          <div className="mb-16">
            <div className="mb-8 text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">HOW IT WORKS</span>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight">极简 3 步交付流程</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="group rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-7 shadow-sm transition duration-300 hover:border-hyper-orange/50 dark:border-hyper-darkBorder dark:bg-hyper-darkCard"
                >
                  <div className="mb-4 font-mono text-4xl font-black text-hyper-orange/30 transition group-hover:text-hyper-orange/70">
                    0{i + 1}
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Developer lead magnet */}
            <div className="relative mt-8 overflow-hidden rounded-3xl border border-hyper-orange/30 bg-gradient-to-r from-hyper-orange/10 via-transparent to-hyper-amber/10 p-7">
              <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-hyper-orange">
                    DEVELOPER LEAD MAGNET
                  </div>
                  <h3 className="text-lg font-black">开发者私域资料领取</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    添加企微回复 <strong className="font-mono font-bold text-hyper-orange">【档位】</strong>：
                    领取 Claude Code 七档套餐表 + 终端配置技巧手册，持续同步最新模型发布与技术干货。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('开发者资料领取')}
                  className="w-full whitespace-nowrap rounded-xl border-2 border-hyper-orange px-6 py-3 text-sm font-bold text-hyper-orange transition hover:bg-hyper-orange hover:text-white active:scale-95 md:w-auto"
                >
                  领取开发者资料包 →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= Footer ================= */}
      <footer className="border-t border-hyper-lightBorder pb-28 pt-12 text-xs text-slate-400 dark:border-hyper-darkBorder lg:pb-12">
        <div className="mx-auto max-w-6xl px-6">
          {/* In-site navigation: keyword-rich internal links for SEO */}
          <nav
            aria-label="站内导航"
            className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 font-mono"
          >
            <a href="#chatgpt-section" className="transition hover:text-hyper-orange">ChatGPT Plus / Codex 代充</a>
            <a href="#claude-section" className="transition hover:text-hyper-orange">Claude Code 终端直连</a>
            <a href="#video-section" className="transition hover:text-hyper-orange">充值实录</a>
            <a href="#why-section" className="transition hover:text-hyper-orange">防坑保障</a>
          </nav>

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row">
            <div>© 2026 Gutask AI (gutast.com) · 专注为研发与极客加速顶尖 AI 算力</div>
            <div className="flex items-center gap-6 font-mono">
              <span>安全正规渠道</span>
              <span>全程无密</span>
              <span>可开正规发票</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= Sticky conversion components ================= */}
      {/* Desktop floating CTA (appears after scrolling past the hero) */}
      <button
        type="button"
        onClick={() => openModal('企微专席')}
        aria-hidden={!scrolled}
        className={`fixed bottom-8 right-6 z-40 hidden items-center gap-2.5 rounded-full bg-gradient-to-r from-wechat to-wechat-dark px-6 py-3.5 text-sm font-bold text-white shadow-glow-wechat transition-all duration-300 hover:shadow-glow-wechat-lg active:scale-95 lg:flex ${
          scrolled ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <WechatIcon className="h-5 w-5" />
        微信扫码 · 顾问秒回
      </button>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hyper-lightBorder bg-hyper-lightBg/90 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-xl dark:border-hyper-darkBorder dark:bg-hyper-darkBg/90 lg:hidden">
        <button
          type="button"
          onClick={() => openModal('快速办理通道')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark py-3.5 text-sm font-extrabold text-white shadow-glow-wechat active:scale-95"
        >
          <WechatIcon className="h-5 w-5" />
          微信扫码 · ¥11 起办理
          <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-[11px] font-medium opacity-90">无需密码 · 几分钟到账</span>
        </button>
      </div>

      {/* ================= WeChat modal ================= */}
      {modalService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="扫码添加企业微信办理"
        >
          <div className="xa-modal-card relative w-full max-w-sm rounded-3xl border-2 border-wechat/50 bg-hyper-lightCard p-6 text-center shadow-glow-wechat-lg dark:bg-hyper-darkCard">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="关闭弹窗"
            >
              ✕
            </button>

            <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-wechat">
              {modalService}
            </div>
            <h3 className="mb-1 text-xl font-black">扫码添加企业微信办理</h3>
            <p className="mb-5 text-xs text-slate-400">办理全程不需要向客服提供账号密码 · 几分钟交付</p>

            {/* Glowing QR container */}
            <div className="mx-auto mb-5 flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-wechat bg-white p-2.5 shadow-glow-wechat">
              <img src={QR_SRC} alt="Gutask AI 企业微信二维码" className="h-full w-full rounded-xl object-contain" />
            </div>

            <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span>专席顾问已在线（平均响应 &lt; 30 秒）</span>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
