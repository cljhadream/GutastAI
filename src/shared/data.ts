// Shared content data for all landing pages (single source of truth).
//
// Sync rules (see doc/TECH/Gutast_Web_DEPLOYMENT_GUIDE.md):
// - Plan prices here must mirror the Product/Offers JSON-LD in
//   chatgpt-plus/index.html.
// - FAQ answers here must mirror the FAQPage JSON-LD blocks in
//   chatgpt-plus/index.html, claude-code/index.html and faq/index.html,
//   filtered by the same `topic` rule each page uses:
//   chatgpt-plus page shows topic !== 'claude',
//   claude-code page shows topic !== 'chatgpt',
//   faq page shows everything.

// Self-hosted demo video (no third-party dependency, cached by the CDN).
export const VIDEO_SRC = '/recharge-guide.mp4';
// Instant-paint WebP cover: keeps the video off the LCP path.
export const POSTER_SRC = '/UI/video-poster.webp';
// WebVTT captions: crawler-readable transcript of the demo narration.
export const VTT_SRC = '/recharge-guide.vtt';
// Official-console walkthrough screenshot for the Organization ID guide.
export const ORG_GUIDE_SRC = '/claude_get_orgonization_di_guide.webp';
// WeChat QR code shown in the contact modal.
export const QR_SRC = '/UI/wechat-qr-code.webp';

export interface Plan {
  label: string;      // Eyebrow tag above the plan name
  name: string;
  price: number;      // Monthly price in CNY
  desc: string;
  cta: string;
  service: string;    // Service name passed to the modal
  featured?: boolean; // Recommended card (HOT, glow border)
  badge?: string;     // Floating badge on the featured card
}

