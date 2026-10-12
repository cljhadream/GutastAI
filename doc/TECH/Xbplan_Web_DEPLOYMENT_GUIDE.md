# 学爸智划 (Xbplan Web) 部署指南

**文档状态：** 已实施 V1.1（阶段 1-3 全部完成：本地预渲染 50/50、CI lint/security/deploy 全绿、线上 canonical/sitemap 验证通过、Git 集成旁路已关闭；`/lobster` 分区已屏蔽）
**更新日期：** 2026年10月09日
**部署目标：** https://www.xbplan.com/
**参考蓝本：** Kiword Web 部署指南（同团队的 SEO 预渲染部署实践）

## 0. 标注约定

本文档描述「部署架构」。阶段 1-3（预渲染工具链、构建脚本、sitemap 生成、Vercel/Secrets 配置、CI 上线）**均已实施并验证（50/50 路由）**，全文符号区分现状与目标：

| 符号 | 含义 |
| --- | --- |
| ✅ | 设施已存在，直接使用 |
| 🚧 | 设施待实施，按本文档所述方案落地 |
| ℹ️ | 现状说明或可选扩展 |

**实施路线图见第 13 节**，落地前请勿将本文档中的「部署流程」当作已生效事实。

## 1. 概述

本项目采用与 Kiword 相同的「**公开页预渲染静态化 + 动态数据页 SPA 运行时渲染**」混合策略：

- **公开页（SEO 页面）**：在构建阶段通过 Playwright + Chromium 预渲染成静态 HTML，使百度、Google、Bing 等搜索引擎爬虫无需执行 JavaScript 即可拿到完整的标题、正文、meta 与 canonical 内容。本项目以百度搜索为主要流量来源，纯客户端渲染（CSR）下爬虫只能抓到 `<div id="root"></div>` 空壳，是当前 SEO 的最大短板，预渲染即为解决此问题。
- **动态数据页**：内容数据在运行时从 API 拉取的页面（如 `/lobster/diary/:slug`）原设计保留客户端渲染；当前 `/lobster` 分区已整体屏蔽（重定向到首页），站点暂无此类页面，详见 5.3。

部署完全由 **GitHub CI 编译后再部署**：CI 内先完成 `tsc + vite build` 编译与 Playwright 预渲染，生成包含完整页面内容的**静态 HTML**，再通过 Vercel CLI `--prebuilt` 将编译好的静态成品上传至 Vercel。Vercel 侧通过 `git.deploymentEnabled: false` 禁用 Git 集成自动部署，**不会自行构建**，仅作为静态托管与 Serverless Functions 的接收方。整条链路为 `vercel pull → vercel build → vercel deploy` 三步。

> **为什么必须编译后再部署**：公开页以静态 HTML 形式上线，爬虫无需执行 JavaScript 即可抓取完整内容，对 SEO 显著优于纯 CSR。任何部署都必须以 CI 编译产物为准：编译或预渲染失败会导致 CI 失败，**未编译的代码不可能被部署上线**。

### 1.1 与 Kiword 的概念映射

| Kiword 概念 | 本项目对应 |
| --- | --- |
| Express 后端 `api/server.js` | Vercel Serverless Functions：`web/api/lobster/*.ts` |
| Supabase / Creem（数据库、支付） | @vercel/blob（站点无登录、无支付） |
| 博客源 `src/content/blog/*.md` | 文章数据模块 `src/data/articles/*.tsx`，经 `generated_articles.tsx` 的 `allArticles` 汇总 |
| 帮助中心 `HelpArticle.tsx` 的 `helpDocs` | 无帮助中心；预渲染路由来自静态路由表 |
| 动态页 `/login` `/account` `/success` | 无动态数据页（原 `/lobster/*` 已屏蔽，重定向首页） |
| GA4 + Consent Mode | 百度统计（硬编码于 `index.html`）+ 百度推送（`baidu-push.mjs`） |
| staging 双分支 + PR 发版 | 单 `main` 分支（staging 流程列为可选扩展，见第 9.3 节） |

## 2. 技术栈

