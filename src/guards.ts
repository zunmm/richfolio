import type { AIBuyRecommendation } from "./aiAnalysis.js";
import type { QuoteData } from "./fetchPrices.js";
import type { TechnicalData } from "./fetchTechnicals.js";
import type { AllocationReport } from "./analyze.js";

// Short-duration bond ETFs — duplicated from aiAnalysis.ts for guard independence
const SHORT_DURATION_BOND_ETFS = new Set([
  "BSV",
  "SHY",
  "VGSH",
  "SCHO",
  "BIL",
  "SHV",
  "CLTL",
  "SGOV",
  "VCSH",
  "USIG",
]);

// Apply a downgrade in a consistent way: rewrite action, soften phrases in the
// AI's original reason that would contradict the new (lower) action, and prepend
// a clear marker explaining why the guard pipeline overrode the model's call.
//
// This exists because LLMs (Claude especially, anchored on multi-day conviction
// from the reasoning history) routinely return STRONG BUY with a self-contradictory
// reason — e.g. "MSFT meets all STRONG BUY criteria... Allocation gap of 1%
// is small". The guard pipeline correctly downgrades the action, but leaving
// the original reason text in place produces a brief that says BUY in the
// badge and "STRONG BUY criteria met" in the description. This helper makes
// the displayed text coherent with the final action.
function applyDowngrade(rec: AIBuyRecommendation, newAction: string, note: string): void {
  rec.action = newAction;
  // Strip phrases that would now contradict the downgraded action. Soft rewrite —
  // preserves the AI's actual reasoning for transparency.
  const softened = rec.reason
    .replace(/meets? all STRONG BUY criteria/gi, "shows a strong setup")
    .replace(
      /satisf(?:y|ies|ied|ying)\s+(?:the\s+)?STRONG BUY\s+(?:criteria|gate)/gi,
      "passes the strong setup checks",
    )
    .replace(/STRONG BUY criteria (?:are|is) met/gi, "strong setup is present")
    .replace(/qualif(?:y|ies|ied|ying) (?:as|for) (?:a )?STRONG BUY/gi, "qualifies as a BUY");
  rec.reason = `[Guard: ${note}] ${softened}`;
}

/**
 * Post-AI validation pipeline. Runs sequential guards to catch common AI mistakes
 * before recommendations reach the user. Inspired by OpenAlice's guard pipeline.
 *
 * Each guard is independent and modifies recommendations in place.
 */
export function validateRecommendations(
  recs: AIBuyRecommendation[],
  priceData: Record<string, QuoteData>,
  technicals: Record<string, TechnicalData>,
  report: AllocationReport,
): void {
  guardOverweightHold(recs, report);
  guardBondETFCap(recs, report);
  guardEarningsProximity(recs, priceData);
  guardStrongBuyCriteria(recs, report, technicals);
  guardMaxStrongBuy(recs);
  guardConfidenceSanity(recs);
  guardBuyValueSanity(recs, report);
}

// ── Guard 0: Overweight positions must HOLD ─────────────────────────
// The decision prompt says "Only recommend tickers with allocation need
// (gap > 0%)" but Claude in particular has been observed violating this —
// anchoring on multi-day reasoning-history conviction and producing BUY
// recommendations on already-overweight tickers. Programmatic enforcement
// here makes the rule binding regardless of which provider returned it.
//
// Threshold is `gap <= 0` (strictly at/over target). A position at exactly
// the target doesn't warrant adding; only underweight positions do.
function guardOverweightHold(recs: AIBuyRecommendation[], report: AllocationReport): void {
  const gapMap: Record<string, number> = {};
  for (const item of report.items) {
    gapMap[item.ticker] = item.gapPct;
  }

  for (const rec of recs) {
    // Watch tickers have no allocation target — skip the overweight check.
    if (rec.isWatching) continue;
    if (rec.action !== "BUY" && rec.action !== "STRONG BUY") continue;
    const gap = gapMap[rec.ticker];
    if (gap == null) continue;
    if (gap <= 0) {
      console.log(
        `  [guard:overweight] ${rec.ticker}: gap ${gap.toFixed(1)}% (at/over target) → HOLD`,
      );
      applyDowngrade(rec, "HOLD", `at/over target (gap ${gap.toFixed(1)}%)`);
      rec.suggestedBuyValue = 0;
      if (rec.suggestedLimitPrice) {
        rec.suggestedLimitPrice = 0;
        rec.limitPriceReason = "";
      }
    }
  }
}

