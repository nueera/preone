# Parent Meals & Allergies Pages — Task Complete

## Task ID: parent-meals-pages

## Summary

Created 2 parent meal pages for the PreOne Meal & Nutrition system with full API integration, state management, loading states, and error handling.

## Files Created

1. `/home/z/my-project/src/app/parent/meals/page.tsx` — Parent Meal View page
2. `/home/z/my-project/src/app/parent/meals/allergies/page.tsx` — Allergy Management page

## Files Modified

1. `/home/z/my-project/src/components/parent-sidebar.tsx` — Added "Meals" nav item with Utensils icon
2. `/home/z/my-project/src/components/parent-header.tsx` — Added "meals" and "allergies" to PATH_LABELS for breadcrumbs

## Page 1: Parent Meal View (`/parent/meals/page.tsx`)

### Features Implemented:

- **Header**: "My Child's Meals" title with child selector (dropdown if multiple children), refresh button, and allergies link
- **Allergy Warning Banner**: Shows when child has active allergies, displays AllergyBadge severity + AllergenTag for each, with safety message
- **Today's Meal Card** (prominent): Shows today's meals by type (Breakfast/Snack/Lunch/Snack), includes:
  - Dish name, calories badge, vegetarian indicator
  - Allergy conflict overlay with red X icon and conflicting allergen names
  - Safe alternative display with green checkmark when available
  - Teacher feedback (rating stars, eaten % bar, comments) when available
- **This Week's Menu**: Uses MealPlanGrid component (read-only), with conflict warnings and allergy-aware rendering
- **Allergy Management Section**: Lists current allergies with severity badges, verification status, "Add Allergy" dialog with full form (allergen dropdown, severity selector, reaction, notes)
- **Nutrition Summary**: Average eaten %, rating, feedback count cards, NutritionBar components, nutritional messages
- **Feedback History**: Past week's meal ratings and eaten percentages with animated bars

### API Calls:

- `GET /api/parent/meals?studentId=XXX` — Main data source
- `POST /api/students/[id]/allergies` — Add new allergies

## Page 2: Allergy Management (`/parent/meals/allergies/page.tsx`)

### Features Implemented:

- **Header**: Back button to meals page, title, child selector, "Add Allergy" button
- **Tabbed Interface**: 3 tabs — Current Allergies, Meal Safety, Emergency Card
- **Current Allergies Tab**:
  - Unverified allergies alert banner with batch verify buttons
  - Allergy cards with: AllergenTag + AllergyBadge, reaction, diagnosis info (doctor + date), action plan, notes
  - Verification status with green checkmark or yellow "Verify" button
  - Deactivate (outgrown) with confirmation dialog
- **Add New Allergy Dialog**: Full form with 17 allergen options (with emojis), severity selector with descriptions, reaction, notes, doctor name, diagnosis date, action plan
- **Meal Safety Report Tab**:
  - Summary cards: Safe meals count, Unsafe meals count, Safety rate %
  - Detailed report grouped by day, showing each meal with safe/unsafe status
  - Conflicting allergen tags for unsafe meals, safe alternative display
- **Emergency Card Tab**:
  - Printable emergency allergy card with: ALLERGY ALERT header, child photo/name, allergies with severity badges, reaction symptoms, emergency action plans, parent contact
  - Print button that opens print dialog in new window

### API Calls:

- `GET /api/students/[id]/allergies` — Fetch allergy list
- `GET /api/parent/meals?studentId=XXX` — Fetch meal safety report data
- `POST /api/students/[id]/allergies` — Add new allergy
- `DELETE /api/students/[id]/allergies?allergen=XXX` — Deactivate allergy

## Design System

- Cosmic dark theme with warm purple/rose accent colors matching parent portal
- Uses existing meal components: MealCard, AllergyBadge, AllergenTag, NutritionBar, MealPlanGrid
- framer-motion animations for fade-in, stagger, and progress bars
- sonner toast for success/error feedback
- date-fns for date formatting
- Responsive design with mobile-first approach

## Quality Checks

- ✅ ESLint: No errors
- ✅ TypeScript: No type errors in created files
- ✅ Dev server: Running successfully
- ✅ Auth: Pages redirect to login when not authenticated (307 redirect)
