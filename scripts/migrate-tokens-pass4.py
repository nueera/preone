#!/usr/bin/env python3
"""
PreOne Token Migration — Pass 4
Fix remaining gray patterns in shared components and login page.
Uses semantic tokens (foreground, muted-foreground, card, border, muted) 
which auto-adapt per portal context.
"""
import os, re, glob

BASE = "/home/z/my-project/preone/src"

REPLACEMENTS = [
    # Combined text
    (r'text-gray-900\s+dark:text-gray-100', 'text-foreground'),
    (r'text-gray-900\s+dark:text-gray-200', 'text-foreground'),
    (r'text-gray-800\s+dark:text-gray-100', 'text-foreground'),
    (r'text-gray-800\s+dark:text-gray-200', 'text-foreground'),
    (r'text-gray-700\s+dark:text-gray-200', 'text-muted-foreground'),
    (r'text-gray-700\s+dark:text-gray-300', 'text-muted-foreground'),
    (r'text-gray-700\s+dark:text-gray-400', 'text-muted-foreground'),
    (r'text-gray-600\s+dark:text-gray-300', 'text-muted-foreground'),
    (r'text-gray-600\s+dark:text-gray-400', 'text-muted-foreground'),
    (r'text-gray-600\s+dark:text-gray-500', 'text-muted-foreground'),
    (r'text-gray-500\s+dark:text-gray-300', 'text-muted-foreground'),
    (r'text-gray-500\s+dark:text-gray-400', 'text-muted-foreground'),
    (r'text-gray-500\s+dark:text-gray-500', 'text-muted-foreground'),
    (r'text-gray-400\s+dark:text-gray-500', 'text-muted-foreground'),
    (r'text-gray-400\s+dark:text-gray-600', 'text-muted-foreground'),
    # Single text
    (r'text-gray-900\b', 'text-foreground'),
    (r'text-gray-800\b', 'text-foreground'),
    (r'text-gray-700\b', 'text-muted-foreground'),
    (r'text-gray-600\b', 'text-muted-foreground'),
    (r'text-gray-500\b', 'text-muted-foreground'),
    (r'text-gray-400\b', 'text-muted-foreground'),
    (r'text-gray-300\b', 'text-muted-foreground'),
    (r'text-gray-200\b', 'text-muted-foreground'),
    # BG combined
    (r'bg-white\s+dark:bg-gray-900/?\d*', 'bg-card'),
    (r'bg-white\s+dark:bg-gray-800/?\d*', 'bg-card'),
    (r'bg-gray-50\s+dark:bg-gray-900/?\d*', 'bg-muted'),
    (r'bg-gray-50\s+dark:bg-gray-800/?\d*', 'bg-muted'),
    (r'bg-gray-100\s+dark:bg-gray-900/?\d*', 'bg-muted'),
    (r'bg-gray-100\s+dark:bg-gray-800/?\d*', 'bg-muted'),
    # BG single
    (r'bg-gray-50\b', 'bg-muted'),
    (r'bg-gray-100\b', 'bg-muted'),
    (r'bg-gray-200\b', 'bg-muted'),
    (r'bg-gray-300\b', 'bg-muted-foreground/20'),
    (r'bg-gray-400/10\b', 'bg-muted-foreground/10'),
    (r'bg-gray-400/20\b', 'bg-muted-foreground/20'),
    (r'bg-gray-400\b', 'bg-muted-foreground/30'),
    (r'bg-gray-500\b', 'bg-muted-foreground'),
    # Border combined
    (r'border-gray-200\s+dark:border-gray-700', 'border-border'),
    (r'border-gray-200\s+dark:border-gray-800', 'border-border'),
    (r'border-gray-300\s+dark:border-gray-700', 'border-border'),
    (r'border-gray-300\s+dark:border-gray-600', 'border-border'),
    (r'border-gray-100\s+dark:border-gray-800', 'border-border'),
    # Border single
    (r'border-gray-200\b', 'border-border'),
    (r'border-gray-300\b', 'border-border'),
    (r'border-gray-100\b', 'border-border'),
    (r'border-gray-400\b', 'border-border'),
    (r'border-gray-50\b', 'border-border'),
    (r'border-gray-400/20\b', 'border-border'),
    # Ring/Divide
    (r'ring-gray-200\b', 'ring-border'),
    (r'ring-gray-300\b', 'ring-border'),
    (r'divide-gray-200\b', 'divide-border'),
    # Hover
    (r'dark:hover:bg-gray-800\b', 'dark:hover:bg-muted'),
    (r'dark:hover:bg-gray-700\b', 'dark:hover:bg-muted'),
    (r'hover:bg-gray-200\b', 'hover:bg-muted'),
    (r'hover:bg-gray-100\b', 'hover:bg-muted'),
    (r'hover:bg-gray-50\b', 'hover:bg-muted'),
    # Dark-only
    (r'dark:text-gray-100\b', 'dark:text-foreground'),
    (r'dark:text-gray-200\b', 'dark:text-foreground'),
    (r'dark:text-gray-300\b', 'dark:text-muted-foreground'),
    (r'dark:text-gray-400\b', 'dark:text-muted-foreground'),
    (r'dark:text-gray-500\b', 'dark:text-muted-foreground'),
    (r'dark:text-gray-600\b', 'dark:text-muted-foreground'),
    (r'dark:bg-gray-900\b', 'dark:bg-card'),
    (r'dark:bg-gray-800\b', 'dark:bg-card'),
    (r'dark:bg-gray-700\b', 'dark:bg-card'),
    (r'dark:border-gray-700\b', 'dark:border-border'),
    (r'dark:border-gray-800\b', 'dark:border-border'),
    (r'dark:border-gray-600\b', 'dark:border-border'),
]

def process_file(filepath):
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
    dirs = [
        os.path.join(BASE, "components"),
        os.path.join(BASE, "app/login"),
    ]
    files = []
    for d in dirs:
        files.extend(glob.glob(os.path.join(d, "**/*.tsx"), recursive=True))
    
    total = 0
    changed = 0
    print(f"Pass 4: Scanning {len(files)} component/login files...")
    for f in sorted(files):
        c = process_file(f)
        if c > 0:
            rel = os.path.relpath(f, BASE)
            print(f"  ✓ {rel}: {c}")
            changed += 1
            total += c
    print(f"Done! {total} replacements across {changed} files")

if __name__ == "__main__":
    main()
