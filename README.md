# moiz-platform

Primary repository for Moiz. The first product on this substrate is **Specsmith** — a tool that turns rough product notes into a tight, reviewable engineering spec.

## Get to a running app in one command

Requires Node.js 20+ and [pnpm](https://pnpm.io/) 9+.

```bash
pnpm install && pnpm dev
```

Open http://localhost:3000 — you should see the Specsmith landing page with the paste form.

## Specsmith (this app)

Single-app layout at the repo root. The shell lives in:

| Path                          | What it is                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `app/layout.tsx`              | Root layout, global styles, metadata                                              |
| `app/page.tsx`                | Landing page — hero, paste form (no submit handler yet), "what is this" explainer |
| `app/(landing)/copy.ts`       | Landing copy externalized so it can be edited without touching layout             |
| `app/globals.css`             | Tailwind entry + base styles                                                      |
| `app/api/generate/route.ts`   | `POST /api/generate` — LLM proxy, cost controls, structured PRD output            |
| `app/api/generate/handler.ts` | Pure handler used by the route; inject deps in tests                              |
| `lib/llm/provider.ts`         | `LLMProvider` interface (transport-agnostic)                                      |
| `lib/llm/anthropic.ts`        | `AnthropicProvider` — concrete `LLMProvider` over `@anthropic-ai/sdk`             |
| `lib/llm/prompt.ts`           | Loads `prompts/system.v1.md` once at boot                                         |
| `lib/rate-limit.ts`           | In-memory per-IP-hash sliding-window rate limiter                                 |
| `lib/kill-switch.ts`          | `KILLSWITCH=on` env check                                                         |
| `lib/daily-cap.ts`            | In-memory daily USD cap (UTC-midnight reset)                                      |
| `lib/cost.ts`                 | Per-model rate table + usage→USD math                                             |
| `lib/log.ts`                  | Structured stdout/stderr logger that refuses to log bodies, IPs, or hashes        |
| `prompts/system.v1.md`        | Versioned Specsmith system prompt                                                 |

The landing page is intentionally a v0 stub. Wiring the form to `/api/generate` is its own follow-up issue.

### `POST /api/generate`

Request:

```json
{ "input": "rough product notes…", "turnstileToken": "optional" }
```

Successful response (`200`):

```json
{
  "problem": "…",
  "target_user": "…",
  "user_stories": ["As a …, I want to …, so that …"],
  "non_goals": ["…"],
  "success_metric": "…",
  "model": "claude-haiku-4-5-20251001",
  "version": "system.v1"
}
```

Error responses:

| Status | Body                                                                   | When                                                                                     |
| ------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `400`  | `{ "error": "input_required" \| "input_too_large" \| "invalid_json" }` | Missing/empty/non-string input, or input exceeds 8 KB.                                   |
| `429`  | `{ "error": "rate_limited", "retry_after_seconds": N }`                | Per-IP-hash bucket exceeded `RATE_LIMIT_PER_MIN`. `Retry-After` header set.              |
| `502`  | `{ "error": "upstream_error" \| "parse_error" \| "shape_error" }`      | LLM call failed, or even after one strict-JSON retry the response wasn't valid PRD JSON. |
| `503`  | `{ "killed": true }` or `{ "killed": true, "reason": "daily_cap" }`    | `KILLSWITCH=on` or running daily cost ≥ `DAILY_USD_CAP`.                                 |

### Environment variables

| Var                  | Default                     | Set in                      | Purpose                                                                   |
| -------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | _(required)_                | Vercel Production + Preview | Anthropic API key. Never commit it.                                       |
| `ANTHROPIC_MODEL`    | `claude-haiku-4-5-20251001` | optional                    | Override default model.                                                   |
| `RATE_LIMIT_PER_MIN` | `5`                         | optional                    | Max requests per IP hash per 60s window.                                  |
| `KILLSWITCH`         | _(unset)_                   | optional                    | Set to `on` to short-circuit `/api/generate` with `503 { killed: true }`. |
| `DAILY_USD_CAP`      | `1.50`                      | optional                    | Daily USD ceiling; resets at UTC midnight on cold start.                  |

### Observability

Each successful generate writes one stdout line:

```
event=generate.success duration_ms=… input_tokens=… output_tokens=… cost_usd=0.000123 model=claude-haiku-4-5-20251001 attempts=1
```

The logger refuses to emit fields named `input`, `output`, `spec`, `ip`, or `ipHash` even if a caller passes them — request bodies and IP addresses never make it to logs.

### Deploy (Vercel)

The build is a standard `next build`; `pnpm start` works on any Node 20+ host. For Vercel:

1. Connect the repo and accept the `next build` defaults — no overrides needed.
2. Set `ANTHROPIC_API_KEY` in **Production** and **Preview** environments. Do not commit it.
3. (Optional) Set `KILLSWITCH=on` in any env and redeploy that env's variables to instantly disable `/api/generate` (returns `503 { killed: true }` within a redeploy cycle).

## Daily workflow

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm dev`          | Start the Next.js dev server on `http://localhost:3000`           |
| `pnpm build`        | Production build (`.next/`)                                       |
| `pnpm start`        | Serve the production build on `http://localhost:3000`             |
| `pnpm lint`         | Lint with ESLint (Next.js core-web-vitals + TypeScript)           |
| `pnpm format`       | Check formatting (Prettier)                                       |
| `pnpm format:write` | Apply formatting fixes                                            |
| `pnpm typecheck`    | Run `tsc --noEmit`                                                |
| `pnpm test`         | Run unit tests once (Vitest)                                      |
| `pnpm test:watch`   | Run unit tests in watch mode                                      |
| `pnpm verify`       | Lint + format + typecheck + test + build (CI runs the same thing) |

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
