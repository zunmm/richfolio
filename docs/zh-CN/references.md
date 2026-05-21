---
title: 参考资料
layout: default
nav_order: 9
lang: zh-CN
permalink: /references.html
---

# 参考资料与先前工作

richfolio 设计与构建过程中参考的开源仓库和文章。在构建每个模块前阅读它们 — 难点别人已经替你解决过。

---

## 🥇 [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio) ⭐ ~15k

> Angular + NestJS + Prisma + TypeScript

开源财富管理应用的黄金标准。你大概并不想*使用*它(它是一个需要 Docker + Postgres 的完整自托管 Web 应用),但对于如何在规模化场景中建模投资组合数据,它是最佳参考。它也是 `yahoo-finance2` 在生产环境的最大消费者,所以它的 issue 和 PR 都是绝佳的调试资源。

**可借鉴:**
- 投资组合与持仓的数据模型(如何表达目标 vs 实际配置)
- Yahoo Finance 的获取模式和批处理策略
- 如何在统一接口下处理 ETF、股票和加密货币
- 配置计算和绩效指标的逻辑

**相关源码路径:** `apps/api/src/app/portfolio/`、`libs/common/src/lib/`

---

## 🥈 [TraderAlice/OpenAlice](https://github.com/TraderAlice/OpenAlice) ⭐ ~3.8k

> TypeScript + Claude SDK + 多券商(Alpaca、IBKR、CCXT)+ 文件式状态

一个自主 AI 交易代理,能直接执行交易,使用多层次分析方法,把技术指标、基本面数据与结构化的 AI 推理结合起来。OpenAlice 的架构把可解释性、安全性和可审计性优先于纯粹的自动化 — 每个决策可追溯,每个守护可配置,整个推理过程对外可见。

**直接启发 Richfolio 的六项功能:**

- **两阶段 Think/Plan AI 提示词** — OpenAlice 的 `think` 和 `plan` 工具把观察和决策分离。阶段 1 记录关于市场数据的观察;阶段 2 评估选项并提交动作。Richfolio 借鉴为两次顺序的 Gemini 调用:Observe(提取结构化信号)→ Decide(对观察套用规则)。这种分离显著提升了 STRONG BUY 标准的一致性。

- **AI 后置守护验证管道** — OpenAlice 的 `guard-pipeline.ts` 在券商执行前运行顺序验证检查(仓位上限、冷却期、白名单),并通过上下文隔离防止守护意外触发交易。Richfolio 的 `guards.ts` 借鉴此模式实现 6 项 AI 后置检查:债券 ETF 上限、财报临近、STRONG BUY 标准强制、最多 2 个 STRONG BUY、置信度合理性以及买入金额合理性。

- **财报日历感知** — OpenAlice 的股票研究工具(`equity.ts`)会检查财报日历,避免在高风险事件期间持仓。Richfolio 将 `calendarEvents` 加入既有的 Yahoo Finance 调用,并在临近财报时硬性上限建议(≤3 天 → HOLD,≤7 天 → 不出 STRONG BUY)。

- **新闻情绪评分** — OpenAlice 在新闻管道中使用结构化的情绪分析。Richfolio 把 Gemini 新闻过滤器从二元相关性升级为每篇文章的情绪(看涨/看跌/中性)+ 影响度(高/中/低)评分。

- **推理持久化(脑/记忆)** — OpenAlice 的 `Brain.ts` 通过类 Git 提交跟踪认知状态,带情绪状态和跨会话持久化的工作记忆。Richfolio 借鉴为 7 天滚动的 AI 推理快照历史,在决策提示中展示信念走势。

- **更多技术指标** — OpenAlice 的基于公式的指标系统(`calculator.ts`)支持 ATR、随机指标及其它,不止 MACD/RSI。Richfolio 补充了 ATR(14) 提供波动上下文、随机指标(%K/%D)用于超卖/超买确认,以及 OBV 趋势用于吸筹/派发检测 — 全部基于既有图表数据。

**采纳的关键架构洞察:** OpenAlice 的守护管道设计原则 — 守护从不直接看到券商对象,只看到一个 `GuardContext` — 直接映射到 Richfolio 的做法:守护接收建议数据和报告上下文,而不是原始 API 对象。这种隔离防止守护逻辑产生意外的副作用。

---

## 🥉 [gadicc/yahoo-finance2](https://github.com/gadicc/yahoo-finance2) ⭐ ~1.5k

> 实际用于所有价格与基本面获取的 TypeScript 库

不是投资组合应用,但是核心依赖。完整类型化、活跃维护,可在 Node/Serverless 中运行。README 文档化了 `quoteSummary` 的每个子模块。

**richfolio 关键子模块:**

| 子模块 | 需要的字段 |
|--------|------------|
| `summaryDetail` | `trailingPE`、`forwardPE`、`fiftyTwoWeekHigh`、`fiftyTwoWeekLow`、`marketCap`、`dividendYield` |
| `financialData` | `currentPrice`、`targetMeanPrice`、`recommendationKey`、`returnOnEquity`、`debtToEquity`、`freeCashflow`、`operatingCashflow`、`profitMargins`、`revenueGrowth`、`earningsGrowth` |
| `defaultKeyStatistics` | `enterpriseToEbitda`、`priceToBook`、`beta`、`fiveYearAvgDividendYield` |
| `price` | `regularMarketPrice`、`regularMarketChangePercent` |

