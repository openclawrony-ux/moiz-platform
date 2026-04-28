import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDailyCap } from "@/lib/daily-cap";
import type { LLMGenerateOutput, LLMProvider } from "@/lib/llm/provider";
import { handleGenerate, type HandlerDeps } from "./handler";

interface ProviderStub extends LLMProvider {
  calls: Array<{ rawNotes: string }>;
}

function buildProvider(
  responses: Array<LLMGenerateOutput | (() => never)>,
): ProviderStub {
  let i = 0;
  const calls: ProviderStub["calls"] = [];
  return {
    name: "stub",
    model: "stub-model",
    calls,
    async generate(input) {
      calls.push({ rawNotes: input.rawNotes });
      const next = responses[i++];
      if (next === undefined) {
        throw new Error("provider stub: no more responses configured");
      }
      if (typeof next === "function") {
        next();
      }
      return next as LLMGenerateOutput;
    },
  };
}

const VALID_PRD = {
  problem: "Engineering teams ship vague tickets.",
  target_user: "Lead engineer at an early-stage startup.",
  user_stories: [
    "As a lead engineer, I want to paste rough notes, so that I get a tight spec.",
  ],
  non_goals: ["Team collaboration features."],
  success_metric: "≥ 1 spec generated end-to-end in under 5 minutes.",
};

function validOutput(): LLMGenerateOutput {
  return {
    spec: JSON.stringify(VALID_PRD),
    model: "claude-haiku-4-5-20251001",
    usage: { inputTokens: 200, outputTokens: 400 },
  };
}

function makeDeps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    provider: buildProvider([validOutput()]),
    cap: createDailyCap({ capUsd: 1.5 }),
    rateLimitPerMin: 5,
    isKilled: () => false,
    rateLimitStore: new Map(),
    ...overrides,
  };
}

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.5",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stdoutLines(): string {
  return vi
    .mocked(process.stdout.write)
    .mock.calls.map((c) => String(c[0]))
    .join("\n");
}

function stderrLines(): string {
  return vi
    .mocked(process.stderr.write)
    .mock.calls.map((c) => String(c[0]))
    .join("\n");
}

describe("handleGenerate — success path", () => {
  it("returns a structured PRD and logs generate.success", async () => {
    const deps = makeDeps();
    const res = await handleGenerate(
      buildRequest({ input: "We need a way for teams to share specs." }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      problem: VALID_PRD.problem,
      target_user: VALID_PRD.target_user,
      success_metric: VALID_PRD.success_metric,
      version: "system.v1",
    });
    expect(Array.isArray(body.user_stories)).toBe(true);
    expect(Array.isArray(body.non_goals)).toBe(true);

    const logged = stdoutLines();
    expect(logged).toContain("event=generate.success");
    expect(logged).toContain("input_tokens=200");
    expect(logged).toContain("output_tokens=400");
    expect(logged).toContain("attempts=1");
    // No request body, no IP, no IP hash.
    expect(logged).not.toContain("203.0.113.5");
    expect(logged).not.toContain("teams to share specs");
  });
});

describe("handleGenerate — kill switch", () => {
  it("returns 503 { killed: true } when isKilled is true", async () => {
    const deps = makeDeps({ isKilled: () => true });
    const res = await handleGenerate(buildRequest({ input: "anything" }), deps);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ killed: true });
  });
});

describe("handleGenerate — rate limit", () => {
  it("returns 429 with Retry-After once the per-IP bucket is full", async () => {
    const provider = buildProvider([
      validOutput(),
      validOutput(),
      validOutput(),
    ]);
    const deps = makeDeps({ provider, rateLimitPerMin: 2 });

    const r1 = await handleGenerate(buildRequest({ input: "a" }), deps);
    const r2 = await handleGenerate(buildRequest({ input: "b" }), deps);
    const r3 = await handleGenerate(buildRequest({ input: "c" }), deps);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
    expect(r3.headers.get("Retry-After")).toMatch(/^\d+$/);
    const body = await r3.json();
    expect(body.error).toBe("rate_limited");
    expect(body.retry_after_seconds).toBeGreaterThan(0);
  });

  it("isolates buckets per IP hash", async () => {
    const provider = buildProvider([
      validOutput(),
      validOutput(),
      validOutput(),
    ]);
    const deps = makeDeps({ provider, rateLimitPerMin: 1 });

    const a1 = await handleGenerate(
      buildRequest({ input: "a" }, { "x-forwarded-for": "203.0.113.5" }),
      deps,
    );
    const a2 = await handleGenerate(
      buildRequest({ input: "a" }, { "x-forwarded-for": "203.0.113.5" }),
      deps,
    );
    const b1 = await handleGenerate(
      buildRequest({ input: "b" }, { "x-forwarded-for": "198.51.100.7" }),
      deps,
    );

    expect(a1.status).toBe(200);
    expect(a2.status).toBe(429);
    expect(b1.status).toBe(200);
  });
});

