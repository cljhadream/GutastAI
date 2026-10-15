import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';
import {
  ORG_GUIDE_SRC,
  ORG_ID_FACTS,
  ORG_ID_STEPS,
  faqForPage,
} from '../../shared/data';

// Visible FAQ = the FAQPage JSON-LD on claude-code/index.html (same filter).
const PAGE_FAQ = faqForPage('claude-code');

/**
 * Claude Code landing page ("/claude-code"): zero-credential Organization ID
 * onboarding guide, E-E-A-T knowledge cards, page-scoped FAQ.
 * Single H1 topic so this URL ranks for "Claude Code 接入" queries.
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
            100% 官方客户端直连 · 非第三方降智镜像
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            零凭证接入 · 仅需 Organization ID
          </div>
        </div>

        {/* Single-topic H1: this page targets "Claude Code 接入" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange bg-clip-text text-transparent">
            Claude Code 终端直连
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          每天请求 <strong className="font-bold font-mono text-hyper-orange">500 次</strong>{' '}
          官方版非镜像，高频排查 Bug、自动化重构充沛有余。按天 / 周卡 / 多档月卡{' '}
          <strong className="font-bold text-slate-900 underline decoration-hyper-orange dark:text-white">七档套餐灵活选择</strong>
          ，接入全程只需一个 Organization ID，无需交出账号密码。
        </p>

        {/* Price highlight */}
        <div className="mb-8 inline-flex items-baseline gap-2 rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/60 px-6 py-3 shadow-sm backdrop-blur-md dark:border-hyper-darkBorder dark:bg-hyper-darkCard/60">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">灵活体验档位 · 起价仅</span>
          <span className="font-mono text-4xl font-black text-hyper-orange">¥11</span>
        </div>

        {/* Primary CTA row */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => openModal('Claude Code 7 档套餐')}
            className="xa-btn-ignite-wechat flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95 sm:w-auto"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码选档 · 立即连接终端</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">¥11 起 →</span>
          </button>

          <a
            href="#orgid-guide"
            className="w-full rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/50 px-7 py-4 text-center text-sm font-bold shadow-sm backdrop-blur-md transition hover:border-hyper-indigo hover:text-hyper-indigo dark:border-hyper-darkBorder dark:bg-hyper-darkCard/50 sm:w-auto"
          >
            三步找到 Organization ID ↓
          </a>
        </div>
      </section>

      {/* ================= Zero-credential onboarding guide (E-E-A-T) =================
          Official-console screenshot as Experience proof, concept explainer as
          Expertise, official console link as Authority, anti-phishing notice as
          Trust. Step text mirrors the screenshot for crawlers. */}
      <section
        id="orgid-guide"
        className="relative mx-auto max-w-5xl scroll-mt-24 overflow-hidden rounded-3xl border border-hyper-indigo/30 bg-hyper-lightCard px-6 pb-10 shadow-glow-card dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:px-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />

        {/* Section header */}
        <div className="mb-8 max-w-3xl pt-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              零凭证接入 · 无需账号密码 / 验证码
            </span>
            <span className="rounded-md border border-hyper-lightBorder px-3 py-1 font-mono text-xs text-slate-500 dark:border-hyper-darkBorder dark:text-slate-400">
              代申请 + 环境接入一站式
            </span>
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
            接入 Claude Code 只需要一个{' '}
            <span className="font-mono text-hyper-indigo dark:text-indigo-400">Organization ID</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            不交账号、不给密码、不要验证码。您只需提供以{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-hyper-indigo dark:bg-white/5 dark:text-indigo-300">
              org_
            </code>{' '}
            开头的组织唯一标识符：它在 Anthropic 官方系统里仅用于标识"您的组织是谁"，
            <strong className="font-bold text-slate-900 dark:text-white">
              无法登录、无法调用 API、无法读取您的代码与对话
            </strong>
            。以下三步教您在官方控制台找到它。
          </p>
        </div>

        {/* Three-step walkthrough: text mirror of the guide screenshot */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {ORG_ID_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="group rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-5 transition hover:border-hyper-indigo/50 dark:border-hyper-darkBorder dark:bg-white/[0.02]"
            >
              <div className="mb-2 font-mono text-3xl font-black text-hyper-indigo/30 transition group-hover:text-hyper-indigo/70">
                0{i + 1}
              </div>
              <h3 className="mb-1 text-sm font-bold">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Official guide screenshot framed like a browser window */}
        <figure className="overflow-hidden rounded-2xl border border-hyper-lightBorder shadow-cyber dark:border-hyper-darkBorder">
          <div className="flex h-10 items-center gap-2.5 border-b border-hyper-lightBorder bg-slate-100/80 px-5 dark:border-hyper-darkBorder dark:bg-[#0A0D14]">
            <span className="h-2.5 w-2.5 rounded-full border border-black/10 bg-[#FF5F56]" />
            <span className="h-2.5 w-2.5 rounded-full border border-black/10 bg-[#FFBD2E]" />
            <span className="h-2.5 w-2.5 rounded-full border border-black/10 bg-[#27C93F]" />
            <span className="mx-auto font-mono text-xs text-slate-500">
              console.anthropic.com → Settings → Organization
            </span>
          </div>
          <img
            src={ORG_GUIDE_SRC}
            // Alt describes the image itself in one sentence; the detailed
            // explanation lives in the figcaption below (better for screen
            // readers and avoids keyword stuffing).
            alt="在 Anthropic 控制台查看 Organization ID 的三步图解"
            loading="lazy"
            className="w-full bg-white object-contain"
          />
          <figcaption className="border-t border-hyper-lightBorder bg-slate-50 px-5 py-3 text-center text-xs leading-relaxed text-slate-500 dark:border-hyper-darkBorder dark:bg-[#07090E] dark:text-slate-400">
            官方实操图解：claude.ai 个人资料页的 UID 以 <span className="font-mono font-bold">usr_</span> 开头；
            Claude Code / API 接入使用{' '}
            <span className="font-mono font-bold text-hyper-indigo dark:text-indigo-400">org_</span>{' '}
            开头的 Organization ID（控制台 Settings → Organization）。
          </figcaption>
        </figure>

        {/* E-E-A-T knowledge cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ORG_ID_FACTS.map((fact) => (
            <div
              key={fact.tag}
              className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-5 dark:border-hyper-darkBorder dark:bg-white/[0.02]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span>{fact.icon}</span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-hyper-indigo dark:text-indigo-400">
                  {fact.tag}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{fact.text}</p>
            </div>
          ))}
        </div>

        {/* Anti-phishing trust strip */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <span className="text-lg leading-none">⚠️</span>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <strong className="font-bold text-rose-500">防钓鱼提醒：</strong>
            Gutast AI 顾问
            <strong className="font-bold text-slate-900 dark:text-white">从不索要账号密码、验证码或 API Key</strong>
            ——办理 Claude Code 接入时，您唯一需要交付的就是 org_ 开头的 Organization ID。
            请只在官方控制台 console.anthropic.com/settings/organization 查看与复制，谨防仿冒站点。
          </p>
        </div>

        {/* Plan selection CTA */}
        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-hyper-indigo/30 bg-gradient-to-r from-hyper-indigo/10 via-transparent to-hyper-violet/10 p-6 md:flex-row">
          <div>
            <h3 className="text-lg font-black">七档套餐怎么选？</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ¥11 起按天卡、周卡、多档月卡灵活选择，顾问按您的用量推荐最省的档位。
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('Claude Code 7 档套餐')}
            className="w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-hyper-indigo to-hyper-violet px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-hyper-violet hover:to-hyper-indigo active:scale-95 md:w-auto"
          >
            获取七档套餐表 →
          </button>
        </div>
      </section>

      {/* ================= FAQ (page-scoped) ================= */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-indigo">FAQ</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">接入前常见问题</h2>
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
          <h2 className="mb-2 text-2xl font-black tracking-tight">把 Claude Code 接进您的终端</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微技术顾问，发送 Organization ID 即可代申请与环境接入，全程无需账号密码。
          </p>
          <button
            type="button"
            onClick={() => openModal('Claude Code 快速接入')}
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
