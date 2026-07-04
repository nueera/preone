'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Plus, Edit3, Users, BookOpen, UserCheck, School,
  Book, CheckCircle2, ChevronRight, MoreHorizontal, Eye, Trash2, X,
  AlertCircle, Info, Clock, CalendarDays, IndianRupee, MapPin, User,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProgramDef {
  id: string;
  name: string;
  ageGroup: string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
}

interface ClassDef {
  id: string;
  programId: string;
  name: string;
  section: string;
  teacher: string;
  capacity: number;
  enrolled: number;
  ageGroup: string;
  gender: 'Mixed' | 'Boys' | 'Girls';
  timing: string;
  days: string;
  status: 'active' | 'inactive';
}

const PROGRAMS: ProgramDef[] = [
  { id: '1', name: 'Playgroup', ageGroup: '2–3 years', icon: Book, accentVar: '--admin-warning', accentSoftVar: '--admin-warning-soft' },
  { id: '2', name: 'Nursery', ageGroup: '3–4 years', icon: GraduationCap, accentVar: '--admin-success', accentSoftVar: '--admin-success-soft' },
  { id: '3', name: 'LKG', ageGroup: '4–5 years', icon: School, accentVar: '--admin-info', accentSoftVar: '--admin-info-soft' },
  { id: '4', name: 'UKG', ageGroup: '5–6 years', icon: GraduationCap, accentVar: '--admin-primary', accentSoftVar: '--admin-primary-soft' },
];

const CLASSES: ClassDef[] = [
  { id: 'c1', programId: '1', name: 'Playgroup A', section: 'A', teacher: 'Priya Sharma', capacity: 20, enrolled: 18, ageGroup: '2–2.5 yrs', gender: 'Mixed', timing: '9:00 AM – 12:00 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c2', programId: '1', name: 'Playgroup B', section: 'B', teacher: 'Sneha Iyer', capacity: 20, enrolled: 15, ageGroup: '2.5–3 yrs', gender: 'Mixed', timing: '9:00 AM – 12:00 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c3', programId: '2', name: 'Nursery A', section: 'A', teacher: 'Anita Desai', capacity: 25, enrolled: 22, ageGroup: '3–3.5 yrs', gender: 'Mixed', timing: '8:30 AM – 12:30 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c4', programId: '2', name: 'Nursery B', section: 'B', teacher: 'Meera Nair', capacity: 25, enrolled: 18, ageGroup: '3.5–4 yrs', gender: 'Mixed', timing: '8:30 AM – 12:30 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c5', programId: '2', name: 'Nursery C', section: 'C', teacher: 'Ritu Mehta', capacity: 25, enrolled: 25, ageGroup: '3–4 yrs', gender: 'Mixed', timing: '8:30 AM – 12:30 PM', days: 'Mon–Sat', status: 'inactive' },
  { id: 'c6', programId: '3', name: 'LKG A', section: 'A', teacher: 'Meera Patel', capacity: 30, enrolled: 28, ageGroup: '4–4.5 yrs', gender: 'Mixed', timing: '8:00 AM – 1:00 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c7', programId: '3', name: 'LKG B', section: 'B', teacher: 'Aisha Khan', capacity: 30, enrolled: 25, ageGroup: '4.5–5 yrs', gender: 'Mixed', timing: '8:00 AM – 1:00 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c8', programId: '4', name: 'UKG A', section: 'A', teacher: 'Kavita Reddy', capacity: 30, enrolled: 26, ageGroup: '5–5.5 yrs', gender: 'Mixed', timing: '8:00 AM – 2:00 PM', days: 'Mon–Fri', status: 'active' },
  { id: 'c9', programId: '4', name: 'UKG B', section: 'B', teacher: 'Sunita Kumari', capacity: 30, enrolled: 30, ageGroup: '5.5–6 yrs', gender: 'Mixed', timing: '8:00 AM – 2:00 PM', days: 'Mon–Sat', status: 'active' },
];

const ITEMS_PER_PAGE = 9;

function StatCard({ icon: Icon, iconBg, iconColor, value, label }: { icon: React.ElementType; iconBg: string; iconColor: string; value: string; label: string }) {
  return (
    <PreOneCard variant="default" hover className="p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>{value}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{label}</div>
        </div>
      </div>
    </PreOneCard>
  );
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: 'var(--admin-success-soft)', color: 'var(--admin-success)' }}>
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
      Inactive
    </span>
  );
}

