---
title: 快速开始
layout: default
nav_order: 3
lang: zh-CN
permalink: /getting-started.html
---

# 快速开始

5 分钟内即可让 Richfolio 跑起来 — 无需编程。

---

## 1. Fork 仓库

[在 GitHub 上 Fork Richfolio](https://github.com/furic/richfolio/fork){: .btn .btn-primary }

这会创建一份属于你自己的副本,你可以在其中配置投资组合,并通过 GitHub Actions 运行自动化的每日简报。

---

## 2. 配置你的投资组合

在 GitHub 中设置目标配置和当前持仓。详细字段参考请见[配置说明](configuration)。

![GitHub Actions 变量](../screenshots/github_actions_variables.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## 3. 添加 API 密钥

将 API 密钥添加为 GitHub Secret。至少需要 `RESEND_API_KEY`。每项服务的分步说明请见 [API 密钥](api-keys)。

![GitHub Actions Secret](../screenshots/github_actions_secrets.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## 4. 部署

启用 GitHub Actions,即可接收自动化的每日简报、盘中提醒和每周报告。设置详情请见[部署](deployment)。

---

## 接下来

- [配置说明](configuration) — 自定义你的投资组合配置
- [API 密钥](api-keys) — 设置 Resend、NewsAPI、Gemini 和 Telegram
- [部署](deployment) — 通过 GitHub Actions 自动化
- [本地开发](local-development) — 本地运行或参与贡献
