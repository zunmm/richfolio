---
title: API キー
layout: default
nav_order: 5
lang: ja
permalink: /api-keys.html
---

# API キー

Richfolio は最大 5 つの外部サービスを利用しますが、すべて寛大な無料枠があります。必須なのは Resend と受信メールアドレスだけ — それ以外はすべてオプションです。

各キーはリポジトリの Secret として追加します：Settings → Secrets and variables → Actions → **Secrets** タブ。`RECIPIENT_EMAIL` は代わりに **Variable** として追加してください（閲覧／編集が容易です）。

![GitHub Actions Secrets](../screenshots/github_actions_secrets.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## Resend（メール）— 必須
{: .text-green-200}

Resend は HTML メールレポートを配信します。

1. [resend.com](https://resend.com) にアクセスしてサインアップ
2. ダッシュボードで **API Keys** に移動
3. **Create API Key** をクリックし、名前を付けてキーをコピー
4. GitHub Secret として追加 — 名前：`RESEND_API_KEY`、値：先ほどコピーしたキー

**無料枠：** 月 3,000 通。デフォルトでは `onboarding@resend.dev` から送信されます。カスタムドメインを認証しない限り、**アカウント所有者のメールアドレス**にしか送信できません（Dashboard → Domains → Add Domain → DNS レコードを追加）。

---

## 受信メールアドレス — 必須
{: .text-green-200}

GitHub の **Variable**（Secret ではない）として追加：名前：`RECIPIENT_EMAIL`、値：あなたのメールアドレス。

カスタムドメインを認証していない場合、Resend アカウントのメールアドレスと一致している必要があります。

---

## NewsAPI（ヘッドライン）— オプション
{: .text-yellow-200}

毎日のブリーフに各ティッカーのトップヘッドラインを提供します。

1. [newsapi.org](https://newsapi.org) にアクセスしてサインアップ
2. ダッシュボードに API キーがすぐに表示されます
3. GitHub Secret として追加 — 名前：`NEWS_API_KEY`、値：ダッシュボードのキー

**無料枠：** 1 日 100 リクエスト。Richfolio はバッチング経由で 1 回の実行につき約 4 リクエストを使用します。直近 24 時間のヘッドラインのみ。未設定の場合、ブリーフはニュースなしで実行されます。

---

## Google Gemini（AI 分析）— オプション
{: .text-yellow-200}

Gemini 2.5 Flash で AI 買い推奨を提供します。

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) にアクセス
2. **Create API Key** をクリックし、Google Cloud プロジェクトを選択（または新規作成）
3. キーをコピーし、GitHub Secret として追加 — 名前：`GEMINI_API_KEY`、値：先ほどコピーしたキー

**無料枠：** 1 日 250 リクエスト、1 分あたり 10 リクエスト。Richfolio は 1 回の実行につき 1 リクエストを使用します（さらに詳細分析のために STRONG BUY ティッカー 1 つにつき 1 リクエスト）。新しいキーは有効化に数分かかることがあります（最初は 429 エラーが見えるかもしれません）。未設定またはクォータ枯渇の場合、ギャップベースの推奨にフォールバックします。

### Gemini モデルティアに関する注記

Google の価格ページでは Gemini 2.5 Pro が入力／出力トークンとも[「無料」](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro)であると記載されています。しかし実際には、無料枠の Pro リクエストは使用量が少なくても頻繁に `429 RESOURCE_EXHAUSTED` エラーに当たります。Google は無料枠の実際の RPD（1 日あたりリクエスト数）上限を公表していません。サードパーティの情報源では Pro は約 100 RPD に制限されているかもしれないと示唆されていますが、実際の数字はアカウントによって異なるようで、保証はありません。

**Richfolio はすべての AI 呼び出しに Gemini 2.5 Flash を使用しています**（メイン分析と詳細 STRONG BUY 分析の両方）。Flash の方が寛大で信頼性の高い無料枠クォータを持つためです。金融分析テキストにおける品質の差は無視できます。

### 別の AI モデルを使う

有料の Gemini プランを持っているか、まったく別のプロバイダを使いたい場合、モデルは簡単に入れ替えられます。AI 呼び出しは 2 つのファイルにあります：

- `src/aiAnalysis.ts` — メインの買い推奨（約 225 行目）
- `src/detailedAnalysis.ts` — STRONG BUY の詳細分析（約 119 行目）

**Gemini Pro に切り替える**場合（有料クォータがある場合）：

```typescript
// In both files, change:
model: "gemini-2.5-flash",
// To:
model: "gemini-2.5-pro",
```

**Claude や他のプロバイダに切り替える**場合、`@google/genai` の呼び出しをプロバイダの SDK に置き換えます。例えば Anthropic SDK の場合：

```typescript
// npm install @anthropic-ai/sdk
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // uses ANTHROPIC_API_KEY env var
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
});
```

プロンプトと JSON 解析ロジックは同じまま — API 呼び出しだけが変わります。プロバイダの API キーを GitHub Secret として追加してください。

---

## Telegram ボット — オプション
{: .text-yellow-200}

Telegram アカウントに凝縮されたサマリーを配信します。

### ボットを作成

1. Telegram を開き、**@BotFather** を検索
2. `/newbot` を送信
3. 名前（例：「Richfolio Brief」）とユーザー名（`bot` で終わる必要があります、例：`richfolio_brief_bot`）を選択
4. BotFather がボットトークンを返信します — コピーしてください

### chat ID を取得

1. Telegram で **@userinfobot** を検索して起動
2. 数値のユーザー ID が返ってきます — これがあなたの chat ID です

**重要：** Richfolio を実行する前に、新しいボットに何かメッセージ（例：「hi」）を送ってください — ボットがあなたにメッセージを送れるようになる前に必要です。

両方を GitHub Secret として追加します：

- 名前：`TELEGRAM_BOT_TOKEN`、値：BotFather からのトークン
- 名前：`TELEGRAM_CHAT_ID`、値：あなたの数値ユーザー ID

**注意：** 未設定の場合、ブリーフは Telegram をスキップします。メッセージは凝縮されたサマリー（フル HTML ではない）です。1 メッセージあたり 4,096 文字の制限 — 必要に応じてニュースが切り詰められます。

---

## まとめ

| キー | 必須 | サービス |
|-----|----------|---------|
| `RESEND_API_KEY` | はい | メール配信 |
| `RECIPIENT_EMAIL` | はい | あなたのメールアドレス |
| `NEWS_API_KEY` | いいえ | ニュースヘッドライン |
| `GEMINI_API_KEY` | いいえ | AI 買い推奨 |
| `TELEGRAM_BOT_TOKEN` | いいえ | Telegram 配信 |
| `TELEGRAM_CHAT_ID` | いいえ | Telegram 配信 |
