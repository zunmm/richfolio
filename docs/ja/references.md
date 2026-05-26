---
title: 参考資料
layout: default
nav_order: 9
lang: ja
permalink: /references.html
---

# 参考資料と先行事例

richfolio の設計と構築の過程で参照したオープンソースリポジトリと記事です。各モジュールを構築する前にこれらを読みましょう — 難しい部分は彼らがすでに解決しています。

---

## 🥇 [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio) ⭐ ~15k

> Angular + NestJS + Prisma + TypeScript

オープンソースの資産管理アプリのゴールドスタンダードです。これを*使う*のはおそらく望まないでしょう（Docker + Postgres を必要とするフル機能のセルフホスト Web アプリです）が、ポートフォリオデータを大規模にモデリングする方法のベストリファレンスです。野生で `yahoo-finance2` を最も多く消費するプロジェクトでもあるので、その issue と PR は素晴らしいデバッグリソースになります。

**ここから学べること：**
- ポートフォリオと保有のデータモデル（目標と実際の配分の表現方法）
- Yahoo Finance のフェッチパターンとバッチング戦略
- ETF、株式、暗号資産を単一のインターフェースで統一的に扱う方法
- 配分計算とパフォーマンス指標のロジック

**関連するソースパス：** `apps/api/src/app/portfolio/`、`libs/common/src/lib/`

---

## 🥈 [TraderAlice/OpenAlice](https://github.com/TraderAlice/OpenAlice) ⭐ ~3.8k

> TypeScript + Claude SDK + マルチブローカー（Alpaca、IBKR、CCXT）+ ファイルベースの状態

自律型 AI トレーディングエージェントで、テクニカル指標、ファンダメンタルデータ、構造化された AI 推論を組み合わせた多層分析アプローチを用いて直接取引を執行します。OpenAlice のアーキテクチャは生の自動化よりも、説明可能性、安全性、監査可能性を優先します — すべての決定はトレース可能、すべてのガードは設定可能、推論プロセス全体が可視化されています。

**Richfolio の 6 つの機能に直接インスピレーションを与えました：**

- **2 段階 Think/Plan AI プロンプティング** — OpenAlice の `think` と `plan` ツールは観察と意思決定を分離します。ステージ 1 は市場データに関する観察を記録し、ステージ 2 は選択肢を評価してアクションにコミットします。Richfolio はこれを 2 つの逐次的な Gemini 呼び出しに適応させました：Observe（構造化されたシグナルを抽出）→ Decide（観察結果にルールを適用）。この分離により STRONG BUY 基準の一貫性が大幅に向上します。

- **AI 後段ガード検証パイプライン** — OpenAlice の `guard-pipeline.ts` はブローカー実行前に逐次的な検証チェック（ポジションサイズ上限、クールダウン期間、シンボルホワイトリスト）を実行し、コンテキスト分離によりガードが偶発的に取引をトリガーすることを防ぎます。Richfolio の `guards.ts` はこれを 6 つの AI 後段チェックとして適応させました：債券 ETF キャップ、決算近接、STRONG BUY 基準の強制、STRONG BUY は最大 2 件、信頼度の妥当性、買い金額の妥当性。

- **決算カレンダー認識** — OpenAlice の株式調査ツール（`equity.ts`）は決算カレンダーをチェックし、高リスクイベント中のポジション保有を回避します。Richfolio は既存の Yahoo Finance 呼び出しに `calendarEvents` を追加し、決算直前の推奨にハードキャップを適用します（≤3 日 → HOLD、≤7 日 → STRONG BUY なし）。

- **ニュースセンチメントスコアリング** — OpenAlice はニュースパイプラインで構造化されたセンチメント分析を使います。Richfolio は Gemini のニュースフィルタをバイナリな関連性から記事ごとのセンチメント（強気／弱気／中立）＋インパクト（高／中／低）スコアリングへとアップグレードしました。

- **推論の永続化（Brain/Memory）** — OpenAlice の `Brain.ts` は感情状態とセッション間で永続化する作業記憶を持つ、Git ライクなコミットで認知状態を追跡します。Richfolio はこれを AI 推論スナップショットの 7 日ローリング履歴として適応させ、確信度のトレンドを意思決定プロンプトに表示します。

