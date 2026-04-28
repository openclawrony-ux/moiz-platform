import { describe, expect, it } from "vitest";
import { isKilled } from "./kill-switch";

describe("isKilled", () => {
  it("returns true only when KILLSWITCH=on exactly", () => {
    expect(isKilled({ KILLSWITCH: "on" })).toBe(true);
  });

  it("is false for absence and unrelated values", () => {
    expect(isKilled({})).toBe(false);
    expect(isKilled({ KILLSWITCH: "" })).toBe(false);
    expect(isKilled({ KILLSWITCH: "off" })).toBe(false);
    expect(isKilled({ KILLSWITCH: "true" })).toBe(false);
    expect(isKilled({ KILLSWITCH: "1" })).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isKilled({ KILLSWITCH: "ON" })).toBe(false);
    expect(isKilled({ KILLSWITCH: "On" })).toBe(false);
  });
});
