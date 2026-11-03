# 竞品分析总结：Claude IP 检测与自动充值

Oct 23, 2026 · @kevin cheng

## 摘要

竞品的「IP 检测」靠 Cloudflare 的公开诊断地址实现，「自动充值」靠接入上游卡密平台实现，两者都没有独家技术。真正的门槛在数据（IP 情报、共享人数）和渠道（付款能力）。

- **ip.net.coffee**：浏览器直接读 claude.ai 的 `/cdn-cgi/trace`，拿到 Claude 实际看到的出口 IP；风险数据由后端转查第三方 IP 情报。
- **ping0.cc**：原生 IP 按「RIR 注册国家 vs 定位国家」判定；「共享人数」来自它自己积累的全网流量数据，外部无法复刻。
- **buyai.dev**：自己不充值，只是店铺前台；用户付款后，后台把用户的 Session（或 Claude Org ID）连同库存卡密提交给上游 aichongzhi.fun 自动兑换。

对 Gutast 的三点启示：

1. 检测工具已自建（gutast.com/claude-ip），核心方法与竞品一致，数据源可替换。
2. 要做自动充值，关键是找到有 API 的上游或自建付款渠道，前台开发量不大。
3. ChatGPT 自动充值要用户交出 Session（等同登录权限），与「全程无需账号密码」的承诺冲突，需先定文案和隐私口径。

## ip.net.coffee/claude：IP 检测原理

核心是让浏览器分别访问三个地址，代理软件按规则把它们分到不同线路，再读回每条线路的出口 IP。这些地址都返回 `Access-Control-Allow-Origin: *`，网页可以跨域直接读取，这一步不需要后端。

| 页面卡片 | 浏览器请求 | 命中的分流规则 | 得到什么 |
| --- | --- | --- | --- |
| 中国出口 IP | `2026.ip138.com`，失败再试 `my.ip.cn` | 国内网站，一般直连 | 用户真实的国内宽带 IP |
| Cloudflare 出口 IP | `https://1.1.1.1/cdn-cgi/trace` | 纯 IP 地址，域名规则匹配不上 | 默认（兜底）线路的出口 |
| Claude 出口 IP | `https://claude.ai/cdn-cgi/trace` | 与访问 claude.ai 同一条域名规则 | Claude 边缘看到的出口 IP 和国家 |

其余模块：

- **风险评分**：`/api/iprisk/{ip}` 由后端转查第三方情报，字段格式与 ipapi.is 一致（如 `abuser_score: "0.0039 (Low)"`），按 /24 网段缓存。`trust_score` 算法不公开，Google 机房 IP 8.8.8.8 也得 63 分。
- **DNS 泄露**：用随机子域 `{token}-1.d.ip.net.coffee` 触发解析，自建的权威 DNS 记下来查询的解析器 IP，再用 `/api/dns/result/{token}` 取回。
- **WebRTC 泄露**：经 Google、Cloudflare 的 STUN 拿到 UDP 公网地址，与 Claude 出口 IP 不同即报泄露。
- **隐私问题**：页面写「0 记录」，但代码会静默 `POST /api/session`，把三条线路的 IP 一起上报。

## ping0.cc：原生 IP、共享人数与适用场景

ping0 的原生 IP 判定口径最值得参考；共享人数依赖它独有的数据，无法复刻。

| 项目 | ping0 的做法 | 我们能否复刻 |
| --- | --- | --- |
| 原生 IP | IP 在 RIR 登记的注册国家与定位国家一致即原生，否则为广播 IP | 能：用 RIPEstat 的 rir-stats-country 查注册国家，已在本地实现，待部署 |
| 共享人数 | 过去 12 个月关联该 IP 的独立用户数估算，分 1-10 到 10000+ 五档；中国大陆 IP 不显示 | 不能：依赖它的全网流量数据，ipapi.is 等情报源都没有 |
| 适用场景 | 按位置、IP 类型、风控值套经验规则，给 TikTok、跨境电商、AI 应用等打 1-5 星 | 能做，但与我们「8 项全绿」的结论容易冲突，已决定不做 |
| IP 位置 | 自建全球探测节点，按延迟最低的节点定位 | 不能：需要分布式探测网络 |

实测对照：出口 72.244.x.x 的 ASN（Catixs，英国注册）与 IP 段注册国家（美国，ARIN）不同。按 ASN 判会误报「广播 IP（英国）」，按 RIR 注册国家判为原生，与 ping0 一致。

SEO 方面，ping0 标题主打「IP 地址归属地查询、IP 风控值查询、原生 IP 查询、IP 类型查询、家庭宽带 IP 查询」；net.coffee 主打「Claude IP 查询、IP 纯净度、住宅 / 机房 IP、Claude 封号检测」。这些词已补进 /claude-ip 的标题、描述和 FAQ（待部署）。

## buyai.dev：自动充值链路

buyai 自己不充值：它是带库存的店铺前台，付款后由程序把用户凭据和一张卡密提交给上游 aichongzhi.fun 兑换，真正的付款渠道在上游。

&#91;embedded content: buyai 自动充值的调用顺序 · 5 方 8 步\]

buyai 自己的开发量集中在前台、支付对接和第 2、6 步的上游接口调用；付款能力全部来自上游。

