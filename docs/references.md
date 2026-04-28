---
title: References
layout: default
nav_order: 9
---

# References & Prior Art

Open-source repos and articles referenced during the design and build of richfolio. Read these before building each module — they've already solved the hard parts.

---

## 🥇 [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio) ⭐ ~15k

> Angular + NestJS + Prisma + TypeScript

The gold standard open-source wealth management app. You don't want to *use* it (it's a full self-hosted web app requiring Docker + Postgres), but it's the best reference for how to solve portfolio data modelling at scale. It's also the largest consumer of `yahoo-finance2` in the wild, so its issues and PRs are a great debugging resource.

**Mine from it:**
- Portfolio and holding data models (how to represent target vs actual allocation)
- Yahoo Finance fetching patterns and batching strategy
- How they handle ETFs, stocks, and crypto uniformly under one interface
- Allocation calculation and performance metric logic

**Relevant source paths:** `apps/api/src/app/portfolio/`, `libs/common/src/lib/`

---

## 🥈 [TraderAlice/OpenAlice](https://github.com/TraderAlice/OpenAlice) ⭐ ~3.8k

> TypeScript + Claude SDK + Multi-Broker (Alpaca, IBKR, CCXT) + File-based state

An autonomous AI trading agent that executes trades directly, using a multi-layered analysis approach combining technical indicators, fundamental data, and structured AI reasoning. OpenAlice's architecture prioritizes explainability, safety, and auditability over raw automation — every decision is traceable, every guard is configurable, and the entire reasoning process is visible.

**Directly inspired six Richfolio features:**

- **Two-Stage Think/Plan AI Prompting** — OpenAlice's `think` and `plan` tools separate observation from decision-making. Stage 1 records observations about market data; Stage 2 evaluates options and commits to actions. Richfolio adapts this as two sequential Gemini calls: Observe (extract structured signals) → Decide (apply rules to observations). This separation significantly improves STRONG BUY criteria consistency.

- **Post-AI Guard Validation Pipeline** — OpenAlice's `guard-pipeline.ts` runs sequential validation checks (position size limits, cooldown periods, symbol whitelist) before broker execution, with context isolation preventing guards from accidentally triggering trades. Richfolio's `guards.ts` adapts this as 6 post-AI checks: bond ETF cap, earnings proximity, STRONG BUY criteria enforcement, max 2 STRONG BUY, confidence sanity, and buy value sanity.

- **Earnings Calendar Awareness** — OpenAlice's equity research tools (`equity.ts`) check the earnings calendar to avoid holding positions during high-risk events. Richfolio adds `calendarEvents` to the existing Yahoo Finance call and hard-caps recommendations near earnings (≤3d → HOLD, ≤7d → no STRONG BUY).

- **News Sentiment Scoring** — OpenAlice uses structured sentiment analysis in its news pipeline. Richfolio upgrades the Gemini news filter from binary relevance to per-article sentiment (bullish/bearish/neutral) + impact (high/medium/low) scoring.

- **Reasoning Persistence (Brain/Memory)** — OpenAlice's `Brain.ts` tracks cognitive state via Git-like commits with emotional state and working memory that persists across sessions. Richfolio adapts this as a 7-day rolling history of AI reasoning snapshots, showing conviction trends in the decision prompt.

- **Additional Technical Indicators** — OpenAlice's formula-based indicator system (`calculator.ts`) supports ATR, Stochastic, and other indicators beyond basic MACD/RSI. Richfolio adds ATR(14) for volatility context, Stochastic(%K/%D) for oversold/overbought confirmation, and OBV trend for accumulation/distribution detection — all from existing chart data.

**Key architectural insight adopted:** OpenAlice's guard pipeline design principle — guards never see the broker object, only a `GuardContext` — maps cleanly to Richfolio's approach where guards receive recommendation data and report context, not raw API objects. This isolation prevents guard logic from having unintended side effects.

---

## 🥉 [gadicc/yahoo-finance2](https://github.com/gadicc/yahoo-finance2) ⭐ ~1.5k

> The actual TypeScript library used for all price and fundamentals fetching

Not a portfolio app but the core dependency. Fully typed, actively maintained, works in Node/serverless. The README documents every `quoteSummary` submodule available.

**Key submodules for richfolio:**

| Submodule | Fields we need |
|-----------|---------------|
| `summaryDetail` | `trailingPE`, `forwardPE`, `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`, `marketCap`, `dividendYield` |
| `financialData` | `currentPrice`, `targetMeanPrice`, `recommendationKey`, `returnOnEquity`, `debtToEquity`, `freeCashflow`, `operatingCashflow`, `profitMargins`, `revenueGrowth`, `earningsGrowth` |
| `defaultKeyStatistics` | `enterpriseToEbitda`, `priceToBook`, `beta`, `fiveYearAvgDividendYield` |
| `price` | `regularMarketPrice`, `regularMarketChangePercent` |