- **前端**：React 18 + Vite 5 + TypeScript 5 + react-router-dom v7 + react-helmet-async + Tailwind CSS 3
- **后端**：Vercel Serverless Functions（TypeScript，`web/api/lobster/`）
- **数据与后端能力**：@vercel/blob（龙虾日记/技能的 manifest 与图片存放在 Blob）
- **SEO 能力**：`SEO.tsx`（canonical / OG / JSON-LD）、`public/robots.txt`、`dist/sitemap.xml`（构建时由 `scripts/generate-sitemap.mjs` 生成 ✅；`public/sitemap.xml` 手工文件已删除 ✅）、百度统计、百度推送
- **运行环境**：Node 22 LTS（CI 与本地保持一致；Functions 运行时版本以 Vercel 项目设置为准）
- **预渲染**：Playwright（Chromium）
- **托管平台**：Vercel（项目 `trae_m764jloz`）
- **代码仓库**：`github.com/cljhadream/Xbplan-Web`（当前仅 `main` 分支）

## 3. 仓库结构与部署架构

### 3.1 仓库结构

本仓库为 **monorepo**，Vite 应用位于 `web/` 子目录：

```
Xbplan-Web/
├── .github/workflows/ci-cd.yml    ✅ GitHub Actions 流水线（已创建，待 Secrets 配置后首次运行）
├── .vercel/project.json           ✅ 本地 Vercel 项目关联（已被 .gitignore 忽略）
├── vercel.json                    ℹ️ 根目录副本，与 web/vercel.json 内容保持一致，仅作占位
└── web/                           ← Vercel 项目的 Root Directory 指向这里
    ├── vercel.json                ✅ rewrites + buildCommand(build:vercel) + outputDirectory(dist)
    ├── package.json               ✅ 已含 build:prerender / build:vercel / setup:chromium / sitemap 脚本
    ├── index.html                 ✅ 百度统计脚本（按 hostname 判断非本地环境才加载）
    ├── api/lobster/               ✅ Serverless Functions：manifest / entry / image
    ├── public/                    ✅ robots.txt、sitemap.xml（手工版，待 CI 验证后删除）、静态资源
    ├── scripts/                   ✅ 已有 upload-lobster-images.mjs 等
    │   ├── prerender.mjs          ✅ 预渲染脚本（manifest 预拉取 + 每路由独立 context）
    │   ├── setup-chromium.mjs     ✅ 安装 Chromium 及 Linux 系统依赖
    │   ├── generate-sitemap.mjs   ✅ 生成 dist/sitemap.xml
    │   └── routes.mjs             ✅ 路由清单，prerender 与 sitemap 共用
    └── src/
        ├── components/SEO.tsx     ✅ canonical / OG / JSON-LD 注入
        └── data/
            ├── articles/*.tsx     ✅ 每篇文章一个数据模块（slug 为 ASCII kebab-case）
            └── generated_articles.tsx  ✅ allArticles 汇总（文章路由枚举来源）
```

> **关键前提**：Vercel 项目 Settings → General → Root Directory 必须为 `web`。实施 CI 前先在 Vercel 后台确认该项；CI 中 `vercel pull/build/deploy` 必须在**仓库根目录**执行（Vercel CLI 会自行按 Root Directory 定位 `web/`），仅 `npm ci` 在 `web/` 下执行。若在 `web/` 内执行 vercel 命令，路径会解析为 `web/web` 而失败（见第 11 节注意事项 4、第 9 节 workflow）。

### 3.2 部署架构（目标）

```
push main ───────────────► GitHub Actions (ubuntu-latest)
  ├─ lint      → ESLint 检查（working-directory: web）
  ├─ security  → npm audit 漏洞扫描（必须通过）
  │
  └─ deploy    → 生产部署（依赖 lint/security，仅 main，environment: Production）
       ├─ vercel pull   --environment=production
       ├─ vercel build  --prod     → 执行 build:vercel（安装 Chromium + 编译 + 预渲染）
       └─ vercel deploy --prebuilt --prod → 上传 dist 成品 + api Functions，指配生产域名
```

ℹ️ 本项目暂无 PR 预览与 staging 部署（单 `main` 分支）。PR 会触发 lint / security 作为合入门禁但不部署；如日后需要预览环境，参照第 9.3 节扩展。

### 3.3 现状说明（实施前）

