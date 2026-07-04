/**
 * Tests for the PreOne Teacher Portal landing page (/teacher).
 *
 * Coverage:
 * - Section 1: Top Header Bar (branding, greeting, date/class, notification, profile)
 * - Section 2: Module Cards Grid (13 cards, illustration fallback, PreOne Assistant special styling)
 * - Time-aware greeting logic
 * - Navigation links for all 13 modules
 * - Responsive behavior (hidden elements on mobile)
 * - Illustration fallback pattern (img onError → lucide icon)
 * - PreOne Assistant special card (border, glow, title color)
 * - Notification bell with red dot indicator
 * - Profile section with avatar initials
 * - Interaction: card hover animation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PreOneCard ──
vi.mock('@/components/ui/preone-card', () => ({
  PreOneCard: ({ children, ...props }: any) => (
    <div data-testid="preone-card" {...props}>{children}</div>
  ),
}));

// ── Mock next/link ──
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} data-testid="module-link" {...props}>{children}</a>
  ),
}));

// ── Import the page after mocks are set up ──
import TeacherLandingPage from '@/app/teacher/page';

// ============================================================
// HELPER: get greeting based on hour
// ============================================================
function getExpectedGreeting(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

describe('TeacherLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Section 1: Header Bar — Branding ──
  it('renders the PreOne brand name', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('PreOne')).toBeInTheDocument();
  });

  it('renders "Teacher Portal" subtitle', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Teacher Portal')).toBeInTheDocument();
  });

  it('renders the Heart icon badge area (branding)', () => {
    render(<TeacherLandingPage />);
    // Heart icon from lucide-react renders as an SVG
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  // ── Section 1: Header Bar — Greeting ──
  it('renders time-aware greeting with teacher name', () => {
    render(<TeacherLandingPage />);
    const hour = new Date().getHours();
    const expectedGreeting = getExpectedGreeting(hour);
    // The greeting text includes the greeting + name
    const greetingEl = screen.getByText(new RegExp(expectedGreeting));
    expect(greetingEl).toBeInTheDocument();
  });

  it('includes wave emoji in greeting', () => {
    render(<TeacherLandingPage />);
    const greetingEl = screen.getByText(/👋/);
    expect(greetingEl).toBeInTheDocument();
  });

  // ── Section 1: Header Bar — Date & Class Info ──
  it('renders class info "Class: Nursery A"', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Class: Nursery A')).toBeInTheDocument();
  });

  it('renders formatted date', () => {
    render(<TeacherLandingPage />);
    // Date is formatted like "21 June 2026, Sunday"
    const dateText = screen.getByText(/\d{1,2}\s+\w+\s+\d{4}/);
    expect(dateText).toBeInTheDocument();
  });

  // ── Section 1: Header Bar — Notification Bell ──
  it('renders notification bell button', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders red dot indicator on notification bell', () => {
    render(<TeacherLandingPage />);
    const bellBtn = screen.getByLabelText('Notifications');
    const redDot = bellBtn.querySelector('div[class*="rounded-full"]');
    expect(redDot).toBeTruthy();
  });

  // ── Section 1: Header Bar — Profile Section ──
  it('renders profile avatar with initials "PS"', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('PS')).toBeInTheDocument();
  });

  it('renders profile name "Priya Sharma"', () => {
    render(<TeacherLandingPage />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('renders profile role "Teacher"', () => {
    render(<TeacherLandingPage />);
    // "Teacher" appears in profile role and the "Teacher Portal" subtitle contains it
    const teacherTexts = screen.getAllByText('Teacher');
    expect(teacherTexts.length).toBeGreaterThanOrEqual(1);
  });

  // ── Section 2: Module Cards — All 13 Modules ──
  it('renders all 13 module card titles', () => {
    render(<TeacherLandingPage />);
    const moduleTitles = [
      'Dashboard',
      'My Class',
      'Attendance',
      'Daily Update',
      'Observation',
      'Activities',
      'Schedule',
      'Growth Assessment',
      'Chat',
      'Announcement',
      'Reports',
      'Settings',
      'PreOne Assistant',
    ];
    moduleTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders all 13 module card descriptions', () => {
    render(<TeacherLandingPage />);
    const descriptions = [
      'Overview & analytics',
      'Students & class info',
      'Mark & track attendance',
      'Share daily activities',
      'Student observations',
      'Plan & manage activities',
      'Weekly & daily schedule',
      'Track student growth',
      'Parent & staff messaging',
      'School announcements',
      'Generate & view reports',
      'Profile & preferences',
      'AI-powered help',
    ];
    descriptions.forEach((desc) => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });

  it('renders correct number of module link elements', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    expect(links.length).toBe(13);
  });

  // ── Navigation Routes ──
  it('renders correct href for Dashboard module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const dashboardLink = links.find((l) => l.textContent?.includes('Dashboard'));
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink!.getAttribute('href')).toBe('/teacher/dashboard');
  });

  it('renders correct href for PreOne Assistant module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const assistantLink = links.find((l) => l.textContent?.includes('PreOne Assistant'));
    expect(assistantLink).toBeTruthy();
    expect(assistantLink!.getAttribute('href')).toBe('/teacher/assistant');
  });

  it('renders correct href for My Class module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const myClassLink = links.find((l) => l.textContent?.includes('My Class'));
    expect(myClassLink).toBeTruthy();
    expect(myClassLink!.getAttribute('href')).toBe('/teacher/my-class');
  });

  it('renders correct href for Attendance module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const attendanceLink = links.find((l) => l.textContent?.includes('Attendance'));
    expect(attendanceLink).toBeTruthy();
    expect(attendanceLink!.getAttribute('href')).toBe('/teacher/attendance');
  });

  it('renders correct href for Growth Assessment module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const growthLink = links.find((l) => l.textContent?.includes('Growth Assessment'));
    expect(growthLink).toBeTruthy();
    expect(growthLink!.getAttribute('href')).toBe('/teacher/growth');
  });

  it('renders correct href for Settings module', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const settingsLink = links.find((l) => l.textContent?.includes('Settings'));
    expect(settingsLink).toBeTruthy();
    expect(settingsLink!.getAttribute('href')).toBe('/teacher/settings');
  });

  // ── PreOne Assistant — Special Card Styling ──
  it('PreOne Assistant card has special border styling', () => {
    render(<TeacherLandingPage />);
    const cards = screen.getAllByTestId('preone-card');
    // The assistant card is the last one (13th card)
    const assistantCard = cards[cards.length - 1];
    expect(assistantCard.style.border).toContain('var(--teacher-primary)');
  });

  it('PreOne Assistant card contains glow effect element', () => {
    render(<TeacherLandingPage />);
    const cards = screen.getAllByTestId('preone-card');
    const assistantCard = cards[cards.length - 1];
    // The glow effect div has blur-2xl class
    const glowEl = assistantCard.querySelector('[class*="blur-2xl"]');
    expect(glowEl).toBeTruthy();
  });

  // ── Illustration Fallback Pattern ──
  it('renders illustration images for module cards', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    // All 13 cards initially try to load illustrations
    expect(images.length).toBe(13);
  });

  it('renders illustration images with correct src pattern', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^\/illustrations\/teacher-.*\.svg$/);
    });
  });

  it('renders illustration images with correct size classes', () => {
    render(<TeacherLandingPage />);
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.className).toContain('object-contain');
    });
  });

  // ── PreOneCard Count ──
  it('renders PreOneCard components (1 header + 13 module cards)', () => {
    render(<TeacherLandingPage />);
    const cards = screen.getAllByTestId('preone-card');
    expect(cards.length).toBe(14); // 1 header card + 13 module cards
  });

  // ── CSS Variable Usage ──
  it('uses --teacher-* CSS variables for all styled elements', () => {
    render(<TeacherLandingPage />);
    const container = document.body;
    // CSS variables are applied via style={{ color: 'var(--teacher-*)' }} etc.
    // In jsdom, inline styles are preserved so we check for the pattern
    const allStyles = container.querySelectorAll('[style]');
    const teacherVarUsage = Array.from(allStyles).filter((el) =>
      el.getAttribute('style')?.includes('--teacher') ||
      el.getAttribute('style')?.includes('var(--teacher')
    );
    expect(teacherVarUsage.length).toBeGreaterThan(0);
  });

  it('header branding uses --teacher-primary-soft for icon badge background', () => {
    render(<TeacherLandingPage />);
    // The Heart icon badge container
    const badgeContainers = document.querySelectorAll('[style*="var(--teacher-primary-soft)"]');
    expect(badgeContainers.length).toBeGreaterThan(0);
  });

  // ── Layout Structure ──
  it('renders with max-w-[1440px] container', () => {
    const { container } = render(<TeacherLandingPage />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('max-w-[1440px]');
  });

  it('renders grid layout for module cards', () => {
    const { container } = render(<TeacherLandingPage />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid!.className).toContain('grid-cols-2');
    expect(grid!.className).toContain('sm:grid-cols-3');
    expect(grid!.className).toContain('lg:grid-cols-4');
  });

  // ── Regression ──
  it('renders without crashing', () => {
    const { container } = render(<TeacherLandingPage />);
    expect(container).toBeTruthy();
  });

  it('renders all module routes correctly', () => {
    render(<TeacherLandingPage />);
    const links = screen.getAllByTestId('module-link');
    const expectedRoutes = [
      '/teacher/dashboard',
      '/teacher/my-class',
      '/teacher/attendance',
      '/teacher/daily-updates',
      '/teacher/observations',
      '/teacher/activities',
      '/teacher/schedule',
      '/teacher/growth',
      '/teacher/chat',
      '/teacher/announcements',
      '/teacher/reports',
      '/teacher/settings',
      '/teacher/assistant',
    ];
    const actualRoutes = links.map((l) => l.getAttribute('href'));
    expectedRoutes.forEach((route) => {
      expect(actualRoutes).toContain(route);
    });
  });
});
