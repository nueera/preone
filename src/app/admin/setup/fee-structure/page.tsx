'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Pencil,
  Bus,
  UtensilsCrossed,
  Palette,
  GraduationCap,
  Building2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────────
// DATA MODEL
// ────────────────────────────────────────────────────────────────

interface FeeType {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: 'Annual' | 'One Time';
  applicableClasses: string[];
  status: 'Active' | 'Draft';
  iconColor: string;
  iconBg: string;
  Icon: React.ElementType;
}

// ────────────────────────────────────────────────────────────────
// MOCK DATA
// ────────────────────────────────────────────────────────────────

const FEE_TYPES: FeeType[] = [
  {
    id: '1',
    name: 'Tuition Fee',
    description: 'Core academic instruction and learning materials',
    amount: 60000,
    frequency: 'Annual',
    applicableClasses: ['Playgroup', 'Nursery', 'LKG', 'UKG'],
    status: 'Active',
    iconColor: 'var(--admin-primary)',
    iconBg: 'var(--admin-primary-soft)',
    Icon: GraduationCap,
  },
  {
    id: '2',
    name: 'Transport Fee',
    description: 'School bus pickup and drop-off service',
    amount: 24000,
    frequency: 'Annual',
    applicableClasses: ['All Programs'],
    status: 'Active',
    iconColor: 'var(--admin-info)',
    iconBg: 'var(--admin-info-soft)',
    Icon: Bus,
  },
  {
    id: '3',
    name: 'Meal Plan',
    description: 'Nutritious lunch and snack plan',
    amount: 18000,
    frequency: 'Annual',
    applicableClasses: ['All Programs'],
    status: 'Active',
    iconColor: 'var(--admin-success)',
    iconBg: 'var(--admin-success-soft)',
    Icon: UtensilsCrossed,
  },
  {
    id: '4',
    name: 'Activity Fee',
    description: 'Co-curricular and activity materials',
    amount: 8000,
    frequency: 'Annual',
    applicableClasses: ['Playgroup', 'Nursery', 'LKG', 'UKG'],
    status: 'Active',
    iconColor: 'var(--admin-warning)',
    iconBg: 'var(--admin-warning-soft)',
    Icon: Palette,
  },
  {
    id: '5',
    name: 'Admission Fee',
    description: 'New student admission charge',
    amount: 15000,
    frequency: 'One Time',
    applicableClasses: ['All Programs'],
    status: 'Active',
    iconColor: 'var(--admin-error)',
    iconBg: 'var(--admin-error-soft)',
    Icon: ClipboardList,
  },
  {
    id: '6',
    name: 'Development Fee',
    description: 'School development and infrastructure',
    amount: 10000,
    frequency: 'Annual',
    applicableClasses: ['All Programs'],
    status: 'Active',
    iconColor: 'var(--admin-primary)',
    iconBg: 'var(--admin-primary-soft)',
    Icon: Building2,
  },
  {
    id: '7',
    name: 'Annual Registration Fee',
    description: 'Yearly registration and documentation',
    amount: 5000,
    frequency: 'Annual',
    applicableClasses: ['All Programs'],
    status: 'Draft',
    iconColor: 'var(--admin-accent)',
    iconBg: 'var(--admin-warning-soft)',
    Icon: ClipboardList,
  },
];

const ITEMS_PER_PAGE = 10;

// ────────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────────

/** Format a number in Indian Rupee notation (e.g., 1,35,000) */
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

// ────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

/** StatCard — Single statistics card with icon, value, and label */
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <PreOneCard variant="default" hover className="p-5">
      <div className="flex items-start gap-4">
        {/* Icon Box */}
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        {/* Value + Label */}
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
            {value}
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
            {label}
          </div>
        </div>
      </div>
    </PreOneCard>
  );
}

/** FrequencyBadge — Renders Annual/One Time badge */
function FrequencyBadge({ frequency }: { frequency: 'Annual' | 'One Time' }) {
  if (frequency === 'Annual') {
    return (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' }}
      >
        Annual
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: 'var(--admin-info-soft)', color: 'var(--admin-info)' }}
    >
      One Time
    </span>
  );
}

/** StatusBadge — Renders Active/Draft status pill with dot indicator */
function StatusBadge({ status }: { status: 'Active' | 'Draft' }) {
  if (status === 'Active') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: 'var(--admin-success-soft)', color: 'var(--admin-success)' }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: 'var(--admin-success)' }}
        />
        Active
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: 'var(--admin-warning-soft)', color: 'var(--admin-warning)' }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: 'var(--admin-warning)' }}
      />
      Draft
    </span>
  );
}

