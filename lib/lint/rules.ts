import { findSection, type ParsedDoc, type Section } from "./parse";
import type { Flag } from "./types";

type Rule = (doc: ParsedDoc) => Flag | null;

const PROBLEM_HEADINGS = [
  /\bproblem(\s+statement)?\b/i,
  /\bbackground\b/i,
  /\bcontext\b/i,
  /\boverview\b/i,
];

const TARGET_USER_HEADINGS = [
  /\btarget\s+users?\b/i,
  /\baudience\b/i,
  /\bpersonas?\b/i,
  /\bwho\s+is\s+(?:it|this)\s+for\b/i,
  /^\s*users?\s*$/i,
  /^\s*customers?\s*$/i,
];

const USER_STORY_HEADINGS = [
  /\buser\s+stor(y|ies)\b/i,
  /\bstor(y|ies)\b/i,
  /\bjobs?\s+to\s+be\s+done\b/i,
  /\bjtbd\b/i,
];

const NON_GOALS_HEADINGS = [
  /\bnon[-\s]*goals?\b/i,
  /\bout\s+of\s+scope\b/i,
  /\bnot\s+doing\b/i,
];

const METRIC_HEADINGS = [
  /\bsuccess\s+metric/i,
  /\bsuccess\s+criteria\b/i,
  /\bmetrics?\b/i,
  /\bkpis?\b/i,
  /\bnorth[-\s]*star/i,
];

const NUMBER_RE =
  /\b\d[\d,.]*\s*(%|x|×|s|ms|sec|seconds?|min|minutes?|hours?|days?|weeks?|months?|usd|\$|users?|customers?|requests?|nps|qps|rps)?\b/i;

const AS_A_RE = /^\s*(?:[-*+]\s+|\d+\.\s+)?as\s+(?:an?\b|the\b)/im;

function nonEmptyBody(section: Section | undefined): boolean {
  return !!section && section.body.trim().length > 0;
}

const missingProblemStatement: Rule = (doc) => {
  const section = findSection(doc, PROBLEM_HEADINGS);
  if (nonEmptyBody(section)) return null;
  return {
    code: "missing_problem_statement",
    severity: "error",
    message:
      "PRD is missing a problem statement. Add a `## Problem` (or `## Background`) section that explains why this work matters.",
    line: section?.heading.line,
  };
};

const missingTargetUser: Rule = (doc) => {
  const section = findSection(doc, TARGET_USER_HEADINGS);
  if (nonEmptyBody(section)) return null;
  return {
    code: "missing_target_user",
    severity: "error",
    message:
      "PRD does not name a target user. Add a `## Target user` section identifying who this is for.",
    line: section?.heading.line,
  };
};

function countUserStories(section: Section): number {
  const items = section.body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*+]\s+/.test(l) || /^\d+\.\s+/.test(l));
  if (items.length > 0) return items.length;
  return section.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

const missingUserStories: Rule = (doc) => {
  const section = findSection(doc, USER_STORY_HEADINGS);
  if (!section || !nonEmptyBody(section)) {
    return {
      code: "missing_user_stories",
      severity: "error",
      message:
        "PRD has no user stories section. Add `## User stories` with at least 3 stories.",
      line: section?.heading.line,
    };
  }
  if (countUserStories(section) < 3) {
    return {
      code: "missing_user_stories",
      severity: "error",
      message:
        "PRD has fewer than 3 user stories. Add at least 3 to cover the main flows.",
      line: section.heading.line,
    };
  }
  return null;
};

const userStoriesNotInAsAFormat: Rule = (doc) => {
  const section = findSection(doc, USER_STORY_HEADINGS);
  if (!nonEmptyBody(section)) return null;
  if (AS_A_RE.test(section!.body)) return null;
  return {
    code: "user_stories_not_in_as_a_format",
    severity: "warn",
    message:
      'No user story uses the "As a [user], I want [goal] so that [outcome]" format. Rewrite at least one to make the actor explicit.',
    line: section!.heading.line,
  };
};

const missingNonGoals: Rule = (doc) => {
  const section = findSection(doc, NON_GOALS_HEADINGS);
  if (nonEmptyBody(section)) return null;
  return {
    code: "missing_non_goals",
    severity: "warn",
    message:
      "PRD does not declare non-goals. Add a `## Non-goals` section to fence the scope.",
    line: section?.heading.line,
  };
};

const missingSuccessMetric: Rule = (doc) => {
  const section = findSection(doc, METRIC_HEADINGS);
  if (nonEmptyBody(section)) return null;
  return {
    code: "missing_success_metric",
    severity: "error",
    message:
      "PRD has no success metric. Add a `## Success metric` section with one number you intend to move.",
    line: section?.heading.line,
  };
};

const successMetricNotQuantitative: Rule = (doc) => {
  const section = findSection(doc, METRIC_HEADINGS);
  if (!nonEmptyBody(section)) return null;
  if (NUMBER_RE.test(section!.body)) return null;
  return {
    code: "success_metric_not_quantitative",
    severity: "warn",
    message:
      "Success metric section contains no number. State the target as a measurable value (e.g., '20% of drafts pass lint with 0 errors').",
    line: section!.heading.line,
  };
};

export const rules: ReadonlyArray<{ code: string; run: Rule }> = [
  { code: "missing_problem_statement", run: missingProblemStatement },
  { code: "missing_target_user", run: missingTargetUser },
  { code: "missing_user_stories", run: missingUserStories },
  { code: "user_stories_not_in_as_a_format", run: userStoriesNotInAsAFormat },
  { code: "missing_non_goals", run: missingNonGoals },
  { code: "missing_success_metric", run: missingSuccessMetric },
  {
    code: "success_metric_not_quantitative",
    run: successMetricNotQuantitative,
  },
];

export const rulesByCode = {
  missing_problem_statement: missingProblemStatement,
  missing_target_user: missingTargetUser,
  missing_user_stories: missingUserStories,
  user_stories_not_in_as_a_format: userStoriesNotInAsAFormat,
  missing_non_goals: missingNonGoals,
  missing_success_metric: missingSuccessMetric,
  success_metric_not_quantitative: successMetricNotQuantitative,
} as const;
