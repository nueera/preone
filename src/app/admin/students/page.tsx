'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Upload,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Columns3,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MoreHorizontal,
  GraduationCap,
  UserCheck,
  UserPlus,
  UserX,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PreOneCard } from '@/components/ui/preone-card';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { TransferStudentDialog } from '@/components/transfer-student-dialog';

// ── Types ──
type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';

interface ApiClass {
  id: string;
  name: string;
  program?: { id: string; name: string } | null;
}

interface ApiStudent {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string | null;
  dob?: string | null;
  gender?: string | null;
  photo?: string | null;
  admissionDate?: string | null;
  status: StudentStatus;
  classId?: string | null;
  class?: ApiClass | null;
  branch?: { id: string; name: string } | null;
  primaryParent?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    relation: string;
  } | null;
}

interface StudentRow {
  id: string;
  name: string;
  studentId: string;
  classId: string | null;
  className: string;
  parentName: string;
  parentPhone: string;
  status: StudentStatus;
  dob: string;
  avatarInitials: string;
  admissionDate: string;
}

// ── Status Config (matches admin theme tokens) ──
const STATUS_CONFIG: Record<StudentStatus, { label: string; dotColor: string; badgeBg: string; badgeText: string }> = {
  ACTIVE: {
    label: 'Active',
    dotColor: 'var(--admin-success)',
    badgeBg: 'var(--admin-success-soft)',
    badgeText: 'var(--admin-success)',
  },
  INACTIVE: {
    label: 'Inactive',
    dotColor: 'var(--admin-text-muted)',
    badgeBg: 'var(--admin-surface-2)',
    badgeText: 'var(--admin-text-muted)',
  },
  GRADUATED: {
    label: 'Graduated',
    dotColor: 'var(--admin-info)',
    badgeBg: 'var(--admin-info-soft)',
    badgeText: 'var(--admin-info)',
  },
  TRANSFERRED: {
    label: 'Transferred',
    dotColor: 'var(--admin-orange)',
    badgeBg: 'var(--admin-orange-soft)',
    badgeText: 'var(--admin-orange)',
  },
};

// ── Filter Pill Config ──
const STATUS_PILLS: { label: string; value: 'All' | StudentStatus; activeColor: string; activeBg: string }[] = [
  { label: 'All', value: 'All', activeColor: 'var(--admin-primary)', activeBg: 'var(--admin-primary-soft)' },
  { label: 'Active', value: 'ACTIVE', activeColor: 'var(--admin-success)', activeBg: 'var(--admin-success-soft)' },
  { label: 'Inactive', value: 'INACTIVE', activeColor: 'var(--admin-text-muted)', activeBg: 'var(--admin-surface-2)' },
  { label: 'Graduated', value: 'GRADUATED', activeColor: 'var(--admin-info)', activeBg: 'var(--admin-info-soft)' },
  { label: 'Transferred', value: 'TRANSFERRED', activeColor: 'var(--admin-orange)', activeBg: 'var(--admin-orange-soft)' },
];

// ── Helpers ──
function getInitials(firstName: string, lastName: string): string {
  const a = firstName?.trim()?.[0] ?? '';
  const b = lastName?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function mapApiToRow(s: ApiStudent): StudentRow {
  const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown';
  return {
    id: s.id,
    name: fullName,
    studentId: s.rollNumber ? `#${s.rollNumber}` : '—',
    classId: s.class?.id ?? s.classId ?? null,
    className: s.class?.name ?? 'Unassigned',
    parentName: s.primaryParent ? `${s.primaryParent.firstName} ${s.primaryParent.lastName}`.trim() : '—',
    parentPhone: s.primaryParent?.phone || '—',
    status: s.status,
    dob: formatDate(s.dob),
    avatarInitials: getInitials(s.firstName, s.lastName),
    admissionDate: formatDate(s.admissionDate),
  };
}

// ── Sub-Components ──
function StatusBadge({ status }: { status: StudentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: config.badgeBg, color: config.badgeText }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.dotColor }} />
      {config.label}
    </span>
  );
}

function FilterPill({
  label,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { background: activeBg, color: activeColor }
          : { background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }
      }
    >
      {label}
    </button>
  );
}

// ── KPI Stat Card ──
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
  hint,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  bg: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <PreOneCard variant="strip" hover className="p-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)' }}>
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded-md" style={{ background: 'var(--admin-surface-2)' }} />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
              {value}
            </p>
          )}
          {hint && (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--admin-text-subtle)' }}>
              {hint}
            </p>
          )}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: bg }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full opacity-60"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
    </PreOneCard>
  );
}

