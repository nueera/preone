'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Filter,
  GraduationCap,
  Grid2X2,
  MapPin,
  MoreVertical,
  PieChart,
  Plus,
  Search,
  Sprout,
  Star,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClassItem {
  id: string;
  name: string;
  section?: string | null;
  capacity: number;
  roomNo?: string | null;
  teacherId?: string | null;
  teacher?: TeacherInfo | null;
  program: { id: string; name: string };
  _count: { students: number };
}

interface ProgramGroup {
  id: string;
  name: string;
  classes: ClassItem[];
}

type ProgramAccent = 'primary' | 'pink' | 'success' | 'info' | 'orange';

const PROGRAM_ACCENTS: Record<
  string,
  {
    accent: ProgramAccent;
    icon: React.ComponentType<{ className?: string }>;
    imageTone: string;
  }
> = {
  Playgroup: {
    accent: 'pink',
    icon: Star,
    imageTone:
      'from-[var(--admin-pink-soft)] via-[var(--admin-surface)] to-[var(--admin-pink-soft)]',
  },
  Nursery: {
    accent: 'success',
    icon: Sprout,
    imageTone:
      'from-[var(--admin-success-soft)] via-[var(--admin-surface)] to-[var(--admin-success-soft)]',
  },
  LKG: {
    accent: 'info',
    icon: BookOpen,
    imageTone:
      'from-[var(--admin-info-soft)] via-[var(--admin-surface)] to-[var(--admin-info-soft)]',
  },
  UKG: {
    accent: 'orange',
    icon: Star,
    imageTone:
      'from-[var(--admin-orange-soft)] via-[var(--admin-surface)] to-[var(--admin-orange-soft)]',
  },
};

const ACCENT_CLASSES: Record<
  ProgramAccent,
  {
    text: string;
    soft: string;
    border: string;
    bar: string;
    ring: string;
    cardTint: string;
  }
