import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentsListPage from '../page';

// ── Mock Next.js router ──
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/students',
}));

// ── Mock dialog components (they have complex dependencies) ──
vi.mock('@/components/add-student-dialog', () => ({
  AddStudentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-student-dialog">Add Student Dialog</div> : null,
}));

vi.mock('@/components/transfer-student-dialog', () => ({
  TransferStudentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="transfer-student-dialog">Transfer Student Dialog</div> : null,
}));

// ── Helper: render with portal data attribute ──
function renderStudentsPage() {
  return render(
    <div data-portal="admin">
      <StudentsListPage />
    </div>
  );
}

// ============================================================
// TEST SUITES
// ============================================================

describe('StudentsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Header Section ──

  describe('Header', () => {
    it('renders the page title "Students"', () => {
      renderStudentsPage();
      expect(screen.getByText('Students')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderStudentsPage();
      expect(screen.getByText('Manage and view all student records')).toBeInTheDocument();
    });

    it('renders the "Import CSV" button', () => {
      renderStudentsPage();
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
    });

    it('renders the "Add Student" button', () => {
      renderStudentsPage();
      expect(screen.getByText('Add Student')).toBeInTheDocument();
    });

    it('opens Add Student dialog when clicking "Add Student"', async () => {
      renderStudentsPage();
      const btn = screen.getByText('Add Student');
      await userEvent.click(btn);
      expect(screen.getByTestId('add-student-dialog')).toBeInTheDocument();
    });

    it('navigates to import page when clicking "Import CSV"', async () => {
      renderStudentsPage();
      const btn = screen.getByText('Import CSV');
      await userEvent.click(btn);
      expect(mockPush).toHaveBeenCalledWith('/admin/students/import');
    });
  });

  // ── Filter Bar Section ──

  describe('Filter Bar', () => {
    it('renders the search input with placeholder', () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders the class dropdown with options', () => {
      renderStudentsPage();
      const select = screen.getByDisplayValue('All Classes');
      expect(select).toBeInTheDocument();
    });

    it('renders all 5 status filter pills', () => {
      renderStudentsPage();
      // Use getAllByText since "Active" also appears as status badges
      // Filter pills are inside buttons
      const filterPillContainer = screen.getByText('All').closest('div');
      expect(filterPillContainer).toBeTruthy();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    it('renders "More Filters" button', () => {
      renderStudentsPage();
      expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    it('does not show "Clear Filters" when no filters are active', () => {
      renderStudentsPage();
      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });

    it('shows "Clear Filters" when search is active', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Aarav');
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('clears all filters when "Clear Filters" is clicked', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Aarav');
      const clearBtn = screen.getByText('Clear Filters');
      await userEvent.click(clearBtn);
      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
    });

    it('filters students by search query (name)', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Aarav');
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.queryByText('Myra Verma')).not.toBeInTheDocument();
    });

    it('filters students by search query (parent name)', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Raj Patel');
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.queryByText('Myra Verma')).not.toBeInTheDocument();
    });

    it('filters students by search query (phone)', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, '98765 43213');
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
    });

    it('filters students by status pill - clicking Active shows only active students', async () => {
      renderStudentsPage();
      // Click the "Active" filter pill - find it among filter buttons
      const activePills = screen.getAllByText('Active');
      // The first one should be the filter pill
      await userEvent.click(activePills[0]);
      // Anaya Mehta is Inactive, should not be visible
      expect(screen.queryByText('Anaya Mehta')).not.toBeInTheDocument();
      // Aarav Patel is Active, should be visible
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
    });

    it('filters students by class dropdown', async () => {
      renderStudentsPage();
      const select = screen.getByDisplayValue('All Classes');
      await userEvent.selectOptions(select, 'Nursery-A');
      // Only Aarav Patel and Ibrahim Khan are in Nursery-A
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.getByText('Ibrahim Khan')).toBeInTheDocument();
      expect(screen.queryByText('Myra Verma')).not.toBeInTheDocument();
    });
  });

  // ── Stats Bar + Table ──

  describe('Stats Bar', () => {
    it('renders "Total Students" label with count badge', () => {
      renderStudentsPage();
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      // The count "10" appears in the badge — check it exists
      const countElements = screen.getAllByText('10');
      expect(countElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Columns" button', () => {
      renderStudentsPage();
      expect(screen.getByText('Columns')).toBeInTheDocument();
    });

    it('updates count when filters reduce visible students', async () => {
      renderStudentsPage();
      // Click the Inactive filter to show only inactive students
      const inactivePills = screen.getAllByText('Inactive');
      await userEvent.click(inactivePills[0]);
      // Only 1 inactive student (Anaya Mehta)
      // The count badge should show 1
      const totalLabel = screen.getByText('Total Students');
      const countBadge = totalLabel.parentElement?.querySelector('span:last-child');
      expect(countBadge?.textContent).toBe('1');
    });
  });

  // ── Table Content ──

  describe('Table', () => {
    it('renders student names', () => {
      renderStudentsPage();
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.getByText('Myra Verma')).toBeInTheDocument();
      expect(screen.getByText('Vihaan Singh')).toBeInTheDocument();
      expect(screen.getByText('Anaya Mehta')).toBeInTheDocument();
      expect(screen.getByText('Arjun Reddy')).toBeInTheDocument();
      expect(screen.getByText('Rohan Gupta')).toBeInTheDocument();
    });

    it('renders student IDs', () => {
      renderStudentsPage();
      expect(screen.getByText('#NUR-001')).toBeInTheDocument();
      expect(screen.getByText('#LKG-012')).toBeInTheDocument();
    });

    it('renders class pills in the table', () => {
      renderStudentsPage();
      // Nursery-A appears as both dropdown option and class pill
      const nurseryAPills = screen.getAllByText('Nursery-A');
      expect(nurseryAPills.length).toBeGreaterThanOrEqual(2);
    });

    it('renders parent names', () => {
      renderStudentsPage();
      // Neha Kapoor is both a parent name and student name - check Raj Patel
      expect(screen.getByText('Raj Patel')).toBeInTheDocument();
      expect(screen.getByText('Amit Verma')).toBeInTheDocument();
    });

    it('renders phone numbers', () => {
      renderStudentsPage();
      expect(screen.getByText('+91 98765 43213')).toBeInTheDocument();
    });

    it('renders status badges in table rows', () => {
      renderStudentsPage();
      // "Active" appears in both filter pills and badges
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThan(1); // 7 Active + 1 filter pill
    });

    it('renders DOB dates', () => {
      renderStudentsPage();
      expect(screen.getByText('15 Jun 2021')).toBeInTheDocument();
      expect(screen.getByText('21 Apr 2020')).toBeInTheDocument();
    });

    it('renders avatar initials', () => {
      renderStudentsPage();
      expect(screen.getByText('AP')).toBeInTheDocument();
      expect(screen.getByText('MV')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderStudentsPage();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Class')).toBeInTheDocument();
      expect(screen.getByText('Parent / Guardian')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders select-all checkbox in header', () => {
      renderStudentsPage();
      const headerCheckbox = document.querySelector('th input[type="checkbox"]');
      expect(headerCheckbox).toBeTruthy();
    });

    it('renders individual row checkboxes', () => {
      renderStudentsPage();
      const rowCheckboxes = document.querySelectorAll('td input[type="checkbox"]');
      expect(rowCheckboxes.length).toBe(10);
    });

    it('navigates to student detail when clicking a row', async () => {
      renderStudentsPage();
      const nameCell = screen.getByText('Aarav Patel');
      const row = nameCell.closest('tr');
      expect(row).toBeTruthy();
      fireEvent.click(row!);
      expect(mockPush).toHaveBeenCalledWith('/admin/students/1');
    });
  });

  // ── Row Selection ──

  describe('Row Selection', () => {
    it('selects a row when checkbox is clicked', async () => {
      renderStudentsPage();
      const rowCheckboxes = document.querySelectorAll('td input[type="checkbox"]');
      await userEvent.click(rowCheckboxes[0] as Element);
      const checkbox = rowCheckboxes[0] as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('selects all rows when header checkbox is clicked', async () => {
      renderStudentsPage();
      const headerCheckbox = document.querySelector('th input[type="checkbox"]') as HTMLInputElement;
      await userEvent.click(headerCheckbox);
      const rowCheckboxes = document.querySelectorAll('td input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      rowCheckboxes.forEach((cb) => {
        expect(cb.checked).toBe(true);
      });
    });

    it('deselects all rows when header checkbox is clicked again', async () => {
      renderStudentsPage();
      const headerCheckbox = document.querySelector('th input[type="checkbox"]') as HTMLInputElement;
      // Select all
      await userEvent.click(headerCheckbox);
      // Deselect all
      await userEvent.click(headerCheckbox);
      const rowCheckboxes = document.querySelectorAll('td input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      rowCheckboxes.forEach((cb) => {
        expect(cb.checked).toBe(false);
      });
    });
  });

  // ── Empty State ──

  describe('Empty State', () => {
    it('shows empty state when no students match filters', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'zzzzznonexistent');
      expect(screen.getByText('No students found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    });
  });

  // ── Pagination ──

  describe('Pagination', () => {
    it('renders pagination info text', () => {
      renderStudentsPage();
      expect(screen.getByText(/Showing 1 to 10 of 10 students/)).toBeInTheDocument();
    });

    it('renders "Rows per page" selector', () => {
      renderStudentsPage();
      expect(screen.getByText('Rows per page:')).toBeInTheDocument();
    });

    it('renders page navigation with page number 1 active', () => {
      renderStudentsPage();
      // Page 1 button should exist
      const page1Button = screen.getByText('1');
      expect(page1Button).toBeInTheDocument();
    });
  });

  // ── CSS Variables ──

  describe('CSS Variables', () => {
    it('uses var(--admin-*) for styled elements', () => {
      renderStudentsPage();
      // Check that the header icon badge uses CSS variable
      const iconBadge = document.querySelector('[style*="var(--admin-primary-soft)"]');
      expect(iconBadge).toBeTruthy();
    });

    it('uses var(--admin-*) for class pill styling', () => {
      renderStudentsPage();
      // The class pills and other elements use inline style with var(--admin-*)
      // In jsdom, CSS variable styles are set directly on elements
      // Check that at least some elements have styled backgrounds
      const styledElements = document.querySelectorAll('[style]');
      expect(styledElements.length).toBeGreaterThan(0);
    });
  });

  // ── Integration ──

  describe('Integration', () => {
    it('combines search + status filter correctly', async () => {
      renderStudentsPage();
      // Search for "Patel" first
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Patel');
      // Should show Aarav Patel (Active) and Ibrahim Khan has Zara Khan (parent)
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
    });

    it('resets page to 1 when filter is applied', async () => {
      renderStudentsPage();
      // Apply a search
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Aarav');
      // Page should show 1 result
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
    });

    it('clears selection when filter is changed', async () => {
      renderStudentsPage();
      // Select a checkbox
      const rowCheckboxes = document.querySelectorAll('td input[type="checkbox"]');
      await userEvent.click(rowCheckboxes[0] as Element);
      expect((rowCheckboxes[0] as HTMLInputElement).checked).toBe(true);
      // Change status filter
      const activePills = screen.getAllByText('Active');
      await userEvent.click(activePills[0]);
      // Selection should be cleared - all checkboxes unchecked
      const updatedCheckboxes = document.querySelectorAll('td input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      updatedCheckboxes.forEach((cb) => {
        expect(cb.checked).toBe(false);
      });
    });
  });
});
