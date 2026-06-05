# Theme Refactor: Shared Components

## Task

Replace ALL hardcoded UI values in 11 shared components with global theme tokens from `/src/lib/theme-tokens.ts`.

## Files Refactored

### 1. `src/components/crm-analytics.tsx`

- **Import added**: `PORTAL_THEMES, CRM_COLORS, CHART_PALETTE, getChartColor`
- **Changes**:
  - `PIE_COLORS` array of hardcoded hex → `CHART_PALETTE.series`
  - `#f0f0f0` grid strokes → `CHART_PALETTE.gridLight`
  - `#7C3AED` / `#10b981` line strokes → `getChartColor(0)` / `getChartColor(2)`
  - `#7C3AED` bar fill → `theme.primary`
  - Axis tick fills → `CHART_PALETTE.axis`

### 2. `src/components/lead-detail-drawer.tsx`

- **Import added**: `PORTAL_THEMES, CRM_COLORS, PRIORITY_COLORS as THEME_PRIORITY_COLORS, CHART_PALETTE`
- **Changes**:
  - `STAGE_CONFIG` hex colors → `CRM_COLORS.*.hex` with fallbacks
  - `STAGE_CONFIG` bg classes → `CRM_COLORS.*.bg` with fallbacks
  - `PRIORITY_CONFIG` text classes → `THEME_PRIORITY_COLORS.*.text` with fallbacks
  - `bg-purple-50 text-purple-700` selected state → `theme.selectedClass`

### 3. `src/components/parent-portal.tsx`

- **Import added**: `PORTAL_THEMES, OBSERVATION_COLORS, GROWTH_COLORS, ATTENDANCE_COLORS, FEE_COLORS, CHART_PALETTE, getChartColor`
- **Theme**: `const theme = PORTAL_THEMES.parent`
- **Changes**:
  - `CATEGORY_COLORS` → uses `OBSERVATION_COLORS.*.bg` + `OBSERVATION_COLORS.*.text`
  - `PRIORITY_COLORS.Medium` from `text-violet-600` → `text-sky-600`
  - `GROWTH_DIMENSIONS` hex colors → `GROWTH_COLORS.*.hex` with fallbacks
  - `from-violet-600 to-sky-500` gradients → `theme.btnGradientClass` / `theme.btnGradientHoverClass`
  - `from-violet-500 to-sky-400` avatar gradients → `theme.avatarGradientClass`
  - All `text-violet-500` icon accents → `text-sky-500` (parent theme)
  - All `bg-violet-*` / `border-violet-*` → `bg-sky-*` / `border-sky-*` (parent theme)
  - `getAttendanceColor()` → uses `THEME_ATTENDANCE_COLORS.*.dot`
  - `getInvoiceStatusBadge()` → uses `THEME_FEE_COLORS[status]`
  - Chart hex colors → `CHART_PALETTE.*` / `theme.primary`
  - `bg-purple-50` AI observations → `bg-sky-50`

### 4. `src/components/teacher-portal.tsx`

- **Import added**: `PORTAL_THEMES, ATTENDANCE_COLORS, GROWTH_COLORS, CHART_PALETTE, getChartColor`
- **Theme**: `const theme = PORTAL_THEMES.teacher`
- **Changes**:
  - `ATTENDANCE_COLORS` → uses `THEME_ATTENDANCE_COLORS.*.bg` + `.text`
  - `attendancePieData` hex → `THEME_ATTENDANCE_COLORS.*.hex` with fallbacks
  - `#94a3b8` unmarked → `CHART_PALETTE.axisLight`
  - All `from-violet-600 to-sky-500` gradient buttons → `theme.btnGradientClass`
  - `from-violet-500 to-sky-400` avatar → `theme.avatarGradientClass`
  - `bg-violet-50` / `bg-violet-100` → `bg-emerald-50` / `theme.avatarFallbackClass`
  - All `text-violet-*` → `text-emerald-*` (teacher theme)
  - `from-violet-50 to-sky-50` cards → `theme.cardGradientClass`
  - Radar chart hex → `theme.primary` / `getChartColor(2)` / `CHART_PALETTE.grid`

### 5. `src/components/activity-detail-dialog.tsx`

- **Import added**: `ACTIVITY_COLORS`
- **Changes**:
  - `TYPE_CONFIG` color/bg → uses `ACTIVITY_COLORS.*.text` / `ACTIVITY_COLORS.*.bg` with fallbacks

### 6. `src/components/add-activity-dialog.tsx`

- **Import added**: `ACTIVITY_COLORS`
- **Already used**: `bg-brand-gradient` / `hover:bg-brand-gradient-hover` (no changes needed to existing pattern)

### 7. `src/components/parent-header.tsx`

- **Import added**: `PORTAL_THEMES`
- **Theme**: `const theme = PORTAL_THEMES.parent`
- **Changes**:
  - `bg-sky-100 text-sky-700` avatar fallback → `theme.avatarFallbackClass`

### 8. `src/components/teacher-header.tsx`

- **Import added**: `PORTAL_THEMES`
- **Theme**: `const theme = PORTAL_THEMES.teacher`
- **Changes**:
  - `bg-emerald-100 text-emerald-700` avatar fallback → `theme.avatarFallbackClass`

### 9. `src/components/admin-header.tsx`

- **Import added**: `PORTAL_THEMES`
- **Theme**: `const theme = PORTAL_THEMES.admin`
- **Changes**:
  - `bg-purple-100 text-purple-700` avatar fallback → `theme.avatarFallbackClass`

### 10. `src/components/parent-mobile-nav.tsx`

- **Import added**: `PORTAL_THEMES`
- **Theme**: `const theme = PORTAL_THEMES.parent`
- **Changes**:
  - `text-sky-600` active state → `theme.selectedClass`

### 11. `src/app/login/page.tsx`

- **Import added**: `CHART_PALETTE`
- **Changes**:
  - Background gradient → `bg-login-gradient` CSS class
  - Logo icon bg → `bg-brand-gradient` CSS class
  - Sign In button → `btn-brand` CSS class
  - Forgot password buttons → `btn-brand` CSS class
  - KeyRound icon → uses `CHART_PALETTE.series[0]` via style prop
  - Card → `card-preone` CSS class
  - PreOne title: kept `from-purple-600 to-pink-500` (login-specific, per instructions)

## Verification

- All 11 modified files pass TypeScript compilation (`tsc --noEmit`)
- All 11 modified files pass ESLint checks
- Zero new errors introduced by the refactoring
- Remaining hardcoded hex values are only in `??` fallback patterns (for type safety when tokens are undefined)
