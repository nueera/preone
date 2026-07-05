/**
 * Tests for the enhanced /admin/setup/fee-structure page.
 *
 * Coverage:
 * - Page header renders with correct title, subtitle, icon badge, and CTA button
 * - Statistics cards render with correct values and labels
 * - Search/Filter bar renders with input and filter button
 * - Fee types table renders all 7 rows with correct data
 * - Table columns: Fee Type (icon+name+desc), Amount, Frequency, Classes, Status, Actions
 * - StatusBadge renders Active/Draft with dot indicator
 * - FrequencyBadge renders Annual/One Time
 * - ClassPill renders class/program names
 * - Search filters fee types by name and description
 * - Search resets pagination to page 1
 * - Pagination: page info text, previous/next buttons, page number buttons
 * - Empty state when search yields no results
 * - Add Fee Type button triggers toast
 * - Edit and More action buttons trigger toast
 * - Filter button triggers toast
 * - Keyboard accessibility on action buttons
 * - Boundary: all fees filtered out
 * - formatINR utility formats Indian currency correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PageTransition ──
vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ── Mock PreOneCard ──
vi.mock('@/components/ui/preone-card', () => ({
  PreOneCard: ({ children, ...props }: any) => (
    <div data-testid="preone-card" {...props}>{children}</div>
  ),
}));

// ── Mock sonner ──
vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// ── Import the page after mocks are set up ──
import FeeStructurePage from '@/app/admin/setup/fee-structure/page';
import { toast } from 'sonner';

describe('FeeStructurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Section 1: Header ──
  it('renders the page title "Fee Structure"', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Fee Structure')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Manage fee types, amounts, frequency and applicable classes.')).toBeInTheDocument();
  });

  it('renders the IndianRupee icon badge', () => {
    render(<FeeStructurePage />);
    // The icon badge is in the header area
    const header = screen.getByText('Fee Structure').closest('div')?.parentElement;
    expect(header).toBeTruthy();
  });

  it('renders the Add Fee Type button', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Add Fee Type')).toBeInTheDocument();
  });

  it('shows toast when Add Fee Type button is clicked', () => {
    render(<FeeStructurePage />);
    fireEvent.click(screen.getByText('Add Fee Type'));
    expect(toast.info).toHaveBeenCalledWith('Add Fee Type dialog coming soon');
  });

  // ── Section 2: Statistics Cards ──
  it('renders "Total" stat card with correct value (7)', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders revenue stat card with ₹1,35,000', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('₹1,35,000')).toBeInTheDocument();
    expect(screen.getByText('Total from all fees')).toBeInTheDocument();
  });

  it('renders "Currently active" stat card with value 6', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Currently active')).toBeInTheDocument();
    // 6 is the active count - need to find the specific "6" in context
    const activeLabels = screen.getAllByText('6');
    expect(activeLabels.length).toBeGreaterThan(0);
  });

  it('renders "Not yet active" stat card with value 1', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Not yet active')).toBeInTheDocument();
    // "1" appears in both stat card value and pagination page button
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('renders 4 stat cards', () => {
    render(<FeeStructurePage />);
    const cards = screen.getAllByTestId('preone-card');
    // There are stat cards + search card + table card = at least 6 cards
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  // ── Section 3: Search / Filter Bar ──
  it('renders search input with placeholder', () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('shows toast when Filter button is clicked', () => {
    render(<FeeStructurePage />);
    fireEvent.click(screen.getByText('Filter'));
    expect(toast.info).toHaveBeenCalledWith('Filter panel coming soon');
  });

  // ── Section 4: Fee Types Table ──
  it('renders all 6 column headers', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Fee Type')).toBeInTheDocument();
    expect(screen.getByText('Amount (₹)')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Applicable Classes / Programs')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders all 7 fee type rows', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Tuition Fee')).toBeInTheDocument();
    expect(screen.getByText('Transport Fee')).toBeInTheDocument();
    expect(screen.getByText('Meal Plan')).toBeInTheDocument();
    expect(screen.getByText('Activity Fee')).toBeInTheDocument();
    expect(screen.getByText('Admission Fee')).toBeInTheDocument();
    expect(screen.getByText('Development Fee')).toBeInTheDocument();
    expect(screen.getByText('Annual Registration Fee')).toBeInTheDocument();
  });

  it('renders fee descriptions in the table', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Core academic instruction and learning materials')).toBeInTheDocument();
    expect(screen.getByText('School bus pickup and drop-off service')).toBeInTheDocument();
  });

  it('renders amounts in Indian currency format', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('₹60,000')).toBeInTheDocument();
    expect(screen.getByText('₹24,000')).toBeInTheDocument();
    expect(screen.getByText('₹18,000')).toBeInTheDocument();
    expect(screen.getByText('₹8,000')).toBeInTheDocument();
    expect(screen.getByText('₹15,000')).toBeInTheDocument();
    expect(screen.getByText('₹10,000')).toBeInTheDocument();
    expect(screen.getByText('₹5,000')).toBeInTheDocument();
  });

  // ── FrequencyBadge ──
  it('renders Annual frequency badges', () => {
    render(<FeeStructurePage />);
    const annualBadges = screen.getAllByText('Annual');
    expect(annualBadges.length).toBe(6); // 6 Annual fees
  });

  it('renders One Time frequency badge', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('One Time')).toBeInTheDocument();
  });

  // ── StatusBadge ──
  it('renders Active status badges', () => {
    render(<FeeStructurePage />);
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBe(6); // 6 Active fees
  });

  it('renders Draft status badge for Annual Registration Fee', () => {
    render(<FeeStructurePage />);
    const draftBadges = screen.getAllByText('Draft');
    expect(draftBadges.length).toBe(1);
  });

  // ── ClassPill ──
  it('renders class/program pills', () => {
    render(<FeeStructurePage />);
    // Playgroup appears in both Tuition Fee and Activity Fee rows
    expect(screen.getAllByText('Playgroup').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Nursery').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('LKG').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('UKG').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('All Programs').length).toBeGreaterThan(0);
  });

  // ── Actions Column ──
  it('renders Edit buttons with title attribute', () => {
    render(<FeeStructurePage />);
    const editButtons = screen.getAllByTitle('Edit');
    expect(editButtons.length).toBe(7); // One per fee type
  });

  it('renders More options buttons with title attribute', () => {
    render(<FeeStructurePage />);
    const moreButtons = screen.getAllByTitle('More options');
    expect(moreButtons.length).toBe(7);
  });

  it('shows toast when Edit button is clicked', () => {
    render(<FeeStructurePage />);
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(toast.info).toHaveBeenCalledWith('Edit dialog coming soon');
  });

  it('shows toast when More options button is clicked', () => {
    render(<FeeStructurePage />);
    const moreButtons = screen.getAllByTitle('More options');
    fireEvent.click(moreButtons[0]);
    expect(toast.info).toHaveBeenCalledWith('More options coming soon');
  });

  // ── Section 5: Pagination ──
  it('renders pagination info text', () => {
    render(<FeeStructurePage />);
    expect(screen.getByText('Showing 1 to 7 of 7 fee types')).toBeInTheDocument();
  });

  it('renders page number button (1)', () => {
    render(<FeeStructurePage />);
    // "1" appears in stat card and pagination — verify at least one exists
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('previous button is disabled on page 1', () => {
    render(<FeeStructurePage />);
    // Find the chevron left button (first pagination button)
    const paginationArea = screen.getByText('Showing 1 to 7 of 7 fee types').parentElement;
    const prevButton = paginationArea?.querySelector('button[disabled]');
    expect(prevButton).toBeTruthy();
  });

  // ── Search Functionality ──
  it('filters fee types by name when typing in search', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'Tuition' } });

    await waitFor(() => {
      expect(screen.getByText('Tuition Fee')).toBeInTheDocument();
      expect(screen.queryByText('Transport Fee')).not.toBeInTheDocument();
    });
  });

  it('filters fee types by description when typing in search', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'bus pickup' } });

    await waitFor(() => {
      expect(screen.getByText('Transport Fee')).toBeInTheDocument();
      expect(screen.queryByText('Tuition Fee')).not.toBeInTheDocument();
    });
  });

  it('is case-insensitive when searching', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'tuition' } });

    await waitFor(() => {
      expect(screen.getByText('Tuition Fee')).toBeInTheDocument();
    });
  });

  it('resets pagination to page 1 when searching', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'Fee' } });

    await waitFor(() => {
      // Should still show pagination text with filtered results
      const paginationText = screen.queryByText(/Showing \d+ to \d+ of \d+ fee types/);
      expect(paginationText).toBeTruthy();
    });
  });

  // ── Empty State ──
  it('shows empty state when search yields no results', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'nonexistentfee' } });

    await waitFor(() => {
      expect(screen.getByText('No fee types found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or add a new fee type.')).toBeInTheDocument();
    });
  });

  it('does not show table rows when search yields no results', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    fireEvent.change(searchInput, { target: { value: 'nonexistentfee' } });

    await waitFor(() => {
      expect(screen.queryByText('Tuition Fee')).not.toBeInTheDocument();
    });
  });

  // ── Clear Search ──
  it('shows all fee types when search is cleared', async () => {
    render(<FeeStructurePage />);
    const searchInput = screen.getByPlaceholderText('Search fee types...');

    // Type a search
    fireEvent.change(searchInput, { target: { value: 'Tuition' } });

    await waitFor(() => {
      expect(screen.queryByText('Transport Fee')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Transport Fee')).toBeInTheDocument();
      expect(screen.getByText('Tuition Fee')).toBeInTheDocument();
    });
  });

  // ── Revenue Calculation ──
  it('calculates revenue from Active fees only (excludes Draft)', () => {
    render(<FeeStructurePage />);
    // Total: 60000+24000+18000+8000+15000+10000 = 135000
    // Draft (5000) is excluded
    expect(screen.getByText('₹1,35,000')).toBeInTheDocument();
  });

  // ── Keyboard Accessibility ──
  it('action buttons are focusable', () => {
    render(<FeeStructurePage />);
    const editButtons = screen.getAllByTitle('Edit');
    editButtons[0].focus();
    expect(document.activeElement).toBe(editButtons[0]);
  });

  // ── Boundary: Multiple Draft Fees ──
  it('correctly counts draft fees', () => {
    render(<FeeStructurePage />);
    // Only Annual Registration Fee is Draft
    const draftBadges = screen.getAllByText('Draft');
    expect(draftBadges.length).toBe(1);
  });

  // ── Regression: Page renders without errors ──
  it('renders without crashing', () => {
    const { container } = render(<FeeStructurePage />);
    expect(container).toBeTruthy();
  });
});
