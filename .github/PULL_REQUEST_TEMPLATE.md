<!--
  PreOne Pull Request
  Keep PRs focused — one feature or fix per PR (see CONTRIBUTING.md).
-->

## Description

<!-- What does this PR do, and why? -->

## Related Issues

<!-- e.g. "Fixes #42" / "Closes #7". Delete if none. -->

## Type of Change

<!-- Check all that apply — should match your Conventional Commit type. -->

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `docs` — Documentation
- [ ] `style` — Formatting only (no logic change)
- [ ] `refactor` — Refactor (no behavior change)
- [ ] `perf` — Performance improvement
- [ ] `test` — Tests
- [ ] `build` / `ci` — Build system or CI
- [ ] `chore` — Other maintenance

## Affected Area

<!-- Portal(s) and/or module(s): admin / teacher / parent, api, db, auth, crm, notifications, fees, growth... -->

## Screenshots

<!-- For UI changes, add before/after screenshots or a short clip. Delete if not applicable. -->

## Checklist

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes — **check this separately; the build ignores type errors**
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] DB schema changes include a Prisma migration (`npm run db:migrate`) and are reflected in `prisma/schema.prisma`
- [ ] Self-reviewed the diff; PR is focused on a single concern
