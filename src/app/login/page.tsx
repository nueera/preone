'use client';

// ============================================================
// PreOne — Login Page
// Split-screen 60/40 layout mounting LoginWallpaper + LoginCard
// with a theme toggle in the top-right corner.
//
// Asset slot:
//   Replace `public/login-wallpaper-dark.png` and
//   `public/login-wallpaper-light.png` with the supplied
//   PreOne space illustrations.
//
// Layout:
//   - lg+ : 60% wallpaper (left) | 40% card panel (right)
//   - <lg : wallpaper hidden, card panel fills viewport
//   - <sm : card padding tightens to 28px / 24px
// ============================================================

import { LoginWallpaper } from '@/components/auth/login-wallpaper';
import { LoginCard } from '@/components/auth/login-card';
import { ThemeToggle } from '@/components/auth/theme-toggle';

export default function LoginPage() {
  return (
    <main
      className="
        relative flex min-h-screen w-full overflow-hidden
        login-panel-light dark:login-panel-dark
      "
    >
      {/* ── Left panel (60%, hidden below lg) ── */}
      <LoginWallpaper />

      {/* ── Right panel (40%, full width below lg) ── */}
      <section
        className="
          relative flex w-full flex-col items-center justify-center
          px-6 py-12
          lg:w-[40%]
        "
      >
        {/* Theme toggle — top-right corner, 24px from edges */}
        <div className="absolute right-6 top-6 z-20">
          <ThemeToggle />
        </div>

        {/* Login card — centered */}
        <div className="w-full max-w-[440px]">
          <LoginCard />
        </div>
      </section>
    </main>
  );
}