**Mine from it:**
- Which submodules return which fields (P/E missing on ETFs — handle gracefully)
- How to batch `quoteSummary` calls efficiently to avoid rate limits
- BTC/ETH ticker format: use `BTC-USD`, `ETH-USD`
- AMZN not AMAZ (ticker correction from current holdings config)

---

## 🎖️ [T1mn/MarketPulse](https://github.com/T1mn/MarketPulse) ⭐ 234

> Python + Gemini AI + Finnhub + push notifications

Already evaluated as "don't fork" (Python daemon, Chinese push apps, no portfolio awareness). But the AI news summarisation prompt pattern is directly reusable in our TypeScript news digest.

**Mine from it:**
- Gemini prompt structure for per-ticker news analysis → outputs: investment advice, confidence score (%), source reliability score (%)
- Deduplication logic via `app_state.json` — how to avoid re-sending the same news story across multiple morning runs
- Trusted source list: Reuters, Bloomberg, WSJ, AP, CNBC, Dow Jones, MarketWatch — use this as the default `TRUSTED_SOURCES` filter in `fetchNews.ts`

---

## Articles

---

### 🧠 [XinGPT (@xingpt)](https://x.com/xingpt) — AI Agent Skills Framework

> [BlockTempo article](https://www.blocktempo.com/ai-agent-personal-business-productivity-transformation-guide/) by Joe, compiled from [@xingpt on X](https://x.com/xingpt/status/2025219080421277813)

A comprehensive guide on embedding structured analytical "skills" into AI agents for personal finance. The article outlines how to transform a general-purpose AI into a domain expert by giving it specific frameworks with clear criteria and scoring rubrics.

**Directly inspired two Richfolio features:**

- **Value Investing Framework** — the article's "美股價值投資框架" (US Stock Value Investing Framework) concept: rate stocks using fundamental criteria (ROE, debt ratio, FCF, moat) with A/B/C/D grades. Richfolio implements this as prompt instructions fed to Gemini, using Yahoo Finance `financialData` for the underlying metrics.
- **Crypto Bottom-Fishing Model** — the article's "比特幣抄底模型" (Bitcoin Bottom-Fishing Model) concept: detect accumulation zones using technical indicators (RSI, volume, moving averages). Richfolio implements this using existing chart data with four bottom indicators.

**Key insight adopted:** You don't need separate AI agents or additional API calls — embedding structured frameworks as prompt instructions in a single Gemini call is enough to produce disciplined, criteria-based analysis.

---

### 🤖 hvkshetry — Agentic AI for Investment Management

> [Medium article](https://medium.com/data-science-collective/agentic-ai-for-investment-management-from-concept-to-production-a2713c37cc76) — *Agentic AI for Investment Management: From Concept to Production*

A walkthrough of building a multi-agent investment management system with Claude Code and MCP, covering specialist agent roles (`portfolio-manager`, `equity-analyst`, `etf-analyst`, `macro-analyst`), slash command orchestration via `CLAUDE.md`, and zero-cost data sourcing from Yahoo Finance + Finnhub + OpenBB. Almost directly analogous to what richfolio is building.

**Informed Richfolio's approach to:**
- `CLAUDE.md` orchestration pattern for agentic dev workflows
- How to decompose equity vs ETF analysis (ETFs skip P/E, use different signals)
- Connecting macro data to specific portfolio position commentary

---

## Design Decisions Informed by These References

| Decision | Informed by |
|----------|-------------|
| Use `yahoo-finance2` not Finnhub for fundamentals | ghostfolio (battle-tested at scale), yahoo-finance2 docs |
| Skip P/E for ETFs, use 52w range position instead | ghostfolio data model, yahoo-finance2 ETF quirks |
| AI-summarise news per ticker, not raw headlines | MarketPulse prompt pattern |
| Slash command structure for Claude Code dev workflow | hvkshetry's agentic investment management article |
| Fork-and-run model (no shared server) | Contrast with ghostfolio's self-hosted complexity |
| Embed analytical skills as prompt instructions, not separate agents | XinGPT's AI agent skills framework |
| Value investing A–D rating using fundamental criteria | XinGPT's 美股價值投資框架 concept |
| Crypto bottom-fishing with multi-indicator detection | XinGPT's 比特幣抄底模型 concept |
| Two-stage Think/Plan AI prompting (observe then decide) | OpenAlice's think/plan cognitive tools |
| Post-AI guard validation pipeline (6 sequential checks) | OpenAlice's guard-pipeline with context isolation |
| Earnings calendar guard (hard cap near earnings) | OpenAlice's equity research earnings awareness |
| News sentiment scoring (bullish/bearish/neutral per article) | OpenAlice's structured sentiment analysis |
| 7-day reasoning persistence (conviction trends) | OpenAlice's Brain module (cognitive state as commits) |
| ATR + Stochastic + OBV indicators | OpenAlice's formula-based indicator extensibility |
| Gemini retry with exponential backoff | OpenAlice's transient error classification pattern |
