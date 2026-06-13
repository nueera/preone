# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PreOne — an all-in-one preschool operating system (ERP + communication + growth tracking). Single Next.js 16 (App Router) app serving three role-based portals plus a REST API, with real-time features over Socket.io.

## Commands

```bash
npm run dev            # Start dev server (runs tsx server.ts — NOT `next dev`, see below)
npm run build          # Next.js production build (standalone output)
npm start              # Production server (NODE_ENV=production tsx server.ts)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit — REQUIRED separately; build ignores type errors (see Gotchas)
npm test               # Vitest run (jsdom)
npm run test:watch     # Vitest watch
npm run test:coverage  # Vitest with coverage

# Run a single test file / test name:
npx vitest run src/lib/__tests__/auth.test.ts
npx vitest run -t "verifyToken"

# Database (Prisma + PostgreSQL)
npm run docker:dev     # Start Postgres 16 + Redis 7 containers (dev dependencies)
npm run db:migrate     # prisma migrate dev
npm run db:push        # prisma db push (no migration file)
npm run db:seed        # Seed sample data (uses bun: bun run prisma/seed.ts)
npm run db:studio      # Prisma Studio
npm run db:reset       # Reset DB (dev only)

# Commits — Conventional Commits enforced (commitlint + husky)
npm run commit         # Commitizen interactive prompt
```

