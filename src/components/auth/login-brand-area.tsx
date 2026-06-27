'use client';

// ============================================================
// PreOne — Mobile Brand Area (top of the mobile login stack)
//
// Renders ONLY on < md screens (md:hidden wrapper). On md+ the
// desktop LoginHeadline takes over and this component is removed
// from the layout entirely.
//
// Layout (top → bottom, all centered horizontally):
//   1. Theme toggle pill — pinned top-right via absolute positioning
//      on the parent shell, NOT inside this brand area (see login/page.tsx).
//   2. 32px gap below toggle.
//   3. PreOne logo — 32px mark.
//   4. Wordmark "PreOne" — 24px weight 700. White in dark theme;
//      gradient indigo→violet in light theme (via .login-brand-wordmark).
//   5. 8px gap.
//   6. Tagline — 13px / 1.5, white @ 75% opacity (dark) / #4A5568 (light),
//      max-width 280px, centered. Hidden on < sm to save vertical space.
//
// The brand area itself has NO background — the wallpaper shows
// through directly (the mobile overlay gradient darkens the top
// just enough for legibility).
// ============================================================

import Image from 'next/image';

export function LoginBrandArea() {
  return (
    <div
      className="
        relative flex w-full flex-col items-center justify-end
        px-5 pb-6 pt-6
        sm:px-6 sm:pt-8
        md:hidden
      "
      style={{ minHeight: '40vh' }}
    >
      {/* Logo + wordmark, stacked vertically for mobile (per screenshot) */}
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/preonelogo.png"
          alt="PreOne logo"
          width={56}
          height={56}
          priority
          className="h-14 w-14 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
        />
        <span
          className="
            login-brand-wordmark text-[24px] font-bold tracking-tight
          "
          style={{ letterSpacing: '-0.01em' }}
        >
          PreOne
        </span>
      </div>

      {/* Tagline — hidden on < sm to save vertical space (spec §2) */}
      <p
        className="
          mt-2 hidden max-w-[280px] text-center text-[13px] leading-[1.5]
          text-white/75 sm:block
          dark:text-white/75
        "
        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
      >
        Where every child begins their journey among the stars.
      </p>
    </div>
  );
}