function ProgramItem({ program, isSelected, classCount, onClick }: { program: ProgramDef; isSelected: boolean; classCount: number; onClick: () => void }) {
  const IconComp = program.icon;
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-200 text-left"
      style={{
        backgroundColor: isSelected ? `var(${program.accentSoftVar})` : 'var(--admin-surface)',
        border: isSelected ? `1px solid var(${program.accentVar})` : '1px solid var(--admin-border)',
      }}
    >
      <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: `var(${program.accentSoftVar})` }}>
        <IconComp className="h-5 w-5" style={{ color: `var(${program.accentVar})` }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{program.name}</div>
        <div className="text-[12px]" style={{ color: 'var(--admin-text-muted)' }}>{program.ageGroup}</div>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: isSelected ? `var(${program.accentVar})` : 'var(--admin-surface-2)',
          color: isSelected ? '#FFFFFF' : 'var(--admin-text-muted)',
        }}
      >
        {classCount}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: isSelected ? `var(${program.accentVar})` : 'var(--admin-text-subtle)' }} />
    </button>
  );
}

function ClassCard({ cls, isSelected, programAccent, onSelect }: { cls: ClassDef; isSelected: boolean; programAccent: { accentVar: string; accentSoftVar: string }; onSelect: () => void }) {
  const fillPercent = Math.min(Math.round((cls.enrolled / cls.capacity) * 100), 100);
  const isAtCapacity = cls.enrolled >= cls.capacity;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className="flex flex-col rounded-xl p-4 min-h-[240px] cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: 'var(--admin-surface)',
        border: isSelected ? `2px solid var(${programAccent.accentVar})` : '1px solid var(--admin-border)',
        boxShadow: isSelected ? `0 0 0 3px var(${programAccent.accentSoftVar}), var(--admin-shadow-card)` : 'var(--admin-shadow-card)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `var(${programAccent.accentSoftVar})` }}>
          <School className="h-4 w-4" style={{ color: `var(${programAccent.accentVar})` }} />
        </div>
        <StatusBadge status={cls.status} />
        <button onClick={(e) => { e.stopPropagation(); toast.info('More options coming soon'); }} className="h-6 w-6 rounded-md flex items-center justify-center" style={{ color: 'var(--admin-text-subtle)' }} aria-label="More options">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-[15px] font-semibold mb-3" style={{ color: 'var(--admin-text)' }}>{cls.name}</div>
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-[12px]">
          <span style={{ color: 'var(--admin-text-muted)' }}>Section</span>
          <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>{cls.section}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span style={{ color: 'var(--admin-text-muted)' }}>Teacher</span>
          <span className="font-semibold truncate ml-2" style={{ color: 'var(--admin-text)' }}>{cls.teacher}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span style={{ color: 'var(--admin-text-muted)' }}>Capacity</span>
          <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>{cls.enrolled}/{cls.capacity}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--admin-surface-2)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${fillPercent}%`, backgroundColor: isAtCapacity ? 'var(--admin-error)' : `var(${programAccent.accentVar})` }} />
      </div>
      <div className="flex gap-2 mt-auto">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-7" style={{ color: `var(${programAccent.accentVar})`, borderColor: 'var(--admin-border)' }} onClick={(e) => { e.stopPropagation(); toast.info(`View ${cls.name} details`); }}>
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-7" style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }} onClick={(e) => { e.stopPropagation(); toast.info(`Edit ${cls.name}`); }}>
          <Edit3 className="h-3 w-3 mr-1" /> Edit
        </Button>
      </div>
    </div>
  );
}

function AddClassCard({ programName, onClick }: { programName: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl p-4 min-h-[240px] transition-all duration-200 border-2 border-dashed"
      style={{ backgroundColor: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
      aria-label={`Add new class to ${programName}`}
    >
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--admin-surface-2)' }}>
        <Plus className="h-6 w-6" style={{ color: 'var(--admin-text-muted)' }} />
      </div>
      <div className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>Add New Class</div>
      <div className="text-[12px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>Create a new class in this program</div>
    </button>
  );
}

function ClassDetailsSidebar({ cls, programAccent, onClose }: { cls: ClassDef; programAccent: { accentVar: string; accentSoftVar: string }; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `var(${programAccent.accentSoftVar})` }}>
            <School className="h-6 w-6" style={{ color: `var(${programAccent.accentVar})` }} />
          </div>
          <div>
            <div className="text-[17px] font-bold" style={{ color: 'var(--admin-text)' }}>{cls.name}</div>
            <div className="mt-0.5"><StatusBadge status={cls.status} /></div>
          </div>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--admin-text-muted)' }} aria-label="Close details">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      <div className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--admin-text-subtle)' }}>Overview</div>
      {[
        { icon: User, label: 'Teacher', value: cls.teacher },
        { icon: BookOpen, label: 'Section', value: cls.section },
        { icon: Users, label: 'Age Group', value: cls.ageGroup },
        { icon: Users, label: 'Capacity', value: `${cls.capacity} Students` },
        { icon: UserCheck, label: 'Enrolled Students', value: `${cls.enrolled} Students` },
        { icon: MapPin, label: 'Gender', value: cls.gender },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: 'var(--admin-text-subtle)' }} />
            <span className="text-[13px]" style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
          </div>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--admin-text)' }}>{value}</span>
        </div>
      ))}

      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      <div className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--admin-text-subtle)' }}>More Details</div>
      {[
        { icon: Clock, label: 'Class Timing', value: cls.timing },
        { icon: CalendarDays, label: 'Days', value: cls.days },
        { icon: CheckCircle2, label: 'Attendance', value: `${cls.enrolled} / ${cls.capacity}`, highlight: true },
        { icon: IndianRupee, label: 'Fees Collection', value: `${cls.enrolled} / ${cls.capacity} Paid`, highlight: true },
      ].map(({ icon: Icon, label, value, highlight }) => (
        <div key={label} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: 'var(--admin-text-subtle)' }} />
            <span className="text-[13px]" style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
          </div>
          <span className="text-[13px] font-semibold" style={{ color: highlight ? 'var(--admin-success)' : 'var(--admin-text)' }}>{value}</span>
        </div>
      ))}

      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 text-[13px]" style={{ borderColor: `var(${programAccent.accentVar})`, color: `var(${programAccent.accentVar})` }} onClick={() => toast.info(`Edit ${cls.name}`)}>
          <Edit3 className="h-4 w-4 mr-1" /> Edit Class
        </Button>
        <Button className="flex-1 text-[13px]" style={{ backgroundColor: 'var(--admin-error)', color: '#FFFFFF' }} onClick={() => toast.error(`Delete ${cls.name}? (Not implemented)`, { action: { label: 'Undo', onClick: () => {} } })}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}

export default function SetupClassesPage() {
  const [selectedProgramId, setSelectedProgramId] = useState('2');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedProgram = useMemo(() => PROGRAMS.find((p) => p.id === selectedProgramId) ?? PROGRAMS[0], [selectedProgramId]);

  const programClasses = useMemo(() => CLASSES.filter((c) => c.programId === selectedProgramId), [selectedProgramId]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return programClasses;
    const q = searchQuery.toLowerCase();
    return programClasses.filter((c) => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q));
  }, [programClasses, searchQuery]);

  const selectedClass = useMemo(() => (selectedClassId ? CLASSES.find((c) => c.id === selectedClassId) ?? null : null), [selectedClassId]);

  const programAccent = useMemo(() => ({ accentVar: selectedProgram.accentVar, accentSoftVar: selectedProgram.accentSoftVar }), [selectedProgram]);

  const totalPrograms = PROGRAMS.length;
  const totalClasses = CLASSES.length;
  const totalCapacity = CLASSES.reduce((sum, c) => sum + c.capacity, 0);
  const totalEnrolled = CLASSES.reduce((sum, c) => sum + c.enrolled, 0);

  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
    setSelectedClassId(null);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-[1440px] mx-auto" style={{ backgroundColor: 'var(--admin-bg)' }}>
        {/* ── Section 1: Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--admin-primary-soft)' }}>
              <GraduationCap className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>Class &amp; Program Setup</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Manage programs, classes, sections and student capacity.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => toast.info('Create Program dialog coming soon')}
              style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-primary-foreground)' }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Program
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Create Class dialog coming soon')}
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Class
            </Button>
          </div>
        </div>

        {/* ── Section 2: Statistics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Book} iconBg="var(--admin-primary-soft)" iconColor="var(--admin-primary)" value={String(totalPrograms)} label="Total Programs" />
          <StatCard icon={School} iconBg="var(--admin-info-soft)" iconColor="var(--admin-info)" value={String(totalClasses)} label="Total Classes" />
          <StatCard icon={Users} iconBg="var(--admin-warning-soft)" iconColor="var(--admin-warning)" value={String(totalCapacity)} label="Total Capacity" />
          <StatCard icon={UserCheck} iconBg="var(--admin-success-soft)" iconColor="var(--admin-success)" value={String(totalEnrolled)} label="Enrolled Students" />
        </div>

        {/* ── Section 3: Search / Filter Bar ── */}
        <PreOneCard variant="default" className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--admin-text-subtle)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search classes or teachers..."
                className="h-10 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors"
                style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-surface-2)', color: 'var(--admin-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--admin-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--admin-primary-soft)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </PreOneCard>

        {/* ── Section 4: Programs + Classes ── */}
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Left: Programs Sidebar */}
          <div className="xl:w-[220px] shrink-0">
            <PreOneCard variant="default" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>Programs</h3>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--admin-primary-soft)]"
                  style={{ color: 'var(--admin-primary)' }}
                  onClick={() => toast.info('Add Program dialog coming soon')}
                  aria-label="Add new program"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {PROGRAMS.map((program) => (
                  <ProgramItem
                    key={program.id}
                    program={program}
                    isSelected={selectedProgramId === program.id}
                    classCount={CLASSES.filter((c) => c.programId === program.id).length}
                    onClick={() => handleSelectProgram(program.id)}
                  />
                ))}
              </div>
              <div className="rounded-xl p-3 mt-4 flex items-start gap-2" style={{ backgroundColor: 'var(--admin-info-soft)' }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--admin-info)' }} />
                <span className="text-[12px]" style={{ color: 'var(--admin-info)' }}>You can create custom programs as per your school requirements.</span>
              </div>
            </PreOneCard>
          </div>

          {/* Center: Classes Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[17px] font-semibold" style={{ color: 'var(--admin-text)' }}>{selectedProgram.name} Program</h2>
                <p className="text-[13px]" style={{ color: 'var(--admin-text-muted)' }}>Age group: {selectedProgram.ageGroup}</p>
              </div>
              <Button variant="outline" size="sm" className="text-[13px] gap-1.5" style={{ borderColor: 'var(--admin-border)', color: `var(${programAccent.accentVar})` }} onClick={() => toast.info(`Edit ${selectedProgram.name} program`)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit Program
              </Button>
            </div>

            {filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} isSelected={selectedClassId === cls.id} programAccent={programAccent} onSelect={() => setSelectedClassId(cls.id)} />
                ))}
                <AddClassCard programName={selectedProgram.name} onClick={() => toast.info(`Add class to ${selectedProgram.name} — dialog coming soon`)} />
              </div>
            ) : (
              <PreOneCard variant="default" className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--admin-text-muted)', opacity: 0.4 }} />
                  <div className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>No classes found</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>Try adjusting your search or add a new class to this program.</div>
                </div>
              </PreOneCard>
            )}

            <div className="flex items-center gap-3 rounded-xl p-4 mt-4" style={{ backgroundColor: 'var(--admin-info-soft)' }}>
              <Info className="h-5 w-5 shrink-0" style={{ color: 'var(--admin-info)' }} />
              <span className="text-[13px]" style={{ color: 'var(--admin-info)' }}>Classes help you divide students within a program for better management.</span>
            </div>
          </div>

          {/* Right: Class Details */}
          <div className="xl:w-[320px] shrink-0">
            <PreOneCard variant="default" className="p-4 xl:sticky xl:top-4">
              {selectedClass ? (
                <ClassDetailsSidebar cls={selectedClass} programAccent={programAccent} onClose={() => setSelectedClassId(null)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--admin-primary-soft)' }}>
                    <School className="h-8 w-8" style={{ color: 'var(--admin-primary)', opacity: 0.5 }} />
                  </div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>Select a Class</div>
                  <div className="text-[13px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>Click on any class card to view its details here.</div>
                </div>
              )}
            </PreOneCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
