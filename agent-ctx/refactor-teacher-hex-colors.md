# Refactor: Replace Hardcoded Hex Colors with Theme Tokens in Teacher Portal

## Summary
Replaced all remaining hardcoded hex colors in Teacher Portal pages with centralized theme tokens from `@/lib/theme-tokens`.

## Files Changed

### 1. `/src/app/teacher/growth/page.tsx`
- **6 hex color fallbacks removed** from the `DIMENSIONS` array (lines 150-155)
- Changed from: `GROWTH_COLORS.creativity?.hex || '#ec4899'` pattern (with `?.` optional chaining + hardcoded fallback)
- Changed to: `GROWTH_COLORS.creativity.hex` (direct access, no fallback needed since all keys exist)
- Colors removed: `#ec4899`, `#3b82f6`, `#10b981`, `#f97316`, `#8b5cf6`, `#14b8a6`
- Also added missing `Input` import (pre-existing bug fix)

### 2. `/src/app/teacher/observations/page.tsx`
- **1 hex color removed** from `PRIORITY_CONFIG.CONCERN` (line 152)
- Changed from: `dot: '#ef4444'`
- Changed to: `dot: PRIORITY_COLORS.HIGH.hex` (which is `#ef4444`)

### 3. `/src/app/teacher/schedule/page.tsx`
- **No changes needed** — already clean, no hardcoded hex colors

### 4. `/src/app/teacher/communication/page.tsx`
- **No changes needed** — already using `COMMUNICATION_COLORS` and `theme.*` tokens, no hardcoded hex or gradients

### 5. `/src/app/teacher/settings/page.tsx`
- **No changes needed** — already using `theme.avatarGradientClass`, `theme.btnGradientClass`, `theme.btnGradientHoverClass`, `theme.selectedClass`

## Lint Results
All changes pass lint. Remaining errors are pre-existing parsing issues in other files (attendance, daily-updates, observations).
