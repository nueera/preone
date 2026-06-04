# Task: Create Onboarding Wizard Shell & Progress Bar

## Summary

Created the complete onboarding wizard shell component and progress bar for the PreOne school onboarding wizard. All 4 requested files plus supporting files were created successfully.

## Files Created

### 1. `/src/components/onboarding/progress-bar.tsx`

- `OnboardingProgressBar` component with Framer Motion animation
- Configurable: `size` (sm/md/lg), `showLabel`, `totalSteps`
- Uses `--preone-primary` gradient for the bar fill
- Smooth animated transitions between steps

### 2. `/src/components/onboarding/wizard-shell.tsx`

- `WizardShell` main wizard wrapper component
- Sticky header with logo, save indicator, step navigation buttons
- Step indicators with completed/current/clickable states
- Integrated `OnboardingProgressBar` in header
- Animated step content transitions with `AnimatePresence`
- Sticky bottom navigation with Back/Next/Launch buttons
- Proper ARIA attributes for accessibility
- Responsive design with mobile-friendly touch targets (44px min)
- Safe area inset support for notched devices

### 3. `/src/app/admin/onboarding/page.tsx`

- Main wizard entry point (full-page, no admin sidebar/header)
- Fetches `/api/onboarding/status` on mount
- Initializes Zustand store with draft data
- Auto-save interval (every 30s)
- `beforeunload` guard for unsaved changes
- Redirects to dashboard if onboarding already complete
- Shows loading skeleton while fetching
- Welcome card with "Let's Begin" CTA

### 4. `/src/app/admin/onboarding/step/[step]/page.tsx`

- Dynamic step page using `useParams()` for step number
- Step validation (1-8 range, redirect on invalid)
- Maps step number to step component (placeholder for now)
- `StepPlaceholder` component with step metadata (icon, color, description)
- Auto-save with 2-second debounce on step change
- Navigation handlers (step click, next, back)
- Loading state while fetching initial data

## Supporting Files Created

### `/src/lib/stores/onboarding-store.ts`

- Zustand store for onboarding state management
- Complete `OnboardingDraft` interface with all step data
- Actions: initialize, updateDraft, updateDraftBatch, completeStep, setCurrentStep, setSaving, markSaved, completeOnboarding, reset
- Dirty tracking, last saved timestamp, saving state

### `/src/app/api/onboarding/status/route.ts`

- GET handler returning onboarding status and draft data
- POST handler for saving drafts (auto-save)
- Mock responses (ready for database integration)

## Modified Files

### `/src/app/admin/layout.tsx`

- Added conditional rendering to skip sidebar/header for `/admin/onboarding` routes
- Onboarding routes render standalone with just `data-portal` wrapper
- Preserves admin layout for all other admin routes

## Design System Compliance

- Uses CSS variables: `--preone-primary`, `--text-primary`, `--bg-primary`, etc.
- Uses `PreOneCard` from `@/components/ui/preone-card`
- Framer Motion animations throughout
- 16px min border-radius (rounded-xl / 2xl)
- Purple/indigo primary color (#6366F1)
- Poppins for headings, Inter for body text
- Safe area insets for mobile devices
- 44px min touch targets for accessibility

## Verification

- `bun run lint` — 0 errors (5 pre-existing warnings unrelated to new code)
- All routes return HTTP 200
- Dev server compiles successfully
