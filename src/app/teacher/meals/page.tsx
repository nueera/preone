'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UtensilsCrossed,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Users,
  Clock,
  Send,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCard } from '@/components/meals/MealCard';
import { MealFeedbackForm } from '@/components/meals/MealFeedbackForm';
import { AllergyBadge } from '@/components/meals/AllergyBadge';
import { AllergenTag } from '@/components/meals/AllergenTag';
import type {
  MealType,
  MealItem,
  MealPlanItem,
  StudentAllergy,
  AllergenType,
  AllergySeverity,
} from '@/components/meals/types';
import {
  MEAL_TYPE_COLORS,
  MEAL_TYPE_LABELS,
  MEAL_TYPES_ORDER,
  ALLERGEN_LABELS,
  ALLERGEN_EMOJIS,
  SEVERITY_COLORS,
} from '@/components/meals/types';
import { teacherFetch, teacherGet, teacherPost } from '@/lib/teacher-api';

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
}

interface StudentAllergyFull extends StudentAllergy {
  studentName?: string;
}

interface MealPlanData {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface MealPlanItemFull {
  id: string;
  mealPlanId: string;
  mealItemId: string;
  dayOfWeek: number;
  mealType: MealType;
  isAlternative: boolean;
  alternativeFor: string | null;
  sortOrder: number;
  mealItem: MealItem | null;
}

// ============================================================
// Helper
// ============================================================

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function getDayOfWeek(): number {
  const day = new Date().getDay();
  // Convert: Sunday=0 -> no school, Monday=1, ..., Friday=5
  if (day === 0 || day === 6) return 1; // Default to Monday on weekends
  return day as 1 | 2 | 3 | 4 | 5;
}

// ============================================================
// Main Component
// ============================================================

export default function TeacherMealsPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayDOW = getDayOfWeek();

  // State
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [allAllergies, setAllAllergies] = useState<Map<string, StudentAllergyFull[]>>(new Map());
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItemFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Students with allergies
  const studentsWithAllergies = useMemo(() => {
    return students.filter((s) => {
      const allergies = allAllergies.get(s.id);
      return allergies && allergies.length > 0;
    });
  }, [students, allAllergies]);

  const allergyCount = studentsWithAllergies.length;

  // Today's meals by type
  const todayMeals = useMemo(() => {
    const meals: Record<MealType, MealPlanItemFull | null> = {
      BREAKFAST: null,
      MID_MORNING_SNACK: null,
      LUNCH: null,
      AFTERNOON_SNACK: null,
    };

    for (const item of mealPlanItems) {
      if (item.dayOfWeek === todayDOW && !item.isAlternative && item.mealItem) {
        meals[item.mealType] = item;
      }
    }

    return meals;
  }, [mealPlanItems, todayDOW]);

  // Check if a meal item has allergen conflicts for class students
  const getConflictingAllergens = useCallback(
    (mealItem: MealItem | null): { allergen: AllergenType; severity: AllergySeverity; studentName: string }[] => {
      if (!mealItem) return [];
      const conflicts: { allergen: AllergenType; severity: AllergySeverity; studentName: string }[] = [];
      const allItemAllergens = [...(mealItem.allergens || []), ...(mealItem.mayContain || [])];

      for (const student of studentsWithAllergies) {
        const studentAllergies = allAllergies.get(student.id) || [];
        for (const allergy of studentAllergies) {
          if (allItemAllergens.includes(allergy.allergen)) {
            conflicts.push({
              allergen: allergy.allergen,
              severity: allergy.severity,
              studentName: `${student.firstName} ${student.lastName}`,
            });
          }
        }
      }
      return conflicts;
    },
    [studentsWithAllergies, allAllergies]
  );

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
      if (!mealPlansRes || !mealPlansRes.ok) {
        throw new Error('Failed to fetch meal plans');
      }
      const mealPlansData = await mealPlansRes.json();
      const plans: MealPlanData[] = mealPlansData.mealPlans || [];

      if (plans.length > 0) {
        const activePlan = plans[0];
        setMealPlan(activePlan);

        // 3. Fetch meal plan items
        const itemsRes = await teacherFetch(
          `/api/meal-plans/${activePlan.id}/items`
        );
        if (itemsRes && itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setMealPlanItems(itemsData.items || []);
        }
      }

