import { validateRecommendations } from "./guards.js";
import { defaultCurrency } from "./config.js";
import { buildActiveProviders } from "./providers/index.js";
import type { AIBuyRecommendation, AIProvider, AIProviderInput } from "./providers/types.js";

// ── Action-tier sort ───────────────────────────────────────────────
// Used by Phase 1's single-provider output and Phase 3's aggregated output.
// STRONG BUY > BUY > HOLD > WAIT, with confidence-descending within each tier.
const ACTION_PRIORITY: Record<string, number> = {
  "STRONG BUY": 0,
  BUY: 1,
  HOLD: 2,
  WAIT: 3,
};

function sortByActionTier(recs: AIBuyRecommendation[]): void {
  recs.sort((a, b) => {
    const pa = ACTION_PRIORITY[a.action] ?? 99;
    const pb = ACTION_PRIORITY[b.action] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.confidence - a.confidence;
  });
}

// ── Per-provider attribution + guards ──────────────────────────────
// Runs one provider end-to-end: SDK call → attach metadata from price data
// → guard pipeline. Returns the cleaned, validated rec list. Guard mutations
// happen here (per provider) so each provider gets equal treatment.
async function runProvider(
  provider: AIProvider,
  input: AIProviderInput,
): Promise<AIBuyRecommendation[]> {
  const recommendations = await provider.analyze(input);

  // Attach tickerFullName + originalCurrency (deterministic; not model-supplied).
  const longNameMap = new Map(
    Object.values(input.priceData).map((q) => [q.ticker, q.longName ?? null]),
  );
  const currencyMap = new Map(
    Object.values(input.priceData).map((q) => [q.ticker, q.originalCurrency]),
  );
  for (const rec of recommendations) {
    rec.tickerFullName = longNameMap.get(rec.ticker) ?? null;
    rec.originalCurrency = currencyMap.get(rec.ticker) ?? defaultCurrency;
  }

  // Guard pipeline (bond ETF caps, earnings proximity, STRONG BUY criteria, etc.).
  validateRecommendations(recommendations, input.priceData, input.technicals, input.report);

  return recommendations;
}

// ── Phase 1 entry point ────────────────────────────────────────────
// Runs all active providers. Today only Gemini will be active in production;
// Phase 2 adds Claude and Phase 3 makes this return aggregated multi-provider
// shape. For now it returns the single provider's recommendations directly so
// downstream consumers see no shape change.
//
// If multiple providers happen to be active in Phase 1 (e.g. someone exports
// an unreleased Claude provider for testing), we log a warning and use the
// first available one — keeping behaviour stable until Phase 3 lands.
export async function runAIAnalysis(
  input: AIProviderInput,
): Promise<AIBuyRecommendation[]> {
  const providers = buildActiveProviders();

  if (providers.length === 0) {
    console.warn("No AI provider configured (no GEMINI_API_KEY etc.) — skipping AI analysis\n");
    return [];
  }

  if (providers.length > 1) {
    console.warn(
      `Multiple AI providers active (${providers.map((p) => p.id).join(", ")}) — ` +
        `Phase 1 uses only the first (${providers[0].id}). Multi-AI aggregation lands in Phase 3.`,
    );
  }

  const provider = providers[0];

  try {
    const recommendations = await runProvider(provider, input);
    sortByActionTier(recommendations);

    for (const rec of recommendations) {
      if (rec.action === "STRONG BUY" || rec.action === "BUY") {
        console.log(
          `  ${rec.action} ${rec.ticker} (${rec.confidence}%)` +
            (rec.valueRating ? ` [${rec.valueRating}]` : "") +
            (rec.bottomSignal ? ` [${rec.bottomSignal}]` : "") +
            ` — ${rec.reason}` +
            (rec.suggestedLimitPrice
              ? ` [limit: ${rec.suggestedLimitPrice} ${rec.originalCurrency}]`
              : ""),
        );
      }
    }
    console.log(
      `AI analysis complete (${provider.label}) — ${recommendations.length} tickers scored\n`,
    );

    return recommendations;
  } catch (err) {
    console.error(`AI analysis failed (${provider.label}):`, (err as Error).message);
    console.log("Falling back to gap-based recommendations\n");
    return [];
  }
}
