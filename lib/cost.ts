import type { LLMUsage } from "./llm/provider";

interface ModelRate {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}

const RATES: Record<string, ModelRate> = {
  "claude-haiku-4-5-20251001": { inputUsdPerMTok: 1.0, outputUsdPerMTok: 5.0 },
  "claude-sonnet-4-6-20250115": {
    inputUsdPerMTok: 3.0,
    outputUsdPerMTok: 15.0,
  },
};

const FALLBACK_RATE: ModelRate = {
  inputUsdPerMTok: 5.0,
  outputUsdPerMTok: 25.0,
};

export function usageCostUsd(model: string, usage: LLMUsage): number {
  const rate = RATES[model] ?? FALLBACK_RATE;
  const inputCost = (usage.inputTokens / 1_000_000) * rate.inputUsdPerMTok;
  const outputCost = (usage.outputTokens / 1_000_000) * rate.outputUsdPerMTok;
  return inputCost + outputCost;
}
