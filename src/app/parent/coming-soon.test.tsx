// ============================================================
// PreOne — Parent Coming Soon Sub-Pages Tests
// Tests cover: PreO Learning, PreO Gaming Coming Soon pages
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PreoLearningPage from './preo-learning/page';
import PreoGamingPage from './preo-gaming/page';

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
  ['BookOpen', 'Gamepad2', 'Sparkles'].forEach((name) => {
    icons[name] = (props: { className?: string; style?: React.CSSProperties }) => (
      <span data-icon={name} {...props} />
    );
  });
  return icons;
});

describe('PreO Learning Page', () => {
  it('renders page title', () => {
    render(<PreoLearningPage />);
    expect(screen.getByText('PreO Learning')).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    render(<PreoLearningPage />);
    expect(screen.getByText('Interactive learning modules for your child')).toBeInTheDocument();
  });

  it('renders coming soon banner', () => {
    render(<PreoLearningPage />);
    expect(screen.getByText('This feature is coming soon!')).toBeInTheDocument();
  });

  it('renders coming soon description mentioning PreO Learning', () => {
    render(<PreoLearningPage />);
    const matches = screen.getAllByText(/PreO Learning/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders placeholder content', () => {
    render(<PreoLearningPage />);
    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('uses var(--parent-primary) for icon background', () => {
    render(<PreoLearningPage />);
    const iconBg = document.querySelector('[style*="var(--parent-primary-soft)"]');
    expect(iconBg).toBeInTheDocument();
  });

  it('uses var(--parent-warning-soft) for coming soon banner', () => {
    render(<PreoLearningPage />);
    const banner = document.querySelector('[style*="var(--parent-warning-soft)"]');
    expect(banner).toBeInTheDocument();
  });
});

describe('PreO Gaming Page', () => {
  it('renders page title', () => {
    render(<PreoGamingPage />);
    expect(screen.getByText('PreO Gaming')).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    render(<PreoGamingPage />);
    expect(screen.getByText('Fun learning games for your child')).toBeInTheDocument();
  });

  it('renders coming soon banner', () => {
    render(<PreoGamingPage />);
    expect(screen.getByText('This feature is coming soon!')).toBeInTheDocument();
  });

  it('renders coming soon description mentioning PreO Gaming', () => {
    render(<PreoGamingPage />);
    const matches = screen.getAllByText(/PreO Gaming/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders placeholder content', () => {
    render(<PreoGamingPage />);
    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('uses var(--parent-pink) for icon background', () => {
    render(<PreoGamingPage />);
    const iconBg = document.querySelector('[style*="var(--parent-pink-soft)"]');
    expect(iconBg).toBeInTheDocument();
  });
});
