'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Upload,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Columns3,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MoreHorizontal,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PreOneCard } from '@/components/ui/preone-card';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { TransferStudentDialog } from '@/components/transfer-student-dialog';

// ── Types ──
interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  classColor: string;
  classBg: string;
  parent: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transferred';
  dob: string;
  avatarInitials: string;
  avatarColor: string;
  avatarBg: string;
}

// ── Mock Data: 10 Students ──
const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Aarav Patel',
    studentId: '#NUR-001',
    class: 'Nursery-A',
    classColor: 'var(--admin-info)',
    classBg: 'var(--admin-info-soft)',
    parent: 'Raj Patel',
    phone: '+91 98765 43213',
    status: 'Active',
    dob: '15 Jun 2021',
    avatarInitials: 'AP',
    avatarColor: 'var(--admin-info)',
    avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '2',
    name: 'Myra Verma',
    studentId: '#LKG-012',
    class: 'LKG-B',
    classColor: 'var(--admin-success)',
    classBg: 'var(--admin-success-soft)',
    parent: 'Amit Verma',
    phone: '+91 91234 56789',
    status: 'Active',
    dob: '21 Apr 2020',
    avatarInitials: 'MV',
    avatarColor: 'var(--admin-success)',
    avatarBg: 'var(--admin-success-soft)',
  },
  {
    id: '3',
    name: 'Vihaan Singh',
    studentId: '#UKG-021',
    class: 'UKG-A',
    classColor: 'var(--admin-primary)',
    classBg: 'var(--admin-primary-soft)',
    parent: 'Pooja Singh',
    phone: '+91 99887 76655',
    status: 'Active',
    dob: '10 Mar 2019',
    avatarInitials: 'VS',
    avatarColor: 'var(--admin-primary)',
    avatarBg: 'var(--admin-primary-soft)',
  },
  {
    id: '4',
    name: 'Anaya Mehta',
    studentId: '#UKG-034',
    class: 'UKG-B',
    classColor: 'var(--admin-primary)',
    classBg: 'var(--admin-primary-soft)',
    parent: 'Rohit Mehta',
    phone: '+91 87654 32109',
    status: 'Inactive',
    dob: '05 Aug 2018',
    avatarInitials: 'AM',
    avatarColor: 'var(--admin-error)',
    avatarBg: 'rgba(239,68,68,0.1)',
  },
  {
    id: '5',
    name: 'Neha Kapoor',
    studentId: '#PLG-011',
    class: 'Playgroup-A',
    classColor: 'var(--admin-orange)',
    classBg: 'var(--admin-orange-soft)',
    parent: 'Neha Kapoor',
    phone: '+91 78965 43211',
    status: 'Active',
    dob: '28 Nov 2021',
    avatarInitials: 'NK',
    avatarColor: 'var(--admin-orange)',
    avatarBg: 'var(--admin-orange-soft)',
  },
  {
    id: '6',
    name: 'Ibrahim Khan',
    studentId: '#NUR-010',
    class: 'Nursery-A',
    classColor: 'var(--admin-info)',
    classBg: 'var(--admin-info-soft)',
    parent: 'Zara Khan',
    phone: '+91 93214 56780',
    status: 'Transferred',
    dob: '12 Feb 2021',
    avatarInitials: 'IK',
    avatarColor: 'var(--admin-info)',
    avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '7',
    name: 'Kiara Joshi',
    studentId: '#PRE-002',
    class: 'Pre-Nursery',
    classColor: 'var(--admin-pink)',
    classBg: 'var(--admin-pink-soft)',
    parent: 'Manav Joshi',
    phone: '+91 96587 41236',
    status: 'Graduated',
    dob: '30 Dec 2020',
    avatarInitials: 'KJ',
    avatarColor: 'var(--admin-pink)',
    avatarBg: 'var(--admin-pink-soft)',
  },
  {
    id: '8',
    name: 'Arjun Reddy',
    studentId: '#LKG-005',
    class: 'LKG-A',
    classColor: 'var(--admin-success)',
    classBg: 'var(--admin-success-soft)',
    parent: 'Suresh Reddy',
    phone: '+91 87612 34567',
    status: 'Active',
    dob: '18 Sep 2020',
    avatarInitials: 'AR',
    avatarColor: 'var(--admin-success)',
    avatarBg: 'var(--admin-success-soft)',
  },
  {
    id: '9',
    name: 'Diya Sharma',
    studentId: '#NUR-015',
    class: 'Nursery-B',
    classColor: 'var(--admin-info)',
    classBg: 'var(--admin-info-soft)',
    parent: 'Vikram Sharma',
    phone: '+91 91234 87654',
    status: 'Active',
    dob: '03 Jul 2021',
    avatarInitials: 'DS',
    avatarColor: 'var(--admin-pink)',
    avatarBg: 'var(--admin-pink-soft)',
  },
  {
    id: '10',
    name: 'Rohan Gupta',
    studentId: '#UKG-008',
    class: 'UKG-A',
    classColor: 'var(--admin-primary)',
    classBg: 'var(--admin-primary-soft)',
    parent: 'Anil Gupta',
    phone: '+91 98765 12345',
    status: 'Active',
    dob: '22 Jan 2019',
    avatarInitials: 'RG',
    avatarColor: 'var(--admin-primary)',
    avatarBg: 'var(--admin-primary-soft)',
  },
];

