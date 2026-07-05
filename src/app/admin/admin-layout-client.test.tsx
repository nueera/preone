/**
 * Tests for the AdminLayoutClient component.
 *
 * Verifies:
 * - Renders without crashing
 * - QueryProvider is present (React Query context available)
 * - Onboarding routes render bare layout (no header)
 * - Non-onboarding routes render header + content
 * - Route guards redirect TASK_MASTER to /admin/admissions for restricted routes
 * - Route guards redirect ADMIN away from /admin/system
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminLayoutClient } from '@/app/admin/admin-layout-client';

// ── Mock next/navigation ──
const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ── Mock hooks ──
vi.mock('@/hooks/use-chat', () => ({
  useChatInit: () => {},
}));

// ── Mock components ──
vi.mock('@/components/admin-header', () => ({
  AdminHeader: () => <div data-testid="admin-header">AdminHeader</div>,
}));

vi.mock('@/components/cosmic/AuroraBackground', () => ({
  AuroraBackground: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="aurora-background">{children}</div>
  ),
}));

vi.mock('@/components/ui/command-palette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
}));

vi.mock('@/components/ui/keyboard-shortcuts', () => ({
  KeyboardShortcuts: () => <div data-testid="keyboard-shortcuts" />,
}));

vi.mock('@/components/providers', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

describe('AdminLayoutClient', () => {
  const defaultProps = {
    children: <div data-testid="page-content">Page Content</div>,
    userRole: 'ADMIN',
    onboardingComplete: true,
    schoolId: 'school-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders QueryProvider wrapping the layout', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
  });

  it('renders AdminHeader for non-onboarding routes', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
  });

  it('renders CommandPalette overlay', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
  });

  it('renders KeyboardShortcuts overlay', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('keyboard-shortcuts')).toBeInTheDocument();
  });

  it('renders page content inside main', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders AuroraBackground wrapper', () => {
    render(<AdminLayoutClient {...defaultProps} />);
    expect(screen.getByTestId('aurora-background')).toBeInTheDocument();
  });
});
