import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';
import { FAQ_ITEMS, type FaqTopic } from '../../shared/data';

// FAQ groups: visible order mirrors the FAQPage JSON-LD on faq/index.html
// (Google requires marked-up Q&A to be visible on the page).
const GROUPS: { topic: FaqTopic; title: string; accent: string }[] = [
  { topic: 'chatgpt', title: 'ChatGPT Plus / Codex 充值相关', accent: 'text-hyper-orange' },
  { topic: 'claude', title: 'Claude Code 接入相关', accent: 'text-hyper-indigo dark:text-indigo-400' },
  { topic: 'general', title: '通用办理问题', accent: 'text-emerald-500' },
];

/**
 * FAQ landing page ("/faq"): the complete question list grouped by product
 * line, deep-linking into both dedicated landing pages for conversion.
 */
export default function FaqPage() {
  const openModal = useOpenWechatModal();

  return (
    <AppShell currentPage="faq">
      {/* ================= Hero ================= */}
      <section className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center">
        {/* Single-topic H1: this page targets "常见问题 / 疑难解答" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-orange via-hyper-amber to-hyper-violet bg-clip-text text-transparent">
            办理前常见问题
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          关于 <a href="/chatgpt-plus" className="font-bold text-hyper-orange underline decoration-hyper-orange/40 underline-offset-4">ChatGPT Plus 充值</a> 与{' '}
          <a href="/claude-code" className="font-bold text-hyper-indigo underline decoration-hyper-indigo/40 underline-offset-4">Claude Code 接入</a>{' '}
          的安全、开通时效、发票与售后问题，都在这里。
        </p>
      </section>

      {/* ================= FAQ groups ================= */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        {GROUPS.map((group) => {
          const items = FAQ_ITEMS.filter((item) => item.topic === group.topic);
          if (items.length === 0) return null;
          return (
            <div key={group.topic} className="mb-10">
              <h2 className={`mb-5 flex items-center gap-2.5 text-xl font-black tracking-tight ${group.accent}`}>
                <span className="h-4 w-1 rounded-full bg-current" />
                {group.title}
              </h2>
              <div className="grid gap-4">
                {items.map((item) => (
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
            </div>
          );
        })}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          没找到答案？添加企微技术顾问直接提问，平均响应 &lt; 30 秒。
        </p>
      </section>

      {/* ================= Bottom CTA ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-hyper-orange/30 bg-gradient-to-r from-hyper-orange/10 via-transparent to-hyper-amber/10 p-10 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">还有疑问？直接问顾问</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微技术顾问，办理前免费咨询，全程无需提供账号密码。
          </p>
          <button
            type="button"
            onClick={() => openModal('免费咨询')}
            className="xa-btn-ignite-wechat inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码添加企业微信咨询</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">顾问秒回 →</span>
          </button>
        </div>
      </section>
    </AppShell>
  );
}
