import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { QR_SRC } from './data';

/**
 * Shared page chrome for every landing page: theme switching, sticky header,
 * footer, floating CTA, mobile bottom bar and the WeChat contact modal.
 *
 * Page components render only their <main> content as `children` and open
 * the contact modal through the `useOpenWechatModal` hook.
 */

type Theme = 'dark' | 'light';

export type PageId = 'home' | 'chatgpt-plus' | 'claude-code' | 'faq';

// Scoped styles: particle grid, flowing gradient text, ignite pulse, modal
// entrance. All keyframes are prefixed with `xa-` to avoid collisions with
// global CSS. Shared verbatim across all landing pages.
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

// Cross-page navigation: each topic ranks on its own landing page, so the
// header and footer link between pages instead of same-page anchors.
const NAV_LINKS: { href: string; label: string; pulse?: boolean }[] = [
  { href: '/chatgpt-plus', label: 'ChatGPT Plus 充值' },
  { href: '/claude-code', label: 'Claude 会员代充', pulse: true },
  // Label is product-scoped: the demo video records the ChatGPT flow only,
  // so visitors on the Claude page don't expect a Claude recording there.
  { href: '/chatgpt-plus#video-section', label: 'ChatGPT 充值实录' },
  { href: '/chatgpt-plus#why-section', label: '防坑保障' },
  { href: '/faq', label: '常见问题' },
];

// True when the nav link points at the current page (ignoring #hash).
const isActive = (href: string, page?: PageId) =>
  page !== undefined && href.split('#')[0] === (page === 'home' ? '/' : `/${page}`);

// Modal service names are provided by page components through this context.
const ModalContext = createContext<(service: string) => void>(() => {});

// Hook for page components to open the WeChat contact modal with a
// context-specific service label.
export const useOpenWechatModal = () => useContext(ModalContext);

// WeChat double-bubble glyph drawn with pure SVG primitives: two rounded
// bubbles whose "eyes" are punched via a mask, so it renders crisply at any
// size on any background. Filled with `currentColor`.
// Exported for page-level CTAs (the shell header/footer use it internally).
export const WechatIcon = ({ className }: { className?: string }) => {
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

interface AppShellProps {
  children: ReactNode;
  currentPage?: PageId;
}

export default function AppShell({ children, currentPage }: AppShellProps) {
  // Initial theme: saved manual choice wins, otherwise follow the OS preference.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('xa-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  // Service name of the currently open modal; null = closed.
  const [modalService, setModalService] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Signal the build-time prerenderer that React has committed the full DOM,
  // so the crawler-visible HTML snapshot is captured after render (SEO R1).
  useEffect(() => {
    document.dispatchEvent(new Event('render-event'));
  }, []);

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
    <ModalContext.Provider value={openModal}>
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
              {/* Brand: always back to the hub page */}
              <a href="/" className="group flex items-center gap-3" aria-label="Gutast AI 首页">
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

              {/* Cross-page nav */}
              <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href, currentPage);
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-1.5 transition hover:text-hyper-orange ${
                        active ? 'text-hyper-orange' : ''
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.pulse && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                    </a>
                  );
                })}
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

          <main>{children}</main>

          {/* ================= Footer ================= */}
          <footer className="border-t border-hyper-lightBorder pb-28 pt-12 text-xs text-slate-400 dark:border-hyper-darkBorder lg:pb-12">
            <div className="mx-auto max-w-6xl px-6">
              {/* In-site navigation: keyword-rich internal links between the
                  independent landing pages (SEO) */}
              <nav
                aria-label="站内导航"
                className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 font-mono"
              >
                {NAV_LINKS.map((link) => (
                  <a key={link.href} href={link.href} className="transition hover:text-hyper-orange">
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Policy pages: verifiable trust anchors (E-E-A-T) */}
              <div className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono">
                <a href="/terms-of-service" className="transition hover:text-hyper-orange">服务协议</a>
                <a href="/refund-policy" className="transition hover:text-hyper-orange">退款与质保政策</a>
                <a href="/privacy-policy" className="transition hover:text-hyper-orange">隐私声明</a>
              </div>

              {/* Developer guides: keyword-rich internal links to blog articles */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono">
                <span className="font-bold text-slate-500 dark:text-slate-400">开发者指南：</span>
                <a href="/blog/claude-ban-risk-guide" className="transition hover:text-hyper-orange">Claude 封号机制与防封指南</a>
                <a href="/blog/claude-new-account-ban-appeal" className="transition hover:text-hyper-orange">Claude 新号被封申诉指南</a>
                <a href="/blog/claude-account-safety-faq" className="transition hover:text-hyper-orange">Claude 账号防封答疑手册</a>
                <a href="/blog/claude-chinese-ui-analysis" className="transition hover:text-hyper-orange">Claude 中文版上线解读</a>
                <a href="/blog/claude-subscription-plan-guide" className="transition hover:text-hyper-orange">Claude 订阅套餐怎么选</a>
                <a href="/blog/claude-pro-recharge-guide" className="transition hover:text-hyper-orange">Claude Pro 充值攻略</a>
                <a href="/blog/claude-pro-payment-guide" className="transition hover:text-hyper-orange">Claude Pro 充值支付流程</a>
                <a href="/blog/claude-registration-guide" className="transition hover:text-hyper-orange">Claude 注册与使用完整指南</a>
              </div>

              {/* Legal entity disclosure: verifiable trust signal for E-E-A-T.
                  DUNS number can be cross-checked on the official D&B lookup. */}
              <div className="mb-6 space-y-1.5 text-center leading-relaxed">
                <div>Gutast AI 运营主体：深圳市优品家居材料科技有限公司</div>
                <div className="text-slate-500 dark:text-slate-500">
                  D-U-N-S® 编码 710229185（邓白氏官方渠道可核验）· 联系邮箱：475290875@qq.com
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row">
                <div>
                  © 2026 Gutast AI (gutast.com) · <span className="font-semibold">Gutast = Good Taste</span> · 好品味，先用上顶尖 AI
                </div>
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
              微信扫码 · ¥145 起办理
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
                  <img src={QR_SRC} alt="Gutast AI 企业微信二维码" className="h-full w-full rounded-xl object-contain" />
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
    </ModalContext.Provider>
  );
}
