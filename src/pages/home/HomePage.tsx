import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';
import { FAQ_ITEMS, PROMISES, STEPS } from '../../shared/data';

// Hero FAQ preview: two ChatGPT + two general/Claude questions so the hub
// page covers both product lines before linking to the full FAQ page.
const FAQ_PREVIEW_INDICES = [0, 1, 2, 5];

/**
 * Brand hub page ("/"): entry point and trust signals only. Product
 * keywords rank on their own landing pages (/chatgpt-plus, /claude-code);
 * this page converts visitors to those pages or straight to the WeChat QR.
 */
export default function HomePage() {
  const openModal = useOpenWechatModal();

  return (
    <AppShell currentPage="home">
      {/* ================= Hero ================= */}
      <section className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center">
        {/* Brand mnemonic: binds the name "Gutast" to "Good Taste" for instant brand recall */}
        <p className="mb-7 inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-hyper-orange/40 bg-hyper-orange/10 px-5 py-2.5 font-mono text-sm font-bold shadow-sm sm:px-7 sm:text-base dark:border-hyper-amber/40 dark:bg-hyper-amber/10">
          <span className="font-black tracking-wide text-hyper-orange dark:text-hyper-amber">Gutast</span>
          <span className="opacity-50">=</span>
          <span className="font-black text-slate-900 dark:text-white">Good Taste</span>
          <span className="opacity-50">·</span>
          <span className="text-slate-700 dark:text-slate-200">好品味，先用上顶尖 AI</span>
        </p>

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

        {/* Brand H1: the hub page targets the brand query; product keywords
            rank on their own dedicated landing pages. */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet bg-clip-text text-transparent">
            Gutast AI
          </span>
        </h1>
        <p className="mb-6 text-lg font-bold text-slate-900 dark:text-white md:text-xl">
          好品味，先用上顶尖 AI
        </p>

        {/* Hub subtitle: one line per product line, deep-linked */}
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          官方渠道专席办理
          <a href="/chatgpt-plus" className="mx-1 font-bold text-hyper-orange underline decoration-hyper-orange/40 underline-offset-4 transition hover:decoration-hyper-orange">
            ChatGPT Plus / Codex 充值
          </a>
          与
          <a href="/claude-code" className="mx-1 font-bold text-hyper-indigo underline decoration-hyper-indigo/40 underline-offset-4 transition hover:text-hyper-orange dark:text-indigo-400">
            Claude Pro / Max 会员代充
          </a>
          ，官方渠道办理，付款后通常几分钟完成。
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
            href="#products"
            className="w-full rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/50 px-7 py-4 text-center text-sm font-bold shadow-sm backdrop-blur-md transition hover:border-hyper-orange hover:text-hyper-orange dark:border-hyper-darkBorder dark:bg-hyper-darkCard/50 sm:w-auto"
          >
            选择产品线 ↓
          </a>
        </div>
      </section>

      {/* ================= Product line entry cards ================= */}
      <section id="products" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-10">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">PRODUCT LINES</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">两大核心服务</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            每条产品线拥有独立的落地页：套餐、流程与常见问题一页看全。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Entry: ChatGPT Plus / Codex landing page */}
          <a
            href="/chatgpt-plus"
            className="group relative flex flex-col rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-hyper-orange hover:shadow-glow-orange dark:border-hyper-darkBorder dark:bg-hyper-darkCard"
          >
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">
              <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-orange" />
              CHATGPT PLUS / CODEX
            </div>
            <h3 className="mb-1 text-2xl font-black tracking-tight transition group-hover:text-hyper-orange">
              ChatGPT Plus / Codex 官方充值
            </h3>
            <div className="mb-4 mt-2 flex items-baseline gap-1">
              <span className="font-mono text-3xl font-black text-hyper-orange">¥145</span>
              <span className="text-xs text-slate-400">/ 月 起 · 3 档套餐</span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>✓ 100% 官方渠道划扣，不开黑卡</li>
              <li>✓ 自有账号零密码接入</li>
              <li>✓ 支持正常续费与全周期质保</li>
              <li>✓ 可开数电发票 · 附充值实录视频</li>
            </ul>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-hyper-orange">
              查看套餐与充值实录
              <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </a>

          {/* Entry: Claude Code landing page */}
          <a
            href="/claude-code"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-hyper-indigo/40 bg-gradient-to-br from-hyper-lightCard via-hyper-lightCard to-hyper-indigo/5 p-8 shadow-glow-card transition duration-300 hover:-translate-y-1 hover:border-hyper-indigo dark:from-hyper-darkCard dark:via-hyper-darkCard dark:to-hyper-indigo/15"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-hyper-indigo dark:text-indigo-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-indigo" />
              CLAUDE PRO / MAX
            </div>
            <h3 className="mb-1 text-2xl font-black tracking-tight transition group-hover:text-hyper-indigo dark:group-hover:text-indigo-400">
              Claude Pro / Max 会员代充
            </h3>
            <div className="mb-4 mt-2 flex items-baseline gap-1">
              <span className="font-mono text-3xl font-black text-hyper-indigo dark:text-indigo-400">¥145</span>
              <span className="text-xs text-slate-400">起 · Pro / Max 三档套餐</span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>✓ 官方渠道正规代充，非低价黑卡通道</li>
              <li>✓ Pro ¥145 · Max 5x ¥900 · Max 20x ¥1700</li>
              <li>✓ 已有会员可补差价升级</li>
              <li>✓ 只质保订阅 · 公司客户可代开发票</li>
            </ul>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-hyper-indigo dark:text-indigo-400">
              查看代充套餐
              <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </a>
        </div>
      </section>

      {/* ================= 3-step delivery flow ================= */}
      <section className="mx-auto max-w-5xl px-6 py-10">
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
      </section>

      {/* ================= FAQ preview ================= */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">FAQ</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">办理前常见问题</h2>
        </div>
        <div className="grid gap-4">
          {FAQ_PREVIEW_INDICES.map((idx) => {
            const item = FAQ_ITEMS[idx];
            return (
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
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <a
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-xl border border-hyper-lightBorder px-6 py-3 text-sm font-bold shadow-sm transition hover:border-hyper-orange hover:text-hyper-orange dark:border-hyper-darkBorder"
          >
            查看全部 {FAQ_ITEMS.length} 个常见问题
            <span>→</span>
          </a>
        </div>
      </section>

      {/* ================= Bottom CTA ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-hyper-orange/30 bg-gradient-to-r from-hyper-orange/10 via-transparent to-hyper-amber/10 p-10 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">准备好用上顶尖 AI 了吗？</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微技术顾问，通常 3 分钟极速开通，全程无需提供账号密码。
          </p>
          <button
            type="button"
            onClick={() => openModal('快速办理通道')}
            className="xa-btn-ignite-wechat inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码添加企业微信办理</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">顾问秒回 →</span>
          </button>
        </div>
      </section>
    </AppShell>
  );
}
