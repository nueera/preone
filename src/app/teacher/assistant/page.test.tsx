// ============================================================
// PreOne — Teacher Assistant Page Tests
// Tests cover: Coming Soon page rendering, CSS variables
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeacherAssistantPage from './page';

// ── Mock PreOneCard ──
vi.mock('@/components/ui/preone-card', () => ({
  PreOneCard: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// ── Mock lucide-react ──
vi.mock('lucide-react', () => {
  const icons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {};
  ['Bot', 'Sparkles'].forEach((name) => {
    icons[name] = (props: { className?: string; style?: React.CSSProperties }) => (
      <span data-icon={name} {...props} />
    );
  });
  return icons;
});

describe('TeacherAssistantPage', () => {
  it('renders page title', () => {
    render(<TeacherAssistantPage />);
    expect(screen.getByText('PreOne Assistant')).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    render(<TeacherAssistantPage />);
    expect(screen.getByText('AI-powered help for your teaching workflow')).toBeInTheDocument();
  });

  it('renders coming soon banner', () => {
    render(<TeacherAssistantPage />);
    expect(screen.getByText('This feature is coming soon!')).toBeInTheDocument();
  });

  it('renders coming soon description mentioning PreOne Assistant', () => {
    render(<TeacherAssistantPage />);
    const matches = screen.getAllByText(/PreOne Assistant/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders placeholder Coming Soon text', () => {
    render(<TeacherAssistantPage />);
    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('uses var(--teacher-primary) for title', () => {
    render(<TeacherAssistantPage />);
    const title = screen.getByText('PreOne Assistant');
    const style = title.getAttribute('style');
    expect(style).toContain('var(--teacher-primary)');
  });

  it('uses var(--teacher-warning-soft) for coming soon banner', () => {
    render(<TeacherAssistantPage />);
    const banner = document.querySelector('[style*="var(--teacher-warning-soft)"]');
    expect(banner).toBeInTheDocument();
  });

  it('renders description about AI-powered insights', () => {
    render(<TeacherAssistantPage />);
    expect(screen.getByText(/AI-powered insights/)).toBeInTheDocument();
  });
});
