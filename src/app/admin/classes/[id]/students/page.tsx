'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
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

// ── Types ──
interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string | null;
  photo?: string | null;
  gender: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  attendanceRate?: number;
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

const STATUS_PILLS = [
  { label: 'All', value: '', activeColor: 'var(--admin-primary)', activeBg: 'var(--admin-primary-soft)' },
  { label: 'Active', value: 'ACTIVE', activeColor: 'var(--admin-success)', activeBg: 'var(--admin-success-soft)' },
  { label: 'Inactive', value: 'INACTIVE', activeColor: 'var(--admin-text-muted)', activeBg: 'var(--admin-surface-2)' },
  { label: 'Graduated', value: 'GRADUATED', activeColor: 'var(--admin-info)', activeBg: 'var(--admin-info-soft)' },
  { label: 'Transferred', value: 'TRANSFERRED', activeColor: 'var(--admin-orange)', activeBg: 'var(--admin-orange-soft)' },
];

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Sub-components ──
function StatusBadge({ status }: { status: StudentInfo['status'] }) {
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

export default function ClassStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const qs = statusFilter ? `?status=${statusFilter}` : '';

      const res = await fetch(`/api/classes/${classId}/students${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, statusFilter]);

  // ── Fetch class name ──
  useEffect(() => {
    async function fetchClassName() {
      try {
        const token = getToken();
        const res = await fetch(`/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.class) setClassName(data.class.name);
        }
      } catch (err) {
        console.error('Failed to fetch class:', err);
      }
    }
    fetchClassName();
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ── Filter students by search ──
  const filteredStudents = students.filter((s) =>
    !search ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="w-fit gap-1"
          style={{ color: 'var(--admin-text-muted)' }}
          onClick={() => router.push(`/admin/classes/${classId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {className || 'Class'}
        </Button>

        {/* ── HEADER ── */}
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
                {className} — Students
              </h1>
              <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                {activeCount} active student{activeCount !== 1 ? 's' : ''} enrolled
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <CosmicStatCard
            label="Total Students"
            value={students.length}
            icon={<Users className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Active"
            value={activeCount}
            icon={<GraduationCap className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Inactive / Transferred"
            value={students.length - activeCount}
            icon={<Users className="h-5 w-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* ── FILTER BAR ── */}
        <PreOneCard className="!rounded-xl">
          <div className="p-4 space-y-3">
            {/* Row 1: Search + More Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--admin-text-subtle)' }}
                />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
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

              <Button variant="ghost" size="sm" className="ml-auto gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                More Filters
              </Button>

              {(search || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  style={{ color: 'var(--admin-error)' }}
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Row 2: Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_PILLS.map((pill) => (
                <FilterPill
                  key={pill.label}
                  label={pill.label}
                  active={statusFilter === pill.value}
                  activeColor={pill.activeColor}
                  activeBg={pill.activeBg}
                  onClick={() => setStatusFilter(pill.value)}
                />
              ))}
            </div>
          </div>
        </PreOneCard>

        {/* ── STUDENTS TABLE ── */}
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
                {filteredStudents.length}
              </span>
            </div>
          </div>

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
                    className="min-w-[180px] text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Name
                  </TableHead>
                  <TableHead
                    className="w-[100px] text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Roll No.
                  </TableHead>
                  <TableHead
                    className="w-[100px] text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Gender
                  </TableHead>
                  <TableHead
                    className="w-[120px] text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Attendance
                  </TableHead>
                  <TableHead
                    className="w-[110px] text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Status
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} style={{ borderColor: 'var(--admin-border)' }}>
                      <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <TableRow style={{ borderColor: 'var(--admin-border)' }}>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search
                          className="h-10 w-10 opacity-40"
                          style={{ color: 'var(--admin-text-muted)' }}
                        />
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          No students found
                        </p>
                        <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer table-row-preone"
                      style={{ borderColor: 'var(--admin-border)' }}
                      onClick={() => router.push(`/admin/students/${student.id}`)}
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
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div
                          className="font-medium"
                          style={{ color: 'var(--admin-text)' }}
                        >
                          {student.firstName} {student.lastName}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-sm"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {student.rollNumber || '—'}
                      </TableCell>
                      <TableCell
                        className="text-sm"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {student.gender}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              (student.attendanceRate ?? 0) >= 90
                                ? 'var(--admin-success)'
                                : (student.attendanceRate ?? 0) >= 75
                                  ? 'var(--admin-orange)'
                                  : 'var(--admin-error)',
                          }}
                        >
                          {student.attendanceRate != null
                            ? `${student.attendanceRate}%`
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={student.status} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          style={{ color: 'var(--admin-primary)' }}
                          onClick={() => router.push(`/admin/students/${student.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
