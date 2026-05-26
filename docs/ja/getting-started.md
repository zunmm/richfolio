---
title: はじめに
layout: default
nav_order: 3
lang: ja
permalink: /getting-started.html
---

# はじめに

Richfolio を 5 分以内で動かしましょう — コーディング不要です。

---

## 1. リポジトリを Fork

[GitHub で Richfolio を Fork](https://github.com/furic/richfolio/fork){: .btn .btn-primary }

これで自分専用のコピーが作成され、そこにポートフォリオを設定し、GitHub Actions 経由で毎日のブリーフを自動実行できるようになります。

---

## 2. ポートフォリオを設定する

GitHub 上で目標配分と現在の保有を設定します。フィールドの詳細は[設定](configuration)を参照してください。

![GitHub Actions Variables](../screenshots/github_actions_variables.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## 3. API キーを追加する

API キーを GitHub Secret として追加します。最低限必要なのは `RESEND_API_KEY` です。各サービスごとの手順は [API キー](api-keys)を参照してください。

![GitHub Actions Secrets](../screenshots/github_actions_secrets.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## 4. デプロイ

GitHub Actions を有効化すれば、毎日のブリーフ、ザラ場アラート、週次レポートが自動的に届きます。詳しい手順は[デプロイ](deployment)を参照してください。

---

## 次のステップ

- [設定](configuration) — ポートフォリオの配分をカスタマイズ
- [API キー](api-keys) — Resend、NewsAPI、Gemini、Telegram のセットアップ
- [デプロイ](deployment) — GitHub Actions で自動化
- [ローカル開発](local-development) — ローカル実行や貢献
