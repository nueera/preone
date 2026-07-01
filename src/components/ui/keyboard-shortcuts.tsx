'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

/**
 * KeyboardShortcuts — Press `?` to see all available keyboard shortcuts.
 * Renders as a modal overlay with categorized shortcut list.
 */

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'Actions' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo last action', category: 'Actions' },
  { keys: ['B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close dialog / panel', category: 'Navigation' },
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Settings', category: 'Navigation' },
  { keys: ['F'], description: 'Toggle full-screen mode', category: 'View' },
  { keys: ['D'], description: 'Toggle dark/light theme', category: 'View' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group by category
  const categories = SHORTCUTS.reduce<Record<string, Shortcut[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <Keyboard
                  className="h-5 w-5"
                  style={{ color: 'var(--admin-primary)' }}
                />
                <h2
                  className="text-base font-semibold font-heading"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-80"
              >
                <X className="h-4 w-4" style={{ color: 'var(--admin-text-muted)' }} />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="px-5 py-3 max-h-[60vh] overflow-y-auto">
              {Object.entries(categories).map(([category, shortcuts]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h3
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  >
                    {category}
                  </h3>
                  <div className="space-y-1.5">
                    {shortcuts.map((s) => (
                      <div
                        key={s.description}
                        className="flex items-center justify-between py-1"
                      >
                        <span
                          className="text-sm"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {s.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <span style={{ color: 'var(--admin-text-subtle)' }}>+</span>
                              )}
                              <kbd
                                className="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-mono font-medium min-w-[24px]"
                                style={{
                                  borderColor: 'var(--admin-border)',
                                  color: 'var(--admin-text)',
                                  backgroundColor: 'var(--admin-surface-2)',
                                }}
                              >
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
