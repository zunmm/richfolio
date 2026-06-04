import type { AllocationReport } from "../analyze.js";
import type { QuoteData } from "../fetchPrices.js";
import type { NewsItem } from "../fetchNews.js";
import type { TechnicalData } from "../fetchTechnicals.js";
import type { ReasoningHistory } from "../state.js";

// ── Recommendation shape (canonical home) ──────────────────────────
// Lives here so multiple providers can produce values of this type. The
// existing `src/aiAnalysis.ts` re-exports this for backward compat — all
// pre-existing `import type { AIBuyRecommendation } from "./aiAnalysis.js"`
// imports keep working unchanged.
export interface AIBuyRecommendation {
  ticker: string;
  tickerFullName: string | null;
  originalCurrency: string;
  action: string;
  confidence: number;
  reason: string;
  suggestedBuyValue: number;
  suggestedLimitPrice?: number;
  limitPriceReason?: string;
  valueRating?: string;
  bottomSignal?: string;
  analysisUrl?: string;
}

// ── Provider input bundle ──────────────────────────────────────────
// Single struct passed to every provider's `analyze()` call. Adding a
// new field here is a non-breaking change for downstream providers.
export interface AIProviderInput {
  report: AllocationReport;
  priceData: Record<string, QuoteData>;
  news: Record<string, NewsItem[]>;
  technicals: Record<string, TechnicalData>;
  macroContext: string;
  reasoningHistory: ReasoningHistory;
}

// ── Provider interface ─────────────────────────────────────────────
// Each AI backend (Gemini, Claude, OpenAI, ...) implements this. Providers
// own their internal staging (single-call vs Two-stage Think/Plan) and
// return a normalised list of recommendations. They do NOT run guards —
// the orchestrator runs the shared guard pipeline after each provider
// returns, so guard logic stays provider-agnostic.
export interface AIProvider {
  /** Stable identifier — env keys, storage keys, telemetry, display IDs. */
  readonly id: string;
  /** Human-friendly label for email/Telegram. */
  readonly label: string;
  /** Compact label for tight UI surfaces (Telegram badges). 1–3 chars. */
  readonly shortLabel: string;
  /** Whether this provider is configured (e.g. API key present). */
  readonly available: boolean;

  analyze(input: AIProviderInput): Promise<AIBuyRecommendation[]>;
}