- 当前**没有任何 CI**，历史上依赖 Vercel Git 集成自动部署（push `main` 后 Vercel 自行构建）。Vite 纯 CSR 产物直接上线，这正是要被本方案替换的部署方式。
- 切换顺序：先跑通 CI 并确认预渲染产物正确，**最后**才在 `vercel.json` 中加入 `git.deploymentEnabled: false` 禁用 Git 集成（见第 13 节路线图顺序）。

## 4. 关键文件清单

| 文件 | 状态 | 作用 |
| --- | --- | --- |
| `web/vercel.json` | ✅ | rewrites + `buildCommand: npm run build:vercel` + `outputDirectory: dist`；`git.deploymentEnabled` 待 CI 验证后加入 |
| `web/package.json` | ✅ | 已含 `build:prerender`、`build:vercel`、`setup:chromium`、`sitemap` 脚本 |
| `web/scripts/prerender.mjs` | ✅ | 预渲染脚本（路由枚举 + Chromium 渲染 + 写入静态 HTML） |
| `web/scripts/setup-chromium.mjs` | ✅ | 安装 Chromium 及 Linux 系统依赖 |
| `web/scripts/generate-sitemap.mjs` | ✅ | 生成 `dist/sitemap.xml`（替代手工维护 `public/sitemap.xml`） |
| `web/scripts/routes.mjs` | ✅ | 路由清单模块：静态路由 + 文章 slug 提取，prerender 与 sitemap 共用 |
| `.github/workflows/ci-cd.yml` | ✅ | GitHub Actions 流水线定义（待 Secrets 配置后首次运行） |
| `web/src/components/SEO.tsx` | ✅ | 每页注入 title / description / canonical / OG / JSON-LD |
| `web/src/data/generated_articles.tsx` | ✅ | `allArticles` 数组，文章路由枚举来源 |
| `web/index.html` | ✅ | 百度统计脚本（hostname 非 localhost 时加载） |
| `web/public/robots.txt` | ✅ | 指向 `https://www.xbplan.com/sitemap.xml` |
| `web/public/sitemap.xml` | ✅/🚧 | 现为手工维护；CI 验证通过后删除，由构建时 `dist/sitemap.xml` 取代 |
| `web/baidu-push.mjs` | ✅ | 读取 sitemap 并推送全部 URL 到百度站长平台（`npm run push:baidu`） |
| `web/api/lobster/*.ts` | ✅ | Serverless Functions，依赖 `BLOB_READ_WRITE_TOKEN` |
| `.vercel/project.json` | ✅ | 本地 Vercel 项目关联（orgId / projectId，不入库） |

## 5. 预渲染原理（✅ 已实现并本地验证）

### 5.1 `scripts/prerender.mjs` 的完整流程

1. 通过 `scripts/routes.mjs` 枚举全部预渲染路由（见 5.2）。
2. **一次性预拉取生产 manifest**：启动服务器前 `fetch` 生产域名（`https://www.xbplan.com/api/lobster/manifest`）缓存到内存；非 2xx 或网络失败回退为空数据（`{ version: 1, items: [] }` 形态），保证列表页渲染干净的空态而非报错。
3. 启动一个基于 `dist` 的静态文件服务器（支持 SPA fallback）：`/api/lobster/manifest` 瞬时命中内存缓存（避免渲染期间反复走外网导致 `networkidle` 挂起）；`/api/lobster/entry`、`/api/lobster/image` 仍转发到生产域名，失败返回 404。
4. 启动 Chromium（`--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage`）。
5. 逐个路由访问（**每个路由使用独立 context**，避免长会话连接复用导致 `networkidle` 挂起），等待 `networkidle` 并轮询确认 `link[rel="canonical"]` 已更新为期望值（200ms 间隔 / 30s 超时；`/articles-list` 无 canonical，跳过轮询）。
6. 校验 `#root` 内容长度（> 500 字符，防止 CSR 空壳误判成功）。
7. 将渲染结果写入 `dist/<route>/index.html`（首页写回 `dist/index.html`）。

任一路由预渲染失败时，删除对应已写入文件并回退到 SPA 运行时渲染（首页除外：`dist/index.html` 本身就是 Vite 写入的 SPA 入口，保留即为回退产物），且脚本以非零退出码结束（导致 CI 失败，从而阻止部署未渲染的产物）。

