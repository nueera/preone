#!/usr/bin/env python3
"""
PreOne Token Migration Script
Replaces hardcoded Tailwind gray-* classes with CSS custom property tokens
across all admin page files.

This fixes dark mode by ensuring all pages use the Midnight Garden theme tokens
instead of hardcoded gray values that bypass the design system.

Mappings:
  text-gray-900 dark:text-gray-100  →  text-[var(--admin-text)]
  text-gray-900                     →  text-[var(--admin-text)]
  text-gray-800 dark:text-gray-100  →  text-[var(--admin-text)]
  text-gray-800                     →  text-[var(--admin-text)]
  text-gray-700 dark:text-gray-300  →  text-[var(--admin-text)]
  text-gray-700                     →  text-[var(--admin-text-muted)]
  text-gray-600 dark:text-gray-400  →  text-[var(--admin-text-muted)]
  text-gray-600                     →  text-[var(--admin-text-muted)]
  text-gray-500 dark:text-gray-400  →  text-[var(--admin-text-muted)]
  text-gray-500                     →  text-[var(--admin-text-muted)]
  text-gray-400 dark:text-gray-500  →  text-[var(--admin-text-subtle)]
  text-gray-400                     →  text-[var(--admin-text-subtle)]
  text-gray-300                     →  text-[var(--admin-text-subtle)]

  bg-white dark:bg-gray-900         →  bg-[var(--admin-surface)]
  bg-white dark:bg-gray-800         →  bg-[var(--admin-surface)]
  bg-white                          →  bg-[var(--admin-surface)]  (only in admin pages)
  bg-gray-50 dark:bg-gray-900       →  bg-[var(--admin-surface-2)]
  bg-gray-50 dark:bg-gray-800       →  bg-[var(--admin-surface-2)]
  bg-gray-50 dark:bg-gray-800/50    →  bg-[var(--admin-surface-2)]
  bg-gray-50                        →  bg-[var(--admin-surface-2)]
  bg-gray-100 dark:bg-gray-800      →  bg-[var(--admin-surface-2)]
  bg-gray-100                       →  bg-[var(--admin-surface-2)]

  border-gray-200 dark:border-gray-700  →  border-[var(--admin-border)]
  border-gray-200 dark:border-gray-800  →  border-[var(--admin-border)]
  border-gray-200                       →  border-[var(--admin-border)]
  border-gray-300                       →  border-[var(--admin-border)]
  border-gray-100                       →  border-[var(--admin-border)]

  ring-gray-200                     →  ring-[var(--admin-border)]
  ring-gray-300                     →  ring-[var(--admin-border)]

  divide-gray-200                   →  divide-[var(--admin-border)]
  divide-gray-300                   →  divide-[var(--admin-border)]
"""

import os
import re
import glob

BASE_DIR = "/home/z/my-project/preone/src/app/admin"