**Typical dev startup:** `npm run docker:dev` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`.

Default seeded logins: `admin@preone.com` / `admin123`, `teacher@preone.com` / `teacher123`, `parent@preone.com` / `parent123`.

## Architecture

### Custom server (important)
`dev` and `start` run **`tsx server.ts`**, not the Next CLI. `server.ts` wraps the Next request handler in a Node HTTP server so **Socket.io** (`src/lib/socket.ts`) can attach at path `/api/socketio`. Running `next dev` directly works for pages but **skips Socket.io** (real-time chat, notifications). Always use `npm run dev`.

### Three portals, one app
Routes are grouped by role under `src/app/`: `admin/`, `teacher/`, `parent/`. Each has its own `layout.tsx` + `*-layout-client.tsx`. The API lives under `src/app/api/<module>/route.ts`, grouped by domain (students, fees, growth, crm, chat, communication, etc.).

`TASK_MASTER` has **no separate portal** — it uses the `/admin` portal, restricted by middleware to a few prefixes (`/admin/dashboard`, `/admin/admissions`, `/admin/communication/*`). See `TASK_MASTER_ALLOWED_PREFIXES` in `src/middleware.ts`.

Admin routes were reorganized; old paths redirect via `LEGACY_REDIRECTS` in `src/middleware.ts` (e.g. `/admin/crm` → `/admin/admissions`, `/admin/attendance` → `/admin/operations/attendance`, `/admin/growth` → `/admin/growth-passport`). Prefer the new paths when adding links.

### Authentication — custom, NOT next-auth
Despite `next-auth` being a dependency, auth is a **custom HMAC-SHA256 token**, not a standard JWT and not next-auth. Token format is `base64url(payload).hexHmacSignature` with an `expiresAt` field (24h). The signing secret is `JWT_SECRET` (falls back to `TOKEN_SECRET`, then a hardcoded dev default).

There are **two copies of sign/verify that must stay in sync**:
- `src/lib/auth.ts` — Node `crypto` (`createHmac`). Used in API routes and server code.
- `src/middleware.ts` and `src/lib/socket.ts` — Web Crypto API (`crypto.subtle`), Edge-compatible. Used in middleware and socket handshake.

If you change the token shape or signing, update **all three**.

The token is stored in **two places**: a `preone_token` **cookie** (read by middleware for page-route auth) and **localStorage** (read by the client fetch helpers for the `Authorization: Bearer` header). Both must be set on login and cleared on logout.

### Auth enforcement is layered
1. **`src/middleware.ts`** runs on every route. Page routes → cookie check → redirect to `/login`. API routes → `Authorization: Bearer` → 401/403. It applies a **coarse** role gate via `API_ROUTE_RULES` and injects `x-user-id` / `x-user-email` / `x-user-role` / `x-branch-id` headers.
2. **Per-route helpers in `src/lib/auth.ts`** re-verify the Bearer token inside the handler (they do **not** trust the injected headers). `requireAdmin`/`requireRole`/etc. return `TokenPayload | NextResponse` — guard with `if (result instanceof NextResponse) return result;`.
3. **`src/lib/api-auth.ts`** richer helpers (`requireTeacher`, `requireParent`) do a DB lookup and return structured data (`teacher` + class, or `parent` + children) or `{ error }`. Check with `isAuthError(result)`. Use `verifyChildAccess()` to confirm a parent owns a given `childId`.

### Roles (watch the naming)
The Prisma `Role` enum and `src/lib/auth.ts` use **UPPERCASE**: `ADMIN`, `TEACHER`, `PARENT`, `TASK_MASTER`. The middleware's `API_ROUTE_RULES` use **PascalCase** (`Admin`, `Teacher`, `TaskMaster`) plus a `SuperAdmin` value that does **not** exist in the Prisma enum — there's a `roleMap` translating between the two. When touching role logic, mind which convention the file uses.

### Multi-tenancy: School → Branch → data
Data is scoped by `schoolId` and `branchId`. **Every admin data query must apply branch isolation** via `src/lib/branch.ts`:
- `getBranchFromRequest(request, user)` → `BranchScope` (admins with no branch see all and may filter via `?branchId=`).
- Spread one of these into the Prisma `where`:
  - `withSchoolBranchFilter(scope)` — models with both `schoolId` and `branchId` columns (User, Branch, CrmTask).
  - `withBranchViaRelationFilter(scope)` — models with `branchId` only, scoped to school via the `branch` relation (Student, Teacher, Class, Program).
  - `withBranchFilter(scope)` — branch-only filter.

### API route conventions
Two patterns coexist:
- **Manual** `try/catch` with an early `requireAdmin`/`requireRole` return (see `src/app/api/students/route.ts`).
- **`apiHandler()`** wrapper (`src/lib/api-handler.ts`) that auto-formats Zod / Prisma / auth errors and logs via `src/lib/error-logger.ts`.

Mutations should write an audit entry with `auditLog.create(...)` from `src/lib/audit.ts` (wrapped in its own try/catch so audit failure never breaks the request).

### Notifications
**Never create `Notification` records directly via Prisma.** Always go through `src/lib/notifications.ts` (`createNotification`, `createBulkNotifications`, `NotificationTemplates`).

### Client-side data fetching
Portal pages use per-role fetch wrappers — `parentFetch`/`parentGet`/`parentPost` in `src/lib/parent-api.ts`, and the teacher equivalents in `src/lib/teacher-api.ts`. They inject the Bearer token from localStorage and handle 401 (→ `/login`) and 403 (→ role dashboard) automatically. Use these instead of raw `fetch` in portal code. TanStack Query + Zustand stores (`src/lib/stores/`) manage client state.

### Database
PostgreSQL via Prisma (migrated from SQLite). Schema is `prisma/schema.prisma` (~45 models). The Prisma client singleton is `src/lib/db.ts`, exported as both `db` and `prisma`. Note `db/custom.db` is a **leftover SQLite file** from before the Postgres migration — not used by the app.

## Gotchas

- **`next.config.ts` sets `typescript.ignoreBuildErrors: true`** and `reactStrictMode: false`. `npm run build` will **not** fail on type errors — run `npm run typecheck` separately. (CI runs typecheck with `continue-on-error: true`, so type errors won't fail CI either.)
- **Both `bun.lock` and `package-lock.json` exist.** `db:seed` and the Prisma seed config use `bun`; CI uses `npm ci`. Bun is required for seeding.
- **CI tests/build use a SQLite `DATABASE_URL` (`file:./test.db`)** while the app/schema target PostgreSQL — keep unit tests DB-agnostic or mocked (coverage targets `src/lib/**` and `src/app/api/**`).
- **`mini-services/` is an empty placeholder** (with build/start scripts in `.zscripts/`) — intended for future extracted services.
- Path alias: **`@/*` → `src/*`** (configured in `tsconfig.json` and `vitest.config.ts`).
- Pre-commit runs `lint-staged` (eslint --fix on `*.{ts,tsx}`, prettier on `*.{json,md}`); commit-msg runs commitlint. Commit messages must follow Conventional Commits.
