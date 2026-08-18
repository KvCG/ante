# Ante — Implementation Guide

> A comprehensive guide to the architecture, patterns, and conventions used in Ante.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Server Architecture](#server-architecture)
4. [Client Architecture](#client-architecture)
5. [Shared Code](#shared-code)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Build & Deployment](#build--deployment)
9. [Extending Ante](#extending-ante)

---

## Overview

### Tech Stack

| Layer          | Technology           | Purpose                   |
| -------------- | -------------------- | ------------------------- |
| **Frontend**   | React 18 + Vite      | Fast development with HMR |
| **Backend**    | Express + TypeScript | REST API server           |
| **Build**      | esbuild              | Fast server bundling      |
| **Testing**    | Vitest               | Unified test runner       |
| **Logging**    | Pino                 | Structured JSON logging   |
| **Validation** | Zod                  | Runtime type validation   |

### Design Principles

1. **Simplicity First** - Start simple, add complexity when needed
2. **Type Safety** - TypeScript everywhere with strict mode
3. **Separation of Concerns** - Clear boundaries between layers
4. **Developer Experience** - Fast feedback loops, easy debugging
5. **Production Ready** - Logging, error handling, and health checks built-in

---

## Project Structure

```
ante/
├── src/
│   ├── client/                 # React frontend
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client & config
│   │   ├── styles/             # Global CSS
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   └── tsconfig.json       # Client-specific TS config
│   │
│   ├── server/                 # Express backend
│   │   ├── errors/             # Custom error classes
│   │   ├── logging/            # Pino logger setup
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities (resilience, http)
│   │   ├── server.ts           # Server entry point
│   │   └── tsconfig.json       # Server-specific TS config
│   │
│   ├── shared/                 # Cross-platform code
│   │   ├── types.ts            # Shared interfaces
│   │   └── runtimeEnv.ts       # Environment detection
│
├── tests/                      # Test files (mirrors src/ structure)
│   ├── client/                 # Client component tests
│   ├── server/                 # Server unit tests
│   ├── fixtures/               # Test data
│   ├── mocks/                  # MSW handlers
│   └── setup.ts                # Global test setup
│
├── scripts/                    # Build scripts
│   ├── build.cjs               # Production build
│   ├── build-dev.cjs           # Development build
│   └── validate-env.cjs        # Environment validation
│
├── .vscode/                    # VS Code configuration
│   ├── launch.json             # Debug configurations
│   ├── tasks.json              # Build tasks
│   └── settings.json           # Editor settings
│
├── tsconfig.json               # Root TS config (references)
├── vite.config.ts              # Vite configuration
├── vitest.client.config.ts     # Client test config
├── vitest.server.config.ts     # Server test config
└── package.json                # Dependencies & scripts
```

---

## Server Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Request                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     Middleware                           │
│  ┌─────────┐ ┌──────────────┐ ┌───────────┐ ┌────────┐ │
│  │  CORS   │ │CorrelationID │ │HTTP Logger│ │  JSON  │ │
│  └─────────┘ └──────────────┘ └───────────┘ └────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Route Handlers                         │
│      ┌─────────────┐      ┌────────────────┐             │
│      │healthRoutes │      │  yourRoutes    │             │
│      └──────┬──────┘      └───────┬────────┘             │
│              \                    /                      │
│               \                  /                       │
│              ┌──────────▼──────────┐                     │
│              │  Validation + Flags  │                    │
│              │ (Zod + requireFeature)│                   │
│              └───────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     Services                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Business Logic                      │   │
│  │  • Data transformation                          │   │
│  │  • External API calls                           │   │
│  │  • Resilience patterns (retry, timeout)         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Global Error Handler                    │
│  • Catches all errors                                   │
│  • Formats consistent JSON responses                    │
│  • Logs with context                                    │
└─────────────────────────────────────────────────────────┘
```

### Error Handling

Custom error classes in `src/server/errors/customErrors.ts`:

| Error Class            | Status | Use Case                      |
| ---------------------- | ------ | ----------------------------- |
| `ValidationError`      | 400    | Invalid input, missing fields |
| `UnauthorizedError`    | 401    | Authentication required       |
| `ForbiddenError`       | 403    | Permission denied             |
| `NotFoundError`        | 404    | Resource not found            |
| `FeatureDisabledError` | 404    | Feature flag is off           |
| `ConflictError`        | 409    | Duplicate resource            |
| `RateLimitError`       | 429    | Too many requests             |
| `ExternalApiError`     | 502    | Upstream service failure      |

**Usage:**

```typescript
import { NotFoundError, ValidationError } from "../errors/customErrors";

// In a route handler
if (!user) {
  throw new NotFoundError("User", id);
}

// In validation
if (!isValid) {
  throw new ValidationError("Invalid email format", { field: "email" });
}
```

### Middleware Stack

**Order matters!** Middleware is applied in this sequence:

1. `cors()` - CORS headers
2. `express.json()` - Parse JSON body
3. `correlationIdMiddleware` - Add request correlation ID
4. `httpLogger` - Log HTTP requests/responses
5. **Routes** - Your API endpoints
6. `globalErrorHandler` - Catch and format errors (MUST be last)

### Validation with Zod

```typescript
// Define schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
});

// Use in route
router.post("/users", validateBody(createUserSchema), async (req, res) => {
  const { name, email, age } = req.validatedBody;
  // TypeScript knows the types!
});
```

### Feature Flags

Environment-based feature flags for safe rollouts:

```typescript
// In .env
ENABLE_BETA_FEATURES = true;

// In middleware/featureFlags.ts
const featureFlags = {
  betaFeatures: () => process.env.ENABLE_BETA_FEATURES === "true",
};

// In routes
router.get("/beta-endpoint", requireFeature("betaFeatures"), handler);
```

### HTTP Client

For external API integrations:

```typescript
import { createHttpClient } from "../services/httpClient";

const githubApi = createHttpClient({
  baseURL: "https://api.github.com",
  timeout: 10000,
});

// Typed responses
const user = await githubApi.get<GitHubUser>("/users/octocat");
```

---

## Client Architecture

### API Client

The client uses a simple fetch-based API client with automatic request ID propagation:

```typescript
// services/api.ts
import { api } from "./services/api";

const users = await api.get<User[]>("/api/users");
await api.post<User>("/api/users", { name: "John" });
```

### Custom Hooks

**useFetch** - Generic data fetching:

```typescript
const { data, loading, error, fetch } = useFetch<User[]>();

useEffect(() => {
  fetch("/api/users");
}, []);
```

**usePost** - For mutations:

```typescript
const { data, loading, error, post } = usePost<CreateUserDTO, User>();

const handleSubmit = async (formData) => {
  await post("/api/users", formData);
};
```

### Environment Detection

API URL is automatically selected based on hostname:

- `localhost` → `http://localhost:3000`
- Production → Same origin (no prefix)

---

## Shared Code

### Types (`src/shared/types.ts`)

Define types used by both client and server:

```typescript
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

### Runtime Environment (`src/shared/runtimeEnv.ts`)

Detect deployment environment:

```typescript
import { detectAppEnv, isProductionAppEnv } from "@shared/runtimeEnv";

const env = detectAppEnv(process.env); // 'prod' | 'dev' | 'local'

if (isProductionAppEnv(process.env)) {
  // Production-only logic
}
```

---

## Development Workflow

### Starting Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Start development servers
npm run dev
```

This starts:

- **Frontend**: http://localhost:5173 (Vite HMR)
- **Backend**: http://localhost:3000 (nodemon + esbuild)
- **Debug port**: 9229 (Node inspector)

### VS Code Debugging

1. Start dev servers: `npm run dev`
2. Open VS Code debugger (F5)
3. Select configuration:
   - **Attach to Backend** - Debug running server
   - **Debug Frontend (Chrome)** - Debug React app
   - **Debug Fullstack** - Both simultaneously

### Environment Validation

Before `npm run dev`, the `predev` hook runs `validate-env.cjs`:

- Checks required environment variables
- Applies defaults for optional variables
- Fails fast with clear error messages

---

## Testing Strategy

### Configuration

| Config File               | Environment | Tests                             |
| ------------------------- | ----------- | --------------------------------- |
| `vitest.client.config.ts` | jsdom       | `tests/client/**/*.test.{ts,tsx}` |
| `vitest.server.config.ts` | node        | `tests/server/**/*.test.ts`       |

### Running Tests

```bash
npm test              # Run all tests
npm run test:client   # Client tests only
npm run test:server   # Server tests only
npm run test:watch    # Watch mode
```

### MSW for API Mocking

Mock API responses in client tests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([{ id: 1, name: "Test User" }]);
  }),
];
```

### Test Database

**Decision (2026-08-17):** SQLite in-memory via `better-sqlite3`, direct driver (no ORM). Chosen for
zero network dependency, instant test runs, and no credentials to manage in CI — the trade-off
accepted is dialect drift from the Postgres used in production (JSON handling, array types, some
constraints differ). Revisit if a schema-level bug ever slips through tests only to surface against
real Postgres.

`tests/server/db/testDb.ts` exports `createTestDb()` / `closeTestDb()`. Each call creates a fully
isolated in-memory database — no shared state between tests, no separate teardown/reset step needed
beyond `closeTestDb()` in `afterEach`. This is a helper any server test imports directly, not a
global setup file (`tests/setup.ts` stays client-only, wired to jsdom/testing-library via
`vitest.client.config.ts` — the server config has no `setupFiles` entry).

```typescript
import { createTestDb, closeTestDb } from "../db/testDb";

