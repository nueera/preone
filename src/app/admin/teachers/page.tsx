'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  X,
  Users,
  MoreHorizontal,
  Eye,
  Pencil,
  IndianRupee,
  UserX,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Columns3,
  ArrowUpDown,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PreOneCard } from '@/components/ui/preone-card';
import { AddTeacherDialog } from '@/components/add-teacher-dialog';

// ── Types ──
interface BranchInfo {
  id: string;
  name: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string | null;
  gender: string | null;
  qualification: string | null;
  specialization: string | null;
  experience: number;
  photo: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  salary: number | null;
  joiningDate: string;
  branchId: string | null;
  branch: BranchInfo | null;
  assignedClass: ClassInfo | null;
  _count: {
    qualifications: number;
    leaves: number;
  };
}

// ── Status config (CSS-var based for theme consistency) ──
const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; badgeBg: string; badgeText: string }
> = {
  ACTIVE: {
    label: 'Active',
    dotColor: 'var(--admin-success)',
    badgeBg: 'var(--admin-success-soft)',
    badgeText: 'var(--admin-success)',
  },
  ON_LEAVE: {
    label: 'On Leave',
    dotColor: 'var(--admin-orange)',
    badgeBg: 'var(--admin-orange-soft)',
    badgeText: 'var(--admin-orange)',
  },
  INACTIVE: {
    label: 'Inactive',
    dotColor: 'var(--admin-text-muted)',
    badgeBg: 'var(--admin-surface-2)',
    badgeText: 'var(--admin-text-muted)',
  },
};

const STATUS_PILLS = [
  { label: 'All', value: '', activeColor: 'var(--admin-primary)', activeBg: 'var(--admin-primary-soft)' },
  { label: 'Active', value: 'ACTIVE', activeColor: 'var(--admin-success)', activeBg: 'var(--admin-success-soft)' },
  { label: 'On Leave', value: 'ON_LEAVE', activeColor: 'var(--admin-orange)', activeBg: 'var(--admin-orange-soft)' },
  { label: 'Inactive', value: 'INACTIVE', activeColor: 'var(--admin-text-muted)', activeBg: 'var(--admin-surface-2)' },
];

const QUALIFICATIONS = ['B.Ed', 'D.Ed', 'M.Ed', 'B.El.Ed', 'Other'];

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Sub-components ──
function StatusBadge({ status }: { status: Teacher['status'] }) {
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

function QualificationPill({ value }: { value: string }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        background: 'var(--admin-info-soft)',
        color: 'var(--admin-info)',
      }}
    >
      {value}
    </span>
  );
}

function ClassPill({ value }: { value: string }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        background: 'var(--admin-primary-soft)',
        color: 'var(--admin-primary)',
      }}
    >
      {value}
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

