import { describe, expect, it } from "vitest";
import { createDailyCap } from "./daily-cap";

describe("createDailyCap", () => {
  it("starts with full budget", () => {
    const cap = createDailyCap({ capUsd: 1.5 });
    expect(cap.hasBudget()).toBe(true);
    expect(cap.snapshot().totalUsd).toBe(0);
  });

  it("reports no budget once the cap is reached", () => {
    const cap = createDailyCap({ capUsd: 1.0 });
    cap.add(0.4);
    expect(cap.hasBudget()).toBe(true);
    cap.add(0.6);
    expect(cap.hasBudget()).toBe(false);
  });

  it("rolls over at UTC midnight", () => {
    let now = new Date("2026-04-28T23:59:00.000Z");
    const cap = createDailyCap({ capUsd: 1.0, now: () => now });

    cap.add(1.0);
    expect(cap.hasBudget()).toBe(false);
    expect(cap.snapshot().dayUtc).toBe("2026-04-28");

    // Cross UTC midnight.
    now = new Date("2026-04-29T00:00:00.000Z");
    expect(cap.hasBudget()).toBe(true);
    expect(cap.snapshot().dayUtc).toBe("2026-04-29");
    expect(cap.snapshot().totalUsd).toBe(0);
  });

  it("does not roll until the UTC date changes (local timezone irrelevant)", () => {
    let now = new Date("2026-04-28T01:00:00.000Z");
    const cap = createDailyCap({ capUsd: 1.0, now: () => now });

    cap.add(1.0);
    expect(cap.hasBudget()).toBe(false);

    // Same UTC day, different local-day-equivalent — should still be capped.
    now = new Date("2026-04-28T22:00:00.000Z");
    expect(cap.hasBudget()).toBe(false);
    expect(cap.snapshot().dayUtc).toBe("2026-04-28");
  });
});
