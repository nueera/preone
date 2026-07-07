// ============================================================
// PreOne — Parent Landing Page Tests
// Tests cover: page header, module cards, navigation, CSS variables,
// responsive layout, Coming Soon badges, illustration fallback
// Header is now provided by ParentHeader in parent-layout-client.tsx
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParentLandingPage from './page';

// ── Mock next/link ──
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ── Mock PreOneCard ──
vi.mock('@/components/ui/preone-card', () => ({
  PreOneCard: ({
    children,
    className,
    hover,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    [key: string]: unknown;
  }) => (
    <div className={className} data-hover={hover ? 'true' : undefined} {...props}>
      {children}
    </div>
  ),
}));

// ── Mock lucide-react icons ──
vi.mock('lucide-react', () => {
  const icons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {};
  const iconNames = [
    'LayoutDashboard', 'Users', 'ClipboardCheck', 'IndianRupee', 'FileEdit',
    'Eye', 'BarChart3', 'MessageCircle', 'Megaphone', 'FileBarChart',
    'BookOpen', 'Settings', 'Gamepad2', 'RefreshCw',
  ];
  iconNames.forEach((name) => {
    icons[name] = (props: { className?: string; style?: React.CSSProperties }) => (
      <span data-icon={name} {...props} />
    );
  });
  return icons;
});

describe('ParentLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Page Header Tests ──

  it('renders Modules title', () => {
    render(<ParentLandingPage />);
    expect(screen.getByText('Modules')).toBeInTheDocument();
  });

  it('renders Quick access subtitle', () => {
    render(<ParentLandingPage />);
    expect(screen.getByText('Quick access to all your modules')).toBeInTheDocument();
  });

  it('renders Refresh button', () => {
    render(<ParentLandingPage />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  // ── Module Cards Tests ──

  it('renders all 13 module cards', () => {
    render(<ParentLandingPage />);
    const moduleTitles = [
      'Dashboard', 'My Children', 'Attendance', 'Fees',
      'Daily Update', 'Observation', 'Growth', 'Chat',
      'Announcements', 'Reports', 'PreO Learning', 'Settings', 'PreO Gaming',
    ];
    moduleTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders correct module descriptions', () => {
    render(<ParentLandingPage />);
    expect(screen.getByText('Overview & updates')).toBeInTheDocument();
    expect(screen.getByText('View child profiles')).toBeInTheDocument();
    expect(screen.getByText('Track attendance')).toBeInTheDocument();
    expect(screen.getByText('Fee payments & history')).toBeInTheDocument();
  });

  it('renders Coming Soon badges for PreO Learning and PreO Gaming', () => {
    render(<ParentLandingPage />);
    const comingSoonBadges = screen.getAllByText('Coming Soon');
    expect(comingSoonBadges.length).toBe(2);
  });

  it('does not render Coming Soon for active modules', () => {
    render(<ParentLandingPage />);
    // Dashboard card should NOT have a Coming Soon badge
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toBeInTheDocument();
    // Only 2 Coming Soon badges total (PreO Learning + PreO Gaming)
    const allComingSoon = screen.getAllByText('Coming Soon');
    expect(allComingSoon.length).toBe(2);
  });

  // ── Navigation Tests ──

  it('renders correct routes for all modules', () => {
    render(<ParentLandingPage />);
    const routes = [
      '/parent/dashboard', '/parent/children', '/parent/attendance', '/parent/fees',
      '/parent/daily-updates', '/parent/observations', '/parent/growth', '/parent/chat',
      '/parent/announcements', '/parent/reports', '/parent/preo-learning',
      '/parent/settings', '/parent/preo-gaming',
    ];
    routes.forEach((route) => {
      const link = document.querySelector(`a[href="${route}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  // ── CSS Variables Tests ──

  it('Modules title uses var(--parent-text)', () => {
    render(<ParentLandingPage />);
    const modulesTitle = screen.getByText('Modules');
    const style = modulesTitle.getAttribute('style');
    expect(style).toContain('var(--parent-text)');
  });

  it('subtitle uses var(--parent-text-muted)', () => {
    render(<ParentLandingPage />);
    const subtitle = screen.getByText('Quick access to all your modules');
    const style = subtitle.getAttribute('style');
    expect(style).toContain('var(--parent-text-muted)');
  });

  it('card titles use themed colors (not hardcoded hex)', () => {
    render(<ParentLandingPage />);
    const feesTitle = screen.getByText('Fees');
    expect(feesTitle).toBeInTheDocument();
    // Fees title should have style with var(--parent-orange)
    const style = feesTitle.getAttribute('style');
    expect(style).toContain('var(--parent-orange)');
  });

  // ── Layout Tests ──

  it('renders cards in a grid layout', () => {
    render(<ParentLandingPage />);
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });

  it('renders header card with hover-capable module cards', () => {
    render(<ParentLandingPage />);
    const hoverCards = document.querySelectorAll('[data-hover="true"]');
    // All 13 module cards should have hover
    expect(hoverCards.length).toBe(13);
  });

  // ── Illustration Fallback Tests ──

  it('renders illustration images for modules with custom icons', () => {
    render(<ParentLandingPage />);
    const images = document.querySelectorAll('img');
    // Modules with custom icons: My Children, Attendance, Fees, Observation,
    // Growth, Chat, Announcements, PreO Learning, Settings, PreO Gaming (10)
    expect(images.length).toBe(10);
  });

  it('illustration images have correct src pattern', () => {
    render(<ParentLandingPage />);
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Next.js Image transforms URLs to /_next/image?url=... format
      const src = img.getAttribute('src') || '';
      expect(src).toContain('icons%2Fparent');
      expect(src).toContain('.webp');
    });
  });

  // ── Extended Color Variables Tests ──

  it('uses var(--parent-pink) for Observation card', () => {
    render(<ParentLandingPage />);
    const obsTitle = screen.getByText('Observation');
    expect(obsTitle.getAttribute('style')).toContain('var(--parent-pink)');
  });

  it('uses var(--parent-orange) for Fees card', () => {
    render(<ParentLandingPage />);
    const feesTitle = screen.getByText('Fees');
    expect(feesTitle.getAttribute('style')).toContain('var(--parent-orange)');
  });

  it('uses var(--parent-pink) for PreO Gaming card', () => {
    render(<ParentLandingPage />);
    const gamingTitle = screen.getByText('PreO Gaming');
    expect(gamingTitle.getAttribute('style')).toContain('var(--parent-pink)');
  });
});