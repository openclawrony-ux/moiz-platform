import { describe, expect, it } from "vitest";
import { checkRateLimit, hashIp } from "./rate-limit";

describe("hashIp", () => {
  it("returns the same hash for the same IP", () => {
    expect(hashIp("203.0.113.5")).toBe(hashIp("203.0.113.5"));
  });

  it("returns a 64-char hex digest (sha256)", () => {
    expect(hashIp("203.0.113.5")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses the first IP in a comma-separated x-forwarded-for", () => {
    expect(hashIp("203.0.113.5, 10.0.0.1")).toBe(hashIp("203.0.113.5"));
    expect(hashIp("203.0.113.5, 10.0.0.1")).not.toBe(hashIp("10.0.0.1"));
  });

  it("buckets missing headers under a single 'unknown' key", () => {
    expect(hashIp(null)).toBe(hashIp(undefined));
    expect(hashIp(null)).toBe(hashIp(""));
  });
});

describe("checkRateLimit", () => {
  it("allows up to perMinute requests, then blocks the next", () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    const tick = () => now;
    const opts = { perMinute: 3, store, now: tick };

    expect(checkRateLimit("a", opts).allowed).toBe(true);
    expect(checkRateLimit("a", opts).allowed).toBe(true);
    expect(checkRateLimit("a", opts).allowed).toBe(true);
    const blocked = checkRateLimit("a", opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("evicts entries older than the window so traffic resumes", () => {
    const store = new Map<string, number[]>();
    let now = 1_000_000;
    const tick = () => now;
    const opts = { perMinute: 2, store, now: tick };

    checkRateLimit("a", opts);
    checkRateLimit("a", opts);
    expect(checkRateLimit("a", opts).allowed).toBe(false);

    // 61s later, the original two timestamps are outside the window.
    now += 61_000;
    const after = checkRateLimit("a", opts);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(1);
  });

  it("isolates buckets by key", () => {
    const store = new Map<string, number[]>();
    const opts = { perMinute: 1, store };

    expect(checkRateLimit("a", opts).allowed).toBe(true);
    expect(checkRateLimit("b", opts).allowed).toBe(true);
    expect(checkRateLimit("a", opts).allowed).toBe(false);
    expect(checkRateLimit("b", opts).allowed).toBe(false);
  });
});
