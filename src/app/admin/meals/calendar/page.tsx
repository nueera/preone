'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Coffee,
  Apple,
  Soup,
  UtensilsCrossed,
  X,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NutritionBar } from '@/components/meals/NutritionBar';
import type { MealType, MealItem } from '@/components/meals/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS, DAY_LABELS } from '@/components/meals/types';

// ── Types ──
interface MealPlanItemBrief {
  id: string;
  mealItem: MealItem;
  dayOfWeek: number;
  mealType: MealType;
  isAlternative: boolean;
}

interface MealPlanBrief {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  items: MealPlanItemBrief[];
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

const MEAL_TYPE_ICONS: Record<MealType, React.ElementType> = {
  BREAKFAST: Coffee,
  MID_MORNING_SNACK: Apple,
  LUNCH: Soup,
  AFTERNOON_SNACK: UtensilsCrossed,
};

const STATUS_COLORS = {
  PUBLISHED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  DRAFT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ARCHIVED: 'bg-white/10 text-white/40 border-white/10',
};

const DAY_TO_NUMBER: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

export default function MealCalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [plans, setPlans] = useState<MealPlanBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [printMode, setPrintMode] = useState(false);

  // ── Fetch plans ──
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/meal-plans', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      toast.error('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Week days ──
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // ── Get plans for a date ──
  const getPlansForDate = useCallback(
    (date: Date) => {
      return plans.filter((plan) => {
        const start = parseISO(plan.startDate);
        const end = parseISO(plan.endDate);
        return isWithinInterval(date, { start, end });
      });
    },
    [plans]
  );

  // ── Get meals for a specific date ──
  const getMealsForDate = useCallback(
    (date: Date) => {
      const dayName = format(date, 'EEEE');
      const dayNum = DAY_TO_NUMBER[dayName];
      if (!dayNum) return [];

      const meals: { plan: MealPlanBrief; item: MealPlanItemBrief }[] = [];
      for (const plan of getPlansForDate(date)) {
        for (const item of plan.items) {
          if (item.dayOfWeek === dayNum) {
            meals.push({ plan, item });
          }
        }
      }
      return meals;
    },
    [getPlansForDate]
  );

  // ── Selected date meals ──
  const selectedDateMeals = useMemo(() => {
    if (!selectedDate) return [];
    return getMealsForDate(selectedDate);
  }, [selectedDate, getMealsForDate]);

