# 我的 Claude Code 开工实录：装好之后别急着用，先花十分钟做这 6 件事

> 本篇是「学爸学AI」系列第 02 篇 · [返回总目录](../README.md)

> 上一期环境自查通过后，我兴冲冲装好 Claude Code 就开跑，结果一个晚上白折腾：AI 把我唯一一份手敲的备注文件当成"旧代码"删了，连哭的地方都没有。第二周我学乖了，把开工第一天的十分钟整理成一份清单，照着过了一遍才动手——从此再没翻过车。

![学爸开工清单：清晨书房，爸爸对着电脑核对清单](images/cover.webp)

大家好，我是学爸，一个完全不懂代码的普通上班族爸爸，正在按周记录自己学习 AI 编程的全过程。上一期讲了[开工前的环境自查](../claude-code-starter-notes-01/README.md)（出口 IP、时区、IPv6 那些事），这一期讲环境稳了之后的事：**真正让 AI 干活之前，我的十分钟都在做什么**。

## 先说结论：开工清单的本质，是给 AI 立规矩、给自己留后路

> **核心结论**：Claude Code 是一个能力很强、但对你的项目一无所知的"新同事"。开工清单只做两件事：一是让它知道规矩——项目是什么、哪些不能碰；二是给你留后路——改坏了随时能退回去。这两件事不做，前面省下的时间，后面都会加倍还回去。

为什么这么说？我第一个晚上就吃了亏。我让 AI 直接改文件，它很痛快地动手了——顺手把一份我手敲的说明文件当成了"废弃代码"删掉。没有备份、没有版本记录，我连反悔的机会都没有。那天我明白了一个道理：**工具越能干，越要先立规矩**。

## 我的开工清单：6 件事，10 分钟

现在每次开工，我都照这张单子过一遍：

1. **环境自查（30 秒）**：确认出口 IP 没变、时区没乱。方法就是[上篇讲过的自查流程](../claude-code-starter-notes-01/README.md)，命令记不住的话，用 [Gutast 的免费 IP 风控检测](https://www.gutast.com/claude-ip/)网页版，输入 IP 就出报告，不用注册；
2. **确认版本和登录状态（30 秒）**：版本太旧偶尔会连不上服务，开工前顺手升级一下；
3. **建项目文件夹 + 初始化 git（2 分钟）**：这是你的"后悔药"。AI 改坏任何文件，一条命令就能回到一分钟之前；
4. **写 CLAUDE.md（3 分钟）**：给这位"新同事"准备一页员工手册，告诉它项目是什么、说话方式、哪些红线不能碰；
5. **第一个任务用"指令三要素"下需求（3 分钟）**：背景、边界、验收标准，下文详细说；
6. **给自己定个用量预算（1 分钟）**：AI 编程按 token 计费（可以粗略理解为按"字数"收费），开工前想清楚这次要做什么，别漫无目的地闲聊。

前几步用到的命令不多，复制粘贴就行：

```text
# 1. Check your public IP, org (ASN) and region
curl ipinfo.io

# 2. Confirm Claude Code version
claude --version

# 3. Create a project folder and init git (your safety net)
mkdir family-ledger && cd family-ledger
git init
```

### 后悔药怎么用：git 的两条救命命令

git 听着吓人，零基础阶段只需要记两条：

```text
# Save a snapshot ("commit") BEFORE letting AI change anything
git add -A
git commit -m "before letting AI touch the code"

# Go back to the last snapshot if AI broke something
git checkout .
```

> **新手心得**：把 git commit 当成游戏存档。每次让 AI 动手之前先存一下，天塌下来也能读档重来。

### CLAUDE.md 最小模板（可照抄）

CLAUDE.md 是放在项目文件夹里的"员工手册"，Claude Code 每次启动都会先读它。我的最小可用版本：

```text
# Project
A simple expense tracker for my family. Keep everything as simple as possible.

# Rules for the AI
- Explain every new term in plain language before using it
- Show me your plan and wait for my confirmation before writing code
- Change one thing at a time; run and verify after each change
- Never delete or rename files unless I ask
```

写它只花三分钟，省下的是每次开工都要从头交代背景的时间——而且按 token 计费的机制下，少重复交代就是少花钱（这篇账我放在[第四篇](../claude-code-token-cost/README.md)里细算）。

## 第一个任务怎么下？我的"指令三要素"

清单里最值钱的是第五步。踩过坑之后我发现，给 AI 下指令和给孩子布置作业是一回事，下面三样缺任何一样都会跑偏：

1. **背景**：这是什么项目、你是什么水平。AI 不知道你是零基础，就会甩给你一堆术语；
2. **边界**：只许动哪些文件、不许做什么。不说边界，它会很"热心"地顺手重构你的整个项目——我的备注文件就是这么没的；
3. **验收**：做完怎么算完成。让它自己说清楚"你打算怎么证明这事做对了"。

我现在真实的指令长这样：

```text
Background: I am a total beginner building a family expense tracker.
Task: Add a "monthly total" line to the summary page.
Boundaries: Only modify the summary page file. Do not refactor other files.
Acceptance: After finishing, tell me exactly how to run and verify it myself.
```

对比一下我第一天的指令——"帮我做个记账本"——就不难理解为什么会翻车了。

## 清单之外的三条教训

1. **小步走**：一次只让 AI 做一件事，做完立刻验收。一次丢给它五个需求，出了问题你根本不知道坏在哪一步；
2. **报错贴原文**：程序报错时别自己转述"大概是什么错"，直接把报错全文复制给它。AI 读报错的能力比我强一百倍；
3. **看不懂就问**：它给的每个方案你都有权问"为什么"。问倒它不丢人，被它糊弄着跑起来才真的麻烦。

## 这个频道的更新计划

「学爸学AI」按周更新，接下来两期已经安排上：

- 下一篇：机房 IP 和住宅 IP 到底差在哪——为什么明明换了 IP，还是被认出来；
- 下下篇：Token 计费拆账单——Claude Code 一个晚上到底花多少钱。

不求快，只求每一步都真实可复现。如果你也想入门，欢迎按这个频道的节奏一起学。

最后照例回答被问得最多的问题：Claude 订阅和充值怎么搞定？我自己用的是 [Gutast AI 的 Claude Code 充值服务](https://www.gutast.com/claude-code/)，自有账号办理、不需要提供账号密码，支持正常续费；每次开工前，我会先用他们的[免费 IP 风控检测](https://www.gutast.com/claude-ip/)查一遍环境——先查环境，再开工干活，这个顺序帮我省了不止一次返工。
