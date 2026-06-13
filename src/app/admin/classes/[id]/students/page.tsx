'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

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

// ── Status badge colors ──
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
  GRADUATED: 'bg-sky-50 text-sky-700 border-sky-200',
  TRANSFERRED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  GRADUATED: 'Graduated',
  TRANSFERRED: 'Transferred',
};

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
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
      const params = new URLSearchParams({ classId, limit: '100' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/students?${params}`, {
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
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const found = (data.classes || []).find((c: ClassInfo) => c.id === classId);
          if (found) setClassName(found.name);
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
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push(`/admin/classes/${classId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {className || 'Class'}
        </Button>

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {className} — Students
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCount} active student{activeCount !== 1 ? 's' : ''} enrolled
            </p>
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

        {/* ── Filters ── */}
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    statusFilter === key
                      ? STATUS_COLORS[key]
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Students Table ── */}
        <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Roll No.</TableHead>
                  <TableHead className="w-[100px]">Gender</TableHead>
                  <TableHead className="w-[120px]">Attendance</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
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
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No students found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer table-row-preone"
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                    >
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {student.firstName} {student.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.rollNumber || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.gender}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={`font-medium ${
                          (student.attendanceRate ?? 0) >= 90 ? 'text-emerald-600' :
                          (student.attendanceRate ?? 0) >= 75 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {student.attendanceRate != null ? `${student.attendanceRate}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[student.status]}`}>
                          {STATUS_LABELS[student.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-portal-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/students/${student.id}`);
                          }}
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
        </div>
      </div>
    </PageTransition>
  );
}
