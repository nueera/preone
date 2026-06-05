# Meal System API Routes - withAuth Migration

## Task: Create 5 API route files for PreOne Meal system using `withAuth` from `@/lib/auth-utils`

### Files Created/Updated

1. **`/src/app/api/meal-plans/[id]/publish/route.ts`**
   - POST handler using `withAuth` with `roles: ['ADMIN']`
   - Finds meal plan by id + schoolId with `_count: { select: { items: true } }`
   - Returns 404 if not found, 400 if no items
   - Updates status to PUBLISHED, sets publishedAt/publishedBy
   - Parses targetClassIds from JSON string, finds students, gets parent user IDs via StudentParent → Parent → User (by email)
   - Creates Notification for each parent user
   - Returns `{ mealPlan: updated }`

2. **`/src/app/api/meal-templates/route.ts`**
   - GET: `withAuth` (any role), lists templates for school ordered by usageCount desc
   - POST: `withAuth` with `roles: ['ADMIN']`, Zod validation for name, description, mealTypes, templateData
   - Stringifies mealTypes and templateData before saving
   - Returns `{ template }` with 201

3. **`/src/app/api/meal-templates/[id]/route.ts`**
   - GET: `withAuth` (any role), finds by id + schoolId, returns 404 if not found
   - PATCH: `withAuth` with `roles: ['ADMIN']`, partial update with stringified JSON fields
   - DELETE: `withAuth` with `roles: ['ADMIN']`, deletes template, returns `{ success: true }`
   - All handlers use `await ctx.params` for Next.js 16 async params

4. **`/src/app/api/meal-feedback/route.ts`**
   - GET: `withAuth` (any role), filters by studentId, date, mealType, startDate, endDate
   - POST: `withAuth` with `roles: ['TEACHER', 'ADMIN']`
   - Supports single object or array of feedbacks
   - Zod validates: mealPlanItemId, studentId, date, mealType, rating (1-5), eatenPercent (0/25/50/75/100), comments
   - Creates MealFeedback records with reportedBy from req.user.id
   - Backward compat: updates DailyUpdate via upsert
   - Maps mealType to DailyUpdate fields: BREAKFAST→breakfast/breakfastMenu, LUNCH→lunch/lunchMenu, snacks→snacks/snacksMenu
   - Gets meal item name from MealPlanItem→MealItem for menu field
   - Returns `{ created: count }` with 201

5. **`/src/app/api/parent/meals/route.ts`**
   - GET: `withAuth` with `roles: ['PARENT']`
   - Required: studentId query param
   - Gets student with allergies (StudentAllergy) and class info
   - Verifies parent owns the student
   - Finds active meal plan covering target date (startDate <= date <= endDate, status PUBLISHED)
   - Builds weeklyMenu with allergy conflict detection per item:
     - Parses allergens and mayContain from JSON strings
     - allergyConflict: boolean if student allergens intersect with item allergens
     - conflictingAllergens: array of matching allergens
     - isAlternative: boolean
   - Gets today's MealFeedback and weekly (7-day) feedback history
   - Returns `{ student, mealPlan, weeklyMenu, todayFeedback, weekFeedback }`

### Key Decisions

- All routes use `withAuth` from `@/lib/auth-utils` (not `requireAdmin` from `@/lib/auth`)
- `ctx.params` is awaited per Next.js 16 App Router conventions
- JSON arrays stored as Strings (SQLite compat) are parsed/stringified correctly
- `req.user.id` used (not `req.user.userId`)
- Notification model uses: schoolId, userId, title, message, type, category, link, senderId
- DailyUpdate upsert uses `studentId_date` unique compound key
