import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParentDetailPage from '../page';

// ── Mock Next.js router ──
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/parents/1',
  useParams: () => ({ id: '1' }),
}));

function renderDetailPage() {
  return render(
    <div data-portal="admin">
      <ParentDetailPage />
    </div>
  );
}

describe('ParentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Back Navigation ──
  describe('Back Navigation', () => {
    it('renders "Back to Parents" link', () => {
      renderDetailPage();
      expect(screen.getByText('Back to Parents')).toBeInTheDocument();
    });

    it('navigates back when clicking "Back to Parents"', () => {
      renderDetailPage();
      const backBtn = screen.getByText('Back to Parents');
      fireEvent.click(backBtn);
      expect(mockPush).toHaveBeenCalledWith('/admin/parents');
    });
  });

  // ── Parent Header ──
  describe('Parent Header', () => {
    it('renders parent name', () => {
      renderDetailPage();
      const names = screen.getAllByText('Rajesh Kumar');
      expect(names.length).toBeGreaterThanOrEqual(1);
    });

    it('renders relation badge', () => {
      renderDetailPage();
      const fatherBadges = screen.getAllByText('Father');
      expect(fatherBadges.length).toBeGreaterThan(0);
    });

    it('renders KYC status badge', () => {
      renderDetailPage();
      const verifiedBadges = screen.getAllByText('Verified');
      expect(verifiedBadges.length).toBeGreaterThan(0);
    });

    it('renders email in header', () => {
      renderDetailPage();
      const emails = screen.getAllByText('rajesh.kumar@email.com');
      expect(emails.length).toBeGreaterThanOrEqual(1);
    });

    it('renders phone in header', () => {
      renderDetailPage();
      const phones = screen.getAllByText('+91 98765 43210');
      expect(phones.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Edit Parent" button', () => {
      renderDetailPage();
      expect(screen.getByText('Edit Parent')).toBeInTheDocument();
    });

    it('renders "Deactivate" button', () => {
      renderDetailPage();
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    it('renders avatar initials', () => {
      renderDetailPage();
      expect(screen.getByText('RK')).toBeInTheDocument();
    });
  });

  // ── Tabs ──
  describe('Tabs', () => {
    it('renders all 4 tab labels', () => {
      renderDetailPage();
      // Tab labels appear as buttons
      const overviewTabs = screen.getAllByText('Overview');
      expect(overviewTabs.length).toBeGreaterThanOrEqual(1);
      const childrenTabs = screen.getAllByText('Children');
      expect(childrenTabs.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
    });

    it('shows Overview tab content by default', () => {
      renderDetailPage();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Account & KYC')).toBeInTheDocument();
    });

    it('switches to Children tab content when clicked', async () => {
      renderDetailPage();
      // Find the tab button for "Children"
      const childrenTabs = screen.getAllByText('Children');
      await userEvent.click(childrenTabs[0]);
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
    });

    it('switches to Documents tab content when clicked', async () => {
      renderDetailPage();
      await userEvent.click(screen.getByText('Documents'));
      expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('switches to Communication tab content when clicked', async () => {
      renderDetailPage();
      await userEvent.click(screen.getByText('Communication'));
      expect(screen.getByText('No recent conversations')).toBeInTheDocument();
      expect(screen.getByText('Start Conversation')).toBeInTheDocument();
    });
  });

  // ── Overview Tab ──
  describe('Overview Tab', () => {
    it('renders personal information fields', () => {
      renderDetailPage();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Primary Phone')).toBeInTheDocument();
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
    });

    it('renders account & KYC fields', () => {
      renderDetailPage();
      expect(screen.getByText('Date of Joining')).toBeInTheDocument();
      expect(screen.getByText('Parent ID')).toBeInTheDocument();
    });

    it('renders correct personal values', () => {
      renderDetailPage();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('HSR Layout, Bengaluru, Karnataka')).toBeInTheDocument();
    });

    it('renders correct account values', () => {
      renderDetailPage();
      expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('P1')).toBeInTheDocument();
    });

    it('renders alternate phone', () => {
      renderDetailPage();
      expect(screen.getByText('+91 87654 32109')).toBeInTheDocument();
    });
  });

  // ── Children Tab ──
  describe('Children Tab', () => {
    it('renders child cards with names', async () => {
      renderDetailPage();
      const childrenTabs = screen.getAllByText('Children');
      await userEvent.click(childrenTabs[0]);
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
    });

    it('renders child student IDs and classes', async () => {
      renderDetailPage();
      const childrenTabs = screen.getAllByText('Children');
      await userEvent.click(childrenTabs[0]);
      expect(screen.getByText('#NUR-001 · Nursery-A')).toBeInTheDocument();
    });
  });

  // ── Documents Tab (Empty State) ──
  describe('Documents Tab', () => {
    it('shows empty state with message', async () => {
      renderDetailPage();
      await userEvent.click(screen.getByText('Documents'));
      expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('KYC documents and uploads will appear here.')).toBeInTheDocument();
    });
  });

  // ── Communication Tab (Empty State) ──
  describe('Communication Tab', () => {
    it('shows empty state with message', async () => {
      renderDetailPage();
      await userEvent.click(screen.getByText('Communication'));
      expect(screen.getByText('No recent conversations')).toBeInTheDocument();
    });
  });

  // ── CSS Variables ──
  describe('CSS Variables', () => {
    it('uses styled elements on the page', () => {
      renderDetailPage();
      const styledElements = document.querySelectorAll('[style]');
      expect(styledElements.length).toBeGreaterThan(0);
    });
  });
});