// ── Row Skeleton ──
function RowSkeleton() {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
      <td className="w-10 px-4 py-3">
        <div className="h-4 w-4 rounded" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full" style={{ background: 'var(--admin-surface-2)' }} />
          <div className="space-y-1.5">
            <div className="h-3 w-32 rounded" style={{ background: 'var(--admin-surface-2)' }} />
            <div className="h-2.5 w-20 rounded" style={{ background: 'var(--admin-surface-2)' }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-24 rounded" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-28 rounded" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 rounded" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
      <td className="w-12 px-4 py-3">
        <div className="h-5 w-5 rounded" style={{ background: 'var(--admin-surface-2)' }} />
      </td>
    </tr>
  );
}

// ── Main Page ──
export default function StudentsListPage() {
  const router = useRouter();

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StudentStatus>('All');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);

  // API state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classOptions, setClassOptions] = useState<ApiClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [total, setTotal] = useState(0);

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'All' ||
    classFilter !== 'all';

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (classFilter !== 'all') params.set('classId', classFilter);
      params.set('page', String(currentPage));
      params.set('limit', String(rowsPerPage));

      const res = await fetch(`/api/students?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const rows: StudentRow[] = (data.students || []).map(mapApiToRow);
      setStudents(rows);
      setTotal(data.total ?? rows.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load students');
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, classFilter, currentPage, rowsPerPage]);

  // ── Fetch class options ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
        const res = await fetch('/api/classes?limit=200', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const list: ApiClass[] = (data.classes || data || []).map((c: ApiClass) => ({ id: c.id, name: c.name, program: c.program }));
        setClassOptions(list);
      } catch {
        // Silent — class filter just won't have options
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ── Derived KPIs (from current page snapshot — total is server-side) ──
  const kpi = useMemo(() => {
    const active = students.filter((s) => s.status === 'ACTIVE').length;
    const inactive = students.filter((s) => s.status === 'INACTIVE').length;
    const now = new Date();
    const newThisMonth = students.filter((s) => {
      // admissionDate is already formatted — fall back to counting in current view
      return false; // admissionDate string is formatted, can't reliably parse — leave as hint
    }).length;
    return { active, inactive, newThisMonth, totalOnPage: students.length };
  }, [students]);

  // Reset page when filters change
  const handleStatusFilter = useCallback((value: 'All' | StudentStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleClassFilter = useCallback((value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
    setClassFilter('all');
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }, [students, selectedIds]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(safePage * rowsPerPage, total);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <PageTransition>
      <StaggerContainer className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── SECTION 1: HEADER ── */}
        <StaggerItem>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <Users className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Students
                </h1>
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  Manage and view all student records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.push('/admin/students/import')}
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* ── SECTION 2: KPI CARDS ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Students"
              value={total}
              icon={Users}
              accent="var(--admin-primary)"
              bg="var(--admin-primary-soft)"
              loading={loading}
            />
            <KpiCard
              label="Active"
              value={kpi.active}
              icon={UserCheck}
              accent="var(--admin-success)"
              bg="var(--admin-success-soft)"
              hint="On this page"
              loading={loading}
            />
            <KpiCard
              label="Inactive"
              value={kpi.inactive}
              icon={UserX}
              accent="var(--admin-text-muted)"
              bg="var(--admin-surface-2)"
              hint="On this page"
              loading={loading}
            />
            <KpiCard
              label="Showing"
              value={`${startRow}-${endRow} of ${total}`}
              icon={UserPlus}
              accent="var(--admin-info)"
              bg="var(--admin-info-soft)"
              loading={loading}
            />
          </div>
        </StaggerItem>

        {/* ── SECTION 3: ERROR BANNER ── */}
        {error && (
          <StaggerItem>
            <PreOneCard variant="default" className="p-4 border" style={{ borderColor: 'var(--admin-error)' }}>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--admin-error)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>
                    Failed to load students
                  </p>
                  <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                    {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={fetchStudents}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* ── SECTION 4: FILTER BAR ── */}
        <StaggerItem>
          <PreOneCard className="!rounded-xl">
            <div className="p-4 space-y-3">
              {/* Row 1: Search + Class Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, parent or phone..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border px-3 pl-9 text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--admin-surface-2)',
                      borderColor: 'var(--admin-border)',
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
                <select
                  value={classFilter}
                  onChange={(e) => handleClassFilter(e.target.value)}
                  className="h-10 rounded-lg border px-3 text-sm outline-none"
                  style={{
                    background: 'var(--admin-surface)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                >
                  <option value="all">All Classes</option>
                  {classOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Row 2: Status Pills + More/Clear */}
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_PILLS.map((pill) => (
                  <FilterPill
                    key={pill.label}
                    label={pill.label}
                    active={statusFilter === pill.value}
                    activeColor={pill.activeColor}
                    activeBg={pill.activeBg}
                    onClick={() => handleStatusFilter(pill.value)}
                  />
                ))}
                <Button variant="ghost" size="sm" className="ml-auto gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  More Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    style={{ color: 'var(--admin-error)' }}
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </PreOneCard>
        </StaggerItem>

        {/* ── SECTION 5: STATS BAR + DATA TABLE ── */}
        <StaggerItem>
          <PreOneCard className="!rounded-xl overflow-hidden">
            {/* Stats Bar */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  Total Students
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-sm font-bold"
                  style={{
                    background: 'var(--admin-primary-soft)',
                    color: 'var(--admin-primary)',
                  }}
                >
                  {total}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: 'var(--admin-border)' }}
                  >
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        style={{ accentColor: 'var(--admin-primary)' }}
                        checked={
                          students.length > 0 &&
                          selectedIds.size === students.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Student
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Status
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Class
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Parent / Guardian
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      DOB
                    </th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{ background: 'var(--admin-surface-2)' }}
                          >
                            <Users className="h-5 w-5" style={{ color: 'var(--admin-text-subtle)' }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>
                              {hasActiveFilters ? 'No students match your filters' : 'No students yet'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--admin-text-subtle)' }}>
                              {hasActiveFilters
                                ? 'Try clearing filters or adjusting your search.'
                                : 'Add your first student to get started.'}
                            </p>
                          </div>
                          {hasActiveFilters ? (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={clearFilters}>
                              <X className="h-3.5 w-3.5" /> Clear Filters
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-1.5 bg-brand-gradient text-white border-0"
                              onClick={() => setAddDialogOpen(true)}
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Student
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => {
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          className="border-b transition-colors hover:bg-[var(--admin-surface-2)] cursor-pointer"
                          style={{
                            borderColor: 'var(--admin-border)',
                            background: isSelected ? 'var(--admin-primary-soft)' : undefined,
                          }}
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                        >
                          <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded"
                              style={{ accentColor: 'var(--admin-primary)' }}
                              checked={isSelected}
                              onChange={() => toggleSelectRow(s.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback
                                  className="text-xs font-semibold"
                                  style={{
                                    background: 'var(--admin-primary-soft)',
                                    color: 'var(--admin-primary)',
                                  }}
                                >
                                  {s.avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-medium"
                                  style={{ color: 'var(--admin-text)' }}
                                >
                                  {s.name}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: 'var(--admin-text-subtle)' }}
                                >
                                  {s.studentId}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                              style={{
                                background: 'var(--admin-info-soft)',
                                color: 'var(--admin-info)',
                              }}
                            >
                              <GraduationCap className="h-3 w-3" />
                              {s.className}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p
                              className="truncate text-sm"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              {s.parentName}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            >
                              {s.parentPhone}
                            </p>
                          </td>
                          <td
                            className="px-4 py-3 text-sm"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            {s.dob}
                          </td>
                          <td
                            className="w-12 px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && students.length > 0 && (
              <div
                className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                    Showing <span style={{ color: 'var(--admin-text)' }}>{startRow}-{endRow}</span> of{' '}
                    <span style={{ color: 'var(--admin-text)' }}>{total}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {pageNumbers.map((p, idx) =>
                    p === '...' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-sm"
                        style={{ color: 'var(--admin-text-subtle)' }}
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === safePage ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </PreOneCard>
        </StaggerItem>

        {/* ── DIALOGS ── */}
        <AddStudentDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onStudentCreated={() => fetchStudents()}
        />
        {selectedStudent && (
          <TransferStudentDialog
            open={transferDialogOpen}
            onOpenChange={(open) => {
              setTransferDialogOpen(open);
              if (!open) setSelectedStudent(null);
            }}
            student={{
              id: selectedStudent.id,
              firstName: selectedStudent.name.split(' ')[0] || '',
              lastName: selectedStudent.name.split(' ').slice(1).join(' ') || '',
              status: selectedStudent.status,
            }}
            onTransferred={fetchStudents}
          />
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
