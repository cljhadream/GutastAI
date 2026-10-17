import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';
import {
  CLAUDE_NOTES,
  CLAUDE_PLANS,
  faqForPage,
} from '../../shared/data';

// Visible FAQ = the FAQPage JSON-LD on claude-code/index.html (same filter).
const PAGE_FAQ = faqForPage('claude-code');

/**
 * Claude membership recharge landing page ("/claude-code"): Pro / Max plans,
 * upgrade-by-price-difference policy, warranty scope notice, page-scoped FAQ.
 * Single H1 topic so this URL ranks for "Claude 代充 / Claude 会员" queries.
 */
export default function ClaudeCodePage() {
  const openModal = useOpenWechatModal();

  return (
    <AppShell currentPage="claude-code">
      {/* ================= Hero ================= */}
      <section className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center">
        {/* Capability badges */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-hyper-indigo/20 bg-hyper-indigo/10 px-4 py-2 font-mono text-xs font-bold text-hyper-indigo dark:text-indigo-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-indigo" />
            官方渠道正规代充 · 全程无需账号密码
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            已有会员 · 补差价升级
          </div>
        </div>

        {/* Single-topic H1: this page targets "Claude 代充" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange bg-clip-text text-transparent">
            Claude Pro / Max 会员代充
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          Claude Pro <strong className="font-bold font-mono text-hyper-orange">¥145</strong> /月、Max 5x{' '}
          <strong className="font-bold font-mono text-hyper-orange">¥900</strong>、Max 20x{' '}
          <strong className="font-bold font-mono text-hyper-orange">¥1700</strong>
          ，官方渠道正规代充，已有会员可
          <strong className="font-bold text-slate-900 underline decoration-hyper-orange dark:text-white">补差价升级</strong>
          ，付款后顾问全程代办，通常几分钟开通。
        </p>

        {/* Price highlight */}
        <div className="mb-8 inline-flex items-baseline gap-2 rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/60 px-6 py-3 shadow-sm backdrop-blur-md dark:border-hyper-darkBorder dark:bg-hyper-darkCard/60">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">Pro / Max 三档套餐 · 起价仅</span>
          <span className="font-mono text-4xl font-black text-hyper-orange">¥145</span>
        </div>

        {/* Primary CTA row */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => openModal('Claude 会员代充')}
            className="xa-btn-ignite-wechat flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95 sm:w-auto"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码选档 · 立即开通</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">¥145 起 →</span>
          </button>

          <a
            href="#plans"
            className="w-full rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/50 px-7 py-4 text-center text-sm font-bold shadow-sm backdrop-blur-md transition hover:border-hyper-indigo hover:text-hyper-indigo dark:border-hyper-darkBorder dark:bg-hyper-darkCard/50 sm:w-auto"
          >
            查看三档套餐 ↓
          </a>
        </div>
      </section>

      {/* ================= Plans ================= */}
      <section
        id="plans"
        className="relative mx-auto max-w-5xl scroll-mt-24 overflow-hidden rounded-3xl border border-hyper-indigo/30 bg-hyper-lightCard px-6 pb-10 shadow-glow-card dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:px-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />

        {/* Section header */}
        <div className="mb-8 max-w-3xl pt-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              官方渠道划扣 · 非低价黑卡通道
            </span>
            <span className="rounded-md border border-hyper-lightBorder px-3 py-1 font-mono text-xs text-slate-500 dark:border-hyper-darkBorder dark:text-slate-400">
              Pro / Max 5x / Max 20x
            </span>
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
            Claude 会员三档套餐 · <span className="font-mono text-hyper-indigo dark:text-indigo-400">明码标价</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            在您自己的 Claude 账号上代充开通，办理过程不需要提供账号密码。Pro 与 Max
            均包含 claude.ai 对话与 Claude Code 使用额度，按用量选择档位即可。
          </p>
        </div>

        {/* Plan cards: indigo accent, mirrors the ChatGPT pricing layout */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {CLAUDE_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-3xl bg-slate-50/60 p-7 transition duration-300 dark:bg-white/[0.02] ${
                plan.featured
                  ? 'border-2 border-hyper-indigo shadow-glow-card'
                  : 'group border border-hyper-lightBorder hover:border-hyper-indigo/50 dark:border-hyper-darkBorder'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-hyper-indigo to-hyper-violet px-3 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                  {plan.badge}
                </div>
              )}
              <div>
                <div className={`mb-2 font-mono text-xs uppercase tracking-wider ${plan.featured ? 'font-bold text-hyper-indigo dark:text-indigo-400' : 'text-slate-400'}`}>
                  {plan.label}
                </div>
                <h3 className={`text-xl transition ${plan.featured ? 'font-black' : 'font-bold group-hover:text-hyper-indigo dark:group-hover:text-indigo-400'}`}>
                  {plan.name}
                </h3>
                <div className="mb-3 mt-4 flex items-baseline gap-1">
                  <span className={`font-mono text-4xl font-black tracking-tight ${plan.featured ? 'text-hyper-indigo dark:text-indigo-400' : ''}`}>
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
                  className="w-full rounded-xl bg-gradient-to-r from-hyper-indigo to-hyper-violet py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:from-hyper-violet hover:to-hyper-indigo active:scale-95"
                >
                  ⚡ {plan.cta}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal(plan.service)}
                  className="w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold shadow-sm transition hover:border-hyper-indigo hover:text-hyper-indigo active:scale-95 dark:border-slate-800"
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Upgrade-by-difference strip */}
        <div className="mb-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-hyper-indigo/30 bg-gradient-to-r from-hyper-indigo/10 via-transparent to-hyper-violet/10 p-6 md:flex-row">
          <div>
            <h3 className="text-lg font-black">已有会员？补差价直接升级</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pro ↔ Max 5x ↔ Max 20x 按差价补足即可升级更高档位，无需重新购买整月。
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('Claude 会员补差价升级')}
            className="w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-hyper-indigo to-hyper-violet px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-hyper-violet hover:to-hyper-indigo active:scale-95 md:w-auto"
          >
            咨询补差价升级 →
          </button>
        </div>

        {/* Warranty & invoice notices */}
        <div className="grid gap-4 sm:grid-cols-2">
          {CLAUDE_NOTES.map((note) => (
            <div
              key={note.title}
              className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-5 dark:border-hyper-darkBorder dark:bg-white/[0.02]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span>{note.icon}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{note.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ (page-scoped) ================= */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-indigo">FAQ</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">办理前常见问题</h2>
        </div>
        <div className="grid gap-4">
          {PAGE_FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard px-6 py-4 shadow-sm transition open:border-hyper-indigo/40 dark:border-hyper-darkBorder dark:bg-hyper-darkCard"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="font-mono text-lg text-hyper-indigo transition group-open:rotate-45 dark:text-indigo-400">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ================= Cross-link to sibling landing page ================= */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <a
          href="/chatgpt-plus"
          className="group relative block overflow-hidden rounded-3xl border border-hyper-orange/30 bg-gradient-to-br from-hyper-lightCard via-hyper-lightCard to-hyper-orange/5 p-7 shadow-sm transition hover:-translate-y-1 hover:border-hyper-orange dark:from-hyper-darkCard dark:via-hyper-darkCard dark:to-hyper-orange/10"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet" />
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">
                ALSO AVAILABLE
              </div>
              <h2 className="text-lg font-black tracking-tight">ChatGPT Plus / Codex 官方充值 · ¥145 起</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                自有账号零密码办理，附充值实录视频与防坑对比，附数电发票。
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-hyper-orange">
              查看套餐与实录
              <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </div>
        </a>
      </section>

      {/* ================= Bottom CTA ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-hyper-indigo/30 bg-gradient-to-r from-hyper-indigo/10 via-transparent to-hyper-violet/10 p-10 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">开通您的 Claude 会员</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微顾问，选档付款后全程代办，通常几分钟开通；已有会员可补差价升级。
          </p>
          <button
            type="button"
            onClick={() => openModal('Claude 会员代充')}
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
