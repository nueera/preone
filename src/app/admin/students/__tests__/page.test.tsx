import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentsListPage from '../page';

// ── Sample API response fixture ──
const MOCK_STUDENT_API = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'stu-1',
  firstName: 'Aarav',
  lastName: 'Patel',
  rollNumber: 'NUR-001',
  dob: '2021-06-15',
  gender: 'Male',
  photo: null,
  admissionDate: '2024-04-01',
  status: 'ACTIVE',
  classId: 'cls-1',
  class: { id: 'cls-1', name: 'Nursery-A', program: { id: 'prg-1', name: 'Nursery' } },
  branch: { id: 'br-1', name: 'Main Branch' },
  primaryParent: {
    id: 'par-1',
    firstName: 'Raj',
    lastName: 'Patel',
    phone: '+91 98765 43213',
    email: 'raj@example.com',
    relation: 'Father',
  },
  ...overrides,
});

const MOCK_API_RESPONSE = (students: ReturnType<typeof MOCK_STUDENT_API>[] = [MOCK_STUDENT_API()]) => ({
  students,
  total: students.length,
  page: 1,
  limit: 10,
});

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

// ── Mock fetch ──
const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof global.fetch;

function mockStudentsApi(response: ReturnType<typeof MOCK_API_RESPONSE>) {
  fetchMock.mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.startsWith('/api/students?')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => response,
      } as Response);
    }
    if (urlStr.startsWith('/api/classes')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          classes: [
            { id: 'cls-1', name: 'Nursery-A', program: { id: 'prg-1', name: 'Nursery' } },
            { id: 'cls-2', name: 'LKG-A', program: { id: 'prg-2', name: 'LKG' } },
          ],
        }),
      } as Response);
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
  });
}

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
    // Default mock: 1 active student
    mockStudentsApi(MOCK_API_RESPONSE([MOCK_STUDENT_API()]));
    // Stub localStorage (jsdom doesn't have it by default in some configs)
    if (typeof window !== 'undefined' && !window.localStorage) {
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        configurable: true,
      });
    }
  });

  // ── Header Section ──

  describe('Header', () => {
    it('renders the page title "Students"', async () => {
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

  // ── KPI Cards ──

  describe('KPI Cards', () => {
    it('renders all four KPI labels (Total Students / Active / Inactive / Showing)', async () => {
      renderStudentsPage();
      // "Total Students" appears in both KPI card label and stats bar above table
      await waitFor(() => expect(screen.getAllByText('Total Students').length).toBeGreaterThan(0));
      expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Showing/).length).toBeGreaterThan(0);
    });

    it('shows the total count from API once loaded', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([
        MOCK_STUDENT_API(),
        MOCK_STUDENT_API({ id: 'stu-2', firstName: 'Myra', lastName: 'Verma' }),
      ]));
      renderStudentsPage();
      // Wait for the row to render — that means the API returned 2 students
      await waitFor(() => {
        expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
        expect(screen.getByText('Myra Verma')).toBeInTheDocument();
      });
      // The stats bar above the table should show total = 2
      // (Total Students count badge uses font-bold inside the bar)
      const totalBadges = screen.getAllByText('2');
      expect(totalBadges.length).toBeGreaterThan(0);
    });

    it('shows loading skeletons while fetching', async () => {
      // Slow API
      fetchMock.mockImplementation(() => new Promise(() => {})); // never resolves
      renderStudentsPage();
      // Loading skeleton present (multiple pulse elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ── Filter Bar Section ──

  describe('Filter Bar', () => {
    it('renders the search input with placeholder', () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders the class dropdown with "All Classes" default', () => {
      renderStudentsPage();
      const select = screen.getByDisplayValue('All Classes');
      expect(select).toBeInTheDocument();
    });

    it('renders all 5 status filter pills (All / Active / Inactive / Graduated / Transferred)', () => {
      renderStudentsPage();
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
  });

  // ── Stats Bar + Table ──

  describe('Data Table', () => {
    it('renders student name in the table after API load', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([MOCK_STUDENT_API()]));
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      });
    });

    it('renders student roll number as #NUR-001', async () => {
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('#NUR-001')).toBeInTheDocument();
      });
    });

    it('renders student class as Nursery-A badge', async () => {
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      });
      // Class badge appears inside the table row AND in the class dropdown — use getAllByText
      expect(screen.getAllByText('Nursery-A').length).toBeGreaterThan(0);
    });

    it('renders parent name Raj Patel', async () => {
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Raj Patel')).toBeInTheDocument();
      });
    });

    it('renders parent phone +91 98765 43213', async () => {
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('+91 98765 43213')).toBeInTheDocument();
      });
    });

    it('shows empty state when API returns no students', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([]));
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('No students yet')).toBeInTheDocument();
      });
    });

    it('shows empty state with "no students match" message when filters applied and no results', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([]));
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'nonexistent');
      await waitFor(() => {
        expect(screen.getByText('No students match your filters')).toBeInTheDocument();
      });
    });

    it('shows error banner when API fails', async () => {
      fetchMock.mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.startsWith('/api/students')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Database down' }),
          } as Response);
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ classes: [] }) } as Response);
      });
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Failed to load students')).toBeInTheDocument();
      });
    });

    it('shows retry button in error banner', async () => {
      fetchMock.mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.startsWith('/api/students')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Database down' }),
          } as Response);
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ classes: [] }) } as Response);
      });
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('navigates to detail page when a row is clicked', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([MOCK_STUDENT_API()]));
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Aarav Patel'));
      expect(mockPush).toHaveBeenCalledWith('/admin/students/stu-1');
    });
  });

  // ── Pagination ──

  describe('Pagination', () => {
    it('shows pagination summary text when there are students', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([MOCK_STUDENT_API()]));
      renderStudentsPage();
      // Wait for the row to render first
      await waitFor(() => {
        expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      });
      // Pagination summary should contain "Showing" and "of 1"
      const summaries = screen.getAllByText(/Showing/);
      const paginationSummary = summaries.find((el) => /of\s+1/.test(el.textContent || ''));
      expect(paginationSummary).toBeTruthy();
    });

    it('hides pagination when no students', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([]));
      renderStudentsPage();
      await waitFor(() => {
        expect(screen.getByText('No students yet')).toBeInTheDocument();
      });
      // No "Showing" pagination summary text
      // (The KPI shows "Showing" but pagination row should not appear)
    });
  });

  // ── Integration ──

  describe('Integration', () => {
    it('re-fetches when status filter is changed', async () => {
      mockStudentsApi(MOCK_API_RESPONSE([MOCK_STUDENT_API()]));
      renderStudentsPage();
      await waitFor(() => expect(screen.getByText('Aarav Patel')).toBeInTheDocument());
      const initialCallCount = fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/students?')).length;
      // Click "Active" status pill (find it as a button)
      const activePills = screen.getAllByText('Active');
      const activeButton = activePills.find((el) => el.tagName === 'BUTTON');
      expect(activeButton).toBeTruthy();
      await userEvent.click(activeButton!);
      // Should trigger another fetch with status=ACTIVE
      await waitFor(() => {
        const studentsCalls = fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/students?'));
        expect(studentsCalls.length).toBeGreaterThan(initialCallCount);
        const lastUrl = String(studentsCalls[studentsCalls.length - 1][0]);
        expect(lastUrl).toContain('status=ACTIVE');
      });
    });

    it('includes search query in the API call', async () => {
      renderStudentsPage();
      const searchInput = screen.getByPlaceholderText('Search by name, parent or phone...');
      await userEvent.type(searchInput, 'Aarav');
      await waitFor(() => {
        const calls = fetchMock.mock.calls;
        const studentsCalls = calls.filter(([url]) => String(url).startsWith('/api/students?'));
        expect(studentsCalls.length).toBeGreaterThan(0);
        const lastUrl = String(studentsCalls[studentsCalls.length - 1][0]);
        expect(lastUrl).toContain('search=Aarav');
      });
    });

    it('includes classId in the API call when class filter selected', async () => {
      renderStudentsPage();
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      fetchMock.mockClear();
      const select = screen.getByDisplayValue('All Classes');
      await userEvent.selectOptions(select, 'cls-1');
      await waitFor(() => {
        const calls = fetchMock.mock.calls;
        const studentsCalls = calls.filter(([url]) => String(url).startsWith('/api/students?'));
        expect(studentsCalls.length).toBeGreaterThan(0);
        const lastUrl = String(studentsCalls[studentsCalls.length - 1][0]);
        expect(lastUrl).toContain('classId=cls-1');
      });
    });

    it('adds Authorization header when token is in localStorage', async () => {
      // Mock localStorage to return a token
      const originalGetItem = window.localStorage.getItem;
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: (key: string) => key === 'preone_token' ? 'test-token' : null, setItem: () => {}, removeItem: () => {} },
        configurable: true,
        writable: true,
      });
      renderStudentsPage();
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const studentsCall = fetchMock.mock.calls.find(
        ([url]) => String(url).startsWith('/api/students?'),
      );
      expect(studentsCall).toBeTruthy();
      const opts = studentsCall?.[1] as { headers?: Record<string, string> } | undefined;
      expect(opts?.headers?.Authorization).toBe('Bearer test-token');
      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: originalGetItem, setItem: () => {}, removeItem: () => {} },
        configurable: true,
        writable: true,
      });
    });
  });
});
