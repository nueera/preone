'use client';

// ============================================================
// PreOne — Login Theme Toggle
// Animated sun ↔ moon crossfade (280ms) using next-themes.
// Place in the top-right corner of the login page.
// ============================================================

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a stable placeholder until mounted.
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="
        relative inline-flex h-10 w-10 items-center justify-center rounded-full
        text-foreground/80 hover:bg-foreground/10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-[#7B2CBF] dark:focus-visible:ring-[#7B2CBF]
        focus-visible:ring-offset-transparent
        transition-colors
      "
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
            <Sun className="h-5 w-5 text-amber-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