export default function TeachersListPage() {
  const router = useRouter();

  // ── State ──
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState('');
  const [branchFilter, setBranchFilterVal] = useState('');
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('firstName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const limit = 25;

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch teachers ──
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (qualificationFilter) params.set('qualification', qualificationFilter);
      if (branchFilter) params.set('branchId', branchFilter);

      const res = await fetch(`/api/teachers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
        setTotal(data.pagination?.total || 0);
        // Collect unique branches from data
        const branchSet = new Map<string, string>();
        (data.teachers || []).forEach((t: Teacher) => {
          if (t.branch) branchSet.set(t.branch.id, t.branch.name);
        });
        setBranches(Array.from(branchSet, ([id, name]) => ({ id, name })));
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, qualificationFilter, branchFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // ── Handlers ──
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setQualificationFilter('');
    setBranchFilterVal('');
    setPage(1);
  };

  const handleDeactivate = async (teacher: Teacher) => {
    if (!confirm(`Deactivate ${teacher.firstName} ${teacher.lastName}?`)) return;
    try {
      const token = getToken();
      await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeachers();
    } catch (err) {
      console.error('Deactivate failed:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── Sort teachers client-side ──
  const sortedTeachers = [...teachers].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortField) {
      case 'firstName':
        valA = a.firstName;
        valB = b.firstName;
        break;
      case 'qualification':
        valA = a.qualification || '';
        valB = b.qualification || '';
        break;
      case 'specialization':
        valA = a.specialization || '';
        valB = b.specialization || '';
        break;
      case 'assignedClass':
        valA = a.assignedClass?.name || '';
        valB = b.assignedClass?.name || '';
        break;
      case 'experience':
        valA = a.experience;
        valB = b.experience;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const hasActiveFilters =
    debouncedSearch || statusFilter || qualificationFilter || branchFilter;

  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // ── Page numbers with ellipsis ──
  const pageNumbers = React.useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return (
      <span
        className="text-[10px]"
        style={{ color: 'var(--admin-primary)' }}
      >
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── SECTION 1: HEADER ── */}
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
              Teachers &amp; Staff
            </h1>
            <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
              Manage teachers and staff members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: FILTER BAR ── */}
      <PreOneCard className="!rounded-xl">
        <div className="p-4 space-y-3">
          {/* Row 1: Search + Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--admin-text-subtle)' }}
              />
              <input
                type="text"
                placeholder="Search by name, qualification, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border px-3 pl-9 pr-9 text-sm outline-none transition-colors"
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
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={qualificationFilter || 'ALL'}
              onValueChange={(v) => {
                setQualificationFilter(v === 'ALL' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] h-10">
                <SelectValue placeholder="Qualification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Qualifications</SelectItem>
                {QUALIFICATIONS.map((q) => (
                  <SelectItem key={q} value={q}>{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {branches.length > 0 && (
              <Select
                value={branchFilter || 'ALL'}
                onValueChange={(v) => {
                  setBranchFilterVal(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                onClick={() => {
                  setStatusFilter(statusFilter === pill.value ? '' : pill.value);
                  setPage(1);
                }}
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

      {/* ── SECTION 3: STATS BAR + DATA TABLE ── */}
      <PreOneCard className="!rounded-xl overflow-hidden">
        {/* Stats Bar */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
              Total Teachers
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
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--admin-border)' }}>
                <TableHead
                  className="w-12 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Photo
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[180px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('firstName')}
                >
                  <span className="inline-flex items-center gap-1">
                    Name <SortIndicator field="firstName" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[140px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('qualification')}
                >
                  <span className="inline-flex items-center gap-1">
                    Qualification <SortIndicator field="qualification" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[150px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('specialization')}
                >
                  <span className="inline-flex items-center gap-1">
                    Specialization <SortIndicator field="specialization" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[130px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('assignedClass')}
                >
                  <span className="inline-flex items-center gap-1">
                    Class <SortIndicator field="assignedClass" />
                  </span>
                </TableHead>
                <TableHead
                  className="w-[140px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Phone
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[80px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('experience')}
                >
                  <span className="inline-flex items-center gap-1">
                    Exp. <SortIndicator field="experience" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[110px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onClick={() => handleSort('status')}
                >
                  <span className="inline-flex items-center gap-1">
                    Status <SortIndicator field="status" />
                  </span>
                </TableHead>
                <TableHead
                  className="w-[80px] text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} style={{ borderColor: 'var(--admin-border)' }}>
                    <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : sortedTeachers.length === 0 ? (
                <TableRow style={{ borderColor: 'var(--admin-border)' }}>
                  <TableCell colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search
                        className="h-10 w-10 opacity-40"
                        style={{ color: 'var(--admin-text-muted)' }}
                      />
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        No teachers found
                      </p>
                      <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                        Try adjusting your search or filters.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Teacher
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTeachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="cursor-pointer table-row-preone"
                    style={{ borderColor: 'var(--admin-border)' }}
                    onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{
                            background: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }}
                        >
                          {getInitials(teacher.firstName, teacher.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div
                        className="font-medium"
                        style={{ color: 'var(--admin-text)' }}
                      >
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--admin-text-subtle)' }}
                      >
                        {teacher.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.qualification ? (
                        <QualificationPill value={teacher.qualification} />
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {teacher.specialization || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {teacher.assignedClass ? (
                        <ClassPill value={teacher.assignedClass.name} />
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        >
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.phone ? (
                        <a
                          href={`tel:${teacher.phone}`}
                          className="text-xs tabular-nums inline-flex items-center gap-1"
                          style={{ color: 'var(--admin-text-muted)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </a>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {teacher.experience} yrs
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--admin-text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--admin-surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/teachers/${teacher.id}?tab=salary`)}
                          >
                            <IndianRupee className="mr-2 h-4 w-4" />
                            Manage Salary
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeactivate(teacher)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── SECTION 4: PAGINATION ── */}
        {!loading && total > 0 && (
          <div
            className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                Showing {startRow} to {endRow} of {total} teachers
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors"
                    style={
                      page === p
                        ? {
                            background: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }
                        : { color: 'var(--admin-text-muted)' }
                    }
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: page >= totalPages ? 0.4 : 1,
                }}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </PreOneCard>

      {/* ── Add Teacher Dialog ── */}
      <AddTeacherDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onTeacherCreated={fetchTeachers}
      />
    </div>
  );
}
