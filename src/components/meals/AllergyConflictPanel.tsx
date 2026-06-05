'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { AllergyConflict, AllergenType, DayOfWeek } from './types';
import { DAY_LABELS, DAY_SHORT_LABELS, MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from './types';
import { AllergyBadge } from './AllergyBadge';
import { AllergenTag } from './AllergenTag';

interface AllergyConflictPanelProps {
  conflicts: AllergyConflict[];
  onSelectStudent?: (studentId: string) => void;
  className?: string;
}

type GroupMode = 'day' | 'student';

export function AllergyConflictPanel({
  conflicts,
  onSelectStudent,
  className,
}: AllergyConflictPanelProps) {
  const [groupMode, setGroupMode] = useState<GroupMode>('day');
  const [collapsedDays, setCollapsedDays] = useState<Set<DayOfWeek>>(new Set());
  const [collapsedStudents, setCollapsedStudents] = useState<Set<string>>(
    new Set()
  );

  // Summary stats
  const uniqueStudents = useMemo(
    () => new Set(conflicts.map((c) => c.student.id)).size,
    [conflicts]
  );
  const directConflicts = useMemo(
    () => conflicts.filter((c) => !c.isMayContain).length,
    [conflicts]
  );
  const mayContainConflicts = useMemo(
    () => conflicts.filter((c) => c.isMayContain).length,
    [conflicts]
  );

  // Group by day
  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, AllergyConflict[]>();
    for (const c of conflicts) {
      const existing = map.get(c.dayOfWeek) ?? [];
      existing.push(c);
      map.set(c.dayOfWeek, existing);
    }
    return map;
  }, [conflicts]);

  // Group by student
  const byStudent = useMemo(() => {
    const map = new Map<string, AllergyConflict[]>();
    for (const c of conflicts) {
      const existing = map.get(c.student.id) ?? [];
      existing.push(c);
      map.set(c.student.id, existing);
    }
    return map;
  }, [conflicts]);

  const toggleDay = (day: DayOfWeek) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleStudent = (studentId: string) => {
    setCollapsedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // Get the worst severity in a list of conflicts
  function worstSeverity(conflicts: AllergyConflict[]) {
    const order = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'] as const;
    let worst: number = -1;
    for (const c of conflicts) {
      const idx = order.indexOf(c.severity);
      if (idx > worst) worst = idx;
    }
    return order[worst] ?? 'MILD';
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary header */}
      <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h3 className="text-sm font-semibold text-white">
            Allergy Conflict Summary
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-white/40" />
            <span className="text-sm text-white/70">
              <span className="font-semibold text-white">
                {uniqueStudents}
              </span>{' '}
              student{uniqueStudents !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-white/70">
              <span className="font-semibold text-red-400">
                {directConflicts}
              </span>{' '}
              direct conflict{directConflicts !== 1 ? 's' : ''}
            </span>
          </div>
          {mayContainConflicts > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-white/70">
                <span className="font-semibold text-amber-400">
                  {mayContainConflicts}
                </span>{' '}
                may-contain
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Group mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Group by:</span>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setGroupMode('day')}
            className={cn(
              'px-3 py-1 text-xs font-medium transition-colors',
              groupMode === 'day'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Day
          </button>
          <button
            onClick={() => setGroupMode('student')}
            className={cn(
              'px-3 py-1 text-xs font-medium transition-colors',
              groupMode === 'student'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Student
          </button>
        </div>
      </div>

      {/* Grouped content */}
      <div className="space-y-2">
        {groupMode === 'day'
          ? Array.from(byDay.entries()).map(([day, dayConflicts]) => {
              const isCollapsed = collapsedDays.has(day);
              return (
                <DaySection
                  key={day}
                  day={day}
                  conflicts={dayConflicts}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleDay(day)}
                  worstSeverity={worstSeverity(dayConflicts)}
                  onSelectStudent={onSelectStudent}
                />
              );
            })
          : Array.from(byStudent.entries()).map(
              ([studentId, studentConflicts]) => {
                const isCollapsed = collapsedStudents.has(studentId);
                const student = studentConflicts[0].student;
                return (
                  <StudentSection
                    key={studentId}
                    student={student}
                    conflicts={studentConflicts}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleStudent(studentId)}
                    worstSeverity={worstSeverity(studentConflicts)}
                    onSelectStudent={onSelectStudent}
                  />
                );
              }
            )}
      </div>

      {/* Empty state */}
      {conflicts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-white/30">
          <ShieldAlert className="h-8 w-8 mb-2" />
          <p className="text-sm">No allergy conflicts this week</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Day section (group by day)
// ============================================================

interface DaySectionProps {
  day: DayOfWeek;
  conflicts: AllergyConflict[];
  isCollapsed: boolean;
  onToggle: () => void;
  worstSeverity: string;
  onSelectStudent?: (studentId: string) => void;
}

function DaySection({
  day,
  conflicts,
  isCollapsed,
  onToggle,
  worstSeverity,
  onSelectStudent,
}: DaySectionProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121234]/60 overflow-hidden">
      {/* Day header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
        <span className="text-sm font-semibold text-white">
          {DAY_LABELS[day]}
        </span>
        <span className="text-xs text-white/40">
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
        </span>
        <div className="ml-auto">
          <AllergyBadge
            severity={worstSeverity as AllergyConflict['severity']}
            size="sm"
          />
        </div>
      </button>

      {/* Conflict list */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-3 py-2 space-y-2">
              {conflicts.map((c, idx) => (
                <ConflictRow
                  key={`${c.student.id}-${c.mealType}-${idx}`}
                  conflict={c}
                  onSelectStudent={onSelectStudent}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Student section (group by student)
// ============================================================

interface StudentSectionProps {
  student: AllergyConflict['student'];
  conflicts: AllergyConflict[];
  isCollapsed: boolean;
  onToggle: () => void;
  worstSeverity: string;
  onSelectStudent?: (studentId: string) => void;
}

function StudentSection({
  student,
  conflicts,
  isCollapsed,
  onToggle,
  worstSeverity,
  onSelectStudent,
}: StudentSectionProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121234]/60 overflow-hidden">
      {/* Student header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
        <Avatar className="h-6 w-6">
          {student.photoUrl ? (
            <AvatarImage src={student.photoUrl} alt={student.name} />
          ) : null}
          <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[9px]">
            {student.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-white">
          {student.name}
        </span>
        <span className="text-xs text-white/40">
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
        </span>
        <div className="ml-auto">
          <AllergyBadge
            severity={worstSeverity as AllergyConflict['severity']}
            size="sm"
          />
        </div>
      </button>

      {/* Conflict list */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-3 py-2 space-y-2">
              {conflicts.map((c, idx) => (
                <ConflictRow
                  key={`${c.student.id}-${c.mealType}-${idx}`}
                  conflict={c}
                  onSelectStudent={onSelectStudent}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Single conflict row
// ============================================================

interface ConflictRowProps {
  conflict: AllergyConflict;
  onSelectStudent?: (studentId: string) => void;
}

function ConflictRow({ conflict, onSelectStudent }: ConflictRowProps) {
  const isDirect = !conflict.isMayContain;
  const mealColor = MEAL_TYPE_COLORS[conflict.mealType];

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-2',
        isDirect ? 'bg-red-950/30' : 'bg-amber-950/30'
      )}
    >
      {/* Student avatar (only in day group mode) */}
      <button
        onClick={() => onSelectStudent?.(conflict.student.id)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
      >
        <Avatar className="h-6 w-6">
          {conflict.student.photoUrl ? (
            <AvatarImage
              src={conflict.student.photoUrl}
              alt={conflict.student.name}
            />
          ) : null}
          <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[9px]">
            {conflict.student.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <User className="h-3 w-3 text-white/30" />
      </button>

      {/* Meal info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold rounded px-1.5 py-0.5"
            style={{
              backgroundColor: `${mealColor}20`,
              color: mealColor,
            }}
          >
            {MEAL_TYPE_LABELS[conflict.mealType]}
          </span>
          <span className="text-xs text-white/60 truncate">
            {conflict.mealItem.name}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {conflict.allergens.map((a) => (
            <AllergenTag
              key={a}
              allergen={a as AllergenType}
              size="sm"
              variant={isDirect ? 'danger' : 'warning'}
            />
          ))}
        </div>
      </div>

      {/* Severity badge */}
      <AllergyBadge severity={conflict.severity} size="sm" />
    </div>
  );
}
