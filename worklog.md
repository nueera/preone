---

Task ID: 1
Agent: Main
Task: Fix PreOne Onboarding Wizard visibility in admin portal

Work Log:

- Analyzed the full onboarding codebase: 8 step components, 17 API routes, Zustand store, wizard-shell, progress-bar
- Identified critical bug: ALL fetch calls in onboarding pages missing Authorization header
- Identified stale localStorage cache preventing redirect in admin layout
- Identified missing POST handler in /api/onboarding/draft route
- Enhanced /api/onboarding/complete to actually create real records (branches, programs, classes, teachers, students, parents, daily update config)

Fixes Applied:

1. `src/app/admin/onboarding/page.tsx` - Added getAuthHeaders() helper, fixed all fetch calls to include auth tokens, changed auto-save to POST /api/onboarding/draft
2. `src/app/admin/onboarding/step/[step]/page.tsx` - Added getAuthHeaders() helper, fixed fetch calls with auth tokens
3. `src/app/admin/layout.tsx` - Removed stale localStorage cache check that prevented redirect, now always checks API
4. `src/app/api/onboarding/draft/route.ts` - Added POST handler for auto-save, syncs school profile data alongside draft
5. `src/app/api/onboarding/complete/route.ts` - Complete rewrite: creates real DB records from draft (branches, programs, classes, teachers, students, parents, daily update config)
6. `src/components/onboarding/steps/review-launch-step.tsx` - Added auth headers to launch fetch
7. `src/components/onboarding/steps/teachers-step.tsx` - Added auth headers to CSV import
8. `src/components/onboarding/steps/students-step.tsx` - Added auth headers to CSV import

Stage Summary:

- All onboarding fetch calls now properly include Bearer token authorization
- Admin layout always checks API for onboarding status (no stale cache blocking)
- Draft API now supports POST for auto-save and syncs school data
- Complete API now creates actual database records from wizard data
- Build passes successfully with all routes visible
