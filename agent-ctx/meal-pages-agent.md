# Task: Create 7 Admin Meal Pages for PreOne Meal & Nutrition System

## Summary

Successfully created 7 comprehensive admin meal pages for the PreOne Meal & Nutrition system. All pages compile and lint cleanly.

## Files Created

### 1. `/src/app/admin/meals/items/page.tsx` — Meal Item Library

- Quick stats cards (Total Items, Breakfast/Snack/Lunch counts, Most Used)
- Filter bar with Meal Type, Category, Veg/Vegan/Allergen-Free toggles, Search
- MealCard grid in 'compact' variant with AnimatePresence
- Create/Edit Meal Item Dialog with:
  - Basic info (name, description, image, meal type, dietary toggles)
  - Expandable Nutrition section (9 nutrition fields)
  - Allergen checkboxes split into "Contains" and "May Contain" columns (17 allergens)
  - Dynamic Ingredients section (add/remove rows)
  - Category, Cuisine, Tags, Prep/Cook time, Cost per serving
- Pagination, debounced search, loading skeletons
- API: GET/POST `/api/meal-items`, PATCH/DELETE `/api/meal-items/[id]`

### 2. `/src/app/admin/meals/plans/page.tsx` — Meal Plan Dashboard

- Quick stats (Active Plans, Upcoming Drafts, Avg Daily Cal, Total)
- Current Week Card (highlighted published plan for current week)
- Plan list cards with status badges (DRAFT=yellow, PUBLISHED=green, ARCHIVED=gray)
- Each card shows: name, date range, branch, item count, nutrition summary (NutritionBar)
- Actions: View Builder, Edit (drafts), Publish (drafts), Delete
- Create Meal Plan Dialog: Name, Start/End Date, Branch, Target Classes, Meal Types
- API: GET/POST `/api/meal-plans`, DELETE `/api/meal-plans/[id]`, POST `/api/meal-plans/[id]/publish`

### 3. `/src/app/admin/meals/plans/[id]/builder/page.tsx` — Meal Plan Builder (MAIN PAGE)

- Header with plan info, status badge, Save Draft + Publish + Template buttons
- Two-panel layout:
  - Left: Item Palette (meal type tabs, search, click-to-select MealCards)
  - Right: MealPlanGrid with editable weekly view
- Cell interaction: Click to assign from palette, dropdown for quick assign
- Add Alternative / Remove actions per cell
- Daily Nutrition Summary with NutritionBar components (5 nutrients per day)
- AllergyConflictPanel at bottom
- Copy from Template / Save as Template dialogs
- API: GET `/api/meal-plans/[id]`, PUT `/api/meal-plans/[id]/items`, POST `/api/meal-plans/[id]/publish`, GET/POST `/api/meal-templates`

### 4. `/src/app/admin/meals/allergies/page.tsx` — Allergy Dashboard

- Overview cards: Total with Allergies, Critical (red pulse), Unverified (send reminder), Most Common
- Allergen Distribution Bar Chart (Recharts)
- Severity Distribution Pie Chart (Mild/Moderate/Severe/Life-threatening)
- Critical Alerts Table (students with severe/life-threatening allergies)
- Unverified Allergies Table (awaiting parent verification)
- Student Allergy Detail Dialog (all allergies with severity, reaction, notes, verification)
- Add Allergy Dialog: Student search, Allergen dropdown (17), Severity, Reaction, Notes, Action plan
- API: GET `/api/allergies/dashboard`, POST/DELETE `/api/students/[id]/allergies`

### 5. `/src/app/admin/meals/calendar/page.tsx` — Meal Calendar View

- 5-day weekly calendar grid (Mon-Fri)
- Each day cell shows: meal plan status badges, meal type icons with dish names, nutrition summary
- Click date: Expandable detail panel showing full day's meals with NutritionBar components
- Week navigation (Previous/Next/Today)
- Print view: Clean printable weekly menu table
- Color coding: Green=Published, Yellow=Draft, No plan=empty
- API: GET `/api/meal-plans` (filtered by date range)

### 6. `/src/app/admin/meals/templates/page.tsx` — Meal Templates

- Template cards: Name, description, usage count, meal type badges, preview of items
- Search functionality
- Create Template Dialog: Name, Description, Meal Types
- Edit/Delete template actions
- Preview Template Dialog (full items by meal type)
- Apply Template: Creates new meal plan draft from template
- "Save Current Plan as Template" note
- API: GET/POST `/api/meal-templates`, PATCH/DELETE `/api/meal-templates/[id]`

### 7. `/src/app/admin/meals/analytics/page.tsx` — Nutrition Analytics

- Date range selector
- Quick stats (Avg Daily Calories, Avg Cost/Serving, Weekly Est Cost, Meal Items)
- Weekly Nutrition Summary: Grouped Bar Chart (actual vs recommended calories)
- Meal Popularity Chart: Horizontal Bar Chart (average ratings)
- Allergy Incident Trend: Line Chart over time
- Most Popular Items Table (name, type, rating, times served)
- Least Popular Items Table (flagged for replacement with Low badges)
- Nutrition Gap Analysis: NutritionBar components (actual vs recommended for 5 nutrients)
- Cost Analysis: Summary cards + Pie Chart by meal type
- API: GET `/api/meal-items`, GET `/api/meal-plans`

## Design Patterns Used

- Dark theme with cosmic purple gradient and glass morphism (bg-white/5, backdrop-blur-sm, border-white/10)
- `'use client'` directive on all pages
- framer-motion animations (initial/animate on cards, AnimatePresence for list transitions)
- sonner toast notifications for success/error feedback
- Loading states with Skeleton components
- shadcn/ui components (Button, Card, Badge, Dialog, Input, Select, Tabs, Table, etc.)
- Meal components from `@/components/meals/*` (MealCard, MealPlanGrid, AllergyBadge, AllergenTag, NutritionBar, AllergyConflictPanel)
- Recharts for data visualization (BarChart, PieChart, LineChart)
- date-fns for date formatting
- Debounced search inputs
- Consistent API call pattern with auth tokens and error handling

## Verification

- All 7 pages compile successfully (HTTP 200/307 from dev server)
- ESLint passes with 0 errors
