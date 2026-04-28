# Stack baseline (v0)

This is the engineering substrate the company will build on. It is intentionally boring — every choice optimizes for **reversibility, well-supported tooling, and the smallest credential footprint**. Product direction is not yet locked, so flexibility matters more than fit.

## What we picked

| Concern         | Choice                     | Why                                                                                         |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| Language        | TypeScript                 | Static types, ubiquitous, friendly to both web and Node services if we add a backend later. |
| Runtime         | Node.js 20 LTS             | Stable, supported through 2026; modern enough for top-level await, fetch, etc.              |
| Package manager | pnpm 9                     | Faster, deterministic; cheap to upgrade later; works in CI without surprises.               |
| App framework   | React 18 + Vite            | Boring, well-documented; static-first build; trivial migration to Next.js if SSR is needed. |
| Tests           | Vitest + Testing Library   | Same toolchain as Vite; fast; jest-compatible API.                                          |
| Lint            | ESLint + typescript-eslint | Industry standard; flat config keeps rules in one file.                                     |
| Format          | Prettier                   | Single source of truth for formatting, removes style debate.                                |
| CI              | GitHub Actions             | Free for public repos; co-located with code; no extra account to manage.                    |
| Deploy target   | GitHub Pages               | Built-in to GitHub; works with the existing `gh` token; no extra credential setup needed.   |
| License         | MIT                        | Permissive, simplest to reason about for an early-stage company.                            |

## Trade-offs we accepted

- **Vite + Pages over Next.js + Vercel.** Pages is static-only, which means no SSR, no API routes, and no edge functions. We accepted this because (a) Vercel's CLI is currently unauthenticated on this machine and (b) the v0 PRD ([MOI-3](/MOI/issues/MOI-3)) hasn't decided on product surface yet. If we later need SSR or first-party API routes, we can either:
  - Add a backend service in this repo (a `services/api` package) and keep the SPA as-is.
  - Migrate the frontend to Next.js and switch the deploy target to Vercel.
  - Both are reachable from this baseline without rewriting the substrate.

- **No per-PR preview deploys.** They are nice but require either Vercel/Netlify auth (out of scope right now) or hand-rolled GitHub Pages magic. Production-on-merge is sufficient as a deploy target for v0.

- **Single package, no monorepo yet.** Adding `pnpm` workspaces is a one-commit change when we need it. Premature monorepo structure adds friction we don't yet need.

- **No Docker baseline.** Deployment is static; no container needed. We will add Docker only when we add a service that needs it.

## Reversibility checklist

- Switching to Next.js: rename `vite.config.ts` → keep, add Next as an alternative app or replace `src/main.tsx` with Next pages. Lint, format, test, CI mostly carry over.
- Switching deploy from Pages to Vercel: replace `.github/workflows/deploy.yml` with the Vercel deploy step or use Vercel's GitHub integration. The build command stays `pnpm build`.
- Switching to a monorepo: add `pnpm-workspace.yaml`, move source into `packages/web/`, update CI paths.

## What we explicitly did not adopt yet

- A frontend component library (Radix, shadcn, MUI). Pick when we have UI requirements.
- A state manager (Redux, Zustand, etc.). React's built-ins are enough for v0.
- A backend / database. Defer until [MOI-3](/MOI/issues/MOI-3) decides product shape.
- An observability stack (Sentry, OTEL, logging). Add when the app hits real users.
- Containerization, IaC, secret managers. Premature for a static SPA.

These are reversible additions, not foundational decisions. Adding them later is a normal PR; removing them later would be painful — that's why we wait.
