# Stack baseline (v0)

This is the engineering substrate the company will build on. It is intentionally boring — every choice optimizes for **reversibility, well-supported tooling, and the smallest credential footprint**.

The original v0 substrate ([MOI-2](/MOI/issues/MOI-2)) shipped on Vite + React. When [MOI-5](/MOI/issues/MOI-5) stood up the Specsmith app it migrated to Next.js (App Router), since Specsmith needs server-side API routes for spec generation. That migration is captured in this document.

## What we picked

| Concern         | Choice                      | Why                                                                                            |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| Language        | TypeScript                  | Static types, ubiquitous, friendly across web and Node services.                               |
| Runtime         | Node.js 20 LTS              | Stable, supported through 2026; modern enough for top-level await, fetch, etc.                 |
| Package manager | pnpm 9                      | Faster, deterministic; cheap to upgrade later; works in CI without surprises.                  |
| App framework   | Next.js 15 (App Router)     | First-class server components, API routes, and SSR — needed for Specsmith's `/api/generate`.   |
| UI              | React 18 + Tailwind CSS 4   | Standard React with utility-first styling; minimal config; trivial to drop a component lib in. |
| Lint            | ESLint + eslint-config-next | Industry standard; bundled rules for Next + TypeScript + a11y.                                 |
| Format          | Prettier                    | Single source of truth for formatting, removes style debate.                                   |
| CI              | GitHub Actions              | Free for public repos; co-located with code; no extra account to manage.                       |
| License         | MIT                         | Permissive, simplest to reason about for an early-stage company.                               |

## Trade-offs we accepted

- **Next.js + Node host over static-only.** Deploying a Next.js app to GitHub Pages is not first-class — it would require `next export` (loses API routes) or a custom adapter. Specsmith needs API routes, so the v0 deploy target moves off Pages. The deploy story is owned by a follow-up CI/deploy issue; until then, contributors run `pnpm dev` locally.

- **Single package, no monorepo yet.** Adding `pnpm` workspaces is a one-commit change when we need it. Premature monorepo structure adds friction we don't yet need.

- **No Docker baseline.** We will add Docker only when we add a service that needs it.

## Reversibility checklist

- Switching framework: every dependency picked here should be replaceable with a search-and-replace within a day. The landing copy is externalized in `app/(landing)/copy.ts`. The LLM dependency is behind an `LLMProvider` interface in `lib/llm/provider.ts`.
- Switching deploy target: the build is a standard `next build`. Vercel, AWS, Fly, Render, or a self-hosted Node host can all run it.
- Switching to a monorepo: add `pnpm-workspace.yaml`, move source into `apps/specsmith/`, update CI paths.

## What we explicitly did not adopt yet

- A frontend component library (Radix, shadcn, MUI). Pick when we have UI requirements.
- A state manager (Redux, Zustand, etc.). React's built-ins are enough for v0.
- A database. Defer until [MOI-3](/MOI/issues/MOI-3) decides product shape.
- An observability stack (Sentry, OTEL, logging). Add when the app hits real users.
- Containerization, IaC, secret managers. Premature for the v0 app.

These are reversible additions, not foundational decisions. Adding them later is a normal PR; removing them later would be painful — that's why we wait.
