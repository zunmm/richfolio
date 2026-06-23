import Anthropic from "@anthropic-ai/sdk";
import { formatReasoningContext } from "../state.js";
import type { AIBuyRecommendation, AIProvider, AIProviderInput } from "./types.js";
import { buildObservationPrompt, buildDecisionPrompt, type TickerObservation } from "./prompts.js";

// ── Tool-use JSON schemas ──────────────────────────────────────────
// Anthropic's structured-output pattern is "tool use" — we declare a tool
// whose `input_schema` describes the JSON we want back, force the model to
// call that tool, then read its arguments. JSON Schema is standard and
// portable, unlike Gemini's `Type.OBJECT` constants.

const observationToolSchema = {
  type: "object" as const,
  properties: {
    observations: {
      type: "array",
      description:
        "One entry per ticker shown — both portfolio holdings AND tickers marked [WATCH LIST]. Return entries for ALL tickers even if no signals are present (use empty arrays).",
      items: {
        type: "object",
        properties: {
          ticker: { type: "string" },
          priceLevelSignals: {
            type: "array",
            items: { type: "string" },
            description:
              "Price-level signals present (e.g. 'P/E below historical avg', '52w position < 30%', 'price below 200MA'). Empty array if none.",
          },
          momentumSignals: {
            type: "array",
            items: { type: "string" },
            description:
              "Momentum signals present (e.g. 'RSI < 35', 'bullish MACD crossover', 'Bollinger %B < 0.15', 'Stochastic %K < 20'). Empty array if none.",
          },
          riskFlags: {
            type: "array",
            items: { type: "string" },
            description:
              "Risk flags (e.g. 'overbought RSI > 70', 'near 52w high', 'bearish MACD crossover', 'death cross'). Empty array if none.",
          },
          valueSummary: { type: "string" },
          technicalSummary: { type: "string" },
          newsSentiment: {
            type: "string",
            description: "One of: 'positive', 'negative', 'neutral', 'mixed', 'none'",
          },
          allocationContext: { type: "string" },
        },
        required: [
          "ticker",
          "priceLevelSignals",
          "momentumSignals",
          "riskFlags",
          "valueSummary",
          "technicalSummary",
          "newsSentiment",
          "allocationContext",
        ],
      },
    },
  },
  required: ["observations"],
};

const decisionToolSchema = {
  type: "object" as const,
  properties: {
    recommendations: {
      type: "array",
      description: "One entry per ticker. Sort by confidence descending.",
      items: {
        type: "object",
        properties: {
          ticker: { type: "string" },
          action: {
            type: "string",
            enum: ["STRONG BUY", "BUY", "HOLD", "WAIT"],
          },
          confidence: {
            type: "number",
            description: "0-100",
          },
          reason: { type: "string" },
          suggestedBuyValue: {
            type: "number",
            description:
              "USD amount to invest this time based on the calculated gap amount. 0 if HOLD or WAIT.",
          },
          suggestedLimitPrice: {
            type: "number",
            description:
              "For STRONG BUY and BUY: limit order price below market at nearby support. 0 if HOLD or WAIT.",
          },
          limitPriceReason: { type: "string" },
          valueRating: {
            type: "string",
            description:
              "For US stocks only: A (excellent), B (good), C (fair), D (overvalued). Empty string for ETFs/crypto.",
          },
          bottomSignal: {
            type: "string",
            description:
              "Brief bottom/oversold signal if 3+ indicators are present for stocks/ETFs (or 2+ for crypto). Empty string if not enough indicators.",
          },
        },
        required: [
          "ticker",
          "action",
          "confidence",
          "reason",
          "suggestedBuyValue",
          "suggestedLimitPrice",
          "limitPriceReason",
          "valueRating",
          "bottomSignal",
        ],
      },
    },
  },
  required: ["recommendations"],
};

// ── Helpers ────────────────────────────────────────────────────────
// Default to Sonnet 4.6 — best balance of structured-reasoning quality and
// cost for this workload. Override via env if the user has a different tier
// available or wants to use Haiku for cheaper runs.
const DEFAULT_MODEL = "claude-sonnet-4-6";

interface ClaudeToolCall {
  type: string;
  name?: string;
  input?: unknown;
}

function extractToolInput(
  contentBlocks: Array<ClaudeToolCall | { type: string }>,
  expectedToolName: string,
): unknown {
  for (const block of contentBlocks) {
    if (block.type === "tool_use" && (block as ClaudeToolCall).name === expectedToolName) {
      return (block as ClaudeToolCall).input;
    }
  }
  throw new Error(
    `Claude response missing expected tool_use block for "${expectedToolName}". ` +
      `Got: ${contentBlocks.map((b) => b.type).join(", ")}`,
  );
}

// ── Provider ───────────────────────────────────────────────────────
export class ClaudeProvider implements AIProvider {
  readonly id = "claude";
  readonly label = "Claude";
  readonly shortLabel = "C";

  get available(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async analyze(input: AIProviderInput): Promise<AIBuyRecommendation[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return [];

    const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
    const { report, priceData, news, technicals, macroContext, reasoningHistory } = input;

    console.log(`Running Claude analysis (Stage 1: Observe, ${model})...`);
    // The SDK reads ANTHROPIC_API_KEY from env automatically; passing it
    // explicitly here makes the dependency obvious from the call site.
    const client = new Anthropic({ apiKey });

    const obsPrompt = buildObservationPrompt(report, priceData, news, technicals, macroContext);

    const obsResponse = await client.messages.create({
      model,
      max_tokens: 8192,
      tools: [
        {
          name: "submit_observations",
          description: "Submit structured per-ticker observations.",
          input_schema: observationToolSchema,
        },
      ],
      tool_choice: { type: "tool", name: "submit_observations" },
      messages: [{ role: "user", content: obsPrompt }],
    });

    const obsInput = extractToolInput(obsResponse.content, "submit_observations") as {
      observations: TickerObservation[];
    };
    const observations = obsInput.observations ?? [];

    console.log(`  Stage 1 complete — ${observations.length} observations`);
    for (const obs of observations) {
      const signals = [...obs.priceLevelSignals, ...obs.momentumSignals];
      const flags = obs.riskFlags;
      if (signals.length > 0 || flags.length > 0) {
        console.log(`    ${obs.ticker}: ${signals.length} signals, ${flags.length} flags`);
      }
    }

    console.log(`Running Claude analysis (Stage 2: Decide, ${model})...`);
    const reasoningContext = formatReasoningContext(reasoningHistory, this.id);
    const decPrompt = buildDecisionPrompt(
      observations,
      report,
      macroContext,
      reasoningContext,
      technicals,
      priceData,
    );

    const decResponse = await client.messages.create({
      model,
      max_tokens: 8192,
      tools: [
        {
          name: "submit_recommendations",
          description: "Submit final buy/hold/wait recommendations.",
          input_schema: decisionToolSchema,
        },
      ],
      tool_choice: { type: "tool", name: "submit_recommendations" },
      messages: [{ role: "user", content: decPrompt }],
    });

    const decInput = extractToolInput(decResponse.content, "submit_recommendations") as {
      recommendations: AIBuyRecommendation[];
    };
    return decInput.recommendations ?? [];
  }
}

export const claudeProvider = new ClaudeProvider();
