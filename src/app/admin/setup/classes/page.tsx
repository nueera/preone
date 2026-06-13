'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GraduationCap,
  Plus,
  Edit3,
  Users,
  BookOpen,
  UserCheck,
  Loader2,
  Baby,
  Palette,
  Sparkles,
  Star,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  capacity: number;
  enrolled: number;
  teacher: string;
  assistantTeacher: string;
  room: string;
  ageGroup: string;
}

interface Program {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  ageRange: string;
  classes: ClassInfo[];
}

const PROGRAMS: Program[] = [
  {
    id: '1',
    name: 'Playgroup',
    icon: <Baby className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    ageRange: '2–3 years',
    classes: [
      {
        id: 'c1',
        name: 'Playgroup A',
        section: 'A',
        capacity: 20,
        enrolled: 18,
        teacher: 'Priya Sharma',
        assistantTeacher: 'Ritu Mehta',
        room: 'PG-A01',
        ageGroup: '2–2.5 yrs',
      },
      {
        id: 'c2',
        name: 'Playgroup B',
        section: 'B',
        capacity: 20,
        enrolled: 15,
        teacher: 'Sneha Iyer',
        assistantTeacher: 'Neha Gupta',
        room: 'PG-B02',
        ageGroup: '2.5–3 yrs',
      },
    ],
  },
  {
    id: '2',
    name: 'Nursery',
    icon: <Palette className="h-5 w-5" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    ageRange: '3–4 years',
    classes: [
      {
        id: 'c3',
        name: 'Nursery A',
        section: 'A',
        capacity: 25,
        enrolled: 22,
        teacher: 'Anita Desai',
        assistantTeacher: 'Kavita Rao',
        room: 'NR-A01',
        ageGroup: '3–3.5 yrs',
      },
      {
        id: 'c4',
        name: 'Nursery B',
        section: 'B',
        capacity: 25,
        enrolled: 18,
        teacher: 'Meera Nair',
        assistantTeacher: 'Pooja Singh',
        room: 'NR-B02',
        ageGroup: '3.5–4 yrs',
      },
    ],
  },
  {
    id: '3',
    name: 'LKG',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    ageRange: '4–5 years',
    classes: [
      {
        id: 'c5',
        name: 'LKG A',
        section: 'A',
        capacity: 30,
        enrolled: 28,
        teacher: 'Meera Patel',
        assistantTeacher: 'Divya Joshi',
        room: 'LKG-A01',
        ageGroup: '4–4.5 yrs',
      },
      {
        id: 'c6',
        name: 'LKG B',
        section: 'B',
        capacity: 30,
        enrolled: 25,
        teacher: 'Aisha Khan',
        assistantTeacher: 'Sunita Kumari',
        room: 'LKG-B02',
        ageGroup: '4.5–5 yrs',
      },
    ],
  },
  {
    id: '4',
    name: 'UKG',
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ageRange: '5–6 years',
    classes: [
      {
        id: 'c7',
        name: 'UKG A',
        section: 'A',
        capacity: 30,
        enrolled: 26,
        teacher: 'Kavita Reddy',
        assistantTeacher: 'Renu Sharma',
        room: 'UKG-A01',
        ageGroup: '5–5.5 yrs',
      },
    ],
  },
];

export default function SetupClassesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    capacity: '',
    teacher: '',
    room: '',
  });

  const totalClasses = PROGRAMS.reduce((s, p) => s + p.classes.length, 0);
  const totalCapacity = PROGRAMS.reduce(
    (s, p) => s + p.classes.reduce((s2, c) => s2 + c.capacity, 0),
    0
  );
  const totalEnrolled = PROGRAMS.reduce(
    (s, p) => s + p.classes.reduce((s2, c) => s2 + c.enrolled, 0),
    0
  );

  const handleAddClass = async () => {
    if (!newClass.name.trim()) {
      toast.error('Class name is required');
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setDialogOpen(false);
    setNewClass({ name: '', capacity: '', teacher: '', room: '' });
    toast.success(`"${newClass.name}" class added successfully`);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-violet-600" />
              Class & Program Setup
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure programs, classes, sections, and student capacity
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
                <Plus className="h-4 w-4" /> Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Class Name</Label>
                  <Input
                    value={newClass.name}
                    onChange={(e) =>
                      setNewClass((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g., Nursery C"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={newClass.capacity}
                      onChange={(e) =>
                        setNewClass((p) => ({ ...p, capacity: e.target.value }))
                      }
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Room</Label>
                    <Input
                      value={newClass.room}
                      onChange={(e) =>
                        setNewClass((p) => ({ ...p, room: e.target.value }))
                      }
                      placeholder="NR-C03"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Class Teacher</Label>
                  <Input
                    value={newClass.teacher}
                    onChange={(e) =>
                      setNewClass((p) => ({ ...p, teacher: e.target.value }))
                    }
                    placeholder="Teacher name"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddClass}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Add Class
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Programs"
            value={PROGRAMS.length}
            icon={<BookOpen className="w-5 h-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Total Classes"
            value={totalClasses}
            icon={<GraduationCap className="w-5 h-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Total Capacity"
            value={totalCapacity}
            icon={<Users className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Enrolled"
            value={totalEnrolled}
            icon={<UserCheck className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* Programs */}
        {PROGRAMS.map((program) => (
          <PreOneCard key={program.id} variant="default">
            <div className="p-5">
              {/* Program Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center',
                      program.bgColor,
                      program.color
                    )}
                  >
                    {program.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {program.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Age group: {program.ageRange}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {program.classes.length} class
                  {program.classes.length !== 1 ? 'es' : ''}
                </Badge>
              </div>

              {/* Class Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {program.classes.map((cls) => {
                  const fillPercent = Math.round(
                    (cls.enrolled / cls.capacity) * 100
                  );
                  const isAlmostFull = fillPercent >= 90;

                  return (
                    <div
                      key={cls.id}
                      className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        {/* Class Header */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-gray-900">
                            {cls.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Teacher */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <UserCheck className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{cls.teacher}</span>
                        </div>

                        {/* Room & Age */}
                        <div className="flex items-center gap-3 text-xs">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {cls.room}
                          </Badge>
                          <span className="text-gray-400">{cls.ageGroup}</span>
                        </div>

                        {/* Enrollment Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {cls.enrolled}/{cls.capacity} students
                            </span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                isAlmostFull
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              )}
                            >
                              {fillPercent}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                isAlmostFull
                                  ? 'bg-amber-400'
                                  : 'bg-gradient-to-r from-violet-500 to-sky-400'
                              )}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Class Placeholder */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 hover:border-violet-300 hover:bg-violet-50/20 transition-all cursor-pointer min-h-[160px]">
                      <Plus className="h-5 w-5 text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">
                        Add Class
                      </p>
                    </div>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </PreOneCard>
        ))}
      </div>
    </PageTransition>
  );
}