describe("handleGenerate — daily cap", () => {
  it("returns 503 once the running daily cost exceeds the cap", async () => {
    // First call is allowed; cost lands above the cap so the second is rejected
    // before any LLM call happens.
    const provider = buildProvider([
      {
        spec: JSON.stringify(VALID_PRD),
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 5_000_000, outputTokens: 5_000_000 },
      },
      validOutput(),
    ]);
    const deps = makeDeps({ provider, cap: createDailyCap({ capUsd: 0.01 }) });

    const r1 = await handleGenerate(buildRequest({ input: "a" }), deps);
    expect(r1.status).toBe(200);

    const r2 = await handleGenerate(buildRequest({ input: "b" }), deps);
    expect(r2.status).toBe(503);
    expect(await r2.json()).toMatchObject({
      killed: true,
      reason: "daily_cap",
    });
    // Provider should not have been called the second time — cap blocks early.
    expect(provider.calls.length).toBe(1);
  });
});

describe("handleGenerate — JSON parse retry", () => {
  it("retries once with a stricter hint when the first response is not JSON", async () => {
    const provider = buildProvider([
      {
        spec:
          "Sure! Here is your spec:\n\n```json\n" +
          JSON.stringify(VALID_PRD) +
          "\n```",
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 100, outputTokens: 100 },
      },
      {
        spec: JSON.stringify(VALID_PRD),
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 100, outputTokens: 100 },
      },
    ]);
    const deps = makeDeps({ provider });

    const res = await handleGenerate(buildRequest({ input: "x" }), deps);
    expect(res.status).toBe(200);
    expect(provider.calls.length).toBe(2);
    expect(provider.calls[1].rawNotes).toContain("Return JSON only");
  });

  it("returns 502 if both attempts fail to parse", async () => {
    const provider = buildProvider([
      {
        spec: "not json",
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 50, outputTokens: 50 },
      },
      {
        spec: "still not json",
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 50, outputTokens: 50 },
      },
    ]);
    const deps = makeDeps({ provider });

    const res = await handleGenerate(buildRequest({ input: "x" }), deps);
    expect(res.status).toBe(502);
    expect(provider.calls.length).toBe(2);
  });

  it("retries when JSON is valid but shape is wrong, then succeeds", async () => {
    const provider = buildProvider([
      {
        spec: JSON.stringify({ problem: "x" }),
        model: "claude-haiku-4-5-20251001",
        usage: { inputTokens: 50, outputTokens: 50 },
      },
      validOutput(),
    ]);
    const deps = makeDeps({ provider });

    const res = await handleGenerate(buildRequest({ input: "x" }), deps);
    expect(res.status).toBe(200);
    expect(provider.calls.length).toBe(2);
  });
});

describe("handleGenerate — input validation", () => {
  it("rejects missing input with 400", async () => {
    const deps = makeDeps();
    const res = await handleGenerate(buildRequest({}), deps);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("input_required");
  });

  it("rejects non-string input with 400", async () => {
    const deps = makeDeps();
    const res = await handleGenerate(buildRequest({ input: 42 }), deps);
    expect(res.status).toBe(400);
  });

  it("rejects oversized input with 400", async () => {
    const deps = makeDeps();
    const res = await handleGenerate(
      buildRequest({ input: "a".repeat(8193) }),
      deps,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("input_too_large");
  });

  it("rejects malformed JSON body with 400", async () => {
    const deps = makeDeps();
    const res = await handleGenerate(buildRequest("{not json"), deps);
    expect(res.status).toBe(400);
  });
});

describe("handleGenerate — upstream errors", () => {
  it("returns 502 if the provider throws", async () => {
    const provider: LLMProvider = {
      name: "throwing",
      model: "stub",
      async generate() {
        throw new Error("network down");
      },
    };
    const deps = makeDeps({ provider });

    const res = await handleGenerate(buildRequest({ input: "x" }), deps);
    expect(res.status).toBe(502);
    expect(stderrLines()).toContain("class=llm_error");
  });
});
