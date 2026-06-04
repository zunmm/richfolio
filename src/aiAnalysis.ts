// ── Backward-compat shim ───────────────────────────────────────────
// The bulk of this module moved to src/providers/ (Gemini provider,
// shared prompts, AIProvider interface) and src/aiOrchestrator.ts in
// the multi-AI refactor. The old top-level `aiAnalyze()` function and
// `AIBuyRecommendation` type are re-exported from here unchanged so
// every existing consumer keeps working without import-path churn.

import type { AllocationReport } from "./analyze.js";
import type { QuoteData } from "./fetchPrices.js";
import type { NewsItem } from "./fetchNews.js";
import type { TechnicalData } from "./fetchTechnicals.js";
import type { ReasoningHistory } from "./state.js";
import type { AIBuyRecommendation as _AIBuyRecommendation } from "./providers/types.js";
import { runAIAnalysis } from "./aiOrchestrator.js";

export type AIBuyRecommendation = _AIBuyRecommendation;

export async function aiAnalyze(
  report: AllocationReport,
  priceData: Record<string, QuoteData>,
  news: Record<string, NewsItem[]>,
  technicals: Record<string, TechnicalData> = {},
  macroContext: string = "",
  reasoningHistory: ReasoningHistory = { snapshots: {} },
): Promise<AIBuyRecommendation[]> {
  return runAIAnalysis({
    report,
    priceData,
    news,
    technicals,
    macroContext,
    reasoningHistory,
  });
}