// ── Status Config ──
const STATUS_CONFIG: Record<string, { dotColor: string; badgeBg: string; badgeText: string }> = {
  Active: {
    dotColor: 'var(--admin-success)',
    badgeBg: 'var(--admin-success-soft)',
    badgeText: 'var(--admin-success)',
  },
  Inactive: {
    dotColor: 'var(--admin-text-muted)',
    badgeBg: 'var(--admin-surface-2)',
    badgeText: 'var(--admin-text-muted)',
  },
  Graduated: {
    dotColor: 'var(--admin-info)',
    badgeBg: 'var(--admin-info-soft)',
    badgeText: 'var(--admin-info)',
  },
  Transferred: {
    dotColor: 'var(--admin-orange)',
    badgeBg: 'var(--admin-orange-soft)',
    badgeText: 'var(--admin-orange)',
  },
};

// ── Filter Pill Config ──
const STATUS_PILLS = [
  { label: 'All', activeColor: 'var(--admin-primary)', activeBg: 'var(--admin-primary-soft)' },
  { label: 'Active', activeColor: 'var(--admin-success)', activeBg: 'var(--admin-success-soft)' },
  { label: 'Inactive', activeColor: 'var(--admin-text-muted)', activeBg: 'var(--admin-surface-2)' },
  { label: 'Graduated', activeColor: 'var(--admin-info)', activeBg: 'var(--admin-info-soft)' },
  { label: 'Transferred', activeColor: 'var(--admin-orange)', activeBg: 'var(--admin-orange-soft)' },
];

// ── Class Options ──
const CLASS_OPTIONS = [
  'All Classes',
  'Nursery-A',
  'Nursery-B',
  'LKG-A',
  'LKG-B',
  'UKG-A',
  'UKG-B',
  'Playgroup-A',
  'Pre-Nursery',
];

// ── Sub-Components ──

function StatusBadge({ status }: { status: Student['status'] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: config.badgeBg, color: config.badgeText }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: config.dotColor }}
      />
      {status}
    </span>
  );
}

function ClassPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
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

// ── Main Page ──

