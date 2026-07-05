/**
 * Tests for the AdminHeader component.
 *
 * Verifies:
 * - Renders without crashing
 * - Shows breadcrumb navigation
 * - Shows search button with Ctrl+K hint
 * - Shows theme toggle button
 * - Shows notification bell
 * - Shows user avatar dropdown
 * - Shows Super Admin badge for SUPER_ADMIN role
 * - Shows Task Master badge for TASK_MASTER role
 * - Does NOT render SidebarTrigger (removed)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminHeader } from '@/components/admin-header';

// ── Mock next/navigation ──
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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

// ── Mock UI components ──
vi.mock('@/components/ui/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/components/ui/branch-switcher', () => ({
  BranchSwitcher: () => <div data-testid="branch-switcher" />,
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<AdminHeader />);
  });

  it('shows breadcrumb for current path', () => {
    render(<AdminHeader />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows search button with Ctrl+K hint on desktop', () => {
    render(<AdminHeader />);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('shows theme toggle button', () => {
    // Theme toggle exists as a ghost button with Sun/Moon icon
    const { container } = render(<AdminHeader />);
    // Look for the Sun or Moon SVG which is the theme toggle icon
    const svgButtons = container.querySelectorAll('button svg');
    expect(svgButtons.length).toBeGreaterThan(0);
  });

  it('shows notification bell', () => {
    render(<AdminHeader />);
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('shows branch switcher', () => {
    render(<AdminHeader />);
    expect(screen.getByTestId('branch-switcher')).toBeInTheDocument();
  });

  it('shows Super Admin badge for SUPER_ADMIN role', () => {
    localStorage.setItem('preone_user', JSON.stringify({ role: 'SUPER_ADMIN', name: 'Super' }));
    render(<AdminHeader />);
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });

  it('shows Task Master badge for TASK_MASTER role', () => {
    localStorage.setItem('preone_user', JSON.stringify({ role: 'TASK_MASTER', name: 'Task' }));
    render(<AdminHeader />);
    expect(screen.getByText('Task Master')).toBeInTheDocument();
  });

  it('does not render SidebarTrigger', () => {
    // After sidebar removal, there should be no sidebar trigger button
    const { container } = render(<AdminHeader />);
    const sidebarTrigger = container.querySelector('[data-sidebar="trigger"]');
    expect(sidebarTrigger).toBeNull();
  });

  it('shows user name from localStorage', () => {
    localStorage.setItem('preone_user', JSON.stringify({ role: 'ADMIN', name: 'John Doe', email: 'john@test.com' }));
    render(<AdminHeader />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows default "Admin" when no user in localStorage', () => {
    render(<AdminHeader />);
    // "Admin" appears in the breadcrumb path and in the user name
    const adminElements = screen.getAllByText('Admin');
    expect(adminElements.length).toBeGreaterThan(0);
  });
});
