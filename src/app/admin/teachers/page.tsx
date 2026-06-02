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
  Filter,
  Phone,
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
import { AddTeacherDialog } from '@/components/add-teacher-dialog';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

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

// ── Status badge colors ──
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  INACTIVE: 'Inactive',
};

const QUALIFICATIONS = ['B.Ed', 'D.Ed', 'M.Ed', 'B.El.Ed', 'Other'];

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
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

  // ── Fetch branches for filter ──
  useEffect(() => {
    async function fetchBranches() {
      try {
        const token = getToken();
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Use school data if available
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    }
    // For now, we'll get branches from the teachers data
  }, []);

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

  const totalPages = Math.ceil(total / limit);

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

  const hasActiveFilters = debouncedSearch || statusFilter || qualificationFilter || branchFilter;

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teachers & Staff
          </h1>
          <p className="text-sm text-muted-foreground">Manage teachers and staff members</p>
        </div>
        <Button
          className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Teacher
        </Button>
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
              placeholder="Search by name, qualification, specialization..."
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

          {/* Status Filter */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setStatusFilter(statusFilter === key ? '' : key);
                  setPage(1);
                }}
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

          {/* Qualification Filter */}
          <Select
            value={qualificationFilter}
            onValueChange={(v) => {
              setQualificationFilter(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Qualifications</SelectItem>
              {QUALIFICATIONS.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Branch Filter */}
          {branches.length > 0 && (
            <Select
              value={branchFilter}
              onValueChange={(v) => {
                setBranchFilterVal(v === 'ALL' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
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

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Teachers Table ── */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Photo</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('firstName')}
                >
                  Name {sortField === 'firstName' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[150px]"
                  onClick={() => handleSort('qualification')}
                >
                  Qualification {sortField === 'qualification' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[150px]"
                  onClick={() => handleSort('specialization')}
                >
                  Specialization {sortField === 'specialization' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[120px]"
                  onClick={() => handleSort('assignedClass')}
                >
                  Assigned Class {sortField === 'assignedClass' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[120px]">Phone</TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[80px]"
                  onClick={() => handleSort('experience')}
                >
                  Exp. {sortField === 'experience' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-[100px]"
                  onClick={() => handleSort('status')}
                >
                  Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
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
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No teachers found</p>
                      <Button
                        className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
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
                    onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                          {getInitials(teacher.firstName, teacher.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{teacher.email}</div>
                    </TableCell>
                    <TableCell>
                      {teacher.qualification ? (
                        <Badge variant="secondary" className="text-xs">
                          {teacher.qualification}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {teacher.specialization || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {teacher.assignedClass ? (
                        <Badge variant="secondary" className="text-xs">
                          {teacher.assignedClass.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.phone ? (
                        <a
                          href={`tel:${teacher.phone}`}
                          className="text-sm text-portal-600 hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {teacher.experience} yrs
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[teacher.status]}`}>
                        {STATUS_LABELS[teacher.status]}
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
                              router.push(`/admin/teachers/${teacher.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/teachers/${teacher.id}`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/teachers/${teacher.id}?tab=salary`);
                            }}
                          >
                            <IndianRupee className="mr-2 h-4 w-4" />
                            Manage Salary
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivate(teacher);
                            }}
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

        {/* ── Pagination ── */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} teachers
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

      {/* ── Add Teacher Dialog ── */}
      <AddTeacherDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onTeacherCreated={fetchTeachers}
      />
    </div>
  );
}