**可借鉴:**
- 哪些子模块返回哪些字段(P/E 对 ETF 不存在 — 需优雅处理)
- 如何高效批量调用 `quoteSummary` 以避免限流
- BTC/ETH 的代码格式:使用 `BTC-USD`、`ETH-USD`
- AMZN 不是 AMAZ(当前持仓配置中的代码纠错)

---

## 🎖️ [T1mn/MarketPulse](https://github.com/T1mn/MarketPulse) ⭐ 234

> Python + Gemini AI + Finnhub + 推送通知

已被评估为 "不要 fork"(Python 守护进程、中国系推送应用、无投资组合感知)。但 AI 新闻摘要的提示词模式在我们 TypeScript 版的新闻摘要中可以直接复用。

**可借鉴:**
- 每个标的的新闻分析 Gemini 提示词结构 → 输出:投资建议、置信度评分(%)、信源可信度评分(%)
- 通过 `app_state.json` 实现的去重逻辑 — 如何避免多次早间运行时重复发送相同新闻
- 可信信源列表:Reuters、Bloomberg、WSJ、AP、CNBC、Dow Jones、MarketWatch — 用作 `fetchNews.ts` 默认 `TRUSTED_SOURCES` 过滤器

---

## 文章

---

### 🧠 [XinGPT (@xingpt)](https://x.com/xingpt) — AI Agent Skills 框架

> [BlockTempo 文章](https://www.blocktempo.com/ai-agent-personal-business-productivity-transformation-guide/),作者 Joe,整理自 [X 上的 @xingpt](https://x.com/xingpt/status/2025219080421277813)

一篇关于把结构化分析"技能"嵌入个人理财 AI 代理的全面指南。文章阐述了如何通过赋予 AI 具体框架、清晰标准和评分规则,把通用 AI 转化为领域专家。

**直接启发 Richfolio 两项功能:**

- **价值投资框架** — 文章的 "美股價值投資框架" 概念:用基本面标准(ROE、负债比、FCF、护城河)给股票评 A/B/C/D 等级。Richfolio 将其实现为喂给 Gemini 的提示词指令,使用 Yahoo Finance `financialData` 提供底层指标。
- **加密货币抄底模型** — 文章的 "比特幣抄底模型" 概念:使用技术指标(RSI、成交量、移动均线)识别吸筹区。Richfolio 基于既有图表数据用四个抄底指标实现。

**采纳的关键洞察:** 不需要单独的 AI 代理或额外 API 调用 — 在一次 Gemini 调用中以提示词指令形式嵌入结构化框架,就足以产出有纪律的、基于标准的分析。

---

### 🤖 hvkshetry — Agentic AI for Investment Management

> [Medium 文章](https://medium.com/data-science-collective/agentic-ai-for-investment-management-from-concept-to-production-a2713c37cc76) — *Agentic AI for Investment Management: From Concept to Production*

一篇关于用 Claude Code 和 MCP 构建多代理投资管理系统的实践指南,涵盖专家代理角色(`portfolio-manager`、`equity-analyst`、`etf-analyst`、`macro-analyst`)、通过 `CLAUDE.md` 编排的斜杠命令,以及来自 Yahoo Finance + Finnhub + OpenBB 的零成本数据来源。与 richfolio 的目标几乎完全对应。

**启发 Richfolio 在以下方面的方法:**
- 用于代理式开发工作流的 `CLAUDE.md` 编排模式
- 如何拆解股票 vs ETF 分析(ETF 跳过 P/E,使用不同信号)
- 把宏观数据与具体仓位的评注关联起来

---

## 受这些参考启发的设计决策

| 决策 | 启发来源 |
|------|----------|
| 基本面采用 `yahoo-finance2` 而非 Finnhub | ghostfolio(规模化验证)、yahoo-finance2 文档 |
| ETF 跳过 P/E,改用 52 周区间位置 | ghostfolio 数据模型、yahoo-finance2 ETF 的细节 |
| 用 AI 总结每标的新闻,而非原始头条 | MarketPulse 提示词模式 |
| Claude Code 开发流程的斜杠命令结构 | hvkshetry 的代理式投资管理文章 |
| Fork-and-run 模型(无共享服务器) | 与 ghostfolio 自托管复杂度的对比 |
| 把分析技能嵌入提示词指令,而非独立代理 | XinGPT 的 AI Agent Skills 框架 |
| 用基本面标准给股票 A-D 评级 | XinGPT 的 美股價值投資框架 概念 |
| 多指标加密货币抄底检测 | XinGPT 的 比特幣抄底模型 概念 |
| 两阶段 Think/Plan AI 提示词(先观察再决策) | OpenAlice 的 think/plan 认知工具 |
| AI 后置守护验证管道(6 项顺序检查) | OpenAlice 的 guard-pipeline 与上下文隔离 |
| 财报日历守护(临近财报硬上限) | OpenAlice 股票研究的财报感知 |
| 新闻情绪评分(每篇文章的看涨/看跌/中性) | OpenAlice 的结构化情绪分析 |
| 7 天推理持久化(信念走势) | OpenAlice 的 Brain 模块(把认知状态作为提交) |
| ATR + 随机指标 + OBV 等指标 | OpenAlice 基于公式的指标可扩展性 |
| Gemini 指数退避重试 | OpenAlice 的临时错误分类模式 |
