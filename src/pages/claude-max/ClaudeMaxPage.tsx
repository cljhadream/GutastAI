import AppShell, { useOpenWechatModal, WechatIcon } from '../../shared/AppShell';

// ================= Page-scoped data =================
// MAX series SKU catalog. Prices MUST mirror the Offer JSON-LD blocks in
// claude-max/index.html (sync rule from doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md).
//
// Pricing model (from the product sheet 2026-11-03):
// - MAX5X: bundle = account tier + 125 USD/month subscription (~¥875)
//   MAX5X standard = 500 + 875 = 1375, MAX5X warranty = 900 + 875 = 1775.
// - MAX20X: bundle = account tier + first month 250 USD subscription (~¥1750)
//   MAX20X standard = 900 + 1750 = 2650, MAX20X warranty = 1700 + 1750 = 3450.
interface MaxSku {
  label: string;         // Eyebrow tag above the plan name
  name: string;
  price: number;         // Bundle price in CNY (account + subscription)
  account: string;       // Included: account technical service (tier + warranty/guidance)
  subscription: string;  // Included: accompanying subscription service
  perk: string;          // Bonus: overseas video platform finished accounts
  note?: string;         // Supplement / remark shown at the card bottom
  accountShort: string;  // Compact account summary for the price recap card
  featured?: boolean;    // Recommended card (glow border)
  badge?: string;        // Floating badge on the featured card
}

const MAX_SKUS: MaxSku[] = [
  {
    label: 'MAX5X · 标准版',
    name: 'MAX5X 成品号包订阅套餐',
    price: 1375,
    account: 'Max5X 账号：500 元',
    subscription: '配套订阅服务：125 美元 / 月，订阅费用透明，可提供真实付费凭证截图',
    perk: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）',
    note: '无远程一对一技术指导，可联系客服免费获取稳定使用参考方案',
    accountShort: 'Max5X 账号 500 元',
  },
  {
    label: 'MAX5X · 质保版',
    name: 'MAX5X 质保成品号包订阅套餐',
    price: 1775,
    account: 'Max5X 质保账号：900 元档位，享 2 周服务质保，1:1 远程技术指导',
    subscription: '配套订阅服务：125 美元 / 月，订阅费用透明，可提供真实付费凭证截图',
    perk: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）',
    note: '可增购多人团队成套部署方案，310 元起，费用不含在本套餐内，按需选购',
    accountShort: 'Max5X 质保账号 900 元 · 2 周质保',
    featured: true,
    badge: '🔥 质保推荐',
  },
  {
    label: 'MAX20X · 标准版',
    name: 'MAX20X 成品号包订阅套餐',
    price: 2650,
    account: '20X 成品账号：900 元',
    subscription: '配套订阅服务：送 1 个月 250 美元订阅，订阅费用透明，可提供真实付费凭证截图',
    perk: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）',
    note: '无远程一对一技术指导，可联系客服免费获取稳定使用参考方案',
    accountShort: '20X 成品账号 900 元',
  },
  {
    label: 'MAX20X · 质保版',
    name: 'MAX20X 质保成品号包订阅套餐',
    price: 3450,
    account: '质保成品账号：1700 元档位，享 2 周服务质保 + 全套网络方案 1:1 专家服务',
    subscription: '配套订阅服务：送 1 个月 250 美元订阅，订阅费用透明，可提供真实付费凭证截图',
    perk: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）',
    note: '配套多人团队部署方案，310 元起，费用不含在本套餐内，按需选购',
    accountShort: '质保成品账号 1700 元 · 2 周质保',
  },
];

// Trust cards under the plan grid: the three selling points every SKU shares.
const MAX_GUARANTEES = [
  {
    icon: '\u{1F9FE}',
    title: '订阅费用透明 · 凭证可核验',
    desc: 'MAX5X 档配套订阅 125 美元 / 月，MAX20X 档送 1 个月 250 美元订阅，费用构成清晰，可提供真实付费凭证截图。',
  },
  {
    icon: '\u{1F6E1}\u{FE0F}',
    title: '质保档 2 周服务质保',
    desc: '质保成品账号档位（MAX5X 质保版 / MAX20X 质保版）享 2 周服务质保 + 1:1 远程技术指导，交付后有保障。',
  },
  {
    icon: '\u{1F465}',
    title: '团队多用户支持',
    desc: '可增购多人团队成套部署方案（310 元起），顾问按团队人数与使用场景给出成套部署与运维指导。',
  },
];