# Ordered replacement rules — more specific patterns FIRST to avoid partial matches
# Format: (pattern, replacement)
REPLACEMENTS = [
    # ── TEXT COLORS (most specific first) ──
    # Combined light+dark patterns
    (r'text-gray-900\s+dark:text-gray-100', 'text-[var(--admin-text)]'),
    (r'text-gray-900\s+dark:text-gray-200', 'text-[var(--admin-text)]'),
    (r'text-gray-800\s+dark:text-gray-100', 'text-[var(--admin-text)]'),
    (r'text-gray-800\s+dark:text-gray-200', 'text-[var(--admin-text)]'),
    (r'text-gray-700\s+dark:text-gray-200', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-700\s+dark:text-gray-300', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-700\s+dark:text-gray-400', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-600\s+dark:text-gray-300', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-600\s+dark:text-gray-400', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-600\s+dark:text-gray-500', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-500\s+dark:text-gray-300', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-500\s+dark:text-gray-400', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-500\s+dark:text-gray-500', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-400\s+dark:text-gray-500', 'text-[var(--admin-text-subtle)]'),
    (r'text-gray-400\s+dark:text-gray-600', 'text-[var(--admin-text-subtle)]'),
    (r'text-gray-300\s+dark:text-gray-600', 'text-[var(--admin-text-subtle)]'),

    # Single patterns (after combined)
    (r'text-gray-900\b', 'text-[var(--admin-text)]'),
    (r'text-gray-800\b', 'text-[var(--admin-text)]'),
    (r'text-gray-700\b', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-600\b', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-500\b', 'text-[var(--admin-text-muted)]'),
    (r'text-gray-400\b', 'text-[var(--admin-text-subtle)]'),
    (r'text-gray-300\b', 'text-[var(--admin-text-subtle)]'),

    # ── BACKGROUND COLORS ──
    # Combined patterns
    (r'bg-white\s+dark:bg-gray-900/?\d*', 'bg-[var(--admin-surface)]'),
    (r'bg-white\s+dark:bg-gray-800/?\d*', 'bg-[var(--admin-surface)]'),
    (r'bg-white\s+dark:bg-slate-800', 'bg-[var(--admin-surface)]'),
    (r'bg-gray-50\s+dark:bg-gray-900/?\d*', 'bg-[var(--admin-surface-2)]'),
    (r'bg-gray-50\s+dark:bg-gray-800/?\d*', 'bg-[var(--admin-surface-2)]'),
    (r'bg-gray-100\s+dark:bg-gray-900/?\d*', 'bg-[var(--admin-surface-2)]'),
    (r'bg-gray-100\s+dark:bg-gray-800/?\d*', 'bg-[var(--admin-surface-2)]'),

    # Single bg patterns — CAREFUL: only in className context
    (r'bg-gray-50\b', 'bg-[var(--admin-surface-2)]'),
    (r'bg-gray-100\b', 'bg-[var(--admin-surface-2)]'),
    # bg-white is tricky - only replace when it's clearly a surface/card bg
    # We'll handle bg-white more carefully below

    # ── BORDER COLORS ──
    (r'border-gray-200\s+dark:border-gray-700', 'border-[var(--admin-border)]'),
    (r'border-gray-200\s+dark:border-gray-800', 'border-[var(--admin-border)]'),
    (r'border-gray-300\s+dark:border-gray-700', 'border-[var(--admin-border)]'),
    (r'border-gray-300\s+dark:border-gray-600', 'border-[var(--admin-border)]'),
    (r'border-gray-100\s+dark:border-gray-800', 'border-[var(--admin-border)]'),
    (r'border-gray-200\b', 'border-[var(--admin-border)]'),
    (r'border-gray-300\b', 'border-[var(--admin-border)]'),
    (r'border-gray-100\b', 'border-[var(--admin-border)]'),

    # ── RING COLORS ──
    (r'ring-gray-200\b', 'ring-[var(--admin-border)]'),
    (r'ring-gray-300\b', 'ring-[var(--admin-border)]'),

    # ── DIVIDE COLORS ──
    (r'divide-gray-200\b', 'divide-[var(--admin-border)]'),
    (r'divide-gray-300\b', 'divide-[var(--admin-border)]'),

    # ── SHADOW & OTHER ──
    (r'shadow-gray-\d+', 'shadow-[var(--admin-border)]'),
]

# Specific bg-white patterns — only in className contexts where it's clearly a card/surface
BG_WHITE_PATTERNS = [
    # Card-like wrappers
    (r'bg-white\s+dark:bg-gray-900', 'bg-[var(--admin-surface)]'),
    (r'bg-white\s+dark:bg-gray-800', 'bg-[var(--admin-surface)]'),
    # Standalone bg-white in common card patterns (be more careful)
    # We'll do this as a second pass with more context
]

def process_file(filepath):
    """Process a single file, applying all token replacements."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changes = 0

    for pattern, replacement in REPLACEMENTS:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            count = len(re.findall(pattern, content))
            changes += count
            content = new_content

    # Second pass: Handle bg-white more carefully
    # Only replace when it's a standalone bg-white in a className that looks like a card/surface
    # Pattern: "bg-white" followed by typical card classes like "rounded-xl border" or "rounded-2xl border"
    # But NOT in things like "bg-white/60" (opacity modifier)
    bg_white_card = re.compile(r'bg-white(?!\s+dark:)(?![/\d])')
    # Only replace bg-white when it appears alongside border or rounded (card indicator)
    if bg_white_card.search(content):
        # Find lines with bg-white that also have border or rounded
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if 'bg-white' in line and ('border' in line or 'rounded' in line or 'shadow' in line):
                new_line = bg_white_card.sub('bg-[var(--admin-surface)]', line)
                if new_line != line:
                    changes += 1
                new_lines.append(new_line)
            else:
                new_lines.append(line)
        content = '\n'.join(new_lines)

    # Third pass: Handle remaining dark: patterns that lost their light counterpart
    # e.g. after replacing "text-gray-900 dark:text-gray-100" → "text-[var(--admin-text)]"
    # there shouldn't be orphaned "dark:text-gray-*" but let's clean up just in case
    orphaned_dark = [
        (r'dark:text-gray-100\b', 'dark:text-[var(--admin-text)]'),
        (r'dark:text-gray-200\b', 'dark:text-[var(--admin-text)]'),
        (r'dark:text-gray-300\b', 'dark:text-[var(--admin-text-muted)]'),
        (r'dark:text-gray-400\b', 'dark:text-[var(--admin-text-muted)]'),
        (r'dark:text-gray-500\b', 'dark:text-[var(--admin-text-subtle)]'),
        (r'dark:text-gray-600\b', 'dark:text-[var(--admin-text-subtle)]'),
        (r'dark:bg-gray-900\b', 'dark:bg-[var(--admin-surface)]'),
        (r'dark:bg-gray-800\b', 'dark:bg-[var(--admin-surface)]'),
        (r'dark:bg-gray-700\b', 'dark:bg-[var(--admin-surface)]'),
        (r'dark:border-gray-700\b', 'dark:border-[var(--admin-border)]'),
        (r'dark:border-gray-800\b', 'dark:border-[var(--admin-border)]'),
        (r'dark:border-gray-600\b', 'dark:border-[var(--admin-border)]'),
    ]
    for pattern, replacement in orphaned_dark:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            count = len(re.findall(pattern, content))
            changes += count
            content = new_content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return 0


def main():
    """Main entry point."""
    # Find all TSX files in admin pages
    admin_files = glob.glob(os.path.join(BASE_DIR, "**/*.tsx"), recursive=True)
    # Also process admin layout and components
    extra_files = [
        "/home/z/my-project/preone/src/components/ui/empty-state.tsx",
        "/home/z/my-project/preone/src/components/ui/preone-card.tsx",
    ]

    all_files = admin_files + [f for f in extra_files if os.path.exists(f)]
    total_changes = 0
    files_changed = 0

    print(f"Scanning {len(all_files)} files...")
    print("=" * 60)

    for filepath in sorted(all_files):
        changes = process_file(filepath)
        if changes > 0:
            rel = os.path.relpath(filepath, "/home/z/my-project/preone/src")
            print(f"  ✓ {rel}: {changes} replacements")
            files_changed += 1
            total_changes += changes

    print("=" * 60)
    print(f"Done! {total_changes} replacements across {files_changed} files")


if __name__ == "__main__":
    main()
