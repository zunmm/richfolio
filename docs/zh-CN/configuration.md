---
title: 配置说明
layout: default
nav_order: 4
lang: zh-CN
permalink: /configuration.html
---

# 配置说明

Richfolio 用一个 JSON 配置承载所有投资组合数据 — 你的组合信息保持私有。

---

## 设置步骤

进入你 Fork 的仓库 Settings → Secrets and variables → Actions → **Variables** 标签页 → 创建一个名为 `CONFIG_JSON` 的变量,内容为下方的 JSON。

## 示例

```json
{
  "targetPortfolio": {
    "VOO": 20,
    "QQQ": 15,
    "GLD": 10,
    "BSV": 20,
    "SMH": 5,
    "BTC": 1.5
  },
  "currentHoldings": {
    "AAPL": 30,
    "VOO": 1,
    "BTC": 0.0002
  },
  "totalPortfolioValueUSD": 50000,
  "intradayAlerts": {
    "enabled": true,
    "confidenceIncreaseThreshold": 10
  }
}
```

---

## 字段参考

| 字段 | 必填 | 描述 |
|------|------|------|
| `targetPortfolio` | 是 | 目标配置百分比。键为股票代码,值为百分比,总和应约为 100%。 |
| `currentHoldings` | 是 | 你当前持有的股数。可以包含不在目标组合中的股票(例如 AAPL 用于 ETF 重叠检测)。 |
| `totalPortfolioValueUSD` | 是 | 你估计的投资组合总价值(美元)。当实际持仓小于目标时,用于配置计算。 |
| `intradayAlerts` | 否 | 盘中提醒设置(见下文)。省略时使用默认值。 |

---

## 盘中提醒

`intradayAlerts` 段控制盘中检查何时发送提醒。所有字段都可选 — 有合理的默认值。

提醒只会因 STRONG BUY 相关的变化而触发:
1. **升级为 STRONG BUY** — 其它级别 → STRONG BUY
2. **从 STRONG BUY 降级** — STRONG BUY → 其它级别
3. **置信度变化** — 保持 STRONG BUY 的同时置信度变化 ≥ 阈值

| 字段 | 默认值 | 描述 |
|------|--------|------|
| `enabled` | `true` | 总开关。设为 `false` 可完全禁用盘中提醒。 |
| `confidenceIncreaseThreshold` | `10` | 触发 STRONG BUY 股票提醒所需的最小置信度变化(绝对值,百分点)。 |

---

## 刷新分析

用最新价格(含盘后/盘前)重新分析单个股票代码。发送邮件 + Telegram,并附上新的分析 URL。

Actions → Portfolio Monitor → **Run workflow** → mode: `refresh`、ticker: `SMH`。

可用时会使用 Yahoo Finance 的 `postMarketPrice` 和 `preMarketPrice`。如果盘后数据不可用,会回退到正常市价。

---

## 股票代码格式

| 类型 | 格式 | 示例 |
|------|------|------|
| 美股/ETF | 标准代码 | `AAPL`、`VOO`、`QQQ`、`SMH` |
| 加密货币 | 简称 | `BTC`、`ETH`(自动转为 `BTC-USD`、`ETH-USD`) |
| 国际市场 | Yahoo Finance 代码 | `0700.HK`(腾讯)、`TM`(丰田) |

---

## 小贴士

- **目标百分比**总和应为 100%。若不为 100%,配置缺口计算仍然有效,但建议买入金额可能偏大或偏小。

- **目标之外的持仓**会用于 ETF 重叠检测。例如,持有 AAPL 会降低包含 AAPL 的 ETF(如 VOO 或 QQQ)的买入优先级。

- **支持小数股** — 对加密货币(`"BTC": 0.000188`)或支持小数股交易的券商很有用。

- **投资组合估值**取实际持仓价值与配置估值中的较大者。即使你的当前持仓还小于目标配置,缺口计算依然有意义。

<details>
<summary><strong>最多能添加多少个股票代码?</strong></summary>

<br>

Richfolio 在聚焦的投资组合中表现最好。虽然没有硬编码上限,但免费版 API 配额和简报的可读性给出了实际边界。

**推荐范围:**

| 数量 | 评价 |
|------|------|
| **10-20** | 最佳区间 — 聚焦、可执行、所有免费额度都宽裕 |
| **20-30** | 仍然不错 — 简报可读,额度仍有余 |
| **30-50** | 技术上可行,但每日简报会显得杂乱 |
| **50+** | 不推荐(见下) |

**为什么 50+ 不推荐:**

- **NewsAPI(每日 100 次)** — 新闻按每 5 个代码一批获取。在 50 个代码下,daily + intraday 大约用掉 22 次;100 个代码约为 42 次,留给刷新的余量很少。
- **AI 分析质量** — 一次评估太多选项时,Gemini 的建议会变得稀释。
- **简报可读性** — 邮件会变长,Telegram 会在 4,096 字符处截断。信噪比急剧下降。
- **执行时间** — 每个代码都需要 Yahoo Finance 调用获取价格、技术指标和基本面,会拖慢 GitHub Actions 运行。

Gemini 免费层(每日 250 次请求、每分钟 25 万 token)很慷慨,基本不会成为瓶颈 — 即使 100 个代码,每次运行也只需 ~5.3 万 token。真正的限制是 NewsAPI 额度和信息过载。

**结论 — 为获得最佳免费体验,建议控制在 30 个代码以内。**

</details>

---

## 更新配置

当持仓变化时,在 GitHub 上用新的 JSON 内容更新 `CONFIG_JSON` 变量(Settings → Secrets and variables → Actions → Variables 标签页)。