> = {
  primary: {
    text: 'text-[var(--admin-primary)]',
    soft: 'bg-[var(--admin-primary-soft)]',
    border: 'border-[var(--admin-primary)]/20',
    bar: 'bg-[var(--admin-primary)]',
    ring: 'ring-[var(--admin-primary)]/20',
    cardTint: 'from-[var(--admin-primary-soft)]/55',
  },
  pink: {
    text: 'text-[var(--admin-pink)]',
    soft: 'bg-[var(--admin-pink-soft)]',
    border: 'border-[var(--admin-pink)]/20',
    bar: 'bg-[var(--admin-pink)]',
    ring: 'ring-[var(--admin-pink)]/20',
    cardTint: 'from-[var(--admin-pink-soft)]/55',
  },
  success: {
    text: 'text-[var(--admin-success)]',
    soft: 'bg-[var(--admin-success-soft)]',
    border: 'border-[var(--admin-success)]/20',
    bar: 'bg-[var(--admin-success)]',
    ring: 'ring-[var(--admin-success)]/20',
    cardTint: 'from-[var(--admin-success-soft)]/55',
  },
  info: {
    text: 'text-[var(--admin-info)]',
    soft: 'bg-[var(--admin-info-soft)]',
    border: 'border-[var(--admin-info)]/20',
    bar: 'bg-[var(--admin-info)]',
    ring: 'ring-[var(--admin-info)]/20',
    cardTint: 'from-[var(--admin-info-soft)]/55',
  },
  orange: {
    text: 'text-[var(--admin-orange)]',
    soft: 'bg-[var(--admin-orange-soft)]',
    border: 'border-[var(--admin-orange)]/20',
    bar: 'bg-[var(--admin-orange)]',
    ring: 'ring-[var(--admin-orange)]/20',
    cardTint: 'from-[var(--admin-orange-soft)]/55',
  },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function programMeta(name: string) {
  return (
    PROGRAM_ACCENTS[name] || {
      accent: 'primary' as ProgramAccent,
      icon: GraduationCap,
      imageTone:
        'from-[var(--admin-primary-soft)] via-[var(--admin-surface)] to-[var(--admin-primary-soft)]',
    }
  );
}

function teacherName(cls: ClassItem) {
  if (!cls.teacher) return 'Teacher not assigned';
  return `${cls.teacher.firstName} ${cls.teacher.lastName}`;
}

function occupancy(cls: ClassItem) {
  return cls.capacity > 0
    ? Math.min(100, Math.round((cls._count.students / cls.capacity) * 100))
    : 0;
}

function uniqueTeachers(classes: ClassItem[]) {
  const names = new Set<string>();
  classes.forEach((cls) => {
    if (cls.teacher) names.add(teacherName(cls));
  });
  return Array.from(names).sort();
}

function IconTile({
  icon: Icon,
  accent,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: ProgramAccent;
  className?: string;
}) {
  const styles = ACCENT_CLASSES[accent];
  return (
    <div
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-2xl border',
        styles.soft,
        styles.border,
        className
      )}
    >
      <Icon className={cn('h-7 w-7', styles.text)} />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: ProgramAccent;
}) {
  const styles = ACCENT_CLASSES[accent];
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-[var(--admin-surface)] p-5 shadow-sm',
        styles.border
      )}
    >
      <span
        aria-hidden="true"
        className={cn('absolute left-0 top-0 h-full w-1', styles.bar)}
      />
      <div className="flex items-center gap-5">
        <IconTile icon={icon} accent={accent} />
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none text-[var(--admin-text)]">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--admin-text)]">
            {title}
          </p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function CapacityBar({
  value,
  accent,
}: {
  value: number;
  accent: ProgramAccent;
}) {
  const styles = ACCENT_CLASSES[accent];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--admin-surface-2)]">
      <div
        className={cn('h-full rounded-full transition-all', styles.bar)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ClassArtwork({
  programName,
  compact,
}: {
  programName: string;
  compact?: boolean;
}) {
  const meta = programMeta(programName);
  const styles = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'relative hidden shrink-0 overflow-hidden rounded-lg border bg-gradient-to-r md:block',
        meta.imageTone,
        styles.border,
        compact ? 'h-24 w-36' : 'h-28 w-[17.5rem]'
      )}
    >
      <div className="absolute inset-x-4 bottom-0 h-14 rounded-t-full bg-[var(--admin-surface)]/75 blur-sm" />
      <div className="absolute left-5 top-4 grid grid-cols-3 gap-1.5 opacity-80">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'block h-3 w-3 rounded-sm',
              index % 2 ? styles.soft : 'bg-[var(--admin-surface)]'
            )}
          />
        ))}
      </div>
      <div
        className={cn(
          'absolute bottom-4 right-7 flex items-end gap-2',
          compact && 'right-4'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-surface)] shadow-sm">
          <UserRound className={cn('h-7 w-7', styles.text)} />
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--admin-surface)] shadow-sm">
          <Icon className={cn('h-8 w-8', styles.text)} />
        </div>
      </div>
    </div>
  );
}

function ProgramPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  const isAll = label === 'All Programs';
  const meta = isAll
    ? { accent: 'primary' as ProgramAccent, icon: Grid2X2 }
    : programMeta(label);
  const styles = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-5 text-sm font-semibold shadow-sm transition',
        active
          ? 'border-transparent bg-[var(--admin-primary)] text-white shadow-md'
          : 'border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:border-[var(--admin-primary)]/30 hover:text-[var(--admin-primary)]'
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-white' : styles.text)} />
      {label}
      {typeof count === 'number' && !active ? (
        <span className="text-xs text-[var(--admin-text-muted)]">{count}</span>
      ) : null}
    </button>
  );
}

function ClassCard({
  cls,
  wide,
  onView,
}: {
  cls: ClassItem;
  wide?: boolean;
  onView: () => void;
}) {
  const meta = programMeta(cls.program.name);
  const styles = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;
  const value = occupancy(cls);
  const roomLabel = cls.roomNo ? `Room ${cls.roomNo}` : 'Room not set';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-[var(--admin-surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        styles.border
      )}
    >
      <button
        type="button"
        aria-label={`More options for ${cls.name}`}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm transition hover:text-[var(--admin-primary)]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <div className={cn('flex gap-4', wide && 'min-h-36')}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-[var(--admin-text)]">
                {cls.name}
              </h3>
              <span
                className={cn(
                  'mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold',
                  styles.soft,
                  styles.text
                )}
              >
                {cls.program.name}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-xs font-medium text-[var(--admin-text-muted)]">
            <div className="flex items-center gap-1.5 text-[var(--admin-text)]">
              <UserRound className={cn('h-3.5 w-3.5', styles.text)} />
              <span className="truncate">{teacherName(cls)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {roomLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {cls.section || 'Batch not set'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--admin-text)]">
              <Users className="h-3.5 w-3.5" />
              {cls._count.students} / {cls.capacity} Students
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <CapacityBar value={value} accent={meta.accent} />
            </div>
            <span className={cn('w-10 text-right text-xs font-bold', styles.text)}>
              {value}%
            </span>
          </div>
        </div>

        <ClassArtwork programName={cls.program.name} compact={!wide} />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 min-w-20 rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)]"
          onClick={onView}
        >
          View
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 min-w-20 rounded-lg border bg-[var(--admin-primary-soft)]',
            styles.border,
            styles.text
          )}
          onClick={onView}
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </article>
  );
}

