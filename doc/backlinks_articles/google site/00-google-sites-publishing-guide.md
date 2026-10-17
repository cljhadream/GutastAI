# Google Sites 发布指南：Gutast AI 知识库卫星站

> **目的**：在 sites.google.com 搭建一个轻量知识库卫星站，为 www.gutast.com 增加品牌词占位、收录页面与外链入口
> **新建站点入口**：https://sites.google.com/u/0/new/?authuser=0
> **UTM 规则**：与总手册 3.3 节一致，`utm_source=google-sites&utm_medium=social&utm_campaign={campaign}`
> **版本**：v1.0（2026-10-14）

---

## 一、站点参数建议

| 项目 | 建议值 |
| --- | --- |
| 站点名称 | Gutast AI 知识库 |
| 站点 URL | `sites.google.com/view/gutast-ai`（被占用则用 `gutast-ai-kb`） |
| 站点 Logo | `https://www.gutast.com/UI/logo/300_300.webp` |
| 首页横幅 / 封面图 | `https://www.gutast.com/UI/og-cover.png` |
| 站点语言 | 中文（简体） |

**首页内容**（新建站点默认页就是首页）：

- 页头标题：`Gutast AI 知识库`
- 一段站点简介（可直接粘贴）：

```text
Gutast AI（www.gutast.com）是面向中文开发者的 AI 订阅服务助手，主营 Claude Pro/Max 订阅代付、ChatGPT Plus、Codex 与 Claude Code 代充。本知识库整理了 Claude 账号防封、风控机制、充值路径、中文界面解读与订阅选档 5 个主题的精华内容，完整版教程请访问 Gutast 官方博客。
```

- 下方列 5 篇文章目录（用 Google Sites「插入 → 目录」或手动列表 + 站内页链接）
- 首页底部放主页 CTA 链接（UTM 版）：

```text
https://www.gutast.com/?utm_source=google-sites&utm_medium=social&utm_campaign=kb_home
```

---

## 二、页面结构与对应文案文件

| # | Google Sites 页面名 | slug 建议 | 文案文件 |
| --- | --- | --- | --- |
| 1 | 账号防封答疑 | ban-prevention | `01-claude-account-safety-faq.md` |
| 2 | 封号机制详解 | ban-risk | `02-claude-ban-risk-guide.md` |
| 3 | Claude 充值攻略 | recharge-guide | `03-claude-pro-recharge-guide.md` |
| 4 | 中文界面解读 | chinese-ui | `04-claude-chinese-ui-analysis.md` |
| 5 | 订阅套餐选档 | plan-guide | `05-claude-subscription-plan-guide.md` |

---

## 三、建站步骤（约 30 分钟）

1. 打开上面的新建入口，左上角输入站点名称 `Gutast AI 知识库`。
2. 首页：粘贴站点简介 → 插入横幅图（右侧「插入 → 图片 → 网址」，用 og-cover.png）→ 建立 5 篇文章的目录列表。
3. 右侧「页面」标签 → 「新建页面」，依次创建 5 个页面（页面名见上表），每页粘贴对应文案文件的正文。
4. **插图**：文案中【插图】标注处，用「插入 → 图片 → 网址」粘贴图片直链。建议先下载图片再本地上传，避免外链失效。
5. **插链接**：选中锚文字 → 工具栏「插入链接」→ 粘贴文案中的 UTM 完整链接（锚文字与链接必须成对使用，不要贴裸链影响可读性，站内相关阅读用 Google Sites 页面选择器关联站内页）。
6. 每页右上角三点菜单 → 「页面设置」中若有「搜索说明（Search description）」字段，填入文案中提供的页面描述；没有则跳过（发布后 Google 会自动抓取正文摘要）。
7. 右上角「发布」→ 确认站点地址 → 发布后逐页检查链接可点击、图片正常显示。
8. 发布完成后，把站点 URL 登记到总手册第十一节追踪表（平台填 `google-sites`）。

---

## 四、每页通用页脚（统一粘贴到 5 个页面底部）

```text
免责声明：本文为经验分享与公开信息整理，仅供参考，不构成任何规避服务条款的建议。请始终遵守 Anthropic / OpenAI 官方使用政策。完整原文请访问 Gutast AI 官方博客：https://www.gutast.com/blog/
```

---

## 五、SEO 预期与局限（客观说明）

1. **新站权重≈0**：Google Sites 页面本身没有积累权重，传给主站的外链权重有限。定位是「品牌词搜索占位 + 长尾收录补充」，不要指望它替代知乎、GitHub 等高权重平台的外链。
2. **切勿全文复制官网博客**：verbatim 复制会被搜索引擎去重过滤，等于白做。本套文案全部为精简改写版（非原文），可安全使用。
3. **SEO 控件有限**：Google Sites 无法自定义 OG 分享图、结构化数据，URL slug 不可控；页面标题（页头大标题）是主要的优化抓手，务必使用文案中提供的标题。
4. **大陆无法直连**：sites.google.com 在国内被墙，引流对象仅限海外/可翻墙用户；主战场仍是知乎、公众号等平台。
5. **升级路径**：若站点收录与流量表现好，可在「设置 → 自定义域名」绑定 `docs.gutast.com`——内容将归属主域名，扩充主站收录量与长尾覆盖，长线收益比外链更高。

---

## 六、合规红线（与总手册第十二节一致）

1. 不出现「保证不封号」「100% 防封」「永久质保」等承诺性表述。
2. 不引导购买共享号 / 拼车 / 转租。
3. 讲「代充」只讲官方会话代付模式（不需要密码），不催单、不冒充官方。
4. 价格、政策类数字以官网博客原文为准，不得自行改写编造。

---

*维护：Gutast AI 内容团队 · 后续新文章按 `01-` 前缀规则追加文案文件，并同步更新第二节页面结构表。*