> **本地验证结果（2026-10-09）**：50/50 路由全部预渲染成功；生产 manifest API 当时返回 500（Blob 数据缺失）。注：`/lobster` 分区已屏蔽（见 5.2），故路由数由 53 降为 50。

### 5.2 预渲染路由（公开页）

`scripts/routes.mjs` 统一维护两类来源：

**静态路由（硬编码清单，与 `App.tsx` 的路由表同步）：**

- `/`
- `/download`
- `/user-agreement`
- `/privacy-policy`
- `/children-privacy-policy`
- `/brand-story`
- `/articles-list`
- `/articles/reward-system`
- `/articles/behavior-guide`
- `/articles/pomodoro-technique`

> **`/lobster` 分区已临时屏蔽（2026-10-09）**：该功能当前不维护，`src/App.tsx` 中 `/lobster` 与 `/lobster/*` 均重定向到首页，且**不进入** `routes.mjs`（因此既不预渲染也不进 sitemap）。页面/组件/数据代码以及 `web/api/lobster/*` Functions 均保留，恢复时把三条路由加回 `staticRoutes` 并在 `App.tsx` 还原页面路由即可。

**文章路由（构建时枚举）：**

- `/articles/:slug` —— 用正则从 `src/data/articles/*.tsx` 提取 `slug: '<slug>'`（全部为 ASCII kebab-case，如 `overcoming-parenting-anxiety`），输出 `dist/articles/<slug>/index.html`。
- 新增文章的既有流程不变：新建数据模块 → 在 `generated_articles.tsx` 注册 → slug 自动进入预渲染与 sitemap（参见 `Prd/SEO/Add_New_Article_Guide.md`）。

### 5.3 保留 SPA 的动态页

**当前无此类页面**：原 `/lobster/diary/:slug`、`/lobster/skills/:slug` 两个动态详情页随 `/lobster` 分区一并屏蔽，`/lobster/*` 现统一重定向到首页，不再由前端渲染详情。

> 恢复 lobster 时的原设计（存档）：详情页不参与预渲染，运行时拉取 Blob 数据渲染。二期增强可改为构建时调用生产 `/api/lobster/manifest` 枚举 slug，将详情页一并预渲染。

## 6. 环境变量与 Secrets 配置

### 6.1 Vercel 侧环境变量（项目 `trae_m764jloz`）

| 变量 | 状态 | 说明 |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | ✅ | 由 Vercel Blob store 绑定自动注入，Production / Preview 各自生效，无需手工创建。该变量**不进前端产物**，保持默认 Sensitive 类型即可 |
| `LOBSTER_BLOB_PREFIX` | ✅ | 可选，默认 `lobster-Daily/` |

> **Sensitive 教训（来自 Kiword GA4 事故，见第 12 节引申）**：凡是 `VITE_` 前缀、会打进前端产物的变量**绝不能**标记为 Sensitive，否则构建时拉到空值且不报错。本项目当前**没有任何 `VITE_*` 变量**——百度统计直接硬编码在 `index.html`，不依赖环境变量，天然规避了该类事故；未来新增 `VITE_*` 变量时务必遵守此规则。

### 6.2 仓库级 Secrets（🚧 待创建，路径：GitHub 仓库 Settings → Secrets and variables → Actions）

| Secret 名称 | 值 | 说明 |
| --- | --- | --- |
| `VERCEL_ORG_ID` | `team_1UbFtVggFlAFfwyc07E6X5ld` | Vercel 团队 ID（与本地 `.vercel/project.json` 一致） |
| `VERCEL_PROJECT_ID` | `prj_wdIM4mS7AIaDpIbkTY6mHWtzhlJr` | Vercel 项目 ID（同上） |
| `VERCEL_TOKEN` | （Vercel 后台生成） | **必须是 Full Account scope**；project-scoped token 会导致 `vercel pull` 返回 403 |

这三个名称是 Vercel CLI 的标准环境变量名，CI 中无需在 workflow 里额外映射。

## 7. 构建脚本（✅ 已实施）

`web/package.json` 需新增以下 scripts：

