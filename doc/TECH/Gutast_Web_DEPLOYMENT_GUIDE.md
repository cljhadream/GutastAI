# Gutast AI (gutast.com) 部署指南

**文档状态：** 已实施 V1.0（SEO P0/P1 优化：构建时预渲染、robots/sitemap、JSON-LD、社交分享图、FAQ）；V1.1 新增 Claude IP 风险检测（`/claude-ip` + `/api/ip/*` Pages Function，含密钥与 WAF 配置）；V1.2 更新构建自检命令（多页面预渲染断言）
**更新日期：** 2026年10月26日
**部署目标：** https://www.gutast.com/
**关联变更集：** `openspec/changes/seo-p0-p1-optimization/` · `openspec/changes/claude-risk-check/`

## 1. 构建与预渲染

本项目为 React 18 + Vite 5 多页应用（`/`、`/claude-code/`、`/chatgpt-plus/`、`/faq/`、`/claude-ip/`），通过 `@prerenderer/rollup-plugin` + Puppeteer 在**构建时**将各页面完整渲染 DOM 快照进对应 `dist/<route>/index.html`，爬虫无需执行 JavaScript 即可抓取标题、H1、定价（¥145 起）、对比表、流程与 FAQ。

```bash
npm ci
npm run build    # tsc && vite build（预渲染已内置于 vite build 生命周期）
```

- 渲染完成信号：`src/App.tsx` 首次 commit 后 `document.dispatchEvent(new Event('render-event'))`，`vite.config.ts` 的 `rendererOptions.renderAfterDocumentEvent` 监听同一事件。
- 构建后自检（无 JS 内容断言，覆盖全部 5 个预渲染页面，任一页失败则退出码非 0）：

```bash
node -e "const fs=require('fs');const pages=['','claude-code/','chatgpt-plus/','faq/','claude-ip/'];let fail=0;for(const p of pages){const s=fs.readFileSync('dist/'+p+'index.html','utf8');const kb=Math.round(s.length/102.4)/10;const ok=kb>15&&s.indexOf('<div id=\"root\"></div>')<0;fail+=ok?0:1;console.log(('/'+p).padEnd(15),kb+' KB',ok?'OK':'FAIL (pre-render missing)')}process.exit(fail)"
```

- 首页关键词断言：

```bash
node -e "const s=require('fs').readFileSync('dist/index.html','utf8'); console.log(['Gutast AI','ChatGPT Plus','代充','¥145','极简'].every(k=>s.includes(k)))"
```

输出应为 `true`（当前各页约 27–46 kB，若为 CSR 空壳则仅 ~2 kB 且上方脚本输出 FAIL）。

### 1.1 构建环境要求（CI）

- Node 18+；Puppeteer 构建期需要可运行的**无头 Chromium**（`npm ci` 时自动下载到 `~/.cache/puppeteer`，仅 dev 依赖，不进生产产物）。
- Linux CI（如 GitHub Actions ubuntu-latest）需安装 Chromium 系统依赖，或在 job 中使用 `puppeteer browsers install chrome` 前置步骤；Windows 本地构建无需额外配置。
- 若构建环境**无法运行无头浏览器**（部分受限 CI）：预渲染会失败。备选方案为在 `<div id="root">` 内手写静态语义镜像（React mount 后替换），但存在内容漂移风险，仅作应急。

## 2. 域名与 301 重定向（R10）

- **canonical 域名为 `https://www.gutast.com/`**（index.html、sitemap.xml、JSON-LD、og:url 全部使用 www 主机）。
- 托管层必须配置：**裸域 `gutast.com` → `https://www.gutast.com/` 301 永久重定向**，避免双主机重复内容稀释权重。若托管于 Vercel/Netlify，在域名设置中将 apex domain 重定向到 www（Vercel: Domains → Redirect to www.gutast.com，选择 308/301 Permanent）。
- HTTP → HTTPS 301 亦为必须项。
- 验证：`curl -sI https://gutast.com/ | grep -i location` 应返回 `https://www.gutast.com/`。

## 3. JSON-LD 价格同步（发布检查清单）

结构化数据中的价格**手工维护在 `index.html`** 的 `<script type="application/ld+json">`（Product.offers），与 `src/App.tsx` 的 `CHATGPT_PLANS` 是两个来源：

| Offer | 价格（CNY） |
| --- | --- |
| Codex Plus | 145 |
| Codex Pro 5X | 680 |
| Codex Pro 20X | 1280 |

**改价时必须同步两处**：`src/App.tsx` `CHATGPT_PLANS` + `index.html` JSON-LD offers，并检查首屏价格锚点文案与 og-cover.png 上的价格角标是否过期。
**FAQ 同步**：`src/App.tsx` `FAQ_ITEMS` 与 `index.html` FAQPage.mainEntity 需逐字镜像（当前 6 条已同步）。
改完后本地校验 JSON-LD 语法：构建后在 `dist/index.html` 提取 `application/ld+json` 用任意 JSON parser 验证，或部署后用 Google Rich Results Test / Schema Markup Validator 在线复检。

## 4. 部署后验证清单

1. **爬虫可见性**：`curl -s https://www.gutast.com/ | grep -c "代充"` ≥ 1（0 = CSR 空壳上线，检查构建日志中预渲染是否被跳过）。
2. **robots.txt 可达**：`https://www.gutast.com/robots.txt` 返回 200，含 `Sitemap: https://www.gutast.com/sitemap.xml`。
3. **sitemap.xml 可达**：`https://www.gutast.com/sitemap.xml` 返回 200。
4. **搜索引擎提交**：Google Search Console 提交 sitemap；百度搜索资源平台提交链接（可配合 API/手动推送）。
5. **Lighthouse SEO 审计**：目标 ≥ 95；同时确认 LCP 元素为首屏文字块而非视频（已通过 video `poster` + `preload="metadata"` 将视频移出 LCP 路径）。
6. **分享卡片预览**：Slack / Telegram / X 贴链接，确认 1200x630 og-cover.png 与标题正常展示（分享缓存可用各平台 Post Inspector / Card Validator 刷新）。