export const CHATGPT_PLANS: Plan[] = [
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

export const PROMISES = [
  { icon: '⚡', text: '自有账号办理' },
  { icon: '🛡️', text: '无需提供密码' },
  { icon: '🔄', text: '支持正常续费' },
  { icon: '💎', text: '全周期订阅保障' },
];

export const STEPS = [
  { title: '选择套餐 / 准备账号', desc: '自有账号直接办理，无需提供账号密码。' },
  { title: '扫码接入 Gutast 企微', desc: '技术顾问 30 秒响应，沟通确认对应规格。' },
  { title: '通常几分钟内完成', desc: '官方正规渠道划扣激活，提供全周期订阅保障。' },
];

// 4-step recharge walkthrough shown under the demo video: crawler-readable
// mirror of the narration (Experience signal + long-tail queries).
export const WALKTHROUGH_STEPS = [
  { title: '备好账号', desc: '自己的账号保持登录，选好套餐' },
  { title: '扫码联系', desc: '扫企微二维码找专席顾问' },
  { title: '官方下单', desc: '官方订阅页发起升级，顾问代付' },
  { title: '收据质保', desc: '官方收据凭证，全周期质保 + 数电发票' },
];

// Zero-credential onboarding walkthrough for Claude Code. The step text is a
// crawler-readable mirror of the ORG_GUIDE_SRC screenshot (SEO + Experience).
export const ORG_ID_STEPS = [
  { title: '登录 Anthropic 官方控制台', desc: '浏览器访问 console.anthropic.com，使用您自己的账号登录。' },
  { title: '进入 Settings → Organization', desc: '点击控制台左下角「Settings」，在侧栏选择「Organization」设置页。' },
  { title: '复制 org_ 开头的 ID 发给顾问', desc: '复制 Organization ID 并通过企微发送，顾问即刻完成代申请与环境接入。' },
];

// E-E-A-T knowledge cards for the Organization ID workflow: Expertise,
// Trustworthiness, Authoritativeness, Experience — one card per signal.
export const ORG_ID_FACTS = [
  {
    icon: '🎓',
    tag: 'Expertise · 它是什么',
    text: 'Organization ID 是 Anthropic 官方分配的组织唯一标识符，以 org_ 开头，广泛用于 API 管理与团队协作场景。',
  },
  {
    icon: '🛡️',
    tag: 'Trust · 为什么安全',
    text: '它只是组织的"身份证号"：不是密码、不是验证码、更不是 API Key，持有者无法登录账号、无法调用接口、无法读取代码。',
  },
  {
    icon: '🔗',
    tag: 'Authority · 官方入口',
    text: '仅在 Anthropic 官方控制台查看与复制：console.anthropic.com/settings/organization，谨防仿冒钓鱼站点。',
  },
  {
    icon: '🧰',
    tag: 'Experience · 接入实操',
    text: '收到 org ID 后，顾问远程指导完成 Claude Code CLI 绑定与首次连通性验证，代码与数据 100% 留在您本地。',
  },
];

export type FaqTopic = 'chatgpt' | 'claude' | 'general';

export interface FaqItem {
  q: string;
  a: string;
  topic: FaqTopic; // Which landing page(s) surface this Q&A
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'ChatGPT Plus 代充安全吗？会不会封号？',
    a: 'Gutast AI 走官网官方渠道划扣，Plus 严格按官网 $20 美元原价采购，绝不使用黑卡、盗刷等低价通道，并提供全周期订阅保障。明显低于官方成本的低价代充才存在会员被撤销、账号受限的风险。',
    topic: 'chatgpt',
  },
  {
    q: '办理需要提供我的账号密码吗？',
    a: '不需要。全程在您自己的账号上完成：您在官方升级会话中发起订阅，专席仅代为完成支付，客服全程不索要任何账号密码。',
    topic: 'general',
  },
  {
    q: '付款后多久能开通会员？',
    a: '通常几分钟内完成官方划扣与激活；如遇官方高峰期出现延迟，顾问会第一时间同步进度。',
    topic: 'general',
  },
  {
    q: '可以开发票吗？',
    a: '支持。可提供国内正规数电发票，付款后向顾问说明报销需求并提供抬头即可。',
    topic: 'general',
  },
  {
    q: '会员到期后还能续费吗？',
    a: '可以。官方渠道办理支持正常续费，到期前顾问会主动提醒；原有账号、历史 Prompt 与工程记录 100% 保留。',
    topic: 'general',
  },
  {
    q: 'Claude Code 七档套餐怎么选？',
    a: '¥11 起，提供按天卡、周卡、月卡等七档灵活选择，官方客户端直连非镜像，日均 500 次请求。轻度试用选天卡，日常开发建议月卡，重度重构与算法攻坚建议高倍率档位。',
    topic: 'claude',
  },
  {
    q: 'Claude Code 接入为什么只需要 Organization ID？安全吗？',
    a: '安全。Organization ID 是 Anthropic 官方分配的组织唯一标识符（org_ 开头），仅用于在官方系统中定位组织与套餐归属：它不是密码也不是 API Key，任何人都无法用它登录账号、调用接口或读取代码。您可以在官方控制台 console.anthropic.com/settings/organization 自行查看与复制，接入全程无需提供账号密码或验证码。',
    topic: 'claude',
  },
];

// Page-level FAQ filter: keep the visible list identical to the per-page
// FAQPage JSON-LD (Google requires marked-up Q&A to be visible on the page).
export const faqForPage = (page: 'chatgpt-plus' | 'claude-code'): FaqItem[] =>
  FAQ_ITEMS.filter((item) =>
    page === 'chatgpt-plus' ? item.topic !== 'claude' : item.topic !== 'chatgpt',
  );

export const COMPARE_LOW = [
  { dim: '采购成本', text: '明显低于官方 $20 美元成本（黑产 / 盗刷）' },
  { dim: '账号密码', text: '索要账号密码代登，存在隐私泄漏风险' },
  { dim: '账号寿命', text: '几天内被官方撤销会员、封号且客服失联' },
  { dim: '历史记录', text: '频繁换号，历史 Prompt 与工程记录全丢' },
];

export const COMPARE_SAFE = [
  { dim: '采购成本', text: '100% 官方渠道划扣 $20 真实美金成本' },
  { dim: '账号密码', text: '办理过程中不需要向客服提供账号密码' },
  { dim: '账号寿命', text: '支持正常续费，提供全周期订阅保障服务' },
  { dim: '历史记录', text: '原有个人账号直接办理，数据资产 100% 保留' },
];
