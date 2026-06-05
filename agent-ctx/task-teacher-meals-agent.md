# Task: Create 2 Teacher Meal Pages

## Summary

Created two fully functional Next.js App Router pages for the PreOne Meal &amp; Nutrition system's teacher portal:

### Files Created

1. **`/home/z/my-project/src/app/teacher/meals/page.tsx`** — Daily Meal Tracking page
2. **`/home/z/my-project/src/app/teacher/meals/allergy-alerts/page.tsx`** — Class Allergy Alerts page

### Features Implemented

#### Page 1: Daily Meal Tracking (`/teacher/meals`)

- **Header**: "Today's Meals" title with date display, class name, and link to Allergy Alerts page
- **Allergy Alert Banner**: Prominent red banner showing count of students with allergies, expandable list with student avatars, allergen tags, and severity badges
- **Today's Meal Plan**: 4 MealCard components (Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack) in detailed variant, with allergen conflict warnings below cards
- **Meal Feedback Form**: Uses MealFeedbackForm component, loads class students, pre-fills with today's meal plan items, quick-fill buttons (All 100%, All 50%), Reset
- **API Integration**: GET /api/teacher/class, GET /api/meal-plans?status=PUBLISHED&from=TODAY&to=TODAY, GET /api/meal-plans/[id]/items, GET /api/students/[id]/allergies, POST /api/meal-feedback
- **State Management**: useState + useEffect with useCallback for data fetching
- **Loading/Error States**: Skeleton loaders, error state with retry button
- **Toast Notifications**: Success "Meal feedback saved!" on submit, error toast on failure

#### Page 2: Class Allergy Alerts (`/teacher/meals/allergy-alerts`)

- **Header**: "Class Allergy Alerts" with back navigation, class name, student count, Print Emergency Cards button
- **Class Allergy Roster Table**: Desktop table + mobile cards, student photo/name, allergy list with AllergenTag, reaction info, AllergyBadge severity, verification status — sorted by severity (critical first)
- **Meal Conflict Matrix**: Grid with today's meals as columns, students as rows; color-coded cells (Red=conflict, Yellow=may contain, Green=safe), legend
- **Quick Reference Emergency Cards**: One per severely allergic student — photo, name, class, allergens with severity badges, reaction symptoms, emergency action (EpiPen/doctor info), parent phone number
- **Print Support**: Print Emergency Cards button triggers window.print()
- **API Integration**: Same data fetching pattern as Page 1
- **Responsive**: Mobile-first with responsive breakpoints

### Design System

- Dark cosmic theme consistent with teacher portal
- Teal/cyan accent colors (gradient from-teal-500 to-cyan-500)
- Red accent for allergy alerts (gradient from-red-500 to-orange-500)
- Uses framer-motion for page transitions and element animations
- Uses date-fns for date formatting
- Uses sonner for toast notifications
- All meal components from @/components/meals/\* properly imported and used

### Verification

- ESLint: Passed with no errors
- TypeScript: No errors in created files
- Dev server: Pages compile and serve correctly (307 redirect to login for unauthenticated access, as expected)