```json
{
  "build": "tsc && vite build",
  "build:prerender": "npm run build && node scripts/prerender.mjs",
  "build:vercel": "npm run setup:chromium && npm run build:prerender",
  "setup:chromium": "node scripts/setup-chromium.mjs"
}
```

- `build`：类型检查 + Vite 打包（现有脚本，不变）。
- `build:prerender`：打包后执行预渲染。
- `build:vercel`：先安装 Chromium，再打包 + 预渲染（供 CI 的 `vercel build` 调用）。

## 8. 本地验证

在推送到 `main` 之前，建议本地执行完整预渲染以提前发现问题：

```bash
cd web
npm ci
npm run build:prerender
```

> **Windows 注意**：Windows 本地无法运行 `vercel build`（`spawn cmd.exe ENOENT` 已知兼容问题），本地验证请用 `npm run build:prerender` 等价替代；CI 为 ubuntu 不受影响。

执行成功后，`web/dist/` 下会出现各公开页对应的 `index.html` 静态文件。可用如下命令验证首页与某篇文章的产物：

```bash
# Check homepage: rendered content length + canonical tag
node -e "const s=require('fs').readFileSync('web/dist/index.html','utf8'); console.log('长度:', s.length); console.log('含canonical:', s.includes('rel=\"canonical\"'))"

# Check an article page actually contains its title text (not a CSR shell)
node -e "const s=require('fs').readFileSync('web/dist/articles/overcoming-parenting-anxiety/index.html','utf8'); console.log('长度:', s.length); console.log('含canonical:', s.includes('rel=\"canonical\"'))"
```

也可 `npm run preview` 在本地浏览 `dist/` 成品确认渲染内容。

## 9. 自动部署流程（✅ 已实施）

**分支模型**：`feature/bugfix` → `develop` → `main`。

| 触发 | 质量门禁 | 部署 |
|---|---|---|
| push / PR → `main` 或 `develop` | lint + security | 无 |
| push → `develop`（功能集成） | lint + security | **预览部署**（Preview，不动生产别名） |
| push → `main`（等价于 PR 合入） | lint + security | **生产部署**（Production） |

### 9.1 生产部署（deploy-production）

PR 成功合入 `main` 即产生一次 `main` 的 push，从而触发 `ci-cd.yml`：

1. `lint` 与 `security` 全部通过后，`deploy-production` job 才执行；安全扫描是部署的硬性前置条件。
2. 使用 Node 22，安装并调用 `vercel@54.21.0`（版本必须固定）。
3. `vercel pull --yes --environment=production` 拉取项目环境（在仓库根目录执行，CLI 自行按 Root Directory 定位 `web/`）。
4. `vercel build --prod` 执行 `build:vercel`，完成编译与预渲染。
5. `vercel deploy --prebuilt --prod` 将 `dist` 成品与 `api/lobster` Functions 作为同一部署上传到生产环境。

### 9.1b 预览部署（deploy-preview）

每次 push 到 `develop` 都会发布一个独立预览部署（**不带任何 `--prod`**，因此不会触碰生产别名）：

1. 同样以 lint + security 为前置。
2. `vercel pull --yes --environment=preview` 拉取 **preview** 环境变量。
3. `vercel build`（无 `--prod`）产出预览产物。
4. `vercel deploy --prebuilt` 创建预览部署，workflow 从 CLI 输出中提取随机 Preview URL 并写入 **Job Summary** 供验收；不再额外评论到 PR。
5. Vercel 会自动给预览部署加 `X-Robots-Tag: noindex`，不会污染生产 SEO。

> ⚠️ 两个前置条件：
> `Blob` 等运行环境变量需对 **Preview 环境**同样可见（Vercel → Settings → Environment Variables 中勾选 Preview，或选 All Environments），否则预览站的 `/api/*` 会失败。
> 团队账户的预览部署可能默认开启部署保护（Vercel Authentication），此时直接访问 Preview URL 会要求登录 Vercel；如需免登录验收，可在 Vercel → Settings → Deployment Protection 调整。

