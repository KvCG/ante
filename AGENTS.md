# Project Agent Instructions (AGENTS.md)

You are operating inside **Ante** — a social accountability PWA (full-stack TypeScript, React frontend + Express backend).

## Reference

This repo is implemented from tickets tracked in Kevin's Obsidian vault, not in this repo:

- Vault root: `D:\Documents\Obsidian Vault`
- Project note: `3 - Projects\Ante.md`
- Tickets: `3 - Projects\tickets\` — filtered to `project: "[[Ante]]"`
- Kanban board: `5 - Resources\_Dashboards\Ante Board.md`
- Slices / methodology artifacts: `5 - Resources\Knowledge Base\Ante *.md`

Used by the global `work-ticket` prompt (`~/.pi/agent/prompts/work-ticket.md`) to auto-find the
next ticket when invoked with no argument.

## Orientation

- **Project**: Full-stack TypeScript monorepo-style app (single repo, dual build targets)
- **Stack**: React 18 + Vite (FE) | Express + TypeScript (BE) | Pino (logging) | Zod (validation) | Vitest (testing) | esbuild (server bundling)
- **Node**: ≥18.0.0
- **Module system**: `"type": "module"` in package.json (ESM), but server output is CJS via esbuild

## Project Structure

```
├── src/
│   ├── client/               # React + Vite frontend
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # Entry point (ReactDOM.createRoot)
│   │   ├── hooks/            # Custom React hooks (useFetch, usePost)
│   │   ├── services/         # API client (fetch-based), config, request ID
│   │   └── styles/           # Global CSS (dark theme with light mode support)
│   ├── server/               # Express + TypeScript backend
│   │   ├── server.ts         # App bootstrap, middleware chain, listen
│   │   ├── routes/           # Express Router modules (apiRoutes, exampleRoutes, healthRoutes)
│   │   ├── services/         # Business logic (exampleService, httpClient)
│   │   ├── middleware/        # Express middleware (errorHandler, correlationId, validation, featureFlags)
│   │   ├── errors/           # Custom error classes (AppError hierarchy)
│   │   ├── logging/          # Pino logger + pino-http middleware
│   │   └── utils/            # Resilience (delay, withRetry, withTimeout), request identity
│   └── shared/               # Cross-platform code (types, runtimeEnv detection)
├── tests/                    # Tests mirror src/ structure
│   ├── client/               # Client component tests (jsdom)
│   ├── server/               # Server unit tests (node)
│   ├── fixtures/             # Reusable test data
│   ├── mocks/                # MSW handlers for API mocking
│   └── setup.ts              # Global test setup (jest-dom, vi.clearAllMocks)
├── scripts/                  # esbuild scripts (build.cjs, build-dev.cjs, validate-env.cjs)
├── dist/                     # Build output (client/ + server/server.cjs)
├── .vscode/                  # Debug configs (fullstack, frontend, backend, tests)
├── .github/workflows/ci.yml  # CI: lint → type-check → test-client → test-server → build
└── docs/IMPLEMENTATION.md    # Comprehensive architecture guide
```

## Architecture Patterns

### Layered Request Flow

```
HTTP Request → Middleware Stack → Route Handler → Service → Response
```

**Middleware order** (defined in `src/server/server.ts`):
1. `cors()` — CORS headers
2. `express.json()` / `express.urlencoded()` — body parsing
3. `correlationIdMiddleware` — adds `x-correlation-id` / `x-request-id`
4. `httpLogger` (pino-http) — structured request logging (excludes /health, /api/status, /api/ready)
5. Routes mounted under `/api`
6. `globalErrorHandler` — MUST be last

### Service → Route Pattern

- **Routes** (`src/server/routes/*.ts`): Thin Express Routers. Handle HTTP concerns only (validation, feature flags, response formatting).
- **Services** (`src/server/services/*.ts`): Classes with business logic. Export singleton instances (`export const fooService = new FooService()`).
- **Middleware** (`src/server/middleware/*.ts`): Reusable Express middleware factories.
- **Errors** (`src/server/errors/customErrors.ts`): `AppError` hierarchy with status codes.

### Adding a New API Endpoint

1. Create route file: `src/server/routes/<name>Routes.ts`
2. Use patterns: `asyncHandler`, `validateQuery`/`validateBody`/`validateParams` (Zod), `requireFeature`
3. Create service: `src/server/services/<name>Service.ts`
4. Register in `src/server/routes/apiRoutes.ts`: `router.use('/<path>', <name>Routes)`

Example:
```typescript
// src/server/routes/usersRoutes.ts
import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateQuery } from '../middleware/validation'
import { z } from 'zod'
import { userService } from '../services/userService'

const router = Router()
const querySchema = z.object({ limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 10) })

router.get('/', validateQuery(querySchema), asyncHandler(async (req, res) => {
  const { limit } = req.validatedQuery as { limit: number }
  const users = await userService.getAll({ limit })
  res.json(users)
}))

export default router
```

### Adding a Feature Flag

1. Add env var to `.env`: `ENABLE_NEW_FEATURE=true`
2. Register in `src/server/middleware/featureFlags.ts` → `featureFlags` map
3. Apply: `router.get('/beta', requireFeature('newFeature'), handler)`

### Adding External API Integration

1. Create client: `src/server/services/<name>Client.ts` using `createHttpClient({ baseURL, timeout })`
2. Use with resilience: `await withRetry(() => client.get<T>('/endpoint'), { maxRetries: 3 })`

## Error Handling

Custom error classes extend `AppError` in `src/server/errors/customErrors.ts`:

| Class                | Status | Code                  |
|---------------------|--------|-----------------------|
| `ValidationError`   | 400    | VALIDATION_ERROR      |
| `UnauthorizedError` | 401    | UNAUTHORIZED          |
| `ForbiddenError`    | 403    | FORBIDDEN             |
| `NotFoundError`     | 404    | NOT_FOUND             |
| `FeatureDisabledError` | 404 | FEATURE_DISABLED     |
| `ConflictError`     | 409    | CONFLICT              |
| `RateLimitError`    | 429    | RATE_LIMIT_EXCEEDED   |
| `ExternalApiError`  | 502    | EXTERNAL_API_ERROR    |

**Always throw specific error subclasses**, not generic `Error`. The `globalErrorHandler` catches them and formats consistent JSON responses.

**Validation errors** are auto-caught by `validateQuery`/`validateBody`/`validateParams` middleware — they call `next(new ValidationError(...))` automatically. No need to wrap in try/catch.

## Validation (Zod)

- **Query params**: `validateQuery(schema)` → `req.validatedQuery`
- **Request body**: `validateBody(schema)` → `req.validatedBody`
- **Route params**: `validateParams(schema)`
- Express `Request` type is extended globally with `validatedQuery`, `validatedBody`, and `correlationId` properties.

## Logging

- **Logger**: Pino (`src/server/logging/logger.ts`)
- **HTTP logging**: pino-http middleware (`src/server/logging/httpLogger.ts`)
- **Redacted fields**: `authorization`, `cookie`, `password`, `secret`, `token`, `apiKey`
- **Dev**: `pino-pretty` with colorized output
- **Production**: JSON for log aggregation
- **Log level**: Controlled by `LOG_LEVEL` env var (default: `debug` in dev, `info` in prod)

## Client-Side Patterns

- **API client**: `src/client/services/api.ts` — fetch-based with auto `x-request-id` headers
- **Environment detection**: `src/client/services/config.ts` — auto-selects API URL by hostname
- **Hooks**: `useFetch<T>()` for GET, `usePost<TReq, TRes>()` for POST
- **Request ID**: `src/client/services/requestId.ts` — `generateRequestId()`, session correlation ID

## Testing

| Config                          | Environment | Test glob                          |
|--------------------------------|-------------|------------------------------------|
| `vitest.client.config.ts`      | jsdom       | `tests/client/**/*.{test,spec}.tsx`|
| `vitest.server.config.ts`      | node        | `tests/server/**/*.{test,spec}.ts` |

- **Setup**: `tests/setup.ts` — imports `@testing-library/jest-dom`, clears mocks
- **Mocking**: MSW handlers in `tests/mocks/handlers.ts`
- **Fixtures**: `tests/fixtures/index.ts`
- **Scripts**: `npm test`, `npm run test:client`, `npm run test:server`, `npm run test:watch`

## Build & Deployment

### Build Pipeline

- **Client**: Vite → `dist/client/` (with sourcemaps, vendor chunk for react/react-dom)
- **Server**: esbuild → `dist/server/server.cjs` (bundled, minified in prod; external: pino, pino-pretty, pino-http)

### Scripts

| Script              | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Concurrent FE (Vite) + BE (nodemon) |
| `npm run dev:client`  | Vite only                          |
| `npm run dev:server`  | nodemon → esbuild dev → node inspect |
| `npm run build`      | Full production build               |
| `npm run build:client` | Vite build                        |
| `npm run build:server` | esbuild production build           |
| `npm run start`      | `node dist/server/server.cjs`       |
| `npm run test`       | Run all tests                       |
| `npm run type-check` | `tsc --noEmit`                      |
| `npm run lint`       | ESLint                              |

## Command Classification

Getting this wrong means either blocking forever waiting on a command that never exits, or
treating a server's startup log as a passing test.

**One-shot — run to completion, always read the full output before concluding anything:**

| Command | Purpose | Success signal |
|---|---|---|
| `npm test` / `npm run test:client` / `npm run test:server` | Run tests once | `vitest run` exits, pass/fail summary printed |
| `npm run type-check` | `tsc --noEmit` | Exit 0, no output |
| `npm run lint` / `npm run lint:fix` | ESLint | Exit code, violations listed if any |
| `npm run build` / `build:client` / `build:server` | Production build | Exits, `dist/` populated |
| `npm run validate-env` | Checks required env vars, applies defaults | Exits (also runs automatically as `predev`) |
| `git log`, `git status`, `git diff` | Inspect repo state | Whatever it prints |

**Long-running — never use these to verify anything:**

| Command | Why it's unsafe as a check |
|---|---|
| `npm run dev` | Concurrent Vite (FE) + nodemon (BE) — neither exits on its own |
| `npm run dev:client` | Vite dev server, never terminates |
| `npm run dev:server` | nodemon watch mode, never terminates |
| `npm start` | Runs the production server (`node dist/server/server.cjs`) — listens indefinitely |
| `npm run test:watch` | vitest watch mode, never exits |

To confirm a route actually works, hit it with `curl` against a running `dev`/`start` instance
(one-shot) rather than trusting a clean boot log from the long-running command itself.

### Docker

Multi-stage: `node:20-alpine` builder + runner. Non-root user `appuser`. Health check on `/health`.

### CI (GitHub Actions)

Jobs: `lint` → `type-check` → `test-client` + `test-server` → `build` (depends on all above). Node 20, npm cache.

## Environment Variables

From `.env.example`:

| Variable              | Default         | Description              |
|----------------------|-----------------|--------------------------|
| `PORT`               | `3000`          | Backend port             |
| `NODE_ENV`           | `development`   | Environment              |
| `LOG_LEVEL`          | `debug`         | Pino log level           |
| `ENABLE_EXAMPLE_FEATURE` | `true`      | Feature flag             |
| `ENABLE_ANALYTICS`   | `false`         | Feature flag             |
| `ENABLE_BETA_FEATURES` | `false`       | Feature flag             |

Pre-dev hook runs `validate-env.cjs` to check required vars and apply defaults.

## Debugging (VS Code)

| Configuration           | Description                          |
|------------------------|--------------------------------------|
| `Debug Server (Launch)` | Fresh build + debug server           |
| `Attach to Backend`     | Attach to nodemon (port 9229)        |
| `Debug Frontend (Chrome/Edge)` | Browser debugging at :5173  |
| `Debug Fullstack`       | Compound: backend attach + frontend  |
| `Debug Client Tests`    | Vitest client with smartStep         |
| `Debug Server Tests`    | Vitest server with smartStep         |

## Conventions

- **Naming**: Route files → `*Routes.ts`, Services → `*Service.ts`, Clients → `*Client.ts`
- **Test files**: Mirror `src/` structure under `tests/`
- **Imports**: Use `@shared/` alias for cross-platform code (resolved in tsconfig + vite)
- **Server tsconfig**: `module: "CommonJS"`, `target: "ES2022"`, `paths: { "@shared/*": ["../shared/*"] }`
- **Client tsconfig**: `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`
- **Root tsconfig**: Reference project (no files, points to client/server/node configs)
- **Prettier**: No semicolons, single quotes, trailing commas ES5, 100 char width, 2-space indent, LF line endings
- **ESLint**: `@typescript-eslint` strict, React hooks rules, no explicit `any` (warn), `_` prefix ignores unused vars
- **Style**: Dark theme CSS with CSS custom properties, light mode via `prefers-color-scheme`
- **No React imports needed**: JSX transform is `react-jsx` (no `import React` in components)

## Key Files Reference

| File                                    | Purpose                                    |
|----------------------------------------|--------------------------------------------|
| `src/server/server.ts`                 | App bootstrap, middleware chain, listen     |
| `src/server/middleware/errorHandler.ts`| `globalErrorHandler`, `asyncHandler`        |
| `src/server/middleware/validation.ts`  | Zod validation middleware factories         |
| `src/server/middleware/featureFlags.ts`| Feature flag registry + `requireFeature()` |
| `src/server/errors/customErrors.ts`    | `AppError` hierarchy                        |
| `src/server/logging/logger.ts`         | Pino structured logger                      |
| `src/server/utils/resilience.ts`       | `delay`, `withRetry`, `withTimeout`         |
| `src/client/services/api.ts`           | Fetch-based API client                      |
| `src/client/hooks/useFetch.ts`         | `useFetch`, `usePost` hooks                 |
| `src/shared/runtimeEnv.ts`             | Cross-platform environment detection        |
| `src/shared/types.ts`                  | Shared interfaces (ApiResponse, PaginatedResponse, etc.) |
| `scripts/build.cjs`                    | esbuild production server bundle            |
| `tests/setup.ts`                       | Global test setup                           |
| `docs/IMPLEMENTATION.md`               | Comprehensive architecture guide            |

## Quick Reference

### Ports

| Service     | Port |
|-------------|------|
| Vite (FE)   | 5173 |
| Express (BE)| 3000 |
| Node debug  | 9229 |

### Useful Commands

```bash
npm run dev              # Start both FE + BE
npm run build            # Production build
npm test                 # Run all tests
npm run type-check       # TypeScript check
npm run lint             # ESLint
docker build -t my-app . # Docker build
```
