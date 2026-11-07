'use client';

// ============================================================
// PreOne — Global Theme Toggle (used across ALL portals)
//
// Same labeled pill style as the mobile login toggle, but uses
// portal-agnostic CSS tokens (--admin-*, --portal-*, semantic
// Tailwind vars) instead of login-specific --login-* tokens.
//
// Two variants:
//   variant="pill"   — Full labeled pill with Light/Dark buttons
//   variant="icon"   — Compact icon button (40×40) with spring swap
//
// The pill variant is the DEFAULT and should be used in all portal
// headers (admin topbar, teacher header, parent header).
// ============================================================

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

type GlobalToggleVariant = 'pill' | 'icon';

interface GlobalThemeToggleProps {
  variant?: GlobalToggleVariant;
  className?: string;
}

export function GlobalThemeToggle({ variant = 'pill', className = '' }: GlobalThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — default to 'dark' to match SSR
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  if (variant === 'icon') {
    return <IconToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} className={className} />;
  }
  return <PillToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} className={className} />;
}

// ============================================================
// Pill variant — "Light" / "Dark" labelled buttons
// Works in any portal context using semantic color tokens
// ============================================================
function PillToggle({ isDark, onToggle, className }: { isDark: boolean; onToggle: () => void; className: string }) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className={`
        theme-toggle-pill
        inline-flex h-8 items-center gap-0.5 rounded-full p-0.5
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
          theme-toggle-pill-btn
          inline-flex h-7 items-center gap-1 rounded-full px-2.5
          text-[11px] font-semibold
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        "
      >
        <Sun className="h-3 w-3" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => !isDark && onToggle()}
        data-active={isDark}
        aria-pressed={isDark}
        aria-label="Dark theme"
        className="
          theme-toggle-pill-btn
          inline-flex h-7 items-center gap-1 rounded-full px-2.5
          text-[11px] font-semibold
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        "
      >
        <Moon className="h-3 w-3" />
        <span>Dark</span>
      </button>
    </div>
  );
}

// ============================================================
// Icon variant — compact 40×40 button with spring swap
// ============================================================
function IconToggle({ isDark, onToggle, className }: { isDark: boolean; onToggle: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`
        relative inline-flex h-9 w-9 items-center justify-center rounded-full
        text-muted-foreground hover:bg-accent hover:text-accent-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 focus-visible:ring-offset-background
        transition-colors
        ${className}
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.6 }}
            className="inline-flex"
          >
            <Moon className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.6 }}
            className="inline-flex"
          >
            <Sun className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
