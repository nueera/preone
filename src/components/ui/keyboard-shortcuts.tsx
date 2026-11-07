'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

// ── Keyboard shortcut definitions ──
interface ShortcutDef {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutDef[] = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'Actions' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo last action', category: 'Actions' },
  { keys: ['D'], description: 'Toggle dark/light mode', category: 'Actions' },
  { keys: ['F'], description: 'Toggle fullscreen', category: 'Actions' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Go To' },
  { keys: ['G', 'S'], description: 'Go to Settings', category: 'Go To' },
  { keys: ['G', 'A'], description: 'Go to Admissions', category: 'Go To' },
  { keys: ['G', 'R'], description: 'Go to Reports', category: 'Go To' },
  { keys: ['G', 'C'], description: 'Go to Chat', category: 'Go To' },
  { keys: ['Escape'], description: 'Close dialog / modal', category: 'General' },
];

/**
 * KeyboardShortcuts — Displays a help panel with all available keyboard shortcuts.
 *
 * Opens when the user presses "?".
 * Groups shortcuts by category for easy scanning.
 * Pressing Escape or clicking outside closes the panel.
 */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  // Register "?" shortcut to open this panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group shortcuts by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, ShortcutDef[]>();
    for (const s of SHORTCUTS) {
      const list = map.get(s.category) || [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick shortcuts to navigate and control the admin portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          {grouped.map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="space-y-1.5">
                {shortcuts.map((s) => (
                  <div
                    key={s.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((key, i) => (
                        <React.Fragment key={`${key}-${i}`}>
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                          <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
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

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
