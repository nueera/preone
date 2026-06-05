'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Phone,
  Printer,
  ArrowLeft,
  RefreshCw,
  Heart,
  Syringe,
  Info,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AllergyBadge } from '@/components/meals/AllergyBadge';
import { AllergenTag } from '@/components/meals/AllergenTag';
import type {
  MealType,
  MealItem,
  AllergenType,
  AllergySeverity,
  StudentAllergy,
} from '@/components/meals/types';
import {
  MEAL_TYPE_COLORS,
  MEAL_TYPE_LABELS,
  MEAL_TYPES_ORDER,
  ALLERGEN_LABELS,
  ALLERGEN_EMOJIS,
  SEVERITY_COLORS,
} from '@/components/meals/types';
import { teacherFetch, teacherGet } from '@/lib/teacher-api';

// ============================================================
// Types
// ============================================================

interface ClassInfo {
  id: string;
  name: string;
  capacity: number;
  roomNo: string | null;
  section: string | null;
  program: { id: string; name: string };
  branch: { id: string; name: string };
}

interface ParentInfo {
  isPrimary: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    relation: string;
  };
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rollNumber: string | null;
  gender: string;
  dob: string;
  status: string;
  medicalAlerts: boolean;
  parents: ParentInfo[];
  medicalRecords: Array<{
    id: string;
    allergies: string;
    conditions: string;
    medications: string;
    doctorName: string;
    doctorPhone: string;
  }>;
}

interface StudentAllergyFull extends StudentAllergy {
  reaction?: string;
  notes?: string;
  actionPlan?: string;
}

interface MealPlanItemFull {
  id: string;
  mealPlanId: string;
  mealItemId: string;
  dayOfWeek: number;
  mealType: MealType;
  isAlternative: boolean;
  sortOrder: number;
  mealItem: MealItem | null;
}

// Severity sorting order
const SEVERITY_ORDER: Record<string, number> = {
  LIFE_THREATENING: 4,
  SEVERE: 3,
  MODERATE: 2,
  MILD: 1,
};

// ============================================================
// Helper
// ============================================================

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function getDayOfWeek(): number {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return 1;
  return day as 1 | 2 | 3 | 4 | 5;
}

function getWorstSeverity(allergies: StudentAllergyFull[]): AllergySeverity {
  if (allergies.length === 0) return 'MILD';
  return allergies.reduce((worst, a) => {
    return SEVERITY_ORDER[a.severity] > SEVERITY_ORDER[worst] ? a.severity : worst;
  }, 'MILD' as AllergySeverity);
}

function getPrimaryParent(student: StudentInfo): ParentInfo | null {
  return student.parents?.find((p) => p.isPrimary) || student.parents?.[0] || null;
}

// ============================================================
// Conflict Cell Component
// ============================================================

function ConflictCell({ status }: { status: 'danger' | 'warning' | 'safe' | 'empty' }) {
  const config = {
    danger: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
      text: 'text-red-300',
      label: 'Conflict',
    },
    warning: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
      text: 'text-amber-300',
      label: 'May Contain',
    },
    safe: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: null,
      text: 'text-emerald-400',
      label: 'Safe',
    },
    empty: {
      bg: 'bg-white/[0.02]',
      border: 'border-white/5',
      icon: null,
      text: 'text-white/20',
      label: '—',
    },
  };

  const c = config[status];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border px-1.5 py-2 min-h-[44px]',
        c.bg,
        c.border
      )}
    >
      <div className="flex flex-col items-center gap-0.5">
        {c.icon}
        <span className={cn('text-[9px] font-medium', c.text)}>{c.label}</span>
      </div>
    </div>
  );
}

// ============================================================
// Emergency Card Component
// ============================================================

