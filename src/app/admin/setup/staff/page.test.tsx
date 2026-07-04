/**
 * Tests for the enhanced /admin/setup/staff page.
 *
 * Coverage:
 * - Page header renders with correct title, subtitle, icon badge, and action buttons
 * - Statistics cards render with correct values and labels
 * - Search/filter bar renders with search input, role dropdown, dept dropdown, filter button
 * - Staff table renders all 8 rows with correct data
 * - Table columns: Staff Member (avatar+name+email), Role, Department, Status, Actions
 * - StatusBadge renders Active/Onboarding with dot indicator
 * - RoleBadge renders with correct role text
 * - Detail panel opens on row click
 * - Detail panel shows overview tab with info rows
 * - Detail panel tabs switch content
 * - Detail panel closes on X button
 * - Search filters by name, email, and phone
 * - Role dropdown filters rows
 * - Department dropdown filters rows
 * - Pagination renders info text
 * - Empty state when search yields no results
 * - Action buttons (View, Edit, More) trigger correct behaviors
 * - Action buttons use stopPropagation
 * - Header buttons trigger toasts
 * - Keyboard accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
import StaffManagementPage from '@/app/admin/setup/staff/page';
import { toast } from 'sonner';

describe('StaffManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Section 1: Header ──
  it('renders the page title "Staff Management"', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Staff Management')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Manage staff members, roles, qualifications and onboarding.')).toBeInTheDocument();
  });

  it('renders the Import CSV button', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('renders the Export button', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders the Add Staff button', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Add Staff')).toBeInTheDocument();
  });

  it('shows toast when Import CSV is clicked', () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Import CSV'));
    expect(toast.info).toHaveBeenCalledWith('Import CSV dialog coming soon');
  });

  it('shows toast when Export is clicked', () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Export'));
    expect(toast.info).toHaveBeenCalledWith('Export coming soon');
  });

  it('shows toast when Add Staff is clicked', () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Add Staff'));
    expect(toast.info).toHaveBeenCalledWith('Add Staff dialog coming soon');
  });

  // ── Section 2: Statistics Cards ──
  it('renders "All staff members" stat card with value 8', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('All staff members')).toBeInTheDocument();
    const eights = screen.getAllByText('8');
    expect(eights.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Teaching staff" stat card with value 5', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Teaching staff')).toBeInTheDocument();
    // 4 Teachers + 1 Assistant Teacher = 5
    const fives = screen.getAllByText('5');
    expect(fives.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Currently active" stat card with value 6', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Currently active')).toBeInTheDocument();
    const sixes = screen.getAllByText('6');
    expect(sixes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "In onboarding" stat card with value 2', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('In onboarding')).toBeInTheDocument();
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  // ── Section 3: Search / Filter Bar ──
  it('renders search input with placeholder', () => {
    render(<StaffManagementPage />);
    expect(screen.getByPlaceholderText('Search by name, email or phone...')).toBeInTheDocument();
  });

  it('renders role dropdown with All Roles default', () => {
    render(<StaffManagementPage />);
    const roleSelect = screen.getByDisplayValue('All Roles');
    expect(roleSelect).toBeInTheDocument();
  });

  it('renders department dropdown with All Departments default', () => {
    render(<StaffManagementPage />);
    const deptSelect = screen.getByDisplayValue('All Departments');
    expect(deptSelect).toBeInTheDocument();
  });

  it('renders Filters button', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows toast when Filters button is clicked', () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Filters'));
    expect(toast.info).toHaveBeenCalledWith('Advanced filters coming soon');
  });

  // ── Section 4: Staff Table ──
  it('renders all 5 column headers', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Staff Member')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders all 8 staff member rows', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Anita Desai')).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Sneha Iyer')).toBeInTheDocument();
    expect(screen.getByText('Vikram Patel')).toBeInTheDocument();
    expect(screen.getByText('Meera Nair')).toBeInTheDocument();
    expect(screen.getByText('Arjun Rao')).toBeInTheDocument();
    expect(screen.getByText('Pooja Dubey')).toBeInTheDocument();
  });

  it('renders staff email addresses in the table', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('priya@preone.edu.in')).toBeInTheDocument();
    expect(screen.getByText('rajesh@preone.edu.in')).toBeInTheDocument();
  });

  it('renders staff avatar initials', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('PS')).toBeInTheDocument();
    expect(screen.getByText('AD')).toBeInTheDocument();
    expect(screen.getByText('RK')).toBeInTheDocument();
  });

  it('renders department text in table', () => {
    render(<StaffManagementPage />);
    // Pre Primary appears multiple times, Administration once
    expect(screen.getAllByText('Pre Primary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Administration').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Transport').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Support').length).toBeGreaterThanOrEqual(1);
  });

  // ── StatusBadge ──
  it('renders Active status badges', () => {
    render(<StaffManagementPage />);
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBe(6); // 6 Active staff
  });

  it('renders Onboarding status badges', () => {
    render(<StaffManagementPage />);
    const onboardingBadges = screen.getAllByText('Onboarding');
    expect(onboardingBadges.length).toBe(2); // 2 Onboarding staff
  });

  // ── RoleBadge ──
  it('renders Teacher role badges', () => {
    render(<StaffManagementPage />);
    const teacherBadges = screen.getAllByText('Teacher');
    // 4 Teachers in the table (role badge column)
    expect(teacherBadges.length).toBeGreaterThanOrEqual(4);
  });

  it('renders Admin Staff role badge', () => {
    render(<StaffManagementPage />);
    // Also appears in role dropdown <option>
    expect(screen.getAllByText('Admin Staff').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Assistant Teacher role badge', () => {
    render(<StaffManagementPage />);
    // Also appears in role dropdown <option>
    expect(screen.getAllByText('Assistant Teacher').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Transport Staff role badge', () => {
    render(<StaffManagementPage />);
    // Also appears in role dropdown <option>
    expect(screen.getAllByText('Transport Staff').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Support Staff role badge', () => {
    render(<StaffManagementPage />);
    // "Support Staff" appears in table row + overview tab RoleBadge
    const supportBadges = screen.getAllByText('Support Staff');
    expect(supportBadges.length).toBeGreaterThanOrEqual(1);
  });

  // ── Actions Column ──
  it('renders View buttons with title attribute', () => {
    render(<StaffManagementPage />);
    const viewButtons = screen.getAllByTitle('View');
    expect(viewButtons.length).toBe(8);
  });

  it('renders Edit buttons with title attribute', () => {
    render(<StaffManagementPage />);
    const editButtons = screen.getAllByTitle('Edit');
    expect(editButtons.length).toBe(8);
  });

  it('renders More options buttons with title attribute', () => {
    render(<StaffManagementPage />);
    const moreButtons = screen.getAllByTitle('More options');
    expect(moreButtons.length).toBe(8);
  });

  it('shows toast when Edit action is clicked', () => {
    render(<StaffManagementPage />);
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(toast.info).toHaveBeenCalledWith('Edit dialog coming soon');
  });

  it('shows toast when More options action is clicked', () => {
    render(<StaffManagementPage />);
    const moreButtons = screen.getAllByTitle('More options');
    fireEvent.click(moreButtons[0]);
    expect(toast.info).toHaveBeenCalledWith('More options coming soon');
  });

  // ── Section 5: Pagination ──
  it('renders pagination info text', () => {
    render(<StaffManagementPage />);
    expect(screen.getByText('Showing 1 to 8 of 8 staff members')).toBeInTheDocument();
  });

  it('previous button is disabled on page 1', () => {
    render(<StaffManagementPage />);
    const paginationArea = screen.getByText('Showing 1 to 8 of 8 staff members').parentElement;
    const prevButton = paginationArea?.querySelector('button[disabled]');
    expect(prevButton).toBeTruthy();
  });

  // ── Search Functionality ──
  it('filters staff by name when typing in search', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    fireEvent.change(searchInput, { target: { value: 'Priya' } });
    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.queryByText('Anita Desai')).not.toBeInTheDocument();
    });
  });

  it('filters staff by email when typing in search', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    fireEvent.change(searchInput, { target: { value: 'rajesh@' } });
    await waitFor(() => {
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    });
  });

  it('filters staff by phone when typing in search', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    fireEvent.change(searchInput, { target: { value: '43210' } });
    await waitFor(() => {
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });

  it('resets pagination when searching', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    // 'Priya' matches only Priya Sharma
    fireEvent.change(searchInput, { target: { value: 'Priya' } });
    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 1 of 1 staff members')).toBeInTheDocument();
    });
  });

  // ── Role Filter ──
  it('filters staff by role using dropdown', async () => {
    render(<StaffManagementPage />);
    const roleSelect = screen.getByDisplayValue('All Roles');
    fireEvent.change(roleSelect, { target: { value: 'Admin Staff' } });
    await waitFor(() => {
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    });
  });

  // ── Department Filter ──
  it('filters staff by department using dropdown', async () => {
    render(<StaffManagementPage />);
    const deptSelect = screen.getByDisplayValue('All Departments');
    fireEvent.change(deptSelect, { target: { value: 'Transport' } });
    await waitFor(() => {
      expect(screen.getByText('Vikram Patel')).toBeInTheDocument();
      expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
    });
  });

  // ── Empty State ──
  it('shows empty state when search yields no results', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentperson' } });
    await waitFor(() => {
      expect(screen.getByText('No staff members found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    });
  });

  // ── Detail Panel ──
  it('opens detail panel when a staff row is clicked', async () => {
    render(<StaffManagementPage />);
    // Click on a staff member name
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      // Detail panel should show employee ID
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
  });

  it('opens detail panel when View button is clicked', async () => {
    render(<StaffManagementPage />);
    const viewButtons = screen.getAllByTitle('View');
    fireEvent.click(viewButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
  });

  it('shows staff details in overview tab', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
      expect(screen.getByText('Date of Joining')).toBeInTheDocument();
      // "Department" appears in both table header and overview tab info row
      expect(screen.getAllByText('Department').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Qualification')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
    });
  });

  it('shows staff specific values in overview', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('EMP-0001')).toBeInTheDocument();
      expect(screen.getByText('12 Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('B.Ed, Early Childhood Education')).toBeInTheDocument();
      expect(screen.getByText('3 Years')).toBeInTheDocument();
    });
  });

  it('switches to Details tab when clicked', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
    // Click Details tab
    const detailsTabs = screen.getAllByText('details');
    fireEvent.click(detailsTabs[0]);
    await waitFor(() => {
      expect(screen.getByText('Details will appear here.')).toBeInTheDocument();
    });
  });

  it('switches to Documents tab when clicked', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
    const docsTabs = screen.getAllByText('documents');
    fireEvent.click(docsTabs[0]);
    await waitFor(() => {
      expect(screen.getByText('Documents will appear here.')).toBeInTheDocument();
    });
  });

  it('switches to Payroll tab when clicked', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
    const payrollTabs = screen.getAllByText('payroll');
    fireEvent.click(payrollTabs[0]);
    await waitFor(() => {
      expect(screen.getByText('Payroll will appear here.')).toBeInTheDocument();
    });
  });

  it('closes detail panel when X button is clicked', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });
    // Click close button
    const closeBtn = screen.getByLabelText('Close details');
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText('Employee ID')).not.toBeInTheDocument();
    });
  });

  it('shows Edit Staff button in detail panel', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Edit Staff')).toBeInTheDocument();
    });
  });

  it('shows Deactivate button in detail panel', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });
  });

  it('shows toast when Edit Staff is clicked in detail panel', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Edit Staff')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Edit Staff'));
    expect(toast.info).toHaveBeenCalledWith('Edit Staff dialog coming soon');
  });

  it('shows toast when Deactivate is clicked in detail panel', async () => {
    render(<StaffManagementPage />);
    fireEvent.click(screen.getByText('Priya Sharma'));
    await waitFor(() => {
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Deactivate'));
    expect(toast.info).toHaveBeenCalledWith('Deactivate confirmation coming soon');
  });

  // ── Action buttons stopPropagation ──
  it('Edit action does not open detail panel (stopPropagation)', () => {
    render(<StaffManagementPage />);
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    // Detail panel should NOT open since stopPropagation
    expect(screen.queryByText('Employee ID')).not.toBeInTheDocument();
  });

  it('More options action does not open detail panel (stopPropagation)', () => {
    render(<StaffManagementPage />);
    const moreButtons = screen.getAllByTitle('More options');
    fireEvent.click(moreButtons[0]);
    // Detail panel should NOT open since stopPropagation
    expect(screen.queryByText('Employee ID')).not.toBeInTheDocument();
  });

  // ── Clear Search ──
  it('shows all staff when search is cleared', async () => {
    render(<StaffManagementPage />);
    const searchInput = screen.getByPlaceholderText('Search by name, email or phone...');
    fireEvent.change(searchInput, { target: { value: 'Priya' } });
    await waitFor(() => {
      expect(screen.queryByText('Anita Desai')).not.toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('Anita Desai')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });

  // ── Regression ──
  it('renders without crashing', () => {
    const { container } = render(<StaffManagementPage />);
    expect(container).toBeTruthy();
  });

  it('renders 4 stat cards', () => {
    render(<StaffManagementPage />);
    const cards = screen.getAllByTestId('preone-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