let db: TestDb;
beforeEach(() => { db = createTestDb(); /* create tables */ });
afterEach(() => { closeTestDb(db); });
```

**CI:** no changes needed. SQLite in-memory requires no external service — `test-server` in
`.github/workflows/ci.yml` already runs `npm run test:server`, which is sufficient.

Schema/migration tooling (for `Ante-S1-DB-Schema`'s actual tables) is a separate decision — this
ticket only proves the DB round-trips inside a test, it doesn't pick an ORM or migration framework.

---

## Build & Deployment

### Build Commands

```bash
npm run build           # Full production build
npm run build:client    # Frontend only (Vite)
npm run build:server    # Backend only (esbuild)
```

### Output Structure

```
dist/
├── client/             # Static frontend assets
│   ├── index.html
│   └── assets/
└── server/
    └── server.cjs      # Bundled server
```

### Docker

```bash
docker build -t my-app .
docker run -p 3000:3000 -e NODE_ENV=production my-app
```

### Environment Detection

The app detects deployment platform automatically:

- **Vercel**: `VERCEL_ENV`
- **Render**: `RENDER`
- **Fly.io**: `FLY_APP_NAME`
- **Local**: Fallback

---

## Extending Ante

### Adding a New API Endpoint

1. **Create route file** (`src/server/routes/usersRoutes.ts`):

```typescript
import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { userService } from "../services/userService";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.json(users);
  })
);

