import { defaultDailyCap } from "@/lib/daily-cap";
import { isKilled } from "@/lib/kill-switch";
import { buildAnthropicProvider } from "@/lib/llm/anthropic";
import { loadSystemPromptV1 } from "@/lib/llm/prompt";
import type { LLMProvider } from "@/lib/llm/provider";
import { handleGenerate } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RATE_LIMIT_PER_MIN = 5;

let cachedProvider: LLMProvider | null = null;

function getProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fail loud at first request so it surfaces in logs without crashing build.
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  cachedProvider = buildAnthropicProvider({
    apiKey,
    systemPrompt: loadSystemPromptV1(),
    model: process.env.ANTHROPIC_MODEL,
  });
  return cachedProvider;
}

function getRateLimitPerMin(): number {
  const raw = process.env.RATE_LIMIT_PER_MIN;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_RATE_LIMIT_PER_MIN;
}

export async function POST(request: Request): Promise<Response> {
  return handleGenerate(request, {
    provider: getProvider(),
    cap: defaultDailyCap(),
    rateLimitPerMin: getRateLimitPerMin(),
    isKilled: () => isKilled(),
  });
}
