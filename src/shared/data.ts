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

// Claude membership recharge plans: Pro/Max subscriptions proxy-purchased on
// the customer's own account. Upgrade between tiers = pay the difference.
export const CLAUDE_PLANS: Plan[] = [
  {
    label: 'Essential',
    name: 'Claude Pro',
    price: 145,
    desc: '官方个人标准版，claude.ai 对话与 Claude Code 轻度编程，自有账号官方渠道代充。',
    cta: '添加企微 · 办理 Pro',
    service: 'Claude Pro（¥145/月）',
  },
  {
    label: 'Pro Power',
    name: 'Claude Max 5x',
    price: 900,
    desc: '5 倍使用额度，高频对话、深度调研与 Claude Code 重度开发进阶之选。',
    cta: '立即开通 Max 5x',
    service: 'Claude Max 5x（¥900/月）',
    featured: true,
    badge: '🔥 高频用户首选',
  },
  {
    label: 'Max Ultra',
    name: 'Claude Max 20x',
    price: 1700,
    desc: '20 倍顶配额度，全天候重度使用与团队场景，支持对公付款与代开发票。',
    cta: '添加企微 · 咨询 20x',
    service: 'Claude Max 20x（¥1700/月）',
  },
];

// Recharge commitments specific to the Claude line: warranty scope and
// invoice support for business customers (rendered under the plan cards).
export const CLAUDE_NOTES = [
  {
    // Shield emoji written as escape sequences to avoid encoding corruption
    icon: '\u{1F6E1}\u{FE0F}',
    title: '只质保订阅',
    desc: '套餐有效期内会员失效免费补期续保；Claude 平台自身的封号风险不在质保范围内，请规范使用。',
  },
  {
    // Receipt emoji written as escape sequence to avoid encoding corruption
    icon: '\u{1F9FE}',
    title: '公司客户可代开发票',
    desc: '企业报销需求可代开发票，付款后向顾问说明并提供抬头即可办理。',
  },
];

// Guide screenshot: where to copy the Organization ID in claude.ai settings.
// Claude recharge only needs this ID — no password or verification code.
export const ORG_GUIDE_SRC = '/claude_get_orgonization_id_guide.webp';

// 3-step walkthrough rendered next to the guide screenshot.
export const ORG_ID_STEPS = [
  {
    title: '登录 claude.ai 打开设置',
    desc: '浏览器登录您自己的 Claude 账号，点击左下角头像进入 Settings 设置。',
  },
  {
    title: '复制 Organization ID',
    desc: '在「Organization / 组织」标签页找到组织 ID（UUID 格式）并复制。',
  },
  {
    title: '发给顾问完成代充',
    desc: '将 ID 发给企微顾问并付款，官方渠道代充，通常几分钟开通。',
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
    a: '不需要。ChatGPT Plus 全程在您自己的账号上完成：您在官方升级会话中发起订阅，专席仅代为完成支付；Claude 代充则只需提供 Organization ID（组织标识符），无需账号密码与验证码，客服全程不索要任何敏感凭据。',
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
    q: 'Claude 代充套餐怎么选？',
    a: 'Claude Pro ¥145/月适合日常对话与轻度编程；Max 5x ¥900/月提供 5 倍使用额度，适合高频开发与 Claude Code 重度使用；Max 20x ¥1700/月为 20 倍顶配额度。已有会员可补差价直接升级更高档位，顾问可按您的用量推荐最省的档位。',
    topic: 'claude',
  },
  {
    q: 'Claude 代充质保什么？包不包封号？',
    a: '我们只质保订阅本身：套餐有效期内会员失效免费补期续保；Claude 平台自身的封号风险不在质保范围内。公司客户需要报销可代开发票，付款后提供抬头即可。',
    topic: 'claude',
  },
  {
    q: 'Claude 中转 / 镜像和官方代充有什么区别？哪个更稳定？',
    a: '中转 / 镜像站把您的请求转发到共享账号或第三方接口，额度多人共享、随时可能跑路失联，也更容易被官方风控标记。Gutast 的 Claude 充值则是在您自己的官方账号上代充 Pro / Max 5x / Max 20x，官方客户端直连 Anthropic 官方服务器，不经过任何中转节点，是长期使用最稳定的方案。',
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
