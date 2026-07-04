'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Plus,
  Edit3,
  Users,
  BookOpen,
  UserCheck,
  School,
  Book,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Trash2,
  X,
  AlertCircle,
  Info,
  Clock,
  CalendarDays,
  IndianRupee,
  MapPin,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────────
// DATA MODEL
// ────────────────────────────────────────────────────────────────

interface ProgramDef {
  id: string;
  name: string;
  ageGroup: string;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
  imageSrc: string;
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

// ────────────────────────────────────────────────────────────────
// MOCK DATA
// ────────────────────────────────────────────────────────────────

const PROGRAMS: ProgramDef[] = [
  { id: '1', name: 'Playgroup', ageGroup: '2–3 years', icon: Book, accentVar: '--admin-warning', accentSoftVar: '--admin-warning-soft', imageSrc: '/icons/admin/setup/group-playgroup.webp' },
  { id: '2', name: 'Nursery', ageGroup: '3–4 years', icon: GraduationCap, accentVar: '--admin-success', accentSoftVar: '--admin-success-soft', imageSrc: '/icons/admin/setup/group-nursery.webp' },
  { id: '3', name: 'LKG', ageGroup: '4–5 years', icon: School, accentVar: '--admin-info', accentSoftVar: '--admin-info-soft', imageSrc: '/icons/admin/setup/group-lkg.webp' },
  { id: '4', name: 'UKG', ageGroup: '5–6 years', icon: GraduationCap, accentVar: '--admin-primary', accentSoftVar: '--admin-primary-soft', imageSrc: '/icons/admin/setup/group-ukg.webp' },
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

// ────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

/** DashboardStatCard — Statistics card with icon, value, footer, and accent stripe */
function DashboardStatCard({
  icon: Icon,
  label,
  value,
  footer,
  accentVar,
  accentSoftVar,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  footer: string;
  accentVar: string;
  accentSoftVar: string;
}) {
  return (
    <PreOneCard variant="default" hover className="relative overflow-hidden p-4">
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
        style={{ backgroundColor: `var(${accentVar})` }}
      />

      {/* Icon (top-right) */}
      <div className="flex items-start justify-between mb-3">
        <div />
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: `var(${accentSoftVar})` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(${accentVar})` }} />
        </div>
      </div>

      {/* Value */}
      <div className="text-[28px] font-bold leading-tight" style={{ color: 'var(--admin-text)' }}>
        {value}
      </div>

      {/* Label */}
      <div className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
        {label}
      </div>

      {/* Footer with checkmark */}
      <div className="flex items-center gap-1 mt-2">
        <CheckCircle2 className="h-3 w-3" style={{ color: `var(${accentVar})` }} />
        <span className="text-[11px] font-semibold" style={{ color: `var(${accentVar})` }}>
          {footer}
        </span>
      </div>

      {/* Decorative circle (bottom-right, 5% opacity) */}
      <div
        className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.05 }}
      />
    </PreOneCard>
  );
}

/** StatusBadge — Active/Inactive pill badge */
function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  if (status === 'active') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: 'var(--admin-success-soft)', color: 'var(--admin-success)' }}
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}
    >
      Inactive
    </span>
  );
}

/** ProgramItem — Selectable program row in sidebar */
function ProgramItem({
  program,
  isSelected,
  classCount,
  onClick,
}: {
  program: ProgramDef;
  isSelected: boolean;
  classCount: number;
  onClick: () => void;
}) {
  const IconComp = program.icon;

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-200 text-left"
      style={{
        backgroundColor: isSelected ? `var(${program.accentSoftVar})` : 'transparent',
        border: isSelected ? `1px solid var(${program.accentVar})` : '1px solid transparent',
        transform: 'var(--tw-translate-y)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = `var(${program.accentSoftVar})`;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Illustration or fallback icon */}
      <div
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: `var(${program.accentSoftVar})` }}
      >
        <IconComp className="h-5 w-5" style={{ color: `var(${program.accentVar})` }} />
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--admin-text)' }}>
          {program.name}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--admin-text-muted)' }}>
          {program.ageGroup}
        </div>
      </div>

      {/* Class count badge */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: isSelected ? `var(${program.accentVar})` : 'var(--admin-surface-2)',
          color: isSelected ? 'var(--admin-primary-foreground, #FFFFFF)' : 'var(--admin-text-muted)',
        }}
      >
        {classCount}
      </span>

      {/* Chevron */}
      <ChevronRight
        className="h-4 w-4 shrink-0"
        style={{ color: isSelected ? `var(${program.accentVar})` : 'var(--admin-text-subtle)' }}
      />
    </button>
  );
}

/** ClassCard — Class card in center grid */
function ClassCard({
  cls,
  isSelected,
  programAccent,
  onSelect,
}: {
  cls: ClassDef;
  isSelected: boolean;
  programAccent: { accentVar: string; accentSoftVar: string };
  onSelect: () => void;
}) {
  const fillPercent = Math.min(Math.round((cls.enrolled / cls.capacity) * 100), 100);
  const isAtCapacity = cls.enrolled >= cls.capacity;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="flex flex-col rounded-xl p-4 min-h-[240px] cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: 'var(--admin-surface)',
        border: isSelected ? `2px solid var(${programAccent.accentVar})` : '1px solid var(--admin-border)',
        boxShadow: isSelected
          ? `0 0 0 3px var(${programAccent.accentSoftVar}), var(--admin-shadow-card)`
          : 'var(--admin-shadow-card)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: Icon + Status + More */}
      <div className="flex items-center justify-between mb-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `var(${programAccent.accentSoftVar})` }}
        >
          <School className="h-4 w-4" style={{ color: `var(${programAccent.accentVar})` }} />
        </div>
        <StatusBadge status={cls.status} />
        <button
          onClick={(e) => { e.stopPropagation(); toast.info('More options coming soon'); }}
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--admin-surface-2)]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" style={{ color: 'var(--admin-text-subtle)' }} />
        </button>
      </div>

      {/* Title */}
      <div className="text-[15px] font-semibold mb-3" style={{ color: 'var(--admin-text)' }}>
        {cls.name}
      </div>

      {/* Details grid */}
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

      {/* Capacity bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--admin-surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: isAtCapacity ? 'var(--admin-error)' : `var(${programAccent.accentVar})`,
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-[11px] h-7"
          style={{ color: `var(${programAccent.accentVar})`, borderColor: 'var(--admin-border)' }}
          onClick={(e) => { e.stopPropagation(); toast.info(`View ${cls.name} details`); }}
        >
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-[11px] h-7"
          style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }}
          onClick={(e) => { e.stopPropagation(); toast.info(`Edit ${cls.name}`); }}
        >
          <Edit3 className="h-3 w-3 mr-1" /> Edit
        </Button>
      </div>
    </div>
  );
}

/** AddClassCard — Dashed "add" card placeholder */
function AddClassCard({ programName, onClick }: { programName: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl p-4 min-h-[240px] transition-all duration-200 border-2 border-dashed group"
      style={{
        backgroundColor: 'var(--admin-surface)',
        borderColor: 'var(--admin-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--admin-primary)';
        e.currentTarget.style.backgroundColor = 'var(--admin-primary-soft)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--admin-border)';
        e.currentTarget.style.backgroundColor = 'var(--admin-surface)';
      }}
      aria-label={`Add new class to ${programName}`}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200"
        style={{ backgroundColor: 'var(--admin-surface-2)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--admin-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
        }}
      >
        <Plus
          className="h-6 w-6 transition-colors duration-200"
          style={{ color: 'var(--admin-text-muted)' }}
        />
      </div>
      <div className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>
        Add New Class
      </div>
      <div className="text-[12px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>
        Create a new class in this program
      </div>
    </button>
  );
}

/** InfoBanner — Information alert banner */
function InfoBanner({ text }: { text: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-4 mt-4"
      style={{
        backgroundColor: 'var(--admin-info-soft)',
        border: '1px solid color-mix(in srgb, var(--admin-info) 20%, transparent)',
      }}
    >
      <Info className="h-5 w-5 shrink-0" style={{ color: 'var(--admin-info)' }} />
      <span className="text-[13px]" style={{ color: 'var(--admin-info)' }}>{text}</span>
    </div>
  );
}

/** DetailRow — Reusable row for the details sidebar */
function DetailRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: 'var(--admin-text-subtle)' }} />
        <span className="text-[13px]" style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
      </div>
      <span
        className="text-[13px] font-semibold"
        style={{ color: highlight ? 'var(--admin-success)' : 'var(--admin-text)' }}
      >
        {value}
      </span>
    </div>
  );
}

/** ClassDetailsSidebar — Right panel showing class details */
function ClassDetailsSidebar({
  cls,
  programAccent,
  onClose,
}: {
  cls: ClassDef;
  programAccent: { accentVar: string; accentSoftVar: string };
  onClose: () => void;
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `var(${programAccent.accentSoftVar})` }}
          >
            <School className="h-6 w-6" style={{ color: `var(${programAccent.accentVar})` }} />
          </div>
          <div>
            <div className="text-[17px] font-bold" style={{ color: 'var(--admin-text)' }}>
              {cls.name}
            </div>
            <div className="mt-0.5">
              <StatusBadge status={cls.status} />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--admin-surface-2)] transition-colors"
          aria-label="Close details"
        >
          <X className="h-4 w-4" style={{ color: 'var(--admin-text-muted)' }} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      {/* Overview Section */}
      <div className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--admin-text-subtle)' }}>
        Overview
      </div>
      <DetailRow icon={User} label="Teacher" value={cls.teacher} />
      <DetailRow icon={BookOpen} label="Section" value={cls.section} />
      <DetailRow icon={Users} label="Age Group" value={cls.ageGroup} />
      <DetailRow icon={Users} label="Capacity" value={`${cls.capacity} Students`} />
      <DetailRow icon={UserCheck} label="Enrolled Students" value={`${cls.enrolled} Students`} />
      <DetailRow icon={MapPin} label="Gender" value={cls.gender} />

      {/* Divider */}
      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      {/* More Details Section */}
      <div className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--admin-text-subtle)' }}>
        More Details
      </div>
      <DetailRow icon={Clock} label="Class Timing" value={cls.timing} />
      <DetailRow icon={CalendarDays} label="Days" value={cls.days} />
      <DetailRow
        icon={CheckCircle2}
        label="Attendance"
        value={`${cls.enrolled} / ${cls.capacity}`}
        highlight
      />
      <DetailRow
        icon={IndianRupee}
        label="Fees Collection"
        value={`${cls.enrolled} / ${cls.capacity} Paid`}
        highlight
      />

      {/* Divider */}
      <div className="h-px my-3" style={{ backgroundColor: 'var(--admin-border)' }} />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 text-[13px]"
          style={{ borderColor: `var(${programAccent.accentVar})`, color: `var(${programAccent.accentVar})` }}
          onClick={() => toast.info(`Edit ${cls.name}`)}
        >
          <Edit3 className="h-4 w-4 mr-1" /> Edit Class
        </Button>
        <Button
          variant="destructive"
          className="flex-1 text-[13px]"
          style={{ backgroundColor: 'var(--admin-error)' }}
          onClick={() => toast.error(`Delete ${cls.name}? (Not implemented)`, { action: { label: 'Undo', onClick: () => {} } })}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ────────────────────────────────────────────────────────────────

export default function SetupClassesPage() {
  const [selectedProgramId, setSelectedProgramId] = useState('2'); // Default: Nursery
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Derived data
  const selectedProgram = useMemo(
    () => PROGRAMS.find((p) => p.id === selectedProgramId) ?? PROGRAMS[0],
    [selectedProgramId]
  );
  const programClasses = useMemo(
    () => CLASSES.filter((c) => c.programId === selectedProgramId),
    [selectedProgramId]
  );
  const selectedClass = useMemo(
    () => (selectedClassId ? CLASSES.find((c) => c.id === selectedClassId) ?? null : null),
    [selectedClassId]
  );
  const programAccent = useMemo(
    () => ({ accentVar: selectedProgram.accentVar, accentSoftVar: selectedProgram.accentSoftVar }),
    [selectedProgram]
  );

  // Statistics
  const totalPrograms = PROGRAMS.length;
  const totalClasses = CLASSES.length;
  const totalCapacity = CLASSES.reduce((sum, c) => sum + c.capacity, 0);
  const totalEnrolled = CLASSES.reduce((sum, c) => sum + c.enrolled, 0);

  // Handlers
  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
    setSelectedClassId(null);
  };

  const handleSelectClass = (id: string) => {
    setSelectedClassId(id);
  };

  const handleCloseDetails = () => {
    setSelectedClassId(null);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--admin-primary-soft)' }}
            >
              <GraduationCap className="h-7 w-7" style={{ color: 'var(--admin-primary)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
                Class &amp; Program Setup
              </h1>
              <p className="text-[14px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                Manage programs, classes, sections and student capacity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Hero illustration */}
            <div className="hidden lg:block h-[72px] w-[112px] relative">
              <Image
                src="/icons/admin/setup/classes-hero.webp"
                alt="Classes setup illustration"
                width={112}
                height={72}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:12px;background-color:var(--admin-primary-soft);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--admin-primary)" stroke-width="1.5" opacity="0.4"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`;
                  }
                }}
              />
            </div>
            <Button
              className="rounded-lg text-[13px] gap-1.5"
              style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-primary-foreground, #FFFFFF)' }}
              onClick={() => toast.info('Create Program dialog coming soon')}
            >
              <Plus className="h-4 w-4" /> New Program
            </Button>
            <Button
              className="rounded-lg text-[13px] gap-1.5"
              style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-primary-foreground, #FFFFFF)' }}
              onClick={() => toast.info('Create Class dialog coming soon')}
            >
              <Plus className="h-4 w-4" /> New Class
            </Button>
          </div>
        </div>

