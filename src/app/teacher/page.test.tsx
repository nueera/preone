// ============================================================
// PreOne — Teacher Landing Page Tests
// Tests cover: page header, module cards, navigation, CSS variables,
// layout, Coming Soon badges, illustration fallback
// Header is now provided by TeacherHeader in teacher-layout-client.tsx
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeacherLandingPage from './page';

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



// ── Mock lucide-react icons ──
vi.mock('lucide-react', () => {
  const icons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {};
  const iconNames = [
    'LayoutDashboard', 'Users', 'ClipboardCheck', 'FileEdit', 'Eye',
    'Activity', 'CalendarDays', 'MessageCircle', 'Megaphone', 'FileBarChart',
    'Bell', 'Settings', 'Bot', 'RefreshCw', 'ChevronRight',
  ];
  iconNames.forEach((name) => {
    icons[name] = (props: { className?: string; style?: React.CSSProperties }) => (
      <span data-icon={name} {...props} />
    );
  });
  return icons;
});

describe('TeacherLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Page Header Tests ──

  it('renders Modules title', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Modules')).toBeInTheDocument();
  });

  it('renders Quick access subtitle', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Quick access to all your modules')).toBeInTheDocument();
  });

  it('renders Refresh button', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  // ── Module Cards Tests ──

  it('renders all 14 module cards', () => {
    render(<TeacherLandingPage />);
    const moduleTitles = [
      'Dashboard', 'My Class', 'Attendance', 'Daily Updates',
      'Observations', 'Activities', 'Growth', 'Schedule',
      'Chat', 'Announcements', 'Reports', 'Notifications',
      'PreOne Assistant', 'Settings',
    ];
    moduleTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders Coming Soon badge for PreOne Assistant', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  // ── Navigation Tests ──

  it('renders correct routes for all modules', () => {
    render(<TeacherLandingPage />);
    const routes = [
      '/teacher/dashboard', '/teacher/my-class', '/teacher/attendance',
      '/teacher/daily-updates', '/teacher/observations', '/teacher/activities',
      '/teacher/growth', '/teacher/schedule', '/teacher/chat',
      '/teacher/announcements', '/teacher/reports', '/teacher/notifications',
      '/teacher/assistant', '/teacher/settings',
    ];
    routes.forEach((route) => {
      const link = document.querySelector(`a[href="${route}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  // ── CSS Variables Tests ──

  it('Modules title uses var(--teacher-text)', () => {
    render(<TeacherLandingPage />);
    const modulesTitle = screen.getByText('Modules');
    const style = modulesTitle.getAttribute('style');
    expect(style).toContain('var(--teacher-text)');
  });

  it('subtitle uses var(--teacher-text-muted)', () => {
    render(<TeacherLandingPage />);
    const subtitle = screen.getByText('Quick access to all your modules');
    const style = subtitle.getAttribute('style');
    expect(style).toContain('var(--teacher-text-muted)');
  });

  it('uses var(--teacher-*) tokens for card titles', () => {
    render(<TeacherLandingPage />);
    const attendanceTitle = screen.getByText('Attendance');
    const style = attendanceTitle.getAttribute('style');
    expect(style).toContain('var(--teacher-success)');
  });

  // ── Layout Tests ──

  it('renders cards in a grid layout', () => {
    render(<TeacherLandingPage />);
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });

  it('renders all 14 module cards as grid links', () => {
    render(<TeacherLandingPage />);
    const cards = document.querySelectorAll('.grid > a');
    expect(cards.length).toBe(14);
  });

  // ── Illustration Fallback Tests ──

  it('renders illustration images for modules with custom icons', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    // Modules with custom icons: Dashboard, My Class, Attendance, Daily Updates,
    // Observations, Growth, Schedule, Chat, Announcements, Reports, Settings (11)
    expect(images.length).toBe(11);
  });

  it('illustration images have correct src pattern', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Next.js Image transforms URLs to /_next/image?url=... format
      const src = img.getAttribute('src') || '';
      expect(src).toContain('icons%2Fteacher');
      expect(src).toContain('.webp');
    });
  });

  // ── PreOne Assistant Card Tests ──

  it('PreOne Assistant card renders without special border styling (consistent with other cards)', () => {
    render(<TeacherLandingPage />);
    const assistantTitle = screen.getByText('PreOne Assistant');
    const card = assistantTitle.closest('[class*="rounded-2xl"]');
    expect(card).toBeInTheDocument();
    expect(card?.className).not.toContain('border-2');
  });

  it('PreOne Assistant title uses var(--teacher-primary)', () => {
    render(<TeacherLandingPage />);
    const assistantTitle = screen.getByText('PreOne Assistant');
    const style = assistantTitle.getAttribute('style');
    expect(style).toContain('var(--teacher-primary)');
  });
});