// ── Guard 1: Bond ETF cap ──────────────────────────────────────────
// Short-duration bonds (BSV, SHY, ...) can never be STRONG BUY — they have no
// meaningful capital-appreciation upside. They also can't carry a limit price:
// daily price range is so tight that "limit at 50MA support" is noise.
//
// Confidence is NOT gap-capped here anymore. Framework 12a in aiAnalysis.ts
// drives confidence via timing modifiers (90d percentile, 10Y rate change,
// distribution yield) so BSV reflects whether today is actually a good entry.
// Absolute ceiling of 95 matches the equity confidence cap in
// guardConfidenceSanity — STRONG BUY/BUY tier ordering keeps BSV from
// crowding genuine equity STRONG BUYs visually, so the cap can be permissive.
function guardBondETFCap(recs: AIBuyRecommendation[], report?: AllocationReport): void {
  const gapMap: Record<string, number> = {};
  if (report) {
    for (const item of report.items) {
      gapMap[item.ticker] = item.gapPct;
    }
  }

  for (const rec of recs) {
    if (!SHORT_DURATION_BOND_ETFS.has(rec.ticker.toUpperCase())) continue;

    // Never STRONG BUY short-duration bonds
    if (rec.action === "STRONG BUY") {
      console.log(`  [guard:bond] ${rec.ticker}: short-duration bond ETF → capping at BUY`);
      applyDowngrade(
        rec,
        "BUY",
        "short-duration bond ETF capped at BUY (no upside for STRONG BUY)",
      );
    }

    // Strip limit-price suggestion — meaningless on a low-volatility instrument
    if (rec.suggestedLimitPrice && rec.suggestedLimitPrice > 0) {
      console.log(`  [guard:bond] ${rec.ticker}: stripping limit price (short-duration bond)`);
      rec.suggestedLimitPrice = 0;
      rec.limitPriceReason = "";
    }

    // Absolute confidence ceiling (safety net for AI overshoot)
    if (rec.confidence > 95) {
      rec.confidence = 95;
    }

    // If gap < 1%, position is essentially on target — downgrade to HOLD
    const gap = gapMap[rec.ticker] ?? 0;
    if (gap < 1 && rec.action === "BUY") {
      applyDowngrade(rec, "HOLD", `bond ETF essentially at target (gap ${gap.toFixed(1)}%)`);
      rec.suggestedBuyValue = 0;
    }
  }
}

// ── Guard 2: Earnings proximity ────────────────────────────────────
function guardEarningsProximity(
  recs: AIBuyRecommendation[],
  priceData: Record<string, QuoteData>,
): void {
  for (const rec of recs) {
    const quote = priceData[rec.ticker];
    if (quote?.daysToEarnings == null) continue;

    if (quote.daysToEarnings <= 3 && rec.action !== "HOLD" && rec.action !== "WAIT") {
      console.log(`  [guard:earnings] ${rec.ticker}: earnings in ${quote.daysToEarnings}d → HOLD`);
      applyDowngrade(rec, "HOLD", `earnings in ${quote.daysToEarnings} days — too risky for buy`);
      rec.suggestedBuyValue = 0;
      rec.suggestedLimitPrice = 0;
      rec.limitPriceReason = "";
    } else if (quote.daysToEarnings <= 7 && rec.action === "STRONG BUY") {
      console.log(`  [guard:earnings] ${rec.ticker}: earnings in ${quote.daysToEarnings}d → BUY`);
      applyDowngrade(rec, "BUY", `earnings in ${quote.daysToEarnings} days — capped at BUY`);
    }
  }
}

