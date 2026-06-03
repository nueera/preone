# Contributing to PreOne

Thank you for contributing to PreOne! We appreciate your time and effort to help make this project better. This guide will walk you through the process of contributing.

---

## How to Contribute

1. **Fork** the repository on GitHub
2. **Branch** — Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Commit** — Make your changes and commit with a descriptive message (see Commit Convention below)
4. **Push** — Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
5. **Pull Request** — Open a PR against the `main` branch of the original repository

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/nueera/preone.git

# Navigate into the project directory
cd preone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma db push
npx prisma generate

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Code Style

- **TypeScript**: Strict mode is enabled. All code must be properly typed — avoid `any` wherever possible.
- **ESLint**: The project uses ESLint. Run `npm run lint` before committing to ensure no lint errors.
- **Prettier**: Code formatting is enforced via Prettier. Run `npm run format` to auto-format.
- **Tailwind CSS**: Use utility-first approach. Avoid custom CSS unless absolutely necessary.
- **shadcn/ui**: Use existing shadcn/ui components. If a new component is needed, add it via the shadcn CLI rather than building from scratch.

---

## Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Description |
|--------|-------------|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `chore:` | Maintenance tasks (build, dependencies, etc.) |
| `docs:` | Documentation changes |
| `style:` | Code style changes (formatting, whitespace) |
| `refactor:` | Code refactoring without behavior changes |
| `test:` | Adding or updating tests |

Examples:
```
feat: add daily update module for teacher portal
fix: resolve attendance date filtering issue
chore: update dependencies
docs: update API reference for fees module
style: format admin dashboard components
refactor: extract shared notification logic
test: add unit tests for growth tracking
```

---

## Pull Request Process

1. **Describe your changes** — Provide a clear description of what the PR does and why.
2. **Link related issues** — Reference any relevant issues (e.g., `Fixes #42`).
3. **Screenshots for UI changes** — If your PR includes visual changes, add before/after screenshots.
4. **Verify the build** — Ensure the project builds and lints successfully:
   ```bash
   npm run build
   npm run lint
   ```
5. **Keep PRs focused** — One feature or fix per PR. Avoid mixing unrelated changes.
6. **Review** — At least one maintainer review is required before merging.

---

## Project Architecture

### Three Portals

PreOne is organized into three distinct portals, each with its own routing and layout:

| Portal | Route Prefix | Description |
|--------|-------------|-------------|
| **Admin** | `/admin/*` | School administration, management, and configuration |
| **Teacher** | `/teacher/*` | Classroom management, daily updates, and observations |
| **Parent** | `/parent/*` | Child monitoring, payments, and communication |

### Key Architectural Decisions

- **App Router**: Uses Next.js App Router with nested layouts for each portal
- **Prisma ORM**: Database access through Prisma with type-safe queries
- **Role-based Auth**: Custom JWT authentication (HMAC-SHA256) with four user roles (Super Admin, Admin, Teacher, Parent)
- **Server Components**: Prefer server components by default; use client components only when interactivity is needed
- **API Routes**: RESTful API routes organized by domain module

---

## Directory Guidelines

| Directory | Purpose |
|-----------|---------|
| `src/app/admin/` | Admin portal pages and layouts |
| `src/app/teacher/` | Teacher portal pages and layouts |
| `src/app/parent/` | Parent portal pages and layouts |
| `src/app/api/` | API route handlers, grouped by module (e.g., `api/students/`, `api/fees/`) |
| `src/components/ui/` | Shared UI components (shadcn/ui) |
| `src/components/` | Portal-specific or feature-specific components |
| `src/lib/` | Utility functions, auth helpers, database client, and shared logic |
| `src/hooks/` | Custom React hooks |
| `src/types/` | TypeScript type definitions and interfaces |
| `prisma/` | Prisma schema and migrations |

### Adding a New Component

1. If it's a reusable UI primitive, add it to `src/components/ui/` via the shadcn CLI
2. If it's a feature-specific component, place it in `src/components/` under a descriptive folder or file
3. If it's portal-specific, consider placing it alongside the portal page that uses it

### Adding a New API Route

1. Create the route file under `src/app/api/<module>/route.ts`
2. Follow RESTful conventions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
3. Always validate input and check authentication/authorization
4. Return appropriate HTTP status codes

---

## Reporting Bugs

We use GitHub Issues to track bugs. When reporting a bug, please include:

1. **Description** — A clear description of the bug
2. **Steps to Reproduce** — Detailed steps to trigger the issue
3. **Expected Behavior** — What you expected to happen
4. **Actual Behavior** — What actually happened
5. **Screenshots** — If applicable
6. **Environment** — Browser, OS, Node.js version
7. **Additional Context** — Any other relevant information

Open a new issue at [https://github.com/nueera/preone/issues](https://github.com/nueera/preone/issues).

---

Thank you for contributing to PreOne! 🎉
