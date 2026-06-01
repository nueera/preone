'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  List,
  Search,
  Users,
  MapPin,
  UserCheck,
  GraduationCap,
  Droplets,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ──
interface GrowthScore {
  overall: number;
  period: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
}

interface ParentInfo {
  isPrimary: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    relation: string;
    occupation: string | null;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rollNumber: string | null;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  aadhaarNumber: string | null;
  status: string;
  admissionDate: string;
  medicalAlerts: boolean;
  growthScore: GrowthScore | null;
  parents: ParentInfo[];
  medicalRecords: Array<{
    id: string;
    allergies: string | null;
    conditions: string | null;
    medications: string | null;
    vaccinationStatus: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
  }>;
}

interface ClassInfo {
  id: string;
  name: string;
  capacity: number;
  roomNo: string | null;
  section: string | null;
  program: {
    id: string;
    name: string;
    description: string | null;
    ageMin: number;
    ageMax: number;
  };
  branch: {
    id: string;
    name: string;
  };
}

interface ClassData {
  classInfo: ClassInfo | null;
  students: Student[];
  totalStudents: number;
  message?: string;
}

// ── Helpers ──
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return `${years}y ${months}m`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getGrowthColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getGrowthTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getGrowthLabel(score: number): string {
  if (score >= 80) return 'A+';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ── Sort type ──
type SortField = 'name' | 'rollNumber' | 'growth' | 'dob';
type SortDir = 'asc' | 'desc';

/**
 * MyClassPage — Teacher's class overview with student grid/list view.
 */
export default function MyClassPage() {
  const router = useRouter();
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── Fetch data ──
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('preone_token');
      if (!token) { router.push('/login'); return; }

      try {
        setLoading(true);
        const res = await fetch('/api/teacher/class', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load class data');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // ── Filtered + sorted students ──
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    let list = [...data.students];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'rollNumber':
          cmp = (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true });
          break;
        case 'growth':
          cmp = (a.growthScore?.overall ?? 0) - (b.growthScore?.overall ?? 0);
          break;
        case 'dob':
          cmp = new Date(a.dob).getTime() - new Date(b.dob).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [data?.students, search, sortField, sortDir]);

  // ── Sort handler ──
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 text-emerald-600" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-emerald-600" />
    );
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Class</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── No class assigned ──
  if (!data?.classInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Class Assigned</h3>
        <p className="text-gray-500 max-w-md">
          You don&apos;t have a class assigned yet. Please contact the administrator for class assignment.
        </p>
      </div>
    );
  }

  const { classInfo, students } = data;

  return (
    <div className="space-y-6">
      {/* ── Class Header ── */}
      <Card className="overflow-hidden border-0 shadow-md">
        {/* Banner gradient */}
        <div
          className="relative h-32"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0ea5e9 100%)',
          }}
        >
          {/* Placeholder pattern for class photo/banner */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-6xl font-bold text-white/20">🎓</div>
            <div className="absolute bottom-2 right-12 text-4xl font-bold text-white/20">📚</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90" />
        </div>
        <CardContent className="relative -mt-8 px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {classInfo.name}
              </h1>
              <p className="text-gray-500 mt-0.5">{classInfo.program.name} Program</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl"
              >
                <Users className="h-3.5 w-3.5" />
                {students.length} Students
              </Badge>
              {classInfo.roomNo && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-xl"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Room {classInfo.roomNo}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-xl"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Capacity: {classInfo.capacity}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Controls Row: Search + View Toggle ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-none px-3 ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none px-3 ${
                viewMode === 'list'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'No students match your search' : 'No Students Yet'}
          </h3>
          <p className="text-gray-500 text-sm">
            {search
              ? 'Try adjusting your search query.'
              : 'Students will appear here once they are enrolled in this class.'}
          </p>
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => router.push(`/teacher/my-class/${student.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && filteredStudents.length > 0 && (
        <Card className="border-0 shadow-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-10"></TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">
                    Name <SortIcon field="name" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('rollNumber')}
                >
                  <span className="flex items-center">
                    Roll No <SortIcon field="rollNumber" />
                  </span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead
                  className="hidden lg:table-cell cursor-pointer select-none"
                  onClick={() => handleSort('dob')}
                >
                  <span className="flex items-center">
                    DOB <SortIcon field="dob" />
                  </span>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Blood Group</TableHead>
                <TableHead
                  className="hidden sm:table-cell cursor-pointer select-none"
                  onClick={() => handleSort('growth')}
                >
                  <span className="flex items-center">
                    Growth <SortIcon field="growth" />
                  </span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Medical</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onClick={() => router.push(`/teacher/my-class/${student.id}`)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Student Card Component (Grid View) ──
function StudentCard({ student, onClick }: { student: Student; onClick: () => void }) {
  const growthOverall = student.growthScore?.overall ?? 0;
  const growthColor = getGrowthColor(growthOverall);
  const growthTextColor = getGrowthTextColor(growthOverall);
  const initials = getInitials(student.firstName, student.lastName);

  return (
    <Card
      className="group cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 mb-3 ring-2 ring-emerald-100">
            {student.photo ? (
              <AvatarImage src={student.photo} alt={student.firstName} />
            ) : (
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <h3 className="font-semibold text-gray-900 text-sm">
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Roll: {student.rollNumber || '-'} | {student.gender}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(student.dob)}</p>
        </div>

        {/* Details row */}
        <div className="mt-3 space-y-2">
          {/* Blood Group */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Droplets className="h-3 w-3" /> Blood
            </span>
            <span className="font-medium text-gray-700">{student.bloodGroup || 'N/A'}</span>
          </div>

          {/* Medical alerts */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Heart className="h-3 w-3" /> Medical
            </span>
            {student.medicalAlerts ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 rounded-md">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Alert
              </Badge>
            ) : (
              <span className="flex items-center gap-0.5 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Clear
              </span>
            )}
          </div>

          {/* Growth score */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <TrendingUp className="h-3 w-3" /> Growth
            </span>
            {student.growthScore ? (
              <span className={`font-semibold ${growthTextColor}`}>
                {growthOverall}/100
              </span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>

          {/* Growth bar */}
          {student.growthScore && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${growthColor}`}
                style={{ width: `${Math.min(growthOverall, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* View Profile button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Student Row Component (List View) ──
function StudentRow({ student, onClick }: { student: Student; onClick: () => void }) {
  const growthOverall = student.growthScore?.overall ?? 0;
  const growthTextColor = getGrowthTextColor(growthOverall);
  const initials = getInitials(student.firstName, student.lastName);

  return (
    <TableRow
      className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
      onClick={onClick}
    >
      <TableCell>
        <Avatar className="h-8 w-8">
          {student.photo ? (
            <AvatarImage src={student.photo} alt={student.firstName} />
          ) : (
            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </TableCell>
      <TableCell className="font-medium">
        {student.firstName} {student.lastName}
      </TableCell>
      <TableCell>{student.rollNumber || '-'}</TableCell>
      <TableCell className="hidden md:table-cell">{student.gender}</TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-gray-600">
        {formatDate(student.dob)}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {student.bloodGroup ? (
          <Badge variant="outline" className="text-xs rounded-md">
            {student.bloodGroup}
          </Badge>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {student.growthScore ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`font-semibold cursor-default ${growthTextColor}`}>
                  {growthOverall}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Period: {student.growthScore.period}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {student.medicalAlerts ? (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 rounded-md">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Alert
          </Badge>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