      // 4. Fetch allergies for all students
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
            // Silently skip allergy fetch errors for individual students
          }
        })
      );
      setAllAllergies(allergyMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meal data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Feedback Submission
  // ============================================================

  const handleFeedbackSubmit = async (
    data: {
      studentId: string;
      mealType: MealType;
      mealPlanItemId: string;
      rating: number;
      eatenPercent: number;
      comment: string;
      alternativeServed: boolean;
    }[]
  ) => {
    setSubmitting(true);
    try {
      const payload = data.map((d) => ({
        mealPlanItemId: d.mealPlanItemId,
        studentId: d.studentId,
        date: today,
        mealType: d.mealType,
        rating: d.rating,
        eatenPercent: d.eatenPercent,
        comments: d.comment || undefined,
      }));

      const res = await teacherFetch('/api/meal-feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({ error: 'Failed to submit feedback' }));
        throw new Error(err?.error || err?.message || 'Failed to submit feedback');
      }

      toast.success('Meal feedback saved!', {
        description: `Feedback for ${data.length} meal${data.length !== 1 ? 's' : ''} recorded successfully.`,
      });
    } catch (err: unknown) {
      toast.error('Failed to save feedback', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        {/* Alert banner skeleton */}
        <Skeleton className="h-20 w-full rounded-xl" />
        {/* Meal cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
        {/* Feedback form skeleton */}
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ============================================================
  // Error State
  // ============================================================

  if (error && !classInfo) {
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
  // Prepare feedback form data
  // ============================================================

  const feedbackStudents = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    photoUrl: s.photo || undefined,
  }));

  const activeMealTypes: MealType[] = MEAL_TYPES_ORDER.filter(
    (mt) => todayMeals[mt] !== null
  );

  const feedbackMealPlanItems: MealPlanItem[] = mealPlanItems
    .filter((item) => item.dayOfWeek === todayDOW && !item.isAlternative)
    .map((item) => ({
      id: item.id,
      mealPlanId: item.mealPlanId,
      mealItemId: item.mealItemId,
      dayOfWeek: item.dayOfWeek as 1 | 2 | 3 | 4 | 5,
      mealType: item.mealType,
      isAlternative: item.isAlternative,
      alternativeFor: item.alternativeFor ?? undefined,
      sortOrder: item.sortOrder,
    }));

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
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            Today&apos;s Meals
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {todayDisplay}
            </span>
            {classInfo && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {classInfo.name}
                {classInfo.section && ` - ${classInfo.section}`}
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push('/teacher/meals/allergy-alerts')}
          variant="outline"
          className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 gap-2"
        >
          <ShieldAlert className="h-4 w-4" />
          Allergy Alerts
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </motion.div>

      {/* ── Allergy Alert Banner ── */}
      {allergyCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 overflow-hidden">
            {/* Banner header */}
            <button
              onClick={() => setBannerExpanded(!bannerExpanded)}
              className="flex w-full items-center gap-3 p-4 hover:bg-red-950/30 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-red-300">
                  {allergyCount} student{allergyCount !== 1 ? 's' : ''} in your class have allergies
                  — check before serving!
                </p>
                <p className="text-xs text-red-400/60 mt-0.5">
                  Tap to see details for each student
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AllergyBadge severity="SEVERE" size="sm" />
                {bannerExpanded ? (
                  <ChevronUp className="h-4 w-4 text-red-400/60" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-red-400/60" />
                )}
              </div>
            </button>

            {/* Expandable list */}
            <AnimatePresence>
              {bannerExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-red-500/20 px-4 py-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {studentsWithAllergies.map((student) => {
                      const studentAllergyList = allAllergies.get(student.id) || [];
                      const worstSeverity = studentAllergyList.reduce(
                        (worst, a) => {
                          const order = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'];
                          return order.indexOf(a.severity) > order.indexOf(worst)
                            ? a.severity
                            : worst;
                        },
                        'MILD' as AllergySeverity
                      );

                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 rounded-lg bg-red-950/30 p-2.5"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            {student.photo ? (
                              <AvatarImage src={student.photo} alt={`${student.firstName} ${student.lastName}`} />
                            ) : null}
                            <AvatarFallback className="bg-teal-500/20 text-teal-300 text-[10px]">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">
                              {student.firstName} {student.lastName}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                          </div>
                          <AllergyBadge severity={worstSeverity} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── No Meal Plan State ── */}
      {!mealPlan && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <UtensilsCrossed className="h-8 w-8 text-white/20" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-white/60">
                  No Meal Plan for Today
                </h3>
                <p className="text-sm text-white/30 mt-1">
                  There is no published meal plan covering today&apos;s date. Contact the admin to create one.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Today's Meal Plan ── */}
      {mealPlan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-teal-400" />
              Today&apos;s Meal Plan
            </h2>
            <Badge
              variant="outline"
              className="border-teal-500/30 text-teal-400 bg-teal-500/10"
            >
              {mealPlan.name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_TYPES_ORDER.map((mealType) => {
              const planItem = todayMeals[mealType];
              const mealItem = planItem?.mealItem || null;
              const conflicts = mealItem ? getConflictingAllergens(mealItem) : [];
              const hasConflict = conflicts.length > 0;
              const studentAllergiesForConflict = conflicts.map((c) => ({
                id: `conflict-${c.allergen}-${c.studentName}`,
                studentId: '',
                allergen: c.allergen,
                severity: c.severity,
                reaction: '',
                notes: '',
                isVerified: true,
                isActive: true,
              }));

              return (
                <motion.div
                  key={mealType}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * MEAL_TYPES_ORDER.indexOf(mealType) }}
                >
                  <MealCard
                    mealItem={
                      mealItem || {
                        id: '',
                        name: 'No meal assigned',
                        mealType,
                        isVegetarian: true,
                        isVegan: false,
                        isEggless: false,
                        servingSize: '',
                        calories: 0,
                        protein: 0,
                        carbohydrates: 0,
                        fat: 0,
                        fiber: 0,
                        sugar: 0,
                        calcium: 0,
                        iron: 0,
                        vitaminC: 0,
                        allergens: [],
                        mayContain: [],
                      }
                    }
                    variant="detailed"
                    allergyConflict={hasConflict}
                    studentAllergies={studentAllergiesForConflict}
                  />

                  {/* Conflict warning below card */}
                  {hasConflict && (
                    <div className="mt-2 space-y-1">
                      {conflicts.map((c, idx) => (
                        <div
                          key={`${c.allergen}-${c.studentName}-${idx}`}
                          className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1"
                        >
                          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                          <span className="text-[10px] text-red-300 truncate">
                            {c.studentName}: {ALLERGEN_EMOJIS[c.allergen]} {ALLERGEN_LABELS[c.allergen]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Meal Feedback Form ── */}
      {mealPlan && feedbackStudents.length > 0 && activeMealTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-white/10 bg-[#121234]/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-teal-400" />
                Record Meal Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MealFeedbackForm
                students={feedbackStudents}
                meals={activeMealTypes}
                mealPlanItems={feedbackMealPlanItems}
                date={todayDisplay}
                onSubmit={handleFeedbackSubmit}
                isLoading={submitting}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