// Team add-on deployment highlights (rendered inside the team section).
const TEAM_POINTS = [
  {
    title: '成套部署方案',
    desc: '从网络环境调试到交付使用，按团队规模一次性给出完整部署方案，310 元起按需选购。',
  },
  {
    title: '多用户协作',
    desc: '面向团队多用户场景的配置咨询，统一管理、按需分配，避免多人混用带来的环境冲突。',
  },
  {
    title: '持续运维指导',
    desc: '部署完成后提供运维指导服务，环境异常时顾问协助排查，团队使用不间断。',
  },
];

// 3-step onboarding flow for this product line.
const MAX_STEPS = [
  {
    title: '咨询选档',
    desc: '扫码联系企微顾问，说明个人或团队用量，顾问推荐 MAX5X / MAX20X 与标准 / 质保档位。',
  },
  {
    title: '确认套餐付款',
    desc: '确认套餐与增购项后付款，账号技术服务费用与配套订阅费用构成透明，凭证可核验。',
  },
  {
    title: '交付与质保',
    desc: '附赠海外视频平台成品号（Muse / FB / INS / X）；质保档位享 2 周服务质保，顾问全程跟进交付。',
  },
];

// Standard vs warranty bundle comparison (copy from the product sheet).
// type controls the row icon: plus = included, minus = not included, info = note.
interface CompareItem {
  text: string;
  type: 'plus' | 'minus' | 'info';
}

interface CompareTier {
  key: string;
  label: string;    // Eyebrow tag
  name: string;
  headline: string; // One-line positioning under the name
  featured?: boolean;
  badge?: string;
  items: CompareItem[];
}

