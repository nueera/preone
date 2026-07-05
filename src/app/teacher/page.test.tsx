// ============================================================
// PreOne — Teacher Landing Page Tests
// Tests cover: header bar, module cards, navigation, CSS variables,
// layout, Coming Soon badges, illustration fallback
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
    'LayoutDashboard', 'Users', 'ClipboardCheck', 'FileEdit', 'Eye',
    'Activity', 'CalendarDays', 'MessageCircle', 'Megaphone', 'FileBarChart',
    'Bell', 'Settings', 'Bot', 'GraduationCap', 'Clock', 'ChevronDown',
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

  // ── Header Bar Tests ──

  it('renders PreOne brand name', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('PreOne')).toBeInTheDocument();
  });

  it('renders Teacher Portal subtitle', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Teacher Portal')).toBeInTheDocument();
  });

  it('renders greeting with name', () => {
    render(<TeacherLandingPage />);
    const greetingElements = screen.getAllByText(/Priya/);
    expect(greetingElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders profile initials PS', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('PS')).toBeInTheDocument();
  });

  it('renders profile name Priya Sharma', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
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

  it('uses var(--teacher-primary) for PreOne brand', () => {
    render(<TeacherLandingPage />);
    const brandName = screen.getByText('PreOne');
    const style = brandName.getAttribute('style');
    expect(style).toContain('var(--teacher-primary)');
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

  it('renders all module cards with hover', () => {
    render(<TeacherLandingPage />);
    const hoverCards = document.querySelectorAll('[data-hover="true"]');
    expect(hoverCards.length).toBe(14);
  });

  // ── Illustration Fallback Tests ──

  it('renders illustration images for module cards', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(14);
  });

  it('illustration images have correct src pattern', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^\/illustrations\/teacher-.*\.svg$/);
    });
  });

  // ── PreOne Assistant Special Card Tests ──

  it('PreOne Assistant card has special border styling', () => {
    render(<TeacherLandingPage />);
    const assistantTitle = screen.getByText('PreOne Assistant');
    const card = assistantTitle.closest('[data-hover]');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain('border-2');
  });

  it('PreOne Assistant title uses var(--teacher-primary)', () => {
    render(<TeacherLandingPage />);
    const assistantTitle = screen.getByText('PreOne Assistant');
    const style = assistantTitle.getAttribute('style');
    expect(style).toContain('var(--teacher-primary)');
  });
});
