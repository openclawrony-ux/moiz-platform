import { createHash } from "node:crypto";

const WINDOW_MS = 60_000;

export interface RateLimitOptions {
  perMinute: number;
  now?: () => number;
  store?: Map<string, number[]>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const defaultStore = new Map<string, number[]>();

export function hashIp(ipOrForwardedFor: string | null | undefined): string {
  // Pick the first IP from x-forwarded-for if multiple are present. Falls back
  // to "unknown" so a missing header still routes through one bucket rather
  // than bypassing the limit entirely.
  const raw = (ipOrForwardedFor ?? "").split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(raw).digest("hex");
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = options.now ? options.now() : Date.now();
  const store = options.store ?? defaultStore;
  const cutoff = now - WINDOW_MS;

  const existing = store.get(key) ?? [];
  // Drop timestamps outside the window. This is the only cleanup path; we
  // intentionally avoid timers so the limiter is serverless-friendly.
  const fresh = existing.filter((ts) => ts > cutoff);

  if (fresh.length >= options.perMinute) {
    store.set(key, fresh);
    const oldest = fresh[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + WINDOW_MS - now);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000) || 1,
    };
  }

  fresh.push(now);
  store.set(key, fresh);
  return {
    allowed: true,
    remaining: options.perMinute - fresh.length,
    retryAfterSeconds: 0,
  };
}

export function clearDefaultRateLimitStore(): void {
  defaultStore.clear();
}
