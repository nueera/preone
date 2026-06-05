'use client';

// ============================================================
// PreOne — Parent Meal View Page
// Shows: child's meals, allergy warnings, weekly menu,
// today's meal card, nutrition summary, feedback history
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils, AlertTriangle, ShieldAlert, ChevronDown, Star,
  Flame, CheckCircle2, Leaf, RefreshCw, Loader2, Baby,
  CalendarDays, TrendingUp, ArrowRight, Plus, X,
  ChevronRight, Info, MessageSquare, Heart,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useParentAuth } from '@/lib/parent-auth';
import { parentFetch, parentGet } from '@/lib/parent-api';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MealCard } from '@/components/meals/MealCard';
import { AllergyBadge } from '@/components/meals/AllergyBadge';
import { AllergenTag } from '@/components/meals/AllergenTag';
import { NutritionBar } from '@/components/meals/NutritionBar';
import { MealPlanGrid } from '@/components/meals/MealPlanGrid';
import type {
  MealItem, MealPlanItem, StudentAllergy, MealType,
  DayOfWeek, AllergenType, AllergySeverity,
} from '@/components/meals/types';
import {
  MEAL_TYPE_COLORS, MEAL_TYPE_LABELS, DAY_LABELS,
  ALLERGEN_EMOJIS, ALLERGEN_LABELS, SEVERITY_COLORS,
  MEAL_TYPES_ORDER, NUTRITION_RECOMMENDED,
} from '@/components/meals/types';

// ============================================================
// Types — API Response Shape
// ============================================================

interface MealMenuItem {
  id: string;
  mealItemId: string;
  name: string;
  image: string | null;
  calories: number;
  isVegetarian: boolean;
  allergens: string[];
  mayContain: string[];
  allergyConflict: boolean;
  conflictingAllergens: string[];
  isAlternative: boolean;
}

interface MealFeedbackData {
  id: string;
  mealPlanItemId: string;
  studentId: string;
  date: string;
  mealType: string;
  rating: number;
  eatenPercent: number;
  comments: string | null;
  createdAt: string;
}

interface ParentMealsResponse {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    allergies: StudentAllergy[];
    class: { id: string; name: string } | null;
  };
  mealPlan: {
    id: string;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    mealTypes: string[];
    branch: { id: string; name: string } | null;
    avgDailyCalories: number | null;
    avgDailyProtein: number | null;
  } | null;
  weeklyMenu: Record<number, Record<string, MealMenuItem[]>>;
  todayFeedback: MealFeedbackData[];
  weekFeedback: MealFeedbackData[];
}

// ============================================================
// Animation Variants
// ============================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ============================================================
// Main Component
// ============================================================

