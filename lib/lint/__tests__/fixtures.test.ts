import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintMarkdown } from "../lint";
import type { FlagCode } from "../types";

const FIXTURE_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "fixtures",
);

interface Case {
  file: string;
  expected: FlagCode[];
  scoreCheck: (score: number) => boolean;
}

const cases: Case[] = [
  {
    file: "01-clean.md",
    expected: [],
    scoreCheck: (s) => s === 100,
  },
  {
    file: "02-empty.md",
    expected: [
      "missing_problem_statement",
      "missing_target_user",
      "missing_user_stories",
      "missing_non_goals",
      "missing_success_metric",
    ],
    scoreCheck: (s) => s < 50,
  },
  {
    file: "03-thin-stories.md",
    expected: ["missing_user_stories", "user_stories_not_in_as_a_format"],
    scoreCheck: (s) => s > 50 && s < 100,
  },
  {
    file: "04-vague-metric.md",
    expected: ["success_metric_not_quantitative"],
    scoreCheck: (s) => s > 80 && s < 100,
  },
  {
    file: "05-no-non-goals.md",
    expected: ["missing_non_goals"],
    scoreCheck: (s) => s > 80 && s < 100,
  },
];

describe("fixture coverage", () => {
  for (const { file, expected, scoreCheck } of cases) {
    it(`${file} produces the expected flag set`, () => {
      const markdown = readFileSync(join(FIXTURE_DIR, file), "utf8");
      const result = lintMarkdown(markdown);
      const codes = result.flags.map((f) => f.code).sort();
      expect(codes).toEqual([...expected].sort());
      expect(scoreCheck(result.score)).toBe(true);
    });
  }
});
