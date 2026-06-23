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

| Script | Description |
| --- | --- |
| `npm run dev` | Frontend + backend concurrently |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | Backend only |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run test:client` | Run client tests |
| `npm run test:server` | Run server tests |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | Run ESLint |

For architecture and patterns, see [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).
