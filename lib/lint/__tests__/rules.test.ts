import { describe, expect, it } from "vitest";
import { parse } from "../parse";
import { rulesByCode } from "../rules";

const completeDoc = `# Title

## Problem
Some background.

## Target user
End users.

## User stories
- As a user, I want X so that Y.
- As an admin, I want A so that B.
- As a guest, I want C so that D.

## Non-goals
- Not solving X.

## Success metric
Move metric M from 0 to 25% within 30 days.
`;

describe("missing_problem_statement", () => {
  it("flags when no problem section exists", () => {
    const doc = parse("# Just a title\n\n## Other\nbody\n");
    expect(rulesByCode.missing_problem_statement(doc)).not.toBeNull();
  });

  it("flags when problem heading exists but body is empty", () => {
    const doc = parse("# Title\n\n## Problem\n\n## Next\n");
    expect(rulesByCode.missing_problem_statement(doc)).not.toBeNull();
  });

  it("passes when problem section has body", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.missing_problem_statement(doc)).toBeNull();
  });

  it("accepts ## Background as a substitute heading", () => {
    const doc = parse("# Title\n\n## Background\nWhy this matters.\n");
    expect(rulesByCode.missing_problem_statement(doc)).toBeNull();
  });
});

describe("missing_target_user", () => {
  it("flags when no target user section exists", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.missing_target_user(doc)).not.toBeNull();
  });

  it("does not confuse 'User stories' with target user", () => {
    const doc = parse(
      "# Title\n\n## Problem\nThing\n\n## User stories\n- As a user...\n",
    );
    expect(rulesByCode.missing_target_user(doc)).not.toBeNull();
  });

  it("passes for ## Target user", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.missing_target_user(doc)).toBeNull();
  });

  it("accepts ## Audience as a substitute", () => {
    const doc = parse("# Title\n\n## Audience\nDesigners.\n");
    expect(rulesByCode.missing_target_user(doc)).toBeNull();
  });
});

describe("missing_user_stories", () => {
  it("flags when no user-stories section exists", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.missing_user_stories(doc)).not.toBeNull();
  });

  it("flags when fewer than 3 stories are present", () => {
    const doc = parse(
      "# Title\n\n## User stories\n- As a user, I want X.\n- As an admin, I want Y.\n",
    );
    expect(rulesByCode.missing_user_stories(doc)).not.toBeNull();
  });

  it("passes when 3 or more bullet stories are present", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.missing_user_stories(doc)).toBeNull();
  });
});

describe("user_stories_not_in_as_a_format", () => {
  it("does not fire when no user stories section is present (handled by missing_user_stories)", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.user_stories_not_in_as_a_format(doc)).toBeNull();
  });

  it("flags when stories use non-actor-led prose", () => {
    const doc = parse(
      "# Title\n\n## User stories\n- The system exports CSVs.\n- The system emails them.\n- The system retries on failure.\n",
    );
    expect(rulesByCode.user_stories_not_in_as_a_format(doc)).not.toBeNull();
  });

  it("passes when at least one story uses 'As a' format", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.user_stories_not_in_as_a_format(doc)).toBeNull();
  });
});

describe("missing_non_goals", () => {
  it("flags when no non-goals section exists", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.missing_non_goals(doc)).not.toBeNull();
  });

  it("passes for ## Non-goals", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.missing_non_goals(doc)).toBeNull();
  });

  it("accepts ## Out of scope as a substitute", () => {
    const doc = parse("# Title\n\n## Out of scope\n- Not building X.\n");
    expect(rulesByCode.missing_non_goals(doc)).toBeNull();
  });
});

describe("missing_success_metric", () => {
  it("flags when no metric section exists", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.missing_success_metric(doc)).not.toBeNull();
  });

  it("passes for ## Success metric", () => {
    const doc = parse(completeDoc);
    expect(rulesByCode.missing_success_metric(doc)).toBeNull();
  });
});

describe("success_metric_not_quantitative", () => {
  it("does not fire when metric section is missing (handled by missing_success_metric)", () => {
    const doc = parse("# Title\n\n## Problem\nThing\n");
    expect(rulesByCode.success_metric_not_quantitative(doc)).toBeNull();
  });

  it("flags when metric body has no number", () => {
    const doc = parse(
      "# Title\n\n## Success metric\nUsers will love it and we will succeed.\n",
    );
    expect(rulesByCode.success_metric_not_quantitative(doc)).not.toBeNull();
  });

  it("passes when metric body contains a percentage", () => {
    const doc = parse(
      "# Title\n\n## Success metric\nMove activation from 5% to 20% within 60 days.\n",
    );
    expect(rulesByCode.success_metric_not_quantitative(doc)).toBeNull();
  });

  it("passes when metric body contains a duration target", () => {
    const doc = parse(
      "# Title\n\n## Success metric\nMedian time drops from 4 hours to 5 minutes.\n",
    );
    expect(rulesByCode.success_metric_not_quantitative(doc)).toBeNull();
  });
});
