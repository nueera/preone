'use client';

// ============================================================
// PreOne — Login Theme Toggle
// Two variants driven by the same next-themes setTheme() call:
//
//   variant="compact" (desktop, md+):
//     Single 40×40 icon button, ghost style.
//     Animated sun ↔ moon crossfade (280ms).
//
//   variant="labeled" (mobile, < md):
//     Pill 36px tall (32px on < sm), 4px padding, two labelled
//     buttons — "Light" (sun) and "Dark" (moon). Active button
//     gets the brand gradient + white text; inactive is transparent
//     with #B0B0B0 text. Both buttons always rendered (no
//     crossfade) so the user sees both options at once.
//
// Switching between variants is done by the PARENT via Tailwind
// responsive classes (hidden md:flex / flex md:hidden) — render
// BOTH variants in the layout and let CSS pick the visible one.
// This avoids a JS-driven breakpoint listener and keeps SSR/CSR
// markup stable.
// ============================================================

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

type ThemeToggleVariant = 'compact' | 'labeled';

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a stable placeholder until mounted.
  // Default to 'dark' to match the SSR markup (default theme is dark).
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  if (variant === 'labeled') {
    return <LabeledToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} className={className} />;
  }
  return <CompactToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} className={className} />;
}

// ============================================================
// Compact variant — desktop icon button (40×40)
// ============================================================
function CompactToggle({ isDark, onToggle, className }: { isDark: boolean; onToggle: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`
        login-theme-transition
        relative inline-flex h-10 w-10 items-center justify-center rounded-full
        text-login-text hover:bg-login-input
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-login-focus focus-visible:ring-offset-transparent
        transition-colors
        ${className}
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="inline-flex"
          >
            <Moon className="h-5 w-5 text-white" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="inline-flex"
          >
            <Sun className="h-5 w-5 text-login-link" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ============================================================
// Labeled variant — mobile pill with two labelled buttons
// Pill: 36px tall on sm+, 32px tall on < sm (per spec §6)
// Each button: 28px tall (sm+), padding 0 12px, icon 14px + label 12px
// ============================================================
function LabeledToggle({ isDark, onToggle, className }: { isDark: boolean; onToggle: () => void; className: string }) {
  // Buttons render the active state explicitly (no crossfade) so both
  // options remain visible — required by spec §4.
  return (
    <div
      role="group"
      aria-label="Theme"
      className={`
        login-toggle-pill login-theme-transition
        inline-flex h-9 items-center gap-0.5 rounded-full p-1
        sm:h-9
        ${className}
      `}
    >
      <button
        type="button"
        onClick={() => isDark && onToggle()}
        data-active={!isDark}
        aria-pressed={!isDark}
        aria-label="Light theme"
        className="
          login-toggle-pill-btn login-theme-transition
          inline-flex h-7 items-center gap-1 rounded-full px-3
          text-[12px] font-semibold
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-focus
        "
      >
        <Sun className="h-3.5 w-3.5" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => !isDark && onToggle()}
        data-active={isDark}
        aria-pressed={isDark}
        aria-label="Dark theme"
        className="
          login-toggle-pill-btn login-theme-transition
          inline-flex h-7 items-center gap-1 rounded-full px-3
          text-[12px] font-semibold
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-focus
        "
      >
        <Moon className="h-3.5 w-3.5" />
        <span>Dark</span>
      </button>
    </div>
  );
}
