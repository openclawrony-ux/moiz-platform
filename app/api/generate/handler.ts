import { usageCostUsd } from "@/lib/cost";
import { type DailyCap } from "@/lib/daily-cap";
import type { LLMProvider } from "@/lib/llm/provider";
import { SYSTEM_PROMPT_VERSION } from "@/lib/llm/prompt";
import { logError, logEvent } from "@/lib/log";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";

const MAX_INPUT_BYTES = 8192;
const RETRY_HINT =
  "IMPORTANT: Return JSON only. No prose. No code fences. No explanation. Output exactly one JSON object matching the schema.";

export interface HandlerDeps {
  provider: LLMProvider;
  cap: DailyCap;
  rateLimitPerMin: number;
  isKilled: () => boolean;
  rateLimitStore?: Map<string, number[]>;
}

interface PrdShape {
  problem: string;
  target_user: string;
  user_stories: string[];
  non_goals: string[];
  success_metric: string;
}

interface ValidPrd {
  ok: true;
  prd: PrdShape;
}

interface InvalidPrd {
  ok: false;
  reason: string;
}

function validatePrd(parsed: unknown): ValidPrd | InvalidPrd {
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, reason: "not_object" };
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.problem !== "string" || obj.problem.trim() === "") {
    return { ok: false, reason: "problem" };
  }
  if (typeof obj.target_user !== "string" || obj.target_user.trim() === "") {
    return { ok: false, reason: "target_user" };
  }
  if (
    !Array.isArray(obj.user_stories) ||
    obj.user_stories.length === 0 ||
    !obj.user_stories.every((s) => typeof s === "string")
  ) {
    return { ok: false, reason: "user_stories" };
  }
  if (
    !Array.isArray(obj.non_goals) ||
    !obj.non_goals.every((s) => typeof s === "string")
  ) {
    return { ok: false, reason: "non_goals" };
  }
  if (
    typeof obj.success_metric !== "string" ||
    obj.success_metric.trim() === ""
  ) {
    return { ok: false, reason: "success_metric" };
  }
  return {
    ok: true,
    prd: {
      problem: obj.problem,
      target_user: obj.target_user,
      user_stories: obj.user_stories as string[],
      non_goals: obj.non_goals as string[],
      success_metric: obj.success_metric,
    },
  };
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
}

export async function handleGenerate(
  request: Request,
  deps: HandlerDeps,
): Promise<Response> {
  const start = Date.now();

  if (deps.isKilled()) {
    logEvent("generate.killed", { duration_ms: Date.now() - start });
    return jsonResponse(503, { killed: true });
  }

  const ipHash = hashIp(request.headers.get("x-forwarded-for"));
  const limit = checkRateLimit(ipHash, {
    perMinute: deps.rateLimitPerMin,
    store: deps.rateLimitStore,
  });
  if (!limit.allowed) {
    logEvent("generate.rate_limited", { duration_ms: Date.now() - start });
    return jsonResponse(
      429,
      {
        error: "rate_limited",
        retry_after_seconds: limit.retryAfterSeconds,
      },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  if (!deps.cap.hasBudget()) {
    logEvent("generate.cap_hit", { duration_ms: Date.now() - start });
    return jsonResponse(503, { killed: true, reason: "daily_cap" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { input?: unknown }).input !== "string"
  ) {
    return jsonResponse(400, { error: "input_required" });
  }

  const rawInput = (body as { input: string }).input;
  if (rawInput.trim() === "") {
    return jsonResponse(400, { error: "input_required" });
  }
  if (Buffer.byteLength(rawInput, "utf8") > MAX_INPUT_BYTES) {
    return jsonResponse(400, {
      error: "input_too_large",
      max_bytes: MAX_INPUT_BYTES,
    });
  }

  // Turnstile is accepted in the body but verified in a sibling issue.

  const inputs = [
    { rawNotes: rawInput },
    { rawNotes: `${rawInput}\n\n${RETRY_HINT}` },
  ];

  let lastReason = "";
  for (let attempt = 1; attempt <= inputs.length; attempt++) {
    const provInput = inputs[attempt - 1];
    let llmOutput;
    try {
      llmOutput = await deps.provider.generate(provInput);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      logError("generate.error", {
        class: "llm_error",
        attempt,
        duration_ms: Date.now() - start,
        message: message.slice(0, 120),
      });
      return jsonResponse(502, { error: "upstream_error" });
    }

    const cost = usageCostUsd(llmOutput.model, llmOutput.usage);
    deps.cap.add(cost);

    let parsed: unknown;
    try {
      parsed = JSON.parse(llmOutput.spec);
    } catch {
      lastReason = "parse";
      if (attempt < inputs.length) continue;
      logError("generate.error", {
        class: "parse_error",
        attempt,
        duration_ms: Date.now() - start,
      });
      return jsonResponse(502, { error: "parse_error" });
    }

    const valid = validatePrd(parsed);
    if (!valid.ok) {
      lastReason = valid.reason;
      if (attempt < inputs.length) continue;
      logError("generate.error", {
        class: "shape_error",
        reason: valid.reason,
        attempt,
        duration_ms: Date.now() - start,
      });
      return jsonResponse(502, { error: "shape_error" });
    }

    logEvent("generate.success", {
      duration_ms: Date.now() - start,
      input_tokens: llmOutput.usage.inputTokens,
      output_tokens: llmOutput.usage.outputTokens,
      cost_usd: cost.toFixed(6),
      model: llmOutput.model,
      attempts: attempt,
    });

    return jsonResponse(200, {
      problem: valid.prd.problem,
      target_user: valid.prd.target_user,
      user_stories: valid.prd.user_stories,
      non_goals: valid.prd.non_goals,
      success_metric: valid.prd.success_metric,
      model: llmOutput.model,
      version: SYSTEM_PROMPT_VERSION,
    });
  }

  // Defensive: the loop above always returns. Keep TypeScript happy.
  logError("generate.error", { class: "unreachable", reason: lastReason });
  return jsonResponse(502, { error: "unreachable" });
}
