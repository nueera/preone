'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CosmicThemeToggle — Light/Dark/Auto toggle with sun/moon animation.
 * Visible in the TOP-RIGHT of the header on ALL pages.
 */
export function CosmicThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  // useSyncExternalStore to detect hydration (lint-safe alternative to useEffect + setState)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!showOptions) return;
    const handleClick = () => setShowOptions(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showOptions]);

  if (!mounted) {
    return (
      <button className="h-9 w-9 rounded-xl bg-cosmic-bg-tertiary animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          setShowOptions(!showOptions);
        }}
        className={cn(
          "relative h-9 w-9 rounded-xl flex items-center justify-center",
          "bg-cosmic-bg-tertiary dark:bg-white/10",
          "hover:bg-preone-primary-50 dark:hover:bg-preone-primary/10",
          "border border-cosmic-border-default dark:border-white/10",
          "transition-colors"
        )}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <Moon className="w-4 h-4 text-preone-primary-light" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <Sun className="w-4 h-4 text-preone-orange" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute right-0 top-12 z-50 rounded-2xl p-2 min-w-[160px]",
              "bg-white dark:bg-[#121234] shadow-xl",
              "border border-cosmic-border-default dark:border-white/10"
            )}
          >
            {[
              { value: 'light', icon: Sun, label: 'Light', color: '#FFB700' },
              { value: 'system', icon: Monitor, label: 'Auto', color: '#6366F1' },
              { value: 'dark', icon: Moon, label: 'Dark', color: '#6c5ce7' },
            ].map(({ value, icon: Icon, label, color }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setShowOptions(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  theme === value
                    ? "bg-preone-primary-50 dark:bg-preone-primary/10 text-preone-primary dark:text-preone-primary-light"
                    : "text-cosmic-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" style={{ color }} />
                {label}
                {theme === value && (
                  <motion.div
                    layoutId="theme-check"
                    className="ml-auto w-2 h-2 rounded-full bg-preone-primary"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
