import { describe, expect, it } from "vitest";
import { usageCostUsd } from "./cost";

describe("usageCostUsd", () => {
  it("prices Haiku 4.5 at $1/MTok in, $5/MTok out", () => {
    const cost = usageCostUsd("claude-haiku-4-5-20251001", {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(6.0, 6);
  });

  it("scales with usage", () => {
    const cost = usageCostUsd("claude-haiku-4-5-20251001", {
      inputTokens: 500,
      outputTokens: 1500,
    });
    // (500/1M * 1) + (1500/1M * 5) = 0.0005 + 0.0075 = 0.008
    expect(cost).toBeCloseTo(0.008, 8);
  });

  it("falls back to a conservative rate for unknown models", () => {
    const cost = usageCostUsd("some-future-model-id", {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    // Fallback should be at least as expensive as Sonnet to avoid undercounting.
    expect(cost).toBeGreaterThanOrEqual(18);
  });

  it("returns 0 for zero usage", () => {
    expect(
      usageCostUsd("claude-haiku-4-5-20251001", {
        inputTokens: 0,
        outputTokens: 0,
      }),
    ).toBe(0);
  });
});