function ProgramSection({
  program,
  onViewClass,
  className,
}: {
  program: ProgramGroup;
  onViewClass: (id: string) => void;
  className?: string;
}) {
  const meta = programMeta(program.name);
  const styles = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;
  const wide = program.classes.length <= 2;

  return (
    <section
      className={cn(
        'rounded-xl border bg-gradient-to-br to-[var(--admin-surface)] p-4 shadow-sm',
        styles.cardTint,
        styles.border,
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', styles.text)} />
          <h2 className="text-base font-bold text-[var(--admin-text)]">
            {program.name}
          </h2>
          <span className="text-sm font-semibold text-[var(--admin-text-muted)]">
            ({program.classes.length}{' '}
            {program.classes.length === 1 ? 'Class' : 'Classes'})
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--admin-primary)]"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          'grid gap-4',
          wide ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
        )}
      >
        {program.classes.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            wide={wide}
            onView={() => onViewClass(cls.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default function ClassesListPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const apiPrograms = (data.programs || []) as ProgramGroup[];
        const apiClasses = (data.classes || []) as ClassItem[];
        const classById = new Map(apiClasses.map((cls) => [cls.id, cls]));

        setAllClasses(apiClasses);
        setPrograms(
          apiPrograms.map((program) => ({
            ...program,
            classes: program.classes.map((cls) => ({
              ...cls,
              program: cls.program || { id: program.id, name: program.name },
              teacher: classById.get(cls.id)?.teacher || cls.teacher,
            })),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const teacherOptions = useMemo(() => uniqueTeachers(allClasses), [allClasses]);

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return programs
      .filter((program) => programFilter === 'all' || program.name === programFilter)
      .map((program) => ({
        ...program,
        classes: program.classes.filter((cls) => {
          const clsOccupancy = occupancy(cls);
          const clsTeacher = teacherName(cls);
          const matchesSearch =
            !normalizedSearch ||
            cls.name.toLowerCase().includes(normalizedSearch) ||
            cls.program.name.toLowerCase().includes(normalizedSearch) ||
            clsTeacher.toLowerCase().includes(normalizedSearch) ||
            (cls.roomNo || '').toLowerCase().includes(normalizedSearch);
          const matchesTeacher =
            teacherFilter === 'all' || clsTeacher === teacherFilter;
          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'available' && clsOccupancy < 100) ||
            (statusFilter === 'near-full' &&
              clsOccupancy >= 80 &&
              clsOccupancy < 100) ||
            (statusFilter === 'full' && clsOccupancy >= 100) ||
            (statusFilter === 'unassigned' && !cls.teacher);

          return matchesSearch && matchesTeacher && matchesStatus;
        }),
      }))
      .filter((program) => program.classes.length > 0);
  }, [programFilter, programs, search, statusFilter, teacherFilter]);

  const totalClasses = allClasses.length;
  const totalStudents = allClasses.reduce(
    (sum, cls) => sum + cls._count.students,
    0
  );
  const totalCapacity = allClasses.reduce((sum, cls) => sum + cls.capacity, 0);
  const teacherCount = allClasses.filter((cls) => cls.teacherId || cls.teacher).length;
  const availableCapacity = Math.max(0, totalCapacity - totalStudents);

  const programSummaries = programs.map((program) => {
    const students = program.classes.reduce(
      (sum, cls) => sum + cls._count.students,
      0
    );
    const capacity = program.classes.reduce((sum, cls) => sum + cls.capacity, 0);
    return {
      program,
      students,
      capacity,
      utilization: capacity > 0 ? Math.round((students / capacity) * 100) : 0,
    };
  });

  const resetFilters = () => {
    setSearch('');
    setProgramFilter('all');
    setTeacherFilter('all');
    setStatusFilter('all');
  };

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <IconTile icon={GraduationCap} accent="primary" className="h-16 w-16" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--admin-text)]">
                Classes & Sections
              </h1>
              <p className="mt-1 text-base text-[var(--admin-text-muted)]">
                Manage classes, sections and student capacity across programs
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 font-bold text-[var(--admin-text)]"
            >
              <Download className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              type="button"
              className="h-11 rounded-lg bg-[var(--admin-primary)] px-5 font-bold text-white shadow-sm hover:bg-[var(--admin-primary)]/90"
            >
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-[var(--admin-primary)]/15 bg-[var(--admin-primary-soft)] px-5 font-bold text-[var(--admin-primary)]"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Classes"
            value={totalClasses}
            subtitle="All programs"
            icon={Building2}
            accent="primary"
          />
          <StatCard
            title="Total Students"
            value={totalStudents}
            subtitle="Across all classes"
            icon={Users}
            accent="info"
          />
          <StatCard
            title="Teachers Assigned"
            value={teacherCount}
            subtitle="Across all classes"
            icon={UserRound}
            accent="success"
          />
          <StatCard
            title="Available Capacity"
            value={availableCapacity}
            subtitle="Total seats remaining"
            icon={PieChart}
            accent="orange"
          />
        </div>

        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_220px_220px_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by class name, teacher, room..."
                className="h-11 rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)] pl-11 pr-10 text-sm"
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="h-11 w-full rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)] font-semibold">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.name}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="h-11 w-full rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)] font-semibold">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teacherOptions.map((teacher) => (
                  <SelectItem key={teacher} value={teacher}>
                    {teacher}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full rounded-lg border-[var(--admin-border)] bg-[var(--admin-surface)] font-semibold">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="near-full">Near Full</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-11 rounded-lg border-[var(--admin-primary)]/20 bg-[var(--admin-surface)] px-7 font-bold text-[var(--admin-primary)]"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex gap-5 overflow-x-auto px-4 py-1">
          <ProgramPill
            label="All Programs"
            active={programFilter === 'all'}
            onClick={() => setProgramFilter('all')}
          />
          {programs.map((program) => (
            <ProgramPill
              key={program.id}
              label={program.name}
              count={program.classes.length}
              active={programFilter === program.name}
              onClick={() => setProgramFilter(program.name)}
            />
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
              >
                <Skeleton className="mb-4 h-6 w-44" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-44 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPrograms.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredPrograms.map((program, index) => (
              <ProgramSection
                key={program.id}
                program={program}
                onViewClass={(id) => router.push(`/admin/classes/${id}`)}
                className={index === 0 ? 'xl:col-span-2' : ''}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center">
            <IconTile icon={GraduationCap} accent="primary" />
            <h2 className="mt-4 text-lg font-bold text-[var(--admin-text)]">
              No classes found
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
              Adjust the current filters or add a new class.
            </p>
          </div>
        )}

        <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <div className="flex items-center gap-5">
              <IconTile icon={BarChart3} accent="primary" />
              <div>
                <h2 className="text-xl font-bold text-[var(--admin-text)]">
                  Capacity Overview
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                  Overall capacity utilization across programs
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {programSummaries.map(({ program, students, capacity, utilization }) => {
                const meta = programMeta(program.name);
                const styles = ACCENT_CLASSES[meta.accent];
                const Icon = meta.icon;
                return (
                  <div key={program.id} className="min-w-0">
                    <div className="mb-3 flex items-center gap-3">
                      <IconTile
                        icon={Icon}
                        accent={meta.accent}
                        className="h-10 w-10 rounded-xl"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--admin-text)]">
                          {program.name}
                        </p>
                        <p className="text-xs text-[var(--admin-text)]">
                          {students} / {capacity} Students
                        </p>
                      </div>
                      <span
                        className={cn('ml-auto text-sm font-bold', styles.text)}
                      >
                        {utilization}%
                      </span>
                    </div>
                    <CapacityBar value={utilization} accent={meta.accent} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
