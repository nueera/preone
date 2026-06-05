# Onboarding Steps 1-4 Implementation

## Task

Create the first 4 step components for the PreOne onboarding wizard.

## Files Created

1. `/src/components/onboarding/steps/school-profile-step.tsx` — Step 1: School Profile form
2. `/src/components/onboarding/steps/branch-setup-step.tsx` — Step 2: Branch/Campus Setup
3. `/src/components/onboarding/steps/academic-year-step.tsx` — Step 3: Academic Year + Classes
4. `/src/components/onboarding/steps/subjects-step.tsx` — Step 4: Subjects per Class

## File Modified

- `/src/app/admin/onboarding/step/[step]/page.tsx` — Added imports and wired steps 1-4 to replace placeholders

## Key Decisions

- All components are `'use client'` with named + default exports
- Used `useOnboardingStore` for state management with `updateDraft`/`updateDraftBatch`/`completeStep`
- IDs generated with `crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)`
- Used PreOne design tokens (`--preone-primary`, `--bg-primary`, `--text-primary`, etc.)
- Used `<PreOneCard>` component for all card sections
- Used `toast` from `sonner` for success messages
- Used Framer Motion for staggered animations
- Fixed lint errors: avoided `setState` calls inside `useEffect` by using computed values

## Lint Status

- 0 errors, 5 pre-existing warnings (unused eslint-disable directives in other files)
