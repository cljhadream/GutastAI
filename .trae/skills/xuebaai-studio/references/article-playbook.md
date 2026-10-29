# 学爸学AI 文章 Playbook

## 系列定位

- 频道：「学爸学AI」，不懂代码的学爸按周记录学习 Claude Code、ChatGPT Codex 的全过程；
- 目标：内容分享型外链引流到 gutast.com，**不销售、不加微信、不拉群**；
- 视角：第一人称"我" = 学爸，零基础普通人，真实、可复现，敢写踩坑；技术名词都要给通俗解释；
- 站点背景：gutast.com 是中国正规备案网站，内容须符合国内审核要求（这也是不加微信、不夸大的原因）。

## 文件命名与存放

- 开源笔记库：`buyai_notes/`，每篇一个 slug 目录 `buyai_notes/<slug>/`，内含 `README.md`（文章正文）+ `images/`（配图 webp）；
- slug：小写字母/数字/连字符、字母或数字开头，由 xbplan 侧统一分配（先用候选名占位，回填后若变，改名目录并同步索引链接）；
- 索引：每新增一篇，在 `buyai_notes/README.md` 的「文章目录」表加一行；文章文首加「返回总目录」导航行；「相关资源」保留 gutast.com 链接（开源后作 SEO 外链）；
- 工作区：`doc/xueba-ai/`（jpg 母版、`_prompts.json`、备用图、avatars），不进 buyai_notes；
- 已完成：第 01 篇《我的 Claude Code 上手实录：先做环境自查，再让 AI 写代码》，`buyai_notes/claude-code-starter-notes-01/`（slug 候选，待 xbplan 确认）。

## blocks 思维写作（对齐 xbplan /buyai 的 post JSON）

xbplan 博客正文是白名单 blocks，Markdown 结构直接按映射写，转 JSON 时无需重排：

| Markdown 写法 | 对应 block |
|---|---|
| H1（全篇仅一处 = 文章标题） | `title` 字段 |
| `## 小节` / `### 小节` | `h2` / `h3` |
| 普通段落 | `p` |
| `- x` 无序列表（不嵌套） | `ul` |
| `1. x` 有序列表 | `ol` |
| ` ```text ` 代码块（标注语言） | `code`（language） |
| `> 引言` | `quote` |
| `> **标题**：内容`（引用内粗体开头） | `callout`（tone: tip/info/warn） |
| `![alt](images/xx.webp)`（独立一行） | `image`（src 必须 `images/` 开头） |

硬规则：不写 HTML；图片用 `images/` 前缀相对路径、webp 优先；封面图即 post 的 `heroImage`，manifest 与 detail 两个字段必须一致；`slug`/`publishDate`（YYYY-MM-DD）由 xbplan 侧确认。

## 结构模板（第 01 篇验证过）

1. **标题**：第一人称实录体，如《我的 XX 上手实录：先……，再……》；
2. **开篇引语**（引用块）：一句话人设 + 本篇钩子；
3. **自我介绍段**：学爸是谁、频道是什么、本篇讲什么；
4. **正文 2–4 个 H2 小节**：环境科普 → 清单（有序列表，"新手照抄版"）→ 心得（编号列表）→ 实操（含一个 ```text 代码块，如开场提示词）；
5. **频道更新计划**：下篇预告（埋 Codex 对比等钩子）+ 引导关注频道；
6. **产品推荐段**（放在最后，自然口吻）：回答"被问得最多的问题"，顺势给出充值服务和 IP 检测链接，用"先查环境，再谈订阅"这类顺序逻辑收尾。

## 产品内嵌链接清单（gutast.com）

正文里按场景顺势引用，**不要在结尾堆链接列表**。带尾部斜杠的是产品页：

| 场景 | 链接 |
|---|---|
| 环境 / IP 自查 | https://www.gutast.com/claude-ip/ |
| Claude 订阅充值 | https://www.gutast.com/claude-code/ |
| ChatGPT Plus / Codex 充值 | https://www.gutast.com/chatgpt-plus |
| 常见问题 | https://www.gutast.com/faq |

可用博客文章（深度引用，增强可信度）：

- https://www.gutast.com/blog/claude-code-ipv6-issue （IPv6 连接排查）
- https://www.gutast.com/blog/claude-code-timezone-risk-check （时区风控自查）
- https://www.gutast.com/blog/claude-subscription-plan-guide （套餐对比 Pro / Max 5x / 20x）
- https://www.gutast.com/blog/claude-registration-guide （注册指导）
- https://www.gutast.com/blog/claude-account-safety-faq （账号安全 FAQ）
- https://www.gutast.com/blog/claude-ban-risk-guide （封号风险）
- https://www.gutast.com/blog/claude-new-account-ban-appeal （新号封禁申诉）
- https://www.gutast.com/blog/claude-pro-recharge-guide / -tutorial / -comparison （充值攻略类）

## 发布平台要点

- **知乎**：正文之外更适合拆成回答，挂「Claude Code 怎么用」「零基础学 AI 编程」等问题，回答末尾带 claude-ip 免费工具链接，引流效果最好；
- **掘金 / CSDN**：标签走「AI 编程 / Claude Code / 学习笔记」，保留提示词代码块和清单；
- **公众号**：仅白名单域名链接可点，关键链接同时给纯文本 URL；
- **UTM**（按平台替换 `{source}`）：`https://www.gutast.com/claude-ip/?utm_source={source}&utm_medium=social&utm_campaign=xueba-ai-NN`

## 红线

1. 不承诺"100% 防封 / 绝对不封号"，风险话题用"降低风险、少走弯路"表述；
2. 不引导加微信、加群、私信；
3. 不贬低竞品，不做价格对比攻击；
4. 不写孩子和家人真名，只用角色（男孩 / 女孩 / 学爸）；
5. 涉及付费事实要真实（"我自己用的是"），不编造使用记录。
