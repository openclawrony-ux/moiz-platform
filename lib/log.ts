type LogValue = string | number | boolean;

export interface LogFields {
  [key: string]: LogValue | undefined;
}

const FORBIDDEN_KEYS = new Set(["input", "output", "spec", "ip", "ipHash"]);

function formatPair(key: string, value: LogValue): string {
  if (typeof value === "string") {
    if (/[\s"=]/.test(value)) return `${key}=${JSON.stringify(value)}`;
    return `${key}=${value}`;
  }
  return `${key}=${value}`;
}

export function logEvent(event: string, fields: LogFields = {}): void {
  const parts: string[] = [`event=${event}`];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (FORBIDDEN_KEYS.has(key)) {
      // Defensive: refuse to log sensitive fields by name. Drop silently.
      continue;
    }
    parts.push(formatPair(key, value));
  }
  // Use stdout for success/info events.
  process.stdout.write(parts.join(" ") + "\n");
}

export function logError(event: string, fields: LogFields = {}): void {
  const parts: string[] = [`event=${event}`];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (FORBIDDEN_KEYS.has(key)) continue;
    parts.push(formatPair(key, value));
  }
  process.stderr.write(parts.join(" ") + "\n");
}
