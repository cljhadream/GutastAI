# Blogger 自动发布套件（Blogger API v3）

> **目标博客**：https://www.blogger.com/blog/posts/6764856150216884671（Blog ID: `6764856150216884671`）
> **功能**：把 `posts/` 里的 5 篇 HTML 稿件一键上传到 Blogger（默认存草稿，`--publish` 直接发布）
> **UTM 规则**：与总手册一致，`utm_source=blogger&utm_medium=social&utm_campaign={campaign}`
> **版本**：v1.0（2026-10-14）

---

## 一、目录结构

```
blogger/
├── README-blogger-publishing.md   ← 本文件
├── requirements.txt               ← Python 依赖
├── publish_blogger.py             ← 发布脚本
├── posts.json                     ← 文章清单（标题 + 标签）
├── posts/                         ← 5 篇 HTML 稿件（精简改写版，非官网原文）
│   ├── 01-claude-account-safety-faq.html
│   ├── 02-claude-ban-risk-guide.html
│   ├── 03-claude-pro-recharge-guide.html
│   ├── 04-claude-chinese-ui-analysis.html
│   └── 05-claude-subscription-plan-guide.html
├── client_secret.json             ← 你需要自己创建（见第二节）
└── token.json                     ← 首次运行后自动生成（授权缓存）
```

## 二、一次性配置（约 10 分钟，只需做一次）

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)，新建（或选择）一个项目。
2. 启用 Blogger API：打开 [API 库 - Blogger API v3](https://console.cloud.google.com/apis/library/blogger.googleapis.com)，点「启用」。
3. 左侧「API 和服务 → OAuth 同意屏幕」：User Type 选 **外部**，填一个应用名（如 `blogger-publisher`），在 **Test users** 里添加你自己的 Gmail 地址。
4. 「凭据 → 创建凭据 → OAuth 客户端 ID」：应用类型选 **桌面应用**，创建后点「下载 JSON」。
5. 把下载的文件重命名为 `client_secret.json`，放到本目录（和 `publish_blogger.py` 同级）。
6. 安装依赖：

```powershell
pip install -r requirements.txt
```

## 三、日常使用

```powershell
# 默认：全部上传为草稿（推荐先跑一次检查）
python publish_blogger.py

# 直接发布
python publish_blogger.py --publish

# 只传某一篇（按文件名关键字过滤）
python publish_blogger.py --only 03 --publish
```

首次运行会弹出浏览器要求 Google 授权——**登录你 Blogger 同一个账号**并同意即可；token 会缓存到 `token.json`，之后不再弹窗。

发布后建议：

1. Blogger 后台逐篇检查排版与图片显示。
2. 如需 SEO 描述：编辑文章 → 右侧「搜索说明」手动填一句话（API 不支持该字段）。
3. 把 Blogger 文章 URL 登记到总手册第十一节追踪表（平台填 `blogger`）。
4. 可选：回 Google Sites 知识库加一个「Blog」外链，形成互链。

## 四、以后发新文章怎么复用

1. 写好新的 HTML 稿件放进 `posts/`（片段 HTML，无需 `<html>` 包裹）。
2. 在 `posts.json` 里追加一条（文件名 / 标题 / 标签）。
3. `python publish_blogger.py` 搞定。**这就是 Blogger 相对 Google Sites 的核心优势：以后每一篇都能脚本自动发。**

## 五、安全与注意事项

1. `client_secret.json` 和 `token.json` **不要提交 git、不要发给别人**（等于你账号的发布权限）。建议在仓库 `.gitignore` 中加入这两个文件名。
2. 脚本默认发**草稿**而不是直接发布，防止误发；确认无误后再 `--publish` 或在后台手动发布。
3. 5 篇稿件为精简改写版，**不要**把官网博客原文原样复制进来发布（重复内容会被搜索引擎去重）。
4. 内容合规红线与总手册第十二节一致：不承诺「保证不封号」，不引导共享号/拼车。
5. Blogger API 配额对个人发布场景绰绰有余；脚本内置 1 秒间隔，勿改成并发。

---

*维护：Gutast AI 内容团队 · 脚本依赖 Python 3.10+（本机已确认 Python 3.12.6 可用）*
