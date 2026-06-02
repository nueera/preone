# Refactor Teacher Portal Pages to Use Global Theme Tokens

## Task ID: refactor-teacher-theme-tokens

## Summary
Refactored 3 Teacher Portal pages to replace hardcoded portal-specific emerald colors/gradients with global theme tokens from `@/lib/theme-tokens`.

## Changes Made

### 1. `/home/z/my-project/src/app/teacher/dashboard/page.tsx`
- **Line 509**: Replaced `from-emerald-500 to-emerald-600` quick-action gradient with `${theme.btnGradientClass}` for the "Mark Attendance" action (portal-specific gradient)
- Semantic quick-action gradients (`from-amber-500 to-orange-500`, etc.) kept as static per instructions
- All other theme tokens already in place: `CHART_PALETTE`, `ATTENDANCE_COLORS`, `theme.btnGradientClass`, `theme.selectedClass`, portal CSS classes

### 2. `/home/z/my-project/src/app/teacher/my-class/page.tsx`
- **Line 288**: Replaced `bg-emerald-600 hover:bg-emerald-700 rounded-xl` (Retry button) with `bg-gradient-to-r ${theme.btnGradientClass} text-white rounded-xl`
- All other theme tokens already in place: `bg-portal-gradient`, `theme.avatarFallbackClass`, `theme.selectedClass`, portal CSS classes

### 3. `/home/z/my-project/src/app/teacher/my-class/[studentId]/page.tsx`
- **Lines 276, 656**: Replaced `bg-emerald-600 hover:bg-emerald-700 rounded-xl` (Back to My Class + Add Growth Assessment buttons) with `bg-gradient-to-r ${theme.btnGradientClass} text-white rounded-xl`
- **Lines 821, 824, 827**: Replaced hardcoded attendance legend dots (`bg-emerald-500`, `bg-red-500`, `bg-amber-500`) with `ATTENDANCE_COLORS.PRESENT?.dot`, `ATTENDANCE_COLORS.ABSENT?.dot`, `ATTENDANCE_COLORS.LATE?.dot`
- All other theme tokens already in place: `CHART_PALETTE`, `ATTENDANCE_COLORS`, `GROWTH_COLORS`, `MOOD_COLORS`, `MEAL_COLORS`, `bg-portal-gradient`, `theme.primary`, `theme.avatarFallbackClass`, `theme.selectedClass`

## Notes
- The specific gradient strings mentioned in the instructions (`from-emerald-500 to-teal-500`, `from-emerald-600 to-teal-600`, `from-emerald-400 to-teal-500`, `style={{ background: 'linear-gradient(...)' }}`) were already refactored in a previous pass
- Additional hardcoded portal-specific emerald values were replaced to ensure thorough theme token adoption
- Semantic quick-action gradients were kept as static per instructions
- Outline button patterns (`border-emerald-200 text-emerald-700 hover:bg-emerald-50`) were left unchanged since no matching theme token exists for that pattern
- Lint check passes with no new errors in modified files
