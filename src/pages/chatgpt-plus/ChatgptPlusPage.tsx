import { useState } from 'react';
import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';
import {
  CHATGPT_PLANS,
  COMPARE_LOW,
  COMPARE_SAFE,
  POSTER_SRC,
  PROMISES,
  VIDEO_SRC,
  VTT_SRC,
  WALKTHROUGH_STEPS,
  faqForPage,
} from '../../shared/data';

// Visible FAQ = the FAQPage JSON-LD on chatgpt-plus/index.html (same filter).
const PAGE_FAQ = faqForPage('chatgpt-plus');

/**
 * ChatGPT Plus / Codex landing page ("/chatgpt-plus"): pricing table,
 * recharge demo video, anti-scam comparison and the page-scoped FAQ.
 * Single H1 topic so this URL ranks for "ChatGPT Plus 充值" queries.
 */
export default function ChatgptPlusPage() {
  const openModal = useOpenWechatModal();
  // Video starts muted (autoplay policy); visitors unmute for the narration.
  const [muted, setMuted] = useState(true);

  return (
    <AppShell currentPage="chatgpt-plus">
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

        {/* Single-topic H1: this page targets "ChatGPT Plus 充值" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet bg-clip-text text-transparent">
            ChatGPT Plus / Codex 官方充值
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
            href="#pricing-section"
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
              <h2>充值实录 · ChatGPT 官方划扣演示</h2>
            </div>
          </div>

          {/* Video player */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-black">
            <video
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              preload="metadata"
              autoPlay
              loop
              muted={muted}
              playsInline
              className="h-full w-full object-contain"
            >
              {/* Crawler-readable caption track (VideoObject caption /
                  Google video sitemap share this VTT) + narration overlay
                  when the visitor unmutes. */}
              <track kind="subtitles" src={VTT_SRC} srcLang="zh-CN" label="中文字幕" />
            </video>
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
          <div className="border-t border-hyper-lightBorder bg-slate-50 px-6 py-3.5 text-center text-xs text-slate-500 dark:border-hyper-darkBorder dark:bg-[#07090E] dark:text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-hyper-orange">● 技术验证：</span>
              <span>
                直接将官方升级会话交由专席代付即可，
                <strong className="font-semibold text-slate-800 underline decoration-hyper-orange/50 dark:text-slate-100">
                  客服全程不索要任何密码
                </strong>
                。
              </span>
            </div>
            {/* Scope note: the recording shows the ChatGPT flow only, not Claude. */}
            <p className="mt-1.5">
              本实录仅演示 ChatGPT Plus / Codex 的官方划扣流程，不含 Claude；Claude 会员代充请见
              <a
                href="/claude-code"
                className="font-semibold text-hyper-orange underline decoration-hyper-orange/50 transition hover:opacity-80"
              >
                Claude 专页
              </a>
              。
            </p>
          </div>
        </div>

        {/* Pre-recharge steps: what the customer must do in their own
            browser before contacting the consultant (session must be ready
            and Plus must be expired before recharging). */}
        <div className="mt-6 rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-6 shadow-cyber md:p-8 dark:border-hyper-darkBorder dark:bg-hyper-darkCard">
          <h3 className="mb-1 text-lg font-extrabold tracking-tight">充值前操作步骤</h3>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
            办理前请先在您自己的浏览器完成以下两步操作。
          </p>
          <ol className="space-y-3">
            {/* Step 1: log in on chatgpt.com */}
            <li className="flex items-start gap-3 rounded-2xl border border-hyper-lightBorder bg-slate-50 p-4 dark:border-hyper-darkBorder dark:bg-[#0B0F16]">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hyper-orange/15 font-mono text-xs font-bold text-hyper-orange">
                1
              </span>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                浏览器登录{' '}
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-hyper-orange underline decoration-hyper-orange/50 transition hover:opacity-80"
                >
                  chatgpt.com
                </a>
              </p>
            </li>
            {/* Step 2: open the session endpoint in the SAME browser */}
            <li className="flex items-start gap-3 rounded-2xl border border-hyper-lightBorder bg-slate-50 p-4 dark:border-hyper-darkBorder dark:bg-[#0B0F16]">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hyper-orange/15 font-mono text-xs font-bold text-hyper-orange">
                2
              </span>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                登录完你的账号之后，用<span className="font-bold">同样的浏览器</span>打开{' '}
                <a
                  href="https://chatgpt.com/api/auth/session"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-xs font-semibold text-hyper-orange underline decoration-hyper-orange/50 transition hover:opacity-80"
                >
                  https://chatgpt.com/api/auth/session
                </a>
              </p>
            </li>
          </ol>
          {/* Notice: Plus must expire before a recharge can be applied */}
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:text-amber-400">
            <span aria-hidden="true">⚠️</span>
            注意：Plus 需要到期才可以充值。
          </p>
        </div>

        {/* Text walkthrough: crawler-readable transcript of the demo
            (Experience signal + long-tail queries like "ChatGPT 代充流程") */}
        <div className="mt-6 rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-6 shadow-cyber md:p-8 dark:border-hyper-darkBorder dark:bg-hyper-darkCard">
          <h3 className="mb-1 text-lg font-extrabold tracking-tight">办理流程：4 步搞定</h3>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
            几分钟完成，全程无需提供账号密码。
          </p>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {WALKTHROUGH_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-hyper-lightBorder bg-slate-50 p-4 dark:border-hyper-darkBorder dark:bg-[#0B0F16]"
              >
                <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-hyper-orange/15 font-mono text-xs font-bold text-hyper-orange">
                  {i + 1}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= Pricing ================= */}
      <section id="pricing-section" className="mx-auto max-w-5xl scroll-mt-24 px-6 pb-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">
              POWERED BY OFFICIAL BILLING
            </span>
            <h2 className="mb-2 mt-1 text-3xl font-extrabold tracking-tight">ChatGPT Plus / Codex 套餐价格</h2>
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
      </section>

      {/* ================= Why our price is higher ================= */}
      <section id="why-section" className="mx-auto max-w-5xl scroll-mt-24 px-6 pb-16">
        <div className="rounded-3xl border border-hyper-lightBorder bg-slate-100/60 p-8 shadow-sm dark:border-hyper-darkBorder dark:bg-[#0B0D14] md:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center gap-2.5 text-hyper-orange">
              <span className="text-xl">⚠️</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">为什么我们的价格比别人高？</h2>
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
                  <span>✓</span> Gutast AI 正规直充
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
      </section>

      {/* ================= FAQ (page-scoped) ================= */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-orange">FAQ</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">办理前常见问题</h2>
        </div>
        <div className="grid gap-4">
          {PAGE_FAQ.map((item) => (
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
      </section>

      {/* ================= Cross-link to sibling landing page ================= */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <a
          href="/claude-code"
          className="group relative block overflow-hidden rounded-3xl border border-hyper-indigo/40 bg-gradient-to-br from-hyper-lightCard via-hyper-lightCard to-hyper-indigo/5 p-7 shadow-glow-card transition hover:-translate-y-1 hover:border-hyper-indigo dark:from-hyper-darkCard dark:via-hyper-darkCard dark:to-hyper-indigo/15"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-hyper-indigo dark:text-indigo-400">
                ALSO AVAILABLE
              </div>
              <h2 className="text-lg font-black tracking-tight">Claude Pro / Max 会员代充 · ¥145 起</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                官方渠道正规代充，Pro / Max 5x / Max 20x 三档明码标价，已有会员补差价升级。
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-hyper-indigo dark:text-indigo-400">
              查看代充套餐
              <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </div>
        </a>
      </section>

      {/* ================= Bottom CTA ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-hyper-orange/30 bg-gradient-to-r from-hyper-orange/10 via-transparent to-hyper-amber/10 p-10 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">开通您的 ChatGPT Plus</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微技术顾问，通常 3 分钟极速开通，全程无需提供账号密码。
          </p>
          <button
            type="button"
            onClick={() => openModal('ChatGPT Plus 快速办理')}
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