export default function ParentMealsPage() {
  const router = useRouter();
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  const [data, setData] = useState<ParentMealsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Allergy Dialog
  const [addAllergyOpen, setAddAllergyOpen] = useState(false);
  const [addAllergyLoading, setAddAllergyLoading] = useState(false);
  const [newAllergen, setNewAllergen] = useState<AllergenType | ''>('');
  const [newSeverity, setNewSeverity] = useState<AllergySeverity>('MILD');
  const [newReaction, setNewReaction] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Fetch meals data
  const fetchMeals = useCallback(async () => {
    if (!selectedChildId) return;
    setLoading(true);
    setError('');
    try {
      const result = await parentGet<ParentMealsResponse>(
        `/api/parent/meals?studentId=${selectedChildId}`
      );
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Derived data
  const activeAllergies = useMemo(
    () => data?.student.allergies.filter((a) => a.isActive) ?? [],
    [data]
  );

  const studentAllergenSet = useMemo(
    () => new Set<AllergenType>(activeAllergies.map((a) => a.allergen)),
    [activeAllergies]
  );

  // Convert weeklyMenu to MealPlanGrid format
  const weeklyMenuForGrid = useMemo(() => {
    if (!data?.weeklyMenu) return [];
    const days: DayOfWeek[] = [1, 2, 3, 4, 5];
    return days.map((day) => {
      const dayData = data.weeklyMenu[day] ?? {};
      const mealsByType: Partial<Record<MealType, MealPlanItem[]>> = {};
      for (const mt of MEAL_TYPES_ORDER) {
        const items = dayData[mt] ?? [];
        mealsByType[mt] = items.map((item) => ({
          id: item.id,
          mealPlanId: '',
          mealItemId: item.mealItemId,
          dayOfWeek: day,
          mealType: mt as MealType,
          isAlternative: item.isAlternative,
          alternativeFor: item.isAlternative ? items.find((i) => !i.isAlternative)?.id : undefined,
          sortOrder: 0,
          mealItem: {
            id: item.mealItemId,
            name: item.name,
            image: item.image ?? undefined,
            mealType: mt as MealType,
            isVegetarian: item.isVegetarian,
            isVegan: false,
            isEggless: false,
            servingSize: '',
            calories: item.calories,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            calcium: 0,
            iron: 0,
            vitaminC: 0,
            allergens: item.allergens as AllergenType[],
            mayContain: item.mayContain as AllergenType[],
          },
        }));
      }
      return { day, meals: mealsByType };
    });
  }, [data?.weeklyMenu]);

  // Conflict warnings for MealPlanGrid
  const conflictWarnings = useMemo(() => {
    if (!data?.weeklyMenu || activeAllergies.length === 0) return [];
    const warnings: Array<{ dayOfWeek: DayOfWeek; mealType: MealType; allergens: AllergenType[] }> = [];
    const days: DayOfWeek[] = [1, 2, 3, 4, 5];
    for (const day of days) {
      const dayData = data.weeklyMenu[day] ?? {};
      for (const mt of MEAL_TYPES_ORDER) {
        const items = dayData[mt] ?? [];
        const mainItem = items.find((i) => !i.isAlternative);
        if (mainItem && mainItem.allergyConflict && mainItem.conflictingAllergens.length > 0) {
          warnings.push({
            dayOfWeek: day,
            mealType: mt as MealType,
            allergens: mainItem.conflictingAllergens as AllergenType[],
          });
        }
      }
    }
    return warnings;
  }, [data?.weeklyMenu, activeAllergies]);

  // Today's day of week (1=Mon, 5=Fri)
  const todayDow = useMemo(() => {
    const jsDay = new Date().getDay(); // 0=Sun
    return jsDay >= 1 && jsDay <= 5 ? (jsDay as DayOfWeek) : null;
  }, []);

  // Today's meals from the weekly menu
  const todayMeals = useMemo(() => {
    if (!todayDow || !data?.weeklyMenu) return null;
    return data.weeklyMenu[todayDow] ?? null;
  }, [todayDow, data?.weeklyMenu]);

  // Nutrition summary from feedback
  const nutritionSummary = useMemo(() => {
    if (!data?.weekFeedback || data.weekFeedback.length === 0) return null;
    const avgEaten = Math.round(
      data.weekFeedback.reduce((sum, f) => sum + f.eatenPercent, 0) / data.weekFeedback.length
    );
    const avgRating = (
      data.weekFeedback.reduce((sum, f) => sum + f.rating, 0) / data.weekFeedback.length
    ).toFixed(1);
    return { avgEaten, avgRating: parseFloat(avgRating), totalFeedbacks: data.weekFeedback.length };
  }, [data?.weekFeedback]);

  // Add allergy handler
  const handleAddAllergy = async () => {
    if (!selectedChildId || !newAllergen) return;
    setAddAllergyLoading(true);
    try {
      const res = await parentFetch(`/api/students/${selectedChildId}/allergies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergen: newAllergen,
          severity: newSeverity,
          reaction: newReaction || undefined,
          notes: newNotes || undefined,
        }),
      });
      if (!res) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to add allergy' }));
        throw new Error(err.message || 'Failed to add allergy');
      }
      toast.success(`Allergy to ${ALLERGEN_LABELS[newAllergen]} added successfully`);
      setAddAllergyOpen(false);
      setNewAllergen('');
      setNewSeverity('MILD');
      setNewReaction('');
      setNewNotes('');
      fetchMeals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add allergy');
    } finally {
      setAddAllergyLoading(false);
    }
  };

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">{error}</p>
        <Button onClick={fetchMeals} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data || !selectedChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Baby className="h-12 w-12 text-purple-300" />
        <p className="text-muted-foreground">Select a child to view their meals</p>
      </div>
    );
  }

  const childName = `${data.student.firstName} ${data.student.lastName}`;
  const hasAllergies = activeAllergies.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* ═══════════════════════════════════════════════════════
          1. HEADER — Title + Child Selector
          ═══════════════════════════════════════════════════════ */}
      <motion.div {...fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Utensils className="h-6 w-6 text-purple-500" />
            My Child&apos;s Meals
          </h1>
          <p className="text-muted-foreground mt-1">
            {data.mealPlan
              ? `${data.mealPlan.name} • Week of ${format(parseISO(data.mealPlan.startDate), 'MMM d')}`
              : 'No active meal plan this week'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={fetchMeals}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          {/* Child Selector */}
          {children.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                      {selectedChild?.firstName?.[0]}{selectedChild?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChild?.firstName}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {children.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    className={c.id === selectedChildId ? 'bg-purple-50 dark:bg-purple-950/30' : ''}
                    onClick={() => selectChild(c.id)}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                        {c.firstName[0]}{c.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {c.firstName} {c.lastName}
                    {c.id === selectedChildId && (
                      <Badge className="ml-2 bg-purple-100 text-purple-700 text-[9px]">Active</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Manage Allergies Link */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1"
            onClick={() => router.push('/parent/meals/allergies')}
          >
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span className="hidden sm:inline">Allergies</span>
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          2. ALLERGY WARNING BANNER
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {hasAllergies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-rose-950/40 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20">
                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-rose-200">
                        Allergy Alert for {childName}
                      </h3>
                      <Badge className="bg-rose-500/20 text-rose-300 text-[10px]">
                        {activeAllergies.length} active {activeAllergies.length === 1 ? 'allergy' : 'allergies'}
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-300/70">
                      Your child has {activeAllergies.length} active {activeAllergies.length === 1 ? 'allergy' : 'allergies'} — meals are checked for safety
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeAllergies.map((allergy) => (
                        <div key={allergy.id} className="flex items-center gap-1.5">
                          <AllergenTag
                            allergen={allergy.allergen}
                            size="sm"
                            variant="danger"
                          />
                          <AllergyBadge severity={allergy.severity} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          3. TODAY'S MEAL CARD (Prominent)
          ═══════════════════════════════════════════════════════ */}
      {todayDow && todayMeals && (
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-[#121234]/80 to-rose-950/20 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                    <CalendarDays className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Today&apos;s Meals</CardTitle>
                    <CardDescription className="text-purple-300/60">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">
                  {DAY_LABELS[todayDow]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MEAL_TYPES_ORDER.map((mt) => {
                const items = todayMeals[mt] ?? [];
                const mainItem = items.find((i) => !i.isAlternative);
                const alternatives = items.filter((i) => i.isAlternative);
                const feedback = data.todayFeedback.find((f) => f.mealType === mt);
                const mealColor = MEAL_TYPE_COLORS[mt];

                if (!mainItem) return null;

                return (
                  <motion.div
                    key={mt}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'rounded-xl border p-4 transition-all',
                      mainItem.allergyConflict
                        ? 'border-red-500/40 bg-red-950/20'
                        : 'border-white/10 bg-white/[0.03]'
                    )}
                  >
                    {/* Meal type header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: mealColor }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: mealColor }}
                        >
                          {MEAL_TYPE_LABELS[mt]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-white/10 text-white/70"
                        >
                          <Flame className="h-3 w-3 text-amber-400" />
                          {mainItem.calories} kcal
                        </Badge>
                        {mainItem.isVegetarian && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px]">
                            <Leaf className="h-2.5 w-2.5 mr-0.5" /> Veg
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Dish name + allergy status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {mainItem.name}
                        </p>
                        {/* Allergy conflict */}
                        {mainItem.allergyConflict && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <X className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-xs text-red-300 font-medium">
                              Contains: {mainItem.conflictingAllergens.map((a) => ALLERGEN_LABELS[a as AllergenType] || a).join(', ')}
                            </span>
                          </div>
                        )}
                        {/* Allergen tags */}
                        {mainItem.allergens.length > 0 && !mainItem.allergyConflict && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {mainItem.allergens.slice(0, 3).map((a) => (
                              <AllergenTag
                                key={a}
                                allergen={a as AllergenType}
                                size="sm"
                                variant={
                                  studentAllergenSet.has(a as AllergenType) ? 'warning' : 'default'
                                }
                              />
                            ))}
                            {mainItem.allergens.length > 3 && (
                              <span className="text-[10px] text-white/40">
                                +{mainItem.allergens.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Safe alternative */}
                      {mainItem.allergyConflict && alternatives.length > 0 && (
                        <div className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                              Safe Alternative
                            </span>
                          </div>
                          {alternatives.map((alt) => (
                            <p key={alt.id} className="text-xs text-white/80">{alt.name}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Feedback (if available) */}
                    {feedback && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">
                              What was eaten
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Star rating */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-3 w-3',
                                    i < feedback.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-transparent text-white/20'
                                  )}
                                />
                              ))}
                            </div>
                            {/* Eaten percentage */}
                            <div className="flex items-center gap-1.5 min-w-[100px]">
                              <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  className={cn(
                                    'h-full rounded-full',
                                    feedback.eatenPercent >= 75
                                      ? 'bg-emerald-400'
                                      : feedback.eatenPercent >= 50
                                        ? 'bg-amber-400'
                                        : 'bg-red-400'
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${feedback.eatenPercent}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="text-[10px] text-white/50 tabular-nums w-8 text-right">
                                {feedback.eatenPercent}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {feedback.comments && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <MessageSquare className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-white/50 italic">{feedback.comments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          4. THIS WEEK'S MENU (MealPlanGrid)
          ═══════════════════════════════════════════════════════ */}
      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <Card className="border-white/10 bg-[#0e0e2c]/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                  <CalendarDays className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">This Week&apos;s Menu</CardTitle>
                  <CardDescription>
                    {data.mealPlan?.name || 'Weekly meal plan'}
                  </CardDescription>
                </div>
              </div>
              {conflictWarnings.length > 0 && (
                <Badge className="bg-red-500/20 text-red-300 text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {conflictWarnings.length} conflict{conflictWarnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {weeklyMenuForGrid.length > 0 ? (
              <MealPlanGrid
                weeklyMenu={weeklyMenuForGrid}
                studentAllergies={activeAllergies}
                editable={false}
                conflictWarnings={conflictWarnings}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <Utensils className="h-10 w-10 mb-3" />
                <p className="text-sm">No meal plan published for this week</p>
                <p className="text-xs mt-1">Check back later or contact the school</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          5. ALLERGY MANAGEMENT + NUTRITION SUMMARY (Side by side)
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allergy Management */}
        <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
          <Card className="border-white/10 bg-[#0e0e2c]/80 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                  </div>
                  <CardTitle className="text-lg">Allergy Management</CardTitle>
                </div>
                <Dialog open={addAllergyOpen} onOpenChange={setAddAllergyOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-xl gap-1 bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-3.5 w-3.5" /> Add Allergy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1a3e] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Add New Allergy</DialogTitle>
                      <DialogDescription className="text-white/50">
                        Report a new allergy for {childName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      {/* Allergen selector */}
                      <div className="space-y-2">
                        <Label className="text-white/70">Allergen</Label>
                        <Select value={newAllergen} onValueChange={(v) => setNewAllergen(v as AllergenType)}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select allergen..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a3e] border-white/10">
                            {Object.entries(ALLERGEN_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key} className="text-white/80">
                                {ALLERGEN_EMOJIS[key as AllergenType]} {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Severity */}
                      <div className="space-y-2">
                        <Label className="text-white/70">Severity</Label>
                        <Select value={newSeverity} onValueChange={(v) => setNewSeverity(v as AllergySeverity)}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a3e] border-white/10">
                            <SelectItem value="MILD" className="text-white/80">Mild — Minor discomfort</SelectItem>
                            <SelectItem value="MODERATE" className="text-white/80">Moderate — Noticeable reaction</SelectItem>
                            <SelectItem value="SEVERE" className="text-white/80">Severe — Medical attention needed</SelectItem>
                            <SelectItem value="LIFE_THREATENING" className="text-white/80">Life-threatening — Anaphylaxis risk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Reaction */}
                      <div className="space-y-2">
                        <Label className="text-white/70">Reaction</Label>
                        <Input
                          value={newReaction}
                          onChange={(e) => setNewReaction(e.target.value)}
                          placeholder="e.g., Hives, swelling, difficulty breathing..."
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-white/70">Notes</Label>
                        <Textarea
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          placeholder="Any additional information..."
                          className="bg-white/5 border-white/10 min-h-[60px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setAddAllergyOpen(false)} className="text-white/50">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddAllergy}
                        disabled={!newAllergen || addAllergyLoading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {addAllergyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Allergy
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {activeAllergies.length > 0 ? (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {activeAllergies.map((allergy) => (
                      <motion.div
                        key={allergy.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3',
                          allergy.isVerified
                            ? 'border-white/10 bg-white/[0.03]'
                            : 'border-amber-500/30 bg-amber-950/10'
                        )}
                      >
                        <AllergenTag allergen={allergy.allergen} size="md" variant="danger" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <AllergyBadge severity={allergy.severity} size="sm" />
                            {!allergy.isVerified && (
                              <Badge className="bg-amber-500/20 text-amber-300 text-[9px]">
                                Unverified
                              </Badge>
                            )}
                          </div>
                          {allergy.reaction && (
                            <p className="text-[10px] text-white/40 mt-1 truncate">
                              Reaction: {allergy.reaction}
                            </p>
                          )}
                        </div>
                        {allergy.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 text-[10px] h-7"
                            onClick={() => router.push('/parent/meals/allergies')}
                          >
                            Verify
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-white/30">
                  <Heart className="h-8 w-8 mb-2" />
                  <p className="text-sm">No allergies on record</p>
                  <p className="text-xs mt-1">Your child has no known allergies</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Nutrition Summary */}
        <motion.div {...fadeInUp} transition={{ delay: 0.35 }}>
          <Card className="border-white/10 bg-[#0e0e2c]/80 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-lg">Nutrition Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {nutritionSummary ? (
                <>
                  {/* Average feedback stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{nutritionSummary.avgEaten}%</p>
                      <p className="text-[10px] text-white/40">Avg Eaten</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{nutritionSummary.avgRating}</p>
                      <p className="text-[10px] text-white/40">Avg Rating</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-purple-400">{nutritionSummary.totalFeedbacks}</p>
                      <p className="text-[10px] text-white/40">Reviews</p>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Daily nutrition bars based on meal plan averages */}
                  {data.mealPlan && (
                    <div className="space-y-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                        Daily Nutritional Targets
                      </p>
                      <NutritionBar
                        label="Calories"
                        value={data.mealPlan.avgDailyCalories ?? 0}
                        recommended={NUTRITION_RECOMMENDED.calories}
                        unit="kcal"
                        color="bg-amber-400"
                      />
                      <NutritionBar
                        label="Protein"
                        value={data.mealPlan.avgDailyProtein ?? 0}
                        recommended={NUTRITION_RECOMMENDED.protein}
                        unit="g"
                        color="bg-emerald-400"
                      />
                    </div>
                  )}

                  {/* Nutrition messages */}
                  <div className="space-y-2">
                    {data.mealPlan?.avgDailyCalories && data.mealPlan.avgDailyCalories >= NUTRITION_RECOMMENDED.calories * 0.9 && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">Your child is getting enough Calories ✓</span>
                      </div>
                    )}
                    {data.mealPlan?.avgDailyProtein && data.mealPlan.avgDailyProtein >= NUTRITION_RECOMMENDED.protein * 0.9 && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">Protein intake meets recommendations ✓</span>
                      </div>
                    )}
                    {data.mealPlan?.avgDailyProtein && data.mealPlan.avgDailyProtein < NUTRITION_RECOMMENDED.protein * 0.6 && (
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-amber-300">Protein intake is low ⚠️</span>
                      </div>
                    )}
                    {nutritionSummary.avgEaten < 50 && (
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-amber-300">Your child is eating less than half their meals ⚠️</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-white/30">
                  <Info className="h-8 w-8 mb-2" />
                  <p className="text-sm">No feedback data yet</p>
                  <p className="text-xs mt-1">Nutrition summary will appear once teachers provide meal feedback</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. FEEDBACK HISTORY — Past week's meal ratings
          ═══════════════════════════════════════════════════════ */}
      <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
        <Card className="border-white/10 bg-[#0e0e2c]/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feedback History</CardTitle>
                  <CardDescription>
                    Past week&apos;s meal ratings and eaten percentages
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.weekFeedback.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {data.weekFeedback.map((feedback, idx) => {
                    const feedbackDate = format(parseISO(feedback.date), 'EEE, MMM d');
                    const mealColor = MEAL_TYPE_COLORS[feedback.mealType as MealType] || '#8B5CF6';
                    return (
                      <motion.div
                        key={feedback.id || idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
                      >
                        {/* Date */}
                        <span className="text-xs text-white/50 w-24 shrink-0">{feedbackDate}</span>
                        {/* Meal type */}
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider w-28 shrink-0"
                          style={{ color: mealColor }}
                        >
                          {MEAL_TYPE_LABELS[feedback.mealType as MealType] || feedback.mealType}
                        </span>
                        {/* Star rating */}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3 w-3',
                                i < feedback.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-transparent text-white/20'
                              )}
                            />
                          ))}
                        </div>
                        {/* Eaten percent */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
                          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                feedback.eatenPercent >= 75
                                  ? 'bg-emerald-400'
                                  : feedback.eatenPercent >= 50
                                    ? 'bg-amber-400'
                                    : 'bg-red-400'
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${feedback.eatenPercent}%` }}
                              transition={{ duration: 0.4, delay: idx * 0.03 }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 tabular-nums w-8 text-right">
                            {feedback.eatenPercent}%
                          </span>
                        </div>
                        {/* Comment */}
                        {feedback.comments && (
                          <span className="text-[10px] text-white/30 truncate max-w-[200px] hidden md:block">
                            {feedback.comments}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <Star className="h-8 w-8 mb-2" />
                <p className="text-sm">No feedback this week</p>
                <p className="text-xs mt-1">Meal ratings from teachers will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