- **追加のテクニカル指標** — OpenAlice の数式ベースの指標システム（`calculator.ts`）は ATR、ストキャスティクスなど、基本的な MACD/RSI を超える指標をサポートします。Richfolio はボラティリティ・コンテキスト向けの ATR(14)、売られすぎ／買われすぎ確認のためのストキャスティクス（%K/%D）、蓄積／分配検出のための OBV トレンドを追加しました — すべて既存のチャートデータから。

**採用した主要なアーキテクチャ的洞察：** OpenAlice のガードパイプライン設計原則 — ガードはブローカーオブジェクトを見ず、`GuardContext` のみを見る — は、ガードが生の API オブジェクトではなく推奨データとレポートコンテキストを受け取る Richfolio のアプローチに直接マッピングされます。この分離により、ガードロジックが意図しない副作用を持つことを防ぎます。

---

## 🥉 [gadicc/yahoo-finance2](https://github.com/gadicc/yahoo-finance2) ⭐ ~1.5k

> すべての価格とファンダメンタルのフェッチに実際に使用されている TypeScript ライブラリ

ポートフォリオアプリではなく、コアの依存関係です。完全に型付けされ、活発にメンテナンスされ、Node/サーバーレスで動作します。README は利用可能な `quoteSummary` のすべてのサブモジュールを文書化しています。

**richfolio の主要サブモジュール：**

| サブモジュール | 必要なフィールド |
|-----------|---------------|
| `summaryDetail` | `trailingPE`、`forwardPE`、`fiftyTwoWeekHigh`、`fiftyTwoWeekLow`、`marketCap`、`dividendYield` |
| `financialData` | `currentPrice`、`targetMeanPrice`、`recommendationKey`、`returnOnEquity`、`debtToEquity`、`freeCashflow`、`operatingCashflow`、`profitMargins`、`revenueGrowth`、`earningsGrowth` |
| `defaultKeyStatistics` | `enterpriseToEbitda`、`priceToBook`、`beta`、`fiveYearAvgDividendYield` |
| `price` | `regularMarketPrice`、`regularMarketChangePercent` |

**ここから学べること：**
- どのサブモジュールがどのフィールドを返すか（ETF には P/E が欠けている — 穏やかに扱う）
- レートリミットを避けるための `quoteSummary` 呼び出しの効率的なバッチング方法
- BTC/ETH ティッカー形式：`BTC-USD`、`ETH-USD` を使用
- AMZN（AMAZ ではない）— 現在の保有設定からのティッカー修正

---

## 🎖️ [T1mn/MarketPulse](https://github.com/T1mn/MarketPulse) ⭐ 234

> Python + Gemini AI + Finnhub + プッシュ通知

すでに「fork しない」と評価されました（Python デーモン、中国系プッシュアプリ、ポートフォリオ認識なし）。しかし AI ニュース要約のプロンプトパターンは TypeScript のニュースダイジェストで直接再利用できます。

**ここから学べること：**
- ティッカーごとのニュース分析の Gemini プロンプト構造 → 出力：投資アドバイス、信頼度スコア（%）、ソース信頼性スコア（%）
- `app_state.json` 経由の重複排除ロジック — 朝の複数の実行で同じニュース記事を再送信しない方法
- 信頼できるソースリスト：Reuters、Bloomberg、WSJ、AP、CNBC、Dow Jones、MarketWatch — `fetchNews.ts` のデフォルト `TRUSTED_SOURCES` フィルタとして使用

---

## 記事

---

### 🧠 [XinGPT (@xingpt)](https://x.com/xingpt) — AI Agent Skills Framework

