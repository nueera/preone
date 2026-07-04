/**
 * Tests for the PreOne Assistant page (/teacher/assistant).
 *
 * Coverage:
 * - Page header with icon badge, title, subtitle
 * - Coming Soon card with icon, title, description
 * - All colors via --teacher-* CSS variables
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PreOneCard ──
vi.mock('@/components/ui/preone-card', () => ({
  PreOneCard: ({ children, ...props }: any) => (
    <div data-testid="preone-card" {...props}>{children}</div>
  ),
}));

// ── Import the page after mocks are set up ──
import AssistantPage from '@/app/teacher/assistant/page';

describe('AssistantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Header Section ──
  it('renders page title "PreOne Assistant"', () => {
    render(<AssistantPage />);
    expect(screen.getByText('PreOne Assistant')).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    render(<AssistantPage />);
    expect(screen.getByText('AI-powered help and suggestions for teachers')).toBeInTheDocument();
  });

  // ── Coming Soon Card ──
  it('renders "Coming Soon" heading', () => {
    render(<AssistantPage />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders coming soon description', () => {
    render(<AssistantPage />);
    expect(screen.getByText(/PreOne Assistant is being crafted/)).toBeInTheDocument();
  });

  it('renders Bot icon in header badge area', () => {
    render(<AssistantPage />);
    // SVG icons from lucide-react
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2); // One in header, one in card
  });

  // ── PreOneCard Usage ──
  it('renders PreOneCard for coming soon section', () => {
    render(<AssistantPage />);
    const cards = screen.getAllByTestId('preone-card');
    expect(cards.length).toBe(1);
  });

  // ── CSS Variables ──
  it('uses --teacher-* CSS variables for styling', () => {
    render(<AssistantPage />);
    const allStyles = document.querySelectorAll('[style]');
    const teacherVarUsage = Array.from(allStyles).filter((el) =>
      el.getAttribute('style')?.includes('--teacher') ||
      el.getAttribute('style')?.includes('var(--teacher')
    );
    expect(teacherVarUsage.length).toBeGreaterThan(0);
  });

  // ── Layout ──
  it('renders with max-w-[1440px] container', () => {
    const { container } = render(<AssistantPage />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('max-w-[1440px]');
  });

  // ── Regression ──
  it('renders without crashing', () => {
    const { container } = render(<AssistantPage />);
    expect(container).toBeTruthy();
  });
});
