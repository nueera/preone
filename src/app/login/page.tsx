'use client';

// ============================================================
// PreOne — Login Page
// Full-bleed wallpaper + glassmorphism card layout.
//
// Layout:
//   - The wallpaper covers the WHOLE viewport (full-bleed) so it
//     shows through the translucent login card on the right and
//     the headline overlay on the left.
//   - lg+ : headline overlay sits on the left 55%, card sits on
//           the right side (max-w-440, centered in the right half)
//   - <lg : wallpaper only, card centered
//   - <sm : card padding tightens
// ============================================================

import { LoginWallpaper } from '@/components/auth/login-wallpaper';
import { LoginHeadline } from '@/components/auth/login-headline';
import { LoginCard } from '@/components/auth/login-card';
import { ThemeToggle } from '@/components/auth/theme-toggle';

export default function LoginPage() {
  return (
    <main
      className="
        relative flex min-h-screen w-full items-center justify-center
        overflow-hidden
      "
    >
      {/* ── Full-bleed wallpaper background (covers entire viewport) ── */}
      <LoginWallpaper />

      {/* ── Left-side headline overlay (lg+ only, transparent) ── */}
      <LoginHeadline />

      {/* ── Theme toggle — top-right corner ── */}
      <div className="absolute right-6 top-6 z-30">
        <ThemeToggle />
      </div>

      {/* ── Login card — centered on small screens, pushed right on lg+ ── */}
      <div
        className="
          relative z-20 flex w-full justify-center px-6 py-12
          lg:mr-[5%] lg:w-[45%] lg:justify-end lg:px-0
        "
      >
        <div className="w-full max-w-[440px]">
          <LoginCard />
        </div>
      </div>
    </main>
  );
}
