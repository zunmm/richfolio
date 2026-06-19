import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Types ───────────────────────────────────────────────────────────
const SUPPORTED_CURRENCIES = new Set([
  "USD",
  "GBP",
  "EUR",
  "AUD",
  "CAD",
  "JPY",
  "CHF",
  "HKD",
  "SGD",
  "NZD",
]);

export interface IntradayAlertConfig {
  enabled: boolean;
  confidenceIncreaseThreshold: number;
  minConfidenceToAlert: number;
  actionUpgradesAlert: boolean;
  onlyAlertForActions: string[];
}

export interface PortfolioConfig {
  targetPortfolio: Record<string, number>;
  currentHoldings: Record<string, number>;
  totalPortfolioValue: number;
  defaultCurrency?: string;
  intradayAlerts?: Partial<IntradayAlertConfig>;
  /**
   * Tickers tracked but NOT in your target portfolio. They get fetched, scored,
   * and surfaced in a "Watch List" section, but are excluded from allocation
   * math, gap-based STRONG BUY criteria, and the max-2 STRONG BUY cap. Use this
   * for tickers you're researching without committing to a target weight.
   */
  watching?: string[];
}

// ── Load config.json ────────────────────────────────────────────────
const configPath = resolve(process.cwd(), "config.json");
let raw: string;
try {
  raw = readFileSync(configPath, "utf-8");
} catch {
  throw new Error(
    `Missing config.json — copy config.example.json to config.json and edit it:\n  cp config.example.json config.json`,
  );
}

const json = JSON.parse(raw) as PortfolioConfig;

export const targetPortfolio = json.targetPortfolio;
export const currentHoldings = json.currentHoldings;
// Validate `watching` is an array of strings if present. Empty/missing is fine.
const rawWatching = (json as unknown as Record<string, unknown>).watching;
if (rawWatching !== undefined && !Array.isArray(rawWatching)) {
  throw new Error('config.json: "watching" must be an array of ticker symbols.');
}
export const watchingTickers: string[] = Array.isArray(rawWatching)
  ? rawWatching.filter((t): t is string => typeof t === "string" && t.length > 0)
  : [];
export const watchingSet = new Set<string>(watchingTickers);
// Migration guard — old field name is no longer accepted
if ((json as unknown as Record<string, unknown>).totalPortfolioValueUSD !== undefined) {
  throw new Error(
    'config.json: "totalPortfolioValueUSD" is deprecated. ' +
      'Rename it to "totalPortfolioValue" and add "defaultCurrency" (e.g. "USD"). ' +
      "See config.example.json.",
  );
}

if (typeof json.totalPortfolioValue !== "number") {
  throw new Error('config.json: "totalPortfolioValue" must be a number.');
}

const rawCurrency = (json as unknown as Record<string, unknown>).defaultCurrency;
if (rawCurrency === undefined) {
  console.warn('config.json: "defaultCurrency" missing — defaulting to "USD".');
} else if (typeof rawCurrency !== "string") {
  throw new Error('config.json: "defaultCurrency" must be a string (e.g. "USD").');
}
const currency = typeof rawCurrency === "string" ? rawCurrency.toUpperCase() : "USD";
if (!SUPPORTED_CURRENCIES.has(currency)) {
  throw new Error(
    `config.json: "defaultCurrency": "${currency}" is not supported. ` +
      `Supported: ${Array.from(SUPPORTED_CURRENCIES).join(", ")}.`,
  );
}

export const totalPortfolioValue = json.totalPortfolioValue;
export const defaultCurrency = currency;

// ── Intraday alert config with defaults ─────────────────────────────
const DEFAULT_INTRADAY: IntradayAlertConfig = {
  enabled: true,
  confidenceIncreaseThreshold: 10,
  minConfidenceToAlert: 80,
  actionUpgradesAlert: true,
  onlyAlertForActions: ["STRONG BUY", "BUY"],
};

export const intradayConfig: IntradayAlertConfig = {
  ...DEFAULT_INTRADAY,
  ...json.intradayAlerts,
};

// ── Environment-only settings ───────────────────────────────────────
export const recipientEmail = process.env.RECIPIENT_EMAIL || "you@example.com";

// ── Ticker mapping ──────────────────────────────────────────────────
// Yahoo Finance requires specific ticker formats for crypto
const tickerMap: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
};

/** Convert a config ticker to its Yahoo Finance symbol */
export function toYahooTicker(ticker: string): string {
  return tickerMap[ticker] || ticker;
}

/** Convert a Yahoo Finance symbol back to the config ticker */
export function fromYahooTicker(yahooTicker: string): string {
  for (const [key, value] of Object.entries(tickerMap)) {
    if (value === yahooTicker) return key;
  }
  return yahooTicker;
}

/** Get all unique tickers from target, current holdings, AND watching list. */
export function allUniqueTickers(): string[] {
  return [
    ...new Set([
      ...Object.keys(targetPortfolio),
      ...Object.keys(currentHoldings),
      ...watchingTickers,
    ]),
  ];
}
