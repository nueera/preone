'use client';

// ============================================================
// PreOne — Login Page
//
// Responsive layout:
//   - Mobile (< md): single full-height column.
//       1. Top brand area (~40vh) — logo + wordmark + tagline.
//          Theme toggle pinned top-right via absolute positioning.
//       2. Form card — full width minus 32px horizontal margin.
//       3. Footer inside the card (spec §3.7).
//       Whole page scrolls if the keyboard pushes content past the
//       viewport (overflow-y-auto). No horizontal scroll.
//
//   - Desktop (≥ md): split-screen 60/40.
//       Left: full-bleed wallpaper + headline overlay (lg+ only).
//       Right: centered 440px glass card.
//       Theme toggle: compact icon, top-right.
//
// The wallpaper is rendered ONCE here (full-bleed) and reflows
// between desktop and mobile PNG assets internally via the
// LoginWallpaper component.
// ============================================================

import { LoginWallpaper } from '@/components/auth/login-wallpaper';
import { LoginHeadline } from '@/components/auth/login-headline';
import { LoginBrandArea } from '@/components/auth/login-brand-area';
import { LoginCard } from '@/components/auth/login-card';
import { ThemeToggle } from '@/components/auth/theme-toggle';

export default function LoginPage() {
  return (
    <main
      className="
        login-page-shell
        login-theme-transition
        relative flex min-h-screen w-full flex-col overflow-y-auto
        md:flex-row md:items-stretch md:overflow-hidden
      "
    >
      {/* ── Full-bleed wallpaper background (covers entire viewport) ── */}
      <LoginWallpaper />

      {/* ── Theme toggle ──
          Mobile (labeled pill): top-right of the brand area, with
              safe-area top inset.
          Desktop (compact icon): top-right of the right panel. */}
      <div
        className="
          absolute right-4 top-4 z-30 pt-safe pr-safe
          md:right-6 md:top-6
        "
      >
        {/* Mobile — labelled pill */}
        <div className="md:hidden">
          <ThemeToggle variant="labeled" />
        </div>
        {/* Desktop — compact icon */}
        <div className="hidden md:block">
          <ThemeToggle variant="compact" />
        </div>
      </div>

      {/* ── MOBILE: top brand area (< md only) ──
          Logo + wordmark + tagline. Wallpaper shows through directly. */}
      <LoginBrandArea />

      {/* ── DESKTOP: left-side headline overlay (lg+ only, transparent) ── */}
      <LoginHeadline />

      {/* ── Login card ──
          Mobile: full width minus 32px horizontal margin, sits below
                  the brand area with a 16px gap.
          Desktop: centered in the right 45% panel, max-width 440px. */}
      <div
        className="
          relative z-20 flex w-full flex-1 justify-center
          px-4 pb-6
          md:items-center md:px-0 md:pb-0
          lg:mr-[5%] lg:w-[45%] lg:justify-end
        "
      >
        <div className="w-full max-w-[440px]">
          <LoginCard />
        </div>
      </div>
    </main>
  );
}