function EmergencyCard({
  student,
  allergies,
  parent,
}: {
  student: StudentInfo;
  allergies: StudentAllergyFull[];
  parent: ParentInfo | null;
}) {
  const worstSeverity = getWorstSeverity(allergies);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-red-500/30 bg-[#121234]/90 overflow-hidden"
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-500" />

      <div className="p-4 space-y-3">
        {/* Student header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-red-500/30">
            {student.photo ? (
              <AvatarImage src={student.photo} alt={`${student.firstName} ${student.lastName}`} />
            ) : null}
            <AvatarFallback className="bg-red-500/20 text-red-300 text-sm font-bold">
              {student.firstName[0]}
              {student.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-white">
              {student.firstName} {student.lastName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <AllergyBadge severity={worstSeverity} size="sm" showPulse />
            </div>
          </div>
        </div>

        {/* Allergen list */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Allergens
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-1">
                <AllergenTag
                  allergen={a.allergen}
                  size="md"
                  variant={
                    a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
                      ? 'danger'
                      : a.severity === 'MODERATE'
                        ? 'warning'
                        : 'default'
                  }
                />
                <AllergyBadge severity={a.severity} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Reaction symptoms */}
        {allergies.some((a) => a.reaction) && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-3 w-3" /> Reaction Symptoms
            </p>
            <div className="space-y-1">
              {allergies
                .filter((a) => a.reaction)
                .map((a) => (
                  <p key={a.id} className="text-xs text-white/70">
                    <span className="font-medium text-white/90">
                      {ALLERGEN_EMOJIS[a.allergen]} {ALLERGEN_LABELS[a.allergen]}:
                    </span>{' '}
                    {a.reaction}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Emergency action */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1">
            <Syringe className="h-3 w-3" /> Emergency Action
          </p>
          <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-2.5">
            {allergies.some((a) => a.actionPlan) ? (
              allergies
                .filter((a) => a.actionPlan)
                .map((a) => (
                  <p key={a.id} className="text-xs text-red-300">
                    <span className="font-semibold">{ALLERGEN_LABELS[a.allergen]}:</span>{' '}
                    {a.actionPlan}
                  </p>
                ))
            ) : (
              <p className="text-xs text-red-300/60">
                No specific action plan on file. Contact parent immediately.
              </p>
            )}
            {student.medicalRecords?.[0]?.doctorName && (
              <div className="mt-2 pt-2 border-t border-red-500/10 text-[10px] text-red-300/50 space-y-0.5">
                <p>Doctor: {student.medicalRecords[0].doctorName}</p>
                {student.medicalRecords[0].doctorPhone && (
                  <p>Phone: {student.medicalRecords[0].doctorPhone}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Parent contact */}
        {parent && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Phone className="h-3 w-3" /> Parent Contact
            </p>
            <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2.5">
              <p className="text-xs font-medium text-white">
                {parent.parent.firstName} {parent.parent.lastName}
              </p>
              <p className="text-[10px] text-white/40">{parent.parent.relation}</p>
              {parent.parent.phone && (
                <p className="text-xs text-teal-400 mt-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {parent.parent.phone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ClassAllergyAlertsPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDOW = getDayOfWeek();

  // State
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [allAllergies, setAllAllergies] = useState<Map<string, StudentAllergyFull[]>>(new Map());
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItemFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Students with allergies (sorted by severity)
  const studentsWithAllergies = useMemo(() => {
    const result = students.filter((s) => {
      const allergies = allAllergies.get(s.id);
      return allergies && allergies.length > 0;
    });

    // Sort by worst severity (critical first)
    result.sort((a, b) => {
      const aWorst = getWorstSeverity(allAllergies.get(a.id) || []);
      const bWorst = getWorstSeverity(allAllergies.get(b.id) || []);
      return (SEVERITY_ORDER[bWorst] || 0) - (SEVERITY_ORDER[aWorst] || 0);
    });

    return result;
  }, [students, allAllergies]);

  // Today's meals (non-alternative, matching today's day of week)
  const todayMeals = useMemo(() => {
    const meals: MealPlanItemFull[] = [];
    for (const item of mealPlanItems) {
      if (item.dayOfWeek === todayDOW && !item.isAlternative && item.mealItem) {
        meals.push(item);
      }
    }
    return meals;
  }, [mealPlanItems, todayDOW]);

  // Severely allergic students (SEVERE or LIFE_THREATENING)
  const severeStudents = useMemo(() => {
    return studentsWithAllergies.filter((s) => {
      const allergies = allAllergies.get(s.id) || [];
      return allergies.some(
        (a) => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
      );
    });
  }, [studentsWithAllergies, allAllergies]);

  // Compute conflict matrix
  const conflictMatrix = useMemo(() => {
    const matrix: Record<
      string,
      Record<string, 'danger' | 'warning' | 'safe' | 'empty'>
    > = {};

    for (const student of studentsWithAllergies) {
      const studentAllergies = allAllergies.get(student.id) || [];
      const studentAllergenSet = new Set<AllergenType>(studentAllergies.map((a) => a.allergen));

      matrix[student.id] = {};

      for (const meal of todayMeals) {
        if (!meal.mealItem) {
          matrix[student.id][meal.mealType] = 'empty';
          continue;
        }

        const directAllergens = meal.mealItem.allergens || [];
        const mayContainAllergens = meal.mealItem.mayContain || [];

        const hasDirect = directAllergens.some((a) => studentAllergenSet.has(a));
        const hasMayContain = mayContainAllergens.some((a) => studentAllergenSet.has(a));

        if (hasDirect) {
          matrix[student.id][meal.mealType] = 'danger';
        } else if (hasMayContain) {
          matrix[student.id][meal.mealType] = 'warning';
        } else {
          matrix[student.id][meal.mealType] = 'safe';
        }
      }
    }

    return matrix;
  }, [studentsWithAllergies, allAllergies, todayMeals]);

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch class info + students
      const classRes = await teacherGet<{
        classInfo: ClassInfo | null;
        students: StudentInfo[];
        totalStudents: number;
      }>('/api/teacher/class');

      if (classRes.classInfo) {
        setClassInfo(classRes.classInfo);
      }
      setStudents(classRes.students || []);

      // 2. Fetch today's published meal plan
      const mealPlansRes = await teacherFetch(
        `/api/meal-plans?status=PUBLISHED&from=${today}&to=${today}`
      );
      if (mealPlansRes && mealPlansRes.ok) {
        const mealPlansData = await mealPlansRes.json();
        const plans = mealPlansData.mealPlans || [];

        if (plans.length > 0) {
          const activePlan = plans[0];

          // Fetch meal plan items
          const itemsRes = await teacherFetch(
            `/api/meal-plans/${activePlan.id}/items`
          );
          if (itemsRes && itemsRes.ok) {
            const itemsData = await itemsRes.json();
            setMealPlanItems(itemsData.items || []);
          }
        }
      }

      // 3. Fetch allergies for all students
      const allergyMap = new Map<string, StudentAllergyFull[]>();
      await Promise.all(
        (classRes.students || []).map(async (student) => {
          try {
            const allergyRes = await teacherFetch(
              `/api/students/${student.id}/allergies`
            );
            if (allergyRes && allergyRes.ok) {
              const data = await allergyRes.json();
              if (data.allergies && data.allergies.length > 0) {
                allergyMap.set(student.id, data.allergies);
              }
            }
          } catch {
            // Skip individual errors
          }
        })
      );
      setAllAllergies(allergyMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load allergy data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Print Handler
  // ============================================================

  const handlePrint = useCallback(() => {
    window.print();
    toast.success('Print dialog opened');
  }, []);

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Error State
  // ============================================================

  if (error && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="h-12 w-12 text-red-400/50" />
        <p className="text-sm text-red-400">{error}</p>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/teacher/meals')}
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/50 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              Class Allergy Alerts
            </h1>
            {classInfo && (
              <p className="mt-0.5 text-sm text-white/50 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {classInfo.name}
                {classInfo.section && ` - ${classInfo.section}`}
                <span className="mx-1.5 text-white/20">|</span>
                {studentsWithAllergies.length} of {students.length} students with allergies
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handlePrint}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2 print:hidden"
        >
          <Printer className="h-4 w-4" />
          Print Emergency Cards
        </Button>
      </motion.div>

      {/* ── Empty State ── */}
      {studentsWithAllergies.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <ShieldAlert className="h-8 w-8 text-emerald-400/50" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-white/60">
                  No Allergies in Your Class
                </h3>
                <p className="text-sm text-white/30 mt-1">
                  None of your students have recorded allergies. You&apos;re all clear!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Class Allergy Roster Table ── */}
      {studentsWithAllergies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-400" />
                Class Allergy Roster
                <Badge
                  variant="outline"
                  className="ml-2 border-red-500/30 text-red-400 bg-red-500/10 text-[10px]"
                >
                  {studentsWithAllergies.length} students
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 pr-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="pb-3 pr-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Allergies
                      </th>
                      <th className="pb-3 pr-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Reaction
                      </th>
                      <th className="pb-3 pr-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="pb-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsWithAllergies.map((student) => {
                      const studentAllergyList = allAllergies.get(student.id) || [];
                      const worstSev = getWorstSeverity(studentAllergyList);

                      return (
                        <tr
                          key={student.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 shrink-0">
                                {student.photo ? (
                                  <AvatarImage
                                    src={student.photo}
                                    alt={`${student.firstName} ${student.lastName}`}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-teal-500/20 text-teal-300 text-[10px]">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {student.firstName} {student.lastName}
                                </p>
                                {student.rollNumber && (
                                  <p className="text-[10px] text-white/30">
                                    Roll #{student.rollNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {studentAllergyList.map((a) => (
                                <AllergenTag
                                  key={a.id}
                                  allergen={a.allergen}
                                  size="sm"
                                  variant={
                                    a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
                                      ? 'danger'
                                      : a.severity === 'MODERATE'
                                        ? 'warning'
                                        : 'default'
                                  }
                                />
                              ))}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-xs text-white/50 max-w-[200px] truncate">
                              {studentAllergyList
                                .filter((a) => a.reaction)
                                .map((a) => a.reaction)
                                .join('; ') || '—'}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <AllergyBadge severity={worstSev} size="sm" />
                          </td>
                          <td className="py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                studentAllergyList.every((a) => a.isVerified)
                                  ? 'border-emerald-500/30 text-emerald-400'
                                  : 'border-amber-500/30 text-amber-400'
                              )}
                            >
                              {studentAllergyList.every((a) => a.isVerified)
                                ? 'Verified'
                                : 'Unverified'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-2 md:hidden">
                {studentsWithAllergies.map((student) => {
                  const studentAllergyList = allAllergies.get(student.id) || [];
                  const worstSev = getWorstSeverity(studentAllergyList);

                  return (
                    <div
                      key={student.id}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {student.photo ? (
                              <AvatarImage
                                src={student.photo}
                                alt={`${student.firstName} ${student.lastName}`}
                              />
                            ) : null}
                            <AvatarFallback className="bg-teal-500/20 text-teal-300 text-[9px]">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                        <AllergyBadge severity={worstSev} size="sm" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {studentAllergyList.map((a) => (
                          <AllergenTag
                            key={a.id}
                            allergen={a.allergen}
                            size="sm"
                            variant={
                              a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
                                ? 'danger'
                                : 'warning'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Meal Conflict Matrix ── */}
      {studentsWithAllergies.length > 0 && todayMeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-teal-400" />
                Meal Conflict Matrix
                <Badge
                  variant="outline"
                  className="ml-2 border-white/20 text-white/50 text-[10px]"
                >
                  Today&apos;s Meals
                </Badge>
              </CardTitle>
              <p className="text-xs text-white/30 mt-1">
                Shows at a glance who can&apos;t eat what. Red = direct allergen conflict, Yellow = may contain,
                Green = safe.
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/40" />
                  <span className="text-red-300">Conflict</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-amber-500/15 border border-amber-500/30" />
                  <span className="text-amber-300">May Contain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-emerald-500/10 border border-emerald-500/20" />
                  <span className="text-emerald-400">Safe</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Column headers */}
                  <div
                    className="grid gap-2 mb-2"
                    style={{
                      gridTemplateColumns: `160px repeat(${todayMeals.length}, minmax(90px, 1fr))`,
                    }}
                  >
                    <div className="flex items-center px-2">
                      <span className="text-[10px] font-semibold text-white/40 uppercase">
                        Student
                      </span>
                    </div>
                    {todayMeals.map((meal) => {
                      const color = MEAL_TYPE_COLORS[meal.mealType];
                      return (
                        <div
                          key={meal.mealType}
                          className="flex items-center justify-center gap-1 rounded-lg px-2 py-1.5"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className="text-[10px] font-semibold truncate"
                            style={{ color }}
                          >
                            {MEAL_TYPE_LABELS[meal.mealType]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Student rows */}
                  {studentsWithAllergies.map((student) => {
                    const row = conflictMatrix[student.id] || {};
                    const worstSev = getWorstSeverity(allAllergies.get(student.id) || []);
                    const hasAnyConflict = Object.values(row).some(
                      (v) => v === 'danger' || v === 'warning'
                    );

                    return (
                      <div
                        key={student.id}
                        className={cn(
                          'grid gap-2 mb-2 rounded-lg p-2 items-center',
                          hasAnyConflict
                            ? 'bg-red-950/10 border border-red-500/10'
                            : 'bg-white/[0.02] border border-white/5'
                        )}
                        style={{
                          gridTemplateColumns: `160px repeat(${todayMeals.length}, minmax(90px, 1fr))`,
                        }}
                      >
                        {/* Student name */}
                        <div className="flex items-center gap-2 px-1">
                          <Avatar className="h-6 w-6 shrink-0">
                            {student.photo ? (
                              <AvatarImage
                                src={student.photo}
                                alt={`${student.firstName} ${student.lastName}`}
                              />
                            ) : null}
                            <AvatarFallback className="bg-teal-500/20 text-teal-300 text-[8px]">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-white truncate">
                            {student.firstName}
                          </span>
                          {(worstSev === 'SEVERE' || worstSev === 'LIFE_THREATENING') && (
                            <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                          )}
                        </div>

                        {/* Conflict cells */}
                        {todayMeals.map((meal) => (
                          <ConflictCell
                            key={`${student.id}-${meal.mealType}`}
                            status={row[meal.mealType] || 'empty'}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── No Meal Data Note ── */}
      {studentsWithAllergies.length > 0 && todayMeals.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardContent className="flex items-center gap-3 py-6">
              <Info className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-sm text-white/50">
                No published meal plan for today. The conflict matrix will appear once today&apos;s meal
                plan is available.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Quick Reference Emergency Cards ── */}
      {severeStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              Emergency Quick Reference
              <Badge
                variant="outline"
                className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px]"
              >
                {severeStudents.length} critical
              </Badge>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
            {severeStudents.map((student) => {
              const studentAllergies = allAllergies.get(student.id) || [];
              const primaryParent = getPrimaryParent(student);

              return (
                <EmergencyCard
                  key={student.id}
                  student={student}
                  allergies={studentAllergies}
                  parent={primaryParent}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
