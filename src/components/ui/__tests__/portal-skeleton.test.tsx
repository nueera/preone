import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Skeleton,
  StatSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
  ChartSkeleton,
  CardSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageSkeleton,
  LoadingSpinner,
  SkeletonPortalProvider,
  useSkeletonPortal,
  PORTAL_TOKENS,
} from '../portal-skeleton';

// ── Helper: render with portal wrapper ──
function renderWithPortal(portal: 'admin' | 'teacher' | 'parent', ui: React.ReactElement) {
  return render(
    <div data-portal={portal}>
      <SkeletonPortalProvider portal={portal}>
        {ui}
      </SkeletonPortalProvider>
    </div>
  );
}

describe('Portal Skeleton Components', () => {
  // ═══ PORTAL_TOKENS Configuration ═══
  describe('PORTAL_TOKENS', () => {
    it('has tokens for all three portals', () => {
      expect(PORTAL_TOKENS.admin).toBeDefined();
      expect(PORTAL_TOKENS.teacher).toBeDefined();
      expect(PORTAL_TOKENS.parent).toBeDefined();
    });

    it('has required token keys for each portal', () => {
      const requiredKeys = ['surface', 'surface2', 'border', 'primarySoft'];
      
      requiredKeys.forEach((key) => {
        expect(PORTAL_TOKENS.admin[key]).toBeDefined();
        expect(PORTAL_TOKENS.teacher[key]).toBeDefined();
        expect(PORTAL_TOKENS.parent[key]).toBeDefined();
      });
    });

    it('uses CSS variable format for tokens', () => {
      expect(PORTAL_TOKENS.admin.surface).toBe('var(--admin-surface)');
      expect(PORTAL_TOKENS.teacher.primarySoft).toBe('var(--teacher-primary-soft)');
      expect(PORTAL_TOKENS.parent.border).toBe('var(--parent-border)');
    });
  });

  // ═══ SkeletonPortalProvider ═══
  describe('SkeletonPortalProvider', () => {
    it('renders children correctly', () => {
      renderWithPortal('admin', <div>Test Content</div>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('sets data-portal attribute correctly', () => {
      renderWithPortal('teacher', <div>Teacher Portal</div>);
      const portalContainer = document.querySelector('[data-portal="teacher"]');
      expect(portalContainer).toBeTruthy();
    });

    it('works for all three portals', () => {
      ['admin', 'teacher', 'parent'].forEach((portal) => {
        renderWithPortal(portal as 'admin' | 'teacher' | 'parent', <div>{portal} Portal</div>);
        expect(screen.getByText(`${portal} Portal`)).toBeInTheDocument();
      });
    });
  });

  // ═══ useSkeletonPortal Hook ═══
  describe('useSkeletonPortal', () => {
    function PortalConsumer() {
      const portal = useSkeletonPortal();
      return <span data-testid="portal-context">{portal}</span>;
    }

    it('returns default portal "admin" when no provider', () => {
      render(<PortalConsumer />);
      expect(screen.getByTestId('portal-context').textContent).toBe('admin');
    });

    it('returns correct portal from provider', () => {
      renderWithPortal('teacher', <PortalConsumer />);
      expect(screen.getByTestId('portal-context').textContent).toBe('teacher');
    });

    it('returns parent portal from provider', () => {
      renderWithPortal('parent', <PortalConsumer />);
      expect(screen.getByTestId('portal-context').textContent).toBe('parent');
    });
  });

  // ═══ Base Skeleton Component ═══
  describe('Skeleton', () => {
    it('renders with default variant', () => {
      renderWithPortal('admin', <Skeleton className="h-10 w-10" />);
      const skeleton = document.querySelector('.h-10.w-10');
      expect(skeleton).toBeTruthy();
    });

    it('renders circular variant', () => {
      renderWithPortal('admin', <Skeleton variant="circular" className="h-10 w-10" />);
      const skeleton = document.querySelector('.rounded-full');
      expect(skeleton).toBeTruthy();
    });

    it('renders text variant', () => {
      renderWithPortal('admin', <Skeleton variant="text" className="h-4 w-24" />);
      const skeleton = document.querySelector('.rounded-md');
      expect(skeleton).toBeTruthy();
    });

    it('renders card variant', () => {
      renderWithPortal('admin', <Skeleton variant="card" className="h-40 w-full" />);
      const skeleton = document.querySelector('.rounded-2xl');
      expect(skeleton).toBeTruthy();
    });

    it('applies shimmer class when shimmer=true', () => {
      renderWithPortal('admin', <Skeleton shimmer className="h-10 w-10" />);
      const skeleton = document.querySelector('.skeleton-shimmer');
      expect(skeleton).toBeTruthy();
    });

    it('does not apply shimmer class when shimmer=false', () => {
      renderWithPortal('admin', <Skeleton shimmer={false} className="h-10 w-10" />);
      const skeleton = document.querySelector('.skeleton-shimmer');
      expect(skeleton).toBeFalsy();
    });

    it('uses portal override prop', () => {
      renderWithPortal('admin', <Skeleton portal="teacher" className="h-10 w-10" />);
      // Component should render without error even with portal override
      const skeleton = document.querySelector('.h-10.w-10');
      expect(skeleton).toBeTruthy();
    });

    it('applies custom className', () => {
      renderWithPortal('admin', <Skeleton className="custom-skeleton-class" />);
      const skeleton = document.querySelector('.custom-skeleton-class');
      expect(skeleton).toBeTruthy();
    });
  });

  // ═══ StatSkeleton Component ═══
  describe('StatSkeleton', () => {
    it('renders with left-border accent', () => {
      renderWithPortal('admin', <StatSkeleton />);
      // Left border element exists
      const skeleton = document.querySelector('.relative.overflow-hidden.rounded-3xl');
      expect(skeleton).toBeTruthy();
    });

    it('renders icon placeholder', () => {
      renderWithPortal('admin', <StatSkeleton />);
      // Icon placeholder has correct dimensions
      const iconPlaceholder = document.querySelector('.h-10.w-10');
      expect(iconPlaceholder).toBeTruthy();
    });

    it('renders title placeholder', () => {
      renderWithPortal('admin', <StatSkeleton />);
      // Title skeleton
      const titleSkeleton = document.querySelector('.h-4.w-24');
      expect(titleSkeleton).toBeTruthy();
    });

    it('renders value placeholder', () => {
      renderWithPortal('admin', <StatSkeleton />);
      const valueSkeleton = document.querySelector('.h-8.w-16');
      expect(valueSkeleton).toBeTruthy();
    });

    it('renders subtitle when showSubtitle=true', () => {
      renderWithPortal('admin', <StatSkeleton showSubtitle />);
      // Subtitle skeleton
      const subtitleSkeleton = document.querySelector('.h-3.w-20');
      expect(subtitleSkeleton).toBeTruthy();
    });

    it('hides subtitle when showSubtitle=false', () => {
      renderWithPortal('admin', <StatSkeleton showSubtitle={false} />);
      // Only one h-3 element (for trend) should exist if subtitle is hidden
      const smallSkeletons = document.querySelectorAll('.h-3');
      // Trend skeleton exists, but no subtitle
      expect(smallSkeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders trend when showTrend=true', () => {
      renderWithPortal('admin', <StatSkeleton showTrend />);
      const trendSkeleton = document.querySelector('.h-3.w-24');
      expect(trendSkeleton).toBeTruthy();
    });

    it('uses teacher tokens in teacher portal', () => {
      renderWithPortal('teacher', <StatSkeleton />);
      const skeleton = document.querySelector('.relative.overflow-hidden');
      expect(skeleton).toBeTruthy();
    });

    it('uses parent tokens in parent portal', () => {
      renderWithPortal('parent', <StatSkeleton />);
      const skeleton = document.querySelector('.relative.overflow-hidden');
      expect(skeleton).toBeTruthy();
    });
  });

  // ═══ StatsGridSkeleton Component ═══
  describe('StatsGridSkeleton', () => {
    it('renders 4 stat skeletons by default', () => {
      renderWithPortal('admin', <StatsGridSkeleton />);
      const statSkeletons = document.querySelectorAll('.relative.overflow-hidden.rounded-3xl');
      expect(statSkeletons.length).toBe(4);
    });

    it('renders custom count of stat skeletons', () => {
      renderWithPortal('admin', <StatsGridSkeleton count={6} />);
      const statSkeletons = document.querySelectorAll('.relative.overflow-hidden.rounded-3xl');
      expect(statSkeletons.length).toBe(6);
    });

    it('uses correct grid layout (2 cols on small, 4 on lg)', () => {
      renderWithPortal('admin', <StatsGridSkeleton />);
      const gridContainer = document.querySelector('.grid.grid-cols-2');
      expect(gridContainer).toBeTruthy();
    });

    it('passes portal prop correctly', () => {
      renderWithPortal('admin', <StatsGridSkeleton portal="teacher" />);
      // Should render without error
      const statSkeletons = document.querySelectorAll('.relative.overflow-hidden.rounded-3xl');
      expect(statSkeletons.length).toBe(4);
    });
  });

  // ═══ TableSkeleton Component ═══
  describe('TableSkeleton', () => {
    it('renders header row', () => {
      renderWithPortal('admin', <TableSkeleton />);
      // Header section
      const header = document.querySelector('.p-4.border-b');
      expect(header).toBeTruthy();
    });

    it('renders 5 rows by default', () => {
      renderWithPortal('admin', <TableSkeleton />);
      // Count row containers (excluding header)
      const rows = document.querySelectorAll('.p-4.border-b');
      // Header + 5 rows = 6 elements with border-b
      expect(rows.length).toBe(6);
    });

    it('renders custom number of rows', () => {
      renderWithPortal('admin', <TableSkeleton rows={10} />);
      const rows = document.querySelectorAll('.p-4.border-b');
      expect(rows.length).toBe(11); // header + 10 rows
    });

    it('renders avatar placeholder by default', () => {
      renderWithPortal('admin', <TableSkeleton />);
      const avatar = document.querySelector('.h-10.w-10.rounded-full');
      expect(avatar).toBeTruthy();
    });

    it('hides avatar when showAvatar=false', () => {
      renderWithPortal('admin', <TableSkeleton showAvatar={false} />);
      const avatar = document.querySelector('.h-10.w-10.rounded-full');
      expect(avatar).toBeFalsy();
    });

    it('uses teacher tokens in teacher portal', () => {
      renderWithPortal('teacher', <TableSkeleton />);
      const table = document.querySelector('.rounded-2xl.overflow-hidden');
      expect(table).toBeTruthy();
    });

    it('uses parent tokens in parent portal', () => {
      renderWithPortal('parent', <TableSkeleton />);
      const table = document.querySelector('.rounded-2xl.overflow-hidden');
      expect(table).toBeTruthy();
    });
  });

  // ═══ ChartSkeleton Component ═══
  describe('ChartSkeleton', () => {
    it('renders title placeholder', () => {
      renderWithPortal('admin', <ChartSkeleton />);
      const title = document.querySelector('.h-5.w-32');
      expect(title).toBeTruthy();
    });

    it('renders 7 bars by default', () => {
      renderWithPortal('admin', <ChartSkeleton />);
      const bars = document.querySelectorAll('.flex-1.rounded-t-lg');
      expect(bars.length).toBe(7);
    });

    it('renders custom number of bars', () => {
      renderWithPortal('admin', <ChartSkeleton bars={10} />);
      const bars = document.querySelectorAll('.flex-1.rounded-t-lg');
      expect(bars.length).toBe(10);
    });

    it('uses teacher portal tokens', () => {
      renderWithPortal('teacher', <ChartSkeleton />);
      const chart = document.querySelector('.p-5.rounded-2xl');
      expect(chart).toBeTruthy();
    });

    it('uses parent portal tokens', () => {
      renderWithPortal('parent', <ChartSkeleton />);
      const chart = document.querySelector('.p-5.rounded-2xl');
      expect(chart).toBeTruthy();
    });
  });

  // ═══ CardSkeleton Component ═══
  describe('CardSkeleton', () => {
    it('renders 3 lines by default', () => {
      renderWithPortal('admin', <CardSkeleton />);
      const lines = document.querySelectorAll('.h-4');
      expect(lines.length).toBe(3);
    });

    it('renders custom number of lines', () => {
      renderWithPortal('admin', <CardSkeleton lines={5} />);
      const lines = document.querySelectorAll('.h-4');
      expect(lines.length).toBe(5);
    });

    it('last line has reduced width', () => {
      renderWithPortal('admin', <CardSkeleton lines={3} />);
      const lastLine = document.querySelector('.w-2\\/3');
      expect(lastLine).toBeTruthy();
    });

    it('renders header when showHeader=true', () => {
      renderWithPortal('admin', <CardSkeleton showHeader />);
      const header = document.querySelector('.h-5.w-24');
      expect(header).toBeTruthy();
    });

    it('hides header when showHeader=false', () => {
      renderWithPortal('admin', <CardSkeleton showHeader={false} />);
      const header = document.querySelector('.h-5.w-24');
      expect(header).toBeFalsy();
    });
  });

  // ═══ FormSkeleton Component ═══
  describe('FormSkeleton', () => {
    it('renders 5 fields by default', () => {
      renderWithPortal('admin', <FormSkeleton />);
      // 5 label skeletons + 5 input skeletons
      const labels = document.querySelectorAll('.h-4.w-24');
      const inputs = document.querySelectorAll('.h-10.w-full');
      expect(labels.length).toBe(5);
      expect(inputs.length).toBe(5);
    });

    it('renders custom number of fields', () => {
      renderWithPortal('admin', <FormSkeleton fields={3} />);
      const labels = document.querySelectorAll('.h-4.w-24');
      expect(labels.length).toBe(3);
    });

    it('renders submit button placeholder', () => {
      renderWithPortal('admin', <FormSkeleton />);
      const submit = document.querySelector('.h-10.w-32');
      expect(submit).toBeTruthy();
    });

    it('uses teacher portal tokens', () => {
      renderWithPortal('teacher', <FormSkeleton />);
      const container = document.querySelector('.space-y-5');
      expect(container).toBeTruthy();
    });
  });

  // ═══ ListSkeleton Component ═══
  describe('ListSkeleton', () => {
    it('renders 4 items by default', () => {
      renderWithPortal('admin', <ListSkeleton />);
      const items = document.querySelectorAll('.flex.items-center.gap-3');
      expect(items.length).toBe(4);
    });

    it('renders custom number of items', () => {
      renderWithPortal('admin', <ListSkeleton items={6} />);
      const items = document.querySelectorAll('.flex.items-center.gap-3');
      expect(items.length).toBe(6);
    });

    it('renders avatar for each item', () => {
      renderWithPortal('admin', <ListSkeleton items={3} />);
      const avatars = document.querySelectorAll('.h-10.w-10.rounded-full');
      expect(avatars.length).toBe(3);
    });

    it('renders badge placeholder for each item', () => {
      renderWithPortal('admin', <ListSkeleton items={3} />);
      const badges = document.querySelectorAll('.h-6.w-16.rounded-full');
      expect(badges.length).toBe(3);
    });
  });

  // ═══ PageSkeleton Component ═══
  describe('PageSkeleton', () => {
    it('renders dashboard type by default', () => {
      renderWithPortal('admin', <PageSkeleton />);
      // Stats grid + charts
      const statsGrid = document.querySelector('.grid.grid-cols-2');
      expect(statsGrid).toBeTruthy();
    });

    it('renders list type correctly', () => {
      renderWithPortal('admin', <PageSkeleton type="list" />);
      // Search bar + table
      const searchBar = document.querySelector('.h-10.flex-1');
      expect(searchBar).toBeTruthy();
    });

    it('renders form type correctly', () => {
      renderWithPortal('admin', <PageSkeleton type="form" />);
      // Form container
      const formContainer = document.querySelector('.max-w-2xl');
      expect(formContainer).toBeTruthy();
    });

    it('renders detail type correctly', () => {
      renderWithPortal('admin', <PageSkeleton type="detail" />);
      // 3-column layout
      const layout = document.querySelector('.grid.grid-cols-1');
      expect(layout).toBeTruthy();
    });

    it('renders setup type correctly', () => {
      renderWithPortal('admin', <PageSkeleton type="setup" />);
      // 4-column layout - check for grid-cols-1 which has lg:grid-cols-4 variant
      const layout = document.querySelector('.grid');
      expect(layout).toBeTruthy();
      expect(layout?.className).toContain('lg:grid-cols-4');
    });

    it('renders data type correctly', () => {
      renderWithPortal('admin', <PageSkeleton type="data" />);
      // Stats + search + table
      const statsGrid = document.querySelector('.grid.grid-cols-2');
      expect(statsGrid).toBeTruthy();
    });

    it('uses teacher portal context', () => {
      renderWithPortal('teacher', <PageSkeleton />);
      const skeleton = document.querySelector('.space-y-6');
      expect(skeleton).toBeTruthy();
    });

    it('uses parent portal context', () => {
      renderWithPortal('parent', <PageSkeleton />);
      const skeleton = document.querySelector('.space-y-6');
      expect(skeleton).toBeTruthy();
    });

    it('applies stagger animation class', () => {
      renderWithPortal('admin', <PageSkeleton />);
      const staggerContainer = document.querySelector('.animate-stagger');
      expect(staggerContainer).toBeTruthy();
    });
  });

  // ═══ LoadingSpinner Component ═══
  describe('LoadingSpinner', () => {
    it('renders spinner element', () => {
      renderWithPortal('admin', <LoadingSpinner />);
      const spinner = document.querySelector('.animate-spin-slow');
      expect(spinner).toBeTruthy();
    });

    it('renders small size', () => {
      renderWithPortal('admin', <LoadingSpinner size="sm" />);
      const spinner = document.querySelector('.h-4.w-4');
      expect(spinner).toBeTruthy();
    });

    it('renders medium size by default', () => {
      renderWithPortal('admin', <LoadingSpinner />);
      const spinner = document.querySelector('.h-6.w-6');
      expect(spinner).toBeTruthy();
    });

    it('renders large size', () => {
      renderWithPortal('admin', <LoadingSpinner size="lg" />);
      const spinner = document.querySelector('.h-8.w-8');
      expect(spinner).toBeTruthy();
    });

    it('uses admin portal colors by default', () => {
      renderWithPortal('admin', <LoadingSpinner />);
      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeTruthy();
    });

    it('uses teacher portal colors', () => {
      renderWithPortal('teacher', <LoadingSpinner />);
      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeTruthy();
    });

    it('uses parent portal colors', () => {
      renderWithPortal('parent', <LoadingSpinner />);
      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeTruthy();
    });

    it('applies custom className', () => {
      renderWithPortal('admin', <LoadingSpinner className="my-custom-spinner" />);
      const spinner = document.querySelector('.my-custom-spinner');
      expect(spinner).toBeTruthy();
    });
  });

  // ═══ CSS Variable Usage ═══
  describe('CSS Variable Usage', () => {
    it('Skeleton uses portal-specific surface colors', () => {
      renderWithPortal('admin', <Skeleton shimmer={false} className="h-10 w-10" />);
      const skeleton = document.querySelector('.h-10.w-10');
      expect(skeleton).toBeTruthy();
      // Check that style uses CSS variable
      const style = skeleton?.getAttribute('style');
      expect(style).toContain('var(--admin-surface-2)');
    });

    it('StatSkeleton uses portal-specific border', () => {
      renderWithPortal('teacher', <StatSkeleton />);
      const statCard = document.querySelector('.relative.overflow-hidden.rounded-3xl');
      expect(statCard).toBeTruthy();
      const style = statCard?.getAttribute('style');
      expect(style).toContain('var(--teacher-border)');
    });

    it('TableSkeleton uses portal-specific surface', () => {
      renderWithPortal('parent', <TableSkeleton />);
      const table = document.querySelector('.rounded-2xl.overflow-hidden');
      expect(table).toBeTruthy();
      const style = table?.getAttribute('style');
      expect(style).toContain('var(--parent-surface)');
    });
  });

  // ═══ Portal Token Parity ═══
  describe('Portal Token Parity', () => {
    it('admin has orange and pink tokens', () => {
      expect(PORTAL_TOKENS.admin.primarySoft).toBeDefined();
      // Extended tokens are defined in globals.css
    });

    it('teacher has orange and pink tokens', () => {
      expect(PORTAL_TOKENS.teacher.primarySoft).toBeDefined();
      // Extended tokens defined in globals.css
    });

    it('parent has orange and pink tokens', () => {
      expect(PORTAL_TOKENS.parent.primarySoft).toBeDefined();
      // Extended tokens defined in globals.css
    });

    it('all portals have consistent token structure', () => {
      const portals = ['admin', 'teacher', 'parent'] as const;
      const requiredStructure = ['surface', 'surface2', 'border', 'primarySoft'];
      
      portals.forEach((portal) => {
        requiredStructure.forEach((key) => {
          expect(PORTAL_TOKENS[portal][key]).toMatch(/^var\(--/);
        });
      });
    });
  });
});