export default function StudentsListPage() {
  const router = useRouter();

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'All' ||
    classFilter !== 'All Classes';

  // ── Filtered & paginated data ──
  const filteredStudents = useMemo(() => {
    let result = MOCK_STUDENTS;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.parent.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (classFilter !== 'All Classes') {
      result = result.filter((s) => s.class === classFilter);
    }

    return result;
  }, [searchQuery, statusFilter, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return filteredStudents.slice(start, start + rowsPerPage);
  }, [filteredStudents, safePage, rowsPerPage]);

  const startRow = filteredStudents.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(safePage * rowsPerPage, filteredStudents.length);

  // ── Handlers ──
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
    setClassFilter('All Classes');
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleStatusFilter = useCallback((label: string) => {
    setStatusFilter(label);
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

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedStudents.map((s) => s.id)));
    }
  }, [paginatedStudents, selectedIds]);

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

  // ── Page numbers ──
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
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── SECTION 1: HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Icon Badge + Title */}
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

        {/* Right Side: Action Buttons */}
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

      {/* ── SECTION 2: FILTER BAR ── */}
      <PreOneCard className="!rounded-xl">
        <div className="p-4 space-y-3">
          {/* Row 1: Search + Class Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
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

            {/* Class Dropdown */}
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
              {CLASS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
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
                active={statusFilter === pill.label}
                activeColor={pill.activeColor}
                activeBg={pill.activeBg}
                onClick={() => handleStatusFilter(pill.label)}
              />
            ))}

            {/* More Filters */}
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More Filters
            </Button>

            {/* Clear Filters */}
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
                {/* Checkbox Column */}
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--admin-primary)' }}
                    checked={
                      paginatedStudents.length > 0 &&
                      selectedIds.size === paginatedStudents.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>

                {/* Student Column */}
                <th
                  className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <span className="inline-flex items-center gap-1">
                    Student <ArrowUpDown className="h-3 w-3 opacity-40" />
                  </span>
                </th>

                {/* Class Column */}
                <th
                  className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <span className="inline-flex items-center gap-1">
                    Class <ArrowUpDown className="h-3 w-3 opacity-40" />
                  </span>
                </th>

                {/* Parent Column */}
                <th
                  className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Parent / Guardian
                </th>

                {/* Phone Column */}
                <th
                  className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Phone
                </th>

                {/* Status Column */}
                <th
                  className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <span className="inline-flex items-center gap-1">
                    Status <ArrowUpDown className="h-3 w-3 opacity-40" />
                  </span>
                </th>

                {/* DOB Column */}
                <th
                  className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <span className="inline-flex items-center gap-1">
                    DOB <ArrowUpDown className="h-3 w-3 opacity-40" />
                  </span>
                </th>

                {/* Actions Column */}
                <th
                  className="w-[80px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedStudents.length === 0 ? (
                /* ── Empty State ── */
                <tr>
                  <td colSpan={8} className="py-16 text-center">
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
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className="cursor-pointer table-row-preone border-b"
                      style={{
                        borderColor: 'var(--admin-border)',
                        background: isSelected
                          ? 'var(--admin-primary-soft)'
                          : undefined,
                      }}
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded"
                          style={{ accentColor: 'var(--admin-primary)' }}
                          checked={isSelected}
                          onChange={() => toggleSelectRow(student.id)}
                        />
                      </td>

                      {/* Student: Avatar + Name + ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback
                              className="text-xs font-semibold"
                              style={{
                                background: student.avatarBg,
                                color: student.avatarColor,
                              }}
                            >
                              {student.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div
                              className="truncate font-medium"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              {student.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            >
                              {student.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-4 py-3">
                        <ClassPill
                          label={student.class}
                          color={student.classColor}
                          bg={student.classBg}
                        />
                      </td>

                      {/* Parent/Guardian */}
                      <td
                        className="whitespace-nowrap px-4 py-3"
                        style={{ color: 'var(--admin-text)' }}
                      >
                        {student.parent}
                      </td>

                      {/* Phone */}
                      <td
                        className="whitespace-nowrap px-4 py-3 text-xs tabular-nums"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {student.phone}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>

                      {/* DOB */}
                      <td
                        className="whitespace-nowrap px-4 py-3 text-xs"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        {student.dob}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                            style={{
                              color: 'var(--admin-text-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--admin-surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={() => router.push(`/admin/students/${student.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                            style={{
                              color: 'var(--admin-text-muted)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--admin-surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 4: PAGINATION ── */}
        {filteredStudents.length > 0 && (
          <div
            className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            {/* Left: Showing info + Rows per page */}
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                Showing {startRow} to {endRow} of {filteredStudents.length} students
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                  Rows per page:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    setSelectedIds(new Set());
                  }}
                  className="h-7 rounded border px-1.5 text-xs outline-none"
                  style={{
                    background: 'var(--admin-surface)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text)',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: safePage <= 1 ? 0.4 : 1,
                }}
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(safePage - 1)}
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
                      safePage === p
                        ? {
                            background: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }
                        : { color: 'var(--admin-text-muted)' }
                    }
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{
                  color: 'var(--admin-text-muted)',
                  opacity: safePage >= totalPages ? 0.4 : 1,
                }}
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </PreOneCard>

      {/* ── Dialogs ── */}
      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onStudentCreated={() => {}}
      />
      {selectedStudent && (
        <TransferStudentDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          student={{
            id: selectedStudent.id,
            firstName: selectedStudent.name.split(' ')[0],
            lastName: selectedStudent.name.split(' ')[1] || '',
            dob: '',
            gender: '',
            status: selectedStudent.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED',
            admissionDate: '',
            class: null,
            primaryParent: null,
          }}
          onTransferred={() => {}}
        />
      )}
    </div>
  );
}