const COMPARE_TIERS: CompareTier[] = [
  {
    key: 'standard',
    label: '标准档 · MAX5X / MAX20X',
    name: '成品号套餐',
    headline: '性价比之选，自行动手能力强优先',
    items: [
      { type: 'plus', text: '成品账号技术服务：500 元档起' },
      { type: 'plus', text: '配套订阅服务：MAX5X 125 美元 / 月 · MAX20X 送 1 个月 250 美元订阅，订阅费用透明，可提供真实付费凭证截图' },
      { type: 'plus', text: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）' },
      { type: 'minus', text: '无远程一对一技术指导' },
      { type: 'info', text: '补充说明：可联系客服免费获取稳定使用参考方案' },
    ],
  },
  {
    key: 'warranty',
    label: '质保档 · MAX5X / MAX20X',
    name: '质保成员号套餐',
    headline: '稳定省心之选，全程有人带',
    featured: true,
    badge: '⭐ 推荐档',
    items: [
      { type: 'plus', text: '质保成品账号技术服务：900 元起' },
      { type: 'plus', text: '享 2 周质保服务 + 1:1 远程技术指导' },
      { type: 'plus', text: '配套订阅服务：MAX5X 125 美元 / 月 · MAX20X 送 1 个月 250 美元订阅，订阅费用透明，可提供真实付费凭证截图' },
      { type: 'plus', text: '下单福利：附赠海外视频平台（Muse / FB / INS / X 成品号）' },
    ],
  },
];

// Team add-on material reference pricing (sold separately, optional purchases).
const TEAM_MATERIALS = [
  { item: 'IP（含 1T 流量，适合重载用户）', price: '150 元 / 月' },
  { item: '软路由硬件', price: '160 元' },
  { item: '软路由软件', price: '150 元' },
  { item: '软路由软件专业配置', price: '可寄送至我方技术人员代为调试' },
];

// Visible FAQ = the FAQPage JSON-LD in claude-max/index.html (same list).
const PAGE_FAQ = [
  {
    q: 'MAX 系列成品号包订阅套餐包含哪些内容？',
    a: '每个套餐包含两部分：成品账号技术服务（500 / 900 / 1700 元档位）与配套订阅服务（MAX5X 为 125 美元 / 月，MAX20X 送 1 个月 250 美元订阅）。订阅费用透明，可提供真实付费凭证截图；所有套餐均附赠海外视频平台（Muse / FB / INS / X 成品号），质保档位另享 2 周服务质保。',
  },
  {
    q: '配套订阅服务的费用怎么算？能提供凭证吗？',
    a: 'MAX5X 档配套订阅为 125 美元 / 月；MAX20X 档赠送 1 个月 250 美元订阅。订阅费用透明，可提供真实付费凭证截图供核验。订阅相关费用由客户自主完成支付，我们仅提供配套技术咨询协助。',
  },
  {
    q: '标准版和质保版有什么区别？',
    a: '同一 MAX 档位下，质保版对应更高档位的质保成品账号（MAX5X 质保版 900 元档位、MAX20X 质保版 1700 元档位），享 2 周服务质保 + 1:1 远程技术指导；标准版无远程一对一技术指导，可联系客服免费获取稳定使用参考方案。可根据预算与稳定性需求选择。',
  },
  {
    q: 'MAX5X 和 MAX20X 应该怎么选？',
    a: 'MAX5X 对应 5 倍订阅额度档位（1375 / 1775 元），适合个人开发者与高频日常使用；MAX20X 对应 20 倍订阅额度档位（2650 / 3450 元）并赠送 1 个月 250 美元订阅，适合重度使用与团队场景。团队多人使用可增购多人团队成套部署方案（310 元起）。',
  },
  {
    q: '多人团队怎么部署？费用怎么算？',
    a: '可增购多人团队成套部署方案，310 元起，费用不含在套餐内，按需选购；团队部署配套物料（IP、软路由等）单独选购、非强制。顾问会按团队人数与使用场景给出成套部署与运维指导方案。',
  },
  {
    q: '下单福利附赠的海外视频平台成品号是什么？',
    a: '所有套餐下单均附赠海外视频平台（Muse / FB / INS / X 成品号），下单即送，随套餐一并交付。',
  },
  {
    q: '质保政策是怎样的？',
    a: '质保成品账号档位（MAX5X 质保版 / MAX20X 质保版）享 2 周服务质保，MAX20X 质保版另含全套网络方案 1:1 专家服务；标准档位无质保期。本项目仅提供网络环境调试、技术部署咨询与运维指导服务。',
  },
];

/**
 * Claude Max finished-account bundle landing page ("/claude-max"): MAX5X /
 * MAX20X standard & quality bundles, verifiable subscription proofs, team
 * multi-user add-on deployment, page-scoped FAQ and the compliance disclaimer.
 * Single H1 topic so this URL ranks for "Claude Max 成品号" queries.
 */
export default function ClaudeMaxPage() {
  const openModal = useOpenWechatModal();

  return (
    <AppShell currentPage="claude-max">
      {/* ================= Hero ================= */}
      <section className="relative mx-auto max-w-4xl px-6 pb-10 pt-14 text-center">
        {/* Capability badges */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-hyper-violet/30 bg-hyper-violet/10 px-4 py-2 font-mono text-xs font-bold text-hyper-violet dark:text-violet-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-violet" />
            订阅配套服务 · 可核验付费凭证
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            团队多用户支持
          </div>
        </div>

        {/* Single-topic H1: this page targets "Claude Max 成品号" queries */}
        <h1 className="mb-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
          <span className="xa-gradient-text bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange bg-clip-text text-transparent">
            MAX 系列｜全球化网络适配咨询方案
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
          Claude Max 成品号包订阅套餐，MAX5X / MAX20X 标准与质保四档可选——
          <strong className="font-bold text-slate-900 underline decoration-hyper-violet dark:text-white">
            送1月订阅配套服务｜可核验付费凭证
          </strong>
          ，MAX5X 送125 美元订阅、MAX20X 送250 美元订阅，1:1服务上团队多用户成套方案。
        </p>

        {/* Price highlight */}
        <div className="mb-8 inline-flex items-baseline gap-2 rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/60 px-6 py-3 shadow-sm backdrop-blur-md dark:border-hyper-darkBorder dark:bg-hyper-darkCard/60">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">四档套餐 · 起价仅</span>
          <span className="font-mono text-4xl font-black text-hyper-violet dark:text-violet-400">¥1375</span>
        </div>

        {/* Primary CTA row */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => openModal('MAX 系列成品号包订阅套餐')}
            className="xa-btn-ignite-wechat flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95 sm:w-auto"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码选档 · 立即咨询</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">¥1375 起 →</span>
          </button>

          <a
            href="#plans"
            className="w-full rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard/50 px-7 py-4 text-center text-sm font-bold shadow-sm backdrop-blur-md transition hover:border-hyper-violet hover:text-hyper-violet dark:border-hyper-darkBorder dark:bg-hyper-darkCard/50 dark:hover:text-violet-400 sm:w-auto"
          >
            查看四档套餐 ↓
          </a>
        </div>
      </section>

      {/* ================= Plans (4 SKUs) ================= */}
      <section
        id="plans"
        className="relative mx-auto max-w-5xl scroll-mt-24 overflow-hidden rounded-3xl border border-hyper-violet/30 bg-hyper-lightCard px-6 pb-10 shadow-glow-card dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:px-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />

        {/* Section header */}
        <div className="mb-8 max-w-3xl pt-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              订阅配套服务 · 可核验付费凭证
            </span>
            <span className="rounded-md border border-hyper-lightBorder px-3 py-1 font-mono text-xs text-slate-500 dark:border-hyper-darkBorder dark:text-slate-400">
              MAX5X / MAX20X · 标准 / 质保
            </span>
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
            MAX 系列四档套餐 · <span className="font-mono text-hyper-violet dark:text-violet-400">明码标价</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            每个套餐 = 成品账号 + 配套订阅服务（费用透明可核验）。
            按用量选 MAX5X 或 MAX20X，追求稳定选质保套餐即可。
          </p>
        </div>

        {/* SKU cards: violet accent, 2x2 grid mirrors the sibling pricing layout */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {MAX_SKUS.map((sku) => (
            <div
              key={sku.name}
              className={`relative flex flex-col justify-between rounded-3xl bg-slate-50/60 p-7 transition duration-300 dark:bg-white/[0.02] ${
                sku.featured
                  ? 'border-2 border-hyper-violet shadow-glow-card'
                  : 'group border border-hyper-lightBorder hover:border-hyper-violet/50 dark:border-hyper-darkBorder'
              }`}
            >
              {sku.badge && (
                <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-hyper-violet to-hyper-indigo px-3 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                  {sku.badge}
                </div>
              )}
              <div>
                <div className={`mb-2 font-mono text-xs uppercase tracking-wider ${sku.featured ? 'font-bold text-hyper-violet dark:text-violet-400' : 'text-slate-400'}`}>
                  {sku.label}
                </div>
                <h3 className={`text-xl transition ${sku.featured ? 'font-black' : 'font-bold group-hover:text-hyper-violet dark:group-hover:text-violet-400'}`}>
                  {sku.name}
                </h3>
                <div className="mb-3 mt-4 flex items-baseline gap-1">
                  <span className={`font-mono text-4xl font-black tracking-tight ${sku.featured ? 'text-hyper-violet dark:text-violet-400' : ''}`}>
                    ¥{sku.price}
                  </span>
                  <span className="text-xs font-normal text-slate-400">/ 套</span>
                </div>
                {/* Included items: account tier + subscription + bonus perk */}
                <ul className="mb-4 space-y-2.5 text-xs leading-relaxed">
                  <li className="flex gap-2 text-slate-600 dark:text-slate-300">
                    <span className="mt-0.5 text-hyper-violet dark:text-violet-400">✓</span>
                    <span>
                      <strong className="font-bold">{sku.account}</strong>
                    </span>
                  </li>
                  <li className="flex gap-2 text-slate-600 dark:text-slate-300">
                    <span className="mt-0.5 text-hyper-violet dark:text-violet-400">✓</span>
                    <span>{sku.subscription}</span>
                  </li>
                  <li className="flex gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="mt-0.5">🎁</span>
                    <span>{sku.perk}</span>
                  </li>
                </ul>
                {sku.note && (
                  <p className="mb-6 rounded-xl border border-hyper-amber/30 bg-hyper-amber/10 px-3 py-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    备注：{sku.note}
                  </p>
                )}
              </div>
              {sku.featured ? (
                <button
                  type="button"
                  onClick={() => openModal(sku.name)}
                  className="w-full rounded-xl bg-gradient-to-r from-hyper-violet to-hyper-indigo py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:from-hyper-indigo hover:to-hyper-violet active:scale-95"
                >
                  ⚡ 扫码咨询 · 办理本套餐
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal(sku.name)}
                  className="w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold shadow-sm transition hover:border-hyper-violet hover:text-hyper-violet active:scale-95 dark:border-slate-800 dark:hover:text-violet-400"
                >
                  扫码咨询 · 办理本套餐
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Universal perk strip: gift finished video accounts, same for every SKU */}
        <div className="mb-8 flex flex-col items-center justify-between gap-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-transparent to-hyper-violet/10 p-6 md:flex-row">
          <div>
            <h3 className="text-lg font-black">✅ 全套餐通用下单福利</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              附赠海外视频平台成品号（Muse / FB / INS / X），下单即送，随套餐一并交付。
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('MAX 系列 · 下单福利咨询')}
            className="w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-hyper-violet to-hyper-indigo px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-hyper-indigo hover:to-hyper-violet active:scale-95 md:w-auto"
          >
            咨询下单福利 →
          </button>
        </div>

        {/* 3-step onboarding flow */}
        <div className="grid gap-4 sm:grid-cols-3">
          {MAX_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-5 dark:border-hyper-darkBorder dark:bg-white/[0.02]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-hyper-violet to-hyper-indigo font-mono text-xs font-black text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Standard vs warranty bundle comparison ================= */}
      <section
        id="compare"
        className="mx-auto max-w-5xl scroll-mt-24 px-6 pt-14"
      >
        <div className="overflow-hidden rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-8 shadow-sm dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:p-10">
          {/* Section header */}
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-md border border-hyper-indigo/30 bg-hyper-indigo/10 px-3 py-1 font-mono text-xs font-bold text-hyper-indigo dark:text-indigo-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-indigo" />
              VS 对比
            </span>
            <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
              成品号 <span className="font-mono text-hyper-violet dark:text-violet-400">vs</span>{' '}
              质保成员号 · 一眼看懂差在哪
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              同一 MAX 档位下的两个版本：成品号套餐求性价比，
              质保成员号套餐多一层 2 周质保与 1:1 远程技术指导。
            </p>
          </div>

          {/* Two comparison cards */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            {COMPARE_TIERS.map((tier) => (
              <div
                key={tier.key}
                className={`relative flex flex-col p-7 transition duration-300 ${
                  tier.featured
                    ? 'rounded-3xl border-2 border-hyper-violet shadow-glow-card'
                    : 'rounded-3xl border border-hyper-lightBorder hover:border-hyper-violet/50 dark:border-hyper-darkBorder'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-hyper-violet to-hyper-indigo px-3 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                    {tier.badge}
                  </div>
                )}
                <div className={`mb-1.5 font-mono text-xs uppercase tracking-wider ${tier.featured ? 'font-bold text-hyper-violet dark:text-violet-400' : 'text-slate-400'}`}>
                  {tier.label}
                </div>
                <h3 className={`text-xl ${tier.featured ? 'font-black' : 'font-bold'}`}>{tier.name}</h3>
                <p className="mb-4 mt-1 text-xs text-slate-500 dark:text-slate-400">{tier.headline}</p>

                {/* Included / excluded rows */}
                <ul className="mb-6 space-y-3 text-xs leading-relaxed">
                  {tier.items.map((item) => (
                    <li
                      key={item.text}
                      className={`flex gap-2 ${
                        item.type === 'minus'
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={
                          item.type === 'plus'
                            ? 'mt-0.5 shrink-0 text-emerald-500'
                            : item.type === 'minus'
                              ? 'mt-0.5 shrink-0 text-slate-400 dark:text-slate-500'
                              : 'mt-0.5 shrink-0'
                        }
                      >
                        {item.type === 'plus' ? '✓' : item.type === 'minus' ? '✕' : '📌'}
                      </span>
                      <span className={item.type === 'minus' ? '' : 'font-medium'}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                {tier.featured ? (
                  <button
                    type="button"
                    onClick={() => openModal(tier.name)}
                    className="mt-auto w-full rounded-xl bg-gradient-to-r from-hyper-violet to-hyper-indigo py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:from-hyper-indigo hover:to-hyper-violet active:scale-95"
                  >
                    ⚡ 扫码咨询 · 办理质保档
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openModal(tier.name)}
                    className="mt-auto w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold shadow-sm transition hover:border-hyper-violet hover:text-hyper-violet active:scale-95 dark:border-slate-800 dark:hover:text-violet-400"
                  >
                    扫码咨询 · 办理标准档
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Remark: team add-on + material reference pricing (sold separately) */}
          <div className="rounded-2xl border border-hyper-amber/30 bg-hyper-amber/10 p-6">
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              备注：质保成员号套餐可增购多人团队成套部署方案，
              <strong className="font-bold">310 元起</strong>
              ，费用不含在本套餐内，按需选购。
            </p>
            <h3 className="mb-3 mt-4 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              团队部署配套物料参考报价（单独选购，非强制）
            </h3>
            <div className="grid gap-2">
              {TEAM_MATERIALS.map((row) => (
                <div
                  key={row.item}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hyper-lightBorder bg-hyper-lightCard px-4 py-2.5 text-xs dark:border-hyper-darkBorder dark:bg-white/[0.03]"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{row.item}</span>
                  <span className="shrink-0 font-mono font-black text-hyper-violet dark:text-violet-400">
                    {row.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Guarantees: verifiable proofs / warranty / team ================= */}
      <section className="mx-auto max-w-5xl px-6 pb-4 pt-14">
        <div className="overflow-hidden rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-8 shadow-sm dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:p-10">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-md border border-hyper-violet/30 bg-hyper-violet/10 px-3 py-1 font-mono text-xs font-bold text-hyper-violet dark:text-violet-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-violet" />
              服务保障
            </span>
            <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
              为什么选 MAX 系列配套服务
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              费用透明、凭证可核验、质保档有质保，团队场景有成套部署方案——每一项都落在纸面上。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {MAX_GUARANTEES.map((g) => (
              <div
                key={g.title}
                className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-6 transition hover:border-hyper-violet/50 dark:border-hyper-darkBorder dark:bg-white/[0.02]"
              >
                <div className="mb-3 text-2xl">{g.icon}</div>
                <h3 className="mb-2 text-base font-black">{g.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Team multi-user add-on deployment ================= */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="overflow-hidden rounded-3xl border border-hyper-lightBorder bg-hyper-lightCard p-8 shadow-sm dark:border-hyper-darkBorder dark:bg-hyper-darkCard md:p-10">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Left: headline + team points */}
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-md border border-hyper-indigo/30 bg-hyper-indigo/10 px-3 py-1 font-mono text-xs font-bold text-hyper-indigo dark:text-indigo-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-hyper-indigo" />
                团队多用户支持
              </span>
              <h2 className="mb-3 text-2xl font-black tracking-tight md:text-3xl">
                多人团队？增购
                <span className="font-mono text-hyper-indigo dark:text-indigo-400"> 成套部署方案</span>
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                团队多人使用场景下，单套餐不够用：可增购多人团队成套部署方案，
                <strong className="font-bold font-mono text-hyper-indigo dark:text-indigo-400">310 元起</strong>
                ，费用不含在套餐内，按需选购，顾问按人数与场景一对一出方案。
              </p>
              <div className="space-y-4">
                {TEAM_POINTS.map((point) => (
                  <div key={point.title} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-hyper-indigo to-hyper-violet" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{point.title}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openModal('多人团队成套部署方案')}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-hyper-indigo to-hyper-violet py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:from-hyper-violet hover:to-hyper-indigo active:scale-95 sm:w-auto sm:px-8"
              >
                咨询团队部署方案（310 元起）→
              </button>
            </div>

            {/* Right: price-frame recap card */}
            <div className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 p-6 dark:border-hyper-darkBorder dark:bg-white/[0.02]">
              <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                四档套餐速览
              </h3>
              <ul className="space-y-3">
                {MAX_SKUS.map((sku) => (
                  <li
                    key={sku.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-hyper-lightBorder bg-hyper-lightCard px-4 py-3 text-xs dark:border-hyper-darkBorder dark:bg-white/[0.03]"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{sku.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {sku.accountShort}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-lg font-black text-hyper-violet dark:text-violet-400">
                      ¥{sku.price}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                MAX5X 档配套订阅 125 美元 / 月，MAX20X 档送 1 个月 250 美元订阅，费用透明，可提供真实付费凭证截图。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ (page-scoped) ================= */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-hyper-violet">FAQ</span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">办理前常见问题</h2>
        </div>
        <div className="grid gap-4">
          {PAGE_FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-hyper-lightBorder bg-hyper-lightCard px-6 py-4 shadow-sm transition open:border-hyper-violet/40 dark:border-hyper-darkBorder dark:bg-hyper-darkCard"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="font-mono text-lg text-hyper-violet transition group-open:rotate-45 dark:text-violet-400">＋</span>
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
          className="group relative block overflow-hidden rounded-3xl border border-hyper-indigo/30 bg-gradient-to-br from-hyper-lightCard via-hyper-lightCard to-hyper-indigo/5 p-7 shadow-sm transition hover:-translate-y-1 hover:border-hyper-indigo dark:from-hyper-darkCard dark:via-hyper-darkCard dark:to-hyper-indigo/10"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hyper-indigo via-hyper-violet to-hyper-orange" />
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-hyper-indigo dark:text-indigo-400">
                ALSO AVAILABLE
              </div>
              <h2 className="text-lg font-black tracking-tight">已有自己的 Claude 账号？官方渠道代充 ¥145 起</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Claude Pro / Max 会员代充：只需 Organization ID，官方渠道划扣，已有会员可补差价升级。
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
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-hyper-violet/30 bg-gradient-to-r from-hyper-violet/10 via-transparent to-hyper-indigo/10 p-10 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">咨询 MAX 系列套餐</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            添加企微顾问，按个人 / 团队用量推荐档位，订阅费用透明、付费凭证可核验，质保档享 2 周服务质保。
          </p>
          <button
            type="button"
            onClick={() => openModal('MAX 系列成品号包订阅套餐')}
            className="xa-btn-ignite-wechat inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-wechat to-wechat-dark px-8 py-4 text-base font-bold text-white shadow-glow-wechat active:scale-95"
          >
            <WechatIcon className="h-6 w-6" />
            <span>扫码添加企业微信咨询</span>
            <span className="rounded-md bg-black/20 px-2 py-0.5 font-mono text-xs opacity-90">顾问秒回 →</span>
          </button>
        </div>
      </section>

      {/* ================= Compliance disclaimer (required wording) ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-2xl border border-hyper-lightBorder bg-slate-50/60 px-6 py-5 dark:border-hyper-darkBorder dark:bg-white/[0.02]">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">免责声明</h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            本项目仅提供网络环境调试、技术部署咨询与运维指导服务，不出售任何平台账号，不提供第三方代付充值服务。
            订阅相关费用由客户自主完成支付，我们仅提供配套技术咨询协助。使用者需自觉遵守所在地法律法规以及各平台用户服务协议。
          </p>
        </div>
      </section>
    </AppShell>
  );
}
