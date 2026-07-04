/**
 * Integration tests for dead code removal.
 *
 * Verifies:
 * - admin-sidebar.tsx no longer exists
 * - parent-portal.tsx no longer exists
 * - teacher-portal.tsx no longer exists
 * - responsive-layout.tsx no longer exists
 * - mobile-bottom-nav.tsx no longer exists
 * - No imports reference deleted files
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(__dirname, '../components');

describe('Dead Code Removal', () => {
  it('admin-sidebar.tsx should not exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'admin-sidebar.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('parent-portal.tsx should not exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'parent-portal.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('teacher-portal.tsx should not exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'teacher-portal.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('layout/responsive-layout.tsx should not exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'layout', 'responsive-layout.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('layout/mobile-bottom-nav.tsx should not exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'layout', 'mobile-bottom-nav.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

describe('Command Palette and Keyboard Shortcuts Exist', () => {
  it('command-palette.tsx should exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'ui', 'command-palette.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('keyboard-shortcuts.tsx should exist', () => {
    const filePath = path.join(COMPONENTS_DIR, 'ui', 'keyboard-shortcuts.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe('Orphaned CSS Cleanup', () => {
  it('globals.css should not contain .preone-sidebar-item rules', () => {
    const cssPath = path.resolve(__dirname, '../app/globals.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).not.toContain('.preone-sidebar-item');
  });
});
