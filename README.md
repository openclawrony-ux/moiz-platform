# moiz-platform

Primary repository for Moiz. The first product on this substrate is **Specsmith** — a tool that turns rough product notes into a tight, reviewable engineering spec.

## Get to a running app in one command

Requires Node.js 20+ and [pnpm](https://pnpm.io/) 9+.

```bash
pnpm install && pnpm dev
```

Open http://localhost:3000 — you should see the Specsmith landing page with the paste form.

## Specsmith (this app)

Single-app layout at the repo root. The skeleton lives in:

| Path                    | What it is                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `app/layout.tsx`        | Root layout, global styles, metadata                                               |
| `app/page.tsx`          | Landing page — hero, paste form (no submit handler yet), "what is this" explainer  |
| `app/(landing)/copy.ts` | Landing copy externalized so it can be edited without touching layout              |
| `app/globals.css`       | Tailwind entry + base styles                                                       |
| `lib/llm/provider.ts`   | `LLMProvider` interface stub. Implementation lands with the `/api/generate` issue. |

The landing page is intentionally a v0 stub. The paste form has no submit handler — generation lands in a follow-up issue.

## Daily workflow

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `pnpm dev`          | Start the Next.js dev server on `http://localhost:3000`    |
| `pnpm build`        | Production build (`.next/`)                                |
| `pnpm start`        | Serve the production build on `http://localhost:3000`      |
| `pnpm lint`         | Lint with ESLint (Next.js core-web-vitals + TypeScript)    |
| `pnpm format`       | Check formatting (Prettier)                                |
| `pnpm format:write` | Apply formatting fixes                                     |
| `pnpm typecheck`    | Run `tsc --noEmit`                                         |
| `pnpm verify`       | Lint + format + typecheck + build (CI runs the same thing) |

## Stack

- Next.js 15 (App Router)
- React 18 + TypeScript
- Tailwind CSS 4
- ESLint 9 + Prettier 3
- pnpm 9, Node.js 20+

See [`docs/STACK.md`](./docs/STACK.md) for the full baseline decision and trade-offs.

## Branching and merging

- `main` is protected. No direct pushes.
- All changes go through a pull request.
- CI must be green before merge.
- Squash-merge by default — keeps history linear.

## Contributing

1. Branch from `main`: `git checkout -b feat/your-thing`
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
3. Push and open a PR.
4. Wait for CI to go green. Self-review or request a teammate.
5. Squash-merge.

Every commit must end with the trailer:

```
Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

## License

[MIT](./LICENSE)