  // ── Navigation ──
  const prevWeek = () => setCurrentWeekStart((w) => subWeeks(w, 1));
  const nextWeek = () => setCurrentWeekStart((w) => addWeeks(w, 1));
  const thisWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // ── Print handler ──
  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 300);
  };

  // ── Daily nutrition totals ──
  const getDayNutrition = (date: Date) => {
    const meals = getMealsForDate(date);
    return meals.reduce(
      (acc, m) => {
        if (!m.item.isAlternative && m.item.mealItem) {
          acc.calories += m.item.mealItem.calories || 0;
          acc.protein += m.item.mealItem.protein || 0;
        }
        return acc;
      },
      { calories: 0, protein: 0 }
    );
  };

  return (
    <div className={`min-h-screen space-y-6 p-4 md:p-6 ${printMode ? 'print:bg-white print:text-black' : ''}`}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-purple-400" />
            Meal Calendar
          </h1>
          <p className="text-sm text-white/50">Weekly meal plan overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={thisWeek}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </motion.div>

      {/* ── Week Navigation ── */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevWeek}
          className="text-white/50 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-white">
          {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 4), 'MMM d, yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextWeek}
          className="text-white/50 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Calendar Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {weekDays.map((day) => {
            const dayPlans = getPlansForDate(day);
            const dayMeals = getMealsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const nutrition = getDayNutrition(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border backdrop-blur-sm p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-purple-500/40 bg-purple-950/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => setSelectedDate(isSelected ? null : day)}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-white/40">{format(day, 'EEE')}</p>
                    <p className="text-lg font-bold text-white">{format(day, 'd')}</p>
                  </div>
                  {dayPlans.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {dayPlans.map((p) => (
                        <Badge
                          key={p.id}
                          className={`${STATUS_COLORS[p.status]} border text-[8px] px-1.5 py-0`}
                        >
                          {p.status}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meal Type Icons */}
                {dayMeals.length > 0 ? (
                  <div className="space-y-1.5">
                    {(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as MealType[]).map(
                      (mt) => {
                        const mtMeals = dayMeals.filter((m) => m.item.mealType === mt && !m.item.isAlternative);
                        if (mtMeals.length === 0) return null;
                        const Icon = MEAL_TYPE_ICONS[mt];
                        const mainMeal = mtMeals[0];

                        return (
                          <div
                            key={mt}
                            className="flex items-center gap-2 rounded-md bg-white/[0.03] p-1.5"
                          >
                            <Icon
                              className="h-3 w-3 shrink-0"
                              style={{ color: MEAL_TYPE_COLORS[mt] }}
                            />
                            <span className="text-[10px] text-white/60 truncate">
                              {mainMeal.item.mealItem?.name || '—'}
                            </span>
                          </div>
                        );
                      }
                    )}

                    {/* Nutrition Summary */}
                    {nutrition.calories > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-white/30">
                          {nutrition.calories} kcal · {Math.round(nutrition.protein)}g protein
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-white/15 text-xs">
                    No meals planned
                  </div>
                )}

                {/* Plan names */}
                {dayPlans.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {dayPlans.map((p) => (
                      <p key={p.id} className="text-[10px] text-white/30 truncate">
                        {p.name}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Selected Date Detail Panel ── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/30 hover:text-white/60"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selectedDateMeals.length > 0 ? (
                <div className="space-y-4">
                  {(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as MealType[]).map(
                    (mt) => {
                      const mtMeals = selectedDateMeals.filter(
                        (m) => m.item.mealType === mt
                      );
                      const main = mtMeals.find((m) => !m.item.isAlternative);
                      const alts = mtMeals.filter((m) => m.item.isAlternative);
                      if (!main && alts.length === 0) return null;

                      const Icon = MEAL_TYPE_ICONS[mt];

                      return (
                        <div key={mt} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: MEAL_TYPE_COLORS[mt] }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: MEAL_TYPE_COLORS[mt] }}
                            >
                              {MEAL_TYPE_LABELS[mt]}
                            </span>
                          </div>
                          {main?.item.mealItem && (
                            <div className="ml-5 rounded-lg bg-white/5 p-3">
                              <p className="text-sm font-medium text-white">
                                {main.item.mealItem.name}
                              </p>
                              {main.item.mealItem.description && (
                                <p className="text-xs text-white/40 mt-0.5">
                                  {main.item.mealItem.description}
                                </p>
                              )}
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                <NutritionBar
                                  label="Cal"
                                  value={main.item.mealItem.calories}
                                  recommended={1200}
                                  unit="kcal"
                                  color="bg-amber-400"
                                />
                                <NutritionBar
                                  label="Protein"
                                  value={main.item.mealItem.protein}
                                  recommended={16}
                                  unit="g"
                                />
                                <NutritionBar
                                  label="Calcium"
                                  value={main.item.mealItem.calcium}
                                  recommended={600}
                                  unit="mg"
                                />
                              </div>
                            </div>
                          )}
                          {alts.map((alt, idx) => (
                            <div key={idx} className="ml-5 rounded-lg border border-dashed border-white/10 p-2">
                              <p className="text-xs text-white/40 italic">
                                Alt: {alt.item.mealItem?.name || '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-white/20 text-sm text-center py-8">
                  No meals planned for this date
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Print View (hidden in screen, shown in print) ── */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold mb-4">
          Weekly Menu — {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 4), 'MMM d, yyyy')}
        </h1>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 text-left">Meal</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className="border p-2 text-center">
                  {format(day, 'EEE d')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as MealType[]).map(
              (mt) => (
                <tr key={mt}>
                  <td className="border p-2 font-medium">{MEAL_TYPE_LABELS[mt]}</td>
                  {weekDays.map((day) => {
                    const meals = getMealsForDate(day).filter(
                      (m) => m.item.mealType === mt && !m.item.isAlternative
                    );
                    return (
                      <td key={day.toISOString()} className="border p-2 text-center">
                        {meals[0]?.item.mealItem?.name || '—'}
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
