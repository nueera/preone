'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Upload,
  Search,
  X,
  GraduationCap,
  MoreHorizontal,
  Eye,
  Pencil,
  ArrowRightLeft,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { TransferStudentDialog } from '@/components/transfer-student-dialog';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

interface PrimaryParent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relation: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup?: string | null;
  aadhaarNumber?: string | null;
  photo?: string | null;
  admissionDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  rollNumber?: string | null;
  classId?: string | null;
  class: ClassInfo | null;
  primaryParent: PrimaryParent | null;
}

interface ProgramGroup {
  id: string;
  name: string;
  classes: { id: string; name: string; _count: { students: number } }[];
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function StudentsListPage() {
  const router = useRouter();

  // ── State ──
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['ACTIVE']);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState<string[]>([]);
  const [gender, setGender] = useState('All');
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const limit = 25;

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch programs/classes for filter ──
  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    fetchClasses();
  }, []);

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (classId) params.set('classId', classId);
      if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
      if (gender && gender !== 'All') params.set('gender', gender);
      if (selectedBloodGroups.length > 0) params.set('bloodGroup', selectedBloodGroups.join(','));

      const res = await fetch(`/api/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, classId, selectedStatuses, gender, selectedBloodGroups]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
    setClassId('');
    setSelectedStatuses(['ACTIVE']);
    setSelectedBloodGroups([]);
    setGender('All');
    setPage(1);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const toggleBloodGroup = (bg: string) => {
    setSelectedBloodGroups((prev) =>
      prev.includes(bg)
        ? prev.filter((b) => b !== bg)
        : [...prev, bg]
    );
    setPage(1);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Deactivate ${student.firstName} ${student.lastName}?`)) return;
    try {
      const token = getToken();
      await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStudents();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // ── Sort students client-side ──
  const sortedStudents = [...students].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortField) {
      case 'firstName':
        valA = a.firstName;
        valB = b.firstName;
        break;
      case 'lastName':
        valA = a.lastName;
        valB = b.lastName;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      case 'dob':
        valA = new Date(a.dob).getTime();
        valB = new Date(b.dob).getTime();
        break;
      case 'className':
        valA = a.class?.name || '';
        valB = b.class?.name || '';
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // ── Get initials ──
  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Students
          </h1>
          <p className="text-sm text-muted-foreground">Manage all students</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/admin/students/import')}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or parent..."
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

          {/* Class Filter */}
          <Select value={classId} onValueChange={(v) => { setClassId(v === 'ALL' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {programs.map((program) => (
                <SelectGroup key={program.id}>
                  <SelectLabel>{program.name}</SelectLabel>
                  {program.classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls._count.students})
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedStatuses.includes(key)
                    ? STATUS_COLORS[key]
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className='flex gap-1.5'>
            {['All', 'Male', 'Female'].map((g) => (
              <button
                key={g}
                onClick={() => { setGender(g); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  gender === g
                    ? 'bg-portal-50 text-portal-700 border-portal-200'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Blood Group Filter */}
          <Select
            onValueChange={(v) => {
              toggleBloodGroup(v);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((bg) => (
                <SelectItem key={bg} value={bg}>
                  {bg}
                  {selectedBloodGroups.includes(bg) ? ' ✓' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(debouncedSearch || classId || selectedStatuses.length !== 1 || selectedStatuses[0] !== 'ACTIVE' || selectedBloodGroups.length > 0 || gender !== 'All') && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Active Blood Group Tags */}
        {selectedBloodGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedBloodGroups.map((bg) => (
              <Badge key={bg} variant="secondary" className="gap-1 text-xs">
                {bg}
                <button onClick={() => toggleBloodGroup(bg)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ── Students Table ── */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Photo</TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[160px]"
                  onClick={() => handleSort('firstName')}
                >
                  Name {sortField === 'firstName' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[120px]"
                  onClick={() => handleSort('className')}
                >
                  Class {sortField === 'className' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[150px]">Parent</TableHead>
                <TableHead className="w-[120px]">Phone</TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[100px]"
                  onClick={() => handleSort('status')}
                >
                  Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[100px]"
                  onClick={() => handleSort('dob')}
                >
                  DOB {sortField === 'dob' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : sortedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No students found</p>
                      <Button
                        className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer table-row-preone"
                    onClick={() => router.push(`/admin/students/${student.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.rollNumber && (
                        <div className="text-xs text-muted-foreground">
                          #{student.rollNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.class ? (
                        <Badge variant="secondary" className="text-xs">
                          {student.class.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.primaryParent ? (
                        <div className="text-sm">
                          {student.primaryParent.firstName} {student.primaryParent.lastName}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.primaryParent?.phone ? (
                        <span className="text-sm text-muted-foreground">
                          {student.primaryParent.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[student.status]}`}>
                        {STATUS_LABELS[student.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(student.dob), 'dd MMM yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/students/${student.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/students/${student.id}`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                              setTransferDialogOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transfer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(student);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

        {/* ── Pagination ── */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} students
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onStudentCreated={fetchStudents}
      />
      {selectedStudent && (
        <TransferStudentDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          student={selectedStudent}
          onTransferred={fetchStudents}
        />
      )}
    </div>
  );
}
