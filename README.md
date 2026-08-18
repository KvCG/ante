# Ante

Social accountability PWA. Full-stack TypeScript — React 18 + Vite frontend / Express backend.

## Quick Start

```bash
git clone <repo-url> ante
cd ante
npm install
cp .env.example .env

npm run dev
```

**Development URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Scripts

| Script                | Description                     |
| --------------------- | ------------------------------- |
| `npm run dev`         | Frontend + backend concurrently |
| `npm run dev:client`  | Frontend only                   |
| `npm run dev:server`  | Backend only                    |
| `npm run build`       | Production build                |
| `npm run test`        | Run all tests                   |
| `npm run test:client` | Run client tests                |
| `npm run test:server` | Run server tests                |
| `npm run type-check`  | TypeScript type checking        |
| `npm run lint`        | Run ESLint                      |

## Architecture Patterns

### Service → Route

API endpoints follow a layered pattern:

```
Route Handler → Service (business logic) → Data Source
```

### Utilities

Simple async utilities:

- `delay(ms)` - Promise-based delay
- `withRetry(fn, options)` - Retry with exponential backoff
- `withTimeout(fn, ms)` - Timeout wrapper

### Feature Flags

Environment-based feature flags:

```typescript
router.get('/beta', requireFeature('betaFeatures'), handler)
```

## Debugging

### VS Code Launch Configurations

- **Debug Server (Launch)**: Fresh server start with debugger
- **Attach to Backend**: Attach to running nodemon process
- **Debug Frontend (Chrome/Edge)**: Browser debugging
- **Debug Fullstack**: Both frontend and backend simultaneously

### Debug Workflow

1. Run `npm run dev` to start development servers
2. Open VS Code debugger (F5)
3. Select "Attach to Backend" or "Debug Fullstack"
4. Set breakpoints in `src/server/**/*.ts` or `src/client/**/*.tsx`

## Adding New Features

### New API Endpoint

1. Create route in `src/server/routes/`
2. Create service in `src/server/services/`
3. Add validation schema with Zod
4. Register in `apiRoutes.ts`

### New Feature Flag

1. Add to `middleware/featureFlags.ts`
2. Set in `.env`: `ENABLE_FEATURE_NAME=true`
3. Apply middleware: `requireFeature('featureName')`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_EXAMPLE_FEATURE=true
```

## Testing

- **Client tests**: Vitest + React Testing Library (jsdom)
- **Server tests**: Vitest (Node environment)
- **API mocking**: MSW handlers in `tests/mocks/`

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:client -- --coverage


```

## Testing DB

`npm test` runs client (jsdom) and server (node) suites. No external services required — the
server test DB is in-memory SQLite (`better-sqlite3`), created fresh per test via
`tests/server/db/testDb.ts`. See [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md#test-database)
for the rationale.

For architecture and patterns, see [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Deployment

### Docker

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

### Environment Detection

The app automatically detects deployment environment:

- Vercel (`VERCEL_ENV`)
- Render (`RENDER`)
- Fly.io (`FLY_APP_NAME`)
- Local development (fallback)

## Key Files Reference

| File                                    | Purpose                     |
| --------------------------------------- | --------------------------- |
| `src/server/middleware/errorHandler.ts` | Global error handling       |
| `src/server/middleware/featureFlags.ts` | Feature flag middleware     |
| `src/server/utils/resilience.ts`        | Retry and timeout utilities |
| `src/server/logging/logger.ts`          | Pino structured logging     |
| `src/shared/runtimeEnv.ts`              | Environment detection       |

## Documentation

For a comprehensive guide to the architecture and patterns, see [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## License

MIT
