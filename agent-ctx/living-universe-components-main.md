# Task: Living Universe Design System Components

## Summary
Created 7 production-ready React components for the PreOne "Living Universe" design system overhaul. All components use 'use client', CSS variables, Framer Motion animations, Tailwind dark: variants, and import cn from '@/lib/utils'.

## Files Created

### 1. `/src/components/ui/preone-card.tsx`
Unified card component with 6 variants:
- **default**: Uses `.preone-card` CSS class (white bg, border, rounded-2xl, shadow)
- **glass**: Uses `.preone-glass-card` CSS class (glass morphism, backdrop-blur-20px)
- **hero**: Uses `.preone-hero-card` CSS class (gradient bg, white text)
- **strip**: Uses `.preone-card .preone-strip-card` (left color accent stripe)
- **achievement**: Amber gradient border overlay technique
- **holographic**: Shimmer overlay on hover

Props: children, variant, className, hover (boolean), onClick. Uses motion.div for hover lift (y: -2) and tap scale (0.98).

### 2. `/src/components/ui/cosmic-stat-card.tsx`
Animated stat card with count-up number animation using framer-motion's `useMotionValue` + `useTransform`. Features:
- PreOneCard variant="strip" with custom left color accent
- Icon with gradient glow background
- Number animates from 0 to value on mount
- Trend arrow (up/down with green/red using CSS vars)
- Subtle planet decoration (bottom-right, 5% opacity)

### 3. `/src/components/ui/page-transition.tsx`
Page transition and stagger animation wrappers:
- **PageTransition**: fade + slide up on enter/exit (12px y-offset)
- **StaggerContainer**: wraps children with 0.06s stagger delay
- **StaggerItem**: individual stagger item (fade + slide up from 16px)

### 4. `/src/components/ui/cosmic-empty-state.tsx`
Animated empty state with floating icon:
- Icon container floats y: [-6, 6] (3s infinite easeInOut)
- Action button uses `.preone-btn .preone-btn-primary` CSS classes
- Uses CSS variables for all colors

### 5. `/src/components/cosmic/AuroraBackground.tsx`
Aurora/nebula effect for dark mode backgrounds:
- Light mode: `.space-dots` CSS class (subtle dot pattern)
- Dark mode: `.animate-aurora` CSS class (animated aurora gradient)
- Additional glow orbs for depth in dark mode
- Absolute positioned, pointer-events-none, z-0
- Configurable intensity prop

### 6. `/src/components/cosmic/AiCompanion.tsx`
Robot mascot component with floating animation:
- Robot emoji (🤖) in gradient container with glow pulse
- Floating animation via Framer Motion y oscillation
- Contextual speech bubble based on role (parent/teacher/admin)
- PreOneCard variant="glass" for speech bubble
- Triangle pointer between robot and speech bubble

### 7. `/src/components/cosmic/EmotionalTimeline.tsx`
Instagram Stories-style emotional timeline:
- Horizontal scrollable row of 56px story circles
- 4px gradient border (outer div gradient + inner div solid bg)
- Unseen: cosmic gradient border with glow pulse
- Seen: gray border
- Hover scale effect via Framer Motion
- Proper scrollbar hiding, ARIA labels, keyboard accessibility

## Lint Status
All 7 new files pass lint cleanly. The only lint errors are pre-existing (in cosmic-theme-toggle.tsx and prisma.config.ts).
