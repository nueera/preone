# Task: Meal Items API Routes with withAuth

## Summary

Rewrote 3 API route files for the PreOne Meal & Nutrition system, migrating from the legacy `requireRole`/`requireAdmin` auth pattern to the `withAuth` wrapper from `@/lib/auth-utils`.

## Files Modified

1. **`/src/app/api/meal-items/route.ts`** — GET (list with filters) + POST (admin create)
2. **`/src/app/api/meal-items/[id]/route.ts`** — GET (single) + PATCH (admin update) + DELETE (admin soft-delete)
3. **`/src/app/api/meal-items/allergy-safe/route.ts`** — GET (allergy-safe items for a student)

## Key Changes

- **Auth**: Replaced `requireRole`/`requireAdmin` from `@/lib/auth` with `withAuth` from `@/lib/auth-utils`
- **Role enforcement**: Used `{ roles: ['ADMIN'] }` option for POST, PATCH, DELETE handlers
- **Handler pattern**: Changed from `export async function GET(req)` to `export const GET = withAuth(async (req, ctx) => { ... })`
- **Params access**: Used `ctx.params` (Promise-based) for dynamic route `[id]`
- **User access**: Changed from `user.schoolId` to `req.user.schoolId` (user attached to request by withAuth)
- **Response format**: Updated to match spec — `{ mealItems }`, `{ mealItem }`, `{ success: true }`, `{ studentAllergies, dangerousAllergens, safeItems, unsafeCount }`
- **Zod validation**: Added `AllergenTypeEnum` for strict allergen validation in create/update schemas
- **isActive query param**: Added to GET list endpoint with default `true`
- **Soft delete**: DELETE handler now returns `{ success: true }` instead of the deleted item

## Lint Result

✅ `bun run lint` passed with zero errors
