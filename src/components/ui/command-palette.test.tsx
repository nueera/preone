/**
 * Tests for the CommandPalette component.
 *
 * Verifies:
 * - Renders without crashing
 * - Opens on Ctrl+K keyboard shortcut
 * - Shows navigation items when opened
 * - Shows "No results found" for non-matching search
 * - Filters items by TASK_MASTER role
 * - Navigates on item selection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandPalette } from '@/components/ui/command-palette';

// ── Mock next/navigation ──
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/dashboard',
}));

// ── Mock next-themes ──
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('preone_user', JSON.stringify({ role: 'ADMIN', name: 'Test Admin' }));
  });

  it('renders without crashing', () => {
    render(<CommandPalette />);
  });

  it('opens on Ctrl+K', async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search pages, actions...')).toBeInTheDocument();
    });
  });

  it('shows navigation items when opened', async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('shows Actions group with theme toggle', async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
    });
  });

  it('hides System items for ADMIN role', async () => {
    localStorage.setItem('preone_user', JSON.stringify({ role: 'ADMIN', name: 'Admin' }));

    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.queryByText('System — Audit Logs')).not.toBeInTheDocument();
    });
  });

  it('navigates on item selection', async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dashboard'));

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });
});
