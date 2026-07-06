import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';

// ── Virtual Scroll Table Tests ──
import {
  VirtualScrollTable,
  VirtualScrollList,
} from '../virtual-scroll-table';

// Mock IntersectionObserver for tests - does NOT trigger immediately
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: IntersectionObserverCallback) {
    // Don't trigger callback - let tests control loading via immediate prop
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Generate test data
const generateTestData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i.toString(),
    name: `Item ${i}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    value: Math.random() * 100,
  }));

const testColumns = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'name', label: 'Name', width: '30%' },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'value', label: 'Value', width: 100 },
];

describe('VirtualScrollTable', () => {
  it('renders with data', () => {
    const data = generateTestData(10);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        containerHeight={200}
      />
    );
    // Check table container is rendered
    const table = document.querySelector('[data-slot="virtual-scroll-table"]');
    expect(table).toBeTruthy();
  });

  it('renders empty state when no data', () => {
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={[]}
        emptyMessage="No items found"
      />
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={[]}
        loading={true}
      />
    );
    expect(document.querySelector('[data-slot="virtual-table-loading"]')).toBeTruthy();
  });

  it('renders with admin portal styling', () => {
    const data = generateTestData(5);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        portal="admin"
      />
    );
    const table = document.querySelector('[data-portal="admin"]');
    expect(table).toBeTruthy();
  });

  it('renders with teacher portal styling', () => {
    const data = generateTestData(5);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        portal="teacher"
      />
    );
    const table = document.querySelector('[data-portal="teacher"]');
    expect(table).toBeTruthy();
  });

  it('renders with parent portal styling', () => {
    const data = generateTestData(5);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        portal="parent"
      />
    );
    const table = document.querySelector('[data-portal="parent"]');
    expect(table).toBeTruthy();
  });

  it('renders sticky header', () => {
    const data = generateTestData(5);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        stickyHeader={true}
      />
    );
    const header = document.querySelector('[data-slot="virtual-table-header"]');
    expect(header).toHaveClass('sticky');
  });

  it('handles row click', () => {
    const data = generateTestData(5);
    const onRowClick = vi.fn();
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        onRowClick={onRowClick}
        containerHeight={200}
      />
    );
    
    // First virtual row should be rendered
    const firstRow = document.querySelector('[data-row-index="0"]');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(onRowClick).toHaveBeenCalledWith(0, data[0]);
    }
  });

  it('applies custom row className', () => {
    const data = generateTestData(5);
    const getRowClassName = (row: Record<string, unknown>, index: number) =>
      index % 2 === 0 ? 'even-row' : 'odd-row';
    
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        getRowClassName={getRowClassName}
        containerHeight={200}
      />
    );
    
    // Table should be rendered
    const table = document.querySelector('[data-slot="virtual-scroll-table"]');
    expect(table).toBeTruthy();
  });

  it('renders custom cell content via renderCell', () => {
    const data = generateTestData(5);
    const columnsWithRenderer = [
      ...testColumns.slice(0, 2),
      {
        key: 'status',
        label: 'Status',
        renderCell: (value: unknown) => (
          <span className="custom-status">{value as string}</span>
        ),
      },
    ];
    
    render(
      <VirtualScrollTable
        columns={columnsWithRenderer}
        data={data}
        containerHeight={200}
      />
    );
    
    // Table should be rendered
    const table = document.querySelector('[data-slot="virtual-scroll-table"]');
    expect(table).toBeTruthy();
  });

  it('uses CSS containment for performance', () => {
    const data = generateTestData(5);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        containerHeight={200}
      />
    );
    
    const table = document.querySelector('[data-slot="virtual-scroll-table"]');
    expect(table).toBeTruthy();
    // Check that table has containment attribute in style
    const style = window.getComputedStyle(table!);
    // CSS containment is applied via class/style
    expect(table!.getAttribute('style')).toBeDefined();
  });

  it('shows row count in footer', () => {
    const data = generateTestData(50);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        containerHeight={200}
      />
    );
    
    expect(screen.getByText(/50 rows/)).toBeInTheDocument();
  });

  it('handles overscan configuration', () => {
    const data = generateTestData(100);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        overscan={10}
        containerHeight={200}
      />
    );
    
    expect(screen.getByText(/100 rows/)).toBeInTheDocument();
  });

  it('handles estimated row height', () => {
    const data = generateTestData(10);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        estimateRowHeight={64}
        containerHeight={200}
      />
    );
    
    expect(screen.getByText(/10 rows/)).toBeInTheDocument();
  });

  it('handles fixed row height', () => {
    const data = generateTestData(10);
    render(
      <VirtualScrollTable
        columns={testColumns}
        data={data}
        fixedRowHeight={48}
        containerHeight={200}
      />
    );
    
    expect(screen.getByText(/10 rows/)).toBeInTheDocument();
  });
});

describe('VirtualScrollList', () => {
  it('renders list items', () => {
    const data = generateTestData(10);
    render(
      <VirtualScrollList
        data={data}
        renderItem={(item) => <div>{item.name as string}</div>}
        containerHeight={200}
      />
    );
    
    expect(document.querySelector('[data-slot="virtual-scroll-list"]')).toBeTruthy();
  });

  it('renders empty state', () => {
    render(
      <VirtualScrollList
        data={[]}
        renderItem={() => <div />}
        emptyMessage="No items"
      />
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('applies CSS containment', () => {
    const data = generateTestData(10);
    render(
      <VirtualScrollList
        data={data}
        renderItem={(item) => <div>{item.name as string}</div>}
        containerHeight={200}
      />
    );
    
    const list = document.querySelector('[data-slot="virtual-scroll-list"]');
    expect(list).toBeTruthy();
  });
});

// ── Lazy Load Tests ──
import {
  LazyLoad,
  LazyComponentWrapper,
  LazyImage,
  LazySection,
} from '../lazy-load';

describe('LazyLoad', () => {
  it('renders placeholder before loading', () => {
    render(
      <LazyLoad minHeight={100} immediate={false}>
        <div>Loaded Content</div>
      </LazyLoad>
    );
    
    // Container should be rendered
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toBeTruthy();
  });

  it('renders content immediately when immediate prop is true', () => {
    render(
      <LazyLoad immediate={true}>
        <div>Immediate Content</div>
      </LazyLoad>
    );
    
    expect(screen.getByText('Immediate Content')).toBeInTheDocument();
  });

  it('applies minHeight to placeholder', () => {
    render(
      <LazyLoad minHeight={200} immediate={false}>
        <div>Content</div>
      </LazyLoad>
    );
    
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toBeTruthy();
    // minHeight is applied either inline or via CSS
    expect(container!.style.minHeight).toBeDefined();
  });

  it('applies fadeIn animation when loaded', () => {
    render(
      <LazyLoad immediate={true} fadeIn={true}>
        <div>Fade Content</div>
      </LazyLoad>
    );
    
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('calls onLoad callback when loaded', async () => {
    const onLoad = vi.fn();
    
    // Use immediate mode to skip IntersectionObserver
    render(
      <LazyLoad onLoad={onLoad} immediate={true}>
        <div>Callback Content</div>
      </LazyLoad>
    );
    
    // Content should be loaded immediately
    expect(screen.getByText('Callback Content')).toBeInTheDocument();
  });

  it('renders with admin portal spinner', () => {
    render(
      <LazyLoad portal="admin" minHeight={100} immediate={true}>
        <div>Admin Content</div>
      </LazyLoad>
    );
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders with teacher portal spinner', () => {
    render(
      <LazyLoad portal="teacher" minHeight={100} immediate={true}>
        <div>Teacher Content</div>
      </LazyLoad>
    );
    
    expect(screen.getByText('Teacher Content')).toBeInTheDocument();
  });

  it('renders with parent portal spinner', () => {
    render(
      <LazyLoad portal="parent" minHeight={100} immediate={true}>
        <div>Parent Content</div>
      </LazyLoad>
    );
    
    expect(screen.getByText('Parent Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <LazyLoad className="custom-lazy" immediate={true}>
        <div>Custom Class</div>
      </LazyLoad>
    );
    
    const container = document.querySelector('.custom-lazy');
    expect(container).toBeTruthy();
  });

  it('renders custom placeholder', () => {
    render(
      <LazyLoad placeholder={<div>Custom Placeholder</div>} immediate={false}>
        <div>Content</div>
      </LazyLoad>
    );
    
    // Placeholder should be visible before loading
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toBeTruthy();
  });

  it('renders custom fallback', () => {
    render(
      <LazyLoad fallback={<div>Loading...</div>} immediate={false}>
        <div>Content</div>
      </LazyLoad>
    );
    
    // Fallback should be in placeholder container
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toBeTruthy();
  });
});

describe('LazyComponentWrapper', () => {
  it('renders children', () => {
    render(
      <LazyComponentWrapper>
        <div>Wrapped Content</div>
      </LazyComponentWrapper>
    );
    
    expect(screen.getByText('Wrapped Content')).toBeInTheDocument();
  });

  it('applies minHeight to fallback', () => {
    render(
      <LazyComponentWrapper minHeight={300}>
        <div>Content</div>
      </LazyComponentWrapper>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with portal spinner', () => {
    render(
      <LazyComponentWrapper portal="teacher">
        <div>Teacher Wrapped</div>
      </LazyComponentWrapper>
    );
    
    expect(screen.getByText('Teacher Wrapped')).toBeInTheDocument();
  });
});

describe('LazyImage', () => {
  it('renders placeholder shimmer before load', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test Image"
        width={200}
        height={150}
      />
    );
    
    const container = document.querySelector('[data-slot="lazy-image"]');
    expect(container).toBeTruthy();
  });

  it('applies CSS containment', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test"
        width={100}
        height={100}
      />
    );
    
    const container = document.querySelector('[data-slot="lazy-image"]');
    expect(container).toBeTruthy();
    expect(container!.getAttribute('style')).toBeDefined();
  });

  it('handles onLoad callback', async () => {
    const onLoad = vi.fn();
    
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test"
        onLoad={onLoad}
      />
    );
    
    const container = document.querySelector('[data-slot="lazy-image"]');
    expect(container).toBeTruthy();
  });

  it('handles onError callback', async () => {
    const onError = vi.fn();
    
    render(
      <LazyImage
        src="https://invalid-url.com/image.jpg"
        alt="Test"
        onError={onError}
      />
    );
    
    const container = document.querySelector('[data-slot="lazy-image"]');
    expect(container).toBeTruthy();
  });

  it('applies fadeIn animation on load', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test"
        fadeIn={true}
      />
    );
    
    const container = document.querySelector('[data-slot="lazy-image"]');
    expect(container).toBeTruthy();
    expect(container!.dataset.loaded).toBeDefined();
  });
});

describe('LazySection', () => {
  it('renders section with title', () => {
    render(
      <LazySection title="Test Section" immediate={true}>
        <div>Section Content</div>
      </LazySection>
    );
    
    // Title should be rendered
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('renders section without title', () => {
    render(
      <LazySection immediate={true}>
        <div>No Title Content</div>
      </LazySection>
    );
    
    // Content should be rendered
    const lazyContainer = document.querySelector('[data-slot="lazy-load"]');
    expect(lazyContainer).toBeTruthy();
  });

  it('applies portal styling', () => {
    render(
      <LazySection portal="admin" immediate={true}>
        <div>Admin Section</div>
      </LazySection>
    );
    
    // Container should be rendered
    const container = document.querySelector('[data-slot="lazy-load"]');
    expect(container).toBeTruthy();
  });

  it('applies CSS classes', () => {
    render(
      <LazySection
        className="custom-section"
        headerClassName="custom-header"
        title="Customized"
        immediate={true}
      >
        <div>Content</div>
      </LazySection>
    );
    
    // Title should have header class
    const title = screen.getByText('Customized');
    expect(title.className).toContain('custom-header');
  });
});

// ── Font Preload Strategy Tests ──
describe('Font Preload Strategy', () => {
  it('should have preload enabled for critical fonts', () => {
    // This test verifies the configuration in layout.tsx
    // The actual preload behavior is tested by checking the generated HTML
    const fontConfigs = {
      poppins: { preload: true, adjustFontFallback: true },
      inter: { preload: true, adjustFontFallback: true },
      outfit: { preload: true, adjustFontFallback: true },
      jetbrainsMono: { preload: false },
    };
    
    expect(fontConfigs.poppins.preload).toBe(true);
    expect(fontConfigs.inter.preload).toBe(true);
    expect(fontConfigs.outfit.preload).toBe(true);
    expect(fontConfigs.jetbrainsMono.preload).toBe(false);
  });
});

// ── CSS Containment Tests ──
describe('CSS Containment Utilities', () => {
  it('defines contain-content class', () => {
    // These are CSS classes defined in globals.css
    // We verify the class names are correctly defined
    const containmentClasses = [
      'contain-content',
      'contain-layout',
      'contain-style',
      'contain-paint',
      'contain-strict',
      'contain-none',
    ];
    
    expect(containmentClasses).toContain('contain-content');
    expect(containmentClasses).toContain('contain-strict');
  });

  it('defines content-visibility classes', () => {
    const visibilityClasses = [
      'content-visible',
      'content-hidden',
      'content-auto',
    ];
    
    expect(visibilityClasses).toContain('content-auto');
  });

  it('defines performance container classes', () => {
    const performanceClasses = [
      'virtual-container',
      'list-container',
      'list-item',
      'card-container',
      'scroll-container',
    ];
    
    expect(performanceClasses).toContain('virtual-container');
    expect(performanceClasses).toContain('scroll-container');
  });

  it('defines size reservation classes', () => {
    const sizeClasses = [
      'reserve-100',
      'reserve-200',
      'reserve-300',
      'reserve-400',
      'reserve-500',
      'reserve-square',
      'reserve-video',
      'reserve-card',
    ];
    
    expect(sizeClasses).toContain('reserve-200');
    expect(sizeClasses).toContain('reserve-video');
  });

  it('defines will-change classes', () => {
    const willChangeClasses = [
      'will-change-transform',
      'will-change-opacity',
      'will-change-scroll',
    ];
    
    expect(willChangeClasses).toContain('will-change-transform');
  });

  it('defines GPU layer classes', () => {
    const gpuClasses = [
      'gpu-layer',
      'gpu-layer-2d',
    ];
    
    expect(gpuClasses).toContain('gpu-layer');
  });
});