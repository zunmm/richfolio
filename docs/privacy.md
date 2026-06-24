---
title: Privacy Policy
layout: default
nav_exclude: true
search_exclude: true
---

# Privacy Policy

**Effective date:** 24 June 2026

Richfolio ("Richfolio", "we", "us") is a free, open-source portfolio-monitoring tool that sends private daily and intraday briefings to its operator and optionally publishes generic market signals to public social pages (X, a Facebook Page, and a LinkedIn Page). This policy explains what data Richfolio handles and how.

Richfolio is a **non-commercial, open-source project** — it is free to use, has no paid tier, runs no advertising, and does not monetise data. Its full source code is public at [github.com/furic/richfolio](https://github.com/furic/richfolio). The project is operated by an individual sole trader (ABN 87 480 911 774).

---

## Summary

- Richfolio is a self-hosted automation. It does **not** run a server, account system, or database that collects data from the public.
- It does **not** collect, store, sell, or share personal data of LinkedIn members, Facebook users, or any other person.
- Social-platform access is used **solely to publish the operator's own posts** to pages the operator controls.
- The only personal data involved is the operator's own configuration and API credentials, which stay in the operator's own environment.

---

## What data Richfolio processes

**Portfolio configuration (operator-provided).** Target allocations, holdings, and watch-list tickers live in the operator's own `config.json` / GitHub Actions configuration. This data never leaves the operator's own infrastructure and is never published — public posts are deliberately generic and exclude any holdings, allocations, gaps, or position sizes.

**Market data (third-party, public).** Prices, fundamentals, technicals, and news headlines are fetched from public financial-data providers to generate analysis.

**API credentials (operator-provided).** Keys and tokens for the services below are supplied by the operator and stored as the operator's own environment variables / repository secrets. They are used only to authenticate requests to those services.

Richfolio collects **no** analytics, cookies, or tracking on this documentation site beyond what GitHub Pages provides for basic hosting and security.

---

## Social media integrations

When the operator enables social posting, Richfolio uses each platform's official API **only to publish posts** and, where required, to confirm the operator's permission to post:

- **LinkedIn** — uses the granted scope (e.g. `w_organization_social` or `w_member_social`) solely to publish posts to a page or profile the operator administers. Richfolio does **not** read, collect, or store LinkedIn members' profiles, connections, or any personal data, and does not use LinkedIn data for advertising or profiling.
- **Facebook** — uses a Page access token (`pages_manage_posts`) solely to publish posts to a Facebook Page the operator administers. No user data is collected.
- **X / Twitter** — uses OAuth tokens solely to publish posts from the operator's own account.

Published posts contain only generic, non-personal information: a ticker symbol, a signal (e.g. STRONG BUY / BUY), a confidence value, and a short rationale. Every post is labelled as automated and "not financial advice".

---

## Third-party services

Richfolio sends requests to the following services; their handling of data is governed by their own privacy policies:

- Yahoo Finance (market data)
- NewsAPI (news headlines)
- Google Gemini and/or Anthropic Claude (AI analysis)
- Resend (email delivery)
- Telegram (messaging)
- X, Facebook, LinkedIn (optional social posting)
- GitHub (source hosting, scheduled execution, and this site via GitHub Pages)

---

## Data retention

Richfolio keeps only a short rolling history (about 7 days) of its own analysis snapshots, stored in the operator's own environment to provide trend context. It retains no third-party personal data.

---

## Your rights

Because Richfolio does not collect personal data from the public, there is no personal data to access, correct, or delete. If you believe a published post contains content that should be removed, contact us (below) and we will address it promptly.

---

## Changes to this policy

We may update this policy as the project evolves. Material changes will be reflected here with an updated effective date.

---

## Contact

Questions about this policy or Richfolio's data handling:

- Open an issue at [github.com/furic/richfolio/issues](https://github.com/furic/richfolio/issues)
- Email: **r.fu@easygo.io**
