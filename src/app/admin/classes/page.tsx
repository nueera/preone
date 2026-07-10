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
  SlidersHorizontal,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ── Program CSS-var-based colors (consistent with admin design system) ──
const PROGRAM_VARS: Record<string, { color: string; bg: string }> = {
  Playgroup: { color: 'var(--admin-pink)', bg: 'var(--admin-pink-soft)' },
  Nursery:   { color: 'var(--admin-orange)', bg: 'var(--admin-orange-soft)' },
  LKG:       { color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
  UKG:       { color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
};

const PROGRAM_ICONS: Record<string, string> = {
  Playgroup: '🧒',
  Nursery: '🌱',
  LKG: '📖',
  UKG: '🎓',
};

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
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
        {/* ── SECTION 1: HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <GraduationCap className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Classes
              </h1>
              <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                Manage classes and sections across programs
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => {/* TODO: Add class dialog */}}
          >
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* ── SECTION 2: STAT CARDS ── */}
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
            icon={<Users className="h-5 w-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Total Capacity"
            value={totalCapacity}
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

        {/* ── SECTION 3: FILTER BAR ── */}
        <PreOneCard className="!rounded-xl">
          <div className="p-4 space-y-3">
            {/* Row 1: Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--admin-text-subtle)' }}
                />
                <input
                  type="text"
                  placeholder="Search by class name, teacher, room..."
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

              {(search || programFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  style={{ color: 'var(--admin-error)' }}
                  onClick={() => { setSearch(''); setProgramFilter(''); }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Row 2: Program Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setProgramFilter('')}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={
                  !programFilter
                    ? {
                        background: 'var(--admin-primary-soft)',
                        color: 'var(--admin-primary)',
                      }
                    : {
                        background: 'var(--admin-surface-2)',
                        color: 'var(--admin-text-muted)',
                      }
                }
              >
                All Programs
              </button>
              {programNames.map((name) => {
                const vars = PROGRAM_VARS[name] || {
                  color: 'var(--admin-text-muted)',
                  bg: 'var(--admin-surface-2)',
                };
                const active = programFilter === name;
                return (
                  <button
                    key={name}
                    onClick={() =>
                      setProgramFilter(programFilter === name ? '' : name)
                    }
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={
                      active
                        ? { background: vars.bg, color: vars.color }
                        : {
                            background: 'var(--admin-surface-2)',
                            color: 'var(--admin-text-muted)',
                          }
                    }
                  >
                    {PROGRAM_ICONS[name] || '📚'} {name}
                  </button>
                );
              })}
            </div>
          </div>
        </PreOneCard>

        {/* ── SECTION 4: CLASS CARDS GROUPED BY PROGRAM ── */}
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
          <PreOneCard className="!rounded-xl">
            <PreOneCardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-3">
                <Search
                  className="h-10 w-10 opacity-40"
                  style={{ color: 'var(--admin-text-muted)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  No classes found
                </p>
                <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                  {search || programFilter
                    ? 'Try adjusting your search or filters.'
                    : 'Create your first class to get started.'}
                </p>
                <Button
                  size="sm"
                  className="mt-2 gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  onClick={() => {/* TODO: Add class dialog */}}
                >
                  <Plus className="h-4 w-4" />
                  Add Class
                </Button>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        ) : (
          filteredPrograms.map((program) => {
            const vars = PROGRAM_VARS[program.name] || {
              color: 'var(--admin-text-muted)',
              bg: 'var(--admin-surface-2)',
            };
            return (
              <div key={program.id} className="space-y-4">
                {/* Program Header */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{PROGRAM_ICONS[program.name] || '📚'}</span>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {program.name}
                  </h2>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ background: vars.bg, color: vars.color }}
                  >
                    {program.classes.length}{' '}
                    {program.classes.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {/* Class Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.classes.map((cls) => {
                    const occupancy =
                      cls.capacity > 0
                        ? Math.round((cls._count.students / cls.capacity) * 100)
                        : 0;
                    const isFull = occupancy >= 100;
                    return (
                      <PreOneCard
                        key={cls.id}
                        variant="default"
                        hover
                        className="cursor-pointer !rounded-xl"
                        onClick={() => router.push(`/admin/classes/${cls.id}`)}
                      >
                        <PreOneCardContent className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3
                                className="font-semibold"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {cls.name}
                              </h3>
                              <span
                                className="mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
                                style={{ background: vars.bg, color: vars.color }}
                              >
                                {program.name}
                              </span>
                            </div>
                            {cls.teacher && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback
                                  className="text-xs font-semibold"
                                  style={{
                                    background: 'var(--admin-primary-soft)',
                                    color: 'var(--admin-primary)',
                                  }}
                                >
                                  {cls.teacher.firstName.charAt(0)}
                                  {cls.teacher.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          {/* Teacher */}
                          {cls.teacher ? (
                            <div
                              className="flex items-center gap-2 text-sm"
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>
                                {cls.teacher.firstName} {cls.teacher.lastName}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-2 text-sm"
                              style={{ color: 'var(--admin-orange)' }}
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>No teacher assigned</span>
                            </div>
                          )}

                          {/* Room & Schedule */}
                          <div
                            className="flex items-center gap-4 text-xs"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
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
                              <span style={{ color: 'var(--admin-text-muted)' }}>
                                <Users className="h-3 w-3 inline mr-1" />
                                {cls._count.students} / {cls.capacity} students
                              </span>
                              <span
                                className="font-medium"
                                style={{
                                  color: isFull
                                    ? 'var(--admin-error)'
                                    : occupancy >= 80
                                      ? 'var(--admin-orange)'
                                      : 'var(--admin-success)',
                                }}
                              >
                                {occupancy}%
                              </span>
                            </div>
                            <Progress value={occupancy} className="h-1.5" />
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