export default router;
```

2. **Register in apiRoutes.ts**:

```typescript
import usersRoutes from "./usersRoutes";
router.use("/users", usersRoutes);
```

3. **Create service** (`src/server/services/userService.ts`):

```typescript
class UserService {
  async getAll(): Promise<User[]> {
    // Business logic here
  }
}
export const userService = new UserService();
```

### Adding a Feature Flag

1. **Add to `.env`**:

```
ENABLE_NEW_FEATURE=false
```

2. **Register flag** in `middleware/featureFlags.ts`:

```typescript
const featureFlags = {
  newFeature: () => process.env.ENABLE_NEW_FEATURE === "true",
};
```

3. **Protect route**:

```typescript
router.get("/new", requireFeature("newFeature"), handler);
```

### Adding External API Integration

1. **Create HTTP client**:

```typescript
// services/externalApi.ts
import { createHttpClient } from "./httpClient";

export const externalApi = createHttpClient({
  baseURL: process.env.EXTERNAL_API_URL,
  timeout: 15000,
});
```

2. **Use with retry** (if needed):

```typescript
import { withRetry } from "../utils/resilience";

const data = await withRetry(() => externalApi.get("/endpoint"), { maxRetries: 3 });
```

---

## Quick Reference

### Port Conventions

| Service           | Port |
| ----------------- | ---- |
| Vite (Frontend)   | 5173 |
| Express (Backend) | 3000 |
| Node Inspector    | 9229 |

### Key Scripts

| Command              | Purpose               |
| -------------------- | --------------------- |
| `npm run dev`        | Start development     |
| `npm run build`      | Production build      |
| `npm test`           | Run tests             |
| `npm run type-check` | TypeScript validation |
| `npm run lint`       | ESLint check          |

### File Naming Conventions

| Pattern       | Location    | Purpose          |
| ------------- | ----------- | ---------------- |
| `*Routes.ts`  | `routes/`   | HTTP endpoints   |
| `*Service.ts` | `services/` | Business logic   |
| `*.test.ts`   | Co-located  | Test files       |
| `*.tsx`       | `client/`   | React components |

---

_Last updated: December 2024_