// ── Guard 3: STRONG BUY criteria enforcement ───────────────────────
function guardStrongBuyCriteria(
  recs: AIBuyRecommendation[],
  report: AllocationReport,
  technicals: Record<string, TechnicalData>,
): void {
  const gapMap: Record<string, number> = {};
  for (const item of report.items) {
    gapMap[item.ticker] = item.gapPct;
  }

  for (const rec of recs) {
    if (rec.action !== "STRONG BUY") continue;
    // Watch tickers use the WATCH LIST CRITERIA in the prompt — they don't have
    // an allocation gap, so the gap ≥ 2% threshold doesn't apply. Confidence
    // and signal-presence checks below still bind, so watch STRONG BUYs are
    // still vetted (just not on allocation grounds).
    if (rec.isWatching) {
      // Still enforce confidence ≥ 80% and signal presence; just skip gap.
      if (rec.confidence < 80) {
        console.log(
          `  [guard:criteria] ${rec.ticker} (watch): confidence ${rec.confidence}% < 80% → BUY`,
        );
        applyDowngrade(
          rec,
          "BUY",
          `watch list: confidence ${rec.confidence}% < 80% STRONG BUY threshold`,
        );
      }
      continue;
    }

    const gap = gapMap[rec.ticker] ?? 0;
    const tech = technicals[rec.ticker];

    // Check gap >= 2%
    if (gap < 2) {
      console.log(`  [guard:criteria] ${rec.ticker}: gap ${gap.toFixed(1)}% < 2% → BUY`);
      applyDowngrade(rec, "BUY", `gap ${gap.toFixed(1)}% < 2% STRONG BUY threshold`);
      continue;
    }

    // Check confidence >= 80%
    if (rec.confidence < 80) {
      console.log(`  [guard:criteria] ${rec.ticker}: confidence ${rec.confidence}% < 80% → BUY`);
      applyDowngrade(rec, "BUY", `confidence ${rec.confidence}% < 80% STRONG BUY threshold`);
      continue;
    }

    // Soft check for signal presence — the AI already applies strict criteria,
    // this guard only catches obvious misses (no signals at all).
    // We can't perfectly verify P/E signals here without avgPE data.
    if (tech) {
      const priceBelow200MA =
        tech.sma200 != null && tech.priceVsSma200 != null && tech.priceVsSma200 < 0;
      const hasAnyMomentum =
        tech.rsi14 < 35 ||
        tech.macdCrossover === "bullish" ||
        (tech.bollPercentB != null && tech.bollPercentB < 0.15) ||
        (tech.stochK != null && tech.stochK < 20);
      // Only downgrade if there are truly NO signals at all
      if (!priceBelow200MA && !hasAnyMomentum) {
        console.log(`  [guard:criteria] ${rec.ticker}: no price-level or momentum signals → BUY`);
        applyDowngrade(rec, "BUY", "no price-level or momentum signals present");
      }
    }
  }
}

// ── Guard 4: Max 2 STRONG BUY ──────────────────────────────────────
// Cap applies only to PORTFOLIO STRONG BUYs — watch-list STRONG BUYs are
// research signals, not capital-deployment decisions, so they don't compete
// for the same quota. Surface every qualifying watch STRONG BUY.
function guardMaxStrongBuy(recs: AIBuyRecommendation[]): void {
  const strongBuys = recs
    .filter((r) => r.action === "STRONG BUY" && !r.isWatching)
    .sort((a, b) => b.confidence - a.confidence);

  if (strongBuys.length > 2) {
    for (const rec of strongBuys.slice(2)) {
      console.log(`  [guard:max2] ${rec.ticker}: >2 STRONG BUYs → BUY`);
      applyDowngrade(rec, "BUY", "max 2 STRONG BUY cap — outside top 2 by conviction");
    }
  }
}

// ── Guard 5: Confidence sanity ─────────────────────────────────────
function guardConfidenceSanity(recs: AIBuyRecommendation[]): void {
  for (const rec of recs) {
    if (rec.confidence > 95) {
      rec.confidence = 95;
    }
    if ((rec.action === "HOLD" || rec.action === "WAIT") && rec.confidence > 70) {
      console.log(
        `  [guard:sanity] ${rec.ticker}: ${rec.action} with ${rec.confidence}% → capping at 70%`,
      );
      rec.confidence = 70;
    }
  }
}

// ── Guard 6: Buy value sanity ──────────────────────────────────────
function guardBuyValueSanity(recs: AIBuyRecommendation[], report: AllocationReport): void {
  const gapValueMap: Record<string, number> = {};
  for (const item of report.items) {
    gapValueMap[item.ticker] = item.suggestedBuyValue;
  }

  for (const rec of recs) {
    if (rec.action === "HOLD" || rec.action === "WAIT") {
      if (rec.suggestedBuyValue > 0) {
        rec.suggestedBuyValue = 0;
      }
      if (rec.suggestedLimitPrice && rec.suggestedLimitPrice > 0) {
        rec.suggestedLimitPrice = 0;
        rec.limitPriceReason = "";
      }
      continue;
    }

    // Watch tickers have no allocation gap to anchor a buy size — user sizes
    // manually. Force suggestedBuyValue to 0 regardless of what the AI returned.
    if (rec.isWatching) {
      if (rec.suggestedBuyValue > 0) {
        rec.suggestedBuyValue = 0;
      }
      continue;
    }

    const maxGap = gapValueMap[rec.ticker] ?? 0;
    if (maxGap > 0 && rec.suggestedBuyValue > maxGap * 1.1) {
      console.log(
        `  [guard:value] ${rec.ticker}: suggestedBuyValue $${rec.suggestedBuyValue.toFixed(0)} > gap $${maxGap.toFixed(0)} → capping`,
      );
      rec.suggestedBuyValue = maxGap;
    }
  }
}
