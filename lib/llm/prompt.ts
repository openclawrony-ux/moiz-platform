import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SYSTEM_V1_PATH = resolve(process.cwd(), "prompts", "system.v1.md");

// Read once at module init so cold-start cost is paid up-front and the prompt
// is locked to the value in git when the function booted.
const systemPromptV1 = readFileSync(SYSTEM_V1_PATH, "utf-8");

export const SYSTEM_PROMPT_VERSION = "system.v1";

export function loadSystemPromptV1(): string {
  return systemPromptV1;
}