        {/* ── Statistics Cards Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            icon={Book}
            label="Total Programs"
            value={totalPrograms}
            footer="Active"
            accentVar="--admin-primary"
            accentSoftVar="--admin-primary-soft"
          />
          <DashboardStatCard
            icon={School}
            label="Total Classes"
            value={totalClasses}
            footer="Active"
            accentVar="--admin-info"
            accentSoftVar="--admin-info-soft"
          />
          <DashboardStatCard
            icon={Users}
            label="Total Capacity"
            value={totalCapacity}
            footer="Students"
            accentVar="--admin-warning"
            accentSoftVar="--admin-warning-soft"
          />
          <DashboardStatCard
            icon={UserCheck}
            label="Enrolled Students"
            value={totalEnrolled}
            footer="Students"
            accentVar="--admin-success"
            accentSoftVar="--admin-success-soft"
          />
        </div>

        {/* ── 3-Panel Dashboard ── */}
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Left Panel — Programs Sidebar (24%) */}
          <div className="xl:w-[24%] xl:min-w-[220px]">
            <PreOneCard variant="default" className="p-4">
              {/* Programs Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                  Programs
                </h3>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--admin-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-primary-soft)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => toast.info('Add Program dialog coming soon')}
                  aria-label="Add new program"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Program List */}
              <div className="space-y-1.5">
                {PROGRAMS.map((program) => {
                  const classCount = CLASSES.filter((c) => c.programId === program.id).length;
                  return (
                    <ProgramItem
                      key={program.id}
                      program={program}
                      isSelected={selectedProgramId === program.id}
                      classCount={classCount}
                      onClick={() => handleSelectProgram(program.id)}
                    />
                  );
                })}
              </div>

              {/* Helper Card */}
              <div
                className="rounded-xl p-3 mt-4 flex items-start gap-2"
                style={{
                  backgroundColor: 'var(--admin-info-soft)',
                  border: '1px solid color-mix(in srgb, var(--admin-info) 20%, transparent)',
                }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--admin-info)' }} />
                <span className="text-[12px]" style={{ color: 'var(--admin-info)' }}>
                  You can create custom programs as per your school requirements.
                </span>
              </div>
            </PreOneCard>
          </div>

          {/* Center Panel — Class Grid (48%) */}
          <div className="xl:w-[48%]">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[17px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                  {selectedProgram.name} Program
                </h2>
                <p className="text-[13px]" style={{ color: 'var(--admin-text-muted)' }}>
                  Age group: {selectedProgram.ageGroup}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[13px] gap-1.5"
                style={{ borderColor: 'var(--admin-border)', color: `var(${programAccent.accentVar})` }}
                onClick={() => toast.info(`Edit ${selectedProgram.name} program`)}
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Program
              </Button>
            </div>

            {/* Class Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isSelected={selectedClassId === cls.id}
                  programAccent={programAccent}
                  onSelect={() => handleSelectClass(cls.id)}
                />
              ))}

              {/* Add Class Card */}
              <AddClassCard
                programName={selectedProgram.name}
                onClick={() => toast.info(`Add class to ${selectedProgram.name} — dialog coming soon`)}
              />
            </div>

            {/* Info Banner */}
            <InfoBanner text="Classes help you divide students within a program for better management." />
          </div>

          {/* Right Panel — Class Details Sidebar (28%) */}
          <div className="xl:w-[28%] xl:min-w-[280px]">
            <PreOneCard variant="default" className="p-4 xl:sticky xl:top-4">
              {selectedClass ? (
                <ClassDetailsSidebar
                  cls={selectedClass}
                  programAccent={programAccent}
                  onClose={handleCloseDetails}
                />
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--admin-primary-soft)' }}
                  >
                    <School className="h-8 w-8" style={{ color: 'var(--admin-primary)', opacity: 0.5 }} />
                  </div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--admin-text)' }}>
                    Select a Class
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                    Click on any class card to view its details here.
                  </div>
                </div>
              )}
            </PreOneCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
