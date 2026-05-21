---
title: API 密钥
layout: default
nav_order: 5
lang: zh-CN
permalink: /api-keys.html
---

# API 密钥

Richfolio 最多使用 5 个外部服务,全都有慷慨的免费额度。只有 Resend 和接收邮箱是必需的 — 其它都是可选。

将每个密钥添加为仓库 Secret:Settings → Secrets and variables → Actions → **Secrets** 标签页。`RECIPIENT_EMAIL` 改为添加为**变量**(便于查看和编辑)。

![GitHub Actions Secret](../screenshots/github_actions_secrets.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## Resend(邮件)— 必需
{: .text-green-200}

Resend 负责投递 HTML 邮件报告。

1. 进入 [resend.com](https://resend.com) 并注册
2. 在控制台找到 **API Keys**
3. 点击 **Create API Key**、起个名字并复制密钥
4. 将其添加为 GitHub Secret — 名称:`RESEND_API_KEY`,值:刚才复制的密钥

**免费额度:** 每月 3,000 封邮件。默认从 `onboarding@resend.dev` 发件。除非你验证了自定义域名,否则只能发送给**你的账号注册邮箱**(Dashboard → Domains → Add Domain → 添加 DNS 记录)。

---

## 接收邮箱 — 必需
{: .text-green-200}

添加为 GitHub **变量**(不是 Secret):名称:`RECIPIENT_EMAIL`,值:你的邮箱地址。

除非验证了自定义域名,否则必须与 Resend 账号邮箱一致。

---

## NewsAPI(新闻头条)— 可选
{: .text-yellow-200}

为每日简报提供每个股票代码的头条新闻。

1. 进入 [newsapi.org](https://newsapi.org) 并注册
2. 控制台会立即显示你的 API 密钥
3. 添加为 GitHub Secret — 名称:`NEWS_API_KEY`,值:控制台中的密钥

**免费额度:** 每日 100 次请求。Richfolio 每次运行通过批量请求只用约 4 次。仅返回最近 24 小时的头条。若未设置,简报会跳过新闻部分。

---

## Google Gemini(AI 分析)— 可选
{: .text-yellow-200}

由 Gemini 2.5 Flash 驱动的 AI 买入建议。

1. 进入 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. 点击 **Create API Key**,选择一个 Google Cloud 项目(或新建一个)
3. 复制密钥并添加为 GitHub Secret — 名称:`GEMINI_API_KEY`,值:刚才复制的密钥

**免费额度:** 每日 250 次请求,每分钟 10 次。Richfolio 每次运行使用 1 次请求(每个 STRONG BUY 标的额外用 1 次做详细分析)。新密钥可能需要几分钟才能激活(你可能先看到 429 错误)。若未设置或额度用尽,会回退到基于缺口的建议。

### 关于 Gemini 模型层级的说明

Google 的定价页面声明 Gemini 2.5 Pro 对输入和输出 token 都是["免费"](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro)。实际使用中,免费层的 Pro 请求经常碰到 `429 RESOURCE_EXHAUSTED` — 即使用量很低也会。Google 没有公布免费层的实际 RPD(每日请求数)上限;第三方资料估计 Pro 大约限制在 100 RPD,但实际数字似乎因账号而异且无保证。

**Richfolio 所有 AI 调用都使用 Gemini 2.5 Flash**(主分析和 STRONG BUY 详细分析都是),因为 Flash 的免费额度更慷慨且更稳定。对金融分析文本来说,质量差异可以忽略。

### 使用其它 AI 模型

如果你有付费的 Gemini 计划或想完全换成另一家服务商,模型很容易替换。AI 调用集中在两个文件里:

- `src/aiAnalysis.ts` — 主买入建议(约第 225 行)
- `src/detailedAnalysis.ts` — STRONG BUY 详细分析(约第 119 行)

**切换到 Gemini Pro**(若你有付费配额):

```typescript
// 在两个文件中将:
model: "gemini-2.5-flash",
// 改为:
model: "gemini-2.5-pro",
```

**切换到 Claude 或其它服务商**,你需要把 `@google/genai` 调用替换为对应服务商的 SDK。例如使用 Anthropic SDK:

```typescript
// npm install @anthropic-ai/sdk
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // 使用 ANTHROPIC_API_KEY 环境变量
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
});
```

提示词和 JSON 解析逻辑保持不变 — 只是 API 调用的方式不同。把服务商的 API 密钥添加为 GitHub Secret 即可。

---

## Telegram 机器人 — 可选
{: .text-yellow-200}

把精简后的摘要发送到你的 Telegram。

### 创建机器人

1. 打开 Telegram,搜索 **@BotFather**
2. 发送 `/newbot`
3. 起一个名字(例如 "Richfolio Brief")和用户名(必须以 `bot` 结尾,例如 `richfolio_brief_bot`)
4. BotFather 会回复你的机器人 token — 复制下来

### 获取你的 chat ID

1. 在 Telegram 中搜索 **@userinfobot** 并启动
2. 它会回复你的数字用户 ID — 这就是你的 chat ID

**重要:** 在运行 Richfolio 之前,先给新创建的机器人发送任意消息(例如 "hi") — 这一步必须先做,机器人才能给你发送消息。

将以下两项都添加为 GitHub Secret:

- 名称:`TELEGRAM_BOT_TOKEN`,值:BotFather 给的 token
- 名称:`TELEGRAM_CHAT_ID`,值:你的数字用户 ID

**注意:** 未设置时,简报会跳过 Telegram。消息是精简后的摘要(不是完整 HTML)。单条消息有 4,096 字符上限,新闻部分必要时会被截断。

---

## 汇总

| 密钥 | 必填 | 服务 |
|------|------|------|
| `RESEND_API_KEY` | 是 | 邮件投递 |
| `RECIPIENT_EMAIL` | 是 | 你的邮箱地址 |
| `NEWS_API_KEY` | 否 | 新闻头条 |
| `GEMINI_API_KEY` | 否 | AI 买入建议 |
| `TELEGRAM_BOT_TOKEN` | 否 | Telegram 投递 |
| `TELEGRAM_CHAT_ID` | 否 | Telegram 投递 |
