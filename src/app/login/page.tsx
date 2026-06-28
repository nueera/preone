'use client';

// ============================================================
// PreOne — Login Page (Premium Responsive)
//
// Responsive layout:
//   - Mobile (< md): single full-height column.
//       1. Top brand area (~35vh) — logo + wordmark + tagline.
//          Theme toggle pinned top-right via absolute positioning.
//       2. Form card — full width minus 32px horizontal margin.
//       3. Footer inside the card.
//       Whole page scrolls if the keyboard pushes content past the
//       viewport (overflow-y-auto on mobile). No horizontal scroll.
//
//   - Desktop (≥ md): split-screen 60/40.
//       Left: full-bleed wallpaper + headline overlay (lg+ only).
//       Right: centered 440px glass card.
//       Theme toggle: compact icon, top-right.
//
// Premium transitions:
//   - Staggered Framer Motion entrance (spring physics)
//   - Uses global --transition-* tokens for all CSS transitions
//   - Smooth theme switching via --transition-theme token
//
// Viewport: Uses 100dvh on the shell (CSS .login-page-shell) so
// the wallpaper fills the exact viewport with no scrollbars on
// desktop. Mobile allows vertical scroll for keyboard handling.
// ============================================================

import { motion } from 'framer-motion';
import { LoginWallpaper } from '@/components/auth/login-wallpaper';
import { LoginHeadline } from '@/components/auth/login-headline';
import { LoginBrandArea } from '@/components/auth/login-brand-area';
import { LoginCard } from '@/components/auth/login-card';
import { ThemeToggle } from '@/components/auth/theme-toggle';

// ── Stagger container: children animate in sequence ──
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

// ── Fade-up child: spring physics for premium feel ──
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
};

// ── Scale-in for decorative elements ──
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      mass: 1,
    },
  },
};

export default function LoginPage() {
  return (
    <main
      className="
        login-page-shell
        login-theme-transition
        relative flex min-h-0 w-full flex-col
        md:flex-row md:items-stretch
      "
    >
      {/* ── Full-bleed wallpaper background (covers entire viewport) ── */}
      <LoginWallpaper />

      {/* ── Theme toggle ──
          Mobile (labeled pill): top-right of the brand area.
          Desktop (compact icon): top-right of the right panel. */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
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
      </motion.div>

      {/* ── Staggered content wrapper ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex w-full flex-1 flex-col md:flex-row"
      >
        {/* ── MOBILE: top brand area (< md only) ── */}
        <motion.div variants={fadeUp}>
          <LoginBrandArea />
        </motion.div>

        {/* ── DESKTOP: left-side headline overlay (lg+ only) ── */}
        <motion.div variants={scaleIn} className="hidden lg:block">
          <LoginHeadline />
        </motion.div>

        {/* ── Login card ──
            Mobile: full width minus 32px horizontal margin, sits below
                    the brand area with a gap.
            Desktop: centered in the right 45% panel, max-width 440px. */}
        <motion.div
          variants={fadeUp}
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
        </motion.div>
      </motion.div>
    </main>
  );
}
