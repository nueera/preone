'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  X,
  GraduationCap,
  Users,
  MapPin,
  Clock,
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
import { Progress } from '@/components/ui/progress';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
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

// ── Program badge colors ──
const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Playgroup: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Nursery:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LKG:       { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  UKG:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PROGRAM_ICONS: Record<string, string> = {
  Playgroup: '🧒',
  Nursery: '🌱',
  LKG: '📖',
  UKG: '🎓',
};

// ── Auth helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function ClassesListPage() {
  const router = useRouter();

  // ── State ──
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // ── Fetch classes ──
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
        setAllClasses(data.classes || []);
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

  // ── Derived stats ──
  const totalClasses = allClasses.length;
  const totalStudents = allClasses.reduce((sum, c) => sum + c._count.students, 0);
  const totalCapacity = allClasses.reduce((sum, c) => sum + c.capacity, 0);
  const unassignedTeachers = allClasses.filter((c) => !c.teacherId).length;

  // ── Filter programs by search & program filter ──
  const filteredPrograms = programs
    .filter((p) => !programFilter || p.name === programFilter)
    .map((p) => ({
      ...p,
      classes: p.classes.filter((c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.program.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.teacher && `${c.teacher.firstName} ${c.teacher.lastName}`.toLowerCase().includes(search.toLowerCase())) ||
        (c.roomNo && c.roomNo.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((p) => p.classes.length > 0);

  const programNames = programs.map((p) => p.name);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Top Bar ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Classes
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage classes and sections across programs
            </p>
          </div>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => {/* TODO: Add class dialog */}}
          >
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Classes"
            value={totalClasses}
            icon={<GraduationCap className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Total Students"
            value={totalStudents}
            suffix=""
            icon={<Users className="h-5 w-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Total Capacity"
            value={totalCapacity}
            suffix=""
            icon={<Users className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="No Teacher Assigned"
            value={unassignedTeachers}
            icon={<GraduationCap className="h-5 w-5" />}
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
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by class name, teacher, room..."
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

            {/* Program Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setProgramFilter('')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  !programFilter
                    ? 'bg-portal-50 text-portal-700 border-portal-200'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                All Programs
              </button>
              {programNames.map((name) => {
                const colors = PROGRAM_COLORS[name] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                return (
                  <button
                    key={name}
                    onClick={() => setProgramFilter(programFilter === name ? '' : name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      programFilter === name
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {PROGRAM_ICONS[name] || '📚'} {name}
                  </button>
                );
              })}
            </div>

            {(search || programFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={() => { setSearch(''); setProgramFilter(''); }}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* ── Class Cards Grouped by Program ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PreOneCard key={i} variant="default">
                <PreOneCardContent>
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </PreOneCardContent>
              </PreOneCard>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No classes found</p>
            <p className="text-sm text-muted-foreground">
              {search || programFilter
                ? 'Try adjusting your search or filters'
                : 'Create your first class to get started'}
            </p>
            <Button
              className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={() => {/* TODO: Add class dialog */}}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
        ) : (
          filteredPrograms.map((program) => {
            const colors = PROGRAM_COLORS[program.name] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
            return (
              <div key={program.id} className="space-y-4">
                {/* Program Header */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{PROGRAM_ICONS[program.name] || '📚'}</span>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {program.name}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {program.classes.length} {program.classes.length === 1 ? 'class' : 'classes'}
                  </Badge>
                </div>

                {/* Class Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.classes.map((cls) => {
                    const occupancy = cls.capacity > 0 ? Math.round((cls._count.students / cls.capacity) * 100) : 0;
                    const isFull = occupancy >= 100;
                    return (
                      <PreOneCard
                        key={cls.id}
                        variant="default"
                        hover
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/classes/${cls.id}`)}
                      >
                        <PreOneCardContent className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {cls.name}
                              </h3>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border mt-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                                {program.name}
                              </span>
                            </div>
                            {cls.teacher && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-portal-50 text-portal-700 text-xs font-semibold">
                                  {cls.teacher.firstName.charAt(0)}{cls.teacher.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          {/* Teacher */}
                          {cls.teacher ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>{cls.teacher.firstName} {cls.teacher.lastName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-600">
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>No teacher assigned</span>
                            </div>
                          )}

                          {/* Room & Schedule */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {cls.roomNo && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Room {cls.roomNo}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Mon–Fri
                            </span>
                          </div>

                          {/* Capacity Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                <Users className="h-3 w-3 inline mr-1" />
                                {cls._count.students} / {cls.capacity} students
                              </span>
                              <span className={`font-medium ${isFull ? 'text-red-600' : occupancy >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {occupancy}%
                              </span>
                            </div>
                            <Progress
                              value={occupancy}
                              className="h-1.5"
                            />
                          </div>
                        </PreOneCardContent>
                      </PreOneCard>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}