`ci-cd.yml` 核心结构（✅ 已创建于 `.github/workflows/ci-cd.yml`）：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-cd-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run lint

  security:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      # Audit production dependencies only; build-toolchain advisories are tracked separately
      - run: npm audit --omit=dev --audit-level=high

  deploy-production:
    needs: [lint, security]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: Production
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
        working-directory: web
      # CLI runs from the repo root: the project Root Directory is `web`
      - run: npx vercel@54.21.0 pull --yes --environment=production
      - run: npx vercel@54.21.0 build --prod
      - run: npx vercel@54.21.0 deploy --prebuilt --prod

  deploy-preview:
    needs: [lint, security]
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: Preview
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
        working-directory: web
      - run: npx vercel@54.21.0 pull --yes --environment=preview
      - run: npx vercel@54.21.0 build
      - id: deploy
        run: |
          set -o pipefail
          output=$(npx vercel@54.21.0 deploy --prebuilt 2>&1)
          echo "$output"
          url=$(echo "$output" | grep -oE 'https://[a-zA-Z0-9._-]+\.vercel\.app' | tail -n1 || true)
          echo "url=$url" >> "$GITHUB_OUTPUT"
      - name: Publish preview URL
        run: |
          {
            echo "### develop preview";
            echo "";
            echo "${{ steps.deploy.outputs.url }}";
          } >> "$GITHUB_STEP_SUMMARY"
```

> 本项目没有测试框架，质量门禁为 lint + security；若日后引入 Jest/Vitest，在两个 deploy job 的 `needs` 中追加 test job 即可。

### 9.2 部署后验证

```bash
gh run list --limit 5        # Confirm the latest CI/CD Pipeline run is success
```

随后验证线上静态 HTML（无痕窗口浏览验证交互行为）：

```bash
# Rendered content check: count should be >= 1
curl -s https://www.xbplan.com/articles/overcoming-parenting-anxiety | grep -c "canonical"

