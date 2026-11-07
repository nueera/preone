# PreOne — Production Infrastructure Guide

## Quick Start

### Development (with Docker for PostgreSQL + Redis)

```bash
# 1. Start PostgreSQL and Redis containers
npm run docker:dev

# 2. Run Prisma migrations
npx prisma migrate dev

# 3. Seed the database
npm run db:seed

# 4. Start the Next.js dev server
npm run dev
```

### Production (Full Docker Stack)

```bash
# 1. Copy and edit production env
cp .env.production .env.prod.local
# Edit .env.prod.local with your secure values!

# 2. Build and start all services
npm run docker:up

# 3. Run migrations
npm run docker:migrate

# 4. Seed the database (first time only)
npm run docker:seed
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL│  │  Redis   │  │  Next.js App         │  │
│  │  :5432   │  │  :6379   │  │  :3000               │  │
│  │          │  │          │  │  (Socket.io + API)    │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│       │              │                  │                │
│       └──────────────┴──────────────────┘                │
│              Internal communication                      │
└─────────────────────────────────────────────────────────┘
```

## Docker Services

| Service  | Image              | Port | Purpose                                   |
| -------- | ------------------ | ---- | ----------------------------------------- |
| postgres | postgres:16-alpine | 5432 | Primary database                          |
| redis    | redis:7-alpine     | 6379 | Caching, session store, Socket.io adapter |
| app      | Next.js (custom)   | 3000 | Web application + Socket.io               |
| migrate  | Next.js (custom)   | —    | One-shot Prisma migration runner          |

## Environment Variables

| Variable               | Required | Description                              |
| ---------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`         | ✅       | PostgreSQL connection string             |
| `JWT_SECRET`           | ✅       | HMAC-SHA256 signing key (min 32 chars)   |
| `JWT_EXPIRY`           | ❌       | Token expiry (default: 24h)              |
| `NEXT_PUBLIC_APP_URL`  | ❌       | Public app URL                           |
| `NEXT_PUBLIC_APP_NAME` | ❌       | App display name                         |
| `REDIS_URL`            | ❌       | Redis connection string                  |
| `SOCKET_CORS_ORIGINS`  | ❌       | Socket.io CORS (comma-separated origins) |

## Database Migrations

```bash
# Create a new migration
npm run db:migrate:create -- add_new_table

# Apply migrations in development
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Reset database (development only!)
npm run db:reset
```

## CI/CD Pipeline (GitHub Actions)

The pipeline runs on every push to `main` or `develop`:

1. **Lint & Type Check** — ESLint + TypeScript validation
2. **Unit Tests** — Vitest with SQLite in-memory DB
3. **Build** — Next.js production build
4. **Docker Build & Push** — Build and push to GHCR (main only)
5. **Deploy** — Placeholder for production deployment

### Required GitHub Secrets

| Secret         | Description                     |
| -------------- | ------------------------------- |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

### Required GitHub Variables (for deployment)

| Variable              | Description               |
| --------------------- | ------------------------- |
| `DATABASE_URL`        | Production PostgreSQL URL |
| `JWT_SECRET`          | Production signing key    |
| `NEXT_PUBLIC_APP_URL` | Production app URL        |

## Migration from SQLite to PostgreSQL

The project has been migrated from SQLite to PostgreSQL:

1. **Prisma schema** updated from `provider = "sqlite"` to `provider = "postgresql"`
2. **Initial migration** created at `prisma/migrations/00000000000000_init/`
3. **All enum types** now use native PostgreSQL enums
4. **Foreign keys** properly enforced with referential integrity
5. **Indexes** added for query performance on large tables

### Breaking Changes

- `DATABASE_URL` format changed from `file:./dev.db` to `postgresql://user:pass@host:5432/db`
- Enum values are now enforced at the database level (not just in Prisma)
- DateTime fields now use `TIMESTAMP(3)` for microsecond precision