/** ClassPill — Renders a single class/program pill badge */
function ClassPill({ name }: { name: string }) {
  return (
    <span
      className="rounded-md border px-2 py-0.5 text-[11px] font-medium inline-block"
      style={{
        borderColor: 'var(--admin-border)',
        backgroundColor: 'var(--admin-surface-2)',
        color: 'var(--admin-text-muted)',
      }}
    >
      {name}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────────

export default function FeeStructurePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Derived data ──
  const filteredFees = useMemo(() => {
    if (!searchQuery.trim()) return FEE_TYPES;
    const q = searchQuery.toLowerCase();
    return FEE_TYPES.filter(
      (fee) =>
        fee.name.toLowerCase().includes(q) || fee.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFees = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredFees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFees, safeCurrentPage]);

  const startIdx = filteredFees.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredFees.length);

  const totalRevenue = FEE_TYPES.filter((f) => f.status === 'Active').reduce(
    (sum, f) => sum + f.amount,
    0
  );
  const activeCount = FEE_TYPES.filter((f) => f.status === 'Active').length;
  const draftCount = FEE_TYPES.filter((f) => f.status === 'Draft').length;

  // ── Handlers ──
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // ── Render ──
  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto" style={{ backgroundColor: 'var(--admin-bg)' }}>
        {/* ── Section 1: Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-start gap-4">
            {/* Icon Badge */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--admin-primary-soft)' }}
            >
              <IndianRupee className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
            </div>
            {/* Title + Subtitle */}
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Fee Structure
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                Manage fee types, amounts, frequency and applicable classes.
              </p>
            </div>
          </div>
          {/* Right Side: Add Fee Type Button */}
          <Button
            onClick={() => toast.info('Add Fee Type dialog coming soon')}
            style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-primary-foreground)' }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fee Type
          </Button>
        </div>

        {/* ── Section 2: Statistics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            iconBg="var(--admin-primary-soft)"
            iconColor="var(--admin-primary)"
            value={String(FEE_TYPES.length)}
            label="Total"
          />
          <StatCard
            icon={IndianRupee}
            iconBg="var(--admin-success-soft)"
            iconColor="var(--admin-success)"
            value={`₹${formatINR(totalRevenue)}`}
            label="Total from all fees"
          />
          <StatCard
            icon={CheckCircle}
            iconBg="var(--admin-info-soft)"
            iconColor="var(--admin-info)"
            value={String(activeCount)}
            label="Currently active"
          />
          <StatCard
            icon={Clock}
            iconBg="var(--admin-warning-soft)"
            iconColor="var(--admin-warning)"
            value={String(draftCount)}
            label="Not yet active"
          />
        </div>

        {/* ── Section 3: Search / Filter Bar ── */}
        <PreOneCard variant="default" className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--admin-text-subtle)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search fee types..."
                className="h-10 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors"
                style={{
                  borderColor: 'var(--admin-border)',
                  backgroundColor: 'var(--admin-surface-2)',
                  color: 'var(--admin-text)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--admin-primary-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Filter panel coming soon')}
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </PreOneCard>

        {/* ── Section 4: Fee Types Table ── */}
        <PreOneCard variant="default" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr
                  className="border-b"
                  style={{ borderBottomColor: 'var(--admin-border)' }}
                >
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Fee Type
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Amount (₹)
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Frequency
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Applicable Classes / Programs
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Status
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {paginatedFees.length > 0 ? (
                  paginatedFees.map((fee) => {
                    const FeeIcon = fee.Icon;
                    return (
                      <tr
                        key={fee.id}
                        className="border-b transition-colors group"
                        style={{
                          borderBottomColor: 'var(--admin-border)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Column 1: Fee Type */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: fee.iconBg }}
                            >
                              <FeeIcon className="h-[18px] w-[18px]" style={{ color: fee.iconColor }} />
                            </div>
                            <div className="min-w-0">
                              <div
                                className="font-medium truncate"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {fee.name}
                              </div>
                              <div
                                className="text-xs truncate"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              >
                                {fee.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Column 2: Amount */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            ₹{formatINR(fee.amount)}
                          </span>
                        </td>
                        {/* Column 3: Frequency */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <FrequencyBadge frequency={fee.frequency} />
                        </td>
                        {/* Column 4: Applicable Classes */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {fee.applicableClasses.map((cls) => (
                              <ClassPill key={cls} name={cls} />
                            ))}
                          </div>
                        </td>
                        {/* Column 5: Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={fee.status} />
                        </td>
                        {/* Column 6: Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              title="Edit"
                              onClick={() => toast.info('Edit dialog coming soon')}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors"
                              style={{ color: 'var(--admin-text-muted)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="More options"
                              onClick={() => toast.info('More options coming soon')}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors"
                              style={{ color: 'var(--admin-text-muted)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* Empty State */
                  <tr>
                    <td colSpan={6} className="py-12 px-5 text-center">
                      <Search
                        className="h-10 w-10 mx-auto mb-3"
                        style={{ color: 'var(--admin-text-muted)', opacity: 0.4 }}
                      />
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        No fee types found
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        Try adjusting your search or add a new fee type.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Section 5: Pagination ── */}
          {filteredFees.length > 0 && (
            <div
              className="flex items-center justify-between border-t px-5 py-3"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              {/* Left: Info Text */}
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                Showing {startIdx} to {endIdx} of {filteredFees.length} fee types
              </span>
              {/* Right: Page Navigation */}
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={(e) => {
                    if (safeCurrentPage !== 1) {
                      e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-xs font-medium transition-colors"
                    style={{
                      backgroundColor:
                        page === safeCurrentPage ? 'var(--admin-primary-soft)' : 'transparent',
                      color:
                        page === safeCurrentPage ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                    }}
                  >
                    {page}
                  </button>
                ))}
                {/* Next Button */}
                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={(e) => {
                    if (safeCurrentPage !== totalPages) {
                      e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
