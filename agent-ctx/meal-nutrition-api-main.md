# Task: PREONE MEAL & NUTRITION PLANNER SYSTEM Backend API Routes

## Agent: Main Developer

## Status: COMPLETED

## Summary

Created all 13 API route files for the Meal & Nutrition Planner System.

## Files Created

1. **`/src/app/api/meal-items/route.ts`** — Meal Item CRUD
   - GET: List with filters (mealType, category, search, allergenFree, isVegetarian, isVegan)
   - POST: Create (Admin only) with Zod validation, JSON parsing for allergens/mayContain

2. **`/src/app/api/meal-items/[id]/route.ts`** — Single Meal Item
   - GET: Single item by ID
   - PATCH: Update (Admin only) with Zod validation
   - DELETE: Soft delete (set isActive: false) (Admin only)

3. **`/src/app/api/meal-items/allergy-safe/route.ts`** — Allergy-Safe Items
   - GET: Query student allergies, filter safe items, return dangerousAllergens + safeItems + unsafeCount

4. **`/src/app/api/meal-plans/route.ts`** — Meal Plan CRUD
   - GET: List with filters (status, from, to), branch scoping
   - POST: Create (Admin only) with date range validation + overlap check

5. **`/src/app/api/meal-plans/[id]/route.ts`** — Single Meal Plan
   - GET: With items and branch info
   - PATCH: Update (Admin only) with overlap validation
   - DELETE: Hard delete with cascade

6. **`/src/app/api/meal-plans/[id]/items/route.ts`** — Meal Plan Items
   - GET: Items grouped by day and meal type
   - PUT: Replace all items (Admin only) with:
     - Allergy conflict detection for target class students
     - usageCount increment for meal items
     - Nutrition summary recalculation helper

7. **`/src/app/api/meal-plans/[id]/publish/route.ts`** — Publish Meal Plan
   - POST: Admin only, checks for items, updates to PUBLISHED, sends parent notifications

8. **`/src/app/api/students/[studentId]/allergies/route.ts`** — Student Allergy CRUD
   - GET: List active allergies
   - POST: Add (Admin/Parent), auto-verify if Parent, notify teacher if SEVERE/LIFE_THREATENING
   - DELETE: Soft delete (Admin/Parent)

9. **`/src/app/api/allergies/dashboard/route.ts`** — Dashboard Stats
   - GET: Admin only - allergen distribution, severity distribution, critical list, unverified count

10. **`/src/app/api/meal-feedback/route.ts`** — Meal Feedback
    - GET: Query by date, studentId, mealType; Parent-scoped
    - POST: Teacher only, single/bulk, upsert on conflict, DailyUpdate backward compat

11. **`/src/app/api/meal-templates/route.ts`** — Template CRUD
    - GET: List templates for school
    - POST: Create (Admin only), supports creating from existing meal plan

12. **`/src/app/api/meal-templates/[id]/route.ts`** — Template Detail
    - GET: Single template
    - PATCH: Update (Admin only)
    - DELETE: Hard delete (Admin only)

13. **`/src/app/api/parent/meals/route.ts`** — Parent Meal View
    - GET: Weekly menu with allergy conflict flags, today's feedback, week's feedback history

## Key Patterns Used

- `requireAdmin`, `requireRole`, `requireTeacher`, `requireParent` from `@/lib/auth`
- `prisma` from `@/lib/db`
- Zod v4 for validation on all POST/PUT/PATCH bodies
- JSON.stringify for allergens/mayContain/ingredients/tags/vitamins/templateData fields (SQLite)
- Proper try/catch with NextResponse.json error handling
- Soft delete (isActive: false) for MealItem and StudentAllergy