接口与证据（来自其前端 `app.js` 和上游页面）：

| 环节 | 接口或位置 | 说明 |
| --- | --- | --- |
| 提交凭据 | 前端弹窗 | ChatGPT 粘贴 `chatgpt.com/api/auth/session` 的完整 JSON（含 accessToken）；Claude 只填 Organization ID |
| 验证账号 | `POST /api/recharge/verify` | 后端转给 aichongzhi.fun 验证，返回 `ticket` 和账号邮箱；代码注释写明上游逐个处理，需排队 |
| 下单 | `POST /api/orders` | 带 `recharge_ticket` 和联系方式，返回订单号、订单令牌和 `payment_url` |
| 付款 | zpayz.cn | 第三方聚合支付（支付宝）；下单前用 Cloudflare Turnstile 防刷 |
| 兑换 | 后台 → aichongzhi.fun | `/api/catalog` 有 `stock` 字段，说明囤有卡密；付款后自动兑换，30 秒到 30 分钟到账 |
| 付款渠道 | 上游 | iOS 礼品卡（美区、欧盟）、菲律宾和智利低价区；部分 Pro 5x 要用户 Cookie「用于生成支付链接」 |

风险：

- Session JSON 等同账号登录权限，被转交给 buyai 和上游两方；buyai 声称加密保存、充值后删除，无法核实。
- 低价区和礼品卡渠道有订阅被撤销的风险，buyai 的商品说明写着「掉订阅按剩余天数处理」。
- Claude 只要 Org ID，限制条件包括已过 KYC、当前无绑卡订阅、未用过礼品卡；Claude 是否走同一上游属推断。

## 我们的采纳与取舍（gutast.com/claude-ip）

我们沿用了竞品的检测方法，但把结论收敛成 8 项核心检测，数据源和隐私做法都换成了可公开说明的方案。

| 方面 | 竞品做法 | 我们的做法 | 原因 |
| --- | --- | --- | --- |
| 出口 IP | net.coffee：claude.ai 与 1.1.1.1 的 trace，加国内回显站 | 同样做法，另加 api.anthropic.com 的 trace | Claude Code 走这个域名，可以检查分流是否一致 |
| IP 情报 | net.coffee：自建后端，按 /24 缓存 | Pages Function 带 key 查 ipapi.is，按单个 IP 缓存 24 小时 | 免费账号每天 1,000 次，密钥只在服务端 |
| 支持地区 | net.coffee：硬写 10 个受限国家 | Anthropic 官方名单，185 个地区 | 与官方口径一致 |
| 原生 IP | ping0：RIR 注册国家 vs 定位国家 | 同样口径，注册国家查 RIPEstat | 按 ASN 国家会把租用的 IP 段误判为广播 |
| 检测结论 | 各项分散显示，另给信任分 | 8 项核心检测全部通过才显示「未发现已知风险」；机房 IP 记红色 | 支撑「全绿即可放心使用」的卖点，又不作安全保证 |
| DNS 泄露 | net.coffee：自建权威 DNS | 暂不做 | Workers 不能当 DNS 服务器，需要单独的 VPS |
| 共享人数、适用场景 | ping0 提供 | 不做 | 前者没有数据，后者与 8 项结论冲突 |
| 隐私 | net.coffee 静默上报三条线路的 IP | 只把 Claude 出口 IP 发到本站，写进隐私声明 | 与「全程无需账号密码」的品牌承诺一致 |

状态：线上是 10 月 22 日部署的版本。结论面板、RIPEstat 原生 IP、新 SEO 文案和 404 页面都在本地，待部署。

## 待办与后续建议

当前最要紧的是部署本地改动并补上限流；自动充值是独立的业务决策，先评估上游再开发。

- [ ] 部署本地改动，按部署文档的清单验证：IPv6 查询、非法编码返回 400、隐私声明、404 页面
- [ ] 在 Cloudflare 后台给 `/api/ip/*` 配限流规则（线上实测连发 15 次都返回 200）
- [ ] 部署后再去 Blogger、Google Sites 等平台更新外链帖子的配图和工具链接
- [ ] 在 Google Search Console 和百度搜索资源平台提交 /claude-ip
- [ ] 决定是否做自动充值：先找有 API 的上游，评估卡密进价、到账时效和掉订阅的售后成本
- [ ] 若做 ChatGPT 自动充值：先改「全程无需账号密码」的文案和隐私声明，说明 Session 的用途和删除时间

## 来源

- [ip.net.coffee/claude](https://ip.net.coffee/claude/)（含其脚本 claude-page.js）
- [ping0.cc](https://ping0.cc/) 与 [ping0 常见问题](https://ping0.cc/ip/faq)
- [buyai.dev](https://www.buyai.dev/)（含其脚本 app.js 与 /api/catalog）
- [aichongzhi.fun](https://aichongzhi.fun/)
- [Anthropic 支持地区](https://www.anthropic.com/legal/supported-regions)
- [RIPEstat rir-stats-country 接口](https://stat.ripe.net/data/rir-stats-country/data.json)
- [ipapi.is 开发文档](https://ipapi.is/developers.html) 与 [免费档说明](https://ipapi.is/free-tier.html)
