#!/usr/bin/env python3
"""
PreOne Token Migration — Pass 2
Cleans up remaining hardcoded gray-* patterns that Pass 1 missed.
These are typically in more complex contexts (template literals, dot colors, etc.)
"""

import os
import re
import glob

BASE_DIR = "/home/z/my-project/preone/src/app/admin"

# Pass 2 replacements — more granular
REPLACEMENTS = [
    # Dot/indicator colors
    (r'bg-gray-300\b', 'bg-[var(--admin-text-subtle)]'),
    (r'bg-gray-200\b', 'bg-[var(--admin-border)]'),
    (r'bg-gray-400/10\b', 'bg-[var(--admin-text-subtle)]/10'),
    (r'bg-gray-400/20\b', 'bg-[var(--admin-text-subtle)]/20'),
    (r'bg-gray-400\b', 'bg-[var(--admin-text-subtle)]'),
    (r'bg-gray-500\b', 'bg-[var(--admin-text-muted)]'),

    # Hover states
    (r'dark:hover:bg-gray-800\b', 'dark:hover:bg-[var(--admin-surface-2)]'),
    (r'dark:hover:bg-gray-700\b', 'dark:hover:bg-[var(--admin-surface-2)]'),
    (r'hover:bg-gray-200\b', 'hover:bg-[var(--admin-surface-2)]'),
    (r'hover:bg-gray-100\b', 'hover:bg-[var(--admin-surface-2)]'),

    # Borders (remaining)
    (r'border-gray-400/20\b', 'border-[var(--admin-text-subtle)]/20'),
    (r'border-gray-400\b', 'border-[var(--admin-border)]'),
    (r'border-gray-50\b', 'border-[var(--admin-border)]'),

    # Text (remaining)
    (r'text-gray-200\b', 'text-[var(--admin-text-subtle)]'),
    (r'text-gray-100\b', 'text-[var(--admin-text)]'),

    # Specific patterns
    (r'dark:bg-gray-800\b', 'dark:bg-[var(--admin-surface)]'),
    (r'dark:bg-gray-700\b', 'dark:bg-[var(--admin-surface)]'),
    (r'bg-gray-200\b', 'bg-[var(--admin-border)]'),

    # Separator lines
    (r'w-px bg-gray-200\b', 'w-px bg-[var(--admin-border)]'),
    (r'w-0\.5 h-6 bg-gray-200\b', 'w-0.5 h-6 bg-[var(--admin-border)]'),
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

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return 0

def main():
    admin_files = glob.glob(os.path.join(BASE_DIR, "**/*.tsx"), recursive=True)
    total_changes = 0
    files_changed = 0

    print(f"Pass 2: Scanning {len(admin_files)} files...")
    print("=" * 60)

    for filepath in sorted(admin_files):
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
