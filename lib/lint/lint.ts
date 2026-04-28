import { parse } from "./parse";
import { rules } from "./rules";
import type { Flag, LintResult, Severity } from "./types";

const PENALTY_BY_SEVERITY: Record<Severity, number> = {
  error: 15,
  warn: 8,
  info: 3,
};

export function lintMarkdown(markdown: string): LintResult {
  const doc = parse(markdown);
  const flags: Flag[] = [];
  for (const rule of rules) {
    const flag = rule.run(doc);
    if (flag) flags.push(flag);
  }
  const penalty = flags.reduce(
    (sum, flag) => sum + PENALTY_BY_SEVERITY[flag.severity],
    0,
  );
  const score = Math.max(0, 100 - penalty);
  return { flags, score };
}
