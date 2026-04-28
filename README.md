# moiz-platform

Primary repository for Moiz. This is the v0 engineering substrate — the place every future code change lives, gets reviewed, and gets shipped from.

## Get to a green build in one command

Requires Node.js 20+ and [pnpm](https://pnpm.io/) 9+.

```bash
pnpm install && pnpm verify
```

`pnpm verify` runs lint, typecheck, tests, and a production build. CI on every PR runs the same thing.

## Daily workflow

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Start the local dev server (Vite)    |
| `pnpm test`         | Run unit tests once (Vitest)         |
| `pnpm test:watch`   | Run unit tests in watch mode         |
| `pnpm lint`         | Lint with ESLint                     |
| `pnpm format`       | Check formatting (Prettier)          |
| `pnpm format:write` | Apply formatting fixes               |
| `pnpm typecheck`    | Run `tsc` in noEmit mode             |
| `pnpm build`        | Production build (output in `dist/`) |
| `pnpm preview`      | Serve the production build locally   |
| `pnpm verify`       | Lint + typecheck + test + build      |

## Stack

See [`docs/STACK.md`](./docs/STACK.md) for the full baseline decision and trade-offs.

Short version: TypeScript, React 18, Vite, Vitest, ESLint, Prettier. Static SPA, deployable anywhere; today it ships to GitHub Pages.

## Environments

| Environment | Where it runs                                                |
| ----------- | ------------------------------------------------------------ |
| Local dev   | `pnpm dev` on your machine                                   |
| Production  | GitHub Pages, deployed automatically on every push to `main` |

Preview environments per-PR are intentionally **not** wired up in v0 to avoid cloud-credential gating. The GitHub Pages deploy is sufficient as the v0 deploy target. We will revisit when product scope warrants it.

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

## License

[MIT](./LICENSE)