# Baidu analytics script check: count should be >= 1
curl -s https://www.xbplan.com/ | grep -c hm.baidu.com
```

预览部署（develop 分支）验收：查看该次 run 的 **Summary** 页获取 Preview URL，或

```bash
gh run view <run-id> --json jobs --jq '.jobs[] | select(.name=="deploy-preview") | .steps[] | select(.name=="Publish preview URL") | .conclusion'
```

### 9.3 可选扩展（暂缓）

- **PR 预览部署**：当前 `develop` 分支已有常驻预览部署，PR 阶段一般无需再单独出预览。若日后希望每个 PR 都有独立预览，可把 `deploy-preview` 的触发条件扩展为 `pull_request` 事件，并把 URL 评论到 PR。
- **稳定的预览域名**：当前 develop 预览为随机 URL（记录在 run summary）。若想固定为如 `develop.xbplan.com`，需在 Vercel 项目添加该域名，再于 `deploy-preview` 末尾追加 `npx vercel@54.21.0 alias set <url> develop.xbplan.com`。

### 9.4 原子部署说明

`vercel deploy --prebuilt --prod` 会将前端 `dist` 静态产物与 `api/lobster` Functions 作为**同一个部署**一次性上线，两者版本始终一致。**不存在「只部署后端」或「只部署前端」的操作。**

## 10. Vercel 配置说明

`web/vercel.json` 当前形态（✅ 已更新，rewrites 保持原状）：

```json
{
  "git": { "deploymentEnabled": false },
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist",
  "redirects": [
    { "source": "/lobster", "destination": "/", "permanent": true },
    { "source": "/lobster/:path*", "destination": "/", "permanent": true }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `git.deploymentEnabled: false`：禁用 Vercel Git 集成自动部署，避免与 GitHub Actions 重复部署。**必须在 CI 链路跑通后再加入**（见第 13 节顺序）。
- `buildCommand: "npm run build:vercel"`：仅手动触发 Vercel 云构建时才会使用；正常部署由 GitHub Actions 编译后 `--prebuilt` 上传，Vercel 不参与构建。
- `outputDirectory: "dist"`：输出目录。
- `redirects`：`/lobster` 与 `/lobster/:path*` **永久重定向到首页** `/`（308）。这是屏蔽 `/lobster` 分区的主手段，在路由匹配最前置阶段生效（先于静态文件与 rewrites），无需执行 JavaScript。前端 `App.tsx` 中的 `<Navigate to="/" replace />` 仅作为本地开发 / SPA 场景的兜底。
- `rewrites`：`/api/(.*)` 转发到 Serverless Functions；其余路由回退到 `/index.html`（SPA fallback）。

> **预渲染产物为什么能命中**：Vercel 对同一请求**先匹配静态文件、再应用 rewrites**。`dist/articles/<slug>/index.html` 作为静态文件优先命中；未预渲染的路由静态文件不存在，走 SPA fallback 回到 `index.html` 由客户端渲染。两条规则互不干扰。

根目录的 `vercel.json` 副本仅作占位，真正生效的是 `web/vercel.json`（Root Directory = `web`）。

## 11. 已知问题与注意事项

1. **Vercel token 权限**：必须使用 Full Account scope token，project-scoped token 会使 `vercel pull` 因权限不足返回 403。
2. **Vercel CLI 版本**：固定为 `54.21.0`，更高版本（55+）存在 `Could not retrieve Project Settings` 的误导性报错。
3. **云构建无法运行 Chromium**：Vercel 云端为 Amazon Linux，无 `apt-get`，无法安装 Chromium 系统依赖，因此预渲染必须在 GitHub Actions 的 ubuntu 环境执行——这是「CI 编译后 `--prebuilt` 上传」架构存在的根本原因。
4. **monorepo 路径**：Vercel 项目 Root Directory 为 `web`。`vercel pull/build/deploy` 必须在**仓库根目录**执行——CLI 会把 Root Directory 拼接到当前工作目录上，若在 `web/` 内执行会解析成不存在的 `web/web`（表现为 `vercel build` 秒退且无产物、`vercel deploy` 报 "provided path .../web/web does not exist"）。仅 `npm ci` 在 `web/` 下执行（workflow 在其单步用 `working-directory: web`）。本地同理，`vercel` 命令在仓库根执行即可。
5. **预渲染时 lobster API 不可用**：本地/CI 静态服务器上没有 Functions，预渲染服务器必须按 5.1 第 3 步 mock 或转发该 API，否则列表页会卡在加载态且 `networkidle` 永不达成。
6. **Sensitive 环境变量**：`VITE_*` 变量禁止标记 Sensitive（本项目暂无此类变量）；`BLOB_READ_WRITE_TOKEN` 保持 Sensitive 无妨。
7. **sitemap 双份来源**：`public/sitemap.xml` 为手工维护的现役文件；`generate-sitemap.mjs` 实施后改为构建时写入 `dist/sitemap.xml`（不污染 `public/` 与 git 工作区），并删除手工文件、更新 `robots.txt` 无需改动（URL 不变）。
8. **百度统计的 hostname 判断**：`index.html` 中统计脚本仅在非 localhost 环境加载，本地 dev / 预览不产生上报属正常。排查线上统计问题第一步永远是 `curl -s https://www.xbplan.com/ | grep -c hm.baidu.com`。
9. **百度推送额度**：`npm run push:baidu` 每次推送 sitemap 全量 URL，百度平台额度有限；日常新增文章建议只推送新 URL，或维持低频全量推送节奏。
10. **GitHub Free 套餐限制（私有仓库）**：Free 个人账号对私有仓库不强制执行分支保护规则，也不支持环境保护规则。因此不依赖 GitHub 侧人工把关，CI `deploy` job 的 `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` 保证仅 `main` 可触发生产部署，是服务端最终防线。
11. **Windows 本地无法运行 `vercel build`**：`spawn cmd.exe ENOENT` 已知兼容问题，本地验证用 `npm run build:prerender` 替代。
12. **`vercel env add` 的交互提示**：管道传值后遇到 EOF 会自动通过，无需额外处理。

## 12. 故障排查案例（引申自 Kiword GA4 事故）

> Kiword 曾发生「GA4 变量存在但值为空 + Sensitive 加密遮蔽 = 构建静默跳过统计脚本注入」的事故。本项目虽无 GA4，但同类风险映射为：**预渲染静默失败回退 SPA** 与 **环境变量空值**。遇到「线上页面爬虫抓到空壳」或「统计无数据」类问题，按本节流程定位。

### 12.1 现象

百度站长平台收录停滞、抓取诊断显示页面内容缺失；或 `view-source` 打开线上文章页只有 `<div id="root"></div>` 空壳。

### 12.2 根因链（三层）

| 层级 | 内容 |
| --- | --- |
| 直接原因 | 线上 HTML 无正文内容——爬虫不是读不懂，而是页面从未以静态形式存在过 |
| 机制原因 | 预渲染失败时脚本按设计回退 SPA 并以非零码退出；若部署绕过了 CI（Git 集成未禁用、或手动 Vercel 云构建），未渲染的 CSR 产物可直接上线 |
| 根本原因 | 部署链路存在旁路：`git.deploymentEnabled: false` 未生效，或 deploy job 的 `if` 条件被改动 |

一句话总结：**预渲染产物没有上线 = 一定有一条例外的部署通道**。

### 12.3 排查路径（按序执行）

```bash
# 1. Confirm the latest deploy came from CI (not Git integration)
gh run list --limit 5

# 2. Check if the live page is rendered (0 = CSR shell, problem confirmed)
curl -s https://www.xbplan.com/articles/overcoming-parenting-anxiety | grep -c "canonical"

# 3. Reproduce the full build + prerender locally
cd web && npm run build:prerender
# Inspect dist/articles/<slug>/index.html

# 4. Check which environment / origin the live deployment came from
npx vercel@54.21.0 ls trae_m764jloz
```

### 12.4 统计类问题自检清单

- `curl -s https://www.xbplan.com/ | grep -c hm.baidu.com` 应 ≥ 1（脚本随 `index.html` 与预渲染产物自然保留，Kiword 已验证 Playwright `page.content()` 不会丢弃构建期注入的 `<script>`）。
- 百度统计后台「实时访客」验证：自己打开站点数秒内应出现；**部分报表有延迟属正常**。
- 本地 dev / preview 无上报是 hostname 判断的预期行为，不要误判为故障。

## 13. 实施路线图（Checklist）

**阶段 1：本地工具链（全部在 `web/` 下）✅ 已完成（2026-10-09，53/53 路由验证通过）**

- [x] 创建 `scripts/routes.mjs`：静态路由清单 + `src/data/articles/*.tsx` 的 slug 正则提取
- [x] 创建 `scripts/prerender.mjs`：manifest 预拉取 + 静态服务器（SPA fallback + 缓存命中）→ Chromium 渲染（每路由独立 context）→ canonical 轮询校验 → 写入 `dist`
- [x] 创建 `scripts/setup-chromium.mjs`（可直接移植 Kiword 同名脚本）
- [x] 创建 `scripts/generate-sitemap.mjs`：构建时写 `dist/sitemap.xml`
- [x] `package.json` 增加 `build:prerender` / `build:vercel` / `setup:chromium` 脚本
- [x] 本地 `npm run build:prerender` 跑通，按第 8 节命令抽查产物

**阶段 2：Vercel 与 Secrets 配置（✅ 已完成）**

- [x] Vercel 后台确认项目 Root Directory = `web`
- [x] GitHub 仓库创建 `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / `VERCEL_TOKEN` 三个 Secrets（token 为 Full Account scope）
- [x] 准备 `web/vercel.json` 更新（`buildCommand`、`outputDirectory`）

**阶段 3：CI 上线与通道收口（✅ 已完成）**

- [x] 创建 `.github/workflows/ci-cd.yml`（第 9.1 节结构）
- [x] push `main` 触发流水线，确认 deploy success（run 37887979788 / 37888363391，预渲染 53/53）
- [x] `curl` 线上验证文章页已含正文与 canonical（第 9.2 节命令）
- [x] 在 `web/vercel.json` 加入 `git.deploymentEnabled: false` 并随提交发布，关闭 Git 集成旁路
- [x] 部署后确认新部署来源为 CLI 而非 Git（`vercel ls --prod` 最新一次仅有 CLI 部署，无 Git 集成旁路部署）

**阶段 4：可选增强（按需）**

- [ ] lobster 详情页预渲染（构建时拉生产 manifest 枚举 slug）
- [ ] 百度推送纳入 CI（deploy 成功后仅推送新增 URL）
- [ ] PR 预览部署（deploy-preview job）
- [ ] staging 双分支流程（参照 Kiword 第 9 节模式）
