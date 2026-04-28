# Specsmith — v0 PRD

## Problem

Founders writing a PRD for the first time produce vague drafts that fail review. The cycle of write → review → rewrite is slow and asymmetric: reviewers spend more time annotating than founders spent writing.

## Target user

Solo founders and product leads at seed-stage startups who write 1–5 PRDs per quarter and have no template they trust.

## User stories

- As a founder, I want to paste a half-written PRD and get specific quality flags so that I know what to improve before I send it for review.
- As a product lead, I want a one-paragraph problem-statement starter so that I can structure my draft.
- As a founder, I want a deterministic lint pass so that I trust the feedback is consistent across runs.
- As a reviewer, I want the same lint output as the author so that we're aligned on what "good" means.

## Non-goals

- We are not building a generic markdown editor.
- We are not building a multi-user collaboration suite.
- We are not building authentication in v0.

## Success metric

We will move "% of generated PRDs that pass lint with 0 errors" from 0 to 60% within 30 days of launch.
