export type Severity = "error" | "warn" | "info";

export type FlagCode =
  | "missing_problem_statement"
  | "missing_target_user"
  | "missing_user_stories"
  | "user_stories_not_in_as_a_format"
  | "missing_non_goals"
  | "missing_success_metric"
  | "success_metric_not_quantitative";

export interface Flag {
  code: FlagCode;
  severity: Severity;
  message: string;
  line?: number;
}

export interface LintResult {
  flags: Flag[];
  score: number;
}