## 5. 静态资产索引

| 文件 | 规格 | 用途 |
| --- | --- | --- |
| `public/UI/og-cover.png` | 1200x630 | og:image / twitter:image 分享封面 |
| `public/UI/video-poster.webp` | 1280x720 | 首屏视频封面（LCP 优化，WebP ~16 KB） |
| `public/UI/apple-touch-icon.png` | 180x180 | iOS 桌面图标 |
| `public/UI/favicon-48.png` | 48x48 | PNG favicon 回退（webp 之外的浏览器） |
| `public/robots.txt` / `public/sitemap.xml` | — | 爬虫指引；lastmod 随内容更新手动维护 |

## 6. Claude IP 风险检测（/claude-ip + /api/ip/*）

页面在浏览器端完成出口 IP / 连通性 / WebRTC / 环境检测；唯一的服务端依赖是 Pages Function `functions/api/ip/[ip].ts`：它把 Claude 出口 IP 转发给 ipapi.is 查询情报并在边缘缓存 24 h（成功响应浏览器缓存 1 h；错误响应一律 `no-store`；无 CORS 头，仅同源可用）。同时并行查询 RIPEstat 的 `rir-stats-country`（免费、无需 key，按合理使用原则调用）取 IP 的 RIR 注册国家，用于原生 IP 判定；RIPEstat 查不到时原生 IP 显示"未知"，该结果只缓存 10 分钟以便尽快重试。

### 6.1 `IPAPI_KEY` 密钥

- **注册**：https://ipapi.is 注册免费账号（1,000 次/天；仅查询 Claude 出口 IP 且有 24 h 边缘缓存，量级足够；不足时升级付费档）。
- **生产环境**：Cloudflare Dashboard → Workers & Pages → `gutast` 项目 → Settings → Environment variables → **Production** → Add variable：名称 `IPAPI_KEY`，值填 API Key，选择 **Encrypt**（加密），保存后需要**重新部署**一次才生效。
- **本地环境**：项目根目录创建 `.dev.vars` 文件（已被 `.gitignore` 排除，严禁提交）：

  ```ini
  IPAPI_KEY=你的key
  ```

  `wrangler pages dev` 会自动加载该文件注入 `env.IPAPI_KEY`。
- **无 Key 也能跑**：Function 在缺失 `IPAPI_KEY` 时回退到 ipapi.is 匿名档（无风险标记、score 为 null），页面风险卡显示"暂无数据"，其余卡片不受影响——这是预期行为，不是故障。

### 6.2 WAF 限流规则（防白嫖代理）

Function 无 CORS 头且校验严格，但仍在 Cloudflare 层加一道限流（建议 10 次 / 10 秒 / 客户端 IP）：

Dashboard → Security → WAF → Rate limiting rules → Create rule：

- **Match requests**（表达式编辑器）：

  ```
  (http.request.uri.path starts_with "/api/ip/")
  ```

- **With the same characteristics**: IP address
- **Period**: 10 seconds；**Requests more than**: 10
- **Action**: Block（10 秒冷却后自动放行）

免费版 Rate limiting（1 条规则额度）可覆盖该路径；若额度被其它规则占用，可退化为 WAF Custom Rule 直接对 `/api/ip/` 的非浏览器 UA 或异常 UA 拒绝（弱化方案，优先用 Rate limiting）。

### 6.3 本地测试

```bash
npm run build                                   # tsc + vite build（预渲染含 /claude-ip）
npx wrangler pages dev dist --port 8788         # 静态产物 + functions/ 本地运行，自动读 .dev.vars
```

- 打开 `http://127.0.0.1:8788/claude-ip`：各卡片应显示真实数据或明确失败态。
- 接口自检：

  ```bash
  curl -si "http://127.0.0.1:8788/api/ip/8.8.8.8" | head -n 15   # 200 + cache-control: public, max-age=3600
  curl -si "http://127.0.0.1:8788/api/ip/192.168.1.1"            # 400 invalid_ip（内网拒绝）
  curl -si -X POST "http://127.0.0.1:8788/api/ip/8.8.8.8"        # 405 method_not_allowed
  ```

- 注意：wrangler 4 需要 Node 20+；本机默认 Node 18 时用 nvm 的 node 直跑（例：`& "C:\Documents\tools\nvm4\nodejs\node.exe" node_modules\wrangler\bin\wrangler.js pages dev dist --port 8788`），若 workerd 报 compatibility date 不支持，追加 `--compatibility-date=2026-05-03`。

### 6.4 部署后检查清单

1. 页面可达且预渲染完整：`curl -s https://www.gutast.com/claude-ip | grep -c "检测原理"` ≥ 1。
2. Function 正常：`curl -si "https://www.gutast.com/api/ip/8.8.8.8"` 返回 200 且带 `cache-control: public, max-age=3600`；页面风险卡显示评分（而非"暂无数据"）。
3. 异常路径：`/api/ip/192.168.1.1` → 400；POST → 405。
4. sitemap 含新 URL：`curl -s https://www.gutast.com/sitemap.xml | grep -c "claude-ip"` = 1。
5. header / footer 导航出现"Claude IP 检测"且在该页为激活态。
6. 搜索引擎提交：Google Search Console 与百度搜索资源平台提交 `https://www.gutast.com/claude-ip`。
7. 隐私声明第八节（IP 风险检测工具）随本版本一同上线。