> Joe による [BlockTempo の記事](https://www.blocktempo.com/ai-agent-personal-business-productivity-transformation-guide/)、[X 上の @xingpt](https://x.com/xingpt/status/2025219080421277813) からまとめ

個人金融向け AI エージェントに構造化された分析「スキル」を組み込むための包括的ガイドです。記事は、明確な基準とスコアリングのルーブリックを持つ特定のフレームワークを与えることで、汎用 AI をドメインエキスパートに変える方法を解説しています。

**Richfolio の 2 つの機能に直接インスピレーションを与えました：**

- **バリュー投資フレームワーク** — 記事の「美股價值投資框架」（米株バリュー投資フレームワーク）の概念：ファンダメンタル基準（ROE、負債比率、FCF、Moat）を使って株式を A/B/C/D に格付け。Richfolio はこれを Gemini に与えるプロンプト指示として実装し、基礎指標には Yahoo Finance の `financialData` を使用しています。
- **暗号資産底値拾いモデル** — 記事の「比特幣抄底模型」（ビットコイン底値拾いモデル）の概念：テクニカル指標（RSI、出来高、移動平均線）を使って蓄積ゾーンを検出。Richfolio はこれを 4 つの底値指標を持つ既存のチャートデータを使って実装しています。

**採用した主要な洞察：** 別の AI エージェントや追加 API 呼び出しは不要 — 構造化されたフレームワークを単一の Gemini 呼び出しのプロンプト指示として埋め込めば、規律ある基準ベースの分析を生み出すには十分です。

---

### 🤖 hvkshetry — Agentic AI for Investment Management

> [Medium 記事](https://medium.com/data-science-collective/agentic-ai-for-investment-management-from-concept-to-production-a2713c37cc76) — *Agentic AI for Investment Management: From Concept to Production*

Claude Code と MCP を使ったマルチエージェント投資管理システム構築の解説で、スペシャリストエージェントの役割（`portfolio-manager`、`equity-analyst`、`etf-analyst`、`macro-analyst`）、`CLAUDE.md` 経由のスラッシュコマンドオーケストレーション、Yahoo Finance + Finnhub + OpenBB によるゼロコストのデータソーシングをカバーします。richfolio がやろうとしていることとほぼ直接的に類似しています。

**Richfolio の次のアプローチに影響を与えました：**
- エージェンティック開発ワークフローのための `CLAUDE.md` オーケストレーションパターン
- 株式 vs ETF 分析の分解方法（ETF は P/E をスキップし、異なるシグナルを使用）
- マクロデータを特定のポートフォリオポジションのコメンタリーに結びつける方法

---

## これらの参考資料に影響を受けた設計上の決定

| 決定 | 影響元 |
|----------|-------------|
| ファンダメンタルに Finnhub ではなく `yahoo-finance2` を使う | ghostfolio（規模で実戦テスト済み）、yahoo-finance2 のドキュメント |
| ETF では P/E をスキップし、52 週レンジの位置を使う | ghostfolio のデータモデル、yahoo-finance2 の ETF の癖 |
| 生のヘッドラインではなくティッカーごとのニュースを AI で要約 | MarketPulse のプロンプトパターン |
| Claude Code 開発ワークフローのスラッシュコマンド構造 | hvkshetry のエージェンティック投資管理記事 |
| Fork-and-run モデル（共有サーバーなし） | ghostfolio のセルフホストの複雑さとの対比 |
| 分析スキルを別エージェントではなくプロンプト指示として埋め込む | XinGPT の AI Agent Skills フレームワーク |
| ファンダメンタル基準を使った株式の A〜D 評価 | XinGPT の 美股價值投資框架 の概念 |
| 複数指標による暗号資産の底値拾い検出 | XinGPT の 比特幣抄底模型 の概念 |
| 2 段階 Think/Plan AI プロンプティング（観察してから決定） | OpenAlice の think/plan 認知ツール |
| AI 後段ガード検証パイプライン（6 つの逐次チェック） | OpenAlice の guard-pipeline とコンテキスト分離 |
| 決算カレンダーガード（決算直前のハードキャップ） | OpenAlice の株式調査の決算認識 |
| ニュースセンチメントスコアリング（記事ごとの強気／弱気／中立） | OpenAlice の構造化されたセンチメント分析 |
| 7 日推論永続化（確信度トレンド） | OpenAlice の Brain モジュール（認知状態をコミットとして） |
| ATR + ストキャスティクス + OBV 指標 | OpenAlice の数式ベースの指標拡張性 |
| 指数バックオフを使った Gemini リトライ | OpenAlice の一時的エラー分類パターン